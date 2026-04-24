import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingType, Prisma, ProjectStatus } from '@prisma/client';
import { ProjectsService } from './projects.service.js';
import { ProjectsAccessService } from './projects-access.service.js';
import { ProjectsCloneService } from './projects-clone.service.js';
import { ProjectsMembersService } from './projects-members.service.js';
import { ProjectsStatsService } from './projects-stats.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';
import type { CreateProjectDto } from './dto/create-project.dto.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prismaService: PrismaService;
  let settingsService: SettingsService;

  const mockUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test User',
    role: 'admin',
  };

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    clientId: null,
    currency: 'CZK',
    defaultVatPercent: null,
    status: ProjectStatus.ACTIVE,
    billingType: BillingType.HOURLY,
    budgetHours: null,
    budgetAmount: null,
    hourlyRateDefault: null,
    startsAt: null,
    endsAt: null,
    tags: [] as string[],
    description: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [] as unknown[],
    tasks: [] as unknown[],
    timeEntries: [] as unknown[],
    invoices: [] as unknown[],
    automationRules: [] as unknown[],
    client: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const mockPrisma = {
      project: {
        create: vi.fn().mockResolvedValue(mockProject),
        update: vi.fn().mockResolvedValue(mockProject),
        findUnique: vi.fn().mockResolvedValue(mockProject),
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([mockProject]),
      },
      projectMember: {
        findUnique: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
        delete: vi.fn(),
        upsert: vi.fn(),
      },
      user: { findUnique: vi.fn() },
    };

    const mockAccess = {
      assertCanCreate: vi.fn(),
      getProjectWithAccess: vi.fn().mockResolvedValue(mockProject),
      isAdmin: vi.fn().mockReturnValue(true),
    };

    const mockStats = { buildProjectStats: vi.fn().mockResolvedValue({}) };
    const mockClone = { cloneProject: vi.fn().mockResolvedValue(mockProject) };
    const mockMembers = { addMember: vi.fn(), removeMember: vi.fn() };
    const mockSettings = { get: vi.fn() };

    service = new ProjectsService(
      mockPrisma as unknown as PrismaService,
      mockAccess as unknown as ProjectsAccessService,
      mockStats as unknown as ProjectsStatsService,
      mockClone as unknown as ProjectsCloneService,
      mockSettings as unknown as SettingsService,
      mockMembers as unknown as ProjectsMembersService,
    );

    prismaService = mockPrisma as unknown as PrismaService;
    settingsService = mockSettings as unknown as SettingsService;
  });

  describe('create with project.defaults.hourlyRate', () => {
    it('omitted hourlyRateDefault inherits default from settings', async () => {
      vi.mocked(settingsService.get).mockResolvedValue('150.50');

      const dto: CreateProjectDto = { name: 'New Project' };
      const projectWithDefaults = {
        ...mockProject,
        hourlyRateDefault: new Prisma.Decimal('150.5'),
      };
      vi.mocked(prismaService.project.create).mockResolvedValue(
        projectWithDefaults,
      );

      await service.create(dto, mockUser);

      const createCall = vi.mocked(prismaService.project.create).mock.calls[0];
      const data = createCall[0].data as Record<string, unknown>;
      expect(data.hourlyRateDefault).toBe(150.5);
    });

    it('explicit null keeps null even when settings have value', async () => {
      vi.mocked(settingsService.get).mockResolvedValue('150.50');

      const dto: CreateProjectDto = {
        name: 'New Project',
        hourlyRateDefault: null,
      };
      const projectWithNull = { ...mockProject, hourlyRateDefault: null };
      vi.mocked(prismaService.project.create).mockResolvedValue(
        projectWithNull,
      );

      await service.create(dto, mockUser);

      const createCall = vi.mocked(prismaService.project.create).mock.calls[0];
      const data = createCall[0].data as Record<string, unknown>;
      expect(data.hourlyRateDefault).toBe(null);
    });

    it('explicit value overrides settings default', async () => {
      vi.mocked(settingsService.get).mockResolvedValue('150.50');

      const dto: CreateProjectDto = {
        name: 'New Project',
        hourlyRateDefault: 200,
      };
      const projectWithOverride = {
        ...mockProject,
        hourlyRateDefault: new Prisma.Decimal(200),
      };
      vi.mocked(prismaService.project.create).mockResolvedValue(
        projectWithOverride,
      );

      await service.create(dto, mockUser);

      const createCall = vi.mocked(prismaService.project.create).mock.calls[0];
      const data = createCall[0].data as Record<string, unknown>;
      expect(data.hourlyRateDefault).toBe(200);
    });
  });
});
