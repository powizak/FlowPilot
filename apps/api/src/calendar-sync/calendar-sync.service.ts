import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CalendarSyncService {
  private readonly logger = new Logger(CalendarSyncService.name);
  private oauth2Client: InstanceType<typeof google.auth.OAuth2> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URI');

    if (clientId && clientSecret && redirectUri) {
      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri,
      );
    }
  }

  isConfigured(): boolean {
    return this.oauth2Client !== null;
  }

  getAuthUrl(): string {
    if (!this.oauth2Client) {
      throw new Error('Google Calendar not configured');
    }
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
    });
  }

  async exchangeCode(userId: string, code: string): Promise<void> {
    if (!this.oauth2Client) {
      throw new Error('Google Calendar not configured');
    }

    const { tokens } = await this.oauth2Client.getToken(code);

    await this.prisma.calendarSync.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresAt: new Date(tokens.expiry_date!),
      },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt: new Date(tokens.expiry_date!),
      },
    });
  }

  async getStatus(
    userId: string,
  ): Promise<{ connected: boolean; lastSyncAt: Date | null }> {
    const sync = await this.prisma.calendarSync.findUnique({
      where: { userId },
      select: { lastSyncAt: true },
    });
    return { connected: !!sync, lastSyncAt: sync?.lastSyncAt ?? null };
  }

  async disconnect(userId: string): Promise<void> {
    const sync = await this.prisma.calendarSync.findUnique({
      where: { userId },
    });
    if (!sync) return;

    if (this.oauth2Client) {
      try {
        this.oauth2Client.setCredentials({ access_token: sync.accessToken });
        await this.oauth2Client.revokeToken(sync.accessToken);
      } catch {
        this.logger.warn(`Failed to revoke token for user ${userId}`);
      }
    }

    await this.prisma.calendarSync.delete({ where: { userId } });
  }

  async syncUserTasks(userId: string): Promise<number> {
    const sync = await this.prisma.calendarSync.findUnique({
      where: { userId },
    });
    if (!sync || !this.oauth2Client) return 0;

    const client = new google.auth.OAuth2(
      this.config.get<string>('GOOGLE_CLIENT_ID'),
      this.config.get<string>('GOOGLE_CLIENT_SECRET'),
      this.config.get<string>('GOOGLE_REDIRECT_URI'),
    );
    client.setCredentials({
      access_token: sync.accessToken,
      refresh_token: sync.refreshToken,
      expiry_date: sync.expiresAt.getTime(),
    });

    client.on('tokens', async (tokens) => {
      const updateData: Record<string, unknown> = {};
      if (tokens.access_token) updateData.accessToken = tokens.access_token;
      if (tokens.refresh_token) updateData.refreshToken = tokens.refresh_token;
      if (tokens.expiry_date)
        updateData.expiresAt = new Date(tokens.expiry_date);
      if (Object.keys(updateData).length > 0) {
        await this.prisma.calendarSync.update({
          where: { userId },
          data: updateData,
        });
      }
    });

    const calendar = google.calendar({ version: 'v3', auth: client });
    const calendarId = sync.googleCalendarId ?? 'primary';

    const tasks = await this.prisma.task.findMany({
      where: { assigneeId: userId, dueDate: { not: null } },
      select: { id: true, name: true, dueDate: true, customFields: true },
    });

    let synced = 0;
    for (const task of tasks) {
      const customFields = (task.customFields as Record<string, unknown>) ?? {};
      const existingEventId = customFields.googleEventId as string | undefined;
      const start = task.dueDate!;
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const eventBody = {
        summary: task.name,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      };

      try {
        if (existingEventId) {
          await calendar.events.update({
            calendarId,
            eventId: existingEventId,
            requestBody: eventBody,
          });
        } else {
          const res = await calendar.events.insert({
            calendarId,
            requestBody: eventBody,
          });
          customFields.googleEventId = res.data.id;
          await this.prisma.task.update({
            where: { id: task.id },
            data: { customFields: customFields as object },
          });
        }
        synced++;
      } catch (error) {
        this.logger.warn(`Failed to sync task ${task.id}: ${error}`);
      }
    }

    await this.prisma.calendarSync.update({
      where: { userId },
      data: { lastSyncAt: new Date() },
    });

    return synced;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleCronSync(): Promise<void> {
    if (!this.isConfigured()) return;

    const syncs = await this.prisma.calendarSync.findMany({
      select: { userId: true },
    });
    for (const sync of syncs) {
      try {
        await this.syncUserTasks(sync.userId);
      } catch (error) {
        this.logger.error(`Cron sync failed for user ${sync.userId}: ${error}`);
      }
    }
  }
}
