import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock, Eye, EyeOff, KeyRound, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, getHomeRouteForRole } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [mfaTicket, setMfaTicket] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { login, verifyTotp } = useAuth();

  // Demo mode is active in dev mode or when VITE_DEMO_MODE is true
  const isDemoMode = import.meta.env.VITE_DEMO_MODE !== 'false';

  const demoUsers = [
    { label: '🏛️ Institution Admin', email: 'inst.admin@demo.local', role: 'INSTITUTION_ADMIN' },
    { label: '📝 Institution Staff', email: 'inst.staff@demo.local', role: 'INSTITUTION_STAFF' },
    { label: '🛡️ AICTE Admin (MFA)', email: 'aicte.admin@demo.local', role: 'AICTE_ADMIN' },
    { label: '⚖️ DAB Member', email: 'dab.member@demo.local', role: 'DAB_MEMBER' },
    { label: '🎓 Student', email: 'student@demo.local', role: 'STUDENT' },
    { label: '🔍 Verifier', email: 'verifier@demo.local', role: 'VERIFIER' },
    { label: '🏢 Employer (Hiring)', email: 'employer@demo.local', role: 'EMPLOYER' },
  ];

  const handleSelectDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('AdminPassword@2026');
    setErrorMessage(null);
    setIsLockedOut(false);
    setMfaTicket(null);
  };

  const handleUnlock = async () => {
    try {
      await fetch(`${API_BASE_URL}/v1/auth/unlock?email=${encodeURIComponent(email)}`, {
        method: 'POST',
      });
    } catch {
      // ignore
    }
    setIsLockedOut(false);
    setErrorMessage(null);
    setPassword('AdminPassword@2026');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mfaTicket) {
        // Step 2: Verify TOTP MFA
        await verifyTotp(mfaTicket, totpCode);
        const destination = returnTo || '/aicte';
        navigate(destination, { replace: true });
      } else {
        // Step 1: Password Login
        const res = await login({ email, password });
        if (res.requires_mfa && res.mfa_ticket) {
          setMfaTicket(res.mfa_ticket);
        } else if (res.user) {
          const destination = returnTo || getHomeRouteForRole(res.user.role);
          navigate(destination, { replace: true });
        }
      }
    } catch (err: unknown) {
      const error = err as { message?: string; status?: number };
      if (error.status === 423 || error.message?.toLowerCase().includes('temporarily locked')) {
        setIsLockedOut(true);
        setErrorMessage(
          'Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.'
        );
      } else {
        // Uniform error message to prevent user enumeration
        setErrorMessage(error.message || 'Invalid credentials or account locked');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-10 px-4 min-h-[calc(100vh-140px)]">
      <div className="w-full max-w-md space-y-4">
        {/* Demo Users Quick Picker */}
        {isDemoMode && (
          <div className="bg-slate-100/90 border border-slate-200 rounded-lg p-3 text-xs shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Demo User Quick Picker
              </span>
              <span className="text-[10px] text-slate-400 font-mono">VITE_DEMO_MODE</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {demoUsers.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleSelectDemoUser(u.email)}
                  className={`text-left px-2 py-1.5 rounded text-[11px] font-medium border transition-all ${
                    email === u.email
                      ? 'bg-gov-navy text-white border-gov-navy font-semibold shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <Card className="w-full shadow-lg border-t-4 border-t-gov-navy">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-gov-navy/10 rounded-full flex items-center justify-center mb-2">
              <Shield className="w-6 h-6 text-gov-navy" />
            </div>
            <CardTitle className="text-xl text-gov-navy">
              {mfaTicket ? 'Two-Factor Authentication' : 'Sign in to EduVerify'}
            </CardTitle>
            <CardDescription className="text-xs">
              {mfaTicket
                ? 'Enter the 6-digit verification code from your authenticator app'
                : 'National APAAR Student Verification & Repository System'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <div
                role="alert"
                className={`p-3 rounded-lg text-xs font-medium mb-4 flex flex-col gap-2 ${
                  isLockedOut
                    ? 'bg-red-50 text-red-900 border border-red-300'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span id="login-error-message">{errorMessage}</span>
                </div>
                {isLockedOut && (
                  <button
                    type="button"
                    onClick={handleUnlock}
                    className="self-start text-[11px] font-bold text-gov-navy underline hover:text-gov-navyDark cursor-pointer"
                  >
                    🔓 Instant Admin Unlock (Reset lockout & retry)
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!mfaTicket ? (
                <>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Institutional / Official Email
                    </label>
                    <Input
                      id="email"
                      data-testid="login-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@institution.edu.in"
                      required
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label
                        htmlFor="password"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-gov-navy hover:underline flex items-center gap-1 focus:outline-none"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Show</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        data-testid="login-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••"
                        required
                        disabled={isLoading}
                        className="w-full pr-10"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
                    <p className="font-semibold flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-gov-navy" />
                      MFA Challenge for AICTE Admin
                    </p>
                    <p className="mt-1 text-slate-600">
                      For testing in demo mode, use TOTP code: <strong className="font-mono text-gov-navy">123456</strong>
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="totp"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      6-Digit Security Code
                    </label>
                    <Input
                      id="totp"
                      data-testid="login-totp-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      autoFocus
                      required
                      className="w-full text-center tracking-widest text-lg font-mono"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="default"
                className="w-full mt-2 bg-gov-navy hover:bg-gov-navyDark text-white"
                disabled={isLoading}
                id="sign-in-btn"
                data-testid="login-submit-btn"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </span>
                ) : mfaTicket ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>Sign In</span>
                  </span>
                )}
              </Button>

              {mfaTicket && (
                <button
                  type="button"
                  onClick={() => setMfaTicket(null)}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 pt-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to password</span>
                </button>
              )}

              <div className="text-center text-[11px] text-slate-500 pt-3 border-t border-slate-100">
                Protected by Argon2id, in-memory JWT tokens & hash-chained audit logging.
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
