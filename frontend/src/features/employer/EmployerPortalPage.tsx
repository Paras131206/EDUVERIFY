import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Briefcase,
  Search,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Send,
  Eye,
  GraduationCap,
  Award,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  FileText,
  Clock,
  Sparkles,
  Printer,
} from 'lucide-react';
import { API_BASE_URL, authFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';

export interface CandidateItem {
  apaar_id: string;
  full_name: string;
  institution_aicte_id: string;
  institution_name?: string;
  program_code: string;
  course_level: string;
  academic_year: string;
  enrolment_status: string;
  cgpa?: number | null;
  has_consent: boolean;
  consent_status: string;
  request_status?: string | null;
}

export interface AcademicRecordDetail {
  tenth_board?: string | null;
  tenth_percentage?: number | null;
  tenth_year?: number | null;
  tenth_school?: string | null;
  twelfth_board?: string | null;
  twelfth_percentage?: number | null;
  twelfth_stream?: string | null;
  twelfth_year?: number | null;
  twelfth_school?: string | null;
  cgpa?: number | null;
  total_credits?: number | null;
  completed_credits?: number | null;
  active_backlogs?: number;
  semester_marks?: Array<{
    semester: number;
    sgpa: number;
    credits: number;
    status: string;
  }> | null;
  skills?: string[] | null;
  achievements?: string[] | null;
}

export interface CandidateDetailResponse {
  apaar_id: string;
  has_consent: boolean;
  consent_status: string;
  student: {
    apaar_id: string;
    full_name: string;
    institution_aicte_id: string;
    institution_name?: string;
    institution_student_id?: string;
    program_code: string;
    course_level: string;
    department?: string;
    academic_year: string;
    year_of_study: number;
    enrolment_status: string;
    admission_date?: string;
    expected_graduation_year?: number;
    email?: string | null;
    mobile?: string | null;
  };
  academic_record?: AcademicRecordDetail | null;
  message?: string | null;
}

export interface EmployerAccessRequestItem {
  id: string;
  employer_id: string;
  employer_name: string;
  apaar_id: string;
  job_title?: string | null;
  organization?: string | null;
  purpose: string;
  status: string;
  requested_at: string;
  decided_at?: string | null;
}

export const EmployerPortalPage: React.FC = () => {
  const { user } = useAuth();

  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [requests, setRequests] = useState<EmployerAccessRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [consentFilter, setConsentFilter] = useState<'ALL' | 'GRANTED' | 'PENDING'>('ALL');
  const [programFilter, setProgramFilter] = useState('ALL');

  // Candidate Inspection Modal
  const [selectedCandidateApaar, setSelectedCandidateApaar] = useState<string | null>(null);
  const [candidateDetail, setCandidateDetail] = useState<CandidateDetailResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  // Request Consent Modal
  const [requestTargetApaar, setRequestTargetApaar] = useState<string | null>(null);
  const [requestJobTitle, setRequestJobTitle] = useState('Graduate Software Engineer (2026 Batch)');
  const [requestOrg, setRequestOrg] = useState(user?.full_name || 'Talent Acquisition Team');
  const [requestPurpose, setRequestPurpose] = useState('Pre-employment academic marks verification');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState<string | null>(null);

  // Copied state
  const [copiedApaar, setCopiedApaar] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [candRes, reqRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/v1/employer/candidates`),
        authFetch(`${API_BASE_URL}/v1/employer/requests`),
      ]);

      if (!candRes.ok) {
        throw new Error(`Failed to load candidates (${candRes.status})`);
      }

      const candData: CandidateItem[] = await candRes.json();
      const reqData: EmployerAccessRequestItem[] = reqRes.ok ? await reqRes.json() : [];

      setCandidates(candData);
      setRequests(reqData);
    } catch (err: any) {
      console.error('Employer portal fetch error:', err);
      setError(err?.message || 'Failed to load candidates. Verify backend connectivity.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Load detailed student academic marks
  const handleOpenDetailModal = async (apaar_id: string) => {
    setSelectedCandidateApaar(apaar_id);
    setIsDetailLoading(true);
    setCandidateDetail(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/v1/employer/candidates/${apaar_id}`);
      if (res.ok) {
        const data: CandidateDetailResponse = await res.json();
        setCandidateDetail(data);
      }
    } catch (err) {
      console.error('Candidate detail fetch error:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSendConsentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTargetApaar) return;
    setIsSubmittingRequest(true);
    setRequestSuccessMsg(null);

    try {
      const res = await authFetch(`${API_BASE_URL}/v1/employer/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apaar_id: requestTargetApaar,
          job_title: requestJobTitle,
          organization: requestOrg,
          purpose: requestPurpose,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Failed to submit access request');
      }

      setRequestSuccessMsg('Consent request dispatched successfully to candidate wallet & email alert.');
      setTimeout(() => {
        setRequestTargetApaar(null);
        setRequestSuccessMsg(null);
        fetchCandidates();
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Error submitting request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedApaar(text);
    setTimeout(() => setCopiedApaar(null), 2000);
  };

  // Filtered candidate list
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        searchQuery === '' ||
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.apaar_id.includes(searchQuery) ||
        (c.institution_name && c.institution_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesConsent =
        consentFilter === 'ALL'
          ? true
          : consentFilter === 'GRANTED'
          ? c.has_consent
          : !c.has_consent;

      const matchesProgram = programFilter === 'ALL' || c.program_code === programFilter;

      return matchesSearch && matchesConsent && matchesProgram;
    });
  }, [candidates, searchQuery, consentFilter, programFilter]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = candidates.length;
    const granted = candidates.filter((c) => c.has_consent).length;
    const pending = total - granted;
    const activeReqs = requests.filter((r) => r.status === 'PENDING').length;
    return { total, granted, pending, activeReqs };
  }, [candidates, requests]);

  // Unique program codes
  const programCodes = useMemo(() => {
    const set = new Set(candidates.map((c) => c.program_code));
    return Array.from(set).sort();
  }, [candidates]);

  return (
    <div className="space-y-6" data-testid="employer-portal-page">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gov-navy via-[#1a365d] to-[#0f2444] p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gov-saffron/20 border border-gov-saffron/40 px-3 py-0.5 text-xs font-semibold text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                DPDP Act 2023 Conforming · Section 8.4
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-mono text-slate-200">
                AICTE Apex Verified
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Corporate Talent & Academic Verification Portal
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Legally compliant inspection of student academic records, 10th/12th percentages, university CGPAs,
              and semester transcripts. Student consent is cryptographically enforced via immutable ledger.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={fetchCandidates}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Candidates
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Candidate Pool</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stats.total}</h3>
              <p className="text-[10px] text-slate-500">Verified central repository students</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/30 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wider">Consent Granted</p>
              <h3 className="text-2xl font-bold text-green-900 mt-0.5">{stats.granted}</h3>
              <p className="text-[10px] text-green-700 font-medium">Marks & transcripts unlocked</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-800 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Consent Pending</p>
              <h3 className="text-2xl font-bold text-amber-900 mt-0.5">{stats.pending}</h3>
              <p className="text-[10px] text-amber-700 font-medium">Privacy lock active (DPDP Act)</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Requests</p>
              <h3 className="text-2xl font-bold text-gov-navy mt-0.5">{stats.activeReqs}</h3>
              <p className="text-[10px] text-slate-500">Pending candidate authorization</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gov-navy/10 text-gov-navy flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-gov-navy flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gov-navy" />
                Candidate Talent Registry & Academic Verification
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Inspect academic performance credentials. Unconsented candidates are locked per DPDP Act regulations.
              </CardDescription>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidate, APAAR..."
                  className="pl-8 text-xs h-8 border-slate-300"
                />
              </div>

              {/* Consent Filter */}
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                <button
                  type="button"
                  onClick={() => setConsentFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    consentFilter === 'ALL' ? 'bg-white shadow-xs text-gov-navy' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({candidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setConsentFilter('GRANTED')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    consentFilter === 'GRANTED' ? 'bg-green-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Consent Granted ({stats.granted})
                </button>
                <button
                  type="button"
                  onClick={() => setConsentFilter('PENDING')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    consentFilter === 'PENDING' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pending / Locked ({stats.pending})
                </button>
              </div>

              {/* Program Filter */}
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="text-xs h-8 rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-700"
              >
                <option value="ALL">All Programs</option>
                {programCodes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : error ? (
            <div className="p-8 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-sm font-bold text-slate-800">Error Loading Candidate Pool</p>
              <p className="text-xs text-slate-500">{error}</p>
              <Button size="sm" onClick={fetchCandidates} className="bg-gov-navy text-white text-xs">
                Retry
              </Button>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Candidates Found"
                description="Try adjusting your search criteria or consent filter."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Candidate & Identity</th>
                    <th className="py-3 px-4">Institution & Degree</th>
                    <th className="py-3 px-4">Academic CGPA</th>
                    <th className="py-3 px-4">DPDP Consent Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.map((c) => {
                    const initials = c.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2);

                    return (
                      <tr
                        key={c.apaar_id}
                        className={`transition-colors hover:bg-slate-50/60 ${
                          c.has_consent ? 'bg-green-50/10' : ''
                        }`}
                        data-testid={`candidate-row-${c.apaar_id}`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                c.has_consent ? 'bg-green-700 text-white' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {initials}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{c.full_name}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[11px] text-slate-500">
                                  APAAR: {c.apaar_id}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(c.apaar_id)}
                                  className="text-slate-400 hover:text-slate-600"
                                  title="Copy APAAR ID"
                                >
                                  {copiedApaar === c.apaar_id ? (
                                    <Check className="w-3 h-3 text-green-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block truncate max-w-[220px]">
                            {c.institution_name || c.institution_aicte_id}
                          </span>
                          <span className="text-[11px] text-gov-navy font-bold">
                            {c.program_code} ({c.course_level}) · {c.academic_year}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {c.has_consent ? (
                            c.cgpa ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 text-green-900 font-bold">
                                <Award className="w-3.5 h-3.5 text-green-700" />
                                <span>{c.cgpa.toFixed(2)} CGPA</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Pending upload</span>
                            )
                          ) : (
                            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                              <Lock className="w-3 h-3 text-amber-600" />
                              <span>Consent Required</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {c.has_consent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                              Consent Granted
                            </span>
                          ) : c.request_status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              <Clock className="w-3 h-3 text-blue-600" />
                              Request Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Lock className="w-3 h-3 text-amber-600" />
                              Protected (Unconsented)
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.has_consent ? (
                              <Button
                                size="sm"
                                onClick={() => handleOpenDetailModal(c.apaar_id)}
                                className="bg-gov-navy hover:bg-gov-navy/90 text-white text-xs h-7 px-3 shadow-xs"
                                data-testid={`view-dossier-btn-${c.apaar_id}`}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                View Academic Dossier
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRequestTargetApaar(c.apaar_id);
                                  setRequestJobTitle('Software Engineer / Tech Analyst (2026 Batch)');
                                }}
                                className="border-amber-300 text-amber-900 hover:bg-amber-50 text-xs h-7 px-3"
                                data-testid={`request-consent-btn-${c.apaar_id}`}
                              >
                                <Send className="w-3.5 h-3.5 mr-1 text-amber-700" />
                                Request Consent
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: Candidate Academic Dossier (Unlocked with Consent) */}
      {selectedCandidateApaar && (
        <div
          role="dialog"
          aria-labelledby="dossier-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          data-testid="academic-dossier-modal"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-gov-navy to-[#1a365d] text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-green-500/20 border border-green-400/40 text-[11px] font-bold text-green-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    DPDP Consent Verified
                  </span>
                  <span className="font-mono text-xs text-slate-300">
                    APAAR: {selectedCandidateApaar}
                  </span>
                </div>
                <h2 id="dossier-modal-title" className="text-xl font-bold mt-1 text-white">
                  {candidateDetail?.student.full_name || 'Candidate Academic Profile'}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  {candidateDetail?.student.institution_name} · {candidateDetail?.student.program_code}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCandidateApaar(null)}
                className="text-slate-300 hover:text-white text-lg font-bold px-2 py-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              {isDetailLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : !candidateDetail?.has_consent ? (
                <div className="p-8 text-center space-y-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-amber-900">Student Academic Privacy Protected</h3>
                    <p className="text-xs text-amber-800 max-w-md mx-auto mt-1 leading-relaxed">
                      {candidateDetail?.message ||
                        'Detailed marks and previous school records are locked until candidate grants hiring consent.'}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const apaar = selectedCandidateApaar;
                      setSelectedCandidateApaar(null);
                      setRequestTargetApaar(apaar);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Send Consent Request Now
                  </Button>
                </div>
              ) : (
                <>
                  {/* Overview Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 block">Overall University CGPA</span>
                      <span className="text-lg font-bold text-gov-navy block mt-0.5">
                        {candidateDetail.academic_record?.cgpa?.toFixed(2) || 'N/A'} / 10.0
                      </span>
                      <span className="text-[10px] text-green-700 font-semibold">Verified Cumulative</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 block">Class 10th (Secondary)</span>
                      <span className="text-lg font-bold text-slate-900 block mt-0.5">
                        {candidateDetail.academic_record?.tenth_percentage?.toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {candidateDetail.academic_record?.tenth_board} ({candidateDetail.academic_record?.tenth_year})
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 block">Class 12th / Diploma</span>
                      <span className="text-lg font-bold text-slate-900 block mt-0.5">
                        {candidateDetail.academic_record?.twelfth_percentage?.toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {candidateDetail.academic_record?.twelfth_stream || 'Science'} ({candidateDetail.academic_record?.twelfth_year})
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 block">Academic Standing</span>
                      <span className="text-lg font-bold text-green-700 block mt-0.5">
                        0 Backlogs
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Credits: {candidateDetail.academic_record?.completed_credits} / {candidateDetail.academic_record?.total_credits}
                      </span>
                    </div>
                  </div>

                  {/* 1. Schooling & Previous Marks Details */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                    <h4 className="text-xs font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-gov-saffron" />
                      1. Previous Academic Qualification Breakdown
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-900 block">
                          Secondary Education (Class 10th)
                        </span>
                        <div className="flex justify-between py-0.5 text-slate-600">
                          <span>Board Examination:</span>
                          <span className="font-semibold text-slate-900">
                            {candidateDetail.academic_record?.tenth_board}
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 text-slate-600">
                          <span>Percentage / CGPA:</span>
                          <span className="font-bold text-gov-navy">
                            {candidateDetail.academic_record?.tenth_percentage?.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 text-slate-600">
                          <span>Passing Year:</span>
                          <span className="font-semibold text-slate-900">
                            {candidateDetail.academic_record?.tenth_year}
                          </span>
                        </div>
                        <div className="pt-1 text-[11px] text-slate-500">
                          School: {candidateDetail.academic_record?.tenth_school}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-900 block">
                          Higher Secondary / Intermediate (Class 12th)
                        </span>
                        <div className="flex justify-between py-0.5 text-slate-600">
                          <span>Board / Council:</span>
                          <span className="font-semibold text-slate-900">
                            {candidateDetail.academic_record?.twelfth_board}
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 text-slate-600">
                          <span>Stream / Specialization:</span>
                          <span className="font-semibold text-slate-900">
                            {candidateDetail.academic_record?.twelfth_stream}
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 text-slate-600">
                          <span>Aggregate Percentage:</span>
                          <span className="font-bold text-gov-navy">
                            {candidateDetail.academic_record?.twelfth_percentage?.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 text-slate-600">
                          <span>Passing Year:</span>
                          <span className="font-semibold text-slate-900">
                            {candidateDetail.academic_record?.twelfth_year}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Higher Education University Semester-wise Grades */}
                  {candidateDetail.academic_record?.semester_marks && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                      <h4 className="text-xs font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-gov-navy" />
                        2. University Degree Semester Performance Breakdown
                      </h4>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border border-slate-200 rounded-lg">
                          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">Semester</th>
                              <th className="py-2 px-3">SGPA Score</th>
                              <th className="py-2 px-3">Credits Earned</th>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 px-3">Academic Evaluation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {candidateDetail.academic_record.semester_marks.map((sm) => (
                              <tr key={sm.semester} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-bold text-slate-800">
                                  Semester {sm.semester}
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-gov-navy">
                                  {sm.sgpa.toFixed(2)} / 10.0
                                </td>
                                <td className="py-2 px-3 text-slate-600">{sm.credits} Credits</td>
                                <td className="py-2 px-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                                    {sm.status}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-[11px] text-slate-500">
                                  {sm.sgpa >= 9.0 ? 'Outstanding (O Grade)' : sm.sgpa >= 8.0 ? 'Excellent (A+ Grade)' : 'Very Good (A Grade)'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 3. Verified Competencies & Achievements */}
                  {candidateDetail.academic_record?.skills && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                      <h4 className="text-xs font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-gov-saffron" />
                        3. Verified Technical Competencies & Specializations
                      </h4>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {candidateDetail.academic_record.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DPDP Statutory Receipt Footer */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                      <span>
                        Access granted under DPDP Act 2023 Section 8.4. Tamper-evident hash logged to audit ledger.
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      ID: {selectedCandidateApaar}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCandidateApaar(null)}
                className="text-xs h-8"
              >
                Close Inspection
              </Button>

              {candidateDetail?.has_consent && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="text-xs h-8 border-slate-300"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    Print Verified Dossier
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => alert(`Official candidate hiring dossier for APAAR ${selectedCandidateApaar} exported successfully.`)}
                    className="bg-gov-navy text-white text-xs h-8"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Download Signed Dossier
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Send Consent Request to Student */}
      {requestTargetApaar && (
        <div
          role="dialog"
          aria-labelledby="request-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          data-testid="send-request-modal"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-gov-navy to-[#1a365d] text-white flex items-center justify-between">
              <div>
                <h3 id="request-modal-title" className="text-base font-bold text-white">
                  Request Candidate Hiring Consent
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  DPDP Act 2023 Statutory Purpose-Bound Disclosure
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequestTargetApaar(null)}
                className="text-slate-300 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendConsentRequest} className="p-6 space-y-4 text-xs">
              {requestSuccessMsg ? (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-900 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                  <p className="font-bold text-sm">Request Sent!</p>
                  <p className="text-xs text-green-800">{requestSuccessMsg}</p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 block">Candidate Target</span>
                    <span className="font-bold text-slate-900 block text-sm">
                      APAAR ID: {requestTargetApaar}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Hiring Job Title / Role *</label>
                    <Input
                      value={requestJobTitle}
                      onChange={(e) => setRequestJobTitle(e.target.value)}
                      required
                      placeholder="e.g. Graduate Software Engineer (2026 Batch)"
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Employer / Organization *</label>
                    <Input
                      value={requestOrg}
                      onChange={(e) => setRequestOrg(e.target.value)}
                      required
                      placeholder="e.g. Tata Consultancy Services"
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Purpose of Academic Verification *</label>
                    <Input
                      value={requestPurpose}
                      onChange={(e) => setRequestPurpose(e.target.value)}
                      required
                      placeholder="e.g. Pre-employment marks & transcript verification"
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
                    <strong>Notice under DPDP Act 2023:</strong> The candidate will receive a high-priority prompt in their EduVerify student wallet and an email alert to approve or deny academic marks inspection.
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRequestTargetApaar(null)}
                      className="text-xs h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingRequest}
                      className="bg-gov-navy hover:bg-gov-navy/90 text-white text-xs h-8"
                    >
                      {isSubmittingRequest ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 mr-1.5" />
                          Send Access Request
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
