import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { User, UserRole, LoginResponse } from '@/types/auth';
import { API_BASE_URL, setAuthToken } from './api';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password?: string }) => Promise<LoginResponse>;
  verifyTotp: (mfaTicket: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  stayLoggedIn: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 14 min warning, 15 min expiration
const IDLE_WARNING_MS = 14 * 60 * 1000;
const IDLE_LOGOUT_MS = 15 * 60 * 1000;

export const getHomeRouteForRole = (role?: UserRole | string): string => {
  switch (role) {
    case 'AICTE_ADMIN':
    case 'AICTE_VIEWER':
      return '/aicte';
    case 'INSTITUTION_ADMIN':
    case 'INSTITUTION_STAFF':
      return '/institution';
    case 'DAB_MEMBER':
      return '/dab';
    case 'STUDENT':
      return '/student';
    case 'VERIFIER':
      return '/verify';
    default:
      return '/institution';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store token strictly in memory — never in localStorage or sessionStorage
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  const idleWarningTimer = useRef<NodeJS.Timeout | null>(null);
  const idleLogoutTimer = useRef<NodeJS.Timeout | null>(null);

  const updateToken = useCallback((token: string | null) => {
    setAccessTokenState(token);
    setAuthToken(token);
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleWarningTimer.current) clearTimeout(idleWarningTimer.current);
    if (idleLogoutTimer.current) clearTimeout(idleLogoutTimer.current);

    if (user) {
      idleWarningTimer.current = setTimeout(() => {
        setShowIdleWarning(true);
      }, IDLE_WARNING_MS);

      idleLogoutTimer.current = setTimeout(() => {
        logout();
      }, IDLE_LOGOUT_MS);
    }
  }, [user]);

  const stayLoggedIn = useCallback(() => {
    setShowIdleWarning(false);
    resetIdleTimer();
    refreshSession();
  }, [resetIdleTimer]);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        updateToken(data.access_token);
        setUser(data.user);
      } else {
        updateToken(null);
        setUser(null);
      }
    } catch {
      updateToken(null);
      setUser(null);
    }
  }, [updateToken]);

  // Initial session recovery via HttpOnly cookie
  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok && mounted) {
          const data = await res.json();
          updateToken(data.access_token);
          setUser(data.user);
        }
      } catch {
        // Unauthenticated on start
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    initAuth();
    return () => {
      mounted = false;
    };
  }, [updateToken]);

  // Activity listeners for idle timeout
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      if (!showIdleWarning) {
        resetIdleTimer();
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    resetIdleTimer();

    return () => {
      if (idleWarningTimer.current) clearTimeout(idleWarningTimer.current);
      if (idleLogoutTimer.current) clearTimeout(idleLogoutTimer.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [user, showIdleWarning, resetIdleTimer]);

  const login = async (credentials: { email: string; password?: string }): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data: LoginResponse = await res.json();

    if (!res.ok) {
      const err = new Error(data.message || (data as unknown as { detail?: string }).detail || 'Invalid credentials or account locked');
      (err as unknown as { status: number }).status = res.status;
      throw err;
    }

    if (data.requires_mfa) {
      return data;
    }

    if (data.access_token && data.user) {
      updateToken(data.access_token);
      setUser(data.user);
      resetIdleTimer();
    }

    return data;
  };

  const verifyTotp = async (mfaTicket: string, code: string) => {
    const res = await fetch(`${API_BASE_URL}/v1/auth/totp`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mfa_ticket: mfaTicket, code }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Invalid TOTP code');
    }

    updateToken(data.access_token);
    setUser(data.user);
    resetIdleTimer();
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      updateToken(null);
      setUser(null);
      setShowIdleWarning(false);
      if (idleWarningTimer.current) clearTimeout(idleWarningTimer.current);
      if (idleLogoutTimer.current) clearTimeout(idleLogoutTimer.current);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        login,
        verifyTotp,
        logout,
        refreshSession,
        stayLoggedIn,
      }}
    >
      {children}

      {/* Accessible Idle Timeout Warning Dialog */}
      {showIdleWarning && (
        <div
          role="alertdialog"
          aria-labelledby="idle-warning-title"
          aria-describedby="idle-warning-desc"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-t-4 border-amber-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
              <h3 id="idle-warning-title" className="text-lg font-bold text-slate-900">
                Session Inactivity Warning
              </h3>
            </div>
            <p id="idle-warning-desc" className="text-sm text-slate-600 mb-6 leading-relaxed">
              Your session has been idle for 14 minutes. For security reasons according to government audit requirements, you will be automatically logged out in <strong>1 minute</strong>.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={logout}>
                Log Out Now
              </Button>
              <Button variant="default" size="sm" onClick={stayLoggedIn}>
                Stay Logged In
              </Button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export { AuthContext };

export const useOptionalAuth = () => {
  return useContext(AuthContext);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


export const RequireRole: React.FC<{ roles: UserRole[]; children?: React.ReactNode }> = ({ roles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-gov-navy border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Verifying credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={getHomeRouteForRole(user.role)} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
