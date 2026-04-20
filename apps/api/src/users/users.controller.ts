import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { UserRole } from '@flowpilot/shared';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';
import { UsersService } from './users.service.js';
import { CalendarService } from '../calendar/calendar.service.js';

@Controller('api/users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly calendarService: CalendarService,
  ) {}

  @Get()
  @Roles('ADMIN' as UserRole)
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query.page ?? 1, query.limit ?? 20);
  }

  @Get('me')
  getProfile(@Req() req: { user: AuthenticatedUser }) {
    return this.usersService.getProfile(req.user.id);
  }

  @Get('me/calendar-token')
  getCalendarToken(@Req() req: { user: AuthenticatedUser }) {
    return this.calendarService.getOrCreateCalendarToken(req.user.id);
  }

  @Put('me')
  updateProfile(
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  uploadAvatar(
    @Req() req: { user: AuthenticatedUser },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(req.user.id, file);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    const targetId = req.user.role === 'admin' || req.user.id === id
      ? id
      : req.user.id;
    return this.usersService.findOne(targetId);
  }

  @Put(':id')
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.usersService.update(id, dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles('ADMIN' as UserRole)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeUser(@Param('id') id: string): Promise<void> {
    await this.usersService.remove(id);
  }
}
