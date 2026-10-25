import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { StudentsPage } from '@/features/institution/StudentsPage';
import { TransfersPage } from '@/features/institution/TransfersPage';
import { AggregatesPage } from '@/features/institution/AggregatesPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { InstitutionDashboardPage } from '@/features/institution/InstitutionDashboardPage';
import { AuthContext, AuthContextType } from '@/lib/auth';
import { resetOperationsMock } from '@/mocks/handlers';
import { markDocumentUploaded } from '@/lib/uploadState';
import { User } from '@/types/auth';

const mockAdminUser: User = {
  id: 'usr-admin-1',
  email: 'admin@institution.edu.in',
  role: 'INSTITUTION_ADMIN',
  full_name: 'Dr. Ramesh Sharma',
  institution_aicte_id: '1-1234567890',
  dab_id: null,
  student_apaar_hash: null,
};

const createMockAuthContext = (user: User = mockAdminUser): AuthContextType => ({
  user,
  accessToken: 'mock-token',
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  verifyTotp: vi.fn(),
  logout: vi.fn(),
  refreshSession: vi.fn(),
  stayLoggedIn: vi.fn(),
});

describe('Task A4: Institution Operations & Lifecycle Management', () => {
  beforeEach(() => {
    resetOperationsMock();
    vi.clearAllMocks();
  });

  const renderComponent = (ui: React.ReactElement, initialPath = '/') => {
    const authValue = createMockAuthContext();
    return render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path={initialPath} element={ui} />
            <Route path="/institution/students" element={<StudentsPage />} />
            <Route path="/institution/transfers" element={<TransfersPage />} />
            <Route path="/institution/aggregates" element={<AggregatesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/webhooks" element={<SettingsPage />} />
            <Route path="/institution" element={<InstitutionDashboardPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  describe('1. Student Central Registry & Lifecycle Transitions (/institution/students)', () => {
    it('renders searchable student list with masked APAAR IDs by default', async () => {
      renderComponent(<StudentsPage />, '/institution/students');

      expect(screen.getByText(/student central registry/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
      });

      // Masked APAAR displayed
      expect(screen.getByText('9845****2301')).toBeInTheDocument();
      expect(screen.getByText('PRN-2026-008')).toBeInTheDocument();
      expect(screen.getAllByText('ACTIVE').length).toBeGreaterThan(0);
    });

    it('filters student records by search query', async () => {
      renderComponent(<StudentsPage />, '/institution/students');

      await waitFor(() => {
        expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by student name, apaar id/i);
      fireEvent.change(searchInput, { target: { value: 'Priya' } });

      await waitFor(() => {
        expect(screen.getByText('Priya Singh')).toBeInTheDocument();
        expect(screen.queryByText('Rahul Sharma')).not.toBeInTheDocument();
      });
    });

    it('opens student detail drawer with version history and lifecycle timeline', async () => {
      renderComponent(<StudentsPage />, '/institution/students');

      await waitFor(() => {
        expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
      });

      const detailBtns = screen.getAllByRole('button', { name: /details/i });
      fireEvent.click(detailBtns[0]);

      // Drawer opened
      await waitFor(() => {
        expect(screen.getByText(/record version history/i)).toBeInTheDocument();
        expect(screen.getByText(/student lifecycle timeline/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/created from batch #1|initial enrollment/i)).toBeInTheDocument();
      expect(screen.getByText(/admitted via state jee counselling/i)).toBeInTheDocument();
    });

    it('transition dialog strictly enforces allowed transitions: ACTIVE allows only WITHDRAWN, DEFERRED, TRANSFERRED_OUT, COMPLETED and excludes GRADUATED', async () => {
      renderComponent(<StudentsPage />, '/institution/students');

      await waitFor(() => {
        expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
      });

      // Rahul Sharma is ACTIVE
      const changeBtn = screen.getByTestId('change-status-btn-984572912301');
      fireEvent.click(changeBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/change student lifecycle status/i)).toBeInTheDocument();
      });

      const select = screen.getByLabelText(/target status/i) as HTMLSelectElement;
      const options = Array.from(select.options).map((opt) => opt.value).filter(Boolean);

      // Permitted transitions for ACTIVE:
      expect(options).toContain('WITHDRAWN');
      expect(options).toContain('DEFERRED');
      expect(options).toContain('TRANSFERRED_OUT');
      expect(options).toContain('COMPLETED');

      // CRITICAL CHECK: GRADUATED must NOT be available from ACTIVE!
      expect(options).not.toContain('GRADUATED');
    });

    it('transition dialog strictly enforces allowed transitions: DEFERRED allows only ACTIVE and WITHDRAWN', async () => {
      renderComponent(<StudentsPage />, '/institution/students');

      await waitFor(() => {
        expect(screen.getByText('Priya Singh')).toBeInTheDocument();
      });

      // Priya Singh is DEFERRED
      const changeBtn = screen.getByTestId('change-status-btn-984589211044');
      fireEvent.click(changeBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const select = screen.getByLabelText(/target status/i) as HTMLSelectElement;
      const options = Array.from(select.options).map((opt) => opt.value).filter(Boolean);

      expect(options).toEqual(['ACTIVE', 'WITHDRAWN']);
      expect(options).not.toContain('COMPLETED');
      expect(options).not.toContain('GRADUATED');
      expect(options).not.toContain('TRANSFERRED_OUT');
    });

    it('transition dialog strictly enforces allowed transitions: COMPLETED allows only GRADUATED', async () => {
      renderComponent(<StudentsPage />, '/institution/students');

      await waitFor(() => {
        expect(screen.getByText('Ankit Verma')).toBeInTheDocument();
      });

      // Ankit Verma is COMPLETED
      const changeBtn = screen.getByTestId('change-status-btn-984512398455');
      fireEvent.click(changeBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const select = screen.getByLabelText(/target status/i) as HTMLSelectElement;
      const options = Array.from(select.options).map((opt) => opt.value).filter(Boolean);

      expect(options).toEqual(['GRADUATED']);
    });

    it('transition dialog blocks transitions for terminal states (GRADUATED/WITHDRAWN/TRANSFERRED_OUT)', async () => {
      renderComponent(<StudentsPage />, '/institution/students');

      await waitFor(() => {
        expect(screen.getByText('Neha Patel')).toBeInTheDocument();
      });

      // Neha Patel is GRADUATED (terminal state)
      const changeBtn = screen.getByTestId('change-status-btn-984566718293');
      fireEvent.click(changeBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Terminal state warning shown and submit disabled/absent
      expect(screen.getByText(/terminal lifecycle state/i)).toBeInTheDocument();
      expect(screen.getByText(/terminal states \(GRADUATED\) do not allow any further state transitions/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/target status/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/confirm status transition/i)).not.toBeInTheDocument();
    });

    it('executing a valid transition updates student record and records reason and evidence', async () => {
      renderComponent(<StudentsPage />, '/institution/students');

      await waitFor(() => {
        expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
      });

      // Open transition dialog for Rahul (ACTIVE)
      fireEvent.click(screen.getByTestId('change-status-btn-984572912301'));

      await waitFor(() => {
        expect(screen.getByLabelText(/target status/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/target status/i), { target: { value: 'DEFERRED' } });
      fireEvent.change(screen.getByLabelText(/effective date/i), { target: { value: '2026-08-15' } });
      fireEvent.change(screen.getByLabelText(/reason for status change/i), {
        target: { value: 'Approved internship semester abroad' },
      });
      fireEvent.change(screen.getByLabelText(/evidence \/ approval reference/i), {
        target: { value: 'INTERN-ABROAD-2026-99' },
      });

      fireEvent.click(screen.getByRole('button', { name: /confirm status transition/i }));

      await waitFor(() => {
        expect(screen.getByText(/status successfully transitioned to DEFERRED/i)).toBeInTheDocument();
      });
    });
  });

  describe('2. Inter-Institution Transfers (/institution/transfers)', () => {
    it('renders transfers page with 15-day AICTE override disclaimer and tabs', async () => {
      renderComponent(<TransfersPage />, '/institution/transfers');

      expect(screen.getByText(/inter-institution transfers/i)).toBeInTheDocument();
      // 15-day override banner
      expect(screen.getByText(/15-day aicte statutory override rule/i)).toBeInTheDocument();
      expect(screen.getByText('15 calendar days')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('TR-2026-0881')).toBeInTheDocument();
      });

      expect(screen.getByText('PENDING APPROVAL')).toBeInTheDocument();
      expect(screen.getByText('15d OVERDUE')).toBeInTheDocument();
    });

    it('source institution can approve incoming transfer with remarks', async () => {
      renderComponent(<TransfersPage />, '/institution/transfers');

      await waitFor(() => {
        expect(screen.getByText('TR-2026-0881')).toBeInTheDocument();
      });

      const approveBtn = screen.getByTestId('approve-transfer-TR-2026-0881');
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(screen.getByText(/approve transfer request/i)).toBeInTheDocument();
        expect(screen.getByText(/approving will transition your source student record to TRANSFERRED_OUT/i)).toBeInTheDocument();
      });

      const notesInput = screen.getByPlaceholderText(/noc granted by academic senate/i);
      fireEvent.change(notesInput, { target: { value: 'NOC issued; academic transcript forwarded' } });

      fireEvent.click(screen.getByRole('button', { name: /confirm APPROVED/i }));

      await waitFor(() => {
        expect(screen.getByText('APPROVED')).toBeInTheDocument();
      });
    });

    it('source institution can reject incoming transfer with structured reason and preset', async () => {
      renderComponent(<TransfersPage />, '/institution/transfers');

      await waitFor(() => {
        expect(screen.getByText('TR-2026-0881')).toBeInTheDocument();
      });

      const rejectBtn = screen.getByTestId('reject-transfer-TR-2026-0881');
      fireEvent.click(rejectBtn);

      await waitFor(() => {
        expect(screen.getByText(/reject transfer request/i)).toBeInTheDocument();
        expect(screen.getByText(/notice: rejecting will deny this transfer request/i)).toBeInTheDocument();
      });

      // Select preset chip
      fireEvent.click(screen.getByRole('button', { name: /intake exceeded/i }));

      // Confirm REJECTED
      fireEvent.click(screen.getByRole('button', { name: /confirm REJECTED/i }));

      await waitFor(() => {
        expect(screen.getAllByText('REJECTED').length).toBeGreaterThanOrEqual(2);
        expect(
          screen.getByText('Sanctioned intake capacity exceeded in target academic program')
        ).toBeInTheDocument();
      });
    });

    it('creates outgoing transfer request with APAAR ID and source institution search', async () => {
      renderComponent(<TransfersPage />, '/institution/transfers');

      const createBtn = screen.getByRole('button', { name: /request student transfer/i });
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(screen.getByText(/initiate student transfer request/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/student apaar id/i), {
        target: { value: '984572912301' },
      });
      fireEvent.change(screen.getByLabelText(/source institution/i), {
        target: { value: '1-100010005' },
      });
      fireEvent.change(screen.getByLabelText(/target destination program/i), {
        target: { value: 'UG-CSE' },
      });
      fireEvent.change(screen.getByLabelText(/reason for transfer request/i), {
        target: { value: 'Relocation to NCR due to parental transfer' },
      });
      fireEvent.change(screen.getByLabelText(/transfer certificate/i), {
        target: { value: 'TC-RELOC-2026' },
      });

      fireEvent.click(screen.getByRole('button', { name: /submit transfer request/i }));

      await waitFor(() => {
        expect(screen.getByText(/initiated successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('3. Aggregate Enrolments & Intake Reconciliation (/institution/aggregates)', () => {
    it('renders aggregate form and reconciliation view comparing declared vs submitted totals', async () => {
      renderComponent(<AggregatesPage />, '/institution/aggregates');

      expect(screen.getByText(/aggregate enrolment reporting/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getAllByText('B.Tech in Computer Science & Engineering').length).toBeGreaterThan(0);
      });

      // Declared seats & reconciliation metrics
      expect(screen.getByText('Approved Declared Seats')).toBeInTheDocument();
      expect(screen.getByText('Intake Reconciliation: Declared Quota vs. Submitted Enrolment')).toBeInTheDocument();

      // Check status chips in reconciliation table
      expect(screen.getAllByText('MATCH').length).toBeGreaterThan(0);
      expect(screen.getByText('EXCESS (OVER-ENROLLED)')).toBeInTheDocument();
    });

    it('allows updating aggregate enrolment and saves reconciliation', async () => {
      renderComponent(<AggregatesPage />, '/institution/aggregates');

      await waitFor(() => {
        expect(screen.getByDisplayValue('63')).toBeInTheDocument();
      });

      const totalInput = screen.getByDisplayValue('63');
      fireEvent.change(totalInput, { target: { value: '60' } });

      const saveBtn = screen.getByRole('button', { name: /save & reconcile/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/aggregate enrolments saved and reconciled/i)).toBeInTheDocument();
      });
    });
  });

  describe('4. Webhook Configuration & HMAC Verification (/settings/webhooks)', () => {
    it('renders webhooks tab with configured endpoints, test button, and delivery telemetry', async () => {
      renderComponent(<SettingsPage />, '/settings/webhooks');

      await waitFor(() => {
        expect(screen.getByText('Configured Webhook Endpoints')).toBeInTheDocument();
      });

      expect(screen.getByText('https://campus.diet.ac.in/api/v1/eduverify-listener')).toBeInTheDocument();
      expect(screen.getByText('Webhook Delivery Log & Telemetry')).toBeInTheDocument();
      expect(screen.getAllByText(/200 OK/i).length).toBeGreaterThan(0);
    });

    it('register webhook modal shows signing secret ONLY ONCE in copyable modal', async () => {
      renderComponent(<SettingsPage />, '/settings/webhooks');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /register webhook/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /register webhook/i }));

      await waitFor(() => {
        expect(screen.getByText(/register new webhook/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/endpoint destination url/i), {
        target: { value: 'https://erp.newinstitution.edu.in/webhooks' },
      });

      fireEvent.click(screen.getByRole('button', { name: /register endpoint/i }));

      // Secret Modal shown once!
      await waitFor(() => {
        expect(screen.getByText(/webhook signing secret generated/i)).toBeInTheDocument();
        expect(screen.getByText(/secret displayed only once/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/whsec_live_/)).toBeInTheDocument();
      const dismissBtn = screen.getByRole('button', { name: /i have safely saved this secret/i });
      fireEvent.click(dismissBtn);

      // Secret modal closed and state discarded
      await waitFor(() => {
        expect(screen.queryByText(/secret displayed only once/i)).not.toBeInTheDocument();
      });
    });

    it('triggers test ping delivery and updates telemetry log', async () => {
      renderComponent(<SettingsPage />, '/settings/webhooks');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send test/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /send test/i }));

      await waitFor(() => {
        expect(screen.getByText(/ping delivery succeeded/i)).toBeInTheDocument();
      });
    });

    it('renders copyable HMAC signature verification snippets for Node.js, Python, and Go', async () => {
      renderComponent(<SettingsPage />, '/settings/webhooks');

      await waitFor(() => {
        expect(screen.getByText(/hmac-sha256 signature verification snippet/i)).toBeInTheDocument();
      });

      // Node.js by default
      expect(screen.getByText(/crypto\.createHmac\('sha256', secret\)/i)).toBeInTheDocument();

      // Switch to Python
      fireEvent.click(screen.getByRole('button', { name: 'Python' }));
      expect(screen.getByText(/import hmac/i)).toBeInTheDocument();
      expect(screen.getByText(/hmac\.compare_digest/i)).toBeInTheDocument();

      // Switch to Go
      fireEvent.click(screen.getByRole('button', { name: 'Go' }));
      expect(screen.getByText(/func VerifyEduVerifyWebhook/i)).toBeInTheDocument();
    });
  });

  describe('5. Institution Portal (/institution)', () => {
    it('always starts stats from zero initially and populates stats only when documents are uploaded', async () => {
      // 1. Initial state: no document uploaded
      markDocumentUploaded(false);
      const { unmount } = renderComponent(<InstitutionDashboardPage />, '/institution');

      expect(screen.getByText(/institution (portal|dashboard)/i)).toBeInTheDocument();
      expect(screen.queryByText(/load demo document/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/no student data uploaded/i)).not.toBeInTheDocument();

      // Starts from zero
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText(/0\.0%/)).toBeInTheDocument();
      expect(screen.getByText('0 Active')).toBeInTheDocument();
      expect(screen.getByText('0 Open Issues')).toBeInTheDocument();

      unmount();

      // 2. When documents/batches are uploaded
      markDocumentUploaded(true);
      renderComponent(<InstitutionDashboardPage />, '/institution');

      await waitFor(() => {
        expect(screen.getByTestId('kpi-dq-score')).toBeInTheDocument();
        expect(screen.getByTestId('kpi-students-fill')).toBeInTheDocument();
        expect(screen.getByTestId('kpi-transfers')).toBeInTheDocument();
        expect(screen.getByTestId('kpi-open-issues')).toBeInTheDocument();
      });

      // Check populated stats after upload
      expect(screen.getByText('480')).toBeInTheDocument();
      expect(screen.getByText(/92\.3%/)).toBeInTheDocument();
      expect(screen.getByText('1 Active')).toBeInTheDocument();
      expect(screen.getByText('4 Open Issues')).toBeInTheDocument();

      // Check chart containers
      expect(screen.getByTestId('card-dq-trend')).toBeInTheDocument();
      expect(screen.getByTestId('card-intake-chart')).toBeInTheDocument();

      // Check open issues list and notifications feed
      expect(screen.getByTestId('dashboard-open-issues-card')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-notifications-card')).toBeInTheDocument();
      expect(screen.getByText('Transfer Request Awaiting Decision')).toBeInTheDocument();
    });
  });
});
