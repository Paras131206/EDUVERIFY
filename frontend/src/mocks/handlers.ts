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
} from './data';

import { BatchItem } from '@/features/institution/types';

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

export const resetBatchMock = () => {
  batches = [...mockBatches] as unknown as BatchItem[];
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
      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        academicYear = (formData.get('academic_year') as string) || academicYear;
        supersedesBatchId = (formData.get('supersedes_batch_id') as string) || null;
        const file = formData.get('file');
        if (file && typeof file === 'object' && 'name' in file) {
          filename = (file as File).name;
        }
        if (formData.get('trigger_conflict') === 'true' || filename.includes('conflict')) {
          triggerConflict = true;
        }
      } else {
        // In JSDOM test runner, FormData may arrive without standard multipart header
        try {
          const formData = await request.formData();
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

  http.get('*/v1/batches/:id/report', () => {
    return HttpResponse.json(mockBatchReport);
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
    return HttpResponse.json(mockBatchReport.issues);
  }),

  http.post('*/v1/batches/:id/commit', () => {
    return HttpResponse.json({
      ...mockBatches[1],
      status: 'COMMITTED',
      quality_score_after: 96.5,
    });
  }),

  http.post('*/v1/issues/:id/decide', async ({ params, request }) => {
    const body = (await request.json()) as { decision: string };
    const issue = mockBatchReport.issues.find((i) => i.issue_id === params.id);
    return HttpResponse.json({
      ...issue,
      status: body.decision === 'ACCEPT_FIX' ? 'FIXED' : 'DISMISSED',
    });
  }),

  http.get('*/v1/dashboards/aicte/summary', () => {
    return HttpResponse.json(mockAicteSummary);
  }),

  http.get('*/v1/dashboards/institution/summary', () => {
    return HttpResponse.json(mockInstitutionSummary);
  }),

  http.get('*/v1/duplicates', () => {
    return HttpResponse.json(mockBatchReport.duplicate_clusters);
  }),

  http.get('*/v1/transfers', () => {
    return HttpResponse.json([
      {
        id: 'tr-01',
        apaar_id: '123456789012',
        from_institution_id: '1-1234567890',
        to_institution_id: '1-9876543210',
        status: 'PENDING',
        reason: 'Relocation of family',
        created_at: '2026-08-01T10:00:00Z',
      },
    ]);
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
