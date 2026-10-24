import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AicteDashboardPage } from '@/features/aicte/AicteDashboardPage';
import { AuthContext, AuthContextType } from '@/lib/auth';
import { resetAicteMock } from '@/mocks/handlers';
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
            <Route path="/institution/batches/:id/review" element={<div data-testid="batch-review-target">Batch Review Page</div>} />
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
      expect(screen.getByTestId('kpi-total-institutions')).toHaveTextContent('40');

      // 2. Dual Coverage (Student-level vs Aggregate-only)
      const coverageCard = screen.getByTestId('kpi-coverage');
      expect(coverageCard).toHaveTextContent('85%');
      expect(coverageCard).toHaveTextContent(/student-level/i);
      expect(coverageCard).toHaveTextContent(/aggregate-only/i);

      // 3. Total Students Enrolled
      expect(screen.getByTestId('kpi-total-students')).toHaveTextContent('14,820');

      // 4. Avg Fill Percentage
      expect(screen.getByTestId('kpi-fill-pct')).toHaveTextContent('92.4%');

      // 5. Excess Seats
      expect(screen.getByTestId('kpi-excess-seats')).toHaveTextContent('342');

      // 6. National Avg DQ Score
      expect(screen.getByTestId('kpi-avg-dq')).toHaveTextContent('92.8');
    });

    it('renders SSE live ticker, supports pause/resume, and receives simulated batch commit event', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('sse-live-ticker')).toBeInTheDocument();
      });

      // Ticker contains events
      expect(screen.getByText(/BATCH COMMITTED/i)).toBeInTheDocument();
      expect(screen.getByText(/ANOMALY DETECTED/i)).toBeInTheDocument();
      expect(screen.getByText(/CROSS DUPLICATE/i)).toBeInTheDocument();

      // Pause ticker
      const pauseBtn = screen.getByRole('button', { name: /pause ticker stream/i });
      fireEvent.click(pauseBtn);
      expect(screen.getByText(/ticker paused/i)).toBeInTheDocument();

      // Resume ticker
      const resumeBtn = screen.getByRole('button', { name: /resume ticker stream/i });
      fireEvent.click(resumeBtn);
      expect(screen.queryByText(/ticker paused/i)).not.toBeInTheDocument();

      // Simulate Batch Commit
      const simulateBtn = screen.getByRole('button', { name: /simulate batch commit/i });
      fireEvent.click(simulateBtn);

      await waitFor(() => {
        expect(screen.getByText(/Govt Engineering College Salem/i)).toBeInTheDocument();
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
      const fallbackGrid = screen.getByTestId('state-tile-grid-fallback');
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
      const excessBtn = screen.getByTestId('metric-select-excess');
      fireEvent.click(excessBtn);
      expect(screen.getByText(/National Excess Enrolment: \+342 seats/i)).toBeInTheDocument();

      // Select DQ score metric
      const dqBtn = screen.getByTestId('metric-select-dq');
      fireEvent.click(dqBtn);
      expect(screen.getByText(/National Average DQ Score: 92.8 \/ 100/i)).toBeInTheDocument();

      // Select coverage metric
      const covBtn = screen.getByTestId('metric-select-coverage');
      fireEvent.click(covBtn);
      expect(screen.getByText(/National Coverage: 85.0% verified student-level/i)).toBeInTheDocument();
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
        expect(screen.getByTestId('state-drilldown-panel')).toBeInTheDocument();
      });

      expect(screen.getByText(/Maharashtra Institutions \(LGD: 27\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Pune Institute of Computer Technology/i)).toBeInTheDocument();

      // Search filter within drilldown
      const searchInput = screen.getByTestId('drilldown-search-input');
      fireEvent.change(searchInput, { target: { value: 'VJTI' } });

      expect(screen.getByText(/VJTI Mumbai/i)).toBeInTheDocument();
      expect(screen.queryByText(/Pune Institute of Computer Technology/i)).not.toBeInTheDocument();
    });
  });

  describe('4. Leaderboards Section', () => {
    it('renders leaderboards for excess enrolment, lowest DQ, and cross-duplicates', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('leaderboards-section')).toBeInTheDocument();
      });

      // Default: Excess Enrolment
      expect(screen.getByText(/Pune Institute of Advanced Technology/i)).toBeInTheDocument();
      expect(screen.getByText(/\+48 seats/i)).toBeInTheDocument();

      // Switch to Lowest DQ Tab
      const dqTab = screen.getByTestId('tab-lowest-dq');
      fireEvent.click(dqTab);
      expect(screen.getByText(/Delhi Technological Polytechnic/i)).toBeInTheDocument();
      expect(screen.getByText(/71.4/i)).toBeInTheDocument();

      // Switch to Cross-Duplicates Tab
      const dupTab = screen.getByTestId('tab-cross-duplicates');
      fireEvent.click(dupTab);
      expect(screen.getByText(/Bengaluru City Institute of Science/i)).toBeInTheDocument();
      expect(screen.getByText(/38 dupes/i)).toBeInTheDocument();
    });
  });

  describe('5. Quota & Supernumerary Seat Breakdown', () => {
    it('renders supernumerary schemes breakdown and switches share charts', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('quota-seat-section')).toBeInTheDocument();
      });

      // Supernumerary schemes cards
      expect(screen.getByText(/Tuition Fee Waiver \(TFW\)/i)).toBeInTheDocument();
      expect(screen.getByText(/J&K PMSSS/i)).toBeInTheDocument();
      expect(screen.getByText(/PM-USPY Special Scheme/i)).toBeInTheDocument();

      // Toggle between State-wise and Program-wise shares
      const programToggle = screen.getByRole('button', { name: /by program/i });
      fireEvent.click(programToggle);

      expect(screen.getByText(/NRI, OCI, and Foreign National shares across major programs/i)).toBeInTheDocument();
    });
  });

  describe('6. Cross-Institution Duplicate Queue & Compare/Resolve Modal', () => {
    it('opens side-by-side comparison modal and resolves duplicate cluster', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('cross-duplicates-section')).toBeInTheDocument();
      });

      // Click "Compare Side-by-Side" on cluster clus-001
      const compareBtn = screen.getByTestId('compare-btn-clus-001');
      fireEvent.click(compareBtn);

      // Verify side-by-side modal opened
      await waitFor(() => {
        expect(screen.getByTestId('duplicate-compare-modal')).toBeInTheDocument();
      });

      expect(screen.getByText(/Side-by-Side APAAR Identity Audit/i)).toBeInTheDocument();
      expect(screen.getByText(/Pune Institute of Computer Technology/i)).toBeInTheDocument();
      expect(screen.getByText(/Delhi Technological University/i)).toBeInTheDocument();

      // Action: Confirm as Same Person
      const samePersonBtn = screen.getByTestId('btn-resolve-same-person');
      fireEvent.click(samePersonBtn);

      // Modal closes and success banner appears
      await waitFor(() => {
        expect(screen.queryByTestId('duplicate-compare-modal')).not.toBeInTheDocument();
        expect(screen.getByTestId('resolution-success-banner')).toBeInTheDocument();
      });
    });
  });

  describe('7. Algorithmic Anomaly & Drift Feed', () => {
    it('displays anomaly feed items with method, baseline comparison, and batch link', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('anomaly-drift-feed-section')).toBeInTheDocument();
      });

      expect(screen.getByText(/Unusual Spike in Mechanical Engineering Intake/i)).toBeInTheDocument();
      expect(screen.getByText(/IsolationForest \(contamination=0.02\)/i)).toBeInTheDocument();
      expect(screen.getByText(/z = \+3.42/i)).toBeInTheDocument();

      // Batch link navigates to batch review
      const batchLink = screen.getAllByRole('link', { name: /investigate batch/i })[0];
      expect(batchLink).toHaveAttribute('href', '/institution/batches/batch-001/review');
    });
  });

  describe('8. Reconciliation View (Declared vs Uploaded)', () => {
    it('filters programs by status (all, mismatches, excess)', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('reconciliation-section')).toBeInTheDocument();
      });

      // Initial shows all items
      expect(screen.getByText(/B.Tech Computer Engineering/i)).toBeInTheDocument();

      // Filter by Mismatch
      const mismatchBtn = screen.getByTestId('filter-mismatch');
      fireEvent.click(mismatchBtn);
      expect(screen.getByText(/B.Tech Information Technology/i)).toBeInTheDocument();

      // Filter by Excess
      const excessBtn = screen.getByTestId('filter-excess');
      fireEvent.click(excessBtn);
      expect(screen.getByText(/B.Tech Mechanical Engineering/i)).toBeInTheDocument();

      // Search program
      const searchInput = screen.getByTestId('reconciliation-search-input');
      fireEvent.change(searchInput, { target: { value: 'Mechanical' } });
      expect(screen.getByText(/B.Tech Mechanical Engineering/i)).toBeInTheDocument();
    });
  });

  describe('9. Audit Chain Log & Verification', () => {
    it('displays cryptographic audit log and triggers re-verification', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('audit-chain-section')).toBeInTheDocument();
      });

      // Shows SHA-256 block hashes
      expect(screen.getByText(/0000a1f8c4e2/i)).toBeInTheDocument();

      // Recalculate chain verification
      const verifyBtn = screen.getByRole('button', { name: /recalculate sha-256 chain/i });
      fireEvent.click(verifyBtn);

      await waitFor(() => {
        expect(screen.getByText(/audit chain integrity verified/i)).toBeInTheDocument();
      });
    });
  });

  describe('10. Admin Section: Master Data, Rollover Wizard & Trust List', () => {
    it('browses master data tables and switches entities', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('admin-section')).toBeInTheDocument();
      });

      // Default master entity: Institutions
      await waitFor(() => {
        expect(screen.getByText(/Pune Institute of Computer Technology/i)).toBeInTheDocument();
      });

      // Switch to Programs
      const programsTab = screen.getByTestId('master-tab-programs');
      fireEvent.click(programsTab);

      await waitFor(() => {
        expect(screen.getByText(/Computer Science & Engineering/i)).toBeInTheDocument();
      });
    });

    it('runs academic year rollover wizard dry run and confirms execution', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('admin-section')).toBeInTheDocument();
      });

      // Switch to Rollover tab
      const rolloverTab = screen.getByTestId('admin-subtab-rollover');
      fireEvent.click(rolloverTab);

      // Verify dry run summary
      expect(screen.getByText(/40 institutions/i)).toBeInTheDocument();
      expect(screen.getByText(/3,450 graduating students/i)).toBeInTheDocument();

      // Open confirm dialog
      const launchBtn = screen.getByRole('button', { name: /proceed to confirm rollover/i });
      fireEvent.click(launchBtn);

      await waitFor(() => {
        expect(screen.getByTestId('rollover-confirm-dialog')).toBeInTheDocument();
      });

      // Type confirmation text
      const confirmInput = screen.getByTestId('rollover-confirm-input');
      fireEvent.change(confirmInput, { target: { value: 'CONFIRM ROLLOVER' } });

      // Click final confirm
      const confirmBtn = screen.getByRole('button', { name: /execute academic year rollover/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/Rollover Executed Successfully/i)).toBeInTheDocument();
      });
    });

    it('views root trust list of signing authorities', async () => {
      renderAictePage();

      await waitFor(() => {
        expect(screen.getByTestId('admin-section')).toBeInTheDocument();
      });

      // Switch to Trust List tab
      const trustTab = screen.getByTestId('admin-subtab-trust');
      fireEvent.click(trustTab);

      expect(screen.getByText(/AICTE Central Master Root CA/i)).toBeInTheDocument();
      expect(screen.getByText(/Government of India National Signing Authority/i)).toBeInTheDocument();
    });
  });

  describe('11. Empty, Error, and Offline States', () => {
    it('renders empty state when central repository has 0 institutions', async () => {
      server.use(
        http.get('*/v1/dashboards/aicte/summary', () => {
          return HttpResponse.json({
            total_institutions: 0,
            student_level_coverage_pct: 0,
            aggregate_only_coverage_pct: 0,
            coverage_percentage: 0,
            total_students: 0,
            avg_fill_percentage: 0,
            excess_seats_count: 0,
            avg_quality_score: 0,
            cross_institution_dupes_count: 0,
            open_anomalies_count: 0,
            unreconciled_programs_count: 0,
          });
        })
      );

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
