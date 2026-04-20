import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminPassword = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@flowpilot.local' },
    update: {},
    create: {
      email: 'admin@flowpilot.local',
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

  for (const wt of workTypes) {
    const created = await prisma.workType.upsert({
      where: { id: wt.name },
      update: {},
      create: {
        name: wt.name,
        hourlyRate: wt.hourlyRate,
        color: wt.color,
        isActive: true,
      },
    });
    console.log(`✓ Created work type: ${created.name} (${created.hourlyRate} CZK/h)`);
  }

  const settings = [
    { key: 'app.name', value: 'FlowPilot', type: 'STRING' as const },
    { key: 'app.locale', value: 'cs', type: 'STRING' as const },
    { key: 'app.timezone', value: 'Europe/Prague', type: 'STRING' as const },
    { key: 'app.currency', value: 'CZK', type: 'STRING' as const },
    { key: 'company.name', value: 'FlowPilot s.r.o.', type: 'STRING' as const },
    { key: 'company.ic', value: '12345678', type: 'STRING' as const },
    { key: 'company.dic', value: 'CZ12345678', type: 'STRING' as const },
    { key: 'company.address', value: 'Ukázková 123\n110 00 Praha 1\nČeská republika', type: 'STRING' as const },
    { key: 'company.email', value: 'fakturace@flowpilot.local', type: 'STRING' as const },
    { key: 'invoice.numberFormat', value: 'FP-{YYYY}-{NNN}', type: 'STRING' as const },
    { key: 'invoice.defaultPaymentTermsDays', value: '14', type: 'NUMBER' as const },
    { key: 'timeTracking.autoStopHours', value: '8', type: 'NUMBER' as const },
    { key: 'timeTracking.roundingMinutes', value: '15', type: 'NUMBER' as const },
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
