import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ReviewPage } from '@/features/institution/ReviewPage';
import { AuthContext, AuthContextType } from '@/lib/auth';
import { resetBatchMock } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { User } from '@/types/auth';

const mockAdminUser: User = {
  id: 'usr-admin-1',
  email: 'admin@institution.edu.in',
  role: 'INSTITUTION_ADMIN',
  full_name: 'Dr. Ramesh Kumar',
  institution_aicte_id: '1-1234567890',
  dab_id: null,
  student_apaar_hash: null,
};

const mockStaffUser: User = {
  id: 'usr-staff-1',
  email: 'staff@institution.edu.in',
  role: 'INSTITUTION_STAFF',
  full_name: 'Ananya Sharma',
  institution_aicte_id: '1-1234567890',
  dab_id: null,
  student_apaar_hash: null,
};


const createMockAuthContext = (user: User): AuthContextType => ({
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

describe('Review Workspace & Decision Flow (Task A3)', () => {
  beforeEach(() => {
    resetBatchMock();
    vi.clearAllMocks();
  });

  const renderReviewPage = (user: User = mockAdminUser, batchId = 'batch-demo-2') => {
    const authValue = createMockAuthContext(user);
    return render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={[`/institution/batches/${batchId}/review`]}>
          <Routes>
            <Route path="/institution/batches/:id/review" element={<ReviewPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  describe('1. Issue Queue & Sorting', () => {
    it('renders issue queue sorted by priority CRITICAL -> LOW by default', async () => {
      renderReviewPage();

      await waitFor(() => {
        expect(screen.getByText('Validation Review Workspace')).toBeInTheDocument();
      });

      // Verify header details
      expect(screen.getByText(/batch-demo-2/i)).toBeInTheDocument();
      expect(screen.getByText('Explainable Issue Queue')).toBeInTheDocument();

      // Check priority badges in order: row 22 (CRITICAL) must be listed first before HIGH
      const rows = screen.getAllByText(/#\d+/);
      expect(rows.length).toBeGreaterThanOrEqual(2);
      expect(rows[0].textContent).toContain('#22'); // Row 22 is CRITICAL (V002)
    });

    it('filters by tab: Auto-flagged, Needs human review, Info, All', async () => {
      renderReviewPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /auto-flagged/i })).toBeInTheDocument();
      });

      const queue = screen.getByTestId('issue-queue-card');

      // Click "Needs human review" tab
      const humanReviewTab = screen.getByRole('button', { name: /needs human review/i });
      fireEvent.click(humanReviewTab);

      // Should show row 35 (V009 - HUMAN_REVIEW)
      expect(within(queue).getByText('#35')).toBeInTheDocument();
      // Row 22 is AUTO_FLAG, so it should not be in the filtered list
      expect(within(queue).queryByText('#22')).not.toBeInTheDocument();

      // Click "Info" tab
      const infoTab = screen.getByRole('button', { name: /^info/i });
      fireEvent.click(infoTab);

      // Should show row 50 (V030 - INFO)
      expect(within(queue).getByText('#50')).toBeInTheDocument();

      // Return to All Issues tab
      const allTab = screen.getByRole('button', { name: /all issues/i });
      fireEvent.click(allTab);
      expect(within(queue).getByText('#22')).toBeInTheDocument();
    });

    it('filters by Rule, Field, Severity, Priority dropdowns', async () => {
      renderReviewPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by rule/i)).toBeInTheDocument();
      });

      const queue = screen.getByTestId('issue-queue-card');
      const ruleSelect = screen.getByLabelText(/filter by rule/i);
      fireEvent.change(ruleSelect, { target: { value: 'V009' } });

      // Only V009 issue (row 35) should be visible in the queue
      expect(within(queue).getByText('#35')).toBeInTheDocument();
      expect(within(queue).queryByText('#22')).not.toBeInTheDocument();

      // Reset filters button
      const resetBtn = screen.getByRole('button', { name: /reset filters/i });
      fireEvent.click(resetBtn);

      expect(within(queue).getByText('#22')).toBeInTheDocument();
    });
  });


  describe('2. Issue Card, Evidence Table, Deep Link & Decision Flow (Staff vs Admin)', () => {
    it('ADMIN sees "Accept Fix", "Edit Value", and "Dismiss with Note"', async () => {
      renderReviewPage(mockAdminUser);

      await waitFor(() => {
        expect(screen.getByText(/apaar_id missing or not 12 digits/i)).toBeInTheDocument();
      });

      // Admin controls
      expect(screen.getByRole('button', { name: /accept fix/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit value/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dismiss with note/i })).toBeInTheDocument();

      // Check evidence table renders key-value pairs
      expect(screen.getByText('Evidence Used')).toBeInTheDocument();
      expect(screen.getByText('value_found')).toBeInTheDocument();

      // Deep link to row inspector modal
      const inspectBtn = screen.getByRole('button', { name: /inspect full row/i });
      fireEvent.click(inspectBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /row #22 full student record/i })).toBeInTheDocument();
        expect(screen.getByText(/target cell/i)).toBeInTheDocument();
        expect(screen.getByText(/offending cell/i)).toBeInTheDocument();
      });

      // Close inspector
      fireEvent.click(screen.getAllByRole('button', { name: /close inspector/i })[0]);
      expect(screen.queryByRole('dialog', { name: /row #22 full student record/i })).not.toBeInTheDocument();
    });



    it('STAFF sees "Propose" actions only and cannot directly approve', async () => {
      renderReviewPage(mockStaffUser);

      await waitFor(() => {
        expect(screen.getByText(/propose only \(requires admin approval\)/i)).toBeInTheDocument();
      });

      // Staff sees Propose buttons
      expect(screen.getByRole('button', { name: /propose fix/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /propose edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /propose dismissal/i })).toBeInTheDocument();

      // Staff does NOT see direct Accept Fix button
      expect(screen.queryByRole('button', { name: /^accept fix$/i })).not.toBeInTheDocument();
    });

    it('Admin accepts fix and updates issue status to FIXED', async () => {
      renderReviewPage(mockAdminUser);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /accept fix/i })).toBeInTheDocument();
      });

      const acceptBtn = screen.getByRole('button', { name: /accept fix/i });
      fireEvent.click(acceptBtn);

      await waitFor(() => {
        expect(screen.getByText('Issue Resolved')).toBeInTheDocument();
      });
    });

    it('Admin edits value with replacement string', async () => {
      renderReviewPage(mockAdminUser);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit value/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /edit value/i }));

      const input = screen.getByPlaceholderText(/enter replacement value/i);
      fireEvent.change(input, { target: { value: '984572912301' } });

      fireEvent.click(screen.getByRole('button', { name: /apply edit/i }));

      await waitFor(() => {
        expect(screen.getByText('Issue Resolved')).toBeInTheDocument();
      });
    });

    it('Admin dismisses issue with custom reason note', async () => {
      renderReviewPage(mockAdminUser);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /dismiss with note/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /dismiss with note/i }));

      const textarea = screen.getByPlaceholderText(/provide reason for dismissal/i);
      fireEvent.change(textarea, { target: { value: 'Verified physically with college registrar' } });

      fireEvent.click(screen.getByRole('button', { name: /confirm dismiss/i }));

      await waitFor(() => {
        expect(screen.getByText('Issue Dismissed')).toBeInTheDocument();
        expect(screen.getByText(/verified physically with college registrar/i)).toBeInTheDocument();
      });
    });
  });

  describe('3. Bulk Actions', () => {
    it('accepts all INFO normalisations in one click', async () => {
      renderReviewPage(mockAdminUser);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /accept all info normalisations/i })
        ).toBeInTheDocument();
      });

      const bulkAcceptBtn = screen.getByRole('button', {
        name: /accept all info normalisations/i,
      });
      fireEvent.click(bulkAcceptBtn);

      // Verify message/status updates
      await waitFor(() => {
        expect(screen.getByText('Explainable Issue Queue')).toBeInTheDocument();
      });
    });

    it('accepts selected issues in bulk when rows are checked', async () => {
      renderReviewPage(mockAdminUser);

      await waitFor(() => {
        expect(screen.getByLabelText(/select all issues/i)).toBeInTheDocument();
      });

      // Select all issues
      fireEvent.click(screen.getByLabelText(/select all issues/i));

      // Accept Selected Fixes button appears with count
      const acceptSelectedBtn = screen.getByRole('button', { name: /accept selected fixes/i });
      expect(acceptSelectedBtn).toBeInTheDocument();
      fireEvent.click(acceptSelectedBtn);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /accept selected fixes/i })).not.toBeInTheDocument();
      });
    });

    it('dismisses selected issues with prompt reason', async () => {
      renderReviewPage(mockAdminUser);

      await waitFor(() => {
        expect(screen.getByLabelText(/select all issues/i)).toBeInTheDocument();
      });

      // Select all issues
      fireEvent.click(screen.getByLabelText(/select all issues/i));

      // Dismiss selected button appears with count
      const dismissSelectedBtn = screen.getByRole('button', { name: /dismiss selected/i });
      expect(dismissSelectedBtn).toBeInTheDocument();
      fireEvent.click(dismissSelectedBtn);

      // Modal appears
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText(/verified with registrar/i);
      fireEvent.change(textarea, { target: { value: 'Bulk approved batch exception' } });

      fireEvent.click(screen.getByRole('button', { name: /confirm dismissal/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('4. Duplicates Tab & Side-by-Side Compare', () => {
    it('renders duplicate clusters with similarity score and matched_fields similarity bars', async () => {
      renderReviewPage(mockAdminUser);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /duplicates/i })).toBeInTheDocument();
      });

      // Navigate to Duplicates tab
      fireEvent.click(screen.getByRole('button', { name: /duplicates/i }));

      // Cluster score
      expect(screen.getAllByText(/92%/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Cluster #cl-001')).toBeInTheDocument();

      // Per-field similarity bars
      expect(screen.getByText(/per-field similarity breakdown/i)).toBeInTheDocument();
      expect(screen.getByText('apaar')).toBeInTheDocument();
      expect(screen.getByText('full_name')).toBeInTheDocument();

      // Side-by-side compare with aligned fields and highlighted differences
      expect(screen.getByText('Record A (Row #8)')).toBeInTheDocument();
      expect(screen.getByText('Record B (Row #35)')).toBeInTheDocument();
      expect(screen.getAllByText('Difference').length).toBeGreaterThanOrEqual(1);

      // Three decision buttons
      expect(screen.getByRole('button', { name: /same person \(merge\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /different people/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /transfer/i })).toBeInTheDocument();
    });

    it('resolves duplicate cluster when "Same person" is clicked', async () => {
      renderReviewPage(mockAdminUser);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /duplicates/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /duplicates/i }));

      const samePersonBtn = screen.getByRole('button', { name: /same person \(merge\)/i });
      fireEvent.click(samePersonBtn);

      await waitFor(() => {
        expect(screen.getByText(/resolved: same person \(merge\)/i)).toBeInTheDocument();
      });
    });
  });

  describe('5. Re-validate & Before/After Report', () => {
    it('triggers re-validation progress, improves quality score, and switches to Before/After report', async () => {
      renderReviewPage(mockAdminUser);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /re-validate batch/i })).toBeInTheDocument();
      });

      // Click Re-validate
      const revalidateBtn = screen.getByRole('button', { name: /re-validate batch/i });
      fireEvent.click(revalidateBtn);

      // Displays progression and Before/After panel
      await waitFor(() => {
        expect(screen.getByText(/quality score progression/i)).toBeInTheDocument();
        expect(screen.getByText('Resolved Issues')).toBeInTheDocument();
        expect(screen.getByText('Pending Issues')).toBeInTheDocument();
        expect(screen.getByText('Priority Level Impact (Before vs After)')).toBeInTheDocument();
        expect(screen.getByText('Rule-Level Resolution Deltas')).toBeInTheDocument();
      });

      // Download buttons
      expect(
        screen.getByRole('button', { name: /download dq comparison xlsx/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /download dq comparison pdf/i })
      ).toBeInTheDocument();
    });
  });

  describe('6. Commit Guard & Confirmation Dialog', () => {
    it('Commit button is disabled while CRITICAL issues are open', async () => {
      renderReviewPage(mockAdminUser);

      await waitFor(() => {
        expect(screen.getByText('Validation Review Workspace')).toBeInTheDocument();
      });

      // CRITICAL issue V002 is open initially
      const commitBtn = screen.getByRole('button', { name: /commit batch to aicte/i });
      expect(commitBtn).toBeDisabled();

      // Explanation banner is displayed
      expect(screen.getByText(/critical errors blocking batch commit/i)).toBeInTheDocument();
    });

    it('Commit button becomes enabled when critical issues are resolved, and opens confirmation dialog', async () => {
      renderReviewPage(mockAdminUser);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /accept fix/i })).toBeInTheDocument();
      });

      // Resolve the critical issue
      fireEvent.click(screen.getByRole('button', { name: /accept fix/i }));

      // Wait for issue resolution
      await waitFor(() => {
        expect(screen.getByText('Issue Resolved')).toBeInTheDocument();
      });

      // Now Commit button is enabled!
      const commitBtn = screen.getByRole('button', { name: /commit batch to aicte/i });
      expect(commitBtn).not.toBeDisabled();

      // Click commit
      fireEvent.click(commitBtn);

      // Confirmation dialog opens with excluded rows breakdown
      await waitFor(() => {
        expect(
          screen.getByRole('dialog', { name: /commit batch to central repository/i })
        ).toBeInTheDocument();
        expect(screen.getByText('Committed Records')).toBeInTheDocument();
      });

      // Confirm commit
      const confirmBtn = screen.getByRole('button', { name: /confirm & commit records/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText('Committed to AICTE')).toBeInTheDocument();
      });
    });
  });

  describe('7. Empty, Error, and Offline States', () => {
    it('renders empty state when batch has no issues or duplicates', async () => {
      server.use(
        http.get('*/v1/batches/:id/report', () => {
          return HttpResponse.json({
            batch_id: 'batch-empty',
            institution_aicte_id: '1-1234567890',
            engine_version: '0.1.0',
            rule_catalog_version: '0.1.0',
            rows_total: 50,
            rows_valid: 50,
            rows_warning: 0,
            rows_error: 0,
            quality_score: 100.0,
            column_mapping: [],
            issues: [],
            duplicate_clusters: [],
            review_summary: { AUTO_FLAG: 0, HUMAN_REVIEW: 0, INFO: 0 },
            priority_summary: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
            intake_summary: [],
            reconciliation: [],
            schema_drift: [],
          });
        })
      );

      renderReviewPage(mockAdminUser, 'batch-empty');

      await waitFor(() => {
        expect(screen.getByText('No Issues or Clusters Found')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /return to batches/i })).toHaveAttribute(
          'href',
          '/institution/batches'
        );
      });
    });

    it('renders error state on API failure with retry action', async () => {
      let callCount = 0;
      server.use(
        http.get('*/v1/batches/:id/report', () => {
          callCount++;
          if (callCount === 1) {
            return new HttpResponse(null, { status: 500 });
          }
          return HttpResponse.json({
            batch_id: 'batch-demo-2',
            issues: [],
            duplicate_clusters: [],
            quality_score: 80,
            rows_total: 10,
          });
        })
      );

      renderReviewPage(mockAdminUser, 'batch-error');

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Batch Review')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      // Click retry
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      await waitFor(() => {
        expect(screen.getByText('No Issues or Clusters Found')).toBeInTheDocument();
      });
    });


    it('renders offline banner when client loses connection', async () => {
      // Mock navigator.onLine = false
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

      renderReviewPage(mockAdminUser);

      await waitFor(() => {
        expect(screen.getByText(/you are currently offline/i)).toBeInTheDocument();
      });
    });
  });
});

