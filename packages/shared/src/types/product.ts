export interface Product {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  defaultUnitPrice: number;
  defaultVatPercent: number;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProductDto = Pick<
  Product,
  'name' | 'description' | 'unit' | 'defaultUnitPrice' | 'defaultVatPercent' | 'category'
> & {
  isActive?: boolean;
};

export type UpdateProductDto = Partial<
  Pick<Product, 'name' | 'description' | 'unit' | 'defaultUnitPrice' | 'defaultVatPercent' | 'category' | 'isActive'>
>;
