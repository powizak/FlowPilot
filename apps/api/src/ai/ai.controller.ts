import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { AIService } from './ai.service.js';
import { ChatDto } from './dto/chat.dto.js';
import { RunSkillDto } from './dto/run-skill.dto.js';

@Controller('api/ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Get('models')
  listModels() {
    return this.aiService.listModels();
  }

  @Get('usage')
  getUsage(@Req() request: { user: AuthenticatedUser }) {
    return this.aiService.getUsage(request.user.id);
  }

  @Post('run-skill')
  runSkill(
    @Body() dto: RunSkillDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.aiService.runSkill(dto.skillName, dto.input, request.user.id);
  }

  @Post('chat')
  chat(@Body() dto: ChatDto, @Req() request: { user: AuthenticatedUser }) {
    return this.aiService.chat(dto.message, dto.context, request.user.id);
  }
}
