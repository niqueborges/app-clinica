# Arquitetura Backend no Brasil: Do Junior ao Pleno (2026)

## 4 Niveis de Complexidade com Stack Prática, Docker, Testing e Observabilidade

> **Sem overengineering.** Focado no que o mercado realmente pede de um junior em 2026.

---

## Sumario

1. [Nivel 1 - A Padaria do Pedro](#nivel-1--a-padaria-do-pedro)
2. [Nivel 2 - A Clinica da Dra. Fernanda](#nivel-2--a-clinica-da-dra-fernanda)
3. [Nivel 3 - O E-commerce do Lucas](#nivel-3--o-e-commerce-do-lucas)
4. [Nivel 4 - A Fintech da Maria](#nivel-4--a-fintech-da-maria)
5. [Clean Architecture: Regra de Ouro](#clean-architecture-regra-de-ouro)
6. [Quando Transitar Entre Niveis](#quando-transitar-entre-niveis)
7. [Error Handling & Resiliencia](#error-handling--resiliencia)
8. [Observabilidade Desde o Começo](#observabilidade-desde-o-comeco)
9. [Testing Strategy Completa](#testing-strategy-completa)
10. [Docker & Compose Essencial](#docker--compose-essencial)
11. [Database Performance](#database-performance)
12. [Cache Strategies](#cache-strategies)
13. [Secrets & Seguranca Aprofundada](#secrets--seguranca-aprofundada)
14. [Resumo de Custos](#resumo-de-custos)
15. [Checklist do Junior (Completo)](#checklist-do-junior-completo)
16. [Faixa Salarial no Brasil](#faixa-salarial-no-brasil-backend-2026)
17. [Roadmap de Aprendizado (12 Semanas)](#roadmap-de-aprendizado-12-semanas)
18. [Antipadroes Comuns](#antipadroes-comuns)
19. [Dicas de Entrevista](#dicas-de-entrevista-tecnica)

---

## Nivel 1 - A Padaria do Pedro

### O Problema

Pedro tem uma padaria no bairro e anota vendas no caderno. Ele precisa de um sistema simples para cadastrar produtos, registrar vendas diarias e ver um relatorio de faturamento. Maximo 2 usuarios (ele e a esposa).

---

### Stack Tecnologica

| Camada          | Tecnologia                      | Justificativa Arquitetural                                                              |
| :-------------- | :------------------------------ | :-------------------------------------------------------------------------------------- |
| Linguagem       | Node.js + TypeScript            | Type-safe de ponta a ponta, prevencao de erros em tempo de compilacao e excelente DX    |
| Framework       | Express.js                      | Simples, minimalista, amplamente documentado e rapido para APIs REST                    |
| ORM             | Prisma 7                        | Type-safe, migrations automaticas e queries otimizadas com Driver Adapters              |
| Banco de Dados  | PostgreSQL                      | Relacional, robusto, suporte transacional completo (ACID) e conteinerizavel             |
| Validacao       | Zod                             | Schemas declarativos e tipados com inferencia automatica para TypeScript                |
| Seguranca       | Helmet, Bcrypt, JWT, Rate Limit | Headers de seguranca HTTP, hash de senhas com salt, tokens stateless e controle de taxa |
| Observabilidade | Pino (estruturado)              | Logs em JSON de alto desempenho com request-id e duracao de resposta                    |
| Testes          | Jest + ts-jest                  | Suite de testes unitarios com mock de repositorios                                      |
| Frontend        | React + Vite (TypeScript)       | Interface reativa, modular e com deploy automatico                                      |
| Deploy          | Railway / Render                | Integracao continua via Dockerfile e deploy por `git push`                              |

---

### Arquitetura em Camadas (Clean Architecture)

```
src/
├── domain/                     # Regras puras e entidades (sem dependencias externas)
│   ├── entities/               # Product, Sale, SaleItem, User
│   └── errors/                 # AppError, NotFoundError, ConflictError, ValidationError, UnauthorizedError, ForbiddenError
├── application/                # Orquestracao de casos de uso e contratos
│   ├── services/               # ProductService, SaleService, ReportService, AuthService
│   ├── dto/                    # Schemas Zod e tipagem de entrada/saida (product, sale, report, auth)
│   └── ports/                  # Interfaces/contratos de repositorios
├── infrastructure/             # Implementacoes tecnicas concretas
│   ├── database/               # PrismaClient, Driver Adapter PG, Repositorios concretos
│   ├── http/                   # Controllers, routes, validacoes de request e Swagger docs
│   ├── middleware/             # Logging, Error Handler, AuthMiddleware, RateLimit
│   └── config/                 # Variaveis de ambiente tipadas
├── shared/                     # Logger Pino, constantes e utilitarios globais
frontend/                       # Aplicacao React 18 + Vite + TypeScript (PDV, Cardapio, Faturamento)
Dockerfile                      # Build multi-estagio (Frontend + Backend) com usuario node non-root
docker-compose.yml              # Ambiente de desenvolvimento com PostgreSQL 16
.env.example                    # Variaveis de ambiente documentadas
README.md                       # Documentacao do projeto
```

---

### Seguranca e Boas Praticas

- **Autenticacao JWT**: Tokens assinados e stateless (expiracao configuravel de 8h).
- **Bcrypt**: Hashing de senhas com salt rounds (10 rounds). Senhas nunca sao salvas em texto plano.
- **Helmet**: Adicao automatica de cabeçalhos de seguranca (Content-Security-Policy, X-Frame-Options, etc.).
- **CORS**: Whitelist explicita de origens autorizadas via variavel de ambiente `CORS_ORIGIN`.
- **Rate Limiting**: Bloqueio preventivo de ataques de forca bruta (100 requisicoes / 15 minutos por IP).
- **Sanitizacao de Dados**: Tratamento com Zod (trim, lowercase em emails, validacao de precos positivos).
- **Non-root user no Docker**: Aplicacao em producao roda sob o usuario `node` sem privilegios de root.

---

### Docker & Compose (Nivel 1)

```yaml
# docker-compose.yml (desenvolvimento local)
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://postgres:dev@db:5432/padaria
      JWT_SECRET: dev-secret-change-in-prod
      NODE_ENV: development
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./src:/app/src

  db:
    image: postgres:16-alpine
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: padaria
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

### Observabilidade e Diagnostico

- **Logs Estruturados**: Pino gerando JSON com formato parseavel.
- **Rastreabilidade**: `x-request-id` gerado via `crypto.randomUUID()` em todas as requisicoes.
- **Healthcheck Endpoint**: `GET /health` retorna status 200 com timestamp para monitoramento.
- **Privacidade de Logs**: Bloqueio de senhas, tokens ou dados pessoais em registros de log.

---

### Estrategia de Testes

- **Testes Unitarios**: Testes isolados de entidades e servicos de aplicacao (sem tocar banco).
- **Mocks Tipados**: Mock de `UserRepositoryPort`, `ProductRepositoryPort` e `SaleRepositoryPort`.
- **Meta de Cobertura**: 70%+ no geral, com 90%+ nas regras de negocio criticas (calculo de faturamento e desconto).

---

### Escopo e Limites do Projeto

#### O que faz parte do escopo:

- CRUD completo com ORM e type-safety (Produtos, Vendas, Usuarios).
- Autenticacao com JWT basico e hash Bcrypt.
- Validacao de schemas de entrada com Zod.
- Logs estruturados e correlacionados com Pino.
- Docker Compose para ambiente local e Dockerfile de producao.
- Testes unitarios automatizados com Jest.
- Error handling padronizado via middleware global.

#### O que NAO deve ser adicionado (Overengineering):

- Arquitetura de microsservicos.
- Orquestracao com Kubernetes.
- Cache distribuido com Redis.
- Mensageria e filas assincronas (RabbitMQ / Kafka).
- Arquitetura multi-tenant complexa.
- Modulos de feature flagging em nuvem.

---

## Nivel 2 - A Clinica da Dra. Fernanda

### O Problema

Fernanda e medica e atende 30 pacientes por dia. Ela precisa de agendamento online, prontuario eletronico, envio de lembretes por SMS, controle de acesso (medico vs recepcionista vs paciente). Dados sensiveis = LGPD. App nao pode cair em horario comercial.

### Stack

| Camada            | Tecnologia            | Por que                                                 |
| ----------------- | --------------------- | ------------------------------------------------------- |
| Framework         | NestJS                | Arquitetura modular, injecao de dependencia, escalavel  |
| Banco             | PostgreSQL (Supabase) | Backup automatico, RLS (row-level security), LGPD ready |
| Cache             | Redis                 | Sessoes, filas, cache de dados frequentes               |
| Fila de Jobs      | Bull (queue)          | Processar SMS/email assincrono (nao bloqueia user)      |
| SMS               | Twilio                | API brasileira, webhook de confirmacao                  |
| Email             | SendGrid              | Gratuito ate 100/dia, templates                         |
| API Documentation | Swagger/OpenAPI       | Auto-gerada, testa endpoints no browser                 |
| Deploy            | Railway Pro + Docker  | Escalabilidade, reload zero-downtime                    |
| Validacao         | Zod + class-validator | Schemas + decoradores NestJS                            |
| Autenticacao      | JWT + Refresh Token   | Melhor que Nivel 1                                      |

### Arquitetura (Padrão Modular NestJS / Vertical Slice)

```
src/
├── database/                       # Persistência e Driver Adapter PG
│   ├── prisma.service.ts           # Prisma Client com Driver Adapter PG
│   └── prisma.module.ts            # Módulo global de banco de dados
├── common/                         # Recursos transversais e compartilhados
│   ├── decorators/                 # @Roles(), @CurrentUser()
│   ├── guards/                     # JwtAuthGuard, RolesGuard
│   ├── interceptors/               # AuditInterceptor, LoggingInterceptor
│   ├── filters/                    # GlobalExceptionFilter
│   └── pipes/                      # ZodValidationPipe
├── modules/                        # Módulos de domínio e orquestração (alta coesão)
│   ├── auth/                       # AuthModule, AuthService, AuthController, DTOs, JwtStrategy
│   ├── appointments/               # AppointmentsModule, Service, Controller, DTOs, Cache Redis
│   ├── patients/                   # PatientsModule, Service, Controller, DTOs
│   ├── medical-records/            # MedicalRecordsModule, Service, Controller, DTOs (RLS)
│   ├── notifications/              # NotificationsModule, Service, BullMQ Processor (Twilio/SendGrid)
│   └── audit/                      # AuditModule, AuditService, Modelagem LGPD
├── app.controller.spec.ts          # Testes unitários do controller raiz
├── app.controller.ts               # Health check endpoint
├── app.service.ts                  # Lógica do health check
├── app.module.ts                   # Módulo raiz da aplicação
└── main.ts                         # Bootstrap NestJS, Helmet, CORS, Swagger, Pino Logger
Dockerfile                          # Build multi-estágio otimizado
docker-compose.yml                  # PostgreSQL 16 + Redis 7 + App
.dockerignore
.env.example
README.md
```

### Seguranca (Aprofundada)

- **JWT + Refresh Token**: Access token 15min, refresh token 7 dias
- **RBAC (Role-Based Access Control)**: admin, doctor, receptionist, patient com permissoes claras
- **Guards**: AuthGuard (verifica JWT), RolesGuard (verifica roles)
- **Audit Log**: Cada acao (criar, editar, deletar) grava: quem, quando, o que, IP
- **Soft Delete**: Nunca apaga dados, marca como deletado (LGPD: direito de recuperacao)
- **Row Level Security (RLS)**: Paciente so ve seus dados, medico so seus pacientes
- **Rate Limiting**: 100 requests/min por IP, 1000 requests/min por user
- **Backup criptografado**: Supabase backup automatico, encriptado
- **LGPD**: Termo de uso, politica de privacidade, consentimento explicito
- **Secrets**: Usar .env (Twilio API key, SendGrid API key) - NUNCA commitar
- **Input sanitization**: Trim, lowercase email, validar CPF
- **Email verification**: Confirmar email antes de usar conta
- **Password policy**: Min 8 caracteres, numbers + symbols

### Docker & Compose (Nivel 2)

```yaml
# Dockerfile multi-stage (otimizado)
FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist
USER node
HEALTHCHECK --interval=30s CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
EXPOSE 3000
CMD ["node", "dist/src/main.js"]

# docker-compose.yml (completo)
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/clinica
      REDIS_URL: redis://cache:6379
      JWT_SECRET: ${JWT_SECRET}
      TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID}
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_healthy
    volumes:
      - ./src:/app/src  # Hot reload em dev

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: clinica
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s

  cache:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s

volumes:
  postgres_data:
  redis_data:
```

### Observabilidade (Estruturada)

- **Pino + Bunyan**: JSON logs, contexto de request (requestId)
- **Request logging**: Cada request: metodo, URL, status, latencia, user
- **Error logging**: Stack trace completo, contexto, tipo de erro
- **Performance logging**: Queries lentas (>100ms), jobs que demoram
- **Health check endpoint**: Verifica DB, Redis, Twilio API
- **Metrics**: Contar requests por endpoint, erros por tipo
- **Nao logar**: Senhas, tokens JWT, dados de paciente raw

### Testing (Mais abrangente)

- **Unit tests**: Services isoladas (mock Prisma, Twilio, Redis)
- **Integration tests**: Rodar contra banco de teste (PostgreSQL em Docker)
- **Mock de APIs**: Mockar Twilio/SendGrid para nao usar creditos
- **Test database**: Migrations rodando em cada test suite
- **Coverage**: 80%+ (regras de negocio: 95%+)
- **Exemplo**: Testar "agendar consulta" checa disponibilidade, envia SMS

### Cache Strategy (Basica)

- **Sessions**: JWT em localStorage (cliente), nao precisa cache
- **Dados frequentes**: Horarios disponiveis do doctor (cache 1 hora)
- **Invalidacao manual**: Quando agendar, limpar cache de horarios
- **Pattern**: Cache-Aside (se nao achar em Redis, busca banco e salva)

### Error Handling & Resiliencia

- **AppError padronizado**: `new AppError("Mensagem", 400, "ERROR_CODE")`
- **Try-catch em services**: Capturar erros, logar, retornar mensagem clara
- **Global error handler**: Interceptor que converte erros em HTTP 400/500
- **Retry logic**: Jobs que falham (SMS nao chegou) retentar 3x com backoff
- **Circuit breaker simples**: Se Twilio cair 5x consecutivas, parar de tentar por 5min
- **Timeout**: Requisicoes para Twilio/SendGrid com timeout de 5s
- **Graceful shutdown**: Ao desligar, terminar jobs pendentes

### Custo: **R$ 80 - R$ 245/mes**

### ✅ Deve saber

- Arquitetura modular (NestJS modules)
- RBAC (roles, guards, permissoes)
- Fila de jobs (Bull + Redis)
- Integracao com API externa (Twilio)
- Soft delete + audit log (LGPD)
- Testes unitarios + integracao
- Docker Compose (dev replica prod)
- JWT + Refresh token (sessao stateless)
- Error handling padronizado
- Rate limiting
- Swagger/OpenAPI documentation
- Row Level Security (RLS) conceito

### ❌ NAO precisa

- Event Sourcing
- GraphQL
- Multi-tenant complexo
- CDN global
- Microservicos

### Projeto Pratico

**Implementar:**

1. Autenticacao com JWT + Refresh
2. RBAC: admin, doctor, receptionist, patient
3. Agendamento de consultas (horarios disponiveis)
4. Prontuario eletronico (patient pode ver seu, doctor pode ver seus pacientes)
5. Job de SMS de lembrete (Bull + Twilio)
6. Email de confirmacao (SendGrid)
7. Audit log: cada acao grava quem/quando/o que
8. Rate limiting por user
9. Soft delete de agendamentos cancelados
10. Swagger docs (POST /appointments, GET /appointments, etc)

**Testing:**

- Testar agendar sem horario disponivel (deve falhar)
- Testar paciente nao pode ver prontuario de outro
- Testar SMS envia assincrono (job na fila)

**Deploy:** Railway Pro (Docker + zero-downtime)

---

## Nivel 3 - O E-commerce do Lucas

### O Problema

Lucas vende produtos artesanais online. Precisa de catalogo com imagens, carrinho de compras, pagamento, controle de estoque, notificacoes de pedido e relatorios. ~500 usuarios/dia. Nao pode perder venda por indisponibilidade.

### Stack

| Camada          | Tecnologia                    | Por que                                                      |
| --------------- | ----------------------------- | ------------------------------------------------------------ |
| Framework       | NestJS ou FastAPI             | Tipagem, performance, DDD pronto                             |
| ORM             | Prisma + TypeORM              | Controle fino, relacionamentos complexos, query optimization |
| Banco           | PostgreSQL RDS Multi-AZ (AWS) | Failover automatico, backups diarios, read replicas          |
| Cache           | ElastiCache Redis Cluster     | Sessoes, cache de produtos, filas                            |
| Fila            | AWS SQS                       | Processamento assincrono confiavel                           |
| Pagamento       | Stripe                        | Tokenizacao, PCI DSS compliance, webhooks                    |
| Imagens         | AWS S3 + CloudFront           | CDN global, entrega rapida                                   |
| Email           | SendGrid                      | Transaccional, templates, opens/clicks tracking              |
| Seguranca       | Cloudflare Pro                | WAF, DDoS, SSL/TLS                                           |
| Observabilidade | Sentry + CloudWatch           | Error tracking, performance monitoring                       |
| Versioning      | API v1, v2 nos paths          | Evolucao sem quebrar clientes                                |
| API Docs        | Swagger + README              | Interactive docs                                             |

### Arquitetura (Clean Architecture completa)

```
src/
├── domain/                             # DDD completo
│   ├── entities/                       # Product, Order, Payment, Inventory
│   ├── value-objects/                  # Money, Email, SKU, Currency
│   ├── events/                         # OrderCreated, PaymentConfirmed, StockUpdated
│   ├── services/                       # DomainService (regras puras)
│   └── errors/                         # DomainError, InvalidOrderError
├── application/                        # Orquestracao
│   ├── use-cases/                      # CreateOrder, ListProducts, ProcessPayment
│   ├── dto/                            # Input (CreateOrderDTO), Output (OrderDTO)
│   ├── handlers/                       # Event handlers
│   ├── guards/                         # Auth, roles
│   └── mappers/                        # DTO ↔ Entity
├── infrastructure/                     # Implementacoes concretas
│   ├── database/                       # Prisma + migrations
│   ├── repositories/                   # ProductRepository, OrderRepository
│   ├── adapters/                       # StripeAdapter, S3Adapter, SQSAdapter
│   ├── http/                           # Controllers, routes, middleware
│   ├── queue/                          # SQS consumers
│   ├── external/                       # Stripe, Sendgrid, S3 clients
│   └── config/                         # AWS, Redis, Stripe config
├── shared/                             # Utils, constants, decorators
├── Dockerfile
├── docker-compose.yml (dev)
├── docker-compose.prod.yml
├── .env.example
├── terraform/                          # IaC (AWS infrastructure)
└── .github/workflows/ci-cd.yml         # GitHub Actions pipeline
```

### Seguranca (Nível Producao)

- **OAuth 2.0 + JWT**: Mais seguro que user/password simples
- **MFA (Multi-Factor Auth)**: TOTP (Google Authenticator) para admin
- **Rate limiting avancado**: Por endpoint, por user, por IP. Token Bucket algo
- **Idempotencia**: Header `Idempotency-Key` previne cobranca dupla
- **Tokenizacao**: Stripe cuida do cartao (nao toca dados brutos)
- **PCI DSS**: Via Stripe (nao implementar proprio payment processor)
- **Criptografia AES-256**: Dados sensiveis (tokens internos) encriptados no banco
- **WAF (Cloudflare)**: Protege contra SQLi, XSS, bots, DDoS
- **Audit log completo**: Exportavel para LGPD (users podem pedir seus dados)
- **Secrets rotation**: API keys rotacionadas automaticamente
- **CORS restritivo**: Whitelist de origins, nao "*"
- **HTTPS forced**: Redireciona HTTP → HTTPS
- **CSP (Content Security Policy)**: Previne XSS injection
- **Email verification**: Confirmar propriedade de email antes de usar
- **IP whitelist (admin)**: Ops so podem acessar de IPs conhecidos

### Docker & Compose (Nivel 3 - Producao Ready)

```yaml
# Dockerfile multi-stage + security
FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist
USER nodejs
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
EXPOSE 3000
CMD ["node", "dist/src/main.js"]

# docker-compose.yml (local dev - simula producao)
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://user:pass@db:5432/ecommerce
      REDIS_URL: redis://cache:6379
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_healthy
    volumes:
      - ./src:/app/src
      - ./dist:/app/dist

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: ecommerce
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s

  cache:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s

  # Mailhog: fake SMTP server para testar emails localmente
  mailhog:
    image: mailhog/mailhog
    ports:
      - "8025:1025"  # SMTP
      - "8081:8025"  # Web UI (localhost:8081)

volumes:
  postgres_data:
  redis_data:
```

### Observabilidade (Detalhada)

- **Structured logging**: Cada request tem ID unico, rastreavel end-to-end
- **Sentry integration**: Captura erros, stack trace, contexto, user info
- **Performance metrics**:
  - Latencia de requests (p50, p95, p99)
  - Database query time
  - Cache hit rate
  - Payment processing time
- **Business metrics**:
  - Orders por hora
  - Revenue por dia
  - Abandono de carrinho
  - Taxa de erro em pagamento
- **Health checks**:
  - Banco de dados
  - Redis
  - Stripe API
  - S3 acesso
- **Alertas**: Se erro rate > 5%, latencia p99 > 500ms, Sentry notifica

### Testing (Completo: Unit + Integration + E2E)

- **Unit tests**: Services isoladas, mocked dependencies (70%+ coverage)
- **Integration tests**: Contra banco de teste, transacoes revertidas
- **E2E tests**: Fluxo completo (login → buscar produto → comprar → confirmacao)
- **Mock de APIs**: Stripe mock (usando Stripe test keys)
- **Test fixtures**: Dados de teste reutilizaveis (products, users)
- **Database seeding**: Populate test data em migrations
- **Performance tests**: Verificar query N+1, index usage
- **Load tests**: Simular 100 usuarios simultaneos comprando
- **Exemplo**: "Comprar produto sem estoque deve retornar 400"

### Cache Strategy (Avancada)

- **Cache-Aside pattern**:
  - GET /products/:id → Redis miss → query banco → salva em Redis (TTL 1h)
  - UPDATE product → invalida cache daquele product
- **Write-Through**:
  - Salvar em cache AO MESMO TEMPO que banco (nao fica inconsistente)
- **Estoque produto**: Cache com TTL 30s (muda frequente, nao pode ficar stale)
- **Sessao user**: Redis (nao precisa chamar banco a cada request)
- **Invalidacao**: Event-driven (quando ordem é paga, invalida cache de estoque)

### Database Performance

- **Indexes**:
  - `product_id` em orders (WHERE product_id = ?)
  - `user_id` em orders (usuario quer ver suas ordens)
  - `created_at` em orders (relatorio por data)
  - Composite: (user_id, created_at) para "orders de user por data"
- **N+1 Query Prevention**:
  - BEM: `SELECT * FROM orders JOIN products ...` (1 query)
  - MAL: Loop orders, cada uma faz `SELECT product` (N queries)
  - Usar `.include()` no Prisma, nao `.select()` em loop
- **Lazy loading**: Evitar carregar dados nao necessarios
- **Pagination**: Sempre paginar lists (LIMIT 20, nao SELECT * sem limite)
- **Connection pooling**: Prisma ja gerencia, mas importante entender que existe
- **Query optimization**: EXPLAIN ANALYZE para queries lentas
- **Soft deletes**: Index em `deletedAt` para filtrar ativos
- **Partitioning**: Quando milhoes de orders, particionar por mes

### Error Handling & Resiliencia (Production-Grade)

- **Custom error classes**: `AppError`, `NotFoundError`, `ValidationError`, `PaymentError`
- **Retry logic com backoff exponencial**:
  - 1a tentativa: agora
  - 2a tentativa: 1s
  - 3a tentativa: 2s
  - 4a tentativa: 4s
  - Evita sobrecarregar servico que tá caindo
- **Circuit breaker**: Se Stripe falha 5x, parar de tentar por 5min (falhar fast)
- **Bulkhead isolation**: Se uma fila cai, nao derruba app todo
- **Timeout em tudo**:
  - Stripe payment: 10s timeout
  - S3 upload: 30s timeout
  - Database query: 5s timeout
- **Graceful degradation**: Se cache cai, continua usando banco (lento mas funciona)
- **Dead letter queue**: Jobs que falham 3x vao pra fila separada (análise depois)

### Custo: **R$ 355 - R$ 565/mes**

### ✅ Deve saber

- Clean Architecture + DDD basico (aggregates, entities, value objects)
- Adapter pattern (trocar Stripe por outro payment processor sem mexer regra negocio)
- Repository pattern (abstracao do banco)
- Event-driven architecture basica
- Cache patterns (Cache-Aside, Write-Through)
- Database performance (indexes, N+1, pagination)
- Idempotencia (prevenir cobrancas duplas)
- Error handling + resilience patterns (retry, circuit breaker, timeout)
- Testes unitarios + integracao + E2E
- CI/CD basico (GitHub Actions)
- AWS basics (RDS, S3, SQS, ElastiCache)
- Swagger/OpenAPI documentation
- Docker multi-stage builds
- Secrets management
- Observabilidade + alertas
- Load testing conceito

### ❌ NAO precisa

- Microservicos (monolito bem estruturado é suficiente)
- Kubernetes (ECS Fargate está bom)
- Event Sourcing (audit log simples funciona)
- CQRS (ainda nao precisa separar read de write)
- Multi-region (Brasil é suficiente)

### Projeto Pratico

**Implementar e-commerce:**

1. Catalogo de produtos (filtro, busca, paginacao)
2. Carrinho de compras (adiciona, remove, calcula total com imposto)
3. Checkout com Stripe (usar test keys)
4. Email de confirmacao (SendGrid)
5. Controle de estoque (subtract ao pagar, add se cancelar)
6. Admin pode gerar relatorios (CSV exportavel)
7. User pode ver historico de compras
8. Notificacoes: SMS quando produto volta ao estoque (job assincrono)
9. Imagens de produtos em S3
10. Auditlog: cada acao grava user, IP, timestamp

**Testing:**

- Testar compra sem estoque (deve falhar)
- Testar concorrencia: 2 usuarios comprando ultimo item (1 ganha, 1 perde)
- Testar Stripe webhook: simular pagamento confirmado

**Deploy:** AWS ECS Fargate (auto-scaling, zero-downtime)

---

## Nivel 4 - A Fintech da Maria

### O Problema

Maria criou um SaaS de controle financeiro para pequenas empresas. 10k usuarios ativos/dia, processamento de PIX, conciliacao bancaria, relatorios fiscais. Compliance com BACEN, LGPD e PCI DSS. Zero tolerancia para downtime. Multi-tenant. Dados sao o ativo principal.

### Stack

| Camada              | Tecnologia                              | Por que                                 |
| ------------------- | --------------------------------------- | --------------------------------------- |
| Framework           | NestJS                                  | Enterprise-ready, modular, DDD pronto   |
| Banco               | PostgreSQL RDS Multi-AZ + Read Replicas | HA, failover, replicacao                |
| Cache               | Redis Cluster                           | HA, replicacao, particionamento         |
| Fila                | AWS SQS + EventBridge                   | Event-driven, desacoplamento, HA        |
| Pagamento           | Stripe + BACEN PIX API                  | Multiplos gateways, webhooks confiáveis |
| Storage             | S3 + Glacier                            | Backup, compliance, long-term retention |
| Seguranca           | Cloudflare Enterprise + AWS WAF         | Protecao maxima, Bot Management         |
| Observabilidade     | DataDog + CloudWatch + AWS X-Ray        | Logs, traces, metricas, alertas         |
| Infra               | Terraform + ECS Fargate                 | IaC, auto-scaling, reproducivel         |
| Database Versioning | Liquibase / Flyway                      | Migrações versionadas, rollback         |
| Secrets             | AWS Secrets Manager                     | Rotacao automatica, auditavel           |
| Monitoring          | PagerDuty                               | On-call, escalation, post-mortem        |

### Arquitetura (Monolito modular + event-driven)

```
src/
├── domain/                                 # DDD completo, agregados
│   ├── entities/                           # Aggregates: Account, Transaction, User
│   ├── value-objects/                      # Money, Currency, BankAccount, PIX
│   ├── services/                           # DomainService (regras puras)
│   ├── events/                             # AccountCreated, TransactionProcessed, PIXReceived
│   ├── repositories/                       # Interface (contrato), nao implementacao
│   └── errors/                             # DomainError + especializacoes
├── application/                            # CQRS leve
│   ├── commands/                           # CreateAccount, ProcessPayment, ExportReport
│   ├── queries/                            # GetBalance, ListTransactions, GetReport
│   ├── handlers/                           # CommandHandler, QueryHandler
│   ├── event-handlers/                     # Quando evento dispara, faz algo
│   ├── dto/                                # Input/Output tipados
│   ├── ports/                              # Interfaces (Stripe adapter, PIX adapter)
│   └── mappers/                            # DTO ↔ Entity
├── infrastructure/                         # Implementacoes concretas
│   ├── database/                           # Prisma + TypeORM, migrations (Liquibase)
│   ├── repositories/                       # ProductRepository impl (concreta)
│   ├── adapters/                           # StripeAdapter, PIXAdapter, S3Adapter
│   ├── http/                               # Controllers, routes, middleware, interceptors
│   ├── queue/                              # SQS consumers, Bull workers
│   ├── external/                           # Stripe, Twilio, S3, BACEN clients
│   ├── security/                           # RLS, encryption, audit
│   ├── observability/                      # Sentry, DataDog client
│   └── config/                             # AWS, Redis, Database, Secrets
├── shared/                                 # Utils, constants, decorators, guards
├── tests/                                  # Testes (unit, integration, E2E)
├── Dockerfile
├── docker-compose.yml (dev)
├── docker-compose.prod.yml
├── .env.example
├── terraform/                              # IaC (ECS, RDS, ElastiCache, SQS)
├── .github/workflows/
│   ├── ci.yml                              # Lint, test, build
│   ├── cd.yml                              # Deploy (blue-green)
│   └── security-scan.yml                   # SAST, dependency check
├── docs/
│   ├── ADR/                                # Architectural Decision Records
│   ├── runbook/                            # "Database caiu, o que fazer?"
│   └── disaster-recovery.md                # RTO/RPO
└── README.md
```

### Seguranca (Nível Compliance)

- **OIDC + OAuth 2.0**: SSO, nao foca em user/password
- **MFA obrigatorio**: TOTP (Google Authenticator) + backup codes
- **mTLS**: Comunicacao interna (app → database, queue) usa certificados
- **Row Level Security (RLS)**:
  - Tenant A so ve suas contas/transacoes
  - Tenant B so ve suas contas/transacoes
  - Implementado no banco (nao na app, mais seguro)
- **Audit log WORM** (Write Once Read Many):
  - Immutable (nao pode alterar)
  - Exportavel em compliance request
  - Quem: user ID, quem autorizou
  - O que: mudou de qual estado para qual
  - Quando: timestamp preciso
  - IP de origem
- **Secrets management**:
  - Nenhum secret em .env ou codigo
  - AWS Secrets Manager: rotacao automatica (a cada 30 dias)
  - Auditavel: quem acessou qual secret, quando
- **Zero Trust Network**:
  - Nada é confiado por padrao
  - Cada request requer autenticacao
  - VPC isolada (app, db, cache em subnet privada)
  - IP whitelist para admin access
- **Criptografia em transit**: TLS 1.3 pra tudo
- **Criptografia em rest**: AES-256 pra dados sensiveis (PIX keys)
- **PCI DSS**: Stripe cuida tokenizacao, nao toca numero cartao
- **BACEN compliance**: PIX API, logs de transacao, limite diario
- **LGPD**:
  - Direito ao esquecimento (anonimizar dados)
  - Portabilidade (exportar em JSON)
  - Consentimento explicito gravado
  - DPO (Data Protection Officer) designado
- **Anti-fraude**:
  - Deteccao de anomalia em tempo real (ML)
  - Limite diario por usuario
  - Verificacao de PIX key (validar destinatario)
  - Geolocation check (transacao de pais inesperado)
- **IP whitelist**: Admin so pode acessar de IPs conhecidos
- **Session timeout**: 30 min inatividade = logout
- **Logout em todos devices**: User pode deslogar de todos browsers
- **Biometric auth**: Touch ID / Face ID (mobile)

### Docker & Compose (Nivel 4 - Ultra Produção)

```yaml
# Dockerfile ultra otimizado
FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build && npm prune --production

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init  # Init process para sinais
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist
USER nodejs
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
EXPOSE 3000
ENTRYPOINT ["/sbin/dumb-init", "--"]
CMD ["node", "dist/src/main.js"]

# docker-compose.yml (local - dev, replica prod)
version: '3.9'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://user:${DB_PASS}@db:5432/fintech
      REDIS_URL: redis://cache:6379
      AWS_REGION: us-east-1
      BACEN_PIX_URL: https://pix-api.bacen.gov.br
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_healthy
    networks:
      - fintech-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    volumes:
      - ./src:/app/src

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${DB_PASS}
      POSTGRES_DB: fintech
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - fintech-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  cache:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
    networks:
      - fintech-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

networks:
  fintech-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### Observabilidade (Enterprise Grade)

- **Distributed tracing (AWS X-Ray)**: Rastrear request through all services
  - App → SQS → worker → banco → Stripe
  - Ver exatamente onde trava
- **Structured logging (Pino + DataDog)**:
  - Cada log é JSON parseable
  - Correlacao via requestId
  - Busca por user, transaction ID, etc
- **Business metrics**:
  - PIX processadas/hora
  - Revenue/dia
  - Taxa de erro por endpoint
  - Latencia p50, p95, p99
- **Infrastructure metrics**:
  - CPU, memory, disk usage
  - Database connections
  - Cache hit rate
  - SQS queue depth
- **Alertas inteligentes**:
  - Error rate > 5% → Sentry + PagerDuty
  - Latencia p99 > 500ms → PagerDuty
  - Queue depth > 1000 → scale up workers
  - Storage usage > 80% → alert
- **Post-mortem automatizado**: Quando erro, gerar report com contexto
- **Custom dashboards**: Revenue, queue depth, errors, latencia

### Testing (Completo)

- **Unit tests** (70%): Services, use-cases, domain logic
- **Integration tests** (20%): Controllers, repositorio + banco real
- **E2E tests** (10%): Fluxo completo (login → criar conta → transacao)
- **Load tests**: 1000 requisicoes/segundo, manter latencia < 200ms
- **Chaos testing**: "Database connection pool satura" → app continua respondendo?
- **Security tests**: OWASP top 10 (SQLi, XSS, CSRF)
- **Performance tests**: Query < 50ms, endpoint < 100ms

### Event-Driven (Basico)

- **Domain events**: `TransactionProcessed`, `AccountCreated`, `PIXReceived`
- **Handlers**: Quando `TransactionProcessed`, enviar email + log analytics
- **Async**: Events publicados em SQS, consumidos por workers
- **Resiliencia**: Se handler falha, retry automático

### Data Migration & Backup

- **Liquibase / Flyway**: Migrações versionadas
  - 001_initial_schema.sql
  - 002_add_pix_column.sql
  - Rollback automatico se falhar
- **Zero-downtime deployment**:
  - Deploy new schema
  - Run migration (se quebra, rollback)
  - Switch app versão (blue-green)
- **Backup strategy**:
  - Daily backup (full)
  - Hourly backup (incremental)
  - Replicate to different region
  - RTO: 1 hour (restaurar do backup em 1h)
  - RPO: 1 hour (perder no maximo 1h de dados)
- **Disaster recovery**:
  - Testar restore mensalmente (nao eh fake)
  - Documentado em runbook
  - On-call engineer sabe fazer

### Custo: **R$ 2.870 - R$ 5.820/mes**

### ✅ Deve saber

- DDD completo (aggregates, bounded contexts, domain events)
- Event-driven architecture (publicar-subscrever)
- CQRS (separar commands de queries)
- Multi-tenant architecture (RLS, data isolation)
- Observabilidade enterprise (tracing, metricas, logs estruturados)
- IaC (Terraform: reproducivel, versionado)
- Blue-green deployment (zero downtime)
- Disaster recovery (RTO/RPO)
- Database versioning (Liquibase, zero-downtime migrations)
- Security compliance (BACEN, LGPD, PCI DSS)
- Load testing (simular picos)
- Chaos engineering (o que acontece quando falha?)
- On-call culture (runbook, post-mortem)

### ❌ NAO precisa

- Microservicos (monolito modular é melhor ate 50 devs)
- Kubernetes (ECS Fargate é gerenciado, simpler)
- Próprio payment processor (Stripe já faz)
- Próprio fraud detection ML (terceirizar)

### Projeto Pratico (Fintech MVP)

**Implementar SaaS de controle financeiro:**

1. Onboarding multi-tenant (tenant A, B, C isolados)
2. Criar conta bancaria virtual (gera IBAN ficticio)
3. Processar PIX (mock BACEN API)
4. Conciliacao automatica (reconcile banco com registros)
5. Relatorio de fluxo de caixa (exportar PDF)
6. Integracao Stripe (débito recorrente)
7. Notificacoes: transacao recebida, alerta limite
8. Audit log completo (quem, quando, o que, IP)
9. Admin pode visualizar debug dashboard (metricas, erros)
10. Disaster recovery: testar backup/restore

**Testing & Deployment:**

- Testar 2 tenants ao mesmo tempo (isolamento funciona?)
- Testar concorrencia: 2 transacoes simultâneas pra mesma conta
- Load test: 100 transacoes/segundo por 5 min
- Security test: tentar acessar dados de outro tenant (deve falhar)
- Deploy com zero downtime (blue-green)

---

## Clean Architecture: Regra de Ouro

```
DEPENDENCIA APONTA PARA DENTRO

┌─────────────────────────────────────────┐
│  Frameworks & Drivers (Express, Prisma) │ (Substituivel)
├─────────────────────────────────────────┤
│  Interface Adapters (Controllers, DTOs) │ (Adapta pra external)
├─────────────────────────────────────────┤
│  Application (Use Cases, Services)      │ (Orquestracao)
├─────────────────────────────────────────┤
│  Entities & Domain (Regras Puras)       │ (Core negocio)
└─────────────────────────────────────────┘
```

### O que isso significa na pratica

- **Entities**: NAO importam Express, Prisma, qualquer framework
  - Sao regras puras: "calcular desconto", "validar saldo"
  - Testavel sem banco, sem HTTP

- **Use Cases**: Orquestram regras (entities)
  - "Processar pagamento" = valida saldo + desconta + audit + notifica
  - Conhecem entities, nao conhecem HTTP ou banco

- **Controllers**: Pegam HTTP, chamam use cases
  - Conversao DTO → Entity → resposta HTTP
  - "HttpController nao é negocio, é delivery mechanism"

- **Frameworks**: Implementam a camada mais externa
  - Express, Prisma, Redis são trocáveis
  - Trocar Express por Fastify? Só muda controllers

### Benefício Pratico

Se amanhá voce quer trocar:

- **Stripe por PagSeguro?** Só muda adapter (infrastructure), regra de negocio fica igual
- **PostgreSQL por MongoDB?** Só muda repository, entities iguais
- **Express por Fastify?** Só muda controllers, services iguais

> Clean Architecture = **Inversao de dependencia** = codigo limpido + testavel + flexivel

---

## Quando Transitar Entre Niveis

Nao é sobre tamanho de empresa, é sobre **sinais**:

### Sair do Nível 1 (Padaria) → Nível 2 (Clinica)

**Sinais:**

- Latencia > 200ms (usuários reclamando lentidao)
- Erro de timeout de conexão (máquina Railway esgota memória)
- Precisa processar coisas longas (enviar email leva 5s, bloqueia request)
- Dados sensiveis (LGPD, audit log obrigatorio)
- Multiplos papéis (admin, user, moderator com permissoes diferentes)
- App cai frequentemente (monolito simples nao segura)

**Ação:**

- Upgrade: Railway free → Railway Pro
- Adicionar: NestJS (estrutura melhor), Redis (cache + fila)
- Implementar: RBAC, audit log, soft delete

### Sair do Nível 2 (Clinica) → Nível 3 (E-commerce)

**Sinais:**

- ~500+ users/dia, nao é mais "hobby"
- Latencia p99 > 500ms (precisa otimização)
- Concorrencia (2 pessoas comprando ultimo item, quem ganha?)
- Business critico (nao pode perder venda)
- Precisa escalar rapidamente (Black Friday)
- Dados valiosos (pagamento, nao pode perder)

**Ação:**

- Upgrade: Railway Pro → AWS RDS Multi-AZ
- Adicionar: Clean Architecture, DDD, testes completos
- Implementar: Database performance, caching avancado, error handling robusto
- Ferramenta: GitHub Actions CI/CD

### Sair do Nível 3 (E-commerce) → Nível 4 (Fintech)

**Sinais:**

- 10k+ users/dia, nao tem "off hours"
- Multi-tenant (varios clientes com dados isolados)
- Compliance rigoroso (BACEN, LGPD, PCI DSS)
- Zero downtime (deployment durante horario comercial)
- Transacoes financeiras (nao pode perder centavo)
- Auditoria imutavel (compliance investigacoes)

**Ação:**

- Upgrade: AWS RDS standalone → RDS Multi-AZ + read replicas
- Adicionar: DDD completo, CQRS, event-driven
- Implementar: Row Level Security, secrets rotation, mTLS
- Ferramenta: Terraform IaC, DataDog observability, PagerDuty on-call

### Tabela de Transicao

| Metricas            | Nivel 1  | Nivel 2  | Nivel 3    | Nivel 4    |
| ------------------- | -------- | -------- | ---------- | ---------- |
| Users/dia           | <50      | 50-500   | 500-5k     | 5k-50k     |
| Uptime esperado     | 95%      | 99%      | 99.5%      | 99.9%      |
| Latencia p99 target | <500ms   | <300ms   | <200ms     | <100ms     |
| Time size           | 1-2 devs | 2-4 devs | 4-8 devs   | 8+ devs    |
| On-call?            | Nao      | Talvez   | Sim        | Sim        |
| Auto-scaling?       | Nao      | Manual   | Automatico | Automatico |

---

## Error Handling & Resiliencia

### Estratégia Geral

```
CLIENT REQUEST
    ↓
[TIMEOUT: 5s]
    ↓
[TRY REQUEST]
    ├─ Success → RESPOND 200
    └─ Fail → [RETRY com backoff]
        ├─ Attempt 1: agora
        ├─ Attempt 2: +1s
        ├─ Attempt 3: +2s
        ├─ Attempt 4: +4s
        └─ All fail → RESPOND 503 (Service Unavailable)
```

### Padroes Essenciais

#### 1. Custom Error Classes

```
AppError (base)
├── ValidationError (400)
├── NotFoundError (404)
├── AuthError (401)
├── ForbiddenError (403)
├── ConflictError (409)
└── InternalServerError (500)

Cada erro tem:
- message: mensagem user-friendly
- code: ERROR_CODE (maquina-readable)
- statusCode: HTTP status
- details: contexto adicional
```

#### 2. Retry Logic com Exponential Backoff

- Nao retentar tudo (alguns erros sao permanentes)
- Retry-able: Timeout, network error, 503 Service Unavailable
- Nao retry: 400 Bad Request, 401 Unauthorized, 404 Not Found
- Max attempts: 3-5
- Jitter: +random(0-1000ms) pra nao sobrecarregar ao mesmo tempo

#### 3. Circuit Breaker

- Stripe cai (5 requests falhando): parar de tentar por 5 minutos
- Retorna erro rapido ao user: "Pagamento indisponivel, tente depois"
- Protege servico externo (nao enviar 10k requests pra servico caido)
- Estados: Closed (ok) → Open (falhas) → Half-open (testando) → Closed

#### 4. Timeout em Tudo

- Database query: 5s
- External API: 10s
- File upload: 30s
- Nao deixar requisicao pendurada forever

#### 5. Bulkhead (Isolamento)

- Job de SMS falha? Nao derruba app todo
- Cache cai? Continua usando banco (lento, mas ok)
- Isolamento por contexto (filas separadas, threads separadas)

#### 6. Graceful Degradation

```
Ideal: app + cache + queue + stripe
Stripe cai → app + cache + queue (enfilera, processa depois)
Cache cai → app + queue + stripe (mais lento, mas ok)
Queue cai → app + cache + stripe (sincrono, timeout)
App cai → nothing works
```

#### 7. Dead Letter Queue

- Job de SMS falha 3x → vai pra DLQ
- Humano analisa depois: por que falhou?
- Reprocessar manualmente se necessario

### Logging com Contexto

Nao logar:

```
console.log("User login")  // vago
```

Logar assim:

```
logger.info('user.login', {
  userId: "usr-123",
  email: "user@example.com",
  ip: "192.168.1.1",
  timestamp: "2026-08-16T10:30:00Z",
  device: "Chrome on macOS"
})
```

Que permite buscar depois: "Todos os logins do user-123 em agosto"

---

## Observabilidade Desde o Comeco

### Nível 1 Minimo

- **Logging**: Pino com JSON (nao console.log)
- **Each request**: requestId único, rastreavel
- **Errors**: Stack trace, contexto
- **Health check**: GET /health returns 200 if ok
- **Nao logar**: Senhas, tokens

### Nível 2: Adicionar

- **Request logging**: Metodo, URL, status, latencia, user
- **Performance**: Query > 100ms = log (possivel N+1)
- **Audit log**: Quem fez o que, quando
- **Database connection pool**: Monitorar saturacao

### Nível 3: Adicionar

- **Distributed tracing**: X-Ray, rastrear request through system
- **Sentry integration**: Erros em tempo real, grupos, re-opening
- **Business metrics**: Orders/hora, revenue/dia, abandono carrinho
- **Performance budgets**: p99 latencia target por endpoint
- **Alertas**: Error rate > 5% = notifica

### Nível 4: Adicionar

- **DataDog**: Logs + APM + Infrastructure metrics
- **Custom dashboards**: Revenue, queue depth, errors by endpoint
- **Predictive alerts**: ML detecta anomalia
- **Service SLOs**: 99.9% uptime = alert se cai pra 99.8%
- **On-call rotacao**: PagerDuty com escalation

---

## Testing Strategy Completa

### Test Pyramid (relacao ideal)

```
      △
     / \
    /   \  E2E Tests (10%)
   /─────\
  /       \
 /         \  Integration Tests (30%)
/───────────\
           \ Unit Tests (60%)
```

### Unit Tests (Services, Entities)

```
- Mock dependencies (Prisma, Twilio, Stripe)
- Testar regras puras
- Rapido (< 1s cada teste)
- Exemplo: "calcular desconto de 10% em R$ 100 = R$ 90"
- Coverage: 70%+ (logica critica: 95%+)
- Rodar: npm test
```

### Integration Tests (Controllers + Real Database)

```
- Use test database (PostgreSQL em Docker)
- Cada teste: transaction que reverte apos
- Testar fluxos completos (criar user → login → criar order)
- Mais lentos (2-5s cada teste)
- Example: "Comprar produto sem estoque deve falhar com 400"
- Rodar: npm test:integration
```

### E2E Tests (Full Stack)

```
- App rodando, banco real, APIs mockadas
- Simular usuario real (UI clicks, form fills)
- Exemplo: "User faz login, compra produto, recebe email"
- Tools: Cypress, Playwright, WebdriverIO
- Rodar: npm test:e2e
- Lento (1-2 min suite), mas garante fluxo user-to-user
```

### Test Fixtures & Seeds

```
beforeEach: Limpar banco, seedar dados de teste
- 5 usuarios
- 20 produtos
- 10 orders
afterEach: Rollback de todas as changes
```

### Mocking APIs Externas

```
Stripe: Usar stripe.com/docs/testing (test keys)
Twilio: Mockar requests (nao chamar API real)
BACEN: Mock com responses predefinidas
Isso economiza creditos e torna testes deterministicos
```

### Performance Tests

```
Verificar:
- Query N+1 detection (EXPLAIN ANALYZE)
- Index usage (indexes covering queries)
- Connection pool size (nao sobrecarregar)
- Tools: autocannon (load test), clinic.js (profiling)
```

---

## Docker & Compose Essencial

### Por que Docker (Resumao)

| Antes (sem Docker)                       | Com Docker                    |
| ---------------------------------------- | ----------------------------- |
| "Funciona na minha máquina"              | Mesma imagem dev/staging/prod |
| npm install localmente (versões flutuam) | Versão fixa no Dockerfile     |
| Ruby 2.7 vs 3.0 bugs                     | Node 22 LTS em tudo           |
| Deploy: SSH, git pull, npm install       | Deploy: docker run imagem:tag |
| 45 min setup novo dev                    | 5 min: docker compose up      |

### Dockerfile Otimizado (Resumo)

```
1. Multi-stage: builder stage (build) + runtime stage (execute)
   → Reduz tamanho imagem (500MB → 150MB)

2. Layer caching: ordem importa
   COPY package*.json (antes de COPY . .)
   → Reusa cache se package.json nao mudou

3. .dockerignore: exclui node_modules, .git
   → Menos bytes copiados

4. Alpine base: node:22-alpine (45MB) vs node:22 (1GB)
   → Minimal, seguro

5. Non-root user: USER nodejs
   → Seguranca (nao roda como root)

6. Health check: app pode verificar se tá saudavel
   HEALTHCHECK CMD curl localhost:3000/health

7. Signals: dumb-init para passar SIGTERM corretamente
   → Graceful shutdown
```

### Docker Compose (Local Development)

```
Replica producao:
- app: sua aplicacao
- db: PostgreSQL
- cache: Redis
- mailhog: fake SMTP (testar email)

docker compose up: tudo roda
docker compose down: tudo para (volumes mantidos)
docker compose down -v: limpar tudo (fresh start)
```

### Secrets em Docker

```
ERRADO:
RUN git clone https://github.com/user:PASSWORD@repo.git

CERTO:
- .env (nao commitar)
- docker-compose.yml lê .env
- Production: AWS Secrets Manager
```

### CI/CD + Docker

```
GitHub Actions:
1. Checkout code
2. Build imagem Docker
3. Run tests (npm test)
4. Push pra registry (ECR, DockerHub)
5. Deploy: atualiza ECS task com nova imagem

Beneficio: reproducivel (mesma imagem que rodou testes)
```

---

## Database Performance

### Indexes

**Quando criar:**

- WHERE id = ? (ID sempre tem index)
- WHERE user_id = ? (foreign keys)
- WHERE created_at > ? (data ranges)
- Composite: (user_id, created_at) para "meus pedidos por data"

**Como validar:**

```
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 1
```

Se "Seq Scan" = problema, adicionar index

### N+1 Query Problem

**ERRADO:**

```
users = SELECT * FROM users  // 1 query
FOR EACH user:
  orders = SELECT * FROM orders WHERE user_id = user.id  // N queries
Total: 1 + N queries (N = 1000 → 1001 queries!)
```

**CERTO:**

```
SELECT users.*, orders.* FROM users
JOIN orders ON orders.user_id = users.id
// 1 query só
```

Usar `.include()` (Prisma) ou `.leftJoinAndSelect()` (TypeORM)

### Pagination

```
ERRADO:
SELECT * FROM orders  // sem LIMIT

CERTO:
SELECT * FROM orders LIMIT 20 OFFSET 0  // pagina 1
SELECT * FROM orders LIMIT 20 OFFSET 20  // pagina 2
```

### Connection Pooling

Prisma ja cuida (pool padrão: 5 conexoes), mas saber que existe:

- 5 conexoes simultâneas ao banco
- Se 6a requisicao chega, fica na fila
- Se muita concorrencia, aumentar pool (mas caro)

### Query Optimization

```
Ferramenta: EXPLAIN ANALYZE
Procurar:
- Seq Scan (lento, sem index)
- High "Total Cost"
Solucao: Adicionar index apropriado
```

### Lazy Loading vs Eager Loading

```
ERRADO (Lazy):
product = SELECT * FROM products WHERE id = 1
category = SELECT * FROM categories WHERE id = product.category_id
// 2 queries

CERTO (Eager):
product = SELECT products.*, categories.* FROM products
         LEFT JOIN categories ON ...
         WHERE products.id = 1
// 1 query
```

---

## Cache Strategies

### Cache-Aside (Mais comum)

```
GET /products/1
├─ Check Redis: MISS
├─ Query DB: SELECT product WHERE id = 1
├─ Save to Redis: SET product:1 value TTL 1h
└─ Return value

Proxima vez:
GET /products/1
├─ Check Redis: HIT
└─ Return value (sem tocar DB)

When to invalidate:
UPDATE product → DELETE product:1 from Redis
```

### Write-Through

```
UPDATE product
├─ Update DB
├─ Update Redis (ao mesmo tempo)
└─ Return

Beneficio: Cache nunca fica stale
Risco: Se Redis falha, UPDATE falha (mais rigoroso)
```

### Write-Behind (Mais complexo)

```
UPDATE product
├─ Update Redis (imediatamente)
├─ Enfileira update DB (assincrono)
└─ Return (ao user parece rapido)

Risco: Se app cai antes de persistir no DB, perder dados
Use only for non-critical data
```

### TTL (Time To Live)

```
Cache de 1 hora (3600s):
├─ Dado critico: 5 min (300s)
├─ Dado comum: 1 hora (3600s)
├─ Dado frio: 24 horas (86400s)
```

### Cache Stampede (Thundering Herd)

**Problema:**

```
Cache expira (TTL = 0)
100 usuarios simultaneos pedem dados
100 queries no banco ao mesmo tempo
DB sobrecarregado
```

**Solucao: Lock ou Probabilidade**

```
Quando Redis miss:
├─ Check se outro thread tá buscando (lock)
├─ Se sim, esperar ele terminar
├─ Se nao, comeca busca (lock)
└─ Depois libera lock
```

---

## Secrets & Seguranca Aprofundada

### Tipos de Secrets

```
Tier 1 (ULTRA Critico):
- Chave privada do aplicacao
- Master password do banco
- API key Stripe production

Tier 2 (Critico):
- JWT secret
- Twilio API key
- SendGrid API key

Tier 3 (Sensivel):
- CORS whitelist
- Environment (prod vs dev)
```

### Onde Guardar

**NUNCA em código:**

```
// ERRADO
const STRIPE_KEY = 'sk_live_...'
```

**Dev:**

```
.env (nao commitar)
docker-compose com env_file: .env
```

**Producao:**

```
AWS Secrets Manager (rotacao automatica)
HashiCorp Vault (self-hosted)
Azure Key Vault
```

### Rotation

```
Secrets devem rotacionar automaticamente:
- A cada 30 dias (compliance requirement)
- Sem downtime (new key deployed, old key vira stale)
- Auditavel (quem rotacionou, quando)
```

### Criptografia

**Em Transit (while moving):**

- HTTPS (TLS 1.3 minimum)
- mTLS entre servicos internos

**At Rest (stored):**

- Senhas: Bcrypt + salt
- Tokens internos: AES-256
- PII (Email, Phone): Tokenizar ou anonimizar

### OWASP Top 10 (Conhecer)

1. **Injection**: Use ORM (not raw SQL)
2. **Broken Authentication**: Strong password policy + MFA
3. **Sensitive Data Exposure**: Encrypt PII
4. **XML External Entities (XXE)**: Disable XML features
5. **Broken Access Control**: RBAC, RLS
6. **Security Misconfiguration**: Security headers (Helmet), no default creds
7. **XSS**: Input sanitization, CSP headers
8. **Insecure Deserialization**: Validate JSON schemas
9. **Using Components with Known Vulnerabilities**: npm audit regularly
10. **Insufficient Logging**: Audit log everything

### Rate Limiting

**Fixed Window:**

```
100 requests/min
Minuto 0-59: counter = 0
Minuto 59-119: counter = 0
├─ Problem: Spike at minute boundary
```

**Sliding Window:**

```
100 requests in last 60 seconds
├─ More accurate
├─ More CPU intensive
```

**Token Bucket:**

```
Bucket = 100 tokens
Each request = 1 token
Refill 100 tokens/minute
├─ Allows bursts (if 50 queued, consume 50 tokens)
├─ Most flexible
```

### API Key Rotation

```
1. Deploy new key
2. Both old + new keys valid
3. Clients gradually update
4. After 30 days, old key invalid
5. Audit log tracks rotation
```

---

## Resumo de Custos

| Nivel          | Custo/mes      | Setup             | Stack                                    |
| -------------- | -------------- | ----------------- | ---------------------------------------- |
| 1 - Padaria    | R$ 0-28        | Express + Vercel  | Node + Railway + Vercel                  |
| 2 - Clinica    | R$ 80-245      | NestJS + Supabase | NestJS + Supabase + Redis + Twilio       |
| 3 - E-commerce | R$ 355-565     | NestJS + AWS      | AWS RDS + S3 + SQS + Redis + Cloudflare  |
| 4 - Fintech    | R$ 2.870-5.820 | Enterprise        | ECS + RDS Multi-AZ + DataDog + Terraform |

---

## Checklist do Junior (Completo)

### Basico (Obrigatorio)

- [ ] Tem **CRUD completo** rodando online (criar, ler, atualizar, deletar)
- [ ] O código está em **GitHub** com README claro
- [ ] **Autenticacao JWT** implementada (login/logout)
- [ ] Usa **ORM** (Prisma/TypeORM), nao SQL cru
- [ ] **Validacao de entrada** (Zod/class-validator)
- [ ] **Deploy funcionando** (Railway/Render/AWS, nao so local)
- [ ] Tem **variáveis de ambiente** (.env.example documentando)
- [ ] README explica: "Como rodar localmente em 5 min"
- [ ] **Commits organizados** (commits atomicos, mensagens claras)
- [ ] **Codigo segue padrao** (Clean Arch, MVC, algo deliberado)

### Testing

- [ ] Tem **testes unitários** (Jest, at least some)
- [ ] Testes passam: `npm test` roda sucesso
- [ ] **Coverage > 50%** (logica critica > 80%)
- [ ] Teste: "Criar produto sem preco deve falhar"
- [ ] Teste: "User nao pode ver dados de outro user"

### Observabilidade

- [ ] **Logs estruturados** (Pino, nao console.log)
- [ ] **Health check endpoint** (GET /health retorna 200)
- [ ] Cada request tem **ID unico** (rastreavel)
- [ ] **Erros listam stack trace** (nao vago)

### Docker

- [ ] **Dockerfile existe** e funciona
- [ ] `docker build -t app . && docker run -p 3000:3000 app` **funciona**
- [ ] **docker-compose.yml** com app + postgres
- [ ] `.dockerignore` configurado
- [ ] **Non-root user** no Dockerfile
- [ ] **Health check** no Dockerfile

### Seguranca

- [ ] **Senhas** usando Bcrypt (nao plain text)
- [ ] **JWT secret** em .env (nao em codigo)
- [ ] **Helmet.js** ou headers de seguranca equivalentes
- [ ] **CORS whitelist** (nao "*")
- [ ] **Input sanitization** (validacao, nao qualquer coisa)
- [ ] **Nao loga** senhas, tokens, dados sensiveis
- [ ] **Zod ou similar** pra validar requests

### Extras (Nice-to-have)

- [ ] **Swagger/OpenAPI** documentation
- [ ] **Testes de integracao** (rodar contra banco real)
- [ ] **Soft delete** (nao apaga, marca deletado)
- [ ] **Audit log** (quem fez o que, quando)
- [ ] **Rate limiting** (basico)
- [ ] **GitHub Actions** (CI: lint + test ao fazer push)
- [ ] **Error handling** padronizado (nao `throw new Error()` generico)
- [ ] **Graceful shutdown** (fechar conexoes antes de morrer)

---

## Faixa Salarial no Brasil (Backend, 2026)

| Nivel                     | Faixa              | Onde trabalha                    |
| ------------------------- | ------------------ | -------------------------------- |
| Estagiario                | R$ 1.200 - 2.000   | Startups, agencias               |
| Junior (0-2 anos)         | R$ 3.500 - 6.000   | Early-stage, consultoria         |
| Pleno (2-5 anos)          | R$ 6.000 - 12.000  | Scale-ups, empresas mid-size     |
| Senior (5+ anos)          | R$ 12.000 - 22.000 | Fintechs, big tech, especialista |
| Staff/Principal (8+ anos) | R$ 22.000 - 35.000 | Tech lead, arquiteto, VP Eng     |

**Context:**

- Remoto (in-house) tende a ser 20-30% mais que presencial
- Startups Early-stage: 50-80% do salário proporcional (equity compensation)
- Big Tech (Google, Meta, etc): 2-3x acima média
- Consultorias (Accenture, TCS): -20% vs mercado
- Fintechs crescentes: +30% vs média (competem por talent)

---

## Roadmap de Aprendizado (12 Semanas)

### Fase 1: Fundamentos (Semanas 1-2) | Custo: R$ 0

**JavaScript/Node.js:**

- Event loop (por que async/await existe)
- Promises vs callbacks
- Modules (require vs import)
- npm + package.json

**HTTP:**

- Metodos (GET, POST, PUT, DELETE)
- Status codes (200, 400, 404, 500)
- Headers (Content-Type, Authorization)
- CORS basico

**Git:**

- Commit, branch, merge
- Pull request workflow

**Terminal:**

- Navegacao (cd, ls, mkdir)
- Pipes (|, >, >>)
- Permissoes (chmod, sudo)

### Fase 2: Backend Basico (Semanas 3-4) | Custo: R$ 0

**Express.js:**

- Rotas (GET /users, POST /users)
- Middleware (como funciona)
- Controllers (separacao de concerns)

**TypeScript:**

- Types basicos (string, number, boolean)
- Interfaces (contratos)
- Generics conceito

**Autenticacao:**

- Bcrypt (hash de senhas)
- JWT (tokens, payload, secret)
- Logout (invalida token)

**Validacao:**

- Zod schemas
- Validar request body
- Mensagens de erro customizadas

### Fase 3: Banco de Dados (Semanas 5-6) | Custo: R$ 0

**PostgreSQL:**

- CREATE TABLE, INSERT, SELECT, UPDATE, DELETE
- Joins (INNER, LEFT, etc)
- Indexes (quando criar)
- Constraints (PRIMARY KEY, FOREIGN KEY, NOT NULL)

**Prisma ORM:**

- Schema.prisma
- Migrations (criar, revertir)
- CRUD queries type-safe
- Relacionamentos (1:N, N:M)

**Modelagem:**

- ER Diagram
- Normalizacao basica (evitar redundancia)

### Fase 4: Seguranca (Semana 7) | Custo: R$ 0

**Helmet.js:**

- Headers de seguranca (CSP, X-Frame-Options, etc)

**CORS:**

- Whitelist de origins
- Preflght requests

**Rate Limiting:**

- Basico: express-rate-limit
- Conceito: evitar brute force

**Input Validation:**

- SQL Injection prevention (ORM protege)
- XSS prevention (sanitize)
- Tamanho maximo de payload

**Environment Variables:**

- .env files
- Nunca commitar secrets
- .env.example documentando

### Fase 4.5: Docker (Semana 7.5) | Custo: R$ 0

**Docker Basics:**

- O que é container (isolamento)
- Dockerfile estrutura (FROM, WORKDIR, COPY, RUN, CMD)
- Build e run imagem

**Docker Compose:**

- Compose file (versão, services, volumes)
- Network entre containers
- Environment variables

**Best Practices:**

- Alpine base images (tamanho)
- Multi-stage builds (otimizacao)
- .dockerignore
- Non-root user
- Health checks

**Dev Workflow:**

- docker compose up (tudo roda)
- Hot reload (volumes mount)
- Logando para stdout (Docker captura)

### Fase 5: Deploy (Semana 8) | Custo: R$ 28

**Railway/Render:**

- Conectar GitHub
- Deploy automatico (git push)
- Environment variables em painel
- Logs em dashboard
- Revisar Dockerfile automaticamente

**Vercel (Frontend):**

- Deploy React
- Build + runtime separados

**Dominio:**

- Apontar DNS para Railway/Vercel
- HTTPS automatico

**Monitoramento basico:**

- Logs de erro
- Request count

### Fase 6: Arquitetura (Semanas 9-10) | Custo: R$ 0

**Clean Architecture:**

- Camadas (domain, application, infrastructure)
- Dependencia aponta pra dentro
- Por que importa (testabilidade, flexibilidade)

**Design Patterns:**

- Repository pattern (abstract data access)
- Adapter pattern (swap implementations)
- Dependency injection (loose coupling)

**SOLID Principles:**

- S: Single Responsibility
- O: Open/Closed
- L: Liskov Substitution
- I: Interface Segregation
- D: Dependency Inversion

**Error Handling:**

- AppError padronizado
- Global error handler
- Logging com contexto

**Testing:**

- Unit tests (Jest)
- Test data builders
- Mocking
- Coverage reporting

### Fase 7: NestJS & Estrutura Profissional (Semana 10.5) | Custo: R$ 0

**NestJS Framework:**

- Modules (organizar codigo)
- Controllers (HTTP endpoints)
- Services (logica de negocio)
- Pipes (validacao)
- Guards (autenticacao)
- Interceptors (logging, error handling)

**Dependency Injection:**

- NestJS nativa
- Constructor injection
- Module-level provisioning

**Middleware:**

- Request logging
- Rate limiting
- Error handling global

### Fase 8: Observabilidade & Testing Aprofundado (Semana 11) | Custo: R$ 0-80

**Logging Profissional:**

- Pino (JSON logs)
- Structured logging (correlationId)
- Log levels (debug, info, warn, error)

**Testing:**

- Unit tests (70% coverage)
- Integration tests (banc real, fixtures)
- E2E tests (full fluxo)
- Test pyramid conceito

**Observabilidade Basica:**

- Health check endpoint
- Request/response logging
- Error tracking (Sentry)

**Monitoring:**

- Metricas basicas (requests, errors, latencia)
- Alertas (error rate > 5%)
- Dashboard simple

### Fase 9-10: Projetos Praticos (Semanas 12-13) | Custo: R$ 28-200+

**Projeto Nivel 1: Padaria**

- CRUD produtos + vendas
- JWT basico
- Docker Compose
- Deploy Railway
- Testes basicos
- Stack: Express + Prisma + PostgreSQL

**Projeto Nivel 2: Clinica**

- Agendamento + prontuario
- RBAC (roles)
- Fila de jobs (SMS)
- Audit log
- Soft delete
- Stack: NestJS + Prisma + Redis + Twilio

**Projeto Nivel 3: E-commerce** (desafiador)

- Catalog + cart + checkout
- Stripe integration
- S3 para imagens
- Cache strategy
- Performance optimization
- Stack: NestJS + AWS

---

## Antipadroes Comuns

### 1. Monolito Sem Estrutura

```
ERRADO:
src/
├── app.js (3000+ linhas, tudo aqui)
├── helpers.js
└── utils.js

CERTO:
src/
├── domain/
├── application/
├── infrastructure/
```

**Impacto:** Impossivel testar, refatorar, colaborar

### 2. N+1 Query

```
ERRADO:
users = SELECT * FROM users
FOR user IN users:
  orders = SELECT * FROM orders WHERE user_id = user.id
Total: 1 + N queries

CERTO:
SELECT users.*, orders.* FROM users
LEFT JOIN orders ON orders.user_id = users.id
Total: 1 query
```

**Impacto:** App fica lento sem motivo aparente

### 3. Cache Sem Invalidacao

```
ERRADO:
GET /user/1 → salva em Redis pra sempre
UPDATE user/1 → ninguem diz pro cache

CERTO:
UPDATE user/1 → invalida cache user:1
Ou usar TTL (1 hora, dados refresca)
```

**Impacto:** Usuarios veem dados desatualizados

### 4. Logar Tudo (Includes Senhas)

```
ERRADO:
logger.info('User login', { email, password })

CERTO:
logger.info('User login', { email, userId })
```

**Impacto:** Logs com PII, compliance violation

### 5. Microservices Prematuros

```
Comeco:
├─ User Service
├─ Product Service
├─ Order Service
└─ 5 bancos diferentes

Problema:
- Distributed transactions (impossivel)
- Network latency (tudo é RPC)
- Deploy complexo
- 3 desenvolvedores, 3 servicos (impasse)

Solucao: Monolito bem estruturado ate 50+ devs
```

**Impacto:** Complexidade desnecessaria, bugs distribuidos

### 6. Validacao Faltando

```
ERRADO:
app.post('/users', (req, res) => {
  users.create(req.body)  // confia em qualquer coisa
})

CERTO:
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})
app.post('/users', (req, res) => {
  const validated = createUserSchema.parse(req.body)
  users.create(validated)
})
```

**Impacto:** Dados ruins no banco, erros aleatorios

### 7. Sem Tests

```
ERRADO: "Vou testar manual depois"

CERTO: Escrever test enquanto escreve codigo
```

**Impacto:** Bugs em producao, medo de refatorar

### 8. Error Handling Generico

```
ERRADO:
try {
  doSomething()
} catch(e) {
  res.status(500).json({ error: e.message })
}

CERTO:
try {
  doSomething()
} catch(e) {
  if (e instanceof ValidationError) res.status(400).json(...)
  else if (e instanceof NotFoundError) res.status(404).json(...)
  else res.status(500).json(...)
}
```

**Impacto:** Front-end nao sabe como reagir ao erro

### 9. Secrets em Codigo

```
ERRADO:
const STRIPE_KEY = 'sk_live_...'

CERTO:
const STRIPE_KEY = process.env.STRIPE_KEY
```

**Impacto:** Chaves vazam no GitHub público

### 10. Deploy Manual

```
ERRADO:
- SSH no server
- git pull
- npm install
- npm start

CERTO:
- git push
- GitHub Actions roda (test, build, push Docker)
- Deploy: atualiza container automaticamente
```

**Impacto:** Erros humanos, deployments lentos, nao reproducivel

---

## Dicas de Entrevista Tecnica

### 1. Explique Por Que (Nao Só Como)

**Errado:**
"Uso Prisma porque e popular"

**Certo:**
"Escolho Prisma porque: type-safe queries (erros compile-time), migrations automaticas, lazy loading optimization. Se precisasse de mais flexibilidade, trocaria pra TypeORM"

### 2. Mostre Que Conhece Trade-offs

**Pergunta:** "SQL ou NoSQL?"

**Certo:**
"SQL pra structured data (relacional, ACID), NoSQL pra escalabilidade horizontal (sharding). Nivel 1-2 precisa SQL, Nivel 3+ pode ser hybrid"

### 3. Fale Sobre Seguranca Proativamente

Mesmo se nao perguntarem:

- "Uso Zod pra validar entrada"
- "Bcrypt + salt pra senhas"
- "JWT em httpOnly cookies"
- "CORS whitelist"
- "Helmet.js pra headers"

### 4. Demonstre Deploy Funcionando

"Tem projeto rodando online?" → Show Swagger docs, curl requests

Prove que sabe: git → GitHub Actions → Docker → Railway/AWS

### 5. Converse Sobre Observabilidade

"Como voces monitoram em producao?"
"Que ferramenta de logging?"
"SLO de latencia?"

Mostra que entende que codigo rodando é mais importante que codigo escrito

### 6. Pergunte Sobre a Stack Deles

"Como vocês organizam estrutura de monolito?"
"Que pattern usam pra validacao?"
"Qual ORM?"
"TypeScript desde o comeco?"

Mostra que quer aprender com eles

### 7. Seja Honesto Sobre O Que Nao Sabe

**Errado:**
"Conheço Kubernetes" (bluff)

**Certo:**
"Nao tenho experiencia com Kubernetes ainda, mas entendo conceitos de containerizacao e escalabilidade. Aprenderia rapido"

### 8. Mostre Growth Mindset

"Fiz projeto X, depois refatorei pra pattern Y porque aprendi que Z era melhor"

Mostra que nao é inflexivel

### 9. Tenha Exemplos Concretos

Nao fale generico:

- "Otimizei query lenta" → "Tínhamos N+1 query em /orders, adicionei .include() no Prisma, latencia caiu de 500ms pra 50ms"

### 10. Fale Sobre Post-Mortem

"App caiu uma vez porque pool de conexoes saturou, aprendi a monitorar e alertar"

Mostra experiencia com failover

### 11. Mostre Seu Lado "Devops"

"Melhorei CI/CD pipeline adicionando testes automaticos"
"Criei Dockerfile otimizado que reduziu imagem de 500MB pra 150MB"

Junior que pensa em deployment > Junior que só programa

### 12. Conheca Numeros

- Latencia de rede: ~100ms
- Database query: ~1-5ms
- Pagina web ideal: <1s load
- SLA 99.9% = 43 min downtime/mes

Mostra compreensao de escala

---

## Fala Final

> **"O mercado brasileiro valoriza:**
>
> - **Entregar valor rápido** (não overengineering)
> - **Código limpo** (legível, testável)
> - **Seguro** (validação, secrets, CORS)
> - **Deployado** (não roda só local)
>
> Não precisa saber de tudo, mas precisa de **entender o problema do cliente e resolver com a ferramenta certa**."

### Roadmap de Evolucao

1. **Mes 1-2**: Nivel 1 (Padaria) solidificado. Primeiro projeto deployado.
2. **Mes 3-4**: Nivel 2 (Clinica). Entenda RBAC, jobs, audit log.
3. **Mes 5-6**: Nivel 3 (E-commerce). Aprenda performance, caching, CI/CD.
4. **Mes 7-8**: Nivel 4 (Fintech) estudando. DDD, event-driven, observabilidade.
5. **Mes 9-12**: Consolidar. Fazer projeto que combina tudo.

**Ao final de 12 semanas:**

- Portfolio com 3 projetos online
- Entender quando usar cada tecnologia
- Explicar trade-offs na ponta da lingua
- Preparado pra pleno em 2-3 anos

---

_Documento atualizado: 16/08/2026_
_Stack, custos e mercado baseados em realidade brasileira 2026_
_Pronto para você estudar e explicar em entrevista_
