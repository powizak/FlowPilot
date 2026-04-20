import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { UserRole } from '@flowpilot/shared';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ClientsService } from './clients.service.js';
import { ClientsContactsService } from './clients-contacts.service.js';
import { ClientsAresService } from './clients-ares.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { ListClientsQueryDto } from './dto/list-clients-query.dto.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { UpdateContactDto } from './dto/update-contact.dto.js';

@Controller('api/clients')
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly contactsService: ClientsContactsService,
    private readonly aresService: ClientsAresService,
  ) {}

  @Get()
  list(@Query() query: ListClientsQueryDto) {
    return this.clientsService.list(query);
  }

  @Post()
  @Roles('admin' as UserRole, 'member' as UserRole)
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Get('lookup-ico/:ico')
  lookupIco(@Param('ico') ico: string) {
    return this.aresService.lookupIco(ico);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Put(':id')
  @Roles('admin' as UserRole, 'member' as UserRole)
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin' as UserRole, 'member' as UserRole)
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Get(':id/projects')
  findProjects(@Param('id') id: string) {
    return this.clientsService.findProjects(id);
  }

  @Get(':id/invoices')
  findInvoices(@Param('id') id: string) {
    return this.clientsService.findInvoices(id);
  }

  @Post(':id/contacts')
  @Roles('admin' as UserRole, 'member' as UserRole)
  createContact(@Param('id') id: string, @Body() dto: CreateContactDto) {
    return this.contactsService.create(id, dto);
  }

  @Put(':id/contacts/:contactId')
  @Roles('admin' as UserRole, 'member' as UserRole)
  updateContact(
    @Param('id') id: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(id, contactId, dto);
  }

  @Delete(':id/contacts/:contactId')
  @Roles('admin' as UserRole, 'member' as UserRole)
  removeContact(
    @Param('id') id: string,
    @Param('contactId') contactId: string,
  ) {
    return this.contactsService.remove(id, contactId);
  }
}
