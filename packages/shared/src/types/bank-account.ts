export interface BankAccount {
  id: string;
  name: string;
  bankName: string | null;
  accountNumber: string;
  iban: string | null;
  swift: string | null;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface CreateBankAccountDto {
  name: string;
  bankName?: string;
  accountNumber: string;
  iban?: string;
  swift?: string;
  currency?: string;
  isDefault?: boolean;
}

export interface UpdateBankAccountDto {
  name?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  swift?: string;
  currency?: string;
  isDefault?: boolean;
  isActive?: boolean;
}
