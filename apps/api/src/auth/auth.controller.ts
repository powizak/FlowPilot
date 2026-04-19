import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { Public } from './decorators/public.decorator.js';
import type { AuthenticatedUser, LogoutApiResponse, TokenApiResponse, UserApiResponse } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<UserApiResponse> {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto): Promise<TokenApiResponse> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto): Promise<TokenApiResponse> {
    return this.authService.refresh(dto);
  }

  @Public()
  @Post('logout')
  logout(@Body() dto: RefreshDto): Promise<LogoutApiResponse> {
    return this.authService.logout(dto);
  }

  @Get('me')
  me(@Req() request: { user: AuthenticatedUser }): Promise<UserApiResponse> {
    return this.authService.me(request.user.id);
  }
}
