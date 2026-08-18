import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CreateAuditLogParams {
  userId?: string;
  action: string;
  resource: string;
  ipAddress?: string;
  details?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: CreateAuditLogParams) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          resource: params.resource,
          ipAddress: params.ipAddress,
          details: params.details,
        },
      });
    } catch (error) {
      this.logger.error(`Falha ao registrar log de auditoria LGPD: ${(error as Error).message}`);
      return null;
    }
  }
}
