import * as path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { RedisModule } from './redis/redis.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { TimeEntriesModule } from './time-entries/time-entries.module.js';
import { WorkTypesModule } from './work-types/work-types.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { UsersModule } from './users/users.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module.js';
import { ProductsModule } from './products/products.module.js';
import { InvoicesModule } from './invoices/invoices.module.js';
import { EmailModule } from './email/email.module.js';
import { CalendarModule } from './calendar/calendar.module.js';
import { SearchModule } from './search/search.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ViewsModule } from './views/views.module.js';
import { AIModule } from './ai/ai.module.js';
import { McpModule } from './mcp/mcp.module.js';
import { CommentsModule } from './comments/comments.module.js';
import { ActivityModule } from './activity/activity.module.js';
import { AttachmentsModule } from './attachments/attachments.module.js';
import { AutomationsModule } from './automations/automations.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    I18nModule.forRoot({
      fallbackLanguage: 'cs',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    SettingsModule,
    ProjectsModule,
    TasksModule,
    TimeEntriesModule,
    WorkTypesModule,
    UsersModule,
    ReportsModule,
    ClientsModule,
    BankAccountsModule,
    ProductsModule,
    InvoicesModule,
    EmailModule,
    CalendarModule,
    SearchModule,
    NotificationsModule,
    ViewsModule,
    AIModule,
    McpModule,
    CommentsModule,
    AttachmentsModule,
    ActivityModule,
    AutomationsModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
