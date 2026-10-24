export type UserRole =
  | 'AICTE_ADMIN'
  | 'AICTE_VIEWER'
  | 'INSTITUTION_ADMIN'
  | 'INSTITUTION_STAFF'
  | 'DAB_MEMBER'
  | 'STUDENT'
  | 'VERIFIER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  institution_aicte_id: string | null;
  dab_id: string | null;
  student_apaar_hash: string | null;
}

export interface LoginResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: User;
  requires_mfa?: boolean;
  mfa_ticket?: string;
  message?: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface CreatedApiKey extends ApiKeyItem {
  raw_key: string;
}

export interface InstitutionUserItem {
  id: string;
  email: string;
  full_name: string;
  role: 'INSTITUTION_ADMIN' | 'INSTITUTION_STAFF';
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}
