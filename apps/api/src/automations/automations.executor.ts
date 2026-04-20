import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

interface AutomationEvent {
  type: string;
  taskId: string;
  projectId: string;
  payload: Record<string, unknown>;
}

interface RuleTrigger {
  event: string;
  conditions?: Record<string, unknown>;
}

interface RuleAction {
  type: string;
  params: Record<string, unknown>;
}

@Injectable()
export class AutomationsExecutor {
  private readonly logger = new Logger(AutomationsExecutor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(event: AutomationEvent, userId: string): Promise<void> {
    const rules = await this.prisma.automationRule.findMany({
      where: { projectId: event.projectId, isActive: true },
    });

    for (const rule of rules) {
      const trigger = rule.trigger as unknown as RuleTrigger;
      if (!this.matchesTrigger(trigger, event)) continue;

      const actions = rule.actions as unknown as RuleAction[];
      for (const action of actions) {
        await this.runAction(action, event, userId).catch((err) =>
          this.logger.error(
            `Automation "${rule.name}" action failed: ${err.message}`,
          ),
        );
      }
    }
  }

  private matchesTrigger(
    trigger: RuleTrigger,
    event: AutomationEvent,
  ): boolean {
    if (trigger.event !== event.type) return false;
    if (!trigger.conditions) return true;
    return Object.entries(trigger.conditions).every(
      ([key, value]) => event.payload[key] === value,
    );
  }

  private async runAction(
    action: RuleAction,
    event: AutomationEvent,
    userId: string,
  ): Promise<void> {
    switch (action.type) {
      case 'assign_task':
        await this.prisma.task.update({
          where: { id: event.taskId },
          data: { assigneeId: action.params.userId as string },
        });
        break;

      case 'change_status': {
        const statusMap: Record<string, string> = {
          backlog: 'TODO',
          todo: 'TODO',
          in_progress: 'IN_PROGRESS',
          done: 'DONE',
          cancelled: 'CANCELLED',
        };
        const prismaStatus =
          statusMap[action.params.status as string] ??
          (action.params.status as string);
        await this.prisma.task.update({
          where: { id: event.taskId },
          data: { status: prismaStatus as never },
        });
        break;
      }

      case 'add_comment':
        await this.prisma.comment.create({
          data: {
            taskId: event.taskId,
            authorId: userId,
            body: (action.params.body as string) ?? 'Automated action',
          },
        });
        break;

      case 'send_notification': {
        const targetUserId = action.params.userId as string | undefined;
        if (targetUserId) {
          await this.notifications.createNotification(
            targetUserId,
            'automation',
            (action.params.title as string) ?? 'Automation triggered',
            (action.params.body as string) ??
              'An automation rule was triggered',
            'task',
            event.taskId,
          );
        }
        break;
      }

      default:
        this.logger.warn(`Unknown action type: ${action.type}`);
    }
  }
}
