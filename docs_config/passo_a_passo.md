# Guia de Arquitetura e Implementação Passo a Passo — NestJS + Prisma 7 + PostgreSQL + Redis + BullMQ

Template e guia definitivo de arquitetura backend para o projeto **A Clínica da Dra. Fernanda (Nível 2)** com NestJS, TypeScript estrito, Prisma ORM v7, PostgreSQL (Driver Adapter), Redis, BullMQ (Filas Assíncronas), RBAC, LGPD e Docker.

---

## Objetivos Arquiteturais

- **Arquitetura Modular (NestJS + Clean DDD Leve)**: Módulos independentes por contexto delimitado (AuthModule, AppointmentsModule, PatientsModule, MedicalRecordsModule, NotificationsModule, AuditModule).
- **Controle de Acesso Baseado em Papéis (RBAC)**: Papéis estritos (ADMIN, DOCTOR, RECEPTIONIST, PATIENT) com AuthGuard e RolesGuard.
- **Autenticação Segura**: Token de Acesso JWT (15min) e Refresh Token (7 dias) com hash Bcrypt.
- **Processamento Assíncrono e Filas**: BullMQ com Redis para envio não bloqueante de SMS (Twilio) e Email (SendGrid) com retry logic e backoff.
- **Auditoria e LGPD**: Trilha de auditoria (AuditLog) para cada acesso ou modificação de prontuário e exclusão lógica (Soft Delete).
- **Estratégia de Cache**: Redis com padrão Cache-Aside para horários disponíveis dos médicos.
- **Observabilidade Estruturada**: Logger assíncrono em JSON (Pino) com identificador único (x-request-id) e correlação de requests.
- **Qualidade e CI/CD**: ESLint v10, Prettier, Husky v9, Commitlint e pipeline de integração contínua no GitHub Actions.

---

## Status de Execução das Branches

| Branch                      | Responsabilidade                                                                                        | Status        |
| :-------------------------- | :------------------------------------------------------------------------------------------------------ | :------------ |
| main                        | Código em produção.                                                                                     | Planejado     |
| develop                     | Branch de integração contínua.                                                                          | Ativo         |
| feature/init                | Scaffold NestJS, TypeScript, Linter, Husky, Commitlint, CI e Health Check.                              | Concluído     |
| feature/prisma              | Schema Prisma v7, Driver Adapter PG, Entidades, Migrations e Seed (Médicos, Recepcionistas, Pacientes). | Concluído     |
| feature/auth-rbac           | Módulo de Autenticação: JWT + Refresh Token, Roles enum, Decorators @Roles(), Guards.                   | Concluído     |
| feature/appointments        | Módulo de Agendamento: Conflito de horários, cancelamento com Soft Delete e Cache Redis.                | Concluído     |
| feature/medical-records     | Módulo de Prontuário Eletrônico com isolamento de dados e trilha de Auditoria LGPD.                     | Concluído     |
| feature/notifications-queue | Módulo de Filas: BullMQ + Redis, processadores assíncronos de SMS (Twilio) e Email.                     | PROXIMO PASSO |
| feature/frontend            | Aplicação web (React + Vite + TypeScript) com painel médico, recepção e agendamento.                    | Pendente      |
| feature/deploy              | Docker Compose (App + Postgres + Redis), Dockerfile multi-stage e healthchecks.                         | Pendente      |

---

## PASSO 1 — feature/init [CONCLUÍDO]

**Objetivo:** Inicializar o projeto NestJS com TypeScript, configurações de segurança, qualidade de código, pipeline de CI e verificação de saúde.

### 1.1 Dependências Instaladas

- **Core NestJS**: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/config`, `@nestjs/swagger`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`.
- **Persistência e Cache**: `@prisma/client`, `@prisma/adapter-pg`, `pg`, `ioredis`, `@nestjs/bullmq`, `bullmq`.
- **Validação e Segurança**: `zod`, `class-validator`, `class-transformer`, `bcrypt`, `helmet`, `express-rate-limit`.
- **Observabilidade**: `nestjs-pino`, `pino`, `pino-http`, `pino-pretty`.
- **Desenvolvimento**: `@nestjs/cli`, `@nestjs/schematics`, `typescript`, `@types/node`, `@types/express`, `@types/bcrypt`, `@types/passport-jwt`, `@types/multer`, `prisma`, `tsx`, `rimraf`, `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-config-prettier`, `eslint-plugin-prettier`, `prettier`, `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`, `jest`, `ts-jest`, `@types/jest`, `jest-mock-extended`.

### 1.2 Arquivos Entregues

- Configurações de Tooling e CI: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `.github/workflows/ci.yml`, `eslint.config.mjs`, `jest.config.cjs`, `commitlint.config.mjs`, `.prettierrc.json`, `.lintstagedrc.json`, `.husky/commit-msg`, `.husky/pre-commit`, `.husky/pre-push`.
- Containers: `Dockerfile` (multi-stage com Node 22 e non-root user `node`), `docker-compose.yml` (PostgreSQL 16 + Redis 7 + App).
- Prisma: `prisma.config.ts`, `prisma/schema.prisma`.
- Bootstrap NestJS: `src/main.ts`, `src/app.module.ts`, `src/app.controller.ts`, `src/app.service.ts`, `src/app.controller.spec.ts`.

### 1.3 Comandos de Validação

```bash
npm run lint:fix
npx tsc --noEmit
npm run test:ci
npm run build
docker compose config
```

---

## PASSO 2 — feature/prisma [CONCLUÍDO]

**Objetivo:** Modelagem relacional do banco de dados da clínica, suporte a LGPD, roles e migrations.

### 2.1 Modelagem Relacional (prisma/schema.prisma)

- **Tabela users**: Identificação de usuários com role (`ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`).
- **Tabela doctors**: Especialidade médica, CRM e horários de atendimento.
- **Tabela patients**: CPF, data de nascimento, telefone e endereço.
- **Tabela appointments**: Relação de consulta com médico, paciente, data/hora, status (`SCHEDULED`, `CONFIRMED`, `CANCELLED`, `COMPLETED`), deletedAt (Soft Delete).
- **Tabela medical_records**: Prontuário eletrônico, diagnósticos, prescrições e anexos.
- **Tabela audit_logs**: Trilha de conformidade LGPD (userId, action, resource, ip, timestamp).

### 2.2 Execução

```bash
docker compose up -d db cache
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
```

---

## PASSO 3 — feature/auth-rbac [CONCLUÍDO]

**Objetivo:** Autenticação de usuários, emissão de Refresh Tokens e controle granular de permissões.

### 3.1 Funcionalidades

- `POST /api/auth/login`: Autenticação com email e senha, retorno de accessToken e refreshToken.
- `POST /api/auth/refresh`: Renovação segura de sessão sem necessidade de novo login.
- `@Roles(Role.DOCTOR, Role.RECEPTIONIST)`: Decorator customizado para proteger rotas por nível de permissão.
- `AuthGuard` e `RolesGuard`: Interceptação e validação automática no pipeline de execução do NestJS.

---

## PASSO 4 — feature/appointments [CONCLUÍDO]

**Objetivo:** Motor de agendamento de consultas com prevenção de conflito de agenda, cancelamento e cache de horários.

### 4.1 Funcionalidades

- `POST /api/appointments`: Criação de agendamento validando disponibilidade do médico.
- `GET /api/appointments/available-slots?doctorId=...&date=...`: Consulta com cache no Redis (1 hora) e invalidação automática ao agendar.
- `DELETE /api/appointments/:id`: Cancelamento com soft delete (`deletedAt = new Date()`).

---

## PASSO 5 — feature/medical-records & audit [CONCLUÍDO]

**Objetivo:** Prontuários eletrônicos protegidos e registro obrigatório de auditoria LGPD.

### 5.1 Funcionalidades

- Médicos acessam apenas prontuários de seus pacientes vinculados.
- Pacientes acessam apenas seu próprio histórico de saúde.
- Gravação automática em `audit_logs` para qualquer leitura ou escrita de dados sensíveis.

---

## PASSO 6 — feature/notifications-queue [PROXIMO PASSO]

**Objetivo:** Filas assíncronas em segundo plano com BullMQ e Redis para comunicação com pacientes.

### 6.1 Funcionalidades

- Job de envio de SMS de confirmação/lembrete (Twilio Adapter com mock para desenvolvimento).
- Job de envio de Email com instruções pré-consulta (SendGrid Adapter).
- Política de retentativa automática (3 tentativas com backoff exponencial).

---

## PASSO 7 — feature/frontend

**Objetivo:** Interface web em React + Vite para a Dra. Fernanda, recepcionistas e pacientes.

### 7.1 Telas Principais

1. **Login & Seleção de Perfil**: Acesso com RBAC diferenciado.
2. **Agenda Médica**: Visão de calendário diário e semanal para a Dra. Fernanda.
3. **Recepção & Agendamento**: Cadastro de pacientes e marcação de consultas.
4. **Prontuário Eletrônico**: Histórico de consultas e prescrições.

---

## PASSO 8 — feature/deploy

**Objetivo:** Publicação e orquestração com Docker Compose em ambiente de produção.
