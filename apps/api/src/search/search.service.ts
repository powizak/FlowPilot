import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type ProjectSearchResult = {
  id: string;
  name: string;
  description: string | null;
};

type TaskSearchRow = {
  id: string;
  name: string;
  projectId: string;
  projectName: string | null;
};

type ClientSearchResult = {
  id: string;
  name: string;
};

type InvoiceSearchRow = {
  id: string;
  invoiceNumber: string;
  status: string;
};

type SearchResponse = {
  projects: ProjectSearchResult[];
  tasks: TaskSearchRow[];
  clients: ClientSearchResult[];
  invoices: InvoiceSearchRow[];
};

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(rawQuery?: string): Promise<SearchResponse> {
    const query = rawQuery?.trim() ?? '';
    if (query.length < 2) {
      return this.emptyResult();
    }

    const pattern = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

    const [projects, tasks, clients, invoices] = await Promise.all([
      this.prisma.$queryRaw<ProjectSearchResult[]>(Prisma.sql`
        SELECT
          p.id,
          p.name,
          p.description
        FROM projects p
        WHERE p.deleted_at IS NULL
          AND (p.name ILIKE ${pattern} OR coalesce(p.description, '') ILIKE ${pattern})
        ORDER BY
          (p.name ILIKE ${pattern}) DESC,
          p.updated_at DESC
        LIMIT 5
      `),
      this.prisma.$queryRaw<TaskSearchRow[]>(Prisma.sql`
        SELECT
          t.id,
          t.name,
          t.project_id AS "projectId",
          p.name AS "projectName"
        FROM tasks t
        LEFT JOIN projects p ON p.id = t.project_id
        WHERE (t."customFields" ->> 'deletedAt') IS NULL
          AND (t.name ILIKE ${pattern} OR coalesce(t.description, '') ILIKE ${pattern})
        ORDER BY
          (t.name ILIKE ${pattern}) DESC,
          t.updated_at DESC
        LIMIT 5
      `),
      this.prisma.$queryRaw<ClientSearchResult[]>(Prisma.sql`
        SELECT
          c.id,
          c.name
        FROM clients c
        WHERE c."deletedAt" IS NULL
          AND c.name ILIKE ${pattern}
        ORDER BY c."updatedAt" DESC
        LIMIT 5
      `),
      this.prisma.$queryRaw<InvoiceSearchRow[]>(Prisma.sql`
        SELECT
          i.id,
          i."invoiceNumber" AS "invoiceNumber",
          i.status::text AS status
        FROM invoices i
        WHERE i."invoiceNumber" ILIKE ${pattern}
          OR coalesce(i.note, '') ILIKE ${pattern}
        ORDER BY i."createdAt" DESC
        LIMIT 5
      `),
    ]);

    return { projects, tasks, clients, invoices };
  }

  private emptyResult(): SearchResponse {
    return { projects: [], tasks: [], clients: [], invoices: [] };
  }
}
