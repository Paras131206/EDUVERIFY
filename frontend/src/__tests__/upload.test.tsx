import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { UploadPage } from '@/features/institution/UploadPage';
import { BatchListPage } from '@/features/institution/BatchListPage';
import { Step2Mapping } from '@/features/institution/components/Step2Mapping';
import { Step3Validate } from '@/features/institution/components/Step3Validate';
import { Step4Summary } from '@/features/institution/components/Step4Summary';
import { resetBatchMock } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

describe('Upload Wizard & Column Mapping (Task A2)', () => {
  beforeEach(() => {
    resetBatchMock();
    localStorage.clear();
  });

  describe('Step 1: Choose File & Options', () => {
    it('renders academic year select, download template button, and dropzone', async () => {
      render(
        <MemoryRouter initialEntries={['/institution/upload']}>
          <UploadPage />
        </MemoryRouter>
      );

      // Official template download button
      const downloadBtn = screen.getByRole('link', { name: /download template/i });
      expect(downloadBtn).toBeInTheDocument();
      expect(downloadBtn).toHaveAttribute('href', expect.stringContaining('/v1/templates/student-upload.xlsx'));

      // Academic year select
      await waitFor(() => {
        expect(screen.getByLabelText(/academic year/i)).toBeInTheDocument();
      });
      const yearSelect = screen.getByLabelText(/academic year/i) as HTMLSelectElement;
      expect(yearSelect.value).toBe('2026-27');

      // Dropzone
      expect(screen.getByText(/drag & drop batch file here/i)).toBeInTheDocument();

      // Proceed button initially disabled because no file is selected
      const proceedBtn = screen.getByRole('button', { name: /proceed to column mapping/i });
      expect(proceedBtn).toBeDisabled();
    });

    it('selecting demo file enables upload and advances to column mapping', async () => {
      render(
        <MemoryRouter initialEntries={['/institution/upload']}>
          <UploadPage />
        </MemoryRouter>
      );

      // Click demo file button
      const demoBtn = screen.getByRole('button', { name: /use demo file: batch_2_errors.xlsx/i });
      fireEvent.click(demoBtn);

      // Should display selected file badge
      expect(screen.getByText('batch_2_errors.xlsx')).toBeInTheDocument();

      // Proceed button is now enabled
      const proceedBtn = screen.getByRole('button', { name: /proceed to column mapping/i });
      expect(proceedBtn).not.toBeDisabled();

      // Submit upload
      fireEvent.click(proceedBtn);

      // Should advance to Step 2 Mapping
      await waitFor(
        () => {
          expect(screen.getByText(/step 2: smart column mapping/i)).toBeInTheDocument();
        },
        { timeout: 4000 }
      );
      expect(screen.getByText(/2\. map columns/i)).toBeInTheDocument();
    });

    it('handles open batch conflict (HTTP 409) with link to the open batch', async () => {
      server.use(
        http.post('*/v1/batches', () => {
          return HttpResponse.json(
            {
              detail:
                'Conflict: An active batch is currently open for academic year 2026-27 (batch-demo-2). Please resolve or supersede it.',
              open_batch_id: 'batch-demo-2',
              code: 'BATCH_CONFLICT',
            },
            { status: 409 }
          );
        })
      );

      render(
        <MemoryRouter initialEntries={['/institution/upload']}>
          <UploadPage />
        </MemoryRouter>
      );

      // Select demo file and submit
      fireEvent.click(screen.getByRole('button', { name: /use demo file: batch_2_errors.xlsx/i }));
      fireEvent.click(screen.getByRole('button', { name: /proceed to column mapping/i }));

      // 409 Conflict banner should appear with direct link to open batch
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/batch conflict \(http 409\)/i)).toBeInTheDocument();
        expect(
          screen.getByRole('link', { name: /go to open batch \(batch-demo-2\)/i })
        ).toHaveAttribute('href', '/institution/batches/batch-demo-2/review');
      });
    });
  });

  describe('Step 2: Smart Column Mapping & Rule V001', () => {
    it('renders non-standard headers (PRN, DOB, Dept), confidence bars, method chips, and masked APAAR sample values', async () => {
      render(
        <MemoryRouter>
          <Step2Mapping
            batchId="batch-demo-2"
            filename="batch_2_errors.xlsx"
            academicYear="2026-27"
            onBack={vi.fn()}
            onConfirm={vi.fn()}
          />
        </MemoryRouter>
      );

      // Non-standard headers
      await waitFor(() => {
        expect(screen.getByText('PRN')).toBeInTheDocument();
        expect(screen.getByText('DOB')).toBeInTheDocument();
        expect(screen.getByText('Dept')).toBeInTheDocument();
        expect(screen.getByText('Adm Date')).toBeInTheDocument();
      });

      // Method chips
      expect(screen.getAllByText('Synonym').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Fuzzy Match').length).toBeGreaterThan(0);
      expect(screen.getByText('Saved Profile')).toBeInTheDocument();
      expect(screen.getByText('Pattern / Regex')).toBeInTheDocument();

      // Confidence percentages
      expect(screen.getByText('98%')).toBeInTheDocument();
      expect(screen.getByText('96%')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();

      // Masked APAAR in sample values preview (never unmasked)
      expect(screen.getByText('9845****2301')).toBeInTheDocument();
      expect(screen.queryByText('984572912301')).not.toBeInTheDocument();
    });

    it('displays rule V001 red alert and disables confirm when required canonical fields are unmapped', async () => {
      render(
        <MemoryRouter>
          <Step2Mapping
            batchId="batch-demo-2"
            filename="batch_2_errors.xlsx"
            academicYear="2026-27"
            onBack={vi.fn()}
            onConfirm={vi.fn()}
          />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/rule v001: required column missing after column mapping/i)).toBeInTheDocument();
      });

      // Confirm button must be disabled while required fields are missing
      const confirmBtn = screen.getByRole('button', { name: /confirm mapping & start validation/i });
      expect(confirmBtn).toBeDisabled();

      // Auto-map remaining canonical fields button resolves V001
      const autoMapBtn = screen.getByRole('button', { name: /auto-map remaining canonical fields/i });
      fireEvent.click(autoMapBtn);

      await waitFor(() => {
        expect(
          screen.queryByText(/rule v001: required column missing after column mapping/i)
        ).not.toBeInTheDocument();
      });

      // Now confirm button should be enabled
      expect(confirmBtn).not.toBeDisabled();
    });

    it('supports saving mapping profile as institution preference', async () => {
      render(
        <MemoryRouter>
          <Step2Mapping
            batchId="batch-demo-2"
            filename="batch_2_errors.xlsx"
            academicYear="2026-27"
            onBack={vi.fn()}
            onConfirm={vi.fn()}
          />
        </MemoryRouter>
      );

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
      });
    });
  });

  describe('Step 3: Real-Time Validation & Polling Fallback', () => {
    it('displays all 6 validation stages and falls back to polling if SSE unavailable', async () => {
      const onCompleteMock = vi.fn();

      render(
        <MemoryRouter>
          <Step3Validate batchId="batch-demo-2" onComplete={onCompleteMock} />
        </MemoryRouter>
      );

      // Verify all 6 stage labels are rendered
      expect(screen.getByText(/1\. parsing/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. mapping/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. rules engine/i)).toBeInTheDocument();
      expect(screen.getByText(/4\. duplicates/i)).toBeInTheDocument();
      expect(screen.getByText(/5\. anomalies/i)).toBeInTheDocument();
      expect(screen.getByText(/6\. report generation/i)).toBeInTheDocument();

      // Wait for validation to complete via polling fallback
      await waitFor(
        () => {
          const viewSummaryBtn = screen.getByRole('button', { name: /view result summary/i });
          expect(viewSummaryBtn).not.toBeDisabled();
        },
        { timeout: 8000 }
      );

      fireEvent.click(screen.getByRole('button', { name: /view result summary/i }));
      expect(onCompleteMock).toHaveBeenCalled();
    });
  });

  describe('Step 4: Result Summary & Quality Score', () => {
    it('renders quality score gauge, row breakdown, priority badges, intake cards, reconciliation strip, and schema drift banner', async () => {
      render(
        <MemoryRouter>
          <Step4Summary batchId="batch-demo-2" onReset={vi.fn()} />
        </MemoryRouter>
      );

      // Quality score gauge
      await waitFor(() => {
        expect(screen.getByRole('meter')).toBeInTheDocument();
        expect(screen.getByText('74%')).toBeInTheDocument();
      });

      // Row breakdown
      expect(screen.getByText('65')).toBeInTheDocument(); // total
      expect(screen.getByText('48')).toBeInTheDocument(); // valid
      expect(screen.getByText('5')).toBeInTheDocument(); // warning
      expect(screen.getByText('12')).toBeInTheDocument(); // error

      // Priority and Bucket badges
      expect(screen.getByText(/critical/i)).toBeInTheDocument();
      expect(screen.getByText(/auto flag/i)).toBeInTheDocument();
      expect(screen.getByText(/human review/i)).toBeInTheDocument();

      // Intake cards with excess evaluation
      expect(screen.getAllByText('BTECH-CSE').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('BTECH-ECE').length).toBeGreaterThanOrEqual(1);

      // Reconciliation strip
      expect(screen.getByText(/reconciliation strip/i)).toBeInTheDocument();
      expect(screen.getByText(/reconciled \(match\)/i)).toBeInTheDocument();
      expect(screen.getByText(/mismatch delta \(-2\)/i)).toBeInTheDocument();

      // Schema drift banner
      expect(screen.getByText(/schema drift detected/i)).toBeInTheDocument();
      expect(screen.getByText(/has shifted from canonical/i)).toBeInTheDocument();

      // Action buttons
      expect(screen.getByRole('button', { name: /review issues/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download report \(xlsx\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
    });
  });

  describe('Batch List Page at /institution/batches', () => {
    it('renders batches with status chips and open batch conflict warning banner', async () => {
      render(
        <MemoryRouter initialEntries={['/institution/batches']}>
          <Routes>
            <Route path="/institution/batches" element={<BatchListPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Heading and Upload New Batch CTA
      await waitFor(() => {
        expect(screen.getByText('Institution Batch Registry')).toBeInTheDocument();
      });
      expect(screen.getByRole('link', { name: /upload new batch/i })).toHaveAttribute('href', '/institution/upload');

      // Batches rendered
      expect(screen.getByText('batch-demo-1')).toBeInTheDocument();
      expect(screen.getAllByText('batch-demo-2').length).toBeGreaterThanOrEqual(1);

      // Status chips
      expect(screen.getByText('COMMITTED')).toBeInTheDocument();
      expect(screen.getByText('IN REVIEW')).toBeInTheDocument();
      expect(screen.getByText('SUPERSEDED')).toBeInTheDocument();

      // Open batch conflict banner
      expect(screen.getByText(/open batch in progress \(conflict prevention\)/i)).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /go to open batch review/i })
      ).toHaveAttribute('href', '/institution/batches/batch-demo-2/review');
    });

    it('renders empty state when no batches exist', async () => {
      server.use(
        http.get('*/v1/batches', () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <MemoryRouter initialEntries={['/institution/batches']}>
          <Routes>
            <Route path="/institution/batches" element={<BatchListPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No Batches Uploaded Yet')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /upload first batch/i })).toBeInTheDocument();
      });
    });

    it('renders error state when batch fetch fails', async () => {
      server.use(
        http.get('*/v1/batches', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(
        <MemoryRouter initialEntries={['/institution/batches']}>
          <Routes>
            <Route path="/institution/batches" element={<BatchListPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/http 500/i)).toBeInTheDocument();
      });
    });
  });
});
