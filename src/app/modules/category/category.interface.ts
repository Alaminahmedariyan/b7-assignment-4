export interface CreateCategoryPayload {
  name: string;
  description?: string;
  parentId?: string | null;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  parentId?: string | null;
}