import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export interface SmsReminderJobData {
  phone: string;
  patientName: string;
  dateTime: string;
  doctorName: string;
}

export interface EmailConfirmationJobData {
  email: string;
  patientName: string;
  dateTime: string;
}

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<SmsReminderJobData | EmailConfirmationJobData>): Promise<void> {
    this.logger.log(`Processando job [${job.name}] ID: ${job.id}`);

    switch (job.name) {
      case 'send-sms-reminder': {
        const data = job.data as SmsReminderJobData;
        this.logger.log(
          `[SMS Twilio Simulado] Lembrete para ${data.phone} (${data.patientName}) — Consulta em ${data.dateTime} com ${data.doctorName}`
        );
        break;
      }
      case 'send-email-confirmation': {
        const data = job.data as EmailConfirmationJobData;
        this.logger.log(
          `[Email SendGrid Simulado] Confirmação para ${data.email} (${data.patientName}) — Consulta agendada para ${data.dateTime}`
        );
        break;
      }
      default:
        this.logger.warn(`Tipo de job desconhecido: ${job.name}`);
    }
  }
}
