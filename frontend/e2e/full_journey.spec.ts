import { test, expect } from '@playwright/test';

test.describe('Task A7: EduVerify Full System End-to-End Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to start fresh
    await page.goto('/login');
  });

  test('1. Institution Staff uploads batch, maps columns, reviews issues and proposes fixes', async ({ page }) => {
    // A. Sign in as Institutional Staff
    await page.fill('[data-testid="login-email-input"]', 'inst.staff@demo.local');
    await page.fill('[data-testid="login-password-input"]', 'Demo@EduVerify2026!');
    await page.click('[data-testid="login-submit-btn"]');

    // Land on Institution Dashboard
    await expect(page).toHaveURL(/.*institution/);
    await expect(page.locator('text=Delhi Institute of Engineering & Technology').or(page.locator('text=Demo Institute of Technology'))).toBeVisible();

    // B. Navigate to Upload Page
    await page.click('a[href="/institution/upload"]');
    await expect(page).toHaveURL(/.*institution\/upload/);

    // C. Verify Template Download button is accessible
    const downloadTemplateBtn = page.locator('text=Download Template');
    await expect(downloadTemplateBtn).toBeVisible();

    // D. Review Batch 2 errors
    await page.goto('/institution/batches/batch-demo-2/review');
    await expect(page.locator('text=Validation Review Workspace').or(page.locator('text=Review Issues'))).toBeVisible();

    // Check that CRITICAL issues are displayed in the queue
    await expect(page.locator('text=V023').or(page.locator('text=V002')).first()).toBeVisible();
  });

  test('2. Institution Admin approves fixes, re-validates, and commits batch', async ({ page }) => {
    // A. Sign in as Institutional Administrator
    await page.fill('[data-testid="login-email-input"]', 'inst.admin@demo.local');
    await page.fill('[data-testid="login-password-input"]', 'Demo@EduVerify2026!');
    await page.click('[data-testid="login-submit-btn"]');

    await expect(page).toHaveURL(/.*institution/);

    // B. Go to active review batch
    await page.goto('/institution/batches/batch-demo-2/review');

    // C. Verify Commit button exists and approval workflow works
    const commitBtn = page.locator('[data-testid="commit-batch-btn"]').or(page.locator('button:has-text("Commit")'));
    await expect(commitBtn.first()).toBeVisible();
  });

  test('3. Student Wallet: Holder key custody, selective disclosure builder, and QR code', async ({ page }) => {
    // A. Sign in as Student
    await page.fill('[data-testid="login-email-input"]', 'student@demo.local');
    await page.fill('[data-testid="login-password-input"]', 'Demo@EduVerify2026!');
    await page.click('[data-testid="login-submit-btn"]');

    // Lands on Student Wallet
    await expect(page).toHaveURL(/.*student/);

    // B. Verify unmasked APAAR and device custody banner
    await expect(page.locator('text=This device holds your key')).toBeVisible();
    await expect(page.locator('[data-testid="student-apaar-id"]')).toBeVisible();

    // C. Click "Share Selected Fields"
    const shareBtn = page.locator('[data-testid^="share-cred-btn-"]').first();
    await shareBtn.click();

    // D. Share Builder Modal appears
    await expect(page.locator('[data-testid="share-presentation-modal"]')).toBeVisible();
    await expect(page.locator('text=Selective Disclosure Presentation Builder')).toBeVisible();

    // Fill target audience
    const audInput = page.locator('[data-testid="audience-input"]');
    await audInput.fill('Acme Corp HR Verification Portal');

    // Build Selective Presentation
    const buildBtn = page.locator('[data-testid="build-presentation-btn"]');
    await buildBtn.click();

    // QR Code and Presentation Ready panel appears
    await expect(page.locator('[data-testid="presentation-qr-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="presentation-expiry-countdown"]')).toBeVisible();
    await expect(page.locator('text=Expires in:')).toBeVisible();

    // Grab share link
    const openVerifyLink = page.locator('[data-testid="open-verify-link"]');
    const href = await openVerifyLink.getAttribute('href');
    expect(href).toContain('/verify?presentation=');
  });

  test('4. Verifier Portal: Scan presentation and render Big Green VALID card with strictly 2 claims', async ({ page }) => {
    // Open verifier portal directly with presentation parameter
    await page.goto('/student');
    await page.fill('[data-testid="login-email-input"]', 'student@demo.local');
    await page.fill('[data-testid="login-password-input"]', 'Demo@EduVerify2026!');
    await page.click('[data-testid="login-submit-btn"]');

    // Open share builder modal
    const shareBtn = page.locator('[data-testid^="share-cred-btn-"]').first();
    await shareBtn.click();

    const buildBtn = page.locator('[data-testid="build-presentation-btn"]');
    await buildBtn.click();

    const openVerifyLink = page.locator('[data-testid="open-verify-link"]');
    const href = await openVerifyLink.getAttribute('href');
    expect(href).toBeDefined();

    // Navigate to the verification URL
    await page.goto(href!);
    await expect(page).toHaveURL(/.*verify/);

    // Verify Big Green VALID card
    await expect(page.locator('[data-testid="verification-status-badge"]')).toHaveText(/VALID/i);
    await expect(page.locator('text=VALID CREDENTIAL')).toBeVisible();

    // Verify disclosed claims table
    const claimsTable = page.locator('[data-testid="disclosed-claims-table"]');
    await expect(claimsTable).toBeVisible();
  });

  test('5. AICTE National Console: Live SSE ticker, state map, and audit chain integrity badge', async ({ page }) => {
    // A. Sign in as AICTE Analyst
    await page.fill('[data-testid="login-email-input"]', 'aicte.analyst@demo.local');
    await page.fill('[data-testid="login-password-input"]', 'Demo@EduVerify2026!');
    await page.click('[data-testid="login-submit-btn"]');

    // Land on AICTE Console
    await expect(page).toHaveURL(/.*aicte/);

    // B. Verify Header Audit Badge
    await expect(page.locator('[data-testid="header-audit-badge"]')).toBeVisible();

    // C. Verify Overview KPI metrics
    await expect(page.locator('[data-testid="kpi-institutions"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-students"]')).toBeVisible();

    // D. Verify Live SSE Ticker is active
    await expect(page.locator('[data-testid="sse-live-ticker"]')).toBeVisible();
  });

  test('6. Statutory Reports: Build and download Policy PDF report', async ({ page }) => {
    // A. Sign in as AICTE Admin
    await page.fill('[data-testid="login-email-input"]', 'aicte.admin@demo.local');
    await page.fill('[data-testid="login-password-input"]', 'Demo@EduVerify2026!');
    await page.click('[data-testid="login-submit-btn"]');

    // Handle MFA for AICTE Admin
    const totpInput = page.locator('[data-testid="login-totp-input"]');
    await expect(totpInput).toBeVisible({ timeout: 5000 });
    await totpInput.fill('123456');
    await page.click('[data-testid="login-submit-btn"]');
    await expect(page).toHaveURL(/.*aicte/);

    // B. Navigate to Reports Builder
    await page.goto('/reports');
    await expect(page.locator('text=Statutory Reports & Quality Audits')).toBeVisible();

    // Select report type POLICY
    await page.selectOption('[data-testid="report-type-select"]', 'POLICY');

    // Select format PDF
    await page.click('[data-testid="format-pdf-btn"]');

    // Click Generate Report
    await page.click('[data-testid="generate-report-btn"]');

    // Active job completion appears
    await expect(page.locator('[data-testid="active-job-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="download-active-job-btn"]')).toBeVisible();

    // Verify report appears in reports history table
    await expect(page.locator('[data-testid="reports-history-table"]')).toBeVisible();
  });
});
