# Guia Definitivo de Comandos, Dependências e Configurações — Clínica API (Nível 2)

Documento consolidado com todos os comandos de terminal, dependências atualizadas (2026), arquivos de código completos (NestJS, TypeScript, ESLint v10 Flat Config, Prettier, Husky v9, Commitlint, Jest), banco de dados PostgreSQL com Prisma 7, Redis, BullMQ, RBAC, Prontuário LGPD, Filas e Docker Compose.

---

## ÍNDICE DE PASSOS E FEATURES

1. [PASSO 1 — feature/init (Scaffold, TypeScript, Tooling, Health Check e Swagger)](#1-passo-1--featureinit-scaffold-tooling-e-swagger)
2. [PASSO 2 — feature/prisma (Schema Relacional, Driver Adapter PG, Migrations e Seed)](#2-passo-2--featureprisma-banco-de-dados-e-seed)
3. [PASSO 3 — feature/auth-rbac (Autenticação JWT, Refresh Token, Decorators e Guards)](#3-passo-3--featureauth-rbac-autenticacao-e-permissoes)
4. [PASSO 4 — feature/appointments (Motor de Agendamento, Conflitos e Cache Redis)](#4-passo-4--featureappointments-agendamento-e-cache)
5. [PASSO 5 — feature/medical-records (Prontuário Eletrônico e Trilha de Auditoria LGPD)](#5-passo-5--featuremedical-records-prontuario-e-auditoria-lgpd)
6. [PASSO 6 — feature/notifications-queue (Filas Assíncronas BullMQ com Redis)](#6-passo-6--featurenotifications-queue-filas-e-lembretes)
7. [PASSO 7 — feature/frontend (Aplicação React + Vite + TypeScript)](#7-passo-7--featurefrontend-painel-web)
8. [PASSO 8 — feature/deploy (Docker Compose, Healthchecks e Produção)](#8-passo-8--featuredeploy-orquestracao-final)

---

## 1. PASSO 1 — feature/init (Scaffold, Tooling e Swagger)

### 1.1 Inicialização do Repositório e Branches

```bash
# 1. Criar pasta do projeto e inicializar Git
mkdir app-clinica
cd app-clinica
git init
git branch -M main

# 2. Criar commit inicial e vincular repositorio remoto
touch .gitkeep
git add .gitkeep
git remote add origin https://github.com/niqueborges/app-clinica.git
git branch -M main
git commit -m "chore: initial commit repository setup"
git push -u origin main

# 3. Criar e publicar branch develop
git checkout -b develop
git push -u origin develop
git pull origin develop

# 4. Criar branch da feature inicial
git checkout -b feature/init
git push -u origin feature/init
```

### 1.2 Instalação de Dependências

```bash
# Dependencias de producao
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config @nestjs/swagger @nestjs/jwt @nestjs/passport passport passport-jwt @prisma/client @prisma/adapter-pg pg ioredis @nestjs/bullmq bullmq zod class-validator class-transformer bcrypt helmet express-rate-limit nestjs-pino pino pino-http

# Dependencias de desenvolvimento
npm install -D @nestjs/cli @nestjs/schematics typescript @types/node @types/express @types/bcrypt @types/passport-jwt @types/multer prisma tsx rimraf pino-pretty eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier prettier husky lint-staged @commitlint/cli @commitlint/config-conventional jest ts-jest @types/jest jest-mock-extended
```

### 1.3 Inicialização de Ferramental

```bash
# Inicializar Prisma e Husky
npx prisma init
npx husky

# Configurar ganchos do Husky
echo "npx lint-staged" > .husky/pre-commit
echo "npm test" > .husky/pre-push
echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg
```

### 1.4 Arquivos de Configuração da feature/init

#### `.gitignore`

```gitignore
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.*.local

# Build outputs
dist/
build/

# IDE and Editors
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Test coverage
coverage/

# Generated Prisma Client
generated/
src/generated/

# Frontend (when initialized)
frontend/node_modules/
frontend/dist/

# Agents & AI
.agents/
.claude/
.windsurf/
```

#### `.env.example` e `.env`

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:dev@localhost:5433/clinica
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=dev-secret-change-in-prod-super-secure-key-123456
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-prod-super-key-987654
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
```

#### `docker-compose.yml`

```yaml
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://postgres:dev@db:5432/clinica
      REDIS_HOST: cache
      REDIS_PORT: 6379
      JWT_SECRET: dev-secret-change-in-prod
      JWT_REFRESH_SECRET: dev-refresh-secret-change-in-prod
      NODE_ENV: development
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_healthy
    volumes:
      - ./src:/app/src

  db:
    image: postgres:16-alpine
    ports:
      - '5433:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: clinica
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

#### `Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
CMD ["node", "dist/main.js"]
```

#### `tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": "./",
    "incremental": true,
    "ignoreDeprecations": "6.0",
    "skipLibCheck": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["node", "jest"],
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "prisma.config.ts"],
  "exclude": ["node_modules", "dist", "generated"]
}
```

#### `tsconfig.build.json`

```json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "node_modules",
    "dist",
    "generated",
    "test",
    "**/*spec.ts",
    "**/*test.ts",
    "prisma.config.ts"
  ]
}
```

#### `nest-cli.json`

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

#### `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Clínica API — Dra. Fernanda')
    .setDescription(
      'API REST para gestão clínica: agendamentos, prontuários eletrônicos com auditoria LGPD, RBAC e notificações assíncronas.'
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT de acesso',
        in: 'header',
      },
      'access-token'
    )
    .addTag('Health', 'Verificação de integridade e status da API')
    .addTag('Auth', 'Autenticação, registro e renovação de tokens')
    .addTag('Appointments', 'Agendamento de consultas e disponibilidade')
    .addTag('Patients', 'Gestão de pacientes e dados cadastrais')
    .addTag('Medical Records', 'Prontuários eletrônicos e prescrições médicas')
    .addTag('Audit', 'Trilha de auditoria e conformidade LGPD')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks();

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
}

void bootstrap();
```

#### `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                },
              }
            : undefined,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

#### `src/app.controller.ts` e `src/app.service.ts`

```typescript
// src/app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; timestamp: string; uptime: number } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}

// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar status de integridade da API' })
  @ApiResponse({
    status: 200,
    description: 'API operando normalmente',
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
```

### 1.5 Validação e Transição Git da feature/init

```bash
# Validacoes locais
npx tsc --noEmit
npm run lint
npm run format:check
npm test
npm run build
docker compose config

# Finalizar feature/init e mesclar na develop
git add .
git commit -m "feat(init): setup NestJS 11 scaffold, TypeScript, Docker, Prisma 7 and Swagger docs"
git push -u origin feature/init

git checkout develop
git pull origin develop
git merge feature/init --no-ff -m "chore: merge branch 'feature/init' into develop"
git push origin develop

# Excluir branch da feature (local e remota) apos merge confirmado
git branch -d feature/init
git push origin --delete feature/init
```

---

## 2. PASSO 2 — feature/prisma (Banco de Dados e Seed)

### 2.1 Criar a Branch

```bash
git checkout -b feature/prisma
git push -u origin feature/prisma
```

### 2.2 Arquivos da feature/prisma

#### `prisma/schema.prisma` (Modelagem Completa com LGPD e RBAC)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  ADMIN
  DOCTOR
  RECEPTIONIST
  PATIENT
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  CANCELLED
  COMPLETED
}

model User {
  id           String        @id @default(uuid())
  email        String        @unique
  passwordHash String        @map("password_hash")
  name         String
  role         Role          @default(PATIENT)
  refreshToken String?       @map("refresh_token")
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  doctor       Doctor?
  patient      Patient?
  auditLogs    AuditLog[]

  @@map("users")
}

model Doctor {
  id           String        @id @default(uuid())
  userId       String        @unique @map("user_id")
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  crm          String        @unique
  specialty    String
  workingHours String        @default("08:00-18:00") @map("working_hours")
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  appointments Appointment[]
  records      MedicalRecord[]

  @@map("doctors")
}

model Patient {
  id           String        @id @default(uuid())
  userId       String        @unique @map("user_id")
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  cpf          String        @unique
  phone        String
  birthDate    DateTime      @map("birth_date")
  address      String?
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  appointments Appointment[]
  records      MedicalRecord[]

  @@map("patients")
}

model Appointment {
  id          String            @id @default(uuid())
  doctorId    String            @map("doctor_id")
  doctor      Doctor            @relation(fields: [doctorId], references: [id])
  patientId   String            @map("patient_id")
  patient     Patient           @relation(fields: [patientId], references: [id])
  dateTime    DateTime          @map("date_time")
  status      AppointmentStatus @default(SCHEDULED)
  notes       String?
  deletedAt   DateTime?         @map("deleted_at")
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")

  @@index([doctorId, dateTime])
  @@index([patientId])
  @@map("appointments")
}

model MedicalRecord {
  id          String    @id @default(uuid())
  patientId   String    @map("patient_id")
  patient     Patient   @relation(fields: [patientId], references: [id])
  doctorId    String    @map("doctor_id")
  doctor      Doctor    @relation(fields: [doctorId], references: [id])
  diagnosis   String
  prescription String?
  notes       String?
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@index([patientId])
  @@map("medical_records")
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?  @map("user_id")
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  action    String
  resource  String
  ipAddress String?  @map("ip_address")
  details   String?
  timestamp DateTime @default(now())

  @@index([userId])
  @@index([resource])
  @@map("audit_logs")
}
```

#### `src/database/prisma.service.ts` (Driver Adapter PG para Prisma 7)

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

#### `src/database/prisma.module.ts`

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

#### `prisma/seed.ts` (Criação de Usuários de Teste)

```typescript
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
  await prisma.user.upsert({
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
```

### 2.3 Comandos de Execução e Transição Git

```bash
# Iniciar banco no Docker
docker compose up -d db cache

# Criar migracao inicial
npx prisma migrate dev --name init

# Gerar tipos do Prisma
npx prisma generate

# Executar seed
npx tsx prisma/seed.ts

# Testar compilacao
npm run build

# Finalizar feature/prisma e mesclar na develop
git add .
git commit -m "feat(prisma): add schema models, PG adapter, migrations and seed"
git push -u origin feature/prisma

git checkout develop
git pull origin develop
git merge feature/prisma --no-ff -m "chore: merge branch 'feature/prisma' into develop"
git push origin develop

# Excluir branch da feature (local e remota) apos merge confirmado
git branch -d feature/prisma
git push origin --delete feature/prisma
```

---

## 3. PASSO 3 — feature/auth-rbac (Autenticação e Permissões)

### 3.1 Criar a Branch

```bash
git checkout -b feature/auth-rbac
git push -u origin feature/auth-rbac
```

### 3.2 Componentes e Códigos

- `src/common/decorators/roles.decorator.ts`: Decorator `@Roles('ADMIN', 'DOCTOR', ...)`
- `src/common/decorators/current-user.decorator.ts`: Injeta dados do usuário logado
- `src/common/guards/jwt-auth.guard.ts`: Valida o token JWT em headers `Authorization: Bearer <token>`
- `src/common/guards/roles.guard.ts`: Valida se o usuário logado possui o papel requerido
- `src/modules/auth/auth.service.ts`: Métodos `login()`, `register()`, `refreshToken()`, `validateUser()`
- `src/modules/auth/auth.controller.ts`: Endpoints `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`
- `src/modules/auth/auth.module.ts`: Integração com `JwtModule` e `PassportModule`

### 3.3 Comandos de Teste e Transição

```bash
npm test
npm run build

git add .
git commit -m "feat(auth): add JWT authentication, refresh token and RBAC roles guard"
git push -u origin feature/auth-rbac

git checkout develop
git pull origin develop
git merge feature/auth-rbac --no-ff -m "chore: merge branch 'feature/auth-rbac' into develop"
git push origin develop

# Excluir branch da feature (local e remota) apos merge confirmado
git branch -d feature/auth-rbac
git push origin --delete feature/auth-rbac
```

---

## 4. PASSO 4 — feature/appointments (Agendamento e Cache)

### 4.1 Criar a Branch

```bash
git checkout -b feature/appointments
git push -u origin feature/appointments
```

### 4.2 Componentes e Códigos

- `src/modules/appointments/appointments.service.ts`:
  - `create()`: Valida se médico e paciente existem, checa conflito de horário no mesmo `dateTime` e invalida cache Redis do médico.
  - `getAvailableSlots(doctorId, date)`: Consulta horários livres (08:00 às 18:00) com padrão Cache-Aside no Redis (TTL: 1 hora).
  - `cancel(id)`: Soft Delete marcando `deletedAt = new Date()`, mantendo histórico LGPD.
- `src/modules/appointments/appointments.controller.ts`:
  - `POST /api/appointments` (Protegido por `@Roles(Role.RECEPTIONIST, Role.PATIENT, Role.ADMIN)`)
  - `GET /api/appointments/available-slots`
  - `DELETE /api/appointments/:id`

### 4.3 Comandos de Teste e Transição

```bash
npm test
npm run build

git add .
git commit -m "feat(appointments): add booking logic, conflict checks and Redis cache-aside"
git push -u origin feature/appointments

git checkout develop
git pull origin develop
git merge feature/appointments --no-ff -m "chore: merge branch 'feature/appointments' into develop"
git push origin develop

# Excluir branch da feature (local e remota) apos merge confirmado
git branch -d feature/appointments
git push origin --delete feature/appointments
```

---

## 5. PASSO 5 — feature/medical-records (Prontuário e Auditoria LGPD)

### 5.1 Criar a Branch

```bash
git checkout -b feature/medical-records
git push -u origin feature/medical-records
```

### 5.2 Componentes e Códigos

- `src/modules/audit/audit.service.ts`: Grava registros em `AuditLog` (`userId`, `action`, `resource`, `ipAddress`, `timestamp`).
- `src/modules/medical-records/medical-records.service.ts`:
  - Validação RLS: Paciente acessa **apenas** seus próprios prontuários; Médico acessa **apenas** prontuários de seus pacientes vinculados.
  - Toda operação de leitura/escrita aciona o `AuditService`.
- `src/modules/medical-records/medical-records.controller.ts`:
  - `POST /api/medical-records` (Apenas `Role.DOCTOR`)
  - `GET /api/medical-records/patient/:patientId` (Protegido por RBAC e RLS)

### 5.3 Comandos de Teste e Transição

```bash
npm test
npm run build

git add .
git commit -m "feat(records): add medical records with RLS access control and LGPD audit logs"
git push -u origin feature/medical-records

git checkout develop
git pull origin develop
git merge feature/medical-records --no-ff -m "chore: merge branch 'feature/medical-records' into develop"
git push origin develop

# Excluir branch da feature (local e remota) apos merge confirmado
git branch -d feature/medical-records
git push origin --delete feature/medical-records
```

---

## 6. PASSO 6 — feature/notifications-queue (Filas e Lembretes)

### 6.1 Criar a Branch

```bash
git checkout -b feature/notifications-queue
git push -u origin feature/notifications-queue
```

### 6.2 Componentes e Códigos

- `src/modules/notifications/processors/notification.processor.ts`:
  - Worker BullMQ processando fila `'notifications'` com 3 tentativas e backoff exponencial.
  - Jobs: `'send-sms-reminder'` (Simulação Twilio) e `'send-email-confirmation'` (Simulação SendGrid).
- `src/modules/notifications/notifications.service.ts`: Enfileira jobs sem bloquear a requisição HTTP.

### 6.3 Comandos de Teste e Transição

```bash
npm test
npm run build

git add .
git commit -m "feat(notifications): add BullMQ queue processor for async SMS and email reminders"
git push -u origin feature/notifications-queue

git checkout develop
git pull origin develop
git merge feature/notifications-queue --no-ff -m "chore: merge branch 'feature/notifications-queue' into develop"
git push origin develop

# Excluir branch da feature (local e remota) apos merge confirmado
git branch -d feature/notifications-queue
git push origin --delete feature/notifications-queue
```

---

## 7. PASSO 7 — feature/frontend (Painel Web)

### 7.1 Criar a Branch

```bash
git checkout -b feature/frontend
git push -u origin feature/frontend
```

### 7.2 Inicialização da Aplicação Web

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install axios lucide-react
npm run build
cd ..
```

### 7.3 Comandos de Teste e Transição

```bash
git add .
git commit -m "feat(frontend): setup React Vite SPA for clinic dashboard"
git push -u origin feature/frontend

git checkout develop
git pull origin develop
git merge feature/frontend --no-ff -m "chore: merge branch 'feature/frontend' into develop"
git push origin develop

# Excluir branch da feature (local e remota) apos merge confirmado
git branch -d feature/frontend
git push origin --delete feature/frontend
```

---

## 8. PASSO 8 — feature/deploy (Orquestração Final)

### 8.1 Criar a Branch

```bash
git checkout -b feature/deploy
git push -u origin feature/deploy
```

### 8.2 Executar e Testar o Ambiente Completo

```bash
# Subir aplicacao e dependencias
docker compose up -d --build

# Verificar status dos containers
docker compose ps

# Testar endpoint de integridade
curl http://localhost:3000/api/health

# Abrir documentacao interativa no navegador
# http://localhost:3000/api/docs
```

### 8.3 Merge Final para Produção

```bash
# 1. Integrar na develop e limpar branch da feature
git add .
git commit -m "feat(deploy): production docker compose and healthcheck setup"
git push -u origin feature/deploy

git checkout develop
git pull origin develop
git merge feature/deploy --no-ff -m "chore: merge branch 'feature/deploy' into develop"
git push origin develop

# Excluir branch da feature deploy (local e remota)
git branch -d feature/deploy
git push origin --delete feature/deploy

# 2. Publicar versao final na main
git checkout main
git pull origin main
git merge develop --no-ff -m "chore: release clinica-api version 1.0.0"
git push origin main
```
