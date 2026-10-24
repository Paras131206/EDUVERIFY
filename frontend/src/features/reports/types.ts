export type ReportType = 'POLICY' | 'ACCREDITATION' | 'MONITORING' | 'REGULATORY';

export type ReportFormat = 'PDF' | 'XLSX';

export type ReportJobStatus = 'QUEUED' | 'AGGREGATING' | 'VALIDATING' | 'RENDERING' | 'COMPLETED' | 'FAILED';

export interface ReportItem {
  id: string;
  title: string;
  title_hi?: string;
  report_type: ReportType;
  format: ReportFormat;
  academic_year: string;
  state: string;
  program: string;
  category: string;
  status: 'READY' | 'PROCESSING' | 'FAILED';
  generated_at: string;
  generated_by: string;
  file_size: string;
  download_url: string;
  summary?: {
    total_institutions: number;
    total_students: number;
    approved_intake: number;
    enrolled_count: number;
    excess_seats: number;
    compliance_score: number;
  };
}

export interface ReportJob {
  job_id: string;
  status: ReportJobStatus;
  progress_percent: number;
  current_step: string;
  result_report?: ReportItem;
  download_url?: string;
  error_message?: string;
}

export interface CreateReportRequest {
  report_type: ReportType;
  academic_year: string;
  state: string;
  program: string;
  category: string;
  format: ReportFormat;
}
