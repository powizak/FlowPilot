export interface Address {
  street?: string;
  city?: string;
  zip?: string;
}

export interface Contact {
  id: string;
  clientId: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary: boolean;
}

export interface Client {
  id: string;
  name: string;
  ic?: string;
  dic?: string;
  isCompany: boolean;
  email?: string;
  phone?: string;
  website?: string;
  billingAddress?: Address;
  deliveryAddress?: Address;
  note?: string;
  defaultPaymentTermsDays: number;
  vatSubject: boolean;
  country: string;
  contacts: Contact[];
  createdAt: string;
  updatedAt: string;
  projectsCount?: number;
  _count?: { projects: number };
}
