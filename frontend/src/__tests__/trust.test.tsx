import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import fs from 'fs';
import path from 'path';

import { getOrInitHolderKey, getStoredHolderKey, clearHolderKey } from '@/lib/holderKey';
import { buildSelectivePresentation, parsePresentation } from '@/lib/sdjwt';
import { StudentWalletPage } from '@/features/student/StudentWalletPage';
import { VerifierPage } from '@/features/verifier/VerifierPage';
import { DabDashboardPage } from '@/features/dab/DabDashboardPage';
import { mockStudentCredentials } from '@/mocks/data';
import { resetTrustMock } from '@/mocks/handlers';

describe('Task A6: Trust UIs, Holder Key, Selective Disclosure & Verification', () => {
  beforeEach(async () => {
    resetTrustMock();
    await clearHolderKey();
  });

  describe('1. WebCrypto Holder Key & Non-Extractability', () => {
    it('generates an ECDSA P-256 key pair with privateKey extractable set to false', async () => {
      const { privateKey, publicKey, isNew } = await getOrInitHolderKey(true);

      expect(isNew).toBe(true);
      expect(privateKey).toBeDefined();
      expect(privateKey.algorithm.name).toBe('ECDSA');
      expect((privateKey.algorithm as any).namedCurve).toBe('P-256');

      // CRITICAL SECURITY REQUIREMENT: Holder private key must NEVER be extractable
      expect(privateKey.extractable).toBe(false);

      // Attempting to export the private key must throw an error in WebCrypto
      await expect(
        window.crypto.subtle.exportKey('jwk', privateKey)
      ).rejects.toThrow();

      // Public key must be extractable so it can be registered with the verifier / central registry
      expect(publicKey.extractable).toBe(true);
      const publicJwk = await window.crypto.subtle.exportKey('jwk', publicKey);
      expect(publicJwk.kty).toBe('EC');
      expect(publicJwk.crv).toBe('P-256');
    });

    it('persists key in IndexedDB and retrieves the same key on subsequent calls without re-generating', async () => {
      const first = await getOrInitHolderKey(false);
      expect(first.isNew).toBe(true);

      // Second retrieval from IndexedDB
      const second = await getOrInitHolderKey(false);
      expect(second.isNew).toBe(false);
      expect(second.publicJwk.x).toEqual(first.publicJwk.x);
      expect(second.publicJwk.y).toEqual(first.publicJwk.y);

      const stored = await getStoredHolderKey();
      expect(stored).not.toBeNull();
      expect(stored?.privateKey.extractable).toBe(false);
    });
  });

  describe('2. Selective Disclosure Presentation Builder (@sd-jwt/core spec)', () => {
    it('includes strictly the selected claims and signs KB-JWT with holder hardware key', async () => {
      const { privateKey } = await getOrInitHolderKey(false);
      const rawSdJwt = mockStudentCredentials[0].raw_sd_jwt;

      // Select ONLY 2 claims: full_name and program_name
      const selectedKeys = ['full_name', 'program_name'];
      const audience = 'https://verifier.tcs-campus.in';
      const nonce = 'nonce-test-xyz-12345';

      const { presentation, disclosedClaims, sdHash, kbJwt } =
        await buildSelectivePresentation(rawSdJwt, selectedKeys, audience, nonce, privateKey);

      // 1. Assert presentation structure: <Issuer-JWT>~<Disc1>~<Disc2>~<KB-JWT>
      expect(presentation).toContain('~');
      expect(kbJwt).toBeDefined();
      expect(sdHash).toBeDefined();
      expect(disclosedClaims).toEqual({
        full_name: 'Rahul Sharma',
        program_name: 'B.Tech Computer Science & Engineering',
      });

      // 2. Decode presentation using parsePresentation
      const parsed = parsePresentation(presentation);

      // 3. Assert ONLY chosen claims are present in disclosedClaims
      expect(Object.keys(parsed.disclosedClaims).sort()).toEqual(['full_name', 'program_name'].sort());
      expect(parsed.disclosedClaims.full_name).toBe('Rahul Sharma');
      expect(parsed.disclosedClaims.program_name).toBe('B.Tech Computer Science & Engineering');

      // 4. Assert sensitive unselected claims (DOB, APAAR, category, etc.) are ABSENT
      expect(parsed.disclosedClaims.apaar_id).toBeUndefined();
      expect(parsed.disclosedClaims.dob).toBeUndefined();
      expect(parsed.disclosedClaims.category).toBeUndefined();
      expect(parsed.disclosedClaims.institution_student_id).toBeUndefined();

      // 5. Assert KB-JWT payload contains aud, nonce, and sd_hash matching the presentation
      expect(parsed.kbJwtPayload).toBeDefined();
      expect(parsed.kbJwtPayload.aud).toBe(audience);
      expect(parsed.kbJwtPayload.nonce).toBe(nonce);
      expect(parsed.kbJwtPayload.sd_hash).toBe(sdHash);
    });
  });

  describe('3. Student Wallet UI (/student)', () => {
    it('renders own unmasked record and device holder key notice', async () => {
      render(
        <MemoryRouter initialEntries={['/student']}>
          <Routes>
            <Route path="/student" element={<StudentWalletPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Device custody banner
      expect(
        await screen.findByText(/This device holds your key; if you clear browser data you must request re-issue/i)
      ).toBeInTheDocument();
      expect(screen.getByTestId('holder-key-badge')).toHaveTextContent(/Hardware Key Active/i);

      // Unmasked Student Profile for self
      expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
      expect(screen.getByText('984512349012')).toBeInTheDocument(); // Unmasked for self
      expect(screen.getByText('2026/UG/CSE/042')).toBeInTheDocument();
      expect(screen.getByText(/B.Tech Computer Science & Engineering/i)).toBeInTheDocument();
    });

    it('renders version history ledger and expands details', async () => {
      render(
        <MemoryRouter initialEntries={['/student']}>
          <Routes>
            <Route path="/student" element={<StudentWalletPage />} />
          </Routes>
        </MemoryRouter>
      );

      const versionToggleBtn = await screen.findByTestId('toggle-version-history-btn');
      expect(versionToggleBtn).toHaveTextContent(/Version History/i);

      // Expand history
      fireEvent.click(versionToggleBtn);

      expect(await screen.findByText(/Statutory Record Version Ledger/i)).toBeInTheDocument();
      expect(screen.getByText(/Initial admission batch committed/i)).toBeInTheDocument();
    });

    it('manages statutory consent: withdrawing VERIFICATION_SHARE suspends credentials', async () => {
      render(
        <MemoryRouter initialEntries={['/student']}>
          <Routes>
            <Route path="/student" element={<StudentWalletPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Wait for consent card
      expect(await screen.findByText(/Statutory Consent & Purpose Governance/i)).toBeInTheDocument();

      // Find VERIFICATION_SHARE toggle
      const shareToggle = screen.getByTestId('consent-toggle-VERIFICATION_SHARE');
      expect(shareToggle).toBeInTheDocument();

      // Click to toggle off -> opens confirmation warning dialog
      fireEvent.click(shareToggle);

      expect(await screen.findByText(/Withdraw Verification Consent\?/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Withdrawing VERIFICATION_SHARE immediately suspends your verifiable credentials/i)
      ).toBeInTheDocument();

      // Confirm withdrawal
      const confirmBtn = screen.getByTestId('confirm-withdraw-consent-btn');
      fireEvent.click(confirmBtn);

      // Toast notification shows credentials suspended
      expect(await screen.findByTestId('student-toast-msg')).toHaveTextContent(
        /Credentials have been suspended/i
      );

      // Credential status chips should now reflect SUSPENDED
      await waitFor(() => {
        const suspendedBadges = screen.getAllByText('SUSPENDED');
        expect(suspendedBadges.length).toBeGreaterThan(0);
      });
    });

    it('opens "Share Selected Fields" builder and generates QR code with selective presentation', async () => {
      render(
        <MemoryRouter initialEntries={['/student']}>
          <Routes>
            <Route path="/student" element={<StudentWalletPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Wait for credentials
      expect(await screen.findByText(/B.Tech Enrolment Verifiable Credential/i)).toBeInTheDocument();

      // Click "Share Selected Fields"
      const shareBtns = screen.getAllByTestId(/^share-cred-btn-/);
      fireEvent.click(shareBtns[0]);

      // Share Builder modal opens
      expect(await screen.findByTestId('share-presentation-modal')).toBeInTheDocument();
      expect(screen.getByText(/Selective Disclosure Presentation Builder/i)).toBeInTheDocument();

      // Check claims checkboxes: uncheck everything except full_name and program_name
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(2);

      // Enter audience
      const audienceInput = screen.getByTestId('audience-input');
      fireEvent.change(audienceInput, { target: { value: 'Infosys Campus Verification' } });

      // Click Generate Presentation
      const generateBtn = screen.getByTestId('build-presentation-btn');
      fireEvent.click(generateBtn);

      // QR Code container and link should appear
      expect(await screen.findByTestId('presentation-qr-container')).toBeInTheDocument();
      expect(screen.getByTestId('copy-share-link-btn')).toBeInTheDocument();
      expect(screen.getByText(/Expires in:/i)).toBeInTheDocument();
    });
  });

  describe('4. Verifier Portal UI (/verify) & Screen States', () => {
    it('verifies a valid presentation and renders big green VALID card with strictly disclosed fields', async () => {
      const { privateKey } = await getOrInitHolderKey(false);
      const rawSdJwt = mockStudentCredentials[0].raw_sd_jwt;

      // Generate presentation with ONLY name and program
      const { presentation } = await buildSelectivePresentation(
        rawSdJwt,
        ['full_name', 'program_name'],
        'Verifier Portal',
        'nonce-12345',
        privateKey
      );

      render(
        <MemoryRouter initialEntries={[`/verify?presentation=${encodeURIComponent(presentation)}`]}>
          <Routes>
            <Route path="/verify" element={<VerifierPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Wait for verification result
      expect(await screen.findByTestId('verification-result-card')).toBeInTheDocument();

      // 1. Big green VALID badge
      expect(screen.getByTestId('verification-status-badge')).toHaveTextContent('VALID');

      // 2. Issuer and timestamps
      expect(screen.getAllByText('Delhi College of Engineering & Technology').length).toBeGreaterThan(0);

      // 3. Disclosed claims table contains ONLY the 2 disclosed fields
      expect(screen.getByTestId('claim-full_name')).toHaveTextContent('Rahul Sharma');
      expect(screen.getByTestId('claim-program_name')).toHaveTextContent('B.Tech Computer Science & Engineering');

      // 4. Sensitive unselected fields are NEVER displayed
      expect(screen.queryByTestId('claim-apaar_id')).not.toBeInTheDocument();
      expect(screen.queryByTestId('claim-dob')).not.toBeInTheDocument();
      expect(screen.queryByTestId('claim-category')).not.toBeInTheDocument();

      // 5. Cryptographic reasons
      expect(screen.getByText(/Issuer Ed25519 signature verified against AICTE Trust List/i)).toBeInTheDocument();
      expect(screen.getByText(/KB-JWT holder key binding verified with client WebCrypto hardware key/i)).toBeInTheDocument();
    });

    it('renders big red INVALID card on tampered payload or corrupted signature', async () => {
      const tamperedPresentation = 'eyJhbGciOiJFZERTQSJ9.invalid.signature~TAMPERED~';

      render(
        <MemoryRouter initialEntries={[`/verify?presentation=${encodeURIComponent(tamperedPresentation)}`]}>
          <Routes>
            <Route path="/verify" element={<VerifierPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByTestId('verification-result-card')).toBeInTheDocument();

      // Big red INVALID badge
      expect(screen.getByTestId('verification-status-badge')).toHaveTextContent('INVALID');
      expect(screen.getByText(/Cryptographic signature or disclosure digest mismatch/i)).toBeInTheDocument();
    });

    it('renders big amber SUPERSEDED card when outdated credential is presented', async () => {
      const supersededPresentation = 'eyJhbGciOiJFZERTQSJ9.header.payload~SUPERSEDED~';

      render(
        <MemoryRouter initialEntries={[`/verify?presentation=${encodeURIComponent(supersededPresentation)}`]}>
          <Routes>
            <Route path="/verify" element={<VerifierPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByTestId('verification-result-card')).toBeInTheDocument();

      // Big amber SUPERSEDED badge
      expect(screen.getByTestId('verification-status-badge')).toHaveTextContent('SUPERSEDED');
      expect(screen.getAllByText(/A newer student record version exists/i).length).toBeGreaterThan(0);
    });

    it('renders big grey SUSPENDED card with 0 disclosed claims when consent is withdrawn', async () => {
      // First withdraw consent via API
      await fetch('/v1/students/me/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'VERIFICATION_SHARE',
          action: 'WITHDRAWN',
          notes: 'Testing suspension on consent withdrawal',
        }),
      });

      render(
        <MemoryRouter initialEntries={['/verify?presentation=valid_token']}>
          <Routes>
            <Route path="/verify" element={<VerifierPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByTestId('verification-result-card')).toBeInTheDocument();

      // Big grey SUSPENDED badge
      expect(screen.getByTestId('verification-status-badge')).toHaveTextContent('SUSPENDED');
      expect(screen.getAllByText(/Holder has withdrawn VERIFICATION_SHARE consent/i).length).toBeGreaterThan(0);

      // ZERO claims should be disclosed
      expect(screen.getByText(/No claims disclosed/i)).toBeInTheDocument();
    });
  });

  describe('5. DAB Portal (/dab) & Degree Credential Issuance', () => {
    it('lists graduates of affiliated institutions with credential status', async () => {
      render(
        <MemoryRouter initialEntries={['/dab']}>
          <Routes>
            <Route path="/dab" element={<DabDashboardPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByText(/Degree Awarding Board \(DAB\) Portal/i)).toBeInTheDocument();
      expect(await screen.findByTestId('graduates-table')).toBeInTheDocument();

      // Check graduate items
      expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
      expect(screen.getByText('Priya K. Patel')).toBeInTheDocument();
      expect(screen.getByText('Amit Vikram Kumar')).toBeInTheDocument();
    });

    it('issues degree credential for pending graduate and allows previewing certificate', async () => {
      render(
        <MemoryRouter initialEntries={['/dab']}>
          <Routes>
            <Route path="/dab" element={<DabDashboardPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByTestId('graduates-table')).toBeInTheDocument();

      // Find "Issue Degree Credential" button for pending graduate (Rahul Sharma: stu-grad-001)
      const issueBtn = screen.getByTestId('issue-degree-btn-stu-grad-001');
      expect(issueBtn).toBeInTheDocument();

      fireEvent.click(issueBtn);

      // Toast confirms issuance
      expect(await screen.findByTestId('dab-toast-success')).toHaveTextContent(
        /Degree credential successfully issued for Rahul Sharma/i
      );

      // Button transforms into "View Certificate"
      const viewCertBtn = await screen.findByTestId('view-cert-btn-stu-grad-001');
      expect(viewCertBtn).toBeInTheDocument();

      // Click "View Certificate"
      fireEvent.click(viewCertBtn);

      // Certificate modal preview opens
      expect(await screen.findByTestId('certificate-modal')).toBeInTheDocument();
      expect(screen.getByTestId('cert-apaar-id')).toHaveTextContent('984512349012');
      expect(screen.getByTestId('cert-qr-wrapper')).toBeInTheDocument();
    });
  });

  describe('6. Print-Ready A4 WeasyPrint HTML/CSS Templates', () => {
    const templatesDir = path.resolve(__dirname, '../../../reports/templates');

    it('provides certificate.html with bilingual text, A4 layout, and placeholders', () => {
      const certPath = path.join(templatesDir, 'certificate.html');
      expect(fs.existsSync(certPath)).toBe(true);

      const content = fs.readFileSync(certPath, 'utf-8');

      // A4 page setup and no JS
      expect(content).toContain('@page');
      expect(content).toContain('size: A4 landscape');
      expect(content).not.toContain('<script');

      // Bilingual labels (Hindi + English)
      expect(content).toContain('अखिल भारतीय तकनीकी शिक्षा परिषद');
      expect(content).toContain('All India Council for Technical Education');
      expect(content).toContain('उपाधि प्रमाण पत्र');
      expect(content).toContain('Degree Certificate');

      // Required Jinja2 placeholders
      expect(content).toContain('{{ qr_data_uri }}');
      expect(content).toContain('{{ student_name }}');
      expect(content).toContain('{{ apaar_id }}');
      expect(content).toContain('{{ institution_student_id }}');
      expect(content).toContain('{{ program_name }}');
      expect(content).toContain('{{ credential_id }}');
    });

    it('provides policy_report.html with Jinja2 placeholders for statutory intake compliance', () => {
      const policyPath = path.join(templatesDir, 'policy_report.html');
      expect(fs.existsSync(policyPath)).toBe(true);

      const content = fs.readFileSync(policyPath, 'utf-8');
      expect(content).toContain('@page');
      expect(content).toContain('size: A4 portrait');
      expect(content).toContain('institution_name');
      expect(content).toContain('approved_intake');
      expect(content).toContain('total_enrolled');
      expect(content).toContain('compliance_status');
    });

    it('provides dq_report.html with Jinja2 placeholders for data quality score audit', () => {
      const dqPath = path.join(templatesDir, 'dq_report.html');
      expect(fs.existsSync(dqPath)).toBe(true);

      const content = fs.readFileSync(dqPath, 'utf-8');
      expect(content).toContain('@page');
      expect(content).toContain('size: A4 portrait');
      expect(content).toContain('batch_id');
      expect(content).toContain('quality_score_before');
      expect(content).toContain('quality_score_after');
      expect(content).toContain('resolved_issues_count');
    });
  });

  describe('7. End-to-End Verification Flow Check', () => {
    it('http://localhost:5173/student -> share name + program only -> verify in /verify -> VALID with 2 fields', async () => {
      // Step A: In student wallet, build presentation with ONLY name and program
      const { privateKey } = await getOrInitHolderKey(false);
      const cred = mockStudentCredentials[0];

      const { presentation, disclosedClaims } = await buildSelectivePresentation(
        cred.raw_sd_jwt,
        ['full_name', 'program_name'],
        'AICTE Testing Verifier',
        'nonce-check-e2e',
        privateKey
      );

      expect(Object.keys(disclosedClaims)).toHaveLength(2);

      // Step B: In Verifier portal, load the QR link URL
      render(
        <MemoryRouter initialEntries={[`/verify?presentation=${encodeURIComponent(presentation)}`]}>
          <Routes>
            <Route path="/verify" element={<VerifierPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Wait for result
      expect(await screen.findByTestId('verification-result-card')).toBeInTheDocument();
      expect(screen.getByTestId('verification-status-badge')).toHaveTextContent('VALID');

      // Verify EXACTLY 2 fields disclosed
      const claimRows = screen.getAllByTestId(/^claim-/);
      expect(claimRows).toHaveLength(2);
      expect(screen.getByTestId('claim-full_name')).toHaveTextContent('Rahul Sharma');
      expect(screen.getByTestId('claim-program_name')).toHaveTextContent('B.Tech Computer Science & Engineering');
    });
  });

  describe('6. User-Type Consent Governance & Document Verification Permissions', () => {
    it('renders user-type consent controls for different verifier types in student wallet', async () => {
      render(
        <MemoryRouter initialEntries={['/student']}>
          <Routes>
            <Route path="/student" element={<StudentWalletPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByTestId('user-type-consents-section')).toBeInTheDocument();

      // Check all 6 user types rendered
      expect(screen.getByTestId('user-type-card-EMPLOYER')).toBeInTheDocument();
      expect(screen.getByTestId('user-type-card-HIGHER_ED')).toBeInTheDocument();
      expect(screen.getByTestId('user-type-card-GOVERNMENT')).toBeInTheDocument();
      expect(screen.getByTestId('user-type-card-FINANCIAL')).toBeInTheDocument();
      expect(screen.getByTestId('user-type-card-REGULATORY')).toBeInTheDocument();
      expect(screen.getByTestId('user-type-card-PUBLIC')).toBeInTheDocument();

      // Verify status badges
      expect(screen.getByTestId('user-type-status-EMPLOYER')).toHaveTextContent('GRANTED');
      expect(screen.getByTestId('user-type-status-FINANCIAL')).toHaveTextContent('WITHDRAWN');
    });

    it('allows student to toggle consent for specific user types', async () => {
      render(
        <MemoryRouter initialEntries={['/student']}>
          <Routes>
            <Route path="/student" element={<StudentWalletPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByTestId('user-type-card-FINANCIAL')).toBeInTheDocument();

      // Financial is initially WITHDRAWN
      const financialToggle = screen.getByTestId('user-type-toggle-FINANCIAL');
      expect(financialToggle).toHaveTextContent('Grant');

      // Click to grant consent
      fireEvent.click(financialToggle);

      // Verify toast / update
      expect(await screen.findByTestId('student-toast-msg')).toHaveTextContent(/Consent for .* set to GRANTED/i);
    });

    it('allows student to configure document viewing and verification scope via modal', async () => {
      render(
        <MemoryRouter initialEntries={['/student']}>
          <Routes>
            <Route path="/student" element={<StudentWalletPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByTestId('user-type-card-EMPLOYER')).toBeInTheDocument();

      // Click Configure Scope on EMPLOYER
      const configBtn = screen.getByTestId('user-type-config-EMPLOYER');
      fireEvent.click(configBtn);

      // Modal appears
      expect(await screen.findByTestId('user-type-config-modal')).toBeInTheDocument();
      expect(screen.getByTestId('scope-toggle-view')).toBeChecked();
      expect(screen.getByTestId('scope-toggle-verify')).toBeChecked();

      // Toggle document permission (e.g. uncheck MARKSHEET_TRANSCRIPT)
      const transcriptCheckbox = screen.getByTestId('scope-doc-MARKSHEET_TRANSCRIPT');
      fireEvent.click(transcriptCheckbox);

      // Save scope configuration
      const saveBtn = screen.getByTestId('save-scope-config-btn');
      fireEvent.click(saveBtn);

      // Modal closes and toast confirms
      await waitFor(() => {
        expect(screen.queryByTestId('user-type-config-modal')).not.toBeInTheDocument();
      });
      expect(await screen.findByTestId('student-toast-msg')).toHaveTextContent(/Updated permissions and document scope/i);
    });

    it('enforces user-type consent on the Verifier page: blocks verification when role consent is withdrawn', async () => {
      // 1. Verifying with FINANCIAL role where consent is withdrawn
      render(
        <MemoryRouter initialEntries={['/verify?presentation=valid_token&verifier_type=FINANCIAL']}>
          <Routes>
            <Route path="/verify" element={<VerifierPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByTestId('verification-result-card')).toBeInTheDocument();

      // Status should be SUSPENDED with 0 disclosed claims
      expect(screen.getByTestId('verification-status-badge')).toHaveTextContent('SUSPENDED');
      expect(screen.getByText(/Holder has restricted document verification for Banks & Education Loan Lenders/i)).toBeInTheDocument();
      expect(screen.getByText(/No claims disclosed/i)).toBeInTheDocument();
    });

    it('permits verification when user-type consent is granted and updates upon student revocation', async () => {
      // 1. Verifying with EMPLOYER role where consent is granted
      const { unmount } = render(
        <MemoryRouter initialEntries={['/verify?presentation=valid_token&verifier_type=EMPLOYER']}>
          <Routes>
            <Route path="/verify" element={<VerifierPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByTestId('verification-result-card')).toBeInTheDocument();
      expect(screen.getByTestId('verification-status-badge')).toHaveTextContent('VALID');
      unmount();

      // 2. Student withdraws consent for EMPLOYER
      await fetch('/v1/students/me/user-consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_type: 'EMPLOYER',
          is_granted: false,
          can_verify: false,
          notes: 'Revoked employer verification consent',
        }),
      });

      // 3. Verifying again with EMPLOYER is now blocked
      render(
        <MemoryRouter initialEntries={['/verify?presentation=valid_token&verifier_type=EMPLOYER']}>
          <Routes>
            <Route path="/verify" element={<VerifierPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByTestId('verification-result-card')).toBeInTheDocument();
      expect(screen.getByTestId('verification-status-badge')).toHaveTextContent('SUSPENDED');
      expect(screen.getByText(/Holder has restricted document verification for Corporate Employers & Recruiters/i)).toBeInTheDocument();
      expect(screen.getByText(/No claims disclosed/i)).toBeInTheDocument();
    });
  });
});
