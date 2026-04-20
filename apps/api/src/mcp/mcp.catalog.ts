export const MCP_RESOURCES = [
  {
    uri: 'flowpilot://projects',
    name: 'flowpilot://projects',
    description: 'Projects visible to the API key owner',
    mimeType: 'application/json',
  },
  {
    uri: 'flowpilot://projects/{id}',
    name: 'flowpilot://projects/:id',
    description: 'Project detail with counts and stats',
    mimeType: 'application/json',
  },
  {
    uri: 'flowpilot://tasks?project={id}',
    name: 'flowpilot://tasks?project=:id',
    description: 'Tasks for a project',
    mimeType: 'application/json',
  },
  {
    uri: 'flowpilot://tasks/{id}',
    name: 'flowpilot://tasks/:id',
    description: 'Task detail',
    mimeType: 'application/json',
  },
  {
    uri: 'flowpilot://clients',
    name: 'flowpilot://clients',
    description: 'Clients list',
    mimeType: 'application/json',
  },
  {
    uri: 'flowpilot://invoices?status=open',
    name: 'flowpilot://invoices?status=open',
    description: 'Open invoices',
    mimeType: 'application/json',
  },
  {
    uri: 'flowpilot://time-entries?date=today',
    name: 'flowpilot://time-entries?date=today',
    description: 'Today time entries for the current user',
    mimeType: 'application/json',
  },
  {
    uri: 'flowpilot://my/assigned-tasks',
    name: 'flowpilot://my/assigned-tasks',
    description: 'Assigned tasks for the current user',
    mimeType: 'application/json',
  },
];

export const MCP_TOOLS = [
  {
    name: 'flowpilot.create_task',
    description: 'Create a task',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        assigneeId: { type: 'string' },
        dueDate: { type: 'string' },
      },
      required: ['projectId', 'name'],
    },
  },
  {
    name: 'flowpilot.update_task',
    description: 'Update a task',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string' },
        assigneeId: { type: ['string', 'null'] },
        dueDate: { type: ['string', 'null'] },
      },
      required: ['id'],
    },
  },
  {
    name: 'flowpilot.create_time_entry',
    description: 'Create a time entry',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        taskId: { type: 'string' },
        description: { type: 'string' },
        startedAt: { type: 'string' },
        endedAt: { type: 'string' },
        durationMinutes: { type: 'number' },
        workTypeId: { type: 'string' },
      },
      required: ['projectId', 'description', 'startedAt', 'endedAt'],
    },
  },
  {
    name: 'flowpilot.get_uninvoiced_entries',
    description: 'Get uninvoiced entries',
    inputSchema: {
      type: 'object',
      properties: { projectId: { type: 'string' } },
      required: ['projectId'],
    },
  },
  {
    name: 'flowpilot.create_invoice_from_entries',
    description: 'Create invoice from uninvoiced entries',
    inputSchema: {
      type: 'object',
      properties: { projectId: { type: 'string' } },
      required: ['projectId'],
    },
  },
  {
    name: 'flowpilot.get_project_stats',
    description: 'Get project stats',
    inputSchema: {
      type: 'object',
      properties: { projectId: { type: 'string' } },
      required: ['projectId'],
    },
  },
  {
    name: 'flowpilot.list_projects',
    description: 'List projects with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
    },
  },
];

export const MCP_PROMPTS = [
  {
    name: 'flowpilot://prompt/daily-review',
    description: 'Summarize today progress and priorities',
  },
  {
    name: 'flowpilot://prompt/invoice-prep',
    description: 'Review uninvoiced time before billing',
  },
];
