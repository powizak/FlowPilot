import { Body, Controller, Get, Logger, Post, Req } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
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
}
