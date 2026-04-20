import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateCommentDto } from './dto/create-comment.dto.js';
import type { UpdateCommentDto } from './dto/update-comment.dto.js';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByTask(taskId: string) {
    await this.ensureTaskExists(taskId);

    return this.prisma.comment.findMany({
      where: { taskId, deletedAt: null },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(taskId: string, dto: CreateCommentDto, user: AuthenticatedUser) {
    await this.ensureTaskExists(taskId);

    return this.prisma.comment.create({
      data: { taskId, authorId: user.id, body: dto.body },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateCommentDto, user: AuthenticatedUser) {
    const comment = await this.findOrFail(id);
    this.assertOwner(comment, user);

    return this.prisma.comment.update({
      where: { id },
      data: { body: dto.body },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const comment = await this.findOrFail(id);

    if (comment.authorId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException(
        'Only the author or an admin can delete this comment',
      );
    }

    await this.prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  private async ensureTaskExists(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
  }

  private async findOrFail(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.deletedAt)
      throw new NotFoundException('Comment not found');
    return comment;
  }

  private assertOwner(comment: { authorId: string }, user: AuthenticatedUser) {
    if (comment.authorId !== user.id) {
      throw new ForbiddenException('Only the author can edit this comment');
    }
  }
}
