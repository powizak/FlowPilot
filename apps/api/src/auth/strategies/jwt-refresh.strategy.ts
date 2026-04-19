import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { RefreshTokenPayload } from '../auth.types.js';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') ?? 'flowpilot-dev-refresh-secret',
    });
  }

  validate(
    request: { body?: { refreshToken?: string } },
    payload: RefreshTokenPayload,
  ): RefreshTokenPayload & { refreshToken?: string } {
    return {
      ...payload,
      refreshToken: request.body?.refreshToken,
    };
  }
}
