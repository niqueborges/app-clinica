import 'dotenv/config';
import bcrypt from 'bcrypt';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando seed do banco de dados...');
  const passwordHash = await bcrypt.hash('SenhaForte@123', 10);

  // 1. Admin
  await prisma.user.upsert({
    where: { email: 'admin@clinica.com.br' },
    update: {},
    create: {
      email: 'admin@clinica.com.br',
      passwordHash,
      name: 'Administrador do Sistema',
      role: 'ADMIN',
    },
  });

  // 2. Médica (Dra. Fernanda)
  const doctorUser = await prisma.user.upsert({
    where: { email: 'dra.fernanda@clinica.com.br' },
    update: {},
    create: {
      email: 'dra.fernanda@clinica.com.br',
      passwordHash,
      name: 'Dra. Fernanda Silva',
      role: 'DOCTOR',
      doctor: {
        create: {
          crm: 'CRM/SP 123456',
          specialty: 'Clínica Geral e Cardiologia',
          workingHours: '08:00-18:00',
        },
      },
    },
  });

  // 3. Recepcionista
  await prisma.user.upsert({
    where: { email: 'recepcao@clinica.com.br' },
    update: {},
    create: {
      email: 'recepcao@clinica.com.br',
      passwordHash,
      name: 'Mariana Recepcionista',
      role: 'RECEPTIONIST',
    },
  });

  // 4. Paciente
  await prisma.user.upsert({
    where: { email: 'joao.paciente@gmail.com' },
    update: {},
    create: {
      email: 'joao.paciente@gmail.com',
      passwordHash,
      name: 'João da Silva',
      role: 'PATIENT',
      patient: {
        create: {
          cpf: '123.456.789-00',
          phone: '+5511999998888',
          birthDate: new Date('1990-05-15'),
          address: 'Av. Paulista, 1000 - São Paulo, SP',
        },
      },
    },
  });

  console.log('Seed executado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
