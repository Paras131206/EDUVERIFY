import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/lib/api';
import { InstitutionSeatMatrixRecord, QuotaAllocation, SupernumeraryAllocation } from '../types';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Building2,
  Hash,
  Info,
} from 'lucide-react';

interface UploadSeatMatrixDocModalProps {
  isOpen: boolean;
  institution: InstitutionSeatMatrixRecord | null;
  institutionsList?: InstitutionSeatMatrixRecord[];
  onClose: () => void;
  onSuccess: (updated: InstitutionSeatMatrixRecord) => void;
}

export const UploadSeatMatrixDocModal: React.FC<UploadSeatMatrixDocModalProps> = ({
  isOpen,
  institution,
  institutionsList = [],
  onClose,
  onSuccess,
}) => {
  const [selectedInstId, setSelectedInstId] = useState<string>(
    institution?.institution_aicte_id || (institutionsList[0]?.institution_aicte_id ?? '')
  );

  const [intake, setIntake] = useState<number>(institution?.approved_intake || 360);
  const [academicYear, setAcademicYear] = useState<string>(institution?.academic_year || '2026-27');
  const [approvalOrderRef, setApprovalOrderRef] = useState<string>(
    institution?.approval_order_ref || 'F.No. AICTE/AB/2026/APH-SEAT-102'
  );
  const [authorizingDirector, setAuthorizingDirector] = useState<string>(
    institution?.authorizing_director || 'Dr. T.G. Sitharam, Chairman AICTE'
  );
  const [documentType, setDocumentType] = useState<string>('AICTE Approval Process Letter (APH)');
  const [remarks, setRemarks] = useState<string>('Sanctioned intake and quota matrix approved per statutory norms');

  // Quotas
  const [quotas, setQuotas] = useState<QuotaAllocation>({
    gen: Math.round(intake * 0.5),
    obc: Math.round(intake * 0.27),
    sc: Math.round(intake * 0.15),
    st: Math.round(intake * 0.075),
    ews: Math.round(intake * 0.1),
    pwd: Math.round(intake * 0.05),
  });

  // Supernumerary
  const [supernum, setSupernum] = useState<SupernumeraryAllocation>({
    tfw: Math.round(intake * 0.05),
    pmsss: 10,
    nri_oci_fn: Math.round(intake * 0.15),
    ciwg: 15,
  });

  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<InstitutionSeatMatrixRecord | null>(null);

  useEffect(() => {
    if (institution) {
      setSelectedInstId(institution.institution_aicte_id);
      setIntake(institution.approved_intake || 360);
      setAcademicYear(institution.academic_year || '2026-27');
      setApprovalOrderRef(institution.approval_order_ref || 'F.No. AICTE/AB/2026/APH-SEAT-102');
      if (institution.quotas) setQuotas(institution.quotas);
      if (institution.supernumerary) setSupernum(institution.supernumerary);
    }
  }, [institution]);

  // Recalculate default quotas when intake changes
  const handleIntakeChange = (newIntake: number) => {
    setIntake(newIntake);
    setQuotas({
      gen: Math.round(newIntake * 0.5),
      obc: Math.round(newIntake * 0.27),
      sc: Math.round(newIntake * 0.15),
      st: Math.round(newIntake * 0.075),
      ews: Math.round(newIntake * 0.1),
      pwd: Math.round(newIntake * 0.05),
    });
    setSupernum({
      tfw: Math.round(newIntake * 0.05),
      pmsss: 10,
      nri_oci_fn: Math.round(newIntake * 0.15),
      ciwg: 15,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setErrorMessage(null);
  };

  const handleUploadSubmit = async () => {
    if (!selectedInstId) {
      setErrorMessage('Please select an accredited institution.');
      return;
    }
    if (intake <= 0) {
      setErrorMessage('Please enter a valid seat capacity intake greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      approved_intake: intake,
      academic_year: academicYear,
      quotas,
      supernumerary: supernum,
      approval_order_ref: approvalOrderRef,
      document_name: uploadedFileName || `Sanctioned_Seat_Matrix_${selectedInstId}_2026.pdf`,
      document_type: documentType,
      authorizing_director: authorizingDirector,
      remarks,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/v1/admin/institutions/${encodeURIComponent(selectedInstId)}/seat-matrix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to update institution seat matrix. Status: ' + res.status);
      }

      const data = await res.json();
      setSuccessResult(data.institution);
      onSuccess(data.institution);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error uploading seat matrix document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentInst = institution || institutionsList.find((i) => i.institution_aicte_id === selectedInstId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-seat-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      data-testid="upload-seat-matrix-modal"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gov-navy text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="upload-seat-modal-title" className="text-base font-bold text-gov-navy">
                  Upload Sanctioned Seat Matrix & Quota Document
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                  Seat Capacity Verification
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Attach official sanction letter and configure constitutional category quotas for the institution.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Institution Selector */}
          {!institution && institutionsList.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Institution <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedInstId}
                onChange={(e) => setSelectedInstId(e.target.value)}
                className="w-full text-xs h-9 rounded-md border border-slate-300 bg-white px-2.5 font-medium text-slate-900"
                data-testid="institution-seat-select"
              >
                {institutionsList.map((inst) => (
                  <option key={inst.institution_aicte_id} value={inst.institution_aicte_id}>
                    {inst.name} ({inst.institution_aicte_id}) &bull; {inst.state_name || inst.state_code}
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentInst && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-950">
              <div>
                <strong className="font-bold">{currentInst.name}</strong>
                <p className="text-[11px] text-blue-800">
                  AICTE ID: <span className="font-mono font-semibold">{currentInst.institution_aicte_id}</span> &bull; {currentInst.state_name || currentInst.state_code} &bull; Type: {currentInst.type}
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-blue-200 text-blue-900 rounded font-semibold">
                Current Intake: {currentInst.approved_intake || 360} Seats
              </span>
            </div>
          )}

          {/* Seat Capacity Intake & Academic Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Sanctioned Seat Capacity (Intake) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={intake}
                onChange={(e) => handleIntakeChange(Number(e.target.value) || 0)}
                data-testid="seat-intake-input"
                className="h-8 text-xs bg-white font-bold text-gov-navy"
                min={1}
                max={5000}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
              <Input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="h-8 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Approval Order / Gazette Ref <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={approvalOrderRef}
                onChange={(e) => setApprovalOrderRef(e.target.value)}
                data-testid="seat-order-ref-input"
                className="h-8 text-xs bg-white font-mono"
              />
            </div>
          </div>

          {/* Category Quotas Inputs */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Sanctioned Category Quotas (Seats)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">General (GEN - 50%)</label>
                <Input
                  type="number"
                  value={quotas.gen}
                  onChange={(e) => setQuotas({ ...quotas, gen: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white"
                />
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">OBC-NCL (27%)</label>
                <Input
                  type="number"
                  value={quotas.obc}
                  onChange={(e) => setQuotas({ ...quotas, obc: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white"
                />
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Scheduled Caste (SC - 15%)</label>
                <Input
                  type="number"
                  value={quotas.sc}
                  onChange={(e) => setQuotas({ ...quotas, sc: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white"
                />
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Scheduled Tribe (ST - 7.5%)</label>
                <Input
                  type="number"
                  value={quotas.st}
                  onChange={(e) => setQuotas({ ...quotas, st: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white"
                />
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">EWS (10% Additional)</label>
                <Input
                  type="number"
                  value={quotas.ews}
                  onChange={(e) => setQuotas({ ...quotas, ews: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white"
                />
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">PwD Sub-quota (5%)</label>
                <Input
                  type="number"
                  value={quotas.pwd || 0}
                  onChange={(e) => setQuotas({ ...quotas, pwd: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Supernumerary Allowances */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Supernumerary Scheme Allocations (Seats)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <label className="text-[10px] font-bold text-slate-600 block mb-1">TFW (5% Extra)</label>
                <Input
                  type="number"
                  value={supernum.tfw}
                  onChange={(e) => setSupernum({ ...supernum, tfw: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white"
                />
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <label className="text-[10px] font-bold text-slate-600 block mb-1">PMSSS (J&K)</label>
                <Input
                  type="number"
                  value={supernum.pmsss}
                  onChange={(e) => setSupernum({ ...supernum, pmsss: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white"
                />
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <label className="text-[10px] font-bold text-slate-600 block mb-1">NRI / OCI / FN</label>
                <Input
                  type="number"
                  value={supernum.nri_oci_fn}
                  onChange={(e) => setSupernum({ ...supernum, nri_oci_fn: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white"
                />
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <label className="text-[10px] font-bold text-slate-600 block mb-1">CIWG Quota</label>
                <Input
                  type="number"
                  value={supernum.ciwg || 15}
                  onChange={(e) => setSupernum({ ...supernum, ciwg: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Document Upload Zone */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Attach Statutory Approval Order / Gazette Proof Document
            </span>
            <div className="border-2 border-dashed border-slate-300 hover:border-gov-navy/50 rounded-xl p-5 text-center bg-slate-50/50 transition">
              <UploadCloud className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700">
                Upload Sanction Order / Approved Seat Matrix Document
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Supported formats: PDF, XLSX, CSV, JSON (AICTE Approval Letter or State Directorate Gazette)
              </p>
              <label className="mt-2.5 inline-block">
                <span className="px-3 py-1.5 bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold rounded-md cursor-pointer transition shadow-xs inline-flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Browse Sanction Document
                </span>
                <input
                  type="file"
                  accept=".pdf,.xlsx,.csv,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="seat-document-file-input"
                />
              </label>
              {uploadedFileName && (
                <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Document Selected: {uploadedFileName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Officer & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Authorizing Director / Officer</label>
              <Input
                type="text"
                value={authorizingDirector}
                onChange={(e) => setAuthorizingDirector(e.target.value)}
                className="h-8 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Approval Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full text-xs h-8 rounded-md border border-slate-300 bg-white px-2 font-medium"
              >
                <option value="AICTE Approval Process Letter (APH)">AICTE Approval Process Letter (APH)</option>
                <option value="State Gazette Sanctioned Seat Matrix">State Gazette Sanctioned Seat Matrix</option>
                <option value="Statutory University Affiliation Order">Statutory University Affiliation Order</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Approval Order Remarks / Statutory Basis</label>
              <Input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Sanctioned intake and quota matrix approved per statutory norms"
                className="h-8 text-xs bg-white"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Seat Matrix Document & Capacity Updated Successfully!</span>
              </div>
              <p>
                Sanctioned Intake for <strong>{successResult.name}</strong> confirmed at{' '}
                <strong>{successResult.approved_intake} seats</strong>.
              </p>
              <div className="text-[10px] font-mono text-slate-600 pt-1 border-t border-emerald-200 flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-400" />
                <span>Seal: {successResult.document_hash}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Document seal will be committed directly to AICTE cryptographic audit chain.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              data-testid="close-upload-seat-modal-btn"
              className="text-xs"
            >
              {successResult ? 'Done' : 'Cancel'}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleUploadSubmit}
              disabled={isSubmitting}
              data-testid="submit-seat-matrix-btn"
              className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold shadow-xs"
            >
              {isSubmitting ? 'Uploading & Sealing...' : 'Upload & Seal Seat Matrix'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
