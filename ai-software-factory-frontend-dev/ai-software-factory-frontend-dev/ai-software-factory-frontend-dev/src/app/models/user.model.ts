export interface User {
  id?: number;
  firstname: string;
  lastname: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'CHEF_DE_PROJET' | 'EDITEUR' | 'LECTEUR' | string;
  createdAt?: Date;
  updatedAt?: Date;
  keycloakId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  'not-before-policy': number;
  session_state: string;
  scope: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: string;
}
