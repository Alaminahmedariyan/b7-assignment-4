export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  nidUrl?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  address?: string;
  nidUrl?: string;
}