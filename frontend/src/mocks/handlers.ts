import { http, HttpResponse } from 'msw';
import {
  mockUser,
  mockUsers,
  mockApiKeys,
  mockInstitutionUsers,
  mockBatches,
  mockBatchReport,
  mockAicteSummary,
  mockInstitutionSummary,
  mockStudents,
  mockTransfers,
  mockAggregates,
  mockReconciliationStatus,
  mockWebhooks,
  mockDqTrend,
  mockIntakeDistribution,
  mockNotifications,
  mockSseTickerEvents,
  mockStateMetrics,
  mockDrilldownInstitutions,
  mockLeaderboards,
  mockSupernumerarySchemes,
  mockQuotaShares,
  mockCrossDuplicates,
  mockAnomalyFeed,
  mockAicteReconciliation,
  mockAuditVerification,
  mockAuditLog,
  mockRolloverDryRun,
  mockTrustList,
  mockMasterInstitutions,
  mockMasterDabs,
  mockMasterPrograms,
  mockMasterAcademicYears,
} from './data';

import {
  BatchItem,
  ALLOWED_TRANSITIONS,
  EnrolmentStatus,
  StudentDetailRecord,
  TransferRequestItem,
  ProgramAggregateItem,
  ReconciliationStatusItem,
  WebhookConfigItem,
  DuplicateClusterItem,
} from '@/features/institution/types';
import {
  SseTickerEvent,
  AuditVerificationVerdict,
  AuditLogEntry,
  ReconciliationRecordItem,
} from '@/features/aicte/types';

let studentsState: StudentDetailRecord[] = JSON.parse(JSON.stringify(mockStudents));
let transfersState: TransferRequestItem[] = JSON.parse(JSON.stringify(mockTransfers));
let aggregatesState: ProgramAggregateItem[] = JSON.parse(JSON.stringify(mockAggregates));
let reconciliationState: ReconciliationStatusItem[] = JSON.parse(JSON.stringify(mockReconciliationStatus));
let webhooksState: WebhookConfigItem[] = JSON.parse(JSON.stringify(mockWebhooks));

// AICTE Console State
let aicteSummaryState = JSON.parse(JSON.stringify(mockAicteSummary));
let sseTickerEventsState: SseTickerEvent[] = JSON.parse(JSON.stringify(mockSseTickerEvents));
let crossDuplicatesState: DuplicateClusterItem[] = JSON.parse(JSON.stringify(mockCrossDuplicates));
let auditVerificationState: AuditVerificationVerdict = JSON.parse(JSON.stringify(mockAuditVerification));
let auditLogState: AuditLogEntry[] = JSON.parse(JSON.stringify(mockAuditLog));
let aicteReconciliationState: ReconciliationRecordItem[] = JSON.parse(JSON.stringify(mockAicteReconciliation));

export const resetAicteMock = () => {
  aicteSummaryState = JSON.parse(JSON.stringify(mockAicteSummary));
  sseTickerEventsState = JSON.parse(JSON.stringify(mockSseTickerEvents));
  crossDuplicatesState = JSON.parse(JSON.stringify(mockCrossDuplicates));
  auditVerificationState = JSON.parse(JSON.stringify(mockAuditVerification));
  auditLogState = JSON.parse(JSON.stringify(mockAuditLog));
  aicteReconciliationState = JSON.parse(JSON.stringify(mockAicteReconciliation));
};

export const setMockAicteSummary = (summary: Partial<typeof mockAicteSummary>) => {
  aicteSummaryState = { ...aicteSummaryState, ...summary };
};

export const resetOperationsMock = () => {
  studentsState = JSON.parse(JSON.stringify(mockStudents));
  transfersState = JSON.parse(JSON.stringify(mockTransfers));
  aggregatesState = JSON.parse(JSON.stringify(mockAggregates));
  reconciliationState = JSON.parse(JSON.stringify(mockReconciliationStatus));
  webhooksState = JSON.parse(JSON.stringify(mockWebhooks));
  resetAicteMock();
};


let failedLogins = 0;
let activeSessionUser: typeof mockUser | null = null;
let apiKeys = [...mockApiKeys];
let institutionUsers = [...mockInstitutionUsers];

export const resetAuthMock = () => {
  failedLogins = 0;
  activeSessionUser = null;
  apiKeys = [...mockApiKeys];
  institutionUsers = [...mockInstitutionUsers];
};

let batches: BatchItem[] = [...mockBatches] as unknown as BatchItem[];
let currentBatchReport = JSON.parse(JSON.stringify(mockBatchReport));

export const resetBatchMock = () => {
  batches = [...mockBatches] as unknown as BatchItem[];
  currentBatchReport = JSON.parse(JSON.stringify(mockBatchReport));
};

export const handlers = [
  http.get('*/v1/templates/student-upload.xlsx', () => {
    const csvContent =
      'apaar_id,institution_aicte_id,institution_student_id,full_name,dob,gender,category,program_code,course_level,department,academic_year,year_of_study,admission_date,admission_type,seat_type,quota,nationality,nri_status,oci_status,fn_status,enrolment_status,consent_status\n' +
      '984572912301,1-1234567890,PRN-2026-001,Aarav Patel,2004-05-12,M,GEN,BTECH-CSE,UG,Computer Science,2026-27,1,2026-08-01,REGULAR,REGULAR,NONE,IN,NO,NO,NO,ACTIVE,GRANTED\n';
    return new HttpResponse(new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="student-upload.xlsx"',
      },
    });
  }),

  http.get('*/v1/events/ticket', () => {
    return HttpResponse.json({ ticket: `ticket-${Date.now()}`, expires_in: 60 });
  }),

  http.post('*/v1/events/ticket', () => {
    return HttpResponse.json({ ticket: `ticket-${Date.now()}`, expires_in: 60 });
  }),

  http.get('*/v1/events', () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const stages = ['parsing', 'mapping', 'rules', 'duplicates', 'anomalies', 'report', 'complete'];
        let i = 0;
        const interval = setInterval(() => {
          if (i < stages.length) {
            const data = `data: ${JSON.stringify({ stage: stages[i], progress: Math.round(((i + 1) / stages.length) * 100), message: `Stage: ${stages[i]}` })}\n\n`;
            controller.enqueue(encoder.encode(data));
            i++;
          } else {
            clearInterval(interval);
            controller.close();
          }
        }, 200);
      },
    });
    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }),
  http.get('*/healthz', () => {
    return HttpResponse.json({
      status: 'ok',
      version: '0.1.0',
      engine_version: '0.1.0',
      db: 'connected',
    });
  }),

  http.post('*/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() || '';
    const password = body.password || '';

    if (failedLogins >= 5) {
      return HttpResponse.json(
        { detail: 'Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.' },
        { status: 423 }
      );
    }

    // Check credentials - uniform error prevents user enumeration
    if (!password || password !== 'password123') {
      failedLogins++;
      if (failedLogins >= 5) {
        return HttpResponse.json(
          { detail: 'Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.' },
          { status: 423 }
        );
      }
      return HttpResponse.json({ detail: 'Invalid credentials or account locked' }, { status: 401 });
    }

    // Demo MFA for AICTE Admin
    if (email === 'aicte.admin@demo.local') {
      return HttpResponse.json({
        requires_mfa: true,
        mfa_ticket: 'mfa-ticket-aicte-999',
        message: 'Enter 6-digit TOTP code from your authenticator app',
      });
    }

    // Successful login resets failed attempts
    failedLogins = 0;
    const matchedUser = mockUsers[email] || {
      ...mockUser,
      email: email || mockUser.email,
    };
    activeSessionUser = matchedUser;

    return HttpResponse.json({
      access_token: `mock-jwt-${matchedUser.role.toLowerCase()}-${Date.now()}`,
      token_type: 'bearer',
      expires_in: 900,
      user: matchedUser,
    });
  }),

  http.post('*/v1/auth/totp', async ({ request }) => {
    const body = (await request.json()) as { mfa_ticket?: string; code?: string };
    if (body.code === '123456') {
      const aicteUser = mockUsers['aicte.admin@demo.local'];
      activeSessionUser = aicteUser;
      return HttpResponse.json({
        access_token: `mock-jwt-aicte_admin-${Date.now()}`,
        token_type: 'bearer',
        expires_in: 900,
        user: aicteUser,
      });
    }
    return HttpResponse.json({ detail: 'Invalid 6-digit TOTP code. Try 123456.' }, { status: 400 });
  }),

  http.post('*/v1/auth/refresh', () => {
    if (!activeSessionUser) {
      return HttpResponse.json({ detail: 'No active session' }, { status: 401 });
    }
    return HttpResponse.json({
      access_token: `mock-refreshed-jwt-${Date.now()}`,
      token_type: 'bearer',
      expires_in: 900,
      user: activeSessionUser,
    });
  }),

  http.get('*/v1/auth/me', () => {
    if (!activeSessionUser) {
      return HttpResponse.json({ detail: 'Unauthenticated' }, { status: 401 });
    }
    return HttpResponse.json(activeSessionUser);
  }),

  http.post('*/v1/auth/logout', () => {
    failedLogins = 0;
    activeSessionUser = null;
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

      http.get('*/v1/api-keys', () => {
        return HttpResponse.json(apiKeys);
      }),

      http.post('*/v1/api-keys', async ({ request }) => {
        const body = (await request.json()) as { name: string; scopes?: string[] };
        const id = `key-${Date.now()}`;
        const randomHex = Math.random().toString(16).substring(2, 10);
        const prefix = `evk_live_${randomHex.substring(0, 4)}`;
        const rawKey = `evk_live_${randomHex}${Math.random().toString(16).substring(2, 18)}`;
        const newKey = {
          id,
          name: body.name,
          prefix,
          scopes: body.scopes || ['upload:batches'],
          created_at: new Date().toISOString(),
          last_used_at: null,
          revoked_at: null,
        };
        apiKeys = [newKey, ...apiKeys];
        return HttpResponse.json({ ...newKey, raw_key: rawKey }, { status: 201 });
      }),

      http.delete('*/v1/api-keys/:id', ({ params }) => {
        const id = params.id as string;
        apiKeys = apiKeys.map((k) => (k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k));
        return HttpResponse.json({ message: 'API key revoked successfully' });
      }),

      http.get('*/v1/users', () => {
        return HttpResponse.json(institutionUsers);
      }),

      http.post('*/v1/users/invite', async ({ request }) => {
        const body = (await request.json()) as { email: string; role: 'INSTITUTION_ADMIN' | 'INSTITUTION_STAFF' };
        const newUser = {
          id: `usr-inst-${Date.now()}`,
          email: body.email,
          full_name: body.email.split('@')[0],
          role: body.role,
          is_active: true,
          created_at: new Date().toISOString(),
          last_login_at: null,
        };
        institutionUsers = [...institutionUsers, newUser];
        return HttpResponse.json({ message: 'Invitation sent successfully', user: newUser });
      }),

  http.get('*/v1/master/states', () => {
    return HttpResponse.json([
      { lgd_state_code: '07', name: 'Delhi', name_hi: 'दिल्ली' },
      { lgd_state_code: '27', name: 'Maharashtra', name_hi: 'महाराष्ट्र' },
      { lgd_state_code: '29', name: 'Karnataka', name_hi: 'कर्नाटक' },
    ]);
  }),

  http.get('*/v1/master/programs', () => {
    return HttpResponse.json([
      { program_code: 'BTECH-CSE', name: 'Computer Science and Engineering', course_level: 'UG', duration_years: 4 },
      { program_code: 'BTECH-ECE', name: 'Electronics and Communication Engineering', course_level: 'UG', duration_years: 4 },
      { program_code: 'MCA', name: 'Master of Computer Applications', course_level: 'PG', duration_years: 2 },
    ]);
  }),

  http.get('*/v1/master/academic-years', () => {
    return HttpResponse.json([
      { academic_year: '2025-26', is_current: false },
      { academic_year: '2026-27', is_current: true },
    ]);
  }),

  http.get('*/v1/batches', () => {
    return HttpResponse.json(batches);
  }),

  http.post('*/v1/batches', async ({ request }) => {
    const idempotencyKey =
      request.headers.get('Idempotency-Key') || request.headers.get('idempotency-key') || '';
    let academicYear = '2026-27';
    let supersedesBatchId: string | null = null;
    let filename = 'uploaded_batch.csv';
    let triggerConflict = false;

    const url = new URL(request.url, 'http://localhost:8000');
    if (url.searchParams.get('conflict') === 'true') {
      triggerConflict = true;
    }

    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        academicYear = (body.academic_year as string) || academicYear;
        supersedesBatchId = (body.supersedes_batch_id as string) || null;
        filename = (body.filename as string) || filename;
        if (body.trigger_conflict || filename.includes('conflict')) {
          triggerConflict = true;
        }
      } else {
        try {
          const formData = await request.clone().formData();
          academicYear = (formData.get('academic_year') as string) || academicYear;
          supersedesBatchId = (formData.get('supersedes_batch_id') as string) || null;
          const file = formData.get('file');
          if (file && typeof file === 'object' && 'name' in file) {
            filename = (file as File).name;
          }
          if (formData.get('trigger_conflict') === 'true' || filename.includes('conflict')) {
            triggerConflict = true;
          }
        } catch {
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          academicYear = (body.academic_year as string) || academicYear;
          supersedesBatchId = (body.supersedes_batch_id as string) || null;
          filename = (body.filename as string) || filename;
          if (body.trigger_conflict || filename.includes('conflict')) {
            triggerConflict = true;
          }
        }
      }
    } catch {
      // Use defaults
    }

    // Check for open batch conflict (HTTP 409)
    const openBatch = batches.find(
      (b) =>
        b.academic_year === academicYear &&
        (b.status === 'IN_REVIEW' || b.status === 'VALIDATING' || b.status === 'MAPPING')
    );

    if (triggerConflict || (openBatch && !supersedesBatchId && filename.includes('conflict'))) {
      return HttpResponse.json(
        {
          detail: `Conflict: An active batch is currently open for academic year ${academicYear} (${openBatch?.id || 'batch-demo-2'}). Please resolve or supersede it.`,
          open_batch_id: openBatch?.id || 'batch-demo-2',
          code: 'BATCH_CONFLICT',
        },
        { status: 409 }
      );
    }

    if (supersedesBatchId) {
      batches = batches.map((b) =>
        b.id === supersedesBatchId ? { ...b, status: 'SUPERSEDED' as const } : b
      );
    }

    const newBatch = {
      id: `batch-${Date.now()}`,
      institution_aicte_id: '1-1234567890',
      academic_year: academicYear,
      filename,
      status: 'MAPPING' as const,
      quality_score: 74.0,
      quality_score_before: 74.0,
      quality_score_after: null,
      rows_total: 65,
      rows_valid: 48,
      rows_error: 12,
      rows_warning: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      supersedes_batch_id: supersedesBatchId,
      idempotency_key: idempotencyKey,
    };

    batches = [newBatch, ...batches];
    return HttpResponse.json(newBatch, { status: 201 });
  }),

  http.get('*/v1/batches/:id', ({ params }) => {
    const batch = batches.find((b) => b.id === params.id) || mockBatches[1];
    return HttpResponse.json(batch);
  }),

  http.get('*/v1/batches/:id/report', ({ params }) => {
    const report = {
      ...currentBatchReport,
      batch_id: (params.id as string) || currentBatchReport.batch_id,
      issues: currentBatchReport.issues.map((iss: typeof currentBatchReport.issues[0]) => ({
        ...iss,
        rule_name:
          iss.rule_id === 'V002'
            ? 'apaar_id missing or not 12 digits'
            : iss.rule_id === 'V004'
            ? 'Registry name/DOB fuzzy mismatch'
            : iss.rule_id === 'V021'
            ? 'Intake sanction ceiling exceeded'
            : iss.rule_id === 'V030'
            ? 'Canonical enum value mismatch'
            : `Validation Rule ${iss.rule_id}`,
      })),
    };
    return HttpResponse.json(report);
  }),

  http.get('*/v1/batches/:id/report.xlsx', () => {
    return new HttpResponse(new Blob(['mock xlsx report data']), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="validation_report.xlsx"',
      },
    });
  }),

  http.get('*/v1/batches/:id/report.pdf', () => {
    return new HttpResponse(new Blob(['%PDF-1.4 mock pdf data']), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="validation_report.pdf"',
      },
    });
  }),

  http.get('*/v1/batches/:id/records/:row', ({ params }) => {
    const rowNum = Number(params.row) || 8;
    return HttpResponse.json({
      row: rowNum,
      apaar_id: rowNum === 8 ? '98457291230' : '984572912301',
      institution_aicte_id: '1-1234567890',
      institution_student_id: `PRN-2026-0${rowNum < 10 ? '0' + rowNum : rowNum}`,
      full_name: rowNum === 8 ? 'Rahul Sharma' : rowNum === 15 ? 'Priya Singh' : 'Aarav Patel',
      dob: '2004-05-12',
      gender: 'M',
      category: 'GEN',
      program_code: rowNum === 42 ? 'BTECH-MECH' : 'BTECH-CSE',
      course_level: 'UG',
      department: rowNum === 50 ? ' computer science' : 'Computer Science',
      academic_year: '2026-27',
      admission_date: '2026-08-01',
      admission_type: 'REGULAR',
      seat_type: 'REGULAR',
      quota: 'NONE',
      nationality: 'IN',
      enrolment_status: 'ACTIVE',
      consent_status: 'GRANTED',
      email: 'student@example.edu.in',
      mobile: '+91 98765 43210',
    });
  }),

  http.get('*/v1/batches/:id/mapping', () => {
    return HttpResponse.json(mockBatchReport.column_mapping);
  }),

  http.put('*/v1/batches/:id/mapping', async ({ params, request }) => {
    const body = (await request.json()) as { mappings?: unknown; save_profile?: boolean };
    const batchId = params.id as string;
    batches = batches.map((b) => (b.id === batchId ? { ...b, status: 'VALIDATING' as const } : b));
    return HttpResponse.json({
      ...mockBatches[1],
      id: batchId,
      status: 'VALIDATING',
      updated_mapping: body,
    });
  }),

  http.get('*/v1/batches/:id/issues', () => {
    return HttpResponse.json(currentBatchReport.issues);
  }),

  http.post('*/v1/issues/:id/decide', async ({ params, request }) => {
    const body = (await request.json()) as {
      decision: string;
      override_value?: string;
      remarks?: string;
      user_role?: string;
    };
    const issueIndex = currentBatchReport.issues.findIndex(
      (i: typeof currentBatchReport.issues[0]) => i.issue_id === params.id
    );

    if (issueIndex === -1) {
      return HttpResponse.json({ detail: 'Issue not found' }, { status: 404 });
    }

    const issue = currentBatchReport.issues[issueIndex];
    let newStatus = issue.status;
    let proposedVal = issue.proposed_value;
    let valMasked = issue.value_masked;

    if (body.decision === 'ACCEPT_FIX' || body.decision === 'ACCEPT_SUGGESTION') {
      newStatus = 'FIXED';
      if (issue.suggested_fix?.value) {
        valMasked = String(issue.suggested_fix.value);
      }
    } else if (body.decision === 'EDIT_VALUE' || body.decision === 'OVERRIDE_VALUE') {
      newStatus = 'FIXED';
      if (body.override_value) {
        valMasked = body.override_value;
      }
    } else if (body.decision === 'DISMISS') {
      newStatus = 'DISMISSED';
    } else if (body.decision === 'PROPOSE_FIX') {
      newStatus = 'PROPOSED';
      proposedVal = issue.suggested_fix?.value ? String(issue.suggested_fix.value) : undefined;
    } else if (body.decision === 'PROPOSE_EDIT') {
      newStatus = 'PROPOSED';
      proposedVal = body.override_value;
    } else if (body.decision === 'PROPOSE_DISMISS') {
      newStatus = 'PROPOSED';
    }

    const updatedIssue = {
      ...issue,
      status: newStatus,
      decision_note: body.remarks || issue.decision_note,
      proposed_value: proposedVal,
      value_masked: valMasked,
      decided_by: body.user_role || 'INSTITUTION_ADMIN',
    };

    currentBatchReport.issues[issueIndex] = updatedIssue;
    return HttpResponse.json(updatedIssue);
  }),

  http.post('*/v1/batches/:id/issues/bulk-decide', async ({ request }) => {
    const body = (await request.json()) as {
      action: 'ACCEPT_INFO' | 'DISMISS_SELECTED';
      issue_ids?: string[];
      remarks?: string;
    };

    if (body.action === 'ACCEPT_INFO') {
      currentBatchReport.issues = currentBatchReport.issues.map(
        (iss: typeof currentBatchReport.issues[0]) => {
          if (iss.severity === 'INFO' || iss.bucket === 'INFO') {
            return {
              ...iss,
              status: 'FIXED',
              value_masked: iss.suggested_fix?.value ? String(iss.suggested_fix.value) : iss.value_masked,
              decision_note: 'Bulk accepted standard normalisation',
            };
          }
          return iss;
        }
      );
    } else if (body.action === 'DISMISS_SELECTED' && Array.isArray(body.issue_ids)) {
      currentBatchReport.issues = currentBatchReport.issues.map(
        (iss: typeof currentBatchReport.issues[0]) => {
          if (body.issue_ids?.includes(iss.issue_id)) {
            return {
              ...iss,
              status: 'DISMISSED',
              decision_note: body.remarks || 'Bulk dismissed with justification',
            };
          }
          return iss;
        }
      );
    }

    return HttpResponse.json({
      success: true,
      issues: currentBatchReport.issues,
      count: currentBatchReport.issues.length,
    });
  }),

  http.post('*/v1/duplicates/:id/resolve', async ({ params, request }) => {
    const body = (await request.json()) as { resolution: string; remarks?: string };
    const clusterIndex = currentBatchReport.duplicate_clusters.findIndex(
      (c: typeof currentBatchReport.duplicate_clusters[0]) => c.cluster_id === params.id
    );

    let status = 'RESOLVED_SAME';
    if (body.resolution === 'DIFFERENT_PEOPLE' || body.resolution === 'FALSE_POSITIVE_DIFFERENT_PERSONS') {
      status = 'RESOLVED_DIFFERENT';
    } else if (body.resolution === 'TRANSFER' || body.resolution === 'TRANSFER_PENDING') {
      status = 'RESOLVED_TRANSFER';
    }

    if (clusterIndex !== -1) {
      currentBatchReport.duplicate_clusters[clusterIndex].status = status;
      return HttpResponse.json(currentBatchReport.duplicate_clusters[clusterIndex]);
    }

    return HttpResponse.json({ cluster_id: params.id, status });
  }),

  http.post('*/v1/batches/:id/revalidate', ({ params }) => {
    const batchId = (params.id as string) || currentBatchReport.batch_id;
    const initialScore = 74.0;
    const totalIssues = currentBatchReport.issues.length;
    const resolvedIssues = currentBatchReport.issues.filter(
      (i: typeof currentBatchReport.issues[0]) => i.status === 'FIXED' || i.status === 'DISMISSED'
    ).length;
    const pendingIssues = totalIssues - resolvedIssues;

    // Recalculate score from 74% up towards 96.5% proportionally
    const scoreBoost = totalIssues > 0 ? (resolvedIssues / totalIssues) * 22.5 : 0;
    const newScore = Math.min(100, Math.round((initialScore + scoreBoost) * 10) / 10);

    currentBatchReport.quality_score_before = initialScore;
    currentBatchReport.quality_score = newScore;
    currentBatchReport.quality_score_after = newScore;

    // Recalculate priority summaries
    const critOpen = currentBatchReport.issues.filter((i: typeof currentBatchReport.issues[0]) => i.priority === 'CRITICAL' && i.status === 'OPEN').length;
    const highOpen = currentBatchReport.issues.filter((i: typeof currentBatchReport.issues[0]) => i.priority === 'HIGH' && i.status === 'OPEN').length;
    const medOpen = currentBatchReport.issues.filter((i: typeof currentBatchReport.issues[0]) => i.priority === 'MEDIUM' && i.status === 'OPEN').length;
    const lowOpen = currentBatchReport.issues.filter((i: typeof currentBatchReport.issues[0]) => i.priority === 'LOW' && i.status === 'OPEN').length;

    const result = {
      batch_id: batchId,
      quality_score_before: initialScore,
      quality_score_after: newScore,
      resolved_count: resolvedIssues,
      pending_count: pendingIssues,
      priority_deltas: [
        { priority: 'CRITICAL', before: 1, after: critOpen, delta: critOpen - 1 },
        { priority: 'HIGH', before: 3, after: highOpen, delta: highOpen - 3 },
        { priority: 'MEDIUM', before: 0, after: medOpen, delta: medOpen - 0 },
        { priority: 'LOW', before: 1, after: lowOpen, delta: lowOpen - 1 },
      ],
      rule_deltas: [
        {
          rule_id: 'V002',
          rule_name: 'apaar_id missing or not 12 digits',
          before: 1,
          after: currentBatchReport.issues.filter((i: typeof currentBatchReport.issues[0]) => i.rule_id === 'V002' && i.status === 'OPEN').length,
          delta: currentBatchReport.issues.filter((i: typeof currentBatchReport.issues[0]) => i.rule_id === 'V002' && i.status === 'OPEN').length - 1,
        },
        {
          rule_id: 'V004',
          rule_name: 'Registry name/DOB fuzzy mismatch',
          before: 1,
          after: currentBatchReport.issues.filter((i: typeof currentBatchReport.issues[0]) => i.rule_id === 'V004' && i.status === 'OPEN').length,
          delta: currentBatchReport.issues.filter((i: typeof currentBatchReport.issues[0]) => i.rule_id === 'V004' && i.status === 'OPEN').length - 1,
        },
        {
          rule_id: 'V021',
          rule_name: 'Intake sanction ceiling exceeded',
          before: 1,
          after: currentBatchReport.issues.filter((i: typeof currentBatchReport.issues[0]) => i.rule_id === 'V021' && i.status === 'OPEN').length,
          delta: currentBatchReport.issues.filter((i: typeof currentBatchReport.issues[0]) => i.rule_id === 'V021' && i.status === 'OPEN').length - 1,
        },
        {
          rule_id: 'V030',
          rule_name: 'Canonical enum value mismatch',
          before: 1,
          after: currentBatchReport.issues.filter((i: typeof currentBatchReport.issues[0]) => i.rule_id === 'V030' && i.status === 'OPEN').length,
          delta: currentBatchReport.issues.filter((i: typeof currentBatchReport.issues[0]) => i.rule_id === 'V030' && i.status === 'OPEN').length - 1,
        },
      ],
    };

    return HttpResponse.json(result);
  }),

  http.post('*/v1/batches/:id/commit', ({ params }) => {
    // Check if any open issues have CRITICAL priority
    const hasOpenCritical = currentBatchReport.issues.some(
      (i: typeof currentBatchReport.issues[0]) => i.priority === 'CRITICAL' && (i.status === 'OPEN' || i.status === 'PROPOSED')
    );

    if (hasOpenCritical) {
      return HttpResponse.json(
        {
          detail: 'Cannot commit batch: 1 unresolved CRITICAL issue remaining (V002 on row 8). All critical issues must be resolved or dismissed before committing.',
          code: 'UNRESOLVED_CRITICAL_ISSUES',
        },
        { status: 409 }
      );
    }

    const batchId = (params.id as string) || 'batch-demo-2';
    batches = batches.map((b) =>
      b.id === batchId || b.id === 'batch-demo-2'
        ? { ...b, status: 'COMMITTED' as const, quality_score: 96.5, quality_score_after: 96.5 }
        : b
    );

    // Broadcast live SSE ticker event for AICTE console
    sseTickerEventsState.unshift({
      id: `sse-${Date.now()}`,
      event_type: 'batch.committed',
      title: 'Batch Committed',
      message: `Batch #${batchId} committed to Central Registry (64 records, quality score 96.5%)`,
      timestamp: 'Just now',
      severity: 'INFO',
      batch_id: batchId,
      link: `/institution/batches/${batchId}/review`,
    });

    return HttpResponse.json({
      batch_id: batchId,
      status: 'COMMITTED',
      committed_records: 64,
      excluded_records: 1,
      quality_score_before: 74.0,
      quality_score_after: 96.5,
      committed_at: new Date().toISOString(),
    });
  }),

  // AICTE Console Endpoints
  http.get('*/v1/dashboards/aicte/summary', () => {
    return HttpResponse.json(aicteSummaryState);
  }),

  http.get('*/v1/dashboards/aicte', () => {
    return HttpResponse.json(aicteSummaryState);
  }),

  http.get('*/v1/dashboards/aicte/map', ({ request }) => {
    const url = new URL(request.url);
    const stateCode = url.searchParams.get('state_code');
    if (stateCode) {
      const institutions = mockDrilldownInstitutions[stateCode] || [];
      return HttpResponse.json(institutions);
    }
    return HttpResponse.json(mockStateMetrics);
  }),

  http.get('*/v1/dashboards/map', ({ request }) => {
    const url = new URL(request.url);
    const stateCode = url.searchParams.get('state_code');
    if (stateCode) {
      const institutions = mockDrilldownInstitutions[stateCode] || [];
      return HttpResponse.json(institutions);
    }
    return HttpResponse.json(mockStateMetrics);
  }),

  http.get('*/v1/dashboards/aicte/leaderboards', () => {
    return HttpResponse.json(mockLeaderboards);
  }),

  http.get('*/v1/dashboards/aicte/quotas', () => {
    return HttpResponse.json({
      schemes: mockSupernumerarySchemes,
      shares: mockQuotaShares,
    });
  }),

  http.get('*/v1/dashboards/aicte/duplicates', () => {
    return HttpResponse.json(crossDuplicatesState);
  }),

  http.post('*/v1/dashboards/aicte/duplicates/:id/resolve', async ({ params, request }) => {
    const clusterId = params.id as string;
    const body = (await request.json()) as { decision: 'SAME_PERSON' | 'DIFFERENT_PEOPLE' | 'TRANSFER'; note?: string };
    const cluster = crossDuplicatesState.find((c) => c.cluster_id === clusterId);

    if (cluster) {
      cluster.status = `RESOLVED_${body.decision}` as any;
      if (body.decision === 'TRANSFER') {
        sseTickerEventsState.unshift({
          id: `sse-${Date.now()}`,
          event_type: 'transfer.decided',
          title: 'Cross-Dupe Transfer Resolved',
          message: `Cluster ${clusterId} resolved via statutory inter-institution transfer`,
          timestamp: 'Just now',
          severity: 'INFO',
        });
      }
    }
    return HttpResponse.json(cluster || { cluster_id: clusterId, status: `RESOLVED_${body.decision}` });
  }),

  http.get('*/v1/dashboards/aicte/anomalies', () => {
    return HttpResponse.json(mockAnomalyFeed);
  }),

  http.get('*/v1/dashboards/aicte/reconciliation', ({ request }) => {
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');
    const q = url.searchParams.get('q')?.toLowerCase() || '';

    let items = [...aicteReconciliationState];
    if (statusFilter && statusFilter !== 'ALL') {
      items = items.filter((item) => item.status === statusFilter);
    }
    if (q) {
      items = items.filter(
        (item) =>
          item.institution_name.toLowerCase().includes(q) ||
          item.institution_aicte_id.toLowerCase().includes(q) ||
          item.program_code.toLowerCase().includes(q)
      );
    }
    return HttpResponse.json(items);
  }),

  http.get('*/v1/audit/verify-chain', () => {
    return HttpResponse.json(auditVerificationState);
  }),

  http.post('*/v1/audit/verify-chain/recalculate', () => {
    auditVerificationState.verified_at = new Date().toISOString();
    return HttpResponse.json(auditVerificationState);
  }),

  http.get('*/v1/audit/log', () => {
    return HttpResponse.json(auditLogState);
  }),

  http.get('*/v1/admin/master/:entity', ({ params }) => {
    const entity = params.entity as string;
    if (entity === 'institutions') return HttpResponse.json(mockMasterInstitutions);
    if (entity === 'dabs') return HttpResponse.json(mockMasterDabs);
    if (entity === 'programs') return HttpResponse.json(mockMasterPrograms);
    if (entity === 'academic-years') return HttpResponse.json(mockMasterAcademicYears);
    return HttpResponse.json({ message: `Entity ${entity} not found` }, { status: 404 });
  }),

  http.post('*/v1/admin/rollover', async ({ request }) => {
    const url = new URL(request.url);
    const isDryRun = url.searchParams.get('dry_run') === 'true';

    if (isDryRun) {
      return HttpResponse.json(mockRolloverDryRun);
    }

    sseTickerEventsState.unshift({
      id: `sse-${Date.now()}`,
      event_type: 'rollover.completed',
      title: 'Academic Rollover Executed',
      message: 'Academic Year 2026-27 cohort rollover executed: 385,200 students promoted to Year N+1',
      timestamp: 'Just now',
      severity: 'INFO',
    });

    return HttpResponse.json({
      success: true,
      message: 'Academic Year 2026-27 rollover executed successfully across all institutions',
      from_year: '2025-26',
      to_year: '2026-27',
      executed_at: new Date().toISOString(),
      transaction_id: 'roll-tx-prod-2026-081',
      students_advanced: 385200,
      students_completed: 100090,
    });
  }),

  http.get('*/v1/admin/trust-list', () => {
    return HttpResponse.json(mockTrustList);
  }),

  http.get('*/v1/events/ticker', () => {
    return HttpResponse.json(sseTickerEventsState);
  }),

  http.post('*/v1/events/ticker/simulate', async ({ request }) => {
    const body = (await request.json()) as Partial<SseTickerEvent>;
    const newEvent: SseTickerEvent = {
      id: `sse-${Date.now()}`,
      event_type: body.event_type || 'batch.committed',
      title: body.title || 'Simulated Live Broadcast',
      message: body.message || 'Simulated batch upload event ingested',
      timestamp: 'Just now',
      severity: body.severity || 'INFO',
      institution_name: body.institution_name || 'Simulated Institution',
      batch_id: body.batch_id || 'batch-sim-1',
    };
    sseTickerEventsState.unshift(newEvent);
    return HttpResponse.json(newEvent);
  }),

  http.get('*/v1/dashboards/institution/summary', () => {
    return HttpResponse.json({
      ...mockInstitutionSummary,
      dq_trend: mockDqTrend,
      intake_distribution: mockIntakeDistribution,
      notifications: mockNotifications,
      active_transfers_count: transfersState.filter((t) => t.status === 'PENDING').length,
    });
  }),

  // Students & Lifecycle transitions
  http.get('*/v1/students', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';
    const status = url.searchParams.get('status');
    const program = url.searchParams.get('program');

    let result = [...studentsState];
    if (query) {
      result = result.filter(
        (s) =>
          s.full_name.toLowerCase().includes(query) ||
          s.apaar_id.includes(query) ||
          s.institution_student_id.toLowerCase().includes(query)
      );
    }
    if (status && status !== 'ALL') {
      result = result.filter((s) => s.enrolment_status === status);
    }
    if (program && program !== 'ALL') {
      result = result.filter((s) => s.program_code === program);
    }

    return HttpResponse.json(result);
  }),

  http.get('*/v1/students/:apaar_id', ({ params }) => {
    const student = studentsState.find((s) => s.apaar_id === params.apaar_id);
    if (!student) {
      return HttpResponse.json({ message: 'Student record not found' }, { status: 404 });
    }
    return HttpResponse.json(student);
  }),

  http.post('*/v1/students/:apaar_id/transitions', async ({ params, request }) => {
    const body = (await request.json()) as {
      to_status: EnrolmentStatus;
      effective_date: string;
      reason: string;
      evidence_ref?: string;
    };

    const studentIndex = studentsState.findIndex((s) => s.apaar_id === params.apaar_id);
    if (studentIndex === -1) {
      return HttpResponse.json({ message: 'Student record not found' }, { status: 404 });
    }

    const currentStudent = studentsState[studentIndex];
    const allowed = ALLOWED_TRANSITIONS[currentStudent.enrolment_status] || [];

    if (!allowed.includes(body.to_status)) {
      return HttpResponse.json(
        {
          code: 'V021',
          message: `Disallowed lifecycle transition from ${currentStudent.enrolment_status} to ${body.to_status}`,
          details: 'Disallowed transition per agents.md §8.1 lifecycle state machine.',
        },
        { status: 422 }
      );
    }

    const prevStatus = currentStudent.enrolment_status;
    const updatedStudent: StudentDetailRecord = {
      ...currentStudent,
      enrolment_status: body.to_status,
      versions: [
        {
          version_id: `ver-${Date.now()}`,
          version_number: currentStudent.versions.length + 1,
          changed_at: new Date().toISOString(),
          changed_by: 'inst.admin@demo.local',
          changes_summary: `Enrolment status updated from ${prevStatus} to ${body.to_status}. Reason: ${body.reason}`,
          previous_status: prevStatus,
          new_status: body.to_status,
        },
        ...currentStudent.versions,
      ],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          event_type: 'STATUS_CHANGE',
          from_status: prevStatus,
          to_status: body.to_status,
          effective_date: body.effective_date || new Date().toISOString().split('T')[0],
          reason: body.reason,
          evidence_ref: body.evidence_ref || '',
          actor: 'Dr. Ramesh Sharma (Admin)',
          timestamp: new Date().toISOString(),
        },
        ...currentStudent.timeline,
      ],
    };

    studentsState[studentIndex] = updatedStudent;
    return HttpResponse.json(updatedStudent);
  }),

  // Transfers
  http.get('*/v1/transfers', ({ request }) => {
    const url = new URL(request.url);
    const direction = url.searchParams.get('direction');
    const status = url.searchParams.get('status');

    let result = [...transfersState];
    if (direction) {
      result = result.filter((t) => t.direction === direction);
    }
    if (status) {
      result = result.filter((t) => t.status === status);
    }
    return HttpResponse.json(result);
  }),

  http.post('*/v1/transfers', async ({ request }) => {
    const body = (await request.json()) as {
      apaar_id: string;
      from_institution_id: string;
      from_institution_name?: string;
      to_program_code: string;
      reason: string;
      transfer_certificate_ref?: string;
    };

    const newTransfer: TransferRequestItem = {
      id: `TR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      apaar_id: body.apaar_id,
      from_institution_id: body.from_institution_id,
      from_institution_name: body.from_institution_name || 'Source AICTE Institution',
      to_institution_id: '1-1234567890',
      to_institution_name: 'Delhi Institute of Engineering & Technology (Current)',
      to_program_code: body.to_program_code || 'UG-CSE',
      reason: body.reason,
      status: 'PENDING',
      requested_at: new Date().toISOString(),
      direction: 'OUTGOING',
      is_overdue_15_days: false,
      evidence_ref: body.transfer_certificate_ref || '',
    };

    transfersState.unshift(newTransfer);
    return HttpResponse.json(newTransfer, { status: 201 });
  }),

  http.post('*/v1/transfers/:id/decide', async ({ params, request }) => {
    const body = (await request.json()) as {
      decision: 'APPROVED' | 'REJECTED';
      remarks?: string;
    };

    const idx = transfersState.findIndex((t) => t.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ message: 'Transfer request not found' }, { status: 404 });
    }

    const current = transfersState[idx];
    const updated: TransferRequestItem = {
      ...current,
      status: body.decision,
      decided_at: new Date().toISOString(),
      decided_by: 'Dr. Ramesh Sharma',
      decision_note: body.remarks || `Marked ${body.decision} by source institution`,
    };
    transfersState[idx] = updated;

    // If approved, transition corresponding student record to TRANSFERRED_OUT per agents.md §8.1
    if (body.decision === 'APPROVED') {
      const studentIdx = studentsState.findIndex((s) => s.apaar_id === current.apaar_id);
      if (studentIdx !== -1) {
        studentsState[studentIdx] = {
          ...studentsState[studentIdx],
          enrolment_status: 'TRANSFERRED_OUT',
          timeline: [
            {
              id: `tl-trans-${Date.now()}`,
              event_type: 'STATUS_CHANGE',
              from_status: studentsState[studentIdx].enrolment_status,
              to_status: 'TRANSFERRED_OUT',
              effective_date: new Date().toISOString().split('T')[0],
              reason: `Inter-institution transfer ${current.id} approved`,
              evidence_ref: current.id,
              actor: 'Transfer Workflow Engine',
              timestamp: new Date().toISOString(),
            },
            ...studentsState[studentIdx].timeline,
          ],
        };
      }
    }

    return HttpResponse.json(updated);
  }),

  http.post('*/v1/transfers/:id/override', ({ params }) => {
    const idx = transfersState.findIndex((t) => t.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ message: 'Transfer not found' }, { status: 404 });
    }

    const updated: TransferRequestItem = {
      ...transfersState[idx],
      status: 'OVERRIDDEN',
      decided_at: new Date().toISOString(),
      decided_by: 'AICTE Central Desk',
      decision_note: 'Statutory 15-day non-response administrative override applied',
    };
    transfersState[idx] = updated;
    return HttpResponse.json(updated);
  }),

  // Aggregates & Reconciliation
  http.get('*/v1/aggregates', () => {
    return HttpResponse.json(aggregatesState);
  }),

  http.post('*/v1/aggregates', async ({ request }) => {
    const body = (await request.json()) as {
      academic_year?: string;
      programs: ProgramAggregateItem[];
    };

    if (body.programs && body.programs.length > 0) {
      aggregatesState = body.programs;
      // Recompute reconciliation
      reconciliationState = body.programs.map((p) => {
        const delta = p.total_enrolment - p.declared_intake;
        return {
          program_code: p.program_code,
          program_name: p.program_name,
          declared: p.declared_intake,
          submitted: p.total_enrolment,
          delta,
          status: delta === 0 ? 'MATCH' : delta > 0 ? 'EXCESS' : 'MISMATCH',
        };
      });
    }

    return HttpResponse.json({ success: true, count: aggregatesState.length }, { status: 201 });
  }),

  http.get('*/v1/reconciliation', () => {
    return HttpResponse.json(reconciliationState);
  }),

  // Webhooks
  http.get('*/v1/webhooks', () => {
    return HttpResponse.json(webhooksState);
  }),

  http.post('*/v1/webhooks', async ({ request }) => {
    const body = (await request.json()) as { url: string; events: string[] };
    const rawSecret = `whsec_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 8)}`;
    const newHook: WebhookConfigItem = {
      id: `whk-${Date.now()}`,
      url: body.url,
      events: body.events || ['batch.committed'],
      is_active: true,
      secret_masked: `${rawSecret.substring(0, 10)}****${rawSecret.slice(-4)}`,
      created_at: new Date().toISOString(),
      deliveries: [],
    };

    webhooksState.unshift(newHook);
    return HttpResponse.json({ ...newHook, raw_secret: rawSecret }, { status: 201 });
  }),

  http.delete('*/v1/webhooks/:id', ({ params }) => {
    webhooksState = webhooksState.filter((w) => w.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('*/v1/webhooks/:id/test', ({ params }) => {
    const hook = webhooksState.find((w) => w.id === params.id);
    if (!hook) {
      return HttpResponse.json({ message: 'Webhook not found' }, { status: 404 });
    }

    const testDelivery = {
      id: `del-${Date.now()}`,
      event: 'ping.test',
      status_code: 200,
      response_time_ms: 112,
      retry_count: 0,
      delivered_at: new Date().toISOString(),
      status: 'SUCCESS' as const,
      payload_summary: 'ping payload with HMAC-SHA256 test signature',
    };

    hook.deliveries.unshift(testDelivery);
    return HttpResponse.json({ message: 'Test ping delivered successfully', delivery: testDelivery });
  }),

  http.post('*/v1/verify', () => {
    return HttpResponse.json({
      status: 'VALID',
      disclosed_claims: {
        apaar_id: '1234****9012',
        full_name: 'Aditi Verma',
        program_code: 'BTECH-CSE',
        institution_name: 'Delhi Institute of Engineering & Technology',
        enrolment_status: 'ACTIVE',
        admission_year: 2026,
      },
      issuer: {
        did: 'did:web:aicte.gov.in',
        name: 'AICTE Central Registry',
        trusted: true,
      },
      verified_at: new Date().toISOString(),
    });
  }),
];

