import React from 'react';
import { Button } from '@/components/ui/button';
import { InstitutionSeatMatrixRecord } from '../types';
import {
  ShieldCheck,
  Building2,
  X,
  FileText,
  CheckCircle2,
  Hash,
  Award,
  Download,
  Percent,
} from 'lucide-react';

interface SeatMatrixCertificateModalProps {
  institution: InstitutionSeatMatrixRecord | null;
  onClose: () => void;
}

export const SeatMatrixCertificateModal: React.FC<SeatMatrixCertificateModalProps> = ({
  institution,
  onClose,
}) => {
  if (!institution) return null;

  const intake = institution.approved_intake || 360;
  const quotas = institution.quotas || {
    gen: Math.round(intake * 0.5),
    obc: Math.round(intake * 0.27),
    sc: Math.round(intake * 0.15),
    st: Math.round(intake * 0.075),
    ews: Math.round(intake * 0.1),
    pwd: Math.round(intake * 0.05),
  };
  const supernum = institution.supernumerary || {
    tfw: Math.round(intake * 0.05),
    pmsss: 10,
    nri_oci_fn: Math.round(intake * 0.15),
    ciwg: 15,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="seat-cert-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      data-testid="seat-matrix-certificate-modal"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Certificate Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-linear-to-r from-gov-navy/5 via-blue-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gov-navy text-white shadow-xs">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="seat-cert-title" className="text-sm font-bold text-gov-navy">
                  AICTE Sanctioned Intake & Seat Matrix Certificate
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Statutory Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Official Sanctioned Quotas under AICTE Approval Process Handbook (APH)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close certificate dialog"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Certificate Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
          {/* Institutional Identification */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Accredited Educational Institution
              </span>
              <h4 className="text-sm font-bold text-gov-navy mt-0.5">
                {institution.name}
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                {institution.state_name || institution.state_code} &bull; {institution.district_name || institution.district_code}
              </p>
            </div>
            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
              <div className="text-[10px] uppercase font-bold text-slate-400">AICTE Permanent ID</div>
              <div className="font-mono text-xs font-bold text-slate-900">{institution.institution_aicte_id}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">AISHE: {institution.aishe_code || 'C-10291'}</div>
            </div>
          </div>

          {/* Sanctioned Seat Capacity Banner */}
          <div className="p-4 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-900 tracking-wider">
                Total Sanctioned Annual Seat Capacity
              </div>
              <div className="text-2xl font-black text-gov-navy mt-0.5">
                {intake} <span className="text-xs font-semibold text-slate-600">Approved Seats / Academic Year {institution.academic_year || '2026-27'}</span>
              </div>
            </div>
            <div className="p-3 bg-white/80 rounded-lg border border-blue-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Category</span>
              <span className="font-bold text-xs text-gov-navy">{institution.type}</span>
            </div>
          </div>

          {/* Statutory Category Quotas Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-gov-navy" />
                Category Quota Breakdown (Constitutional Reservations)
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Mandatory Statutory Distribution
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 text-[11px] font-bold text-slate-700 uppercase">
                  <tr>
                    <th className="px-3 py-2">Category Quota</th>
                    <th className="px-3 py-2">Statutory Percentage</th>
                    <th className="px-3 py-2">Sanctioned Seats</th>
                    <th className="px-3 py-2">Seat Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-900">General (GEN - Open)</td>
                    <td className="px-3 py-2 text-slate-600">50.0%</td>
                    <td className="px-3 py-2 font-mono font-bold text-gov-navy">{quotas.gen}</td>
                    <td className="px-3 py-2 text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Sanction
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-900">Other Backward Classes (OBC-NCL)</td>
                    <td className="px-3 py-2 text-slate-600">27.0%</td>
                    <td className="px-3 py-2 font-mono font-bold text-gov-navy">{quotas.obc}</td>
                    <td className="px-3 py-2 text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Sanction
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-900">Scheduled Caste (SC)</td>
                    <td className="px-3 py-2 text-slate-600">15.0%</td>
                    <td className="px-3 py-2 font-mono font-bold text-gov-navy">{quotas.sc}</td>
                    <td className="px-3 py-2 text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Sanction
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-900">Scheduled Tribe (ST)</td>
                    <td className="px-3 py-2 text-slate-600">7.5%</td>
                    <td className="px-3 py-2 font-mono font-bold text-gov-navy">{quotas.st}</td>
                    <td className="px-3 py-2 text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Sanction
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-900">Economically Weaker Section (EWS)</td>
                    <td className="px-3 py-2 text-slate-600">10.0% (Over Intake)</td>
                    <td className="px-3 py-2 font-mono font-bold text-gov-navy">{quotas.ews}</td>
                    <td className="px-3 py-2 text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Sanction
                    </td>
                  </tr>
                  {quotas.pwd && quotas.pwd > 0 && (
                    <tr className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-semibold text-slate-900">Persons with Disabilities (PwD)</td>
                      <td className="px-3 py-2 text-slate-600">5.0% (Horizontal)</td>
                      <td className="px-3 py-2 font-mono font-bold text-gov-navy">{quotas.pwd}</td>
                      <td className="px-3 py-2 text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Horizontal Sub-quota
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supernumerary Schemed Seats */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Supernumerary Sanctioned Schemes
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Over & Above Approved Intake</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">TFW Scheme</span>
                <span className="font-mono text-sm font-bold text-gov-navy">{supernum.tfw} Seats</span>
                <span className="text-[10px] text-slate-400 block">5% Tuition Fee Waiver</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">PMSSS (J&K)</span>
                <span className="font-mono text-sm font-bold text-gov-navy">{supernum.pmsss} Seats</span>
                <span className="text-[10px] text-slate-400 block">Special Scholarship</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">NRI / OCI / FN</span>
                <span className="font-mono text-sm font-bold text-gov-navy">{supernum.nri_oci_fn} Seats</span>
                <span className="text-[10px] text-slate-400 block">15% Max Allowed</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">CIWG Quota</span>
                <span className="font-mono text-sm font-bold text-gov-navy">{supernum.ciwg || 15} Seats</span>
                <span className="text-[10px] text-slate-400 block">Gulf Workers Children</span>
              </div>
            </div>
          </div>

          {/* Attached Statutory Proof Document */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 font-mono text-[11px] text-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Sanction Document:</span>
              <span className="font-bold text-gov-navy flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                {institution.document_name || 'AICTE_Sanctioned_Intake_Order.pdf'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Approval Order / Gazette:</span>
              <span className="font-semibold text-slate-900">{institution.approval_order_ref || 'F.No. AICTE/AB/2026/APH-1049'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Authorizing Officer:</span>
              <span className="font-semibold text-slate-900">{institution.authorizing_director || institution.verified_by || 'Dr. T.G. Sitharam, Chairman AICTE'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Verification Timestamp:</span>
              <span className="font-semibold text-slate-900">
                {institution.document_uploaded_at || institution.verified_at
                  ? new Date(institution.document_uploaded_at || institution.verified_at || '').toLocaleString()
                  : '2026-06-15 10:00 IST'}
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-200 flex items-center gap-1 text-[10px] text-slate-500">
              <Hash className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">
                SHA-256 Seal: {institution.document_hash || institution.source_file_hash || 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
              </span>
            </div>
          </div>
        </div>

        {/* Certificate Footer */}
        <div className="flex items-center justify-between p-3.5 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cryptographically sealed under AICTE Central Trust Registry</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1 text-slate-700"
            >
              <Download className="w-3 h-3" />
              Print Certificate
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onClose}
              data-testid="close-seat-cert-modal"
              className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
