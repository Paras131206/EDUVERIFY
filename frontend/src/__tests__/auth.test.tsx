import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, RequireRole, useAuth } from '@/lib/auth';
import { LoginPage } from '@/features/auth/LoginPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { resetAuthMock } from '@/mocks/handlers';

describe('Authentication & RBAC (Task A1)', () => {
  beforeEach(() => {
    resetAuthMock();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders login page with show/hide password toggle and demo picker', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Sign in to EduVerify')).toBeInTheDocument();
    expect(screen.getByLabelText(/institutional \/ official email/i)).toBeInTheDocument();
    const passwordInput = screen.getByLabelText(/^password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Test show/hide password toggle
    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Demo picker is present
    expect(screen.getByText(/demo user quick picker/i)).toBeInTheDocument();
  });

  it('handles login failure without user enumeration', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/institutional \/ official email/i);
    const passwordInput = screen.getByLabelText(/^password/i);

    fireEvent.change(emailInput, { target: { value: 'unknown.user@institution.ac.in' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // Must not reveal whether email exists; uniform error message
      expect(screen.getByText('Invalid credentials or account locked')).toBeInTheDocument();
    });
  });

  it('triggers account lockout warning after 5 failed login attempts', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/institutional \/ official email/i);
    const passwordInput = screen.getByLabelText(/^password/i);

    fireEvent.change(emailInput, { target: { value: 'inst.admin@demo.local' } });

    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      fireEvent.change(passwordInput, { target: { value: `badpass${i}` } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    }

    await waitFor(() => {
      expect(
        screen.getByText(/account temporarily locked due to multiple failed login attempts/i)
      ).toBeInTheDocument();
    });
  });

  it('keeps access token in memory and NEVER writes to localStorage or sessionStorage', async () => {
    const AuthStatusInspector = () => {
      const { user, accessToken, isAuthenticated } = useAuth();
      return (
        <div>
          <div data-testid="auth-state">{isAuthenticated ? 'AUTHENTICATED' : 'ANONYMOUS'}</div>
          <div data-testid="user-role">{user?.role || 'NONE'}</div>
          <div data-testid="token-value">{accessToken || 'NONE'}</div>
        </div>
      );
    };

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
          <AuthStatusInspector />
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/institutional \/ official email/i);
    const passwordInput = screen.getByLabelText(/^password/i);

    fireEvent.change(emailInput, { target: { value: 'inst.admin@demo.local' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('AUTHENTICATED');
      expect(screen.getByTestId('user-role')).toHaveTextContent('INSTITUTION_ADMIN');
    });

    // Explicit check: tokens MUST NOT be stored in localStorage or sessionStorage
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('jwt')).toBeNull();
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('access_token')).toBeNull();
  });

  it('redirects unauthenticated user from protected route to /login', async () => {
    render(
      <MemoryRouter initialEntries={['/institution']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page Mock</div>} />
            <Route
              path="/institution"
              element={
                <RequireRole roles={['INSTITUTION_ADMIN']}>
                  <div>Institution Secret Dashboard</div>
                </RequireRole>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Initial check is unauthenticated -> redirected to login
    await waitFor(() => {
      expect(screen.getByText('Login Page Mock')).toBeInTheDocument();
      expect(screen.queryByText('Institution Secret Dashboard')).not.toBeInTheDocument();
    });
  });

  it('redirects user with mismatched role to their own role home route', async () => {
    const RoleTestApp = () => {
      const { login } = useAuth();
      const navigate = useNavigate();
      return (
        <div>
          <button
            onClick={async () => {
              await login({ email: 'student@demo.local', password: 'password123' });
              navigate('/aicte');
            }}
          >
            Sign In & Navigate To AICTE
          </button>
        </div>
      );
    };

    render(
      <MemoryRouter initialEntries={['/test-setup']}>
        <AuthProvider>
          <Routes>
            <Route path="/test-setup" element={<RoleTestApp />} />
            <Route path="/student" element={<div>Student Home Page</div>} />
            <Route
              path="/aicte"
              element={
                <RequireRole roles={['AICTE_ADMIN']}>
                  <div>AICTE Central Console</div>
                </RequireRole>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /sign in & navigate to aicte/i }));

    // Because user is STUDENT, accessing /aicte redirects to /student
    await waitFor(() => {
      expect(screen.getByText('Student Home Page')).toBeInTheDocument();
      expect(screen.queryByText('AICTE Central Console')).not.toBeInTheDocument();
    });
  });

  it('displays generated API key ONCE with warning, and clears raw key on dismissal', async () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Initial list shows existing key
    await waitFor(() => {
      expect(screen.getByText('Campus ERP Admission Sync')).toBeInTheDocument();
    });

    // Open Generate Key modal
    fireEvent.click(screen.getByRole('button', { name: /generate new key/i }));
    expect(screen.getByLabelText(/key identifier \/ friendly name/i)).toBeInTheDocument();

    // Fill key name and submit
    fireEvent.change(screen.getByLabelText(/key identifier \/ friendly name/i), {
      target: { value: 'Automated Nightly Pipeline' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create key/i }));

    // Verify raw key secret is shown ONCE along with warning banner
    await waitFor(() => {
      expect(screen.getByText(/important: copy your secret key now!/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/evk_live_/i)).toBeInTheDocument();
    });

    // Dismiss key modal
    fireEvent.click(screen.getByRole('button', { name: /i have safely saved this key/i }));

    // Once dismissed, modal is closed and raw key is gone
    await waitFor(() => {
      expect(screen.queryByText(/important: copy your secret key now!/i)).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue(/evk_live_[a-f0-9]{10,}/i)).not.toBeInTheDocument();
    });

    // Table now includes the new key name with its prefix only
    expect(screen.getByText('Automated Nightly Pipeline')).toBeInTheDocument();
  });
});
