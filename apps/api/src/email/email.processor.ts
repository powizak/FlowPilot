import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { EmailService } from './email.service.js';
import type { EmailJobData } from './email.service.js';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    this.logger.log(`Processing email job ${job.id} (type: ${job.data.type})`);
    try {
      await this.emailService.sendEmail(job.data);
    } catch (error) {
      this.logger.error(`Failed to send email for job ${job.id}: ${error}`);
      throw error;
    }
  }
}
