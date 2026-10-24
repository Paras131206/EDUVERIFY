export interface AicteConsoleSummary {
  total_institutions: number;
  onboarded_institutions: number;
  coverage_percentage: number;
  student_level_coverage_pct: number;
  aggregate_only_coverage_pct: number;
  student_level_institutions_count: number;
  aggregate_only_institutions_count: number;
  total_students: number;
  avg_fill_percentage: number;
  excess_seats_count: number;
  avg_quality_score: number;
  cross_institution_duplicates: number;
  unresolved_duplicates: number;
  flagged_issues_count: number;
}

export interface SseTickerEvent {
  id: string;
  event_type: 'batch.committed' | 'anomaly.detected' | 'duplicate.cross' | 'rollover.completed' | 'transfer.decided';
  title: string;
  message: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  institution_aicte_id?: string;
  institution_name?: string;
  batch_id?: string;
  link?: string;
}

export interface StateMetricRecord {
  lgd_state_code: string;
  state_name: string;
  state_name_hi: string;
  total_institutions: number;
  enrolled_count: number;
  approved_intake: number;
  fill_percentage: number;
  excess_seats: number;
  avg_dq_score: number;
  coverage_rate: number;
  districts_count: number;
  cross_dupes_count: number;
  grid_row?: number;
  grid_col?: number;
}

export interface InstitutionDrilldownItem {
  institution_aicte_id: string;
  name: string;
  state_code: string;
  district_code: string;
  district_name: string;
  type: string;
  onboarding_level: 'FULL' | 'AGGREGATE_ONLY';
  enrolled: number;
  intake: number;
  fill_pct: number;
  excess: number;
  dq_score: number;
  cross_dupes: number;
}

export interface LeaderboardItem {
  rank: number;
  institution_aicte_id: string;
  institution_name: string;
  state_name: string;
  value: number;
  secondary_value?: string;
  metric_label: string;
  status: string;
}

export interface SupernumerarySchemeStat {
  scheme_code: string;
  scheme_name: string;
  allowed_cap: string;
  allotted_count: number;
  flagged_excess_count: number;
}

export interface QuotaShareStat {
  label: string;
  regular: number;
  supernumerary: number;
  nri: number;
  oci: number;
  fn: number;
}

export interface AnomalyFeedItem {
  id: string;
  metric: string;
  institution_aicte_id: string;
  institution_name: string;
  batch_id: string;
  value: number;
  baseline: number;
  z: number;
  method: 'zscore' | 'isolation_forest';
  reason: string;
  timestamp: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ReconciliationRecordItem {
  id: string;
  institution_aicte_id: string;
  institution_name: string;
  program_code: string;
  program_name: string;
  declared_intake: number;
  uploaded_enrolment: number;
  delta: number;
  status: 'MATCH' | 'MISMATCH' | 'EXCESS';
}

export interface AuditVerificationVerdict {
  verified: boolean;
  total_records: number;
  broken_link_id: string | null;
  verified_at: string;
  root_hash: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_email: string;
  actor_role: string;
  action: string;
  resource: string;
  record_hash: string;
  prev_record_hash: string;
  metadata?: Record<string, unknown>;
}

export interface RolloverDryRunResult {
  from_year: string;
  to_year: string;
  projected_advancements: number;
  projected_completions: number;
  projected_batches: number;
  potential_missing_students: number;
  institutions_affected: number;
  execution_preview_token: string;
}

export interface TrustListItem {
  did: string;
  name: string;
  type: 'ROOT_ISSUER' | 'AFFILIATED_DAB';
  key_id: string;
  algorithm: string;
  public_key_jwk_thumbprint: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  expires_at: string;
}
