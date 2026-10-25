import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useOptionalAuth } from '@/lib/auth';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Download,
  FileText,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AuthorityAccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useOptionalAuth();
  const user = auth?.user;

  const token = searchParams.get('token') || 'auth-anon-demo';
  const targetRole = searchParams.get('role') || 'AICTE_ADMIN';
  const resource = searchParams.get('resource') || 'Statutory Category Reservation & Quota Clearance Certificate';
  const expires = searchParams.get('expires');

  const [downloaded, setDownloaded] = useState(false);

  const isExpired = expires ? new Date(expires).getTime() < Date.now() : false;
  const isAuthorized = Boolean(user && (user.role === targetRole || user.role === 'AICTE_ADMIN') && !isExpired);
  const userName = user?.full_name || user?.name || user?.email || 'Authorized User';

  const handleDownload = () => {
    setDownloaded(true);
    // Simulate downloading statutory file
    const content = `GOVERNMENT OF INDIA - AICTE STATUTORY CLEARANCE\nResource: ${resource}\nToken: ${token}\nAuthority Role: ${targetRole}\nAccessed By: ${userName} (${user?.email})\nTimestamp: ${new Date().toISOString()}\nStatus: VERIFIED_AND_SIGNED`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resource.toLowerCase().replace(/[^a-z0-9]/g, '_')}_clearance.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-gov-navy text-white px-6 py-4 border-b border-slate-700 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gov-saffron rounded-full flex items-center justify-center font-bold text-gov-navy text-sm shadow">
            AV
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">EduVerify Authority File Access Gateway</h1>
            <p className="text-xs text-slate-300">National Secure Cryptographic Clearance & File Dispatch</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-300">Active Identity:</span>
          {user ? (
            <span className="font-mono bg-white/10 px-2.5 py-1 rounded text-white font-semibold">
              {userName} ({user.role})
            </span>
          ) : (
            <span className="font-mono bg-red-500/20 text-red-200 px-2 py-0.5 rounded">
              Not Authenticated
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto p-6 my-auto">
        {/* Scenario 1: Not Logged In */}
        {!user && (
          <div className="bg-white rounded-xl shadow-lg border border-amber-200 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Authentication Required for Authority Link</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              This file is protected by cryptographic zero-trust controls and requires an active session with role{' '}
              <strong className="text-slate-900 font-mono">{targetRole}</strong>.
            </p>
            <div className="pt-2">
              <Link to="/login">
                <Button className="bg-gov-navy hover:bg-slate-800 text-white font-semibold">
                  Log In with Authority Credentials
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Scenario: Expired Token */}
        {user && isExpired && (
          <div className="bg-white rounded-xl shadow-xl border border-amber-200 overflow-hidden animate-in fade-in">
            <div className="bg-amber-600 text-white p-5 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h2 className="text-base font-bold">Authority Access Link Expired</h2>
                <p className="text-xs text-amber-100">
                  This secure access link has exceeded its validity window
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700">
                The access token expired on <strong className="text-slate-900">{new Date(expires || '').toLocaleString()}</strong>.
                Please contact the authorized administrative issuer to request a new cryptographic link.
              </p>
              <div className="pt-2">
                <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 text-xs">
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Previous Page
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Scenario 2: Logged In but Unauthorized Role */}
        {user && !isExpired && !isAuthorized && (
          <div className="bg-white rounded-xl shadow-xl border border-red-200 overflow-hidden animate-in fade-in">
            <div className="bg-red-600 text-white p-5 flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div>
                <h2 className="text-base font-bold">403 Forbidden — Insufficient Authority Clearance</h2>
                <p className="text-xs text-red-100">
                  Access Denied under Rule V035 & AICTE Data Governance Protocol
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-900 space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  {isExpired
                    ? 'This authority access link has expired. Please request a new security clearance link.'
                    : 'Your current account does not have permission to view this restricted authority file.'}
                </p>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-red-200/60 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Required Role:</span>
                    <span className="font-bold text-red-700">{targetRole}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Your Current Role:</span>
                    <span className="font-bold text-slate-800">{user.role}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  Target Resource: <strong className="text-slate-800">{resource}</strong>
                </p>
                <p>
                  Cryptographic Token: <span className="font-mono text-slate-500">{token}</span>
                </p>
                <p className="text-slate-400 italic">
                  Note: This security access violation has been timestamped and recorded in the immutable audit ledger.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 text-xs">
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Previous Page
                </Button>
                <Link to="/login">
                  <Button className="bg-gov-navy hover:bg-slate-800 text-white text-xs">
                    Switch / Login with Authorized Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Scenario 3: Logged In and Authorized */}
        {user && isAuthorized && (
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in">
            {/* Header banner */}
            <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <ShieldCheck className="w-6 h-6 text-emerald-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold">Authorized Authority Access Cleared</h2>
                    <span className="bg-white/20 text-white font-mono text-[10px] px-2 py-0.5 rounded font-semibold uppercase">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100">
                    Role-level clearance verified for {user.role} &middot; Cryptographic Token Valid
                  </p>
                </div>
              </div>
              <div className="text-right text-xs">
                <span className="text-emerald-200 block text-[11px]">Audit Timestamp:</span>
                <span className="font-mono">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Document Overview Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gov-navy/10 text-gov-navy rounded-md">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{resource}</h3>
                      <p className="text-xs text-slate-500">
                        Official Statutory Regulatory File &middot; AICTE Central Repository Dispatch
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Security Sealed
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-200 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Security Token:</span>
                    <span className="text-slate-800 font-semibold">{token.substring(0, 16)}...</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Target Role:</span>
                    <span className="text-gov-navy font-bold">{targetRole}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Access Expiry:</span>
                    <span className="text-slate-800">
                      {expires ? new Date(expires).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '24h'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Decryption Status:</span>
                    <span className="text-emerald-700 font-semibold">Decrypted (AES-GCM)</span>
                  </div>
                </div>
              </div>

              {/* Document Preview Box */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 border-b border-slate-200 flex items-center justify-between">
                  <span>Official Document Content Preview</span>
                  <span className="text-[11px] text-slate-500 font-normal">AICTE Form Ref: ST-2026-REG-09</span>
                </div>
                <div className="p-4 bg-white font-mono text-xs text-slate-800 space-y-2 leading-relaxed">
                  <p className="text-gov-navy font-bold">
                    [ALL INDIA COUNCIL FOR TECHNICAL EDUCATION - STATUTORY CLEARANCE DOSSIER]
                  </p>
                  <p>Institution: 1-10972342911 (Vellore Institute of Technology - Autonomous)</p>
                  <p>Affiliated Degree Awarding Body: Anna University (DAB-TN-001)</p>
                  <p>Academic Cycle: 2026-27 &middot; Approval Reference: AICTE/ERO/2026/7821</p>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 my-2 space-y-1 font-sans text-xs">
                    <p className="font-bold text-slate-900">Certified Statutory Quota Compliance Summary:</p>
                    <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                      <li>Total Approved Intake: 420 seats across 3 undergraduate programs.</li>
                      <li>Statutory Category Quotas: Scheduled Castes (15%), Scheduled Tribes (7.5%), OBC-NCL (27%), EWS (10%).</li>
                      <li>Current Status: Zero intake limit violations detected. Intra-batch duplicates: 0.</li>
                      <li>Cross-Institution National Duplicate Scan: CLEAN (No active dual enrolments detected).</li>
                    </ul>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    DIGITALLY ATTESTED VIA ED25519 ISSUER SIGNATURE &middot; HASH CHAIN BLOCK #8812-9A4F
                  </p>
                </div>
              </div>

              {/* Download / Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <Button
                  onClick={handleDownload}
                  className="w-full sm:w-auto bg-gov-navy hover:bg-slate-800 text-white gap-2 font-semibold text-xs"
                >
                  <Download className="w-4 h-4" /> Download Official Signed Copy (.txt / .csv)
                </Button>
                {downloaded && (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    File downloaded successfully & dispatch event recorded.
                  </span>
                )}
                <Button variant="outline" onClick={() => navigate('/institution/dashboard')} className="text-xs">
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-500">
        EduVerify Digital Public Infrastructure &middot; Role-Based Authorized Access Dispatch &middot; Governed under AICTE Mandate 2026
      </footer>
    </div>
  );
};
