import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@flowpilot.local')
    .trim()
    .toLowerCase();
  const adminPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || 'ChangeMe123!',
    12,
  );
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✓ Created admin user: ${admin.email}`);

  const workTypes = [
    { name: 'Vývoj', hourlyRate: 1200, color: '#6366f1' },
    { name: 'Design', hourlyRate: 1000, color: '#f59e0b' },
    { name: 'Konzultace', hourlyRate: 1500, color: '#10b981' },
  ];

  if ((await prisma.workType.count()) === 0) {
    await prisma.workType.createMany({
      data: workTypes.map((wt) => ({
        name: wt.name,
        hourlyRate: wt.hourlyRate,
        color: wt.color,
        isActive: true,
      })),
    });
    console.log(`✓ Created ${workTypes.length} default work types`);
  } else {
    console.log('✓ Work types already exist, skipping');
  }

  const settings = [
    { key: 'app.name', value: 'FlowPilot', type: 'STRING' as const },
    { key: 'app.locale', value: 'cs', type: 'STRING' as const },
    { key: 'app.timezone', value: 'Europe/Prague', type: 'STRING' as const },
    { key: 'app.currency', value: 'CZK', type: 'STRING' as const },
    { key: 'company.name', value: 'FlowPilot s.r.o.', type: 'STRING' as const },
    { key: 'company.ic', value: '12345678', type: 'STRING' as const },
    { key: 'company.dic', value: 'CZ12345678', type: 'STRING' as const },
    {
      key: 'company.address',
      value: 'Ukázková 123\n110 00 Praha 1\nČeská republika',
      type: 'STRING' as const,
    },
    {
      key: 'company.email',
      value: 'fakturace@flowpilot.local',
      type: 'STRING' as const,
    },
    {
      key: 'invoice.numberFormat',
      value: 'FP-{YYYY}-{NNN}',
      type: 'STRING' as const,
    },
    {
      key: 'invoice.defaultPaymentTermsDays',
      value: '14',
      type: 'NUMBER' as const,
    },
    {
      key: 'invoice.defaultNote',
      value: '',
      type: 'STRING' as const,
    },
    { key: 'timeTracking.autoStopHours', value: '8', type: 'NUMBER' as const },
    {
      key: 'timeTracking.roundingMinutes',
      value: '15',
      type: 'NUMBER' as const,
    },
    {
      key: 'timeTracking.defaultWorkTypeId',
      value: '',
      type: 'STRING' as const,
    },
    {
      key: 'project.defaults.hourlyRate',
      value: '0',
      type: 'NUMBER' as const,
    },
    {
      key: 'project.defaults.currency',
      value: 'CZK',
      type: 'STRING' as const,
    },
    {
      key: 'project.defaults.defaultVatRate',
      value: '21',
      type: 'NUMBER' as const,
    },
    {
      key: 'project.defaults.billableByDefault',
      value: 'true',
      type: 'BOOLEAN' as const,
    },
    {
      key: 'project.defaults.defaultWorkTypeId',
      value: '',
      type: 'STRING' as const,
    },
    {
      key: 'ai.preferredProvider',
      value: 'openai',
      type: 'STRING' as const,
    },
    {
      key: 'ai.monthlyBudgetTokens',
      value: '100000',
      type: 'NUMBER' as const,
    },
    {
      key: 'ai.openai.enabled',
      value: 'true',
      type: 'BOOLEAN' as const,
    },
    {
      key: 'ai.openai.apiKey',
      value: '',
      type: 'STRING' as const,
    },
    {
      key: 'ai.openai.model',
      value: 'gpt-4o-mini',
      type: 'STRING' as const,
    },
    {
      key: 'ai.gemini.enabled',
      value: 'false',
      type: 'BOOLEAN' as const,
    },
    {
      key: 'ai.gemini.apiKey',
      value: '',
      type: 'STRING' as const,
    },
    {
      key: 'ai.gemini.model',
      value: 'gemini-1.5-flash',
      type: 'STRING' as const,
    },
    {
      key: 'ai.openrouter.enabled',
      value: 'false',
      type: 'BOOLEAN' as const,
    },
    {
      key: 'ai.openrouter.apiKey',
      value: '',
      type: 'STRING' as const,
    },
    {
      key: 'ai.openrouter.model',
      value: 'mistralai/mixtral-8x7b-instruct',
      type: 'STRING' as const,
    },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: {
        key: s.key,
        value: s.value,
        type: s.type,
      },
    });
    console.log(`✓ Created setting: ${s.key} = ${s.value}`);
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
