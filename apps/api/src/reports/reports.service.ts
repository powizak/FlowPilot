import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { TimesheetQueryDto } from './dto/timesheet-query.dto.js';
import type { UtilizationQueryDto } from './dto/utilization-query.dto.js';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async timesheet(query: TimesheetQueryDto) {
    const groupBy = query.groupBy ?? 'day';
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);
    dateTo.setHours(23, 59, 59, 999);

    const where = {
      startedAt: { gte: dateFrom, lte: dateTo },
      endedAt: { not: null },
      ...(query.userId ? { userId: query.userId } : {}),
    };

    const entries = await this.prisma.timeEntry.findMany({
      where,
      include: { user: { select: { id: true, name: true } }, project: { select: { id: true, name: true } }, workType: true },
      orderBy: { startedAt: 'asc' },
    });

    const grouped = new Map<string, { period: string; totalHours: number; billableHours: number; entries: typeof entries }>();

    for (const entry of entries) {
      const period = this.getPeriodKey(entry.startedAt, groupBy);
      const current = grouped.get(period) ?? { period, totalHours: 0, billableHours: 0, entries: [] };
      const hours = (entry.durationMinutes ?? 0) / 60;
      current.totalHours += hours;
      if (entry.isBillable) current.billableHours += hours;
      current.entries.push(entry);
      grouped.set(period, current);
    }

    const data = [...grouped.values()].map((g) => ({
      ...g,
      totalHours: Math.round(g.totalHours * 100) / 100,
      billableHours: Math.round(g.billableHours * 100) / 100,
    }));

    return { data };
  }

  async projectStats(projectId: string) {
    const entries = await this.prisma.timeEntry.findMany({
      where: { projectId, endedAt: { not: null } },
      include: { workType: true },
    });

    let totalHours = 0;
    let billableHours = 0;
    let totalAmount = 0;
    let invoicedAmount = 0;
    const byWorkType = new Map<string, { workTypeId: string | null; workTypeName: string; hours: number; amount: number }>();

    for (const entry of entries) {
      const hours = (entry.durationMinutes ?? 0) / 60;
      const amount = Number(entry.billingAmount ?? 0);
      totalHours += hours;
      if (entry.isBillable) billableHours += hours;
      totalAmount += amount;
      if (entry.invoiceId !== null) invoicedAmount += amount;

      const wtId = entry.workTypeId ?? 'none';
      const wtName = entry.workType?.name ?? 'No work type';
      const current = byWorkType.get(wtId) ?? { workTypeId: entry.workTypeId, workTypeName: wtName, hours: 0, amount: 0 };
      current.hours += hours;
      current.amount += amount;
      byWorkType.set(wtId, current);
    }

    return {
      data: {
        totalHours: Math.round(totalHours * 100) / 100,
        billableHours: Math.round(billableHours * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        invoicedAmount: Math.round(invoicedAmount * 100) / 100,
        uninvoicedAmount: Math.round((totalAmount - invoicedAmount) * 100) / 100,
        byWorkType: [...byWorkType.values()].map((wt) => ({
          ...wt,
          hours: Math.round(wt.hours * 100) / 100,
          amount: Math.round(wt.amount * 100) / 100,
        })),
      },
    };
  }

  async billing() {
    const entries = await this.prisma.timeEntry.findMany({
      where: { isBillable: true, invoiceId: null, endedAt: { not: null } },
      include: { project: { select: { id: true, name: true } }, user: { select: { id: true, name: true } }, workType: true },
      orderBy: { startedAt: 'asc' },
    });

    const byProject = new Map<string, { project: { id: string; name: string }; unbilledHours: number; unbilledAmount: number; entries: typeof entries }>();

    for (const entry of entries) {
      const current = byProject.get(entry.projectId) ?? {
        project: { id: entry.project.id, name: entry.project.name },
        unbilledHours: 0,
        unbilledAmount: 0,
        entries: [],
      };
      current.unbilledHours += (entry.durationMinutes ?? 0) / 60;
      current.unbilledAmount += Number(entry.billingAmount ?? 0);
      current.entries.push(entry);
      byProject.set(entry.projectId, current);
    }

    const data = [...byProject.values()].map((p) => ({
      ...p,
      unbilledHours: Math.round(p.unbilledHours * 100) / 100,
      unbilledAmount: Math.round(p.unbilledAmount * 100) / 100,
    }));

    return { data };
  }

  async utilization(query: UtilizationQueryDto) {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);
    dateTo.setHours(23, 59, 59, 999);

    const entries = await this.prisma.timeEntry.findMany({
      where: { startedAt: { gte: dateFrom, lte: dateTo }, endedAt: { not: null } },
      include: { user: { select: { id: true, name: true } } },
    });

    const byUser = new Map<string, { userId: string; userName: string; totalHours: number; billableHours: number }>();

    for (const entry of entries) {
      const hours = (entry.durationMinutes ?? 0) / 60;
      const current = byUser.get(entry.userId) ?? { userId: entry.userId, userName: entry.user.name, totalHours: 0, billableHours: 0 };
      current.totalHours += hours;
      if (entry.isBillable) current.billableHours += hours;
      byUser.set(entry.userId, current);
    }

    const data = [...byUser.values()].map((u) => ({
      ...u,
      totalHours: Math.round(u.totalHours * 100) / 100,
      billableHours: Math.round(u.billableHours * 100) / 100,
      utilizationPercent: u.totalHours === 0 ? 0 : Math.round((u.billableHours / u.totalHours) * 10000) / 100,
    }));

    return { data };
  }

  toCsv(rows: Record<string, unknown>[], filename: string): { body: string; filename: string } {
    if (rows.length === 0) return { body: '\uFEFF', filename };
    const headers = Object.keys(rows[0]);
    const lines = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => this.escapeCsvValue(row[h])).join(',')),
    ];
    return { body: '\uFEFF' + lines.join('\r\n'), filename };
  }

  private escapeCsvValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  private getPeriodKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');

    if (groupBy === 'day') return `${y}-${m}-${d}`;
    if (groupBy === 'month') return `${y}-${m}`;

    // ISO week: find Monday of the week
    const dayOfWeek = date.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() + mondayOffset);
    const my = monday.getUTCFullYear();
    const mm = String(monday.getUTCMonth() + 1).padStart(2, '0');
    const md = String(monday.getUTCDate()).padStart(2, '0');
    return `${my}-${mm}-${md}`;
  }
}
