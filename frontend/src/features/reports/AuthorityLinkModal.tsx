import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Link2,
  Copy,
  Check,
  Lock,
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import { useOptionalAuth } from '@/lib/auth';

interface AuthorityLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultResource?: string;
}

export const AuthorityLinkModal: React.FC<AuthorityLinkModalProps> = ({
  isOpen,
  onClose,
  defaultResource = 'Statutory Category Reservation & Quota Clearance Certificate',
}) => {
  const auth = useOptionalAuth();
  const user = auth?.user;
  const [targetRole, setTargetRole] = useState<'AICTE_ADMIN' | 'DAB_ADMIN' | 'INSTITUTION_ADMIN' | 'VERIFIER'>('AICTE_ADMIN');
  const [resource, setResource] = useState<string>(defaultResource);
  const [validityHours, setValidityHours] = useState<number>(24);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const tokenId = `auth-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  const expiresAt = new Date(Date.now() + validityHours * 3600 * 1000).toISOString();
  const generatedLink = `${window.location.origin}/auth-access?token=${tokenId}&role=${targetRole}&resource=${encodeURIComponent(
    resource
  )}&expires=${encodeURIComponent(expiresAt)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestLink = () => {
    window.open(generatedLink, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gov-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-gov-saffron/20 text-gov-saffron">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Generate Authority-Restricted Link</h3>
              <p className="text-[11px] text-slate-300">
                Grant role-scoped, cryptographic file access exclusively to verified authorities
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white text-sm font-bold">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-gov-saffron shrink-0 mt-0.5" />
            <span>
              <strong>Zero-Trust Access Control:</strong> Only users possessing active credentials for the selected authority role will be permitted to open and download the file. Unauthorized users will receive a 403 Forbidden security block.
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Authorized Authority Role <span className="text-red-500">*</span>
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as any)}
                className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white text-slate-800 font-semibold focus:ring-1 focus:ring-gov-navy"
              >
                <option value="AICTE_ADMIN">AICTE_ADMIN — AICTE National Directorate & Inspection Desk</option>
                <option value="DAB_ADMIN">DAB_ADMIN — Affiliating University & Degree Awarding Body</option>
                <option value="INSTITUTION_ADMIN">INSTITUTION_ADMIN — Certified Institutional Auditor</option>
                <option value="VERIFIER">VERIFIER — Authorized Statutory & Employer Verification Agency</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Restricted Resource / File <span className="text-red-500">*</span>
              </label>
              <select
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-gov-navy"
              >
                <option value="Statutory Category Reservation & Quota Clearance Certificate">
                  Statutory Category Reservation & Quota Clearance Certificate
                </option>
                <option value="AICTE Ingestion Quality & Compliance Audit Report (PDF)">
                  AICTE Ingestion Quality & Compliance Audit Report (PDF)
                </option>
                <option value="Batch Ingestion Ledger & Deduplication Audit Log (Excel)">
                  Batch Ingestion Ledger & Deduplication Audit Log (Excel)
                </option>
                <option value="Student Cryptographic SD-JWT Verification Package">
                  Student Cryptographic SD-JWT Verification Package
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Link Expiration Window
              </label>
              <div className="flex items-center gap-2">
                {[
                  { hours: 24, label: '24 Hours' },
                  { hours: 168, label: '7 Days' },
                  { hours: 720, label: '30 Days' },
                ].map((item) => (
                  <button
                    key={item.hours}
                    type="button"
                    onClick={() => setValidityHours(item.hours)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                      validityHours === item.hours
                        ? 'bg-gov-navy text-white border-gov-navy'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Generated Authorized Access Link:
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  readOnly
                  value={generatedLink}
                  className="font-mono text-xs bg-slate-50 text-slate-600 truncate h-9"
                />
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className="bg-gov-saffron hover:bg-amber-600 text-slate-900 font-bold text-xs shrink-0 h-9 px-3"
                >
                  {copied ? <Check className="w-3.5 h-3.5 mr-1 text-green-800" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Active persona: <strong>{user?.role || 'Guest'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleTestLink}
              className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Test Access Link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
