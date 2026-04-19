import { Controller, Get } from '@nestjs/common';

@Controller('api/health')
export class AppController {
  @Get()
  health() {
    return { status: 'ok' };
  }
}
