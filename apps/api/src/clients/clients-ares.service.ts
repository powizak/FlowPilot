import { BadRequestException, Injectable } from '@nestjs/common';

interface AresResponse {
  obchodniJmeno?: string;
  sidlo?: {
    textovaAdresa?: string;
    nazevObce?: string;
    psc?: number;
    nazevUlice?: string;
    cisloDomovni?: number;
  };
  dic?: string;
  pravniForma?: string;
}

@Injectable()
export class ClientsAresService {
  validateIco(ico: string): boolean {
    if (!/^\d{8}$/.test(ico)) return false;

    const weights = [8, 7, 6, 5, 4, 3, 2];
    const digits = ico.split('').map(Number);
    const sum = weights.reduce((acc, w, i) => acc + w * digits[i], 0);
    let remainder = 11 - (sum % 11);

    if (remainder === 10) remainder = 1;
    if (remainder === 11) remainder = 0;

    return remainder === digits[7];
  }

  async lookupIco(ico: string) {
    if (!this.validateIco(ico)) {
      throw new BadRequestException('Invalid IČO format or checksum');
    }

    const url = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new BadRequestException('IČO not found in ARES registry');
      }
      throw new BadRequestException('ARES lookup failed');
    }

    const ares = (await response.json()) as AresResponse;

    return {
      data: {
        name: ares.obchodniJmeno ?? null,
        ic: ico,
        dic: ares.dic ?? null,
        address: ares.sidlo
          ? {
              street: ares.sidlo.nazevUlice ?? null,
              houseNumber: ares.sidlo.cisloDomovni ?? null,
              city: ares.sidlo.nazevObce ?? null,
              zip: ares.sidlo.psc?.toString() ?? null,
              fullAddress: ares.sidlo.textovaAdresa ?? null,
            }
          : null,
      },
    };
  }
}
