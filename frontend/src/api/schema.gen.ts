/**
 * Generated TypeScript definitions for EduVerify API
 */

export interface paths {
  '/healthz': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': {
              status: string;
              version: string;
              engine_version?: string;
              db?: string;
            };
          };
        };
      };
    };
  };
  '/v1/auth/login': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            email: string;
            password?: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['AuthResponse'];
          };
        };
        401: {
          content: {
            'application/json': components['schemas']['ErrorResponse'];
          };
        };
      };
    };
  };
  '/v1/auth/refresh': {
    post: {
      requestBody?: {
        content: {
          'application/json': {
            refresh_token?: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['AuthResponse'];
          };
        };
      };
    };
  };
  '/v1/auth/me': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['User'];
          };
        };
      };
    };
  };
  '/v1/batches': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['Batch'][];
          };
        };
      };
    };
    post: {
      requestBody: {
        content: {
          'multipart/form-data': {
            file: unknown;
            academic_year: string;
            supersedes_batch_id?: string;
          };
        };
      };
      responses: {
        201: {
          content: {
            'application/json': components['schemas']['Batch'];
          };
        };
      };
    };
  };
  '/v1/batches/{id}/report': {
    get: {
      parameters: {
        path: {
          id: string;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['BatchReport'];
          };
        };
      };
    };
  };
  '/v1/batches/{id}/mapping': {
    get: {
      parameters: {
        path: {
          id: string;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['ColumnMapping'][];
          };
        };
      };
    };
  };
}

export interface components {
  schemas: {
    User: {
      id: string;
      email: string;
      full_name: string;
      role: 'AICTE_ADMIN' | 'AICTE_ANALYST' | 'DAB_ADMIN' | 'INSTITUTION_ADMIN' | 'INSTITUTION_STAFF' | 'VERIFIER' | 'STUDENT';
      institution_aicte_id: string | null;
      dab_id: string | null;
      student_apaar_hash: string | null;
    };
    AuthResponse: {
      access_token: string;
      token_type: string;
      expires_in: number;
      user: components['schemas']['User'];
    };
    ErrorResponse: {
      detail: string;
      code?: string;
    };
    Batch: {
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
    };
    ColumnMapping: {
      source: string;
      target: string;
      confidence: number;
      method: 'synonym' | 'fuzzy' | 'user' | 'exact';
    };
    Issue: {
      issue_id: string;
      row: number;
      record_key?: string;
      field: string;
      rule_id: string;
      severity: 'ERROR' | 'WARN' | 'INFO';
      priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      confidence?: number;
      bucket: 'AUTO_FLAG' | 'HUMAN_REVIEW' | 'INFO';
      message: string;
      reason?: string;
      evidence?: Record<string, unknown>;
      suggested_fix?: {
        value?: string;
        rationale?: string;
        requires_approval?: boolean;
      };
      value_masked?: string;
      status?: 'OPEN' | 'ACCEPTED' | 'DISMISSED' | 'FIXED';
    };
    BatchReport: {
      batch_id: string;
      institution_aicte_id: string;
      engine_version: string;
      rule_catalog_version: string;
      rows_total: number;
      rows_valid: number;
      rows_warning: number;
      rows_error: number;
      quality_score: number;
      column_mapping: components['schemas']['ColumnMapping'][];
      metrics?: Record<string, unknown>;
      issues: components['schemas']['Issue'][];
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
      intake_summary?: Array<Record<string, unknown>>;
      reconciliation?: Array<Record<string, unknown>>;
      duplicate_clusters?: Array<Record<string, unknown>>;
      schema_drift?: Array<Record<string, unknown>>;
      anomalies?: Array<Record<string, unknown>>;
    };
  };
}
