import { BadRequestException, NotFoundException } from '@nestjs/common';
import { errorResponse } from '../auth/auth.errors.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { toRoundedHours } from './mcp.shared.js';

export async function createInvoiceFromEntries(
  prisma: PrismaService,
  projectId: string,
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, clientId: true },
  });
  if (project === null)
    throw new NotFoundException(
      errorResponse('PROJECT_NOT_FOUND', 'Project not found'),
    );
  if (project.clientId === null)
    throw new BadRequestException(
      errorResponse('VALIDATION_ERROR', 'Project must have a client'),
    );

  const entries = await prisma.timeEntry.findMany({
    where: {
      projectId,
      invoiceId: null,
      isBillable: true,
      endedAt: { not: null },
    },
  });
  if (entries.length === 0)
    throw new BadRequestException(
      errorResponse('VALIDATION_ERROR', 'No uninvoiced entries found'),
    );

  const total = entries.reduce(
    (sum, entry) => sum + Number(entry.billingAmount ?? 0),
    0,
  );
  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 14);
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: `MCP-${Date.now()}`,
      clientId: project.clientId,
      projectId: project.id,
      issueDate,
      dueDate,
      subtotal: total,
      total,
      lineItems: {
        create: [
          {
            description: `${project.name} uninvoiced time`,
            quantity: 1,
            unit: 'set',
            unitPrice: total,
            total,
            sortOrder: 0,
          },
        ],
      },
    },
    include: { lineItems: true, client: { select: { id: true, name: true } } },
  });
  await prisma.timeEntry.updateMany({
    where: { id: { in: entries.map((entry) => entry.id) } },
    data: { invoiceId: invoice.id },
  });
  return invoice;
}

export async function getProjectStats(
  prisma: PrismaService,
  projectId: string,
) {
  const [project, totals] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, budgetHours: true, budgetAmount: true },
    }),
    prisma.timeEntry.aggregate({
      where: { projectId },
      _sum: { durationMinutes: true, billingAmount: true },
    }),
  ]);
  if (project === null)
    throw new NotFoundException(
      errorResponse('PROJECT_NOT_FOUND', 'Project not found'),
    );
  return {
    projectId: project.id,
    projectName: project.name,
    budgetHours: project.budgetHours,
    actualHours: toRoundedHours(totals._sum.durationMinutes),
    budgetAmount:
      project.budgetAmount === null ? null : Number(project.budgetAmount),
    actualAmount:
      totals._sum.billingAmount === null
        ? 0
        : Number(totals._sum.billingAmount),
  };
}
