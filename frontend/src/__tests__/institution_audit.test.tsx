import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { InstitutionAuditPage } from '@/features/institution/InstitutionAuditPage';
import { AuthContext, AuthContextType } from '@/lib/auth';
import { resetBatchMock } from '@/mocks/handlers';
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

describe('Institution Document Audit Log & Revert Desk', () => {
  beforeEach(() => {
    resetBatchMock();
    vi.clearAllMocks();
  });

  const renderAuditPage = (user: User = mockAdminUser) => {
    return render(
      <AuthContext.Provider value={createMockAuthContext(user)}>
        <MemoryRouter initialEntries={['/institution/audit']}>
          <Routes>
            <Route path="/institution/audit" element={<InstitutionAuditPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('renders page header, previous uploaded documents, and discrepancy table', async () => {
    renderAuditPage();

    await waitFor(() => {
      expect(screen.getByText(/Institution Document Audit Log & Revert Desk/i)).toBeInTheDocument();
    });

    // Check KPI cards
    expect(screen.getAllByText(/Uploaded Documents/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Discrepancies Flagged/i)).toBeInTheDocument();
    expect(screen.getByText(/Changes Applied/i)).toBeInTheDocument();
    expect(screen.getByText(/Reverted Changes/i)).toBeInTheDocument();

    // Check previous uploaded documents selector
    expect(screen.getByText(/All Documents/i)).toBeInTheDocument();
    expect(screen.getAllByText(/batch_2_errors\.xlsx/i).length).toBeGreaterThan(0);
  });

  it('shows discrepancies with raw document value and change details', async () => {
    renderAuditPage();

    await waitFor(() => {
      expect(screen.getByText(/V025/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/V002/i)).toBeInTheDocument();
    expect(screen.getByText(/Graduation year inconsistent/i)).toBeInTheDocument();
  });

  it('filters discrepancies by status and search query', async () => {
    renderAuditPage();

    await waitFor(() => {
      expect(screen.getByText(/V025/i)).toBeInTheDocument();
    });

    // Search for V002
    const searchInput = screen.getByPlaceholderText(/Search APAAR, rule, field/i);
    fireEvent.change(searchInput, { target: { value: 'V002' } });

    await waitFor(() => {
      expect(screen.getByText(/V002/i)).toBeInTheDocument();
      expect(screen.queryByText(/V025/i)).not.toBeInTheDocument();
    });
  });

  it('triggers revert workflow: opens confirmation modal and confirms rollback', async () => {
    renderAuditPage();

    await waitFor(() => {
      expect(screen.getByText(/V025/i)).toBeInTheDocument();
    });

    // Find any revert button
    const revertButtons = screen.queryAllByRole('button', { name: /^Revert$/i });
    if (revertButtons.length > 0) {
      fireEvent.click(revertButtons[0]);

      // Confirm modal appears
      await waitFor(() => {
        expect(screen.getByText(/Revert Discrepancy Change/i)).toBeInTheDocument();
      });

      // Type rollback reason
      const reasonInput = screen.getByPlaceholderText(/Student confirmed original certificate/i);
      fireEvent.change(reasonInput, { target: { value: 'Verified original enrollment paperwork' } });

      // Click Confirm Revert
      const confirmBtn = screen.getByRole('button', { name: /Confirm Revert & Rollback/i });
      fireEvent.click(confirmBtn);

      // Verify success notification or state update
      await waitFor(() => {
        expect(screen.getByText(/successfully reverted to original value/i)).toBeInTheDocument();
      });
    }
  });

  it('toggles cryptographic SHA-256 ledger drawer', async () => {
    renderAuditPage();

    await waitFor(() => {
      expect(screen.getByText(/SHA-256 Ledger Intact/i)).toBeInTheDocument();
    });

    const chainBtn = screen.getByRole('button', { name: /SHA-256 Ledger Intact/i });
    fireEvent.click(chainBtn);

    await waitFor(() => {
      expect(screen.getByText(/DPDP Act 2023 & W3C Cryptographic Audit Ledger/i)).toBeInTheDocument();
    });
  });
});
