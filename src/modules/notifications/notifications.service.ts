import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SmsReminderJobData, EmailConfirmationJobData } from './processors/notification.processor';

@Injectable()
export class NotificationsService {
  constructor(@InjectQueue('notifications') private readonly notificationsQueue: Queue) {}

  async queueSmsReminder(data: SmsReminderJobData) {
    return this.notificationsQueue.add('send-sms-reminder', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  async queueEmailConfirmation(data: EmailConfirmationJobData) {
    return this.notificationsQueue.add('send-email-confirmation', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }
}
