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
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2026-08-17T20:00:00.000Z' },
        uptime: { type: 'number', example: 12.34 },
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
