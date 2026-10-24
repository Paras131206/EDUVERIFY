export interface CanonicalField {
  key: string;
  label: string;
  required: boolean;
  category: 'identity' | 'academic' | 'admission' | 'quota' | 'consent' | 'contact';
  description?: string;
}

export const CANONICAL_FIELDS: CanonicalField[] = [
  { key: 'apaar_id', label: 'APAAR ID (12 digits)', required: true, category: 'identity', description: 'Unique 12-digit student identification number' },
  { key: 'institution_aicte_id', label: 'AICTE Institution ID', required: true, category: 'identity', description: 'Institution permanent identifier' },
  { key: 'institution_student_id', label: 'Institution Student / Roll / PRN', required: true, category: 'identity', description: 'Internal student identifier' },
  { key: 'full_name', label: 'Full Name', required: true, category: 'identity', description: 'Full legal name as per registry' },
  { key: 'dob', label: 'Date of Birth (YYYY-MM-DD)', required: true, category: 'identity', description: 'Date of birth' },
  { key: 'gender', label: 'Gender (M/F/T)', required: true, category: 'identity', description: 'M, F, or T' },
  { key: 'category', label: 'Category (GEN/EWS/OBC-NCL/SC/ST)', required: true, category: 'identity', description: 'Reservation category' },
  { key: 'pwd', label: 'Person with Disability (PWD)', required: false, category: 'identity', description: 'True/False' },
  { key: 'program_code', label: 'Program Code', required: true, category: 'academic', description: 'Approved AICTE program code' },
  { key: 'course_level', label: 'Course Level (UG/PG/DIPLOMA/PHD)', required: true, category: 'academic', description: 'Program level' },
  { key: 'department', label: 'Department Name', required: false, category: 'academic', description: 'Academic department' },
  { key: 'academic_year', label: 'Academic Year', required: true, category: 'academic', description: 'e.g. 2026-27' },
  { key: 'year_of_study', label: 'Year of Study (1-6)', required: true, category: 'academic', description: 'Current progression year' },
  { key: 'admission_date', label: 'Admission Date (YYYY-MM-DD)', required: true, category: 'admission', description: 'Official enrollment date' },
  { key: 'admission_type', label: 'Admission Type (REGULAR/LATERAL/TRANSFER_IN)', required: true, category: 'admission', description: 'Entry pathway' },
  { key: 'expected_graduation_year', label: 'Expected Graduation Year', required: false, category: 'admission', description: 'Admission year + duration' },
  { key: 'seat_type', label: 'Seat Type (REGULAR/SUPERNUMERARY)', required: true, category: 'quota', description: 'Intake classification' },
  { key: 'supernumerary_scheme', label: 'Supernumerary Scheme (TFW/PMSSS/JK/NE/etc.)', required: false, category: 'quota', description: 'Scheme under supernumerary quota' },
  { key: 'quota', label: 'Quota (NONE/NRI/OCI/FN/PIO/CIWG)', required: true, category: 'quota', description: 'Quota category' },
  { key: 'nationality', label: 'Nationality (ISO-2 Code)', required: true, category: 'quota', description: 'e.g. IN, US' },
  { key: 'nri_status', label: 'NRI Status', required: true, category: 'quota', description: 'Non-resident Indian status' },
  { key: 'oci_status', label: 'OCI Status', required: true, category: 'quota', description: 'Overseas Citizen of India' },
  { key: 'fn_status', label: 'Foreign National Status', required: true, category: 'quota', description: 'Foreign national status' },
  { key: 'enrolment_status', label: 'Enrolment Status (ACTIVE/WITHDRAWN/etc.)', required: true, category: 'academic', description: 'Current state' },
  { key: 'consent_status', label: 'Consent Status (GRANTED/REFUSED)', required: true, category: 'consent', description: 'APAAR data sharing consent' },
  { key: 'consent_date', label: 'Consent Date', required: false, category: 'consent', description: 'Date consent obtained' },
  { key: 'guardian_consent', label: 'Guardian Consent (if < 18)', required: false, category: 'consent', description: 'Parental consent for minors' },
  { key: 'email', label: 'Email Address', required: false, category: 'contact', description: 'Student email (masked)' },
  { key: 'mobile', label: 'Mobile Number', required: false, category: 'contact', description: 'Student mobile (masked)' },
];

export type MappingMethod = 'synonym' | 'fuzzy' | 'pattern' | 'saved' | 'user';

export interface ColumnMappingItem {
  source: string;
  target: string;
  confidence: number;
  method: MappingMethod;
  sample_values?: string[];
}

export type ValidationStage =
  | 'idle'
  | 'parsing'
  | 'mapping'
  | 'rules'
  | 'duplicates'
  | 'anomalies'
  | 'report'
  | 'complete'
  | 'failed';

export interface IntakeCardData {
  program_code: string;
  approved: number;
  enrolled: number;
  supernumerary: number;
  excess: number;
}

export interface ReconciliationRowData {
  program_code: string;
  declared: number;
  uploaded: number;
  delta: number;
  status: 'MATCH' | 'MISMATCH';
}

export interface SchemaDriftData {
  kind: string;
  column: string;
  previous: string;
  current: string;
}

export interface BatchItem {
  id: string;
  institution_aicte_id: string;
  academic_year: string;
  filename: string;
  status: 'UPLOADED' | 'MAPPING' | 'VALIDATING' | 'VALIDATED' | 'IN_REVIEW' | 'COMMITTED' | 'REJECTED' | 'SUPERSEDED' | 'FAILED';
  quality_score?: number | null;
  quality_score_before?: number | null;
  quality_score_after?: number | null;
  rows_total?: number;
  rows_valid?: number;
  rows_error?: number;
  rows_warning?: number;
  created_at: string;
  updated_at?: string;
  supersedes_batch_id?: string | null;
}

export type IssueSeverity = 'ERROR' | 'WARN' | 'INFO';
export type IssuePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IssueBucket = 'AUTO_FLAG' | 'HUMAN_REVIEW' | 'INFO';
export type IssueStatus = 'OPEN' | 'FIXED' | 'DISMISSED' | 'PROPOSED';

export interface IssueItem {
  issue_id: string;
  row: number;
  record_key: string;
  field: string;
  rule_id: string;
  rule_name?: string;
  severity: IssueSeverity;
  priority: IssuePriority;
  confidence: number;
  bucket: IssueBucket;
  message: string;
  reason: string;
  evidence: Record<string, unknown>;
  suggested_fix?: {
    value: string;
    rationale: string;
    requires_approval?: boolean;
  };
  value_masked: string;
  status: IssueStatus;
  decision_note?: string;
  proposed_value?: string;
  decided_by?: string;
}

export interface DuplicateMember {
  row: number;
  apaar_masked: string;
  institution: string;
  full_name: string;
  dob?: string;
  gender?: string;
  program_code?: string;
  admission_date?: string;
}

export interface DuplicateClusterItem {
  cluster_id: string;
  score: number;
  matched_fields: Record<string, number>;
  scope: 'INTRA' | 'CROSS_INSTITUTION' | string;
  bucket: 'HUMAN_REVIEW' | 'AUTO_FLAG' | string;
  status?: 'OPEN' | 'RESOLVED_SAME' | 'RESOLVED_DIFFERENT' | 'RESOLVED_TRANSFER';
  members: DuplicateMember[];
}

export interface BatchReportData {
  batch_id: string;
  institution_aicte_id: string;
  engine_version: string;
  rule_catalog_version: string;
  rows_total: number;
  rows_valid: number;
  rows_warning: number;
  rows_error: number;
  quality_score: number;
  quality_score_before?: number | null;
  quality_score_after?: number | null;
  column_mapping: ColumnMappingItem[];
  issues: IssueItem[];
  review_summary: {
    AUTO_FLAG: number;
    HUMAN_REVIEW: number;
    INFO: number;
  };
  priority_summary: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  intake_summary: IntakeCardData[];
  reconciliation: ReconciliationRowData[];
  duplicate_clusters: DuplicateClusterItem[];
  schema_drift: SchemaDriftData[];
  anomalies?: {
    metric: string;
    value: number;
    baseline: number;
    z: number;
    method: string;
    reason: string;
  }[];
}

export interface RevalidationResult {
  batch_id: string;
  quality_score_before: number;
  quality_score_after: number;
  resolved_count: number;
  pending_count: number;
  priority_deltas: {
    priority: IssuePriority;
    before: number;
    after: number;
    delta: number;
  }[];
  rule_deltas: {
    rule_id: string;
    rule_name: string;
    before: number;
    after: number;
    delta: number;
  }[];
}

export interface CanonicalStudentRecord {
  row: number;
  apaar_id: string;
  institution_aicte_id: string;
  institution_student_id: string;
  full_name: string;
  dob: string;
  gender: string;
  category: string;
  program_code: string;
  course_level: string;
  department: string;
  academic_year: string;
  admission_date: string;
  admission_type: string;
  seat_type: string;
  quota: string;
  nationality: string;
  enrolment_status: string;
  consent_status: string;
  email?: string;
  mobile?: string;
}

