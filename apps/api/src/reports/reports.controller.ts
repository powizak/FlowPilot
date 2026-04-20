import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { TimesheetQueryDto } from './dto/timesheet-query.dto.js';
import { UtilizationQueryDto } from './dto/utilization-query.dto.js';
import { ReportsService } from './reports.service.js';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('timesheet')
  async timesheet(@Query() query: TimesheetQueryDto, @Res() res: any) {
    const result = await this.reportsService.timesheet(query);
    if (query.format === 'csv') {
      const rows = result.data.map((g) => ({ period: g.period, totalHours: g.totalHours, billableHours: g.billableHours, entries: g.entries.length }));
      return this.sendCsv(res, this.reportsService.toCsv(rows, 'timesheet.csv'));
    }
    return res.json(result);
  }

  @Get('billing')
  async billing(@Query('format') format: string | undefined, @Res() res: any) {
    const result = await this.reportsService.billing();
    if (format === 'csv') {
      const rows = result.data.map((p) => ({ projectId: p.project.id, projectName: p.project.name, unbilledHours: p.unbilledHours, unbilledAmount: p.unbilledAmount }));
      return this.sendCsv(res, this.reportsService.toCsv(rows, 'billing.csv'));
    }
    return res.json(result);
  }

  @Get('utilization')
  async utilization(@Query() query: UtilizationQueryDto, @Res() res: any) {
    const result = await this.reportsService.utilization(query);
    if (query.format === 'csv') {
      const rows = result.data.map((u) => ({ userId: u.userId, userName: u.userName, totalHours: u.totalHours, billableHours: u.billableHours, utilizationPercent: u.utilizationPercent }));
      return this.sendCsv(res, this.reportsService.toCsv(rows, 'utilization.csv'));
    }
    return res.json(result);
  }

  @Get('project/:id')
  async projectStats(@Param('id') id: string, @Query('format') format: string | undefined, @Res() res: any) {
    const result = await this.reportsService.projectStats(id);
    if (format === 'csv') {
      const rows = result.data.byWorkType.map((wt) => ({ workTypeId: wt.workTypeId, workTypeName: wt.workTypeName, hours: wt.hours, amount: wt.amount }));
      return this.sendCsv(res, this.reportsService.toCsv(rows, 'project-stats.csv'));
    }
    return res.json(result);
  }

  private sendCsv(res: any, csv: { body: string; filename: string }) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${csv.filename}"`);
    return res.send(csv.body);
  }
}
