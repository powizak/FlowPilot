import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator.js';

@Controller('api/health')
export class AppController {
  @Public()
  @Get()
  health() {
    return { status: 'ok' };
  }
}
