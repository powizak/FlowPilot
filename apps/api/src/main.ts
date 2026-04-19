import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import Redis from 'ioredis';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379', { lazyConnect: true });
  await redis.connect();
  console.log('Redis connected');
  const app = await NestFactory.create(AppModule);
  await app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0');
}

void bootstrap();
