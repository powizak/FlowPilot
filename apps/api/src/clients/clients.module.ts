import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller.js';
import { ClientsService } from './clients.service.js';
import { ClientsContactsService } from './clients-contacts.service.js';
import { ClientsAresService } from './clients-ares.service.js';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, ClientsContactsService, ClientsAresService],
  exports: [ClientsService],
})
export class ClientsModule {}
