export interface RentalItemPayload {
  gearItemId: string;
  quantity: number;
}

export interface CreateRentalPayload {
  startDate: string;
  endDate: string;
  items: RentalItemPayload[];
}

export interface RentalQuery {
  page?: string;
  limit?: string;
  status?: string;
}

export interface RentalQuery {
  page?: string;
  limit?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CancelRentalPayload {
  cancellationReason: string;
}