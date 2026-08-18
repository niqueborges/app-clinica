import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../../database/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  private readonly redis: Redis;

  constructor(private readonly prisma: PrismaService) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    this.redis.connect().catch((err) => {
      this.logger.warn(`Redis connection error: ${(err as Error).message}`);
    });
  }

  async create(dto: CreateAppointmentDto) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Médico não encontrado');
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    const targetDate = new Date(dto.dateTime);

    // Prevenção de conflito de horário no mesmo médico
    const existingDoctorAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        dateTime: targetDate,
        deletedAt: null,
      },
    });

    if (existingDoctorAppointment) {
      throw new ConflictException('Horário indisponível para este médico');
    }

    // Criar agendamento
    const appointment = await this.prisma.appointment.create({
      data: {
        doctorId: dto.doctorId,
        patientId: dto.patientId,
        dateTime: targetDate,
        notes: dto.notes,
      },
      include: {
        doctor: { select: { crm: true, specialty: true, user: { select: { name: true } } } },
        patient: { select: { cpf: true, user: { select: { name: true } } } },
      },
    });

    // Invalidar cache de horários livres do médico
    const dateStr = dto.dateTime.split('T')[0];
    const cacheKey = `slots:${dto.doctorId}:${dateStr}`;
    await this.redis.del(cacheKey);

    return appointment;
  }

  async getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
    const cacheKey = `slots:${doctorId}:${date}`;
    const cachedSlots = await this.redis.get(cacheKey);

    if (cachedSlots) {
      return JSON.parse(cachedSlots) as string[];
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Médico não encontrado');
    }

    // Horários padrão de atendimento: 08:00 às 17:00 (slots de 1h)
    const baseSlots = [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
    ];
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        dateTime: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
      select: { dateTime: true },
    });

    const bookedHours = bookedAppointments.map((app) =>
      app.dateTime.toISOString().substring(11, 16)
    );

    const availableSlots = baseSlots.filter((slot) => !bookedHours.includes(slot));

    // Salvar no Redis com TTL de 1 hora (Cache-Aside)
    await this.redis.set(cacheKey, JSON.stringify(availableSlots), 'EX', 3600);

    return availableSlots;
  }

  async findAll(doctorId?: string, patientId?: string) {
    return this.prisma.appointment.findMany({
      where: {
        deletedAt: null,
        ...(doctorId ? { doctorId } : {}),
        ...(patientId ? { patientId } : {}),
      },
      include: {
        doctor: { select: { crm: true, specialty: true, user: { select: { name: true } } } },
        patient: { select: { cpf: true, user: { select: { name: true } } } },
      },
      orderBy: { dateTime: 'asc' },
    });
  }

  async cancel(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });
    if (!appointment || appointment.deletedAt) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const cancelled = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        deletedAt: new Date(),
      },
    });

    const dateStr = appointment.dateTime.toISOString().split('T')[0];
    const cacheKey = `slots:${appointment.doctorId}:${dateStr}`;
    await this.redis.del(cacheKey);

    return cancelled;
  }
}
