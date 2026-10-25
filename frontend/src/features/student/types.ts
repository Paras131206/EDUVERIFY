export interface StudentOwnRecord {
  apaar_id: string; // 12-digit APAAR (unmasked for self)
  institution_aicte_id: string;
  institution_name: string;
  institution_student_id: string;
  full_name: string;
  dob: string;
  gender: 'M' | 'F' | 'T';
  category: string;
  email: string;
  mobile: string;
  program_code: string;
  program_name: string;
  course_level: string;
  department: string;
  academic_year: string;
  year_of_study: number;
  admission_date: string;
  admission_type: string;
  expected_graduation_year: number;
  seat_type: string;
  supernumerary_scheme: string | null;
  quota: string;
  nationality: string;
  enrolment_status: 'ACTIVE' | 'WITHDRAWN' | 'DEFERRED' | 'TRANSFERRED_OUT' | 'COMPLETED' | 'GRADUATED';
  record_version: number;
  updated_at: string;
}

export interface StudentVersionHistoryItem {
  version: number;
  changed_at: string;
  changed_by: string;
  change_reason: string;
  changes: Record<string, { old_val: string | number | null; new_val: string | number | null }>;
}

export type ConsentPurpose =
  | 'REPOSITORY'
  | 'VERIFICATION_SHARE'
  | 'ANALYTICS_AGGREGATE'
  | 'EMPLOYER_HIRING';

export interface EmployerHiringRequestItem {
  id: string;
  employer_id: string;
  employer_name: string;
  apaar_id: string;
  job_title: string | null;
  organization: string | null;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  requested_at: string;
  decided_at: string | null;
}

export interface ConsentPurposeSetting {
  purpose: ConsentPurpose;
  title: string;
  title_hi: string;
  description: string;
  consequences: string;
  is_granted: boolean;
  can_toggle: boolean;
  warning_on_withdraw?: string;
}

export interface ConsentHistoryRecord {
  id: string;
  purpose: ConsentPurpose;
  action: 'GRANTED' | 'WITHDRAWN';
  timestamp: string;
  actor: string;
  evidence_hash?: string;
  notes: string;
}

export type CredentialStatus = 'VALID' | 'SUPERSEDED' | 'SUSPENDED' | 'REVOKED';

export interface StudentCredentialItem {
  id: string;
  credential_type: 'ENROLMENT_CREDENTIAL' | 'DEGREE_CERTIFICATE';
  title: string;
  title_hi: string;
  issuer_name: string;
  issuer_did: string;
  issued_at: string;
  expires_at: string;
  status: CredentialStatus;
  status_reason?: string;
  record_version: number;
  raw_sd_jwt: string;
  disclosable_claims: Array<{
    key: string;
    label: string;
    value: any;
    default_selected: boolean;
  }>;
}

export interface VerificationResult {
  valid: boolean;
  status: 'VALID' | 'SUPERSEDED' | 'SUSPENDED' | 'REVOKED' | 'INVALID_SIGNATURE' | 'EXPIRED' | 'KEY_BINDING_FAILED';
  issuer: string;
  issuer_trusted: boolean;
  verified_at: string;
  checked_at: string;
  disclosed_claims: Record<string, any>;
  reasons: string[];
  holder_bound: boolean;
  error_message?: string;
}

export interface DabGraduateItem {
  student_id: string;
  apaar_id: string;
  full_name: string;
  institution_aicte_id: string;
  institution_name: string;
  program_code: string;
  program_name: string;
  course_level: string;
  graduation_year: string;
  cgpa: number;
  enrolment_status: 'COMPLETED' | 'GRADUATED';
  credential_status: 'ISSUED' | 'PENDING';
  issued_credential_id?: string;
  issued_at?: string;
}
