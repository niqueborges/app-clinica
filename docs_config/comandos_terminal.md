# Guia Definitivo de Comandos e Criação Automatizada — Clínica API (Nível 2)

Documento consolidado com todos os comandos de terminal, automação via `cat << 'EOF'` para criação instantânea de arquivos no Git Bash, dependências atualizadas (2026), arquivos de código completos (NestJS, TypeScript, ESLint v10 Flat Config, Prettier, Husky v9, Commitlint, Jest), banco de dados PostgreSQL com Prisma 7, Redis, BullMQ, RBAC, Prontuário LGPD, Filas e Docker Compose.

---

## ÍNDICE DE PASSOS E FEATURES

1. [PASSO 1 — feature/init (Scaffold, TypeScript, Tooling, Health Check, CI e Swagger)](#1-passo-1--featureinit-scaffold-tooling-e-swagger)
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

### 1.3 Inicialização de Ferramental e Pastas

```bash
# Inicializar Prisma, Husky e pastas essenciais
npx prisma init
npx husky
mkdir -p .github/workflows src

# Configurar ganchos do Husky
echo "npx lint-staged" > .husky/pre-commit
echo "npm test" > .husky/pre-push
echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg
```

### 1.4 Criação Automatizada dos Arquivos da feature/init

```bash
cat << 'EOF' > .gitignore
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
EOF

cat << 'EOF' > .env.example
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
EOF

cp .env.example .env

cat << 'EOF' > docker-compose.yml
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
EOF

cat << 'EOF' > Dockerfile
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
EOF

cat << 'EOF' > .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: clinica_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout do repositorio
        uses: actions/checkout@v4

      - name: Setup do Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Instalar dependencias
        run: npm ci

      - name: Gerar Prisma Client
        run: npx prisma generate

      - name: Checagem de Tipos TypeScript
        run: npx tsc --noEmit

      - name: Validar Linter (ESLint)
        run: npm run lint

      - name: Validar Formatacao (Prettier)
        run: npm run format:check

      - name: Executar Testes Unitarios
        run: npm run test:ci
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/clinica_test
          REDIS_HOST: localhost
          REDIS_PORT: 6379
          JWT_SECRET: ci-test-secret-key-123456789
          JWT_REFRESH_SECRET: ci-test-refresh-secret-key-987654321
          NODE_ENV: test

      - name: Compilar Projeto (Build)
        run: npm run build
EOF

cat << 'EOF' > tsconfig.json
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
    "strictPropertyInitialization": false,
    "types": ["node", "jest"],
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "prisma.config.ts"],
  "exclude": ["node_modules", "dist", "generated"]
}
EOF

cat << 'EOF' > tsconfig.build.json
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
EOF

cat << 'EOF' > nest-cli.json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
EOF

cat << 'EOF' > eslint.config.mjs
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-console': 'error',
    },
  },
  prettierConfig,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'generated/**',
      'docs_config/**',
      '*.config.ts',
      '*.config.js',
      '*.config.mjs',
      '*.config.cjs',
    ],
  },
];
EOF

cat << 'EOF' > jest.config.cjs
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\./.*)\\.js$': '$1',
    '^(\\.\\./.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node16',
          target: 'ES2022',
          verbatimModuleSyntax: false,
          ignoreDeprecations: '6.0',
        },
      },
    ],
  },
};
EOF

cat << 'EOF' > commitlint.config.mjs
export default {
  extends: ['@commitlint/config-conventional'],
};
EOF

cat << 'EOF' > .prettierrc.json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "auto"
}
EOF

cat << 'EOF' > .lintstagedrc.json
{
  "src/**/*.ts": [
    "eslint --fix",
    "prettier --write",
    "jest --bail --findRelatedTests --passWithNoTests"
  ],
  "*.json": ["prettier --write"],
  "*.md": ["prettier --write"]
}
EOF

cat << 'EOF' > prisma.config.ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
EOF

cat << 'EOF' > src/app.service.ts
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
EOF

cat << 'EOF' > src/app.controller.ts
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
EOF

cat << 'EOF' > src/app.controller.spec.ts
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(() => {
    appService = new AppService();
    appController = new AppController(appService);
  });

  describe('getHealth', () => {
    it('should return health status ok', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
EOF

cat << 'EOF' > src/app.module.ts
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
EOF

cat << 'EOF' > src/main.ts
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
EOF
```

### 1.5 Validação e Transição Git da feature/init

```bash
# Validacoes locais
npx tsc --noEmit
npm run lint
npm run format:check
npm run test:ci
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

### 2.1 Criar a Branch e Pastas

```bash
git checkout -b feature/prisma
git push -u origin feature/prisma

# Criar pasta para serviços de banco de dados
mkdir -p src/database
```

### 2.2 Criação Automatizada dos Arquivos da feature/prisma

```bash
cat << 'EOF' > prisma/schema.prisma
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
EOF

cat << 'EOF' > src/database/prisma.service.ts
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
EOF

cat << 'EOF' > src/database/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
EOF

cat << 'EOF' > prisma/seed.ts
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
EOF
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

### 3.1 Criar a Branch e Pastas

```bash
git checkout -b feature/auth-rbac
git push -u origin feature/auth-rbac

# Criar pastas para auth, DTOs, guards, decorators e strategies
mkdir -p src/common/decorators src/common/guards src/modules/auth/dto src/modules/auth/strategies
```

### 3.2 Criação Automatizada dos Arquivos da feature/auth-rbac

```bash
cat << 'EOF' > src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '../../../generated/prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
EOF

cat << 'EOF' > src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  userId: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  }
);
EOF

cat << 'EOF' > src/common/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
EOF

cat << 'EOF' > src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../../generated/prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Acesso negado: permissão insuficiente para este recurso');
    }

    return true;
  }
}
EOF

cat << 'EOF' > src/modules/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'dra.fernanda@clinica.com.br' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email!: string;

  @ApiProperty({ example: 'SenhaForte@123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password!: string;
}
EOF

cat << 'EOF' > src/modules/auth/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../../../generated/prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'Dr. Lucas Médico' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'lucas.medico@clinica.com.br' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email!: string;

  @ApiProperty({ example: 'SenhaForte@123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password!: string;

  @ApiProperty({ enum: Role, default: Role.PATIENT })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
EOF

cat << 'EOF' > src/modules/auth/dto/refresh-token.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh Token recebido no login' })
  @IsString()
  refreshToken!: string;
}
EOF

cat << 'EOF' > src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev-secret-change-in-prod',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    if (!payload.sub) {
      throw new UnauthorizedException('Token inválido');
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
EOF

cat << 'EOF' > src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('E-mail já cadastrado no sistema');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role || 'PATIENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Acesso negado');
    }

    const match = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!match) {
      throw new UnauthorizedException('Refresh Token inválido ou expirado');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const secret = this.configService.get<string>('JWT_SECRET') || 'dev-secret-change-in-prod';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh-secret-change-in-prod';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hash },
    });
  }
}
EOF

cat << 'EOF' > src/modules/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Autenticar usuário e emitir tokens JWT' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Renovar Access Token através do Refresh Token' })
  @ApiResponse({ status: 200, description: 'Tokens renovados com sucesso' })
  refresh(@CurrentUser() user: CurrentUserPayload, @Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(user.userId, dto.refreshToken);
  }
}
EOF

cat << 'EOF' > src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
EOF

cat << 'EOF' > src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';

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
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
EOF
```

### 3.3 Comandos de Teste e Transição

```bash
npm run lint
npx tsc --noEmit
npm run test:ci
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

### 4.1 Criar a Branch e Pastas

```bash
git checkout -b feature/appointments
git push -u origin feature/appointments

# Criar pasta de DTOs do agendamento
mkdir -p src/modules/appointments/dto
```

### 4.2 Criação Automatizada dos Arquivos da feature/appointments

```bash
cat << 'EOF' > src/modules/appointments/dto/create-appointment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', description: 'ID do médico' })
  @IsUUID('4', { message: 'ID do médico inválido' })
  @IsNotEmpty()
  doctorId!: string;

  @ApiProperty({ example: 'f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c', description: 'ID do paciente' })
  @IsUUID('4', { message: 'ID do paciente inválido' })
  @IsNotEmpty()
  patientId!: string;

  @ApiProperty({ example: '2026-08-20T09:00:00.000Z', description: 'Data e hora da consulta (ISO 8601)' })
  @IsDateString({}, { message: 'Data e hora em formato ISO inválido' })
  @IsNotEmpty()
  dateTime!: string;

  @ApiProperty({ example: 'Primeira consulta de rotina', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
EOF

cat << 'EOF' > src/modules/appointments/appointments.service.ts
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
    const baseSlots = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
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
EOF

cat << 'EOF' > src/modules/appointments/appointments.controller.ts
import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../../generated/prisma/client';

@ApiTags('Appointments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.PATIENT)
  @ApiOperation({ summary: 'Criar novo agendamento de consulta' })
  @ApiResponse({ status: 201, description: 'Consulta agendada com sucesso' })
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get('available-slots')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PATIENT)
  @ApiOperation({ summary: 'Consultar horários livres com Cache-Aside no Redis' })
  @ApiQuery({ name: 'doctorId', type: String, required: true })
  @ApiQuery({ name: 'date', type: String, required: true, example: '2026-08-20' })
  getAvailableSlots(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string
  ) {
    return this.appointmentsService.getAvailableSlots(doctorId, date);
  }

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Listar agendamentos ativos' })
  @ApiQuery({ name: 'doctorId', type: String, required: false })
  @ApiQuery({ name: 'patientId', type: String, required: false })
  findAll(
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string
  ) {
    return this.appointmentsService.findAll(doctorId, patientId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.PATIENT)
  @ApiOperation({ summary: 'Cancelar agendamento (Soft Delete LGPD)' })
  @ApiResponse({ status: 200, description: 'Consulta cancelada com sucesso' })
  cancel(@Param('id') id: string) {
    return this.appointmentsService.cancel(id);
  }
}
EOF

cat << 'EOF' > src/modules/appointments/appointments.module.ts
import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
EOF

cat << 'EOF' > src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';

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
    PrismaModule,
    AuthModule,
    AppointmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
EOF
```

### 4.3 Comandos de Teste e Transição

```bash
npm run lint
npm run lint:fix
npx tsc --noEmit
npm run test:ci
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

### 5.1 Criar a Branch e Pastas

```bash
git checkout -b feature/medical-records
git push -u origin feature/medical-records

# Criar pastas para auditoria e prontuários
mkdir -p src/modules/audit src/modules/medical-records/dto
```

### 5.2 Criação Automatizada dos Arquivos da feature/medical-records

```bash
cat << 'EOF' > src/modules/audit/audit.service.ts
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
EOF

cat << 'EOF' > src/modules/audit/audit.module.ts
import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
EOF

cat << 'EOF' > src/modules/medical-records/dto/create-medical-record.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMedicalRecordDto {
  @ApiProperty({ example: 'f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c', description: 'ID do paciente' })
  @IsUUID('4', { message: 'ID do paciente inválido' })
  @IsNotEmpty()
  patientId!: string;

  @ApiProperty({ example: 'Hipertensão arterial estágio 1 e histórico familiar de cardiopatia.' })
  @IsString()
  @IsNotEmpty({ message: 'O diagnóstico é obrigatório' })
  diagnosis!: string;

  @ApiProperty({ example: 'Losartana Potássica 50mg, 1 comprimido ao dia pela manhã.', required: false })
  @IsOptional()
  @IsString()
  prescription?: string;

  @ApiProperty({ example: 'Retorno agendado em 60 dias para reavaliação.', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
EOF

cat << 'EOF' > src/modules/medical-records/medical-records.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
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
        throw new ForbiddenException('Acesso negado: pacientes só podem visualizar seu próprio prontuário');
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
EOF

cat << 'EOF' > src/modules/medical-records/medical-records.controller.ts
import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '../../../generated/prisma/client';

@ApiTags('Medical Records')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  @Roles(Role.DOCTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Criar entrada no prontuário eletrônico (Médicos/Admin)' })
  @ApiResponse({ status: 201, description: 'Prontuário criado e auditado com sucesso' })
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateMedicalRecordDto,
    @Req() req: Request,
  ) {
    return this.medicalRecordsService.create(user, dto, req.ip);
  }

  @Get('patient/:patientId')
  @Roles(Role.DOCTOR, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'Consultar histórico de prontuários com validação RLS e auditoria LGPD' })
  findByPatient(
    @CurrentUser() user: CurrentUserPayload,
    @Param('patientId') patientId: string,
    @Req() req: Request,
  ) {
    return this.medicalRecordsService.findByPatient(user, patientId, req.ip);
  }
}
EOF

cat << 'EOF' > src/modules/medical-records/medical-records.module.ts
import { Module } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';

@Module({
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService],
  exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}
EOF

cat << 'EOF' > src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuditModule } from './modules/audit/audit.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';

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
    PrismaModule,
    AuthModule,
    AppointmentsModule,
    AuditModule,
    MedicalRecordsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
EOF
```

### 5.3 Comandos de Teste e Transição

```bash
npm run lint
npm run lint:fix
npx tsc --noEmit
npm run test:ci
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

### 6.1 Criar a Branch e Pastas

```bash
git checkout -b feature/notifications-queue
git push -u origin feature/notifications-queue

# Criar pastas para processadores de filas
mkdir -p src/modules/notifications/processors
```

### 6.2 Criação Automatizada dos Arquivos da feature/notifications-queue

```bash
cat << 'EOF' > src/modules/notifications/processors/notification.processor.ts
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
EOF

cat << 'EOF' > src/modules/notifications/notifications.service.ts
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
EOF

cat << 'EOF' > src/modules/notifications/notifications.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../../generated/prisma/client';

class SendReminderDto {
  @ApiProperty({ example: '+5511999998888' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  @IsNotEmpty()
  patientName!: string;

  @ApiProperty({ example: '2026-08-20 às 09:00' })
  @IsString()
  @IsNotEmpty()
  dateTime!: string;

  @ApiProperty({ example: 'Dra. Fernanda Silva' })
  @IsString()
  @IsNotEmpty()
  doctorName!: string;
}

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('sms-reminder')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Enfileirar lembrete SMS na fila BullMQ com Redis' })
  @ApiResponse({ status: 202, description: 'Lembrete enfileirado com sucesso' })
  async sendSmsReminder(@Body() dto: SendReminderDto) {
    await this.notificationsService.queueSmsReminder(dto);
    return { message: 'Lembrete SMS enfileirado para processamento assíncrono' };
  }
}
EOF

cat << 'EOF' > src/modules/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationProcessor } from './processors/notification.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
EOF

cat << 'EOF' > src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuditModule } from './modules/audit/audit.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

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
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') || 'localhost',
          port: parseInt(config.get<string>('REDIS_PORT') || '6379', 10),
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    AppointmentsModule,
    AuditModule,
    MedicalRecordsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
EOF
```

### 6.3 Comandos de Teste e Transição

```bash
npm run lint
npx tsc --noEmit
npm run test:ci
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
