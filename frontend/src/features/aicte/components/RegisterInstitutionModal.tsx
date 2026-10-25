import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/lib/api';
import { InstitutionSeatMatrixRecord, QuotaAllocation, SupernumeraryAllocation } from '../types';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  UploadCloud,
  Hash,
  Sparkles,
  Info,
} from 'lucide-react';

interface RegisterInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newInst: InstitutionSeatMatrixRecord) => void;
}

const INDIAN_STATES = [
  { code: '07', name: 'Delhi', district: 'Central Delhi', distCode: '101' },
  { code: '27', name: 'Maharashtra', district: 'Mumbai City', distCode: '104' },
  { code: '29', name: 'Karnataka', district: 'Bengaluru Urban', distCode: '108' },
  { code: '33', name: 'Tamil Nadu', district: 'Chennai', distCode: '111' },
  { code: '09', name: 'Uttar Pradesh', district: 'Lucknow', distCode: '114' },
  { code: '28', name: 'Andhra Pradesh', district: 'Visakhapatnam', distCode: '118' },
  { code: '36', name: 'Telangana', district: 'Hyderabad', distCode: '121' },
  { code: '19', name: 'West Bengal', district: 'Kolkata', distCode: '125' },
  { code: '24', name: 'Gujarat', district: 'Ahmedabad', distCode: '129' },
  { code: '08', name: 'Rajasthan', district: 'Jaipur', distCode: '133' },
];

export const RegisterInstitutionModal: React.FC<RegisterInstitutionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [instName, setInstName] = useState<string>('');
  const [aicteId, setAicteId] = useState<string>(`1-${Math.floor(100010050 + Math.random() * 400)}`);
  const [selectedStateCode, setSelectedStateCode] = useState<string>('27');
  const [districtName, setDistrictName] = useState<string>('Pune');
  const [districtCode, setDistrictCode] = useState<string>('105');
  const [instType, setInstType] = useState<string>('ENGINEERING');
  const [dabId, setDabId] = useState<string>('DAB-102');
  const [aisheCode, setAisheCode] = useState<string>(`C-${Math.floor(10000 + Math.random() * 89999)}`);
  const [onboardingLevel, setOnboardingLevel] = useState<'FULL' | 'AGGREGATE_ONLY'>('FULL');

  // Intake & Quotas
  const [approvedIntake, setApprovedIntake] = useState<number>(360);
  const [academicYear, setAcademicYear] = useState<string>('2026-27');
  const [approvalOrderRef, setApprovalOrderRef] = useState<string>(
    `F.No. AICTE/AB/2026/APH-REG-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [authorizingDirector, setAuthorizingDirector] = useState<string>(
    'Dr. T.G. Sitharam, Chairman AICTE'
  );
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const [quotas, setQuotas] = useState<QuotaAllocation>({
    gen: 180,
    obc: 97,
    sc: 54,
    st: 27,
    ews: 36,
    pwd: 18,
  });

  const [supernum, setSupernum] = useState<SupernumeraryAllocation>({
    tfw: 18,
    pmsss: 10,
    nri_oci_fn: 54,
    ciwg: 15,
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredResult, setRegisteredResult] = useState<InstitutionSeatMatrixRecord | null>(null);

  if (!isOpen) return null;

  const handleStateChange = (code: string) => {
    setSelectedStateCode(code);
    const found = INDIAN_STATES.find((s) => s.code === code);
    if (found) {
      setDistrictName(found.district);
      setDistrictCode(found.distCode);
    }
  };

  const handleIntakeChange = (val: number) => {
    setApprovedIntake(val);
    setQuotas({
      gen: Math.round(val * 0.5),
      obc: Math.round(val * 0.27),
      sc: Math.round(val * 0.15),
      st: Math.round(val * 0.075),
      ews: Math.round(val * 0.1),
      pwd: Math.round(val * 0.05),
    });
    setSupernum({
      tfw: Math.round(val * 0.05),
      pmsss: 10,
      nri_oci_fn: Math.round(val * 0.15),
      ciwg: 15,
    });
  };

  const handleQuickFillSample = () => {
    setInstName('Indian Institute of Information Technology Pune (IIIT Pune)');
    setAicteId('1-100010048');
    setSelectedStateCode('27');
    setDistrictName('Pune');
    setDistrictCode('105');
    setInstType('ENGINEERING');
    setDabId('DAB-102');
    setAisheCode('C-49219');
    handleIntakeChange(420);
    setApprovalOrderRef('F.No. AICTE/WR/2026/APH-IIITP-420');
    setUploadedFileName('IIITP_AICTE_Sanction_Order_2026.pdf');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setErrorMessage(null);
  };

  const handleRegister = async () => {
    if (!instName.trim()) {
      setErrorMessage('Please enter the full legal name of the institution.');
      return;
    }
    if (!aicteId.trim()) {
      setErrorMessage('Please provide a valid AICTE Permanent ID.');
      return;
    }
    if (approvedIntake <= 0) {
      setErrorMessage('Sanctioned seat capacity must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const stateObj = INDIAN_STATES.find((s) => s.code === selectedStateCode);

    const payload = {
      institution_aicte_id: aicteId.trim(),
      name: instName.trim(),
      state_code: selectedStateCode,
      state_name: stateObj ? stateObj.name : 'State',
      district_code: districtCode,
      district_name: districtName,
      type: instType,
      affiliated_dab_id: dabId,
      onboarding_level: onboardingLevel,
      did: `did:web:${aicteId.toLowerCase().replace(/[^a-z0-9]/g, '')}.eduverify.ac.in`,
      aishe_code: aisheCode,
      approved_intake: approvedIntake,
      academic_year: academicYear,
      quotas,
      supernumerary: supernum,
      approval_order_ref: approvalOrderRef,
      document_name: uploadedFileName || `Sanction_Order_${aicteId}_2026.pdf`,
      document_type: 'AICTE_APPROVAL_LETTER',
      authorizing_director: authorizingDirector,
      source_authority: 'AICTE Approval Process Handbook (APH) 2026-27',
    };

    try {
      const res = await fetch(`${API_BASE_URL}/v1/admin/institutions/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Registration failed with status: ' + res.status);
      }

      const data = await res.json();
      setRegisteredResult(data.institution);
      onSuccess(data.institution);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error registering institution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reg-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      data-testid="register-institution-modal"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gov-navy text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="reg-modal-title" className="text-base font-bold text-gov-navy">
                  Register Educational Institution & Sanctioned Seat Matrix
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Apex Registration
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Register institution master profile with sanctioned seat capacity, category quota caps, and statutory approval letter.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleQuickFillSample}
              data-testid="quick-fill-sample-btn"
              className="text-[11px] h-7 gap-1 font-semibold text-amber-800 bg-amber-50 border-amber-300 hover:bg-amber-100"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              Quick-Fill Sample Institution
            </Button>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
          {/* Section 1: Institution Details */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              1. Institutional Identity & Accreditation
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Institution Full Legal Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  placeholder="e.g. Veermata Jijabai Technological Institute (VJTI)"
                  data-testid="reg-inst-name-input"
                  className="h-8 text-xs bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  AICTE Permanent ID <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={aicteId}
                  onChange={(e) => setAicteId(e.target.value)}
                  placeholder="e.g. 1-100010045"
                  data-testid="reg-inst-id-input"
                  className="h-8 text-xs bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  State Jurisdiction <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedStateCode}
                  onChange={(e) => handleStateChange(e.target.value)}
                  data-testid="reg-inst-state-select"
                  className="w-full text-xs h-8 rounded-md border border-slate-300 bg-white px-2.5 font-medium"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} (LGD Code: {s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">District Name</label>
                <Input
                  type="text"
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Institution Discipline / Type</label>
                <select
                  value={instType}
                  onChange={(e) => setInstType(e.target.value)}
                  data-testid="reg-inst-type-select"
                  className="w-full text-xs h-8 rounded-md border border-slate-300 bg-white px-2.5 font-medium"
                >
                  <option value="ENGINEERING">ENGINEERING & TECHNOLOGY</option>
                  <option value="MANAGEMENT">MANAGEMENT (MBA/PGDM)</option>
                  <option value="PHARMACY">PHARMACY</option>
                  <option value="ARCHITECTURE">ARCHITECTURE & PLANNING</option>
                  <option value="POLYTECHNIC">POLYTECHNIC DIPLOMA</option>
                  <option value="APPLIED_ARTS">APPLIED ARTS & CRAFTS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Affiliated Degree Awarding Body (DAB)</label>
                <select
                  value={dabId}
                  onChange={(e) => setDabId(e.target.value)}
                  className="w-full text-xs h-8 rounded-md border border-slate-300 bg-white px-2.5 font-medium"
                >
                  <option value="DAB-101">DAB-101 (University of Delhi)</option>
                  <option value="DAB-102">DAB-102 (University of Mumbai)</option>
                  <option value="DAB-103">DAB-103 (Visvesvaraya Technological University)</option>
                  <option value="DAB-104">DAB-104 (Anna University Chennai)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">AISHE National Registry Code</label>
                <Input
                  type="text"
                  value={aisheCode}
                  onChange={(e) => setAisheCode(e.target.value)}
                  placeholder="e.g. C-33821"
                  className="h-8 text-xs bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Seat Capacity & Quotas */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              2. Approved Seat Capacity (Intake) & Quota Distribution
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Sanctioned Intake Capacity <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={approvedIntake}
                  onChange={(e) => handleIntakeChange(Number(e.target.value) || 0)}
                  data-testid="reg-seat-capacity-input"
                  className="h-8 text-xs bg-white font-bold text-gov-navy"
                  min={1}
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
                <label className="block font-bold text-slate-700 mb-1">Onboarding Mode</label>
                <select
                  value={onboardingLevel}
                  onChange={(e) => setOnboardingLevel(e.target.value as any)}
                  className="w-full text-xs h-8 rounded-md border border-slate-300 bg-white px-2.5 font-medium"
                >
                  <option value="FULL">FULL (Individual Student APAAR Level)</option>
                  <option value="AGGREGATE_ONLY">AGGREGATE_ONLY (Statistical Mode)</option>
                </select>
              </div>
            </div>

            {/* Category breakdown inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 block">GEN (Open - 50%)</span>
                <Input
                  type="number"
                  value={quotas.gen}
                  onChange={(e) => setQuotas({ ...quotas, gen: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white mt-1"
                />
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 block">OBC-NCL (27%)</span>
                <Input
                  type="number"
                  value={quotas.obc}
                  onChange={(e) => setQuotas({ ...quotas, obc: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white mt-1"
                />
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 block">SC (15%)</span>
                <Input
                  type="number"
                  value={quotas.sc}
                  onChange={(e) => setQuotas({ ...quotas, sc: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white mt-1"
                />
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 block">ST (7.5%)</span>
                <Input
                  type="number"
                  value={quotas.st}
                  onChange={(e) => setQuotas({ ...quotas, st: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white mt-1"
                />
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 block">EWS (10% Extra)</span>
                <Input
                  type="number"
                  value={quotas.ews}
                  onChange={(e) => setQuotas({ ...quotas, ews: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white mt-1"
                />
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 block">PwD Sub-quota</span>
                <Input
                  type="number"
                  value={quotas.pwd || 0}
                  onChange={(e) => setQuotas({ ...quotas, pwd: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Statutory Document Attachment */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              3. Attach Official Sanction Order / Seat Matrix Document
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Approval Gazette / Order Reference <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={approvalOrderRef}
                  onChange={(e) => setApprovalOrderRef(e.target.value)}
                  data-testid="reg-approval-ref-input"
                  className="h-8 text-xs bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Authorizing Director / Certifier</label>
                <Input
                  type="text"
                  value={authorizingDirector}
                  onChange={(e) => setAuthorizingDirector(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>

            {/* Document File Uploader */}
            <div className="border-2 border-dashed border-slate-300 hover:border-gov-navy/50 rounded-xl p-4 text-center bg-slate-50/50 transition">
              <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-700">Attach Sanctioned Seat Matrix Document</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Upload Official AICTE Approval Letter or State Gazette PDF/CSV</p>
              <label className="mt-2 inline-block">
                <span className="px-3 py-1.5 bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold rounded-md cursor-pointer transition shadow-xs inline-flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Select Sanction File
                </span>
                <input
                  type="file"
                  accept=".pdf,.xlsx,.csv,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="reg-document-input"
                />
              </label>
              {uploadedFileName && (
                <div className="mt-1.5 text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Document Attached: {uploadedFileName}</span>
                </div>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {registeredResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Institution Registered Successfully!</span>
              </div>
              <p>
                <strong>{registeredResult.name}</strong> registered with Sanctioned Intake of{' '}
                <strong>{registeredResult.approved_intake} seats</strong>.
              </p>
              <div className="text-[10px] font-mono text-slate-600 pt-1 border-t border-emerald-200 flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-400" />
                <span>Seal: {registeredResult.document_hash}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Registers permanent record into AICTE Central Repository.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              data-testid="close-reg-modal-btn"
              className="text-xs"
            >
              {registeredResult ? 'Done' : 'Cancel'}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleRegister}
              disabled={isSubmitting}
              data-testid="submit-register-institution-btn"
              className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold shadow-xs"
            >
              {isSubmitting ? 'Registering...' : 'Register Institution & Quotas'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
