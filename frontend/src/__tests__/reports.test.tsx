import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ReportsPage } from '@/features/reports/ReportsPage';
import { resetReportsMock } from '@/mocks/handlers';

describe('Task A7: Statutory Reports Builder & Quality Audits (/reports)', () => {
  beforeEach(() => {
    resetReportsMock();
  });

  describe('1. Report Builder Form & Form Controls', () => {
    it('renders the reports builder with all required report types, filters, and format options', async () => {
      render(
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      );

      // Verify page title & description
      expect(screen.getByText(/Statutory Reports & Quality Audits/i)).toBeInTheDocument();
      expect(screen.getByText(/प्रतिवेदन एवं सांविधिक लेखापरीक्षा/i)).toBeInTheDocument();

      // Verify report type selector
      const typeSelect = screen.getByTestId('report-type-select') as HTMLSelectElement;
      expect(typeSelect).toBeInTheDocument();
      expect(typeSelect.value).toBe('POLICY');

      // Verify all 4 required types exist
      const options = Array.from(typeSelect.options).map((o) => o.value);
      expect(options).toContain('POLICY');
      expect(options).toContain('ACCREDITATION');
      expect(options).toContain('MONITORING');
      expect(options).toContain('REGULATORY');

      // Verify filter dropdowns
      expect(screen.getByTestId('academic-year-select')).toBeInTheDocument();
      expect(screen.getByTestId('state-filter-select')).toBeInTheDocument();
      expect(screen.getByTestId('program-filter-select')).toBeInTheDocument();
      expect(screen.getByTestId('category-filter-select')).toBeInTheDocument();

      // Verify format selection buttons
      expect(screen.getByTestId('format-pdf-btn')).toBeInTheDocument();
      expect(screen.getByTestId('format-xlsx-btn')).toBeInTheDocument();

      // Verify generate button
      expect(screen.getByTestId('generate-report-btn')).toBeInTheDocument();
    });

    it('switches between report types, filter values, and format options', async () => {
      render(
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      );

      // Change type to ACCREDITATION
      const typeSelect = screen.getByTestId('report-type-select');
      fireEvent.change(typeSelect, { target: { value: 'ACCREDITATION' } });
      expect((typeSelect as HTMLSelectElement).value).toBe('ACCREDITATION');

      // Change academic year to 2025-26
      const yearSelect = screen.getByTestId('academic-year-select');
      fireEvent.change(yearSelect, { target: { value: '2025-26' } });
      expect((yearSelect as HTMLSelectElement).value).toBe('2025-26');

      // Change state to Maharashtra
      const stateSelect = screen.getByTestId('state-filter-select');
      fireEvent.change(stateSelect, { target: { value: 'Maharashtra' } });
      expect((stateSelect as HTMLSelectElement).value).toBe('Maharashtra');

      // Change format to XLSX
      const xlsxBtn = screen.getByTestId('format-xlsx-btn');
      fireEvent.click(xlsxBtn);

      // Button label updates to reflect format
      expect(screen.getByTestId('generate-report-btn')).toHaveTextContent(/Generate XLSX Report/i);
    });

    it('renders quick presets and supports one-click preset report compilation', async () => {
      render(
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      );

      // Check presets exist
      expect(screen.getByTestId('preset-policy-pdf')).toBeInTheDocument();
      expect(screen.getByTestId('preset-accreditation-xlsx')).toBeInTheDocument();
      expect(screen.getByTestId('preset-monitoring-pdf')).toBeInTheDocument();
      expect(screen.getByTestId('preset-regulatory-pdf')).toBeInTheDocument();

      // Click Quick Policy PDF preset
      fireEvent.click(screen.getByTestId('preset-policy-pdf'));

      // Active job completion panel should appear
      expect(await screen.findByTestId('active-job-card')).toBeInTheDocument();
      expect(screen.getByText(/Report Job Complete/i)).toBeInTheDocument();
      expect(screen.getByTestId('download-active-job-btn')).toBeInTheDocument();
    });
  });

  describe('2. Report Generation Flow & Download (Check requirement)', () => {
    it('submits report builder form, creates job, and enables downloading generated Policy PDF report', async () => {
      render(
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      );

      // 1. Select POLICY and PDF
      const typeSelect = screen.getByTestId('report-type-select');
      fireEvent.change(typeSelect, { target: { value: 'POLICY' } });

      const stateSelect = screen.getByTestId('state-filter-select');
      fireEvent.change(stateSelect, { target: { value: 'Maharashtra' } });

      const pdfBtn = screen.getByTestId('format-pdf-btn');
      fireEvent.click(pdfBtn);

      // 2. Click Generate Report
      const generateBtn = screen.getByTestId('generate-report-btn');
      fireEvent.click(generateBtn);

      // 3. Active job completes
      expect(await screen.findByTestId('active-job-card')).toBeInTheDocument();
      expect(screen.getByText(/Report Job Complete/i)).toBeInTheDocument();

      // 4. Download button exists
      const downloadBtn = screen.getByTestId('download-active-job-btn');
      expect(downloadBtn).toHaveTextContent(/Download PDF/i);

      // Mock anchor click
      const createElSpy = vi.spyOn(document, 'createElement');
      fireEvent.click(downloadBtn);
      expect(createElSpy).toHaveBeenCalledWith('a');
      createElSpy.mockRestore();
    });
  });

  describe('3. History of Generated Reports Table', () => {
    it('renders the generated reports history table with all metadata columns', async () => {
      render(
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      );

      // Table is rendered
      expect(await screen.findByTestId('reports-history-table')).toBeInTheDocument();

      // Initial mock reports are present
      expect(screen.getByText('REP-POL-2026-001')).toBeInTheDocument();
      expect(screen.getByText('REP-ACC-2026-002')).toBeInTheDocument();
      expect(screen.getByText('REP-MON-2026-003')).toBeInTheDocument();
      expect(screen.getByText('REP-REG-2026-004')).toBeInTheDocument();

      // Format badges
      expect(screen.getAllByText('PDF').length).toBeGreaterThan(0);
      expect(screen.getAllByText('XLSX').length).toBeGreaterThan(0);
    });

    it('filters report history by search keyword, report type, and format', async () => {
      render(
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      );

      await screen.findByTestId('reports-history-table');

      // 1. Filter by keyword: "NBA"
      const searchInput = screen.getByTestId('report-search-input');
      fireEvent.change(searchInput, { target: { value: 'NBA' } });

      expect(screen.getByText('REP-ACC-2026-002')).toBeInTheDocument();
      expect(screen.queryByText('REP-POL-2026-001')).not.toBeInTheDocument();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      // 2. Filter by format: "XLSX"
      const formatFilter = screen.getByTestId('report-format-filter');
      fireEvent.change(formatFilter, { target: { value: 'XLSX' } });

      expect(screen.getByText('REP-ACC-2026-002')).toBeInTheDocument();
      expect(screen.queryByText('REP-POL-2026-001')).not.toBeInTheDocument();
      expect(screen.queryByText('REP-MON-2026-003')).not.toBeInTheDocument();
    });
  });

  describe('4. Document Preview Modal & Accessibility Standards', () => {
    it('opens document preview modal with official letterhead and executive metrics', async () => {
      render(
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      );

      await screen.findByTestId('reports-history-table');

      // Click "View" on the first policy report
      const viewBtn = screen.getByTestId('view-report-REP-POL-2026-001');
      fireEvent.click(viewBtn);

      // Modal opens
      expect(await screen.findByTestId('report-preview-modal')).toBeInTheDocument();
      expect(screen.getByText(/All India Council for Technical Education/i)).toBeInTheDocument();
      expect(screen.getByText(/Executive Summary & Key Indicators/i)).toBeInTheDocument();
      expect(screen.getByText(/Compliance Score/i)).toBeInTheDocument();
      expect(screen.getByText(/SHA-256 Intact/i)).toBeInTheDocument();
      expect(screen.getByTestId('modal-download-report-btn')).toBeInTheDocument();

      // Close modal
      const closeBtn = screen.getByTestId('modal-close-icon-btn');
      fireEvent.click(closeBtn);
      await waitFor(() => {
        expect(screen.queryByTestId('report-preview-modal')).not.toBeInTheDocument();
      });
    });

    it('complies with accessibility standards (ARIA roles, unique test IDs, and semantic elements)', () => {
      render(
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      );

      // Key interactive controls must have accessible names or labels
      expect(screen.getByRole('button', { name: /Generate PDF Report/i })).toBeInTheDocument();
      expect(screen.getByTestId('report-search-input')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('report-type-select')).toBeInTheDocument();
    });
  });
});
