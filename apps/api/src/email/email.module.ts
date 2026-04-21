import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SettingsModule } from '../settings/settings.module.js';
import { EmailService } from './email.service.js';
import { EmailProcessor } from './email.processor.js';

const redisUrl = new URL(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: redisUrl.hostname,
        port: Number(redisUrl.port || 6379),
        ...(redisUrl.password ? { password: redisUrl.password } : {}),
      },
    }),
    BullModule.registerQueue({ name: 'email' }),
    SettingsModule,
  ],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
