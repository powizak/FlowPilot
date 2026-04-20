import { Body, Controller, Get, Logger, Post, Req } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TasksService } from '../tasks/tasks.service.js';
import { AIService } from './ai.service.js';
import { ChatDto } from './dto/chat.dto.js';
import { DecomposeTaskDto } from './dto/decompose-task.dto.js';
import {
  ApplyMeetingTasksDto,
  MeetingToTasksDto,
} from './dto/meeting-to-tasks.dto.js';
import { RunSkillDto } from './dto/run-skill.dto.js';

interface Subtask {
  name: string;
  description: string;
  estimatedHours: number;
}

@Controller('api/ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private readonly aiService: AIService,
    private readonly tasksService: TasksService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('models')
  listModels() {
    return this.aiService.listModels();
  }

  @Get('usage')
  getUsage(@Req() request: { user: AuthenticatedUser }) {
    return this.aiService.getUsage(request.user.id);
  }

  @Post('run-skill')
  runSkill(
    @Body() dto: RunSkillDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.aiService.runSkill(dto.skillName, dto.input, request.user.id);
  }

  @Post('chat')
  chat(@Body() dto: ChatDto, @Req() request: { user: AuthenticatedUser }) {
    return this.aiService.chat(dto.message, dto.context, request.user.id);
  }

  @Post('meeting-to-tasks')
  async meetingToTasks(
    @Body() dto: MeetingToTasksDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    const result = await this.aiService.runSkill(
      'meeting-to-tasks',
      { text: dto.text },
      request.user.id,
    );
    const tasks = JSON.parse(result.result) as Array<{
      name: string;
      description: string;
      suggestedAssignee: string | null;
      deadline: string | null;
      priority: string;
    }>;
    return { tasks };
  }

  @Post('meeting-to-tasks/apply')
  async applyMeetingTasks(
    @Body() dto: ApplyMeetingTasksDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    const taskIds: string[] = [];
    for (const item of dto.tasks) {
      const response = await this.tasksService.create(
        dto.projectId,
        {
          title: item.name,
          description: item.description ?? null,
          priority: item.priority ?? 'none',
          dueDate: item.deadline ?? null,
        },
        request.user,
      );
      taskIds.push(response.data.id);
    }
    return { created: taskIds.length, taskIds };
  }

  @Post('decompose-task')
  async decomposeTask(
    @Body() dto: DecomposeTaskDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    const { data: task } = await this.tasksService.findOne(
      dto.taskId,
      request.user,
    );

    const result = await this.aiService.runSkill(
      'task-decomposition',
      {
        taskName: task.title,
        taskDescription: task.description ?? '',
        estimatedHours: task.estimatedHours ?? 0,
      },
      request.user.id,
    );

    const subtasks = this.parseSubtasks(result.result, task.estimatedHours);
    return { subtasks };
  }

  private parseSubtasks(
    text: string,
    parentEstimatedHours: number | null,
  ): Subtask[] {
    const parsed: Subtask[] = JSON.parse(text);

    if (!Array.isArray(parsed) || parsed.length < 3 || parsed.length > 7) {
      throw new Error(
        'AI returned invalid subtask count; expected 3-7 subtasks',
      );
    }

    const totalHours = parsed.reduce(
      (sum, item) => sum + (item.estimatedHours ?? 0),
      0,
    );
    if (
      parentEstimatedHours !== null &&
      parentEstimatedHours > 0 &&
      totalHours > 2 * parentEstimatedHours
    ) {
      this.logger.warn(
        `Subtask total hours (${totalHours}) exceeds 2× parent estimate (${parentEstimatedHours})`,
      );
    }

    return parsed.map((item) => ({
      name: item.name,
      description: item.description,
      estimatedHours: item.estimatedHours,
    }));
  }

  @Post('invoice-draft')
  async invoiceDraft(
    @Body() body: { projectId: string; dateFrom: string; dateTo: string },
    @Req() request: { user: AuthenticatedUser },
  ) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: body.projectId },
      select: { name: true, hourlyRateDefault: true },
    });

    const entries = await this.prisma.timeEntry.findMany({
      where: {
        projectId: body.projectId,
        invoiceId: null,
        isBillable: true,
        startedAt: { gte: new Date(body.dateFrom) },
        endedAt: { lte: new Date(body.dateTo) },
      },
      select: {
        description: true,
        durationMinutes: true,
        billingAmount: true,
      },
    });

    const defaultRate = project.hourlyRateDefault
      ? Number(project.hourlyRateDefault)
      : 0;

    const skillInput = {
      projectName: project.name,
      entries: entries.map((e) => ({
        description: e.description ?? 'Untitled work',
        hours: (e.durationMinutes ?? 0) / 60,
        rate:
          e.billingAmount !== null
            ? Number(e.billingAmount) / ((e.durationMinutes ?? 1) / 60)
            : defaultRate,
      })),
    };

    const result = await this.aiService.runSkill(
      'invoice-draft',
      skillInput,
      request.user.id,
    );

    const draft = JSON.parse(result.result);
    return { draft };
  }

  @Post('weekly-review')
  async weeklyReview(
    @Body() body: { dateFrom?: string; dateTo?: string },
    @Req() request: { user: AuthenticatedUser },
  ) {
    const now = new Date();
    const dateTo = body.dateTo ?? now.toISOString().split('T')[0]!;
    const dateFrom =
      body.dateFrom ??
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]!;

    const userId = request.user.id;

    const timeEntries = await this.prisma.timeEntry.findMany({
      where: {
        userId,
        startedAt: { gte: new Date(dateFrom) },
        endedAt: { lte: new Date(dateTo + 'T23:59:59.999Z') },
      },
      select: {
        durationMinutes: true,
        project: { select: { name: true } },
      },
    });

    const hoursByProject = new Map<string, number>();
    let totalHours = 0;
    for (const entry of timeEntries) {
      const hours = (entry.durationMinutes ?? 0) / 60;
      totalHours += hours;
      const projectName = entry.project.name;
      hoursByProject.set(
        projectName,
        (hoursByProject.get(projectName) ?? 0) + hours,
      );
    }

    const projects = [...hoursByProject.entries()].map(
      ([name, hours]) => `${name} (${hours.toFixed(1)}h)`,
    );

    const completedTasks = await this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: 'DONE',
        doneAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo + 'T23:59:59.999Z'),
        },
      },
      select: { name: true },
    });

    const inProgressTasks = await this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: 'IN_PROGRESS',
      },
      select: { name: true },
    });

    const skillInput = {
      dateFrom,
      dateTo,
      projects,
      completedTasks: completedTasks.map((t) => t.name),
      inProgressTasks: inProgressTasks.map((t) => t.name),
      totalHours: Math.round(totalHours * 10) / 10,
    };

    const result = await this.aiService.runSkill(
      'weekly-review',
      skillInput,
      request.user.id,
    );

    return { summary: result.result };
  }
}
