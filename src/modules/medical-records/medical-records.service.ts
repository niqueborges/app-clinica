import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async create(user: CurrentUserPayload, dto: CreateMedicalRecordDto, ipAddress?: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.userId },
    });

    if (!doctor) {
      throw new ForbiddenException('Apenas médicos credenciados podem criar prontuários');
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    const record = await this.prisma.medicalRecord.create({
      data: {
        doctorId: doctor.id,
        patientId: dto.patientId,
        diagnosis: dto.diagnosis,
        prescription: dto.prescription,
        notes: dto.notes,
      },
      include: {
        doctor: { select: { crm: true, specialty: true, user: { select: { name: true } } } },
        patient: { select: { cpf: true, user: { select: { name: true } } } },
      },
    });

    await this.auditService.log({
      userId: user.userId,
      action: 'CREATE_MEDICAL_RECORD',
      resource: `medical_records:${record.id}`,
      ipAddress,
      details: JSON.stringify({ patientId: dto.patientId, doctorId: doctor.id }),
    });

    return record;
  }

  async findByPatient(user: CurrentUserPayload, patientId: string, ipAddress?: string) {
    // Validação RLS (Row-Level Security)
    if (user.role === 'PATIENT') {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.userId },
      });
      if (!patient || patient.id !== patientId) {
        throw new ForbiddenException(
          'Acesso negado: pacientes só podem visualizar seu próprio prontuário'
        );
      }
    }

    const records = await this.prisma.medicalRecord.findMany({
      where: { patientId },
      include: {
        doctor: { select: { crm: true, specialty: true, user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.auditService.log({
      userId: user.userId,
      action: 'VIEW_MEDICAL_RECORDS',
      resource: `medical_records:patient:${patientId}`,
      ipAddress,
      details: `Total de registros acessados: ${records.length}`,
    });

    return records;
  }
}
