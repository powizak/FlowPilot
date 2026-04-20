import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator.js';
import { ApiKeyAuthGuard } from './api-key-auth.guard.js';
import { MCP_PROMPTS, MCP_RESOURCES, MCP_TOOLS } from './mcp.catalog.js';
import { McpService } from './mcp.service.js';
import type { McpAuthenticatedUser } from './mcp.types.js';

type RpcBody = {
  id?: number | string | null;
  jsonrpc?: string;
  method: string;
  params?: Record<string, unknown>;
};

@Public()
@UseGuards(ApiKeyAuthGuard)
@Controller('api/mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Post('rpc')
  async handleRpc(
    @Body() body: RpcBody,
    @Req() req: { user: McpAuthenticatedUser },
  ) {
    const result = await this.dispatch(body, req.user.id);
    return { jsonrpc: '2.0', id: body.id ?? null, result };
  }

  private async dispatch(body: RpcBody, userId: string) {
    switch (body.method) {
      case 'initialize':
        return {
          protocolVersion: '2024-11-05',
          capabilities: { resources: {}, tools: {}, prompts: {} },
          serverInfo: { name: 'flowpilot', version: '1.0.0' },
        };
      case 'notifications/initialized':
        return {};
      case 'resources/list':
        return { resources: MCP_RESOURCES };
      case 'resources/read':
        return this.handleResourceRead(body.params, userId);
      case 'tools/list':
        return { tools: MCP_TOOLS };
      case 'tools/call':
        return this.handleToolCall(body.params, userId);
      case 'prompts/list':
        return { prompts: MCP_PROMPTS };
      case 'prompts/get':
        return this.handlePromptGet(body.params, userId);
      default:
        throw new BadRequestException(`Unknown method: ${body.method}`);
    }
  }

  private async handleResourceRead(
    params: Record<string, unknown> | undefined,
    userId: string,
  ) {
    const uri = this.requireString(params?.uri, 'uri is required');
    const parsed = new URL(uri);
    const data = await this.readResource(parsed, userId);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async readResource(uri: URL, userId: string) {
    if (
      uri.host === 'projects' &&
      (uri.pathname === '' || uri.pathname === '/')
    )
      return this.mcpService.getProjects(userId);
    if (uri.host === 'projects')
      return {
        project: await this.mcpService.getProjectById(
          this.pathValue(uri),
          userId,
        ),
        stats: await this.mcpService.getProjectStats(
          this.pathValue(uri),
          userId,
        ),
      };
    if (uri.host === 'tasks' && uri.searchParams.has('project'))
      return this.mcpService.getTasksByProject(
        this.requireString(
          uri.searchParams.get('project'),
          'project is required',
        ),
        userId,
      );
    if (uri.host === 'tasks')
      return this.mcpService.getTaskById(this.pathValue(uri), userId);
    if (uri.host === 'clients') return this.mcpService.getClients();
    if (uri.host === 'invoices' && uri.searchParams.get('status') === 'open')
      return this.mcpService.getOpenInvoices(userId);
    if (uri.host === 'time-entries' && uri.searchParams.get('date') === 'today')
      return this.mcpService.getTodayTimeEntries(userId);
    if (uri.host === 'my' && uri.pathname === '/assigned-tasks')
      return this.mcpService.getMyAssignedTasks(userId);
    throw new BadRequestException(
      `Unsupported resource URI: ${uri.toString()}`,
    );
  }

  private async handleToolCall(
    params: Record<string, unknown> | undefined,
    userId: string,
  ) {
    const name = this.requireString(params?.name, 'name is required');
    const args = this.record(params?.arguments);
    const result = await this.callTool(name, args, userId);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: { result },
    };
  }

  private async callTool(
    name: string,
    args: Record<string, unknown>,
    userId: string,
  ) {
    switch (name) {
      case 'flowpilot.create_task':
        return this.mcpService.createTask(
          {
            projectId: this.requireString(
              args.projectId,
              'projectId is required',
            ),
            name: this.requireString(args.name, 'name is required'),
            description: this.optionalString(args.description),
            assigneeId: this.optionalString(args.assigneeId),
            dueDate: this.optionalString(args.dueDate),
          },
          userId,
        );
      case 'flowpilot.update_task':
        return this.mcpService.updateTask(
          this.requireString(args.id, 'id is required'),
          {
            name: this.optionalString(args.name),
            description: this.optionalString(args.description),
            status: this.optionalString(args.status),
            assigneeId: this.optionalNullableString(args.assigneeId),
            dueDate: this.optionalNullableString(args.dueDate),
          },
          userId,
        );
      case 'flowpilot.create_time_entry':
        return this.mcpService.createTimeEntry(
          {
            projectId: this.requireString(
              args.projectId,
              'projectId is required',
            ),
            taskId: this.optionalString(args.taskId),
            description: this.requireString(
              args.description,
              'description is required',
            ),
            startedAt: this.requireString(
              args.startedAt,
              'startedAt is required',
            ),
            endedAt: this.requireString(args.endedAt, 'endedAt is required'),
            durationMinutes:
              typeof args.durationMinutes === 'number'
                ? args.durationMinutes
                : undefined,
            workTypeId: this.optionalString(args.workTypeId),
          },
          userId,
        );
      case 'flowpilot.get_uninvoiced_entries':
        return this.mcpService.getUninvoicedEntries(
          this.requireString(args.projectId, 'projectId is required'),
          userId,
        );
      case 'flowpilot.create_invoice_from_entries':
        return this.mcpService.createInvoiceFromEntries(
          this.requireString(args.projectId, 'projectId is required'),
          userId,
        );
      case 'flowpilot.get_project_stats':
        return this.mcpService.getProjectStats(
          this.requireString(args.projectId, 'projectId is required'),
          userId,
        );
      case 'flowpilot.list_projects':
        return this.mcpService.getProjects(userId, {
          status: this.optionalString(args.status),
          tags: Array.isArray(args.tags)
            ? args.tags.filter((tag): tag is string => typeof tag === 'string')
            : undefined,
        });
      default:
        throw new BadRequestException(`Unknown tool: ${name}`);
    }
  }

  private async handlePromptGet(
    params: Record<string, unknown> | undefined,
    userId: string,
  ) {
    const name = this.requireString(params?.name, 'name is required');
    if (name === 'flowpilot://prompt/daily-review') {
      const [entries, tasks] = await Promise.all([
        this.mcpService.getTodayTimeEntries(userId),
        this.mcpService.getMyAssignedTasks(userId),
      ]);
      return {
        description: 'Daily review prompt',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Review today's work:\n\nTime entries:\n${JSON.stringify(entries, null, 2)}\n\nAssigned tasks:\n${JSON.stringify(tasks, null, 2)}\n\nSummarize progress, blockers, and next priorities.`,
            },
          },
        ],
      };
    }
    if (name === 'flowpilot://prompt/invoice-prep') {
      const projects = await this.mcpService.getProjects(userId);
      const projectIds = projects.map((project) => project.id);
      const entries = await Promise.all(
        projectIds.map((projectId) =>
          this.mcpService.getUninvoicedEntries(projectId, userId),
        ),
      );
      return {
        description: 'Invoice preparation prompt',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Review uninvoiced time before billing:\n\n${JSON.stringify(entries.flat(), null, 2)}\n\nIdentify billable groups, missing metadata, and invoice recommendations.`,
            },
          },
        ],
      };
    }
    throw new BadRequestException(`Unknown prompt: ${name}`);
  }

  private pathValue(uri: URL) {
    return uri.pathname.replace(/^\//, '');
  }

  private record(value: unknown) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private requireString(value: unknown, message: string) {
    if (typeof value !== 'string' || value.trim().length === 0)
      throw new BadRequestException(message);
    return value;
  }

  private optionalString(value: unknown) {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private optionalNullableString(value: unknown) {
    if (value === null) return null;
    return this.optionalString(value);
  }
}
