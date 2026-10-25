import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ConsentPurposeSetting,
  ConsentHistoryRecord,
  ConsentPurpose,
  UserTypeConsentSetting,
  VerifierUserType,
  StudentDocumentType,
} from '../types';
import { API_BASE_URL, authFetch } from '@/lib/api';
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  History,
  HelpCircle,
  Briefcase,
  GraduationCap,
  Landmark,
  Building2,
  Globe,
  Eye,
  EyeOff,
  CheckCircle2,
  SlidersHorizontal,
  X,
  FileCheck,
  Users,
} from 'lucide-react';

interface ConsentManagementCardProps {
  purposes: ConsentPurposeSetting[];
  userConsents?: UserTypeConsentSetting[];
  history: ConsentHistoryRecord[];
  onConsentUpdated: (msg?: string) => void;
}

const DOCUMENT_OPTIONS: Array<{ key: StudentDocumentType; label: string; label_hi: string }> = [
  { key: 'ENROLMENT_CREDENTIAL', label: 'Admission & Enrolment Credential', label_hi: 'प्रवेश एवं नामांकन प्रमाणपत्र' },
  { key: 'DEGREE_CERTIFICATE', label: 'Degree / Graduation Certificate', label_hi: 'डिग्री / स्नातक प्रमाणपत्र' },
  { key: 'MARKSHEET_TRANSCRIPT', label: 'Academic Marksheets & Transcripts', label_hi: 'शैक्षणिक अंकसूची एवं ट्रांसक्रिप्ट' },
  { key: 'CATEGORY_PROOF', label: 'Statutory Quota / Category Proof', label_hi: 'सांविधिक कोटा / श्रेणी प्रमाण' },
  { key: 'BONAFIDE_ID', label: 'Bonafide Student Identity Card', label_hi: 'बोनाफाइड छात्र पहचान पत्र' },
];

const getUserTypeIcon = (type: VerifierUserType) => {
  switch (type) {
    case 'EMPLOYER':
      return <Briefcase className="w-4 h-4 text-blue-600" />;
    case 'HIGHER_ED':
      return <GraduationCap className="w-4 h-4 text-purple-600" />;
    case 'GOVERNMENT':
      return <Landmark className="w-4 h-4 text-amber-600" />;
    case 'FINANCIAL':
      return <Building2 className="w-4 h-4 text-emerald-600" />;
    case 'REGULATORY':
      return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
    case 'PUBLIC':
    default:
      return <Globe className="w-4 h-4 text-slate-600" />;
  }
};

export const ConsentManagementCard: React.FC<ConsentManagementCardProps> = ({
  purposes,
  userConsents = [],
  history,
  onConsentUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'USER_TYPES' | 'STATUTORY_PURPOSES'>('ALL');
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmWithdrawPurpose, setConfirmWithdrawPurpose] = useState<ConsentPurposeSetting | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // User-Type Scope Configuration Modal State
  const [configuringConsent, setConfiguringConsent] = useState<UserTypeConsentSetting | null>(null);
  const [editCanView, setEditCanView] = useState<boolean>(true);
  const [editCanVerify, setEditCanVerify] = useState<boolean>(true);
  const [editDocs, setEditDocs] = useState<StudentDocumentType[]>([]);
  const [editDisclosureLevel, setEditDisclosureLevel] = useState<'MINIMAL' | 'ACADEMIC' | 'FULL'>('ACADEMIC');
  const [editValidity, setEditValidity] = useState<'INDEFINITE' | '30_DAYS' | '90_DAYS' | 'ACADEMIC_YEAR'>('INDEFINITE');

  // Toggle Statutory DPDP Consent
  const handleToggleConsent = async (purposeSetting: ConsentPurposeSetting) => {
    if (purposeSetting.is_granted && purposeSetting.purpose === 'VERIFICATION_SHARE') {
      setConfirmWithdrawPurpose(purposeSetting);
      return;
    }
    await executeConsentChange(purposeSetting.purpose, purposeSetting.is_granted ? 'WITHDRAWN' : 'GRANTED');
  };

  const executeConsentChange = async (purpose: ConsentPurpose, action: 'GRANTED' | 'WITHDRAWN') => {
    setUpdating(purpose);
    try {
      const res = await authFetch(`${API_BASE_URL}/v1/students/me/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose,
          action,
          notes: action === 'WITHDRAWN' ? 'Withdrawn by student from wallet UI' : 'Granted by student',
        }),
      });
      if (res.ok) {
        const msg =
          action === 'WITHDRAWN' && purpose === 'VERIFICATION_SHARE'
            ? 'VERIFICATION_SHARE consent withdrawn. Credentials have been suspended on the AICTE status list.'
            : `Consent for ${purpose} set to ${action}.`;
        onConsentUpdated(msg);
      }
    } catch (err) {
      console.error('Consent update error:', err);
    } finally {
      setUpdating(null);
      setConfirmWithdrawPurpose(null);
    }
  };

  // Toggle User-Type Consent Quick Action
  const handleToggleUserTypeConsent = async (item: UserTypeConsentSetting) => {
    setUpdating(item.user_type);
    const newGranted = !item.is_granted;
    try {
      const res = await authFetch(`${API_BASE_URL}/v1/students/me/user-consents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_type: item.user_type,
          is_granted: newGranted,
          can_view: newGranted ? (item.can_view || true) : false,
          can_verify: newGranted ? (item.can_verify || true) : false,
          notes: newGranted ? `Granted access for ${item.title}` : `Revoked access for ${item.title}`,
        }),
      });
      if (res.ok) {
        onConsentUpdated(`Consent for ${item.title} set to ${newGranted ? 'GRANTED' : 'WITHDRAWN'}.`);
      }
    } catch (err) {
      console.error('User type consent update error:', err);
    } finally {
      setUpdating(null);
    }
  };

  // Open Scope Configuration Modal
  const openConfigModal = (item: UserTypeConsentSetting) => {
    setConfiguringConsent(item);
    setEditCanView(item.can_view);
    setEditCanVerify(item.can_verify);
    setEditDocs([...item.allowed_documents]);
    setEditDisclosureLevel(item.data_disclosure_level);
    setEditValidity(item.validity);
  };

  const handleSaveScopeConfig = async () => {
    if (!configuringConsent) return;
    setUpdating(configuringConsent.user_type);
    try {
      const res = await authFetch(`${API_BASE_URL}/v1/students/me/user-consents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_type: configuringConsent.user_type,
          is_granted: editCanView || editCanVerify,
          can_view: editCanView,
          can_verify: editCanVerify,
          allowed_documents: editDocs,
          data_disclosure_level: editDisclosureLevel,
          validity: editValidity,
          notes: `Configured document access scope for ${configuringConsent.title}`,
        }),
      });
      if (res.ok) {
        onConsentUpdated(`Updated permissions and document scope for ${configuringConsent.title}.`);
        setConfiguringConsent(null);
      }
    } catch (err) {
      console.error('Scope save error:', err);
    } finally {
      setUpdating(null);
    }
  };

  const toggleDocPermission = (docKey: StudentDocumentType) => {
    setEditDocs((prev) =>
      prev.includes(docKey) ? prev.filter((d) => d !== docKey) : [...prev, docKey]
    );
  };

  const grantedRolesCount = userConsents.filter((c) => c.is_granted).length;

  return (
    <Card className="border-slate-200 bg-white shadow-xs" data-testid="consent-management-card">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-gov-navy">
              Statutory Consent & Purpose Governance
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Purpose-bound granular consent per Section 8.4 • DPDP Act 2023 Conforming
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 font-semibold rounded-md transition-all ${
                activeTab === 'ALL'
                  ? 'bg-white text-gov-navy shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              data-testid="tab-all-consents"
            >
              All Controls
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('USER_TYPES')}
              className={`px-3 py-1 font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'USER_TYPES'
                  ? 'bg-white text-gov-navy shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              data-testid="tab-user-consents"
            >
              <Users className="w-3.5 h-3.5 text-gov-navy" />
              <span>User Types & Verifiers</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
                {grantedRolesCount}/{userConsents.length || 6}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('STATUTORY_PURPOSES')}
              className={`px-3 py-1 font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'STATUTORY_PURPOSES'
                  ? 'bg-white text-gov-navy shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              data-testid="tab-statutory-purposes"
            >
              <Lock className="w-3.5 h-3.5 text-gov-saffron" />
              <span>Statutory DPDP Mandates</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs h-8 border-slate-300 text-slate-700 hover:bg-slate-50"
            data-testid="toggle-consent-history-btn"
          >
            <History className="w-3.5 h-3.5 mr-1.5 text-gov-navy" />
            <span>Consent History ({history.length})</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-6">
        {/* TAB 1: User Types & Verifiers (Granular document viewing & verification consent) */}
        {(activeTab === 'ALL' || activeTab === 'USER_TYPES') && (
          <div className="space-y-4 animate-in fade-in" data-testid="user-type-consents-section">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start justify-between gap-3 text-xs text-blue-900">
              <div className="flex items-start gap-2">
                <FileCheck className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">Granular Document Viewing & Verification Access:</span>{' '}
                  Control which external entities (employers, universities, scholarship desks, banks) are authorized to see and verify your specific academic documents and credentials.
                </div>
              </div>
              <span className="shrink-0 text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                DPDP Act §8.4 Conforming
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userConsents.map((item) => {
                const isGranted = item.is_granted;
                return (
                  <div
                    key={item.user_type}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isGranted
                        ? 'border-green-200 bg-green-50/20'
                        : 'border-slate-200 bg-slate-50/40 opacity-90'
                    }`}
                    data-testid={`user-type-card-${item.user_type}`}
                  >
                    <div className="space-y-2.5">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                            {getUserTypeIcon(item.user_type)}
                          </div>
                          <div>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              {item.user_type}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {item.title_hi}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isGranted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                          data-testid={`user-type-status-${item.user_type}`}
                        >
                          {isGranted ? 'GRANTED' : 'WITHDRAWN'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Permissions Flags: View & Verify */}
                      <div className="flex items-center gap-2 text-[11px]">
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${
                            item.can_view
                              ? 'bg-blue-50 border-blue-200 text-blue-800'
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                        >
                          {item.can_view ? <Eye className="w-3 h-3 text-blue-700" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                          {item.can_view ? 'View: Allowed' : 'View: Restricted'}
                        </span>

                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${
                            item.can_verify
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                        >
                          {item.can_verify ? <CheckCircle2 className="w-3 h-3 text-emerald-700" /> : <X className="w-3 h-3 text-slate-400" />}
                          {item.can_verify ? 'Verify: Allowed' : 'Verify: Blocked'}
                        </span>
                      </div>

                      {/* Permitted Documents tags */}
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                          <span>Permitted Documents:</span>
                          <span className="text-[10px] font-normal text-slate-500">
                            {item.allowed_documents.length} of 5
                          </span>
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {item.allowed_documents.map((docKey) => {
                            const opt = DOCUMENT_OPTIONS.find((d) => d.key === docKey);
                            return (
                              <span
                                key={docKey}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60"
                              >
                                {opt ? opt.label.split(' ')[0] : docKey}
                              </span>
                            );
                          })}
                          {item.allowed_documents.length === 0 && (
                            <span className="text-[10px] text-red-600 italic">
                              No documents permitted
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badges: Level & Validity */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Disclosure: <strong className="text-slate-700 font-mono">{item.data_disclosure_level}</strong></span>
                        <span>Validity: <strong className="text-slate-700 font-mono">{item.validity}</strong></span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openConfigModal(item)}
                        className="text-xs h-8 border-slate-300 text-slate-700 hover:bg-slate-50 flex-1 font-semibold"
                        data-testid={`user-type-config-${item.user_type}`}
                      >
                        <SlidersHorizontal className="w-3 h-3 mr-1 text-gov-navy" />
                        Configure Scope
                      </Button>

                      <Button
                        size="sm"
                        variant={isGranted ? 'outline' : 'default'}
                        disabled={updating === item.user_type}
                        onClick={() => handleToggleUserTypeConsent(item)}
                        className={`text-xs h-8 font-semibold ${
                          isGranted
                            ? 'border-amber-300 text-amber-900 hover:bg-amber-100/60'
                            : 'bg-green-700 hover:bg-green-800 text-white'
                        }`}
                        data-testid={`user-type-toggle-${item.user_type}`}
                      >
                        {updating === item.user_type
                          ? 'Updating...'
                          : isGranted
                          ? 'Withdraw'
                          : 'Grant'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Statutory DPDP Mandates */}
        {(activeTab === 'ALL' || activeTab === 'STATUTORY_PURPOSES') && (
          <div className="space-y-3 animate-in fade-in" data-testid="statutory-purposes-section">
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-gov-saffron" />
                <span>Statutory DPDP Purpose Mandates (Section 8.4)</span>
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {purposes.map((p) => {
              const isVerificationShare = p.purpose === 'VERIFICATION_SHARE';
              const isRepository = p.purpose === 'REPOSITORY';

              return (
                <div
                  key={p.purpose}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    p.is_granted
                      ? isVerificationShare
                        ? 'border-green-200 bg-green-50/30'
                        : 'border-slate-200 bg-slate-50/50'
                      : 'border-amber-300 bg-amber-50/40'
                  }`}
                  data-testid={`consent-card-${p.purpose}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                            {p.purpose}
                          </span>
                          {isRepository && (
                            <span className="text-[10px] text-gov-navy font-bold flex items-center gap-0.5">
                              <Lock className="w-3 h-3 text-gov-navy" /> Statutory
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{p.title}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">{p.title_hi}</p>
                      </div>

                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          p.is_granted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                        data-testid={`consent-status-${p.purpose}`}
                      >
                        {p.is_granted ? 'GRANTED' : 'WITHDRAWN'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-[11px] space-y-1">
                      <span className="font-bold text-slate-700 block flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-gov-saffron" />
                        Legal & Technical Consequences:
                      </span>
                      <p className="text-slate-600 leading-snug">{p.consequences}</p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between">
                    {p.can_toggle ? (
                      <Button
                        size="sm"
                        variant={p.is_granted ? 'outline' : 'default'}
                        disabled={updating === p.purpose}
                        onClick={() => handleToggleConsent(p)}
                        className={`w-full text-xs font-semibold h-8 ${
                          p.is_granted
                            ? 'border-amber-300 text-amber-900 hover:bg-amber-100/60'
                            : 'bg-green-700 hover:bg-green-800 text-white'
                        }`}
                        data-testid={`consent-toggle-${p.purpose}`}
                      >
                        {updating === p.purpose
                          ? 'Updating...'
                          : p.is_granted
                          ? 'Withdraw Consent'
                          : 'Grant Consent'}
                      </Button>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic w-full text-center">
                        Statutory requirement (Section 8.4)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {/* User-Type Scope Configuration Modal */}
        {configuringConsent && (
          <div
            role="dialog"
            aria-labelledby="scope-modal-title"
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
            data-testid="user-type-config-modal"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-4 border-gov-navy space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                    {getUserTypeIcon(configuringConsent.user_type)}
                  </div>
                  <div>
                    <h3 id="scope-modal-title" className="text-base font-bold text-slate-900">
                      Configure Access Scope: {configuringConsent.title}
                    </h3>
                    <p className="text-xs text-slate-500">{configuringConsent.category_label}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfiguringConsent(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* View & Verify Controls */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Permissions & Capabilities
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCanView}
                      onChange={(e) => setEditCanView(e.target.checked)}
                      className="rounded text-gov-navy focus:ring-gov-navy w-4 h-4"
                      data-testid="scope-toggle-view"
                    />
                    <div className="text-xs">
                      <span className="font-semibold block text-slate-800">Can View</span>
                      <span className="text-[10px] text-slate-500">Read claims & data</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCanVerify}
                      onChange={(e) => setEditCanVerify(e.target.checked)}
                      className="rounded text-gov-navy focus:ring-gov-navy w-4 h-4"
                      data-testid="scope-toggle-verify"
                    />
                    <div className="text-xs">
                      <span className="font-semibold block text-slate-800">Can Verify</span>
                      <span className="text-[10px] text-slate-500">Validate signatures</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Permitted Documents Selection */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Allowed Document Credentials ({editDocs.length} selected)
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {DOCUMENT_OPTIONS.map((doc) => {
                    const isChecked = editDocs.includes(doc.key);
                    return (
                      <label
                        key={doc.key}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-50/60 border-blue-300 text-blue-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleDocPermission(doc.key)}
                            className="rounded text-gov-navy focus:ring-gov-navy w-4 h-4"
                            data-testid={`scope-doc-${doc.key}`}
                          />
                          <div>
                            <span className="block font-semibold">{doc.label}</span>
                            <span className="text-[10px] text-slate-500">{doc.label_hi}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{doc.key.split('_')[0]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Disclosure Level & Validity */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Disclosure Level</label>
                  <select
                    value={editDisclosureLevel}
                    onChange={(e) => setEditDisclosureLevel(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white"
                    data-testid="scope-select-disclosure"
                  >
                    <option value="MINIMAL">MINIMAL (Name & Status Only)</option>
                    <option value="ACADEMIC">ACADEMIC (Program, Institute & CGPA)</option>
                    <option value="FULL">FULL (Full Record & Verification)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Consent Validity</label>
                  <select
                    value={editValidity}
                    onChange={(e) => setEditValidity(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white"
                    data-testid="scope-select-validity"
                  >
                    <option value="INDEFINITE">INDEFINITE (Until Revoked)</option>
                    <option value="30_DAYS">30 Days Access</option>
                    <option value="90_DAYS">90 Days Access</option>
                    <option value="ACADEMIC_YEAR">Current Academic Year (2026-27)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfiguringConsent(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveScopeConfig}
                  disabled={updating === configuringConsent.user_type}
                  className="text-xs bg-gov-navy hover:bg-gov-navy/90 text-white font-semibold"
                  data-testid="save-scope-config-btn"
                >
                  {updating === configuringConsent.user_type ? 'Saving...' : 'Save Consent Scope'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Consequence Confirmation Modal */}
        {confirmWithdrawPurpose && (
          <div
            role="dialog"
            aria-labelledby="withdraw-modal-title"
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
            data-testid="withdraw-confirmation-modal"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-t-4 border-amber-500 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-amber-100 text-amber-700 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 id="withdraw-modal-title" className="text-base font-bold text-slate-900">
                    Withdraw Verification Consent?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Withdrawing {confirmWithdrawPurpose.purpose} has immediate statutory effects
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-2">
                <p className="font-semibold">
                  {confirmWithdrawPurpose.warning_on_withdraw}
                </p>
                <p className="text-[11px] text-amber-800">
                  Per Section 8.4: Withdrawing VERIFICATION_SHARE suspends credentials (status list suspension bit set). Third-party verification will return &quot;Holder has withdrawn consent&quot; without revealing any data.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmWithdrawPurpose(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => executeConsentChange('VERIFICATION_SHARE', 'WITHDRAWN')}
                  className="text-xs bg-amber-700 hover:bg-amber-800 text-white"
                  data-testid="confirm-withdraw-consent-btn"
                >
                  Confirm & Suspend Credentials
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Expandable Consent History Log */}
        {showHistory && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-in fade-in" data-testid="consent-history-panel">
            <h4 className="text-xs font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-gov-saffron" />
              <span>Consent Ledger Audit Trail</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-2 font-semibold">Timestamp</th>
                    <th className="p-2 font-semibold">Purpose / Role</th>
                    <th className="p-2 font-semibold">Action</th>
                    <th className="p-2 font-semibold">Actor</th>
                    <th className="p-2 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="p-2 font-mono text-[11px] text-slate-600">
                        {new Date(h.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2 font-mono font-bold text-slate-800">{h.purpose}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            h.action === 'GRANTED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {h.action}
                        </span>
                      </td>
                      <td className="p-2 text-slate-700">{h.actor}</td>
                      <td className="p-2 text-slate-500 italic max-w-xs truncate">{h.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
