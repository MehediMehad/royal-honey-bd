export interface IProductFilterRequest {
  searchTerm?: string;
  isAvailable?: boolean | string;
  minPrice?: number | string;
  maxPrice?: number | string;
}

export interface IPaginationOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ICreateProductPayload {
  id: string;
  name: string;
  price: number;
  weight: string;
  description?: string;
  stockCount?: number;
  minThreshold?: number;
  isAvailable?: boolean;
  imageUrl?: string;
}

export interface IUpdateProductPayload {
  name?: string;
  price?: number;
  weight?: string;
  description?: string;
  stockCount?: number;
  minThreshold?: number;
  isAvailable?: boolean;
  imageUrl?: string;
}

export interface IRestockProductPayload {
  quantityAdded: number;
  note?: string;
}
