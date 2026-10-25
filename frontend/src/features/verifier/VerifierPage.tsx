import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VerificationResult, VerifierUserType } from '@/features/student/types';
import { API_BASE_URL } from '@/lib/api';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  Users,
} from 'lucide-react';

export const VerifierPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [presentationInput, setPresentationInput] = useState<string>('');
  const [verifierType, setVerifierType] = useState<VerifierUserType>('PUBLIC');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  // Helper to extract presentation string from full URL or raw string
  const cleanPresentationString = (raw: string): string => {
    const trimmed = raw.trim();
    if (trimmed.includes('presentation=')) {
      try {
        const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `http://dummy.com/${trimmed}`);
        const p = urlObj.searchParams.get('presentation');
        if (p) return decodeURIComponent(p);
      } catch {
        const match = trimmed.match(/presentation=([^&]+)/);
        if (match && match[1]) return decodeURIComponent(match[1]);
      }
    }
    return trimmed;
  };

  const handleVerify = useCallback(async (tokenToVerify?: string, typeOverride?: VerifierUserType) => {
    const token = cleanPresentationString(tokenToVerify || presentationInput);
    if (!token) return;
    const activeType = typeOverride || verifierType;

    setIsVerifying(true);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/v1/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sd_jwt_presentation: token,
          aud: 'Public/Authorized Verifier Desk',
          nonce: `nonce-${Date.now()}`,
          verifier_type: activeType,
        }),
      });

      const data: VerificationResult = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error('Verification error:', err);
      setResult({
        valid: false,
        status: 'INVALID_SIGNATURE',
        issuer: 'Unknown Issuer',
        issuer_trusted: false,
        verified_at: new Date().toISOString(),
        checked_at: new Date().toISOString(),
        disclosed_claims: {},
        reasons: ['Network or server failure during cryptographic verification'],
        holder_bound: false,
        error_message: err?.message || 'Verification service error',
      });
    } finally {
      setIsVerifying(false);
    }
  }, [presentationInput, verifierType]);

  // Auto-verify if `?presentation=...` is present in query parameters
  useEffect(() => {
    const queryPresentation = searchParams.get('presentation');
    const queryVerifierType = searchParams.get('verifier_type') as VerifierUserType;
    if (queryVerifierType) {
      setVerifierType(queryVerifierType);
    }
    if (queryPresentation) {
      setPresentationInput(queryPresentation);
      handleVerify(queryPresentation, queryVerifierType || 'PUBLIC');
    }
  }, [searchParams, handleVerify]);

  const handleReset = () => {
    setPresentationInput('');
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="verifier-page">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-gov-navy text-white text-xs font-bold">
              PUBLIC VERIFIER
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-gov-navy">
              Authorized Credential Verification Portal
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time verification of SD-JWT credentials against AICTE trust roots and national status lists
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full border border-green-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            AICTE Trust Root Connected
          </span>
        </div>
      </div>

      {/* Input Section */}
      <Card className="border-slate-200 bg-white shadow-xs" data-testid="verifier-input-card">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-gov-navy flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gov-saffron" />
            <span>Verify Student Presentation</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Accepts raw SD-JWT presentation strings or full verification URLs generated from the Student Wallet
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Paste Presentation or Share URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Presentation Token / Share Link:
            </label>
            <Textarea
              value={presentationInput}
              onChange={(e) => setPresentationInput(e.target.value)}
              placeholder="Paste presentation string (eyJh...~WyJz...~eyJ0...) or http://localhost:5173/verify?presentation=..."
              className="font-mono text-xs h-24 resize-none"
              data-testid="presentation-input-textarea"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              disabled={isVerifying || !presentationInput.trim()}
              onClick={() => handleVerify()}
              className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-bold h-9 px-4"
              data-testid="verify-submit-btn"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5 text-gov-saffron" />
              {isVerifying ? 'Verifying Cryptographic Proofs...' : 'Verify Credential Presentation'}
            </Button>

            {(presentationInput || result) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-slate-800"
                data-testid="verify-reset-btn"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Result Card */}
      {result && (
        <div className="space-y-6 animate-in fade-in" data-testid="verification-result-card">
          {/* 1. Big Status Card (Req 4: Green VALID / Red INVALID / Amber SUPERSEDED / Grey SUSPENDED) */}
          {result.status === 'VALID' && (
            <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 via-white to-green-50/40 p-6 shadow-md" data-testid="card-valid">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 text-green-700 rounded-full shrink-0">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-green-800 tracking-wide" data-testid="verification-status-badge">
                        VALID CREDENTIAL
                      </span>
                      <span className="text-xs bg-green-200 text-green-900 font-bold px-2.5 py-0.5 rounded-full">
                        TRUSTED ISSUER
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Cryptographic proofs validated: Ed25519 issuer signature intact • Hardware key binding verified
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs font-mono text-slate-500 shrink-0">
                  <span>Verified: {new Date(result.verified_at).toLocaleTimeString()}</span>
                </div>
              </div>
            </Card>
          )}

          {result.status === 'INVALID_SIGNATURE' && (
            <Card className="border-2 border-red-500 bg-gradient-to-r from-red-50 via-white to-red-50/40 p-6 shadow-md" data-testid="card-invalid">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 text-red-700 rounded-full shrink-0">
                    <Ban className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-red-800 tracking-wide" data-testid="verification-status-badge">
                        INVALID CREDENTIAL
                      </span>
                      <span className="text-xs bg-red-200 text-red-900 font-bold px-2.5 py-0.5 rounded-full">
                        TAMPER DETECTED
                      </span>
                    </div>
                    <p className="text-xs text-red-700 font-medium">
                      {result.error_message || 'Cryptographic disclosure digest or issuer signature mismatch.'}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs font-mono text-slate-500 shrink-0">
                  <span>Checked: {new Date(result.checked_at).toLocaleTimeString()}</span>
                </div>
              </div>
            </Card>
          )}

          {result.status === 'SUPERSEDED' && (
            <Card className="border-2 border-amber-500 bg-gradient-to-r from-amber-50 via-white to-amber-50/40 p-6 shadow-md" data-testid="card-superseded">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 text-amber-700 rounded-full shrink-0">
                    <Clock className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-amber-800 tracking-wide" data-testid="verification-status-badge">
                        SUPERSEDED CREDENTIAL
                      </span>
                      <span className="text-xs bg-amber-200 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
                        NEW VERSION EXISTS
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 font-medium">
                      A newer student record version exists; ask the holder for an updated verifiable credential.
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs font-mono text-slate-500 shrink-0">
                  <span>Checked: {new Date(result.checked_at).toLocaleTimeString()}</span>
                </div>
              </div>
            </Card>
          )}

          {result.status === 'SUSPENDED' && (
            <Card className="border-2 border-slate-500 bg-gradient-to-r from-slate-100 via-white to-slate-100 p-6 shadow-md" data-testid="card-suspended">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-200 text-slate-700 rounded-full shrink-0">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-slate-900 tracking-wide" data-testid="verification-status-badge">
                        SUSPENDED CREDENTIAL
                      </span>
                      <span className="text-xs bg-slate-300 text-slate-800 font-bold px-2.5 py-0.5 rounded-full">
                        CONSENT WITHDRAWN
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium" data-testid="suspended-reason-text">
                      {result.error_message || 'Holder has withdrawn VERIFICATION_SHARE consent under Section 8.4. No student data is revealed.'}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs font-mono text-slate-500 shrink-0">
                  <span>Checked: {new Date(result.checked_at).toLocaleTimeString()}</span>
                </div>
              </div>
            </Card>
          )}

          {/* 2. Issuer Details & Cryptographic Audit Verification Reasons List */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-gov-navy flex items-center justify-between">
                <span>Cryptographic Audit Proofs</span>
                <span className="text-xs text-slate-500 font-normal">
                  Issuer: <strong>{result.issuer}</strong>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-500">Issuing Authority:</span>{' '}
                  <strong className="text-slate-900">{result.issuer}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Trust Registry Status:</span>{' '}
                  <span className="text-green-700 font-bold">
                    {result.issuer_trusted ? 'Verified AICTE Trust List' : 'Untrusted Authority'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Checked Timestamp:</span>{' '}
                  <strong className="font-mono text-slate-800">{new Date(result.checked_at).toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Hardware Key Binding:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {result.holder_bound ? '✓ ECDSA P-256 Validated' : 'Unbound'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
                  Verification Reasons & Statutory Checks:
                </span>
                <ul className="space-y-1 text-xs" data-testid="verification-reasons-list">
                  {result.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700">
                      <span className="text-gov-navy font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 3. Disclosed Claims Table (Only revealed claims; non-disclosed remain hidden per Req 4) */}
          <Card className="border-slate-200 bg-white shadow-xs" data-testid="disclosed-claims-card">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-gov-navy">
                  Disclosed Student Attributes ({Object.keys(result.disclosed_claims).length} Fields Revealed)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Selective disclosure zero-knowledge guarantee: non-disclosed claims were never transmitted to verifier
                </CardDescription>
              </div>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                RFC 9635
              </span>
            </CardHeader>

            <CardContent className="pt-4">
              {Object.keys(result.disclosed_claims).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left" data-testid="disclosed-claims-table">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 font-bold uppercase tracking-wider text-[10px]">Claim Key</th>
                        <th className="p-2.5 font-bold uppercase tracking-wider text-[10px]">Attribute Value</th>
                        <th className="p-2.5 font-bold uppercase tracking-wider text-[10px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(result.disclosed_claims).map(([key, value]) => (
                        <tr key={key} data-testid={`claim-${key}`}>
                          <td className="p-2.5 font-mono font-bold text-gov-navy">{key}</td>
                          <td className="p-2.5 font-semibold text-slate-900" data-testid={`disclosed-val-${key}`}>
                            {String(value)}
                          </td>
                          <td className="p-2.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                              Cryptographically Disclosed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200" data-testid="disclosed-empty-notice">
                  {result.status === 'SUSPENDED'
                    ? 'No claims disclosed because the holder has suspended verification consent under Section 8.4.'
                    : 'No selective claims were disclosed in this presentation.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
