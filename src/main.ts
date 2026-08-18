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
