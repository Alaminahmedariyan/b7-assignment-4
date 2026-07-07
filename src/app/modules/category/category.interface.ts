export interface CreateCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
}