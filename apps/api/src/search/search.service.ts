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

    const tsQuery = Prisma.sql`plainto_tsquery('simple', ${query})`;

    const [projects, tasks, clients, invoices] = await Promise.all([
      this.prisma.$queryRaw<ProjectSearchResult[]>(Prisma.sql`
        SELECT
          p.id,
          p.name,
          p.description
        FROM projects p
        WHERE p.deleted_at IS NULL
          AND to_tsvector('simple', coalesce(p.name, '') || ' ' || coalesce(p.description, '')) @@ ${tsQuery}
        ORDER BY ts_rank(
          to_tsvector('simple', coalesce(p.name, '') || ' ' || coalesce(p.description, '')),
          ${tsQuery}
        ) DESC, p.updated_at DESC
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
          AND to_tsvector('simple', coalesce(t.name, '') || ' ' || coalesce(t.description, '')) @@ ${tsQuery}
        ORDER BY ts_rank(
          to_tsvector('simple', coalesce(t.name, '') || ' ' || coalesce(t.description, '')),
          ${tsQuery}
        ) DESC, t.updated_at DESC
        LIMIT 5
      `),
      this.prisma.$queryRaw<ClientSearchResult[]>(Prisma.sql`
        SELECT
          c.id,
          c.name
        FROM clients c
        WHERE c.deleted_at IS NULL
          AND to_tsvector('simple', coalesce(c.name, '')) @@ ${tsQuery}
        ORDER BY ts_rank(to_tsvector('simple', coalesce(c.name, '')), ${tsQuery}) DESC, c.updated_at DESC
        LIMIT 5
      `),
      this.prisma.$queryRaw<InvoiceSearchRow[]>(Prisma.sql`
        SELECT
          i.id,
          i.invoice_number AS "invoiceNumber",
          i.status::text AS status
        FROM invoices i
        WHERE to_tsvector('simple', coalesce(i.invoice_number, '') || ' ' || coalesce(i.note, '')) @@ ${tsQuery}
        ORDER BY ts_rank(
          to_tsvector('simple', coalesce(i.invoice_number, '') || ' ' || coalesce(i.note, '')),
          ${tsQuery}
        ) DESC, i.created_at DESC
        LIMIT 5
      `),
    ]);

    return { projects, tasks, clients, invoices };
  }

  private emptyResult(): SearchResponse {
    return { projects: [], tasks: [], clients: [], invoices: [] };
  }
}
