import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StudentCredentialItem, UserTypeConsentSetting, VerifierUserType } from '../types';
import { API_BASE_URL } from '@/lib/api';
import { buildSelectivePresentation } from '@/lib/sdjwt';
import { getOrInitHolderKey } from '@/lib/holderKey';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy,
  Check,
  Clock,
  ShieldCheck,
  KeyRound,
  X,
  ExternalLink,
  Building,
} from 'lucide-react';

interface SharePresentationModalProps {
  credential: StudentCredentialItem | null;
  userConsents?: UserTypeConsentSetting[];
  isOpen: boolean;
  onClose: () => void;
  holderPrivateKey: CryptoKey | null;
}

export const SharePresentationModal: React.FC<SharePresentationModalProps> = ({
  credential,
  isOpen,
  onClose,
  holderPrivateKey,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [targetUserType, setTargetUserType] = useState<VerifierUserType>('EMPLOYER');
  const [audience, setAudience] = useState<string>('Acme Corp HR (Employer Verification)');
  const [isGenerating, setIsGenerating] = useState(false);
  const [presentationResult, setPresentationResult] = useState<{
    presentation: string;
    shareUrl: string;
    disclosedClaims: Record<string, any>;
  } | null>(null);
  const [countdown, setCountdown] = useState<number>(300); // 5 min expiry
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selected claims from defaults
  useEffect(() => {
    if (credential) {
      const defaults = credential.disclosable_claims
        .filter((c) => c.default_selected)
        .map((c) => c.key);
      setSelectedKeys(defaults);
      setPresentationResult(null);
      setError(null);
      setCountdown(300);
    }
  }, [credential]);

  // Expiry countdown timer
  useEffect(() => {
    if (!presentationResult || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [presentationResult, countdown]);

  if (!isOpen || !credential) return null;

  const toggleClaim = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleGeneratePresentation = async () => {
    let key = holderPrivateKey;
    if (!key) {
      try {
        const init = await getOrInitHolderKey(true);
        key = init.privateKey;
      } catch (err) {
        console.error('Failed to get holder key:', err);
        setError('Holder hardware key not initialized in browser IndexedDB.');
        return;
      }
    }

    if (selectedKeys.length === 0) {
      setError('Please select at least one field to disclose.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 1. Fetch challenge nonce from verifier / backend
      let nonce = `nonce-${Date.now()}`;
      try {
        const nonceRes = await fetch(`${API_BASE_URL}/v1/credentials/nonce`);
        if (nonceRes.ok) {
          const nonceData = await nonceRes.json();
          nonce = nonceData.nonce || nonce;
        }
      } catch {
        // fallback
      }

      // 2. Build selective presentation with @sd-jwt & sign KB-JWT
      const { presentation, disclosedClaims } = await buildSelectivePresentation(
        credential.raw_sd_jwt,
        selectedKeys,
        audience,
        nonce,
        key
      );

      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
      const shareUrl = `${origin}/verify?presentation=${encodeURIComponent(presentation)}&verifier_type=${targetUserType}`;

      setPresentationResult({
        presentation,
        shareUrl,
        disclosedClaims,
      });
      setCountdown(300);
    } catch (err) {
      console.error('Failed to generate presentation:', err);
      setError('Failed to cryptographically sign presentation with hardware key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (presentationResult) {
      navigator.clipboard.writeText(presentationResult.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  return (
    <div
      role="dialog"
      aria-labelledby="share-builder-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
      data-testid="share-presentation-modal"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border-t-4 border-gov-navy overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-gov-navy/10 text-gov-navy font-bold text-xs">
                SD-JWT VC
              </span>
              <h3 id="share-builder-title" className="text-base font-bold text-gov-navy">
                Selective Disclosure Presentation Builder
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select attributes to reveal. Unchecked fields remain cryptographically concealed.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Builder Step 1: Claim Checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                1. Select Disclosable Claims ({selectedKeys.length} selected)
              </label>
              <button
                type="button"
                onClick={() =>
                  setSelectedKeys(
                    selectedKeys.length === credential.disclosable_claims.length
                      ? []
                      : credential.disclosable_claims.map((c) => c.key)
                  )
                }
                className="text-xs text-gov-navy hover:underline font-semibold"
              >
                {selectedKeys.length === credential.disclosable_claims.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {credential.disclosable_claims.map((claim) => {
                const isChecked = selectedKeys.includes(claim.key);
                return (
                  <label
                    key={claim.key}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                      isChecked
                        ? 'bg-gov-navy/5 border-gov-navy text-gov-navy font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    data-testid={`claim-checkbox-${claim.key}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleClaim(claim.key)}
                      className="mt-0.5 rounded border-slate-300 text-gov-navy focus:ring-gov-navy"
                    />
                    <div className="truncate">
                      <span className="block text-xs font-medium text-slate-900">{claim.label}</span>
                      <span className="block text-[11px] text-slate-500 font-mono truncate">
                        {String(claim.value)}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Builder Step 2: Target Verifier Category & Audience */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                2. Target Verifier Category / Role
              </label>
              <select
                value={targetUserType}
                onChange={(e) => {
                  const val = e.target.value as VerifierUserType;
                  setTargetUserType(val);
                  switch (val) {
                    case 'EMPLOYER':
                      setAudience('Acme Corp HR (Employer Verification)');
                      break;
                    case 'HIGHER_ED':
                      setAudience('Admissions & Registrar Office (University)');
                      break;
                    case 'GOVERNMENT':
                      setAudience('National Scholarship & Welfare Portal');
                      break;
                    case 'FINANCIAL':
                      setAudience('State Bank / Canara Education Loan Desk');
                      break;
                    case 'REGULATORY':
                      setAudience('AICTE / State Technical Council Audit');
                      break;
                    case 'PUBLIC':
                    default:
                      setAudience('Public Verifier Link');
                      break;
                  }
                }}
                className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                data-testid="target-verifier-select"
              >
                <option value="EMPLOYER">Corporate Employer / Recruiter (EMPLOYER)</option>
                <option value="HIGHER_ED">University / Higher Education (HIGHER_ED)</option>
                <option value="GOVERNMENT">Government / Scholarship Body (GOVERNMENT)</option>
                <option value="FINANCIAL">Bank / Loan Provider (FINANCIAL)</option>
                <option value="REGULATORY">AICTE / Regulatory Council (REGULATORY)</option>
                <option value="PUBLIC">General / Public Verifier (PUBLIC)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                3. Verifier Audience Identifier (aud)
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. Acme Corp HR, TCS Verification Portal"
                  className="pl-9 text-xs"
                  data-testid="audience-input"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                The audience identifier is embedded into the KB-JWT to prevent replay attacks on other verifiers.
              </p>
            </div>
          </div>

          {/* Action to Generate */}
          {!presentationResult ? (
            <Button
              variant="default"
              className="w-full bg-gov-navy hover:bg-gov-navyDark text-white h-10 text-xs font-bold"
              disabled={isGenerating || selectedKeys.length === 0}
              onClick={handleGeneratePresentation}
              data-testid="build-presentation-btn"
            >
              <KeyRound className="w-4 h-4 mr-2 text-gov-saffron" />
              {isGenerating ? 'Building & Signing with Hardware Key...' : 'Build Selective Presentation (QR + Link)'}
            </Button>
          ) : (
            /* Result Panel with QR Code, Expiry Countdown & Copy Link */
            <div
              className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4 animate-in fade-in"
              data-testid="presentation-result-panel"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                  </span>
                  <span className="text-xs font-bold text-green-800 uppercase tracking-wider">
                    Presentation Ready
                  </span>
                </div>

                <div
                  className="flex items-center gap-1.5 text-xs font-mono font-bold text-gov-saffronDark bg-gov-saffron/10 px-2.5 py-1 rounded-md border border-gov-saffron/20"
                  data-testid="presentation-expiry-countdown"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Expires in: {formatCountdown(countdown)}</span>
                </div>
              </div>

              {/* QR Code and Quick Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-2">
                <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200" data-testid="presentation-qr-container">
                  <QRCodeSVG
                    value={presentationResult.shareUrl}
                    size={160}
                    level="H"
                    includeMargin
                  />
                </div>

                <div className="space-y-3 max-w-xs text-center sm:text-left">
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-slate-800 block">Selective Disclosure Summary:</span>
                    <p className="text-slate-600 text-[11px]">
                      Revealing <strong>{Object.keys(presentationResult.disclosedClaims).length}</strong> fields to{' '}
                      <strong>{audience}</strong>.
                    </p>
                    <p className="text-[10px] text-green-700 font-semibold">
                      ✓ Holder Key Binding (KB-JWT) Signed
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleCopyLink}
                      className="bg-gov-navy text-white text-xs h-8"
                      data-testid="copy-share-link-btn"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" />
                          Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                          Copy Verification Link
                        </>
                      )}
                    </Button>

                    <a
                      href={presentationResult.shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 text-xs text-gov-navy hover:underline font-semibold"
                      data-testid="open-verify-link"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open in Verifier Portal</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Disclosed Fields Verification Preview */}
              <div className="pt-3 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider mb-1.5">
                  Verifier Will Receive Only These Claims:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white p-3 rounded-lg border border-slate-200">
                  {Object.entries(presentationResult.disclosedClaims).map(([k, v]) => (
                    <div key={k} className="truncate">
                      <span className="text-slate-500">{k}:</span>{' '}
                      <strong className="text-gov-navy">{String(v)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            RFC 9635 SD-JWT Compliant
          </span>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
