import { Prisma } from "../../../../generated/prisma/client";

export interface CreateGearPayload {
  name: string;
  description: string;
  brand?: string;
  pricePerDay: number;
  totalQuantity: number;
  specifications?: Prisma.InputJsonValue;
  categoryId: string;
}

export interface UpdateGearPayload {
  name?: string;
  description?: string;
  brand?: string;
  pricePerDay?: number;
  totalQuantity?: number;
  specifications?: Prisma.InputJsonValue;
  isListed?: boolean;
  categoryId?: string;
}

export interface AvailabilityQuery {
  startDate: string;
  endDate: string;
}

export interface GearQuery {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}