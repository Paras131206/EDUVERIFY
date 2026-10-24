import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AicteDashboardPage } from '@/features/aicte/AicteDashboardPage';
import { AuthContext, AuthContextType } from '@/lib/auth';
import { resetAicteMock, setMockAicteSummary } from '@/mocks/handlers';
import { User } from '@/types/auth';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

const mockAicteAdminUser: User = {
  id: 'usr-aicte-1',
  email: 'director@aicte-india.org',
  role: 'AICTE_ADMIN',
  full_name: 'Dr. T.G. Sitharam',
  institution_aicte_id: null,
  dab_id: null,
  student_apaar_hash: null,
};

const createMockAuthContext = (user: User = mockAicteAdminUser): AuthContextType => ({
  user,
  accessToken: 'mock-aicte-token',
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  verifyTotp: vi.fn(),
  logout: vi.fn(),
  refreshSession: vi.fn(),
  stayLoggedIn: vi.fn(),
});

describe('Task A5: AICTE Central Repository Console (/aicte)', () => {
  beforeEach(() => {
    resetAicteMock();
    vi.clearAllMocks();
  });

  const renderAictePage = (initialPath = '/aicte') => {
    const authValue = createMockAuthContext();
    return render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/aicte" element={<AicteDashboardPage />} />
            <Route
              path="/institution/batches/:id/review"
              element={<div data-testid="batch-review-target">Batch Review Page</div>}
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  describe('1. Header & Audit Chain Integrity Badge', () => {
    it('calls /v1/audit/verify-chain and displays green "Audit chain intact" badge in header', async () => {
      renderAictePage();

      await waitFor(() => {
        const badge = screen.getByTestId('header-audit-badge');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent(/Audit chain intact/i);
      });
    });

    it('displays red broken chain badge with first broken ID when audit chain is compromised', async () => {
      server.use(
        http.get('*/v1/audit/verify-chain', () => {
          return HttpResponse.json({
            verified: false,
            total_records: 1420,
            broken_link_id: 'aud-0089',
            verified_at: new Date().toISOString(),
            root_hash: 'tampered-hash-000',
          });
        })
      );

      renderAictePage();

      await waitFor(() => {
        const badge = screen.getByTestId('header-audit-badge');
        expect(badge).toHaveTextContent(/Audit chain broken: #aud-0089/i);
        expect(badge.className).toContain('bg-red-50');
      });
    });
  });

  describe('2. Overview: KPI Cards & SSE Live Ticker', () => {
    it('renders all required overview KPI metrics', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('aicte-kpi-overview')).toBeInTheDocument();
      });

      // 1. Total Institutions
      expect(screen.getByTestId('kpi-institutions')).toHaveTextContent('8,420');

      // 2. Dual Coverage (Student-level vs Aggregate-only)
      const coverageCard = screen.getByTestId('kpi-coverage');
      expect(coverageCard).toHaveTextContent('85%');
      expect(coverageCard).toHaveTextContent(/student-level/i);
      expect(coverageCard).toHaveTextContent(/aggregate-only/i);

      // 3. Total Students Enrolled
      expect(screen.getByTestId('kpi-students')).toHaveTextContent('4,85,290');

      // 4. Avg Fill Percentage
      expect(screen.getByTestId('kpi-avg-fill')).toHaveTextContent('92.4%');

      // 5. Excess Seats
      expect(screen.getByTestId('kpi-excess-seats')).toHaveTextContent('342');

      // 6. National Avg DQ Score
      expect(screen.getByTestId('kpi-avg-dq')).toHaveTextContent('93%');
    });

    it('renders SSE live ticker, supports pause/resume, and receives simulated batch commit event', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('sse-live-ticker')).toBeInTheDocument();
      });

      // Ticker contains initial mock event types (with dot replaced by space)
      expect(screen.getByText(/batch committed/i)).toBeInTheDocument();
      expect(screen.getByText(/anomaly detected/i)).toBeInTheDocument();
      expect(screen.getByText(/duplicate cross/i)).toBeInTheDocument();

      // Pause ticker
      const pauseBtn = screen.getByRole('button', { name: /^pause$/i });
      fireEvent.click(pauseBtn);
      expect(screen.getByRole('button', { name: /^resume$/i })).toBeInTheDocument();

      // Resume ticker
      const resumeBtn = screen.getByRole('button', { name: /^resume$/i });
      fireEvent.click(resumeBtn);
      expect(screen.getByRole('button', { name: /^pause$/i })).toBeInTheDocument();

      // Simulate Batch Commit
      const simulateBtn = screen.getByRole('button', { name: /simulate commit/i });
      fireEvent.click(simulateBtn);

      await waitFor(() => {
        expect(screen.getByText(/510 records verified/i)).toBeInTheDocument();
      });
    });
  });

  describe('3. India Map by State & Fallback Grid with Drilldown', () => {
    it('gracefully renders official state tile-grid fallback keyed by LGD code when GeoJSON is missing', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('india-map-section')).toBeInTheDocument();
      });

      // Fallback state tile-grid renders with official LGD codes (e.g. MH 27, DL 07, KA 29)
      const fallbackGrid = screen.getByTestId('map-tile-grid-fallback');
      expect(fallbackGrid).toBeInTheDocument();
      expect(screen.getByTestId('state-tile-27')).toBeInTheDocument(); // Maharashtra
      expect(screen.getByTestId('state-tile-29')).toBeInTheDocument(); // Karnataka
      expect(screen.getByTestId('state-tile-07')).toBeInTheDocument(); // Delhi
    });

    it('switches metric selector between fill %, excess, DQ score, and coverage', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('india-map-section')).toBeInTheDocument();
      });

      // Select excess seats metric
      const excessBtn = screen.getByTestId('metric-btn-excess');
      fireEvent.click(excessBtn);
      expect(screen.getByTestId('state-tile-27')).toHaveTextContent(/excess/i);

      // Select DQ score metric
      const dqBtn = screen.getByTestId('metric-btn-dq');
      fireEvent.click(dqBtn);
      expect(screen.getByTestId('state-tile-27')).toHaveTextContent(/% DQ/i);

      // Select coverage metric
      const covBtn = screen.getByTestId('metric-btn-coverage');
      fireEvent.click(covBtn);
      expect(screen.getByTestId('state-tile-27')).toHaveTextContent(/% coverage/i);

      // Select fill metric
      const fillBtn = screen.getByTestId('metric-btn-fill');
      fireEvent.click(fillBtn);
      expect(screen.getByTestId('state-tile-27')).toHaveTextContent(/%/);
    });

    it('clicks state tile and loads district/institution drilldown table', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('state-tile-27')).toBeInTheDocument();
      });

      // Click Maharashtra (LGD 27)
      fireEvent.click(screen.getByTestId('state-tile-27'));

      // Drilldown table should appear
      await waitFor(() => {
        expect(screen.getByTestId('state-drilldown-table')).toBeInTheDocument();
      });

      const drilldown = screen.getByTestId('state-drilldown-table');
      expect(within(drilldown).getByText(/LGD Code: 27/i)).toBeInTheDocument();
      expect(within(drilldown).getByText(/Maharashtra Institute of Technology Pune/i)).toBeInTheDocument();

      // Search filter within drilldown
      const searchInput = within(drilldown).getByPlaceholderText(/filter institutions/i);
      fireEvent.change(searchInput, { target: { value: 'Mumbai' } });

      expect(within(drilldown).getByText(/Mumbai Institute of Engineering & Research/i)).toBeInTheDocument();
      expect(within(drilldown).queryByText(/Maharashtra Institute of Technology Pune/i)).not.toBeInTheDocument();
    });
  });

  describe('4. Leaderboards Section', () => {
    it('renders leaderboards for excess enrolment, lowest DQ, and cross-duplicates', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('leaderboards-section')).toBeInTheDocument();
      });

      const lb = screen.getByTestId('leaderboards-section');

      // Default: Excess Enrolment
      expect(within(lb).getByText(/Metropolitan Management Institute/i)).toBeInTheDocument();
      expect(within(lb).getByText(/\+48 Excess/i)).toBeInTheDocument();

      // Switch to Lowest DQ Tab
      const dqTab = within(lb).getByTestId('tab-leaderboard-dq');
      fireEvent.click(dqTab);
      expect(within(lb).getByText(/Rural Polytechnic Institute Delhi/i)).toBeInTheDocument();
      expect(within(lb).getByText(/64\.2% DQ/i)).toBeInTheDocument();

      // Switch to Cross-Duplicates Tab
      const dupTab = within(lb).getByTestId('tab-leaderboard-duplicates');
      fireEvent.click(dupTab);
      expect(within(lb).getByText(/Delhi College of Engineering & Technology/i)).toBeInTheDocument();
      expect(within(lb).getByText(/18 Dupes/i)).toBeInTheDocument();
    });
  });

  describe('5. Quota & Supernumerary Seat Breakdown', () => {
    it('renders supernumerary schemes breakdown and switches share charts', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('quota-seat-section')).toBeInTheDocument();
      });

      const quota = screen.getByTestId('quota-seat-section');

      // Supernumerary schemes cards
      expect(within(quota).getByText(/Tuition Fee Waiver Scheme/i)).toBeInTheDocument();
      expect(within(quota).getByText(/Economically Weaker Section/i)).toBeInTheDocument();
      expect(within(quota).getByText(/PM Special Scholarship Scheme/i)).toBeInTheDocument();

      // Toggle between Top States and Top Programs shares
      const programToggle = within(quota).getByRole('button', { name: /top programs/i });
      fireEvent.click(programToggle);

      const statesToggle = within(quota).getByRole('button', { name: /top states/i });
      fireEvent.click(statesToggle);
      expect(statesToggle.className).toContain('bg-gov-navy');
    });
  });

  describe('6. Cross-Institution Duplicate Queue & Compare/Resolve Modal', () => {
    it('opens side-by-side comparison modal and resolves duplicate cluster', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('cross-duplicates-section')).toBeInTheDocument();
      });

      // Click "Compare & Resolve" on first cluster
      const compareButtons = screen.getAllByRole('button', { name: /compare & resolve/i });
      fireEvent.click(compareButtons[0]);

      // Verify side-by-side modal opened
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByText(/Cross-Institution Duplicate Biometric & Record Compare/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Rahul Sharma/i).length).toBeGreaterThan(0);

      // Action: Confirm as Same Person
      const samePersonBtn = screen.getByRole('button', { name: /confirm same person/i });
      fireEvent.click(samePersonBtn);

      // Modal closes and success banner appears
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.getByText(/Resolution submitted for cluster cl-cross-001: SAME_PERSON/i)).toBeInTheDocument();
      });
    });
  });

  describe('7. Algorithmic Anomaly & Drift Feed', () => {
    it('displays anomaly feed items with method, baseline comparison, and batch link', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('anomaly-drift-feed-section')).toBeInTheDocument();
      });

      const anom = screen.getByTestId('anomaly-drift-feed-section');
      expect(within(anom).getByText(/nri_share/i)).toBeInTheDocument();
      expect(within(anom).getByText(/Sudden surge in NRI quota enrolments/i)).toBeInTheDocument();
      expect(within(anom).getByText(/z = \+6.1 \(IsolationForest\)/i)).toBeInTheDocument();

      // Batch link navigates to batch review
      const batchLink = within(anom).getAllByRole('link', { name: /batch review/i })[0];
      expect(batchLink).toHaveAttribute('href', '/institution/batches/batch-demo-4/review');
    });
  });

  describe('8. Reconciliation View (Declared vs Uploaded)', () => {
    it('filters programs by status (all, mismatches, excess)', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('reconciliation-view-section')).toBeInTheDocument();
      });

      const rec = screen.getByTestId('reconciliation-view-section');

      // Initial shows all items
      expect(within(rec).getAllByText(/UG-CSE/i).length).toBeGreaterThan(0);

      // Filter by Mismatch
      const mismatchBtn = within(rec).getByTestId('filter-rec-mismatch');
      fireEvent.click(mismatchBtn);
      expect(within(rec).getAllByText(/UG-ECE/i).length).toBeGreaterThan(0);

      // Filter by Excess
      const excessBtn = within(rec).getByTestId('filter-rec-excess');
      fireEvent.click(excessBtn);
      expect(within(rec).getAllByText(/PG-MBA/i).length).toBeGreaterThan(0);

      // Filter back to all
      const allBtn = within(rec).getByTestId('filter-rec-all');
      fireEvent.click(allBtn);

      // Search program
      const searchInput = within(rec).getByPlaceholderText(/search institution \/ program/i);
      fireEvent.change(searchInput, { target: { value: 'UG-MECH' } });
      expect(within(rec).getAllByText(/UG-MECH/i).length).toBeGreaterThan(0);
    });
  });

  describe('9. Audit Chain Log & Verification', () => {
    it('displays cryptographic audit log and triggers re-verification and simulate break', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('audit-chain-section')).toBeInTheDocument();
      });

      const audit = screen.getByTestId('audit-chain-section');

      // Shows audit records with hashes
      expect(within(audit).getAllByText(/7f83b165/i).length).toBeGreaterThan(0);
      expect(within(audit).getByText(/TRANSFER_STATUTORY_OVERRIDE/i)).toBeInTheDocument();

      // Verify chain button recalculates
      const verifyBtn = within(audit).getByRole('button', { name: /verify chain/i });
      fireEvent.click(verifyBtn);

      await waitFor(() => {
        expect(within(audit).getByText(/Audit chain intact/i)).toBeInTheDocument();
      });

      // Simulate break button
      const breakBtn = within(audit).getByRole('button', { name: /simulate break/i });
      fireEvent.click(breakBtn);

      await waitFor(() => {
        expect(within(audit).getByText(/Audit chain broken: link #aud-40/i)).toBeInTheDocument();
      });

      // Restore intact
      fireEvent.click(within(audit).getByRole('button', { name: /restore intact/i }));
      await waitFor(() => {
        expect(within(audit).getByText(/Audit chain intact/i)).toBeInTheDocument();
      });
    });
  });

  describe('10. Admin Section: Master Data, Rollover Wizard & Trust List', () => {
    it('browses master data tables and switches entities', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('admin-section')).toBeInTheDocument();
      });

      const admin = screen.getByTestId('admin-section');

      // Default master entity: Institutions
      await waitFor(() => {
        expect(within(admin).getAllByText(/Delhi College of Engineering & Technology/i).length).toBeGreaterThan(0);
      });

      // Switch to Programs
      const programsTab = within(admin).getByRole('button', { name: /programs/i });
      fireEvent.click(programsTab);

      await waitFor(() => {
        expect(within(admin).getAllByText(/UG-CSE/i).length).toBeGreaterThan(0);
      });
    });

    it('runs academic year rollover wizard dry run and confirms execution', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('admin-section')).toBeInTheDocument();
      });

      const admin = screen.getByTestId('admin-section');

      // Switch to Rollover tab
      const rolloverTab = within(admin).getByTestId('admin-tab-rollover');
      fireEvent.click(rolloverTab);

      // Verify dry run summary
      expect(within(admin).getByText(/Step 1: Execute Pre-Flight Dry Run/i)).toBeInTheDocument();

      // Run dry run
      const dryRunBtn = within(admin).getByRole('button', { name: /run dry run projection/i });
      fireEvent.click(dryRunBtn);

      await waitFor(() => {
        expect(within(admin).getByText(/Advancing to Year N\+1/i)).toBeInTheDocument();
      });

      // Open confirm dialog
      const launchBtn = within(admin).getByRole('button', { name: /proceed to confirm rollover/i });
      fireEvent.click(launchBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click final confirm
      const confirmBtn = screen.getByRole('button', { name: /confirm & execute rollover/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(within(admin).getByText(/Rollover Executed Successfully/i)).toBeInTheDocument();
      });
    });

    it('views root trust list of signing authorities', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('admin-section')).toBeInTheDocument();
      });

      const admin = screen.getByTestId('admin-section');

      // Switch to Trust List tab
      const trustTab = within(admin).getByTestId('admin-tab-trust');
      fireEvent.click(trustTab);

      expect(within(admin).getByText(/AICTE National Apex Credential Authority/i)).toBeInTheDocument();
      expect(within(admin).getByText(/did:web:dcet.eduverify.ac.in/i)).toBeInTheDocument();
    });
  });

  describe('11. Empty, Error, and Offline States', () => {
    it('renders empty state when central repository has 0 institutions', async () => {
      setMockAicteSummary({
        total_institutions: 0,
        total_students: 0,
      });

      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('aicte-empty-state')).toBeInTheDocument();
        expect(screen.getByText(/No Institution Records Available/i)).toBeInTheDocument();
      });
    });

    it('renders offline warning banner when offline event triggers', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('aicte-dashboard-page')).toBeInTheDocument();
      });

      // Dispatch offline event on window
      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        expect(screen.getByTestId('aicte-offline-banner')).toBeInTheDocument();
        expect(screen.getByText(/Working Offline/i)).toBeInTheDocument();
      });

      // Dispatch online event
      fireEvent(window, new Event('online'));

      await waitFor(() => {
        expect(screen.queryByTestId('aicte-offline-banner')).not.toBeInTheDocument();
      });
    });
  });
});
