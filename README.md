# Clínica API — A Clínica da Dra. Fernanda

API REST modular para gestão clínica (agendamentos, prontuários eletrônicos com auditoria LGPD, RBAC e notificações assíncronas), construída com NestJS 11, Prisma 7, PostgreSQL, Redis e BullMQ.

---

## 1. Stack Tecnológica

| Camada              | Tecnologia                                                     |
| :------------------ | :------------------------------------------------------------- |
| **Framework**       | NestJS 11 + Express                                            |
| **Linguagem**       | TypeScript 6 (Strict)                                          |
| **ORM**             | Prisma ORM 7 + Driver Adapter PG (`@prisma/adapter-pg`)        |
| **Banco de Dados**  | PostgreSQL 16                                                  |
| **Cache & Filas**   | Redis 7 + BullMQ                                               |
| **Segurança**       | Helmet, CORS, Rate Limit, Bcrypt, Passport JWT                 |
| **Observabilidade** | Pino (`nestjs-pino`, `pino-http`)                              |
| **Qualidade**       | ESLint v10 (Flat Config), Prettier, Husky v9, Commitlint, Jest |
| **Conteinerização** | Docker (Multi-stage) + Docker Compose V2                       |

---

## 2. Estrutura do Projeto

```
src/
├── common/             # Guards, Decorators, Interceptors, Pipes, Filters globais
├── config/             # Configurações de ambiente tipadas
├── database/           # PrismaService e PrismaModule
├── modules/
│   ├── appointments/   # Módulo de agendamentos e horários disponíveis
│   ├── audit/          # Módulo de trilha de auditoria LGPD
│   ├── auth/           # Módulo de autenticação (JWT + Refresh Token + RBAC)
│   ├── medical-records/# Módulo de prontuários eletrônicos
│   ├── notifications/  # Módulo de filas e notificações (BullMQ)
│   └── patients/       # Módulo de gestão de pacientes
├── app.controller.spec.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

---

## 3. Como Executar

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

### 3.1 Instalação

```bash
npm install
```

### 3.2 Ambiente de Desenvolvimento (Docker)

```bash
# Iniciar PostgreSQL e Redis
docker compose up -d db cache

# Gerar o cliente Prisma
npm run prisma:generate

# Iniciar o servidor em modo watch
npm run dev
```

A API estará acessível em `http://localhost:3000/api`.

---

## 4. Scripts Disponíveis

| Script                    | Descrição                                                                          |
| :------------------------ | :--------------------------------------------------------------------------------- |
| `npm run dev`             | Inicia o servidor em modo de desenvolvimento com hot-reload (`nest start --watch`) |
| `npm run build`           | Gera o cliente Prisma e compila a aplicação (`dist/`)                              |
| `npm start`               | Inicia a aplicação compilada                                                       |
| `npm run lint`            | Executa o ESLint nos arquivos `src/**/*.ts`                                        |
| `npm run lint:fix`        | Corrige problemas automáticos de lint                                              |
| `npm run format`          | Formata o código com Prettier                                                      |
| `npm run format:check`    | Valida a formatação de todos os arquivos                                           |
| `npm test`                | Executa a suíte de testes unitários com Jest                                       |
| `npm run test:watch`      | Executa os testes em modo interativo/watch                                         |
| `npm run test:cov`        | Gera o relatório de cobertura de testes                                            |
| `npm run prisma:generate` | Gera o cliente Prisma tipado                                                       |
| `npm run prisma:migrate`  | Executa as migrações do banco de dados                                             |
| `npm run prisma:studio`   | Abre o visualizador de dados Prisma Studio                                         |
