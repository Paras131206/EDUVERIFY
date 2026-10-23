import { http, HttpResponse } from 'msw';
import {
  mockUser,
  mockBatches,
  mockBatchReport,
  mockAicteSummary,
  mockInstitutionSummary,
} from './data';

export const handlers = [
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
    if (body.password === 'badpassword') {
      return HttpResponse.json({ detail: 'Invalid credentials or account locked' }, { status: 401 });
    }
    return HttpResponse.json({
      access_token: 'mock-jwt-access-token-12345',
      token_type: 'bearer',
      expires_in: 900,
      user: {
        ...mockUser,
        email: body.email || mockUser.email,
      },
    });
  }),

  http.post('*/v1/auth/refresh', () => {
    return HttpResponse.json({
      access_token: 'mock-refreshed-jwt-token-67890',
      token_type: 'bearer',
      expires_in: 900,
      user: mockUser,
    });
  }),

  http.get('*/v1/auth/me', () => {
    return HttpResponse.json(mockUser);
  }),

  http.post('*/v1/auth/logout', () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
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
    return HttpResponse.json(mockBatches);
  }),

  http.post('*/v1/batches', () => {
    return HttpResponse.json(
      {
        id: `batch-${Date.now()}`,
        institution_aicte_id: '1-1234567890',
        academic_year: '2026-27',
        filename: 'uploaded_batch.csv',
        status: 'MAPPING',
        rows_total: 65,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.get('*/v1/batches/:id', ({ params }) => {
    const batch = mockBatches.find((b) => b.id === params.id) || mockBatches[1];
    return HttpResponse.json(batch);
  }),

  http.get('*/v1/batches/:id/report', () => {
    return HttpResponse.json(mockBatchReport);
  }),

  http.get('*/v1/batches/:id/mapping', () => {
    return HttpResponse.json(mockBatchReport.column_mapping);
  }),

  http.put('*/v1/batches/:id/mapping', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockBatches[1],
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
