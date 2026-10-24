import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { MaskedValue } from '@/components/shared/MaskedValue';
import { Scale, CheckCircle2, XCircle, Award, GraduationCap, Search, Eye, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { DabGraduateItem, StudentCredentialItem, StudentOwnRecord } from '@/features/student/types';
import { CertificateModal } from '@/features/student/components/CertificateModal';

interface DisputeItem {
  id: string;
  institution_name: string;
  academic_year: string;
  rule_id: string;
  field: string;
  apaar_id: string;
  dispute_reason: string;
  status: 'PENDING_REVIEW' | 'UPHELD' | 'DISMISSED';
  filed_at: string;
}

const mockDisputes: DisputeItem[] = [
  {
    id: 'dsp-001',
    institution_name: 'Delhi Institute of Engineering & Technology',
    academic_year: '2026-27',
    rule_id: 'V010',
    field: 'apaar_id',
    apaar_id: '984572912301',
    dispute_reason: 'Inter-state lateral migration approved by state Directorate of Technical Education.',
    status: 'PENDING_REVIEW',
    filed_at: '2026-08-11T11:20:00Z',
  },
  {
    id: 'dsp-002',
    institution_name: 'Pune College of Engineering',
    academic_year: '2026-27',
    rule_id: 'V014',
    field: 'category',
    apaar_id: '984588129944',
    dispute_reason: 'EWS reservation quota reallocated under state government notification No. 44/2026.',
    status: 'PENDING_REVIEW',
    filed_at: '2026-08-10T16:05:00Z',
  },
];

export const DabDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'graduates' | 'disputes'>('graduates');

  // Graduates state
  const [graduates, setGraduates] = useState<DabGraduateItem[]>([]);
  const [graduatesLoading, setGraduatesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ISSUED'>('ALL');
  const [issuingStudentId, setIssuingStudentId] = useState<string | null>(null);

  // Disputes state
  const [disputes, setDisputes] = useState<DisputeItem[]>(mockDisputes);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);

  // Certificate Modal state
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certGraduate, setCertGraduate] = useState<DabGraduateItem | null>(null);

  // Alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchGraduates = async () => {
    setGraduatesLoading(true);
    try {
      const res = await fetch('/v1/dab/graduates');
      if (res.ok) {
        const data = await res.json();
        setGraduates(data);
      }
    } catch (err) {
      console.error('Failed to load DAB graduates', err);
    } finally {
      setGraduatesLoading(false);
    }
  };

  useEffect(() => {
    fetchGraduates();
  }, []);

  const handleIssueCredential = async (studentId: string, studentName: string) => {
    setIssuingStudentId(studentId);
    try {
      const res = await fetch('/v1/dab/credentials/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });
      if (res.ok) {
        const data = await res.json();
        setGraduates((prev) =>
          prev.map((g) =>
            g.student_id === studentId
              ? {
                  ...g,
                  credential_status: 'ISSUED',
                  issued_credential_id: data.credential_id,
                  issued_at: data.issued_at,
                }
              : g
          )
        );
        setToastMessage(`Degree credential successfully issued for ${studentName} (ID: ${data.credential_id}).`);
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (err) {
      console.error('Failed to issue degree credential', err);
    } finally {
      setIssuingStudentId(null);
    }
  };

  const handleResolve = (id: string, resolution: 'UPHELD' | 'DISMISSED') => {
    setDisputes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: resolution } : d))
    );
    setSelectedDispute(null);
    setToastMessage(`Dispute ${id} marked as ${resolution}. Official appellate order registered.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredGraduates = graduates.filter((g) => {
    const matchesSearch =
      g.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.apaar_id.includes(searchTerm) ||
      g.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.institution_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || g.credential_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Certificate Modal adapters
  const modalStudent: StudentOwnRecord | null = certGraduate
    ? {
        apaar_id: certGraduate.apaar_id,
        institution_student_id: certGraduate.student_id,
        full_name: certGraduate.full_name,
        dob: '2004-05-14',
        gender: 'M',
        category: 'GEN',
        nationality: 'IN',
        email: `${certGraduate.full_name.toLowerCase().replace(/ /g, '.')}@example.edu.in`,
        mobile: '+91 98451 22301',
        institution_name: certGraduate.institution_name,
        institution_aicte_id: certGraduate.institution_aicte_id,
        program_code: certGraduate.program_code,
        program_name: certGraduate.program_name,
        course_level: certGraduate.course_level,
        department: 'Engineering & Technology',
        academic_year: certGraduate.graduation_year,
        year_of_study: 4,
        enrolment_status: 'GRADUATED',
        admission_date: '2022-08-01',
        admission_type: 'REGULAR',
        seat_type: 'REGULAR',
        quota: 'NONE',
        expected_graduation_year: parseInt(certGraduate.graduation_year) || 2026,
        supernumerary_scheme: null,
        record_version: 1,
        updated_at: certGraduate.issued_at || '2026-06-25T14:30:00Z',
      }
    : null;

  const modalCredential: StudentCredentialItem | null = certGraduate
    ? {
        id: certGraduate.issued_credential_id || 'cred-degree-issued',
        credential_type: 'DEGREE_CERTIFICATE',
        title: `Degree of ${certGraduate.program_name}`,
        title_hi: 'उपाधि प्रमाण-पत्र',
        issuer_name: certGraduate.institution_name,
        issuer_did: 'did:web:dab.aicte-india.org',
        issued_at: certGraduate.issued_at || '2026-06-25T14:30:00Z',
        expires_at: '2099-12-31T23:59:59Z',
        status: 'VALID',
        record_version: 1,
        raw_sd_jwt: '',
        disclosable_claims: [],
      }
    : null;

  const issuedCount = graduates.filter((g) => g.credential_status === 'ISSUED').length;
  const pendingCount = graduates.filter((g) => g.credential_status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-gov-navy" />
            <h2 className="text-2xl font-bold tracking-tight text-gov-navy">
              Degree Awarding Board (DAB) Portal
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Affiliated institution graduate registry, verifiable degree credential issuance, and appellate docket
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-semibold border border-slate-200">
            DAB Apex Authority • Role: DAB_ADMIN
          </span>
        </div>
      </div>

      {toastMessage && (
        <div
          data-testid="dab-toast-success"
          className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-md text-xs font-semibold flex items-center gap-2 animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Affiliated Graduates</CardDescription>
            <CardTitle className="text-2xl font-bold text-gov-navy">
              {graduates.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-slate-500">
            Across registered technical universities
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Degrees Issued</CardDescription>
            <CardTitle className="text-2xl font-bold text-green-700" data-testid="dab-kpi-issued">
              {issuedCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-slate-500">
            SD-JWT verifiable credentials anchored
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Pending Issuance</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600" data-testid="dab-kpi-pending">
              {pendingCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-slate-500">
            Completed graduation requirements
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Active Appeals</CardDescription>
            <CardTitle className="text-2xl font-bold text-gov-navy">
              {disputes.filter((d) => d.status === 'PENDING_REVIEW').length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-slate-500">
            Appellate disputes in docket
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('graduates')}
          data-testid="tab-graduates"
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'graduates'
              ? 'border-gov-navy text-gov-navy'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Affiliated Graduates & Degree Issuance</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
            {graduates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          data-testid="tab-disputes"
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'disputes'
              ? 'border-gov-navy text-gov-navy'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Appellate Dispute Docket</span>
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-mono">
            {disputes.filter((d) => d.status === 'PENDING_REVIEW').length}
          </span>
        </button>
      </div>

      {/* Tab 1: Affiliated Graduates & Degree Issuance */}
      {activeTab === 'graduates' && (
        <Card data-testid="graduates-section">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base text-gov-navy">
                  Graduates of Affiliated Institutions
                </CardTitle>
                <CardDescription>
                  List graduates, verify statutory course completion, and issue cryptographic degree credentials
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchGraduates}
                  className="text-xs h-8"
                  disabled={graduatesLoading}
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${graduatesLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name, APAAR ID, program, or institution..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-gov-navy"
                  data-testid="search-graduates-input"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs rounded-md border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gov-navy"
                  data-testid="status-filter-select"
                >
                  <option value="ALL">All Credential Statuses</option>
                  <option value="PENDING">Pending Issuance ({pendingCount})</option>
                  <option value="ISSUED">Degree Issued ({issuedCount})</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {graduatesLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Loading graduate roster...
              </div>
            ) : filteredGraduates.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No affiliated graduates found matching the filter criteria.
              </div>
            ) : (
              <Table data-testid="graduates-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Graduate Name</TableHead>
                    <TableHead>APAAR ID</TableHead>
                    <TableHead>Affiliated Institution</TableHead>
                    <TableHead>Program & Level</TableHead>
                    <TableHead>Year / CGPA</TableHead>
                    <TableHead>Degree Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGraduates.map((grad) => (
                    <TableRow key={grad.student_id} data-testid={`graduate-row-${grad.student_id}`}>
                      <TableCell className="font-semibold text-slate-900 text-xs">
                        {grad.full_name}
                      </TableCell>
                      <TableCell>
                        <MaskedValue value={grad.apaar_id} kind="apaar" />
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 max-w-[200px] truncate" title={grad.institution_name}>
                        {grad.institution_name}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium text-slate-800">{grad.program_name}</span>
                        <span className="ml-1.5 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-600">
                          {grad.course_level}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {grad.graduation_year} • <strong className="text-gov-navy">{grad.cgpa.toFixed(2)}</strong>
                      </TableCell>
                      <TableCell>
                        {grad.credential_status === 'ISSUED' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 text-green-700" />
                              ISSUED
                            </span>
                            {grad.issued_credential_id && (
                              <p className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                                {grad.issued_credential_id}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            <AlertCircle className="w-3 h-3 text-amber-700" />
                            PENDING
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {grad.credential_status === 'PENDING' ? (
                          <Button
                            variant="default"
                            size="sm"
                            disabled={issuingStudentId === grad.student_id}
                            onClick={() => handleIssueCredential(grad.student_id, grad.full_name)}
                            className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs h-8"
                            data-testid={`issue-degree-btn-${grad.student_id}`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            {issuingStudentId === grad.student_id ? 'Issuing...' : 'Issue Degree Credential'}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCertGraduate(grad);
                              setCertModalOpen(true);
                            }}
                            className="text-xs h-8"
                            data-testid={`view-cert-btn-${grad.student_id}`}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                            View Certificate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Appellate Dispute Docket */}
      {activeTab === 'disputes' && (
        <Card data-testid="disputes-section">
          <CardHeader>
            <CardTitle className="text-base text-gov-navy">Adjudication Docket</CardTitle>
            <CardDescription>
              Review and resolve student record validation disputes escalated by institutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Rule Violation</TableHead>
                  <TableHead>APAAR ID</TableHead>
                  <TableHead>Filing Summary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs font-semibold text-gov-navy">
                      {d.id}
                    </TableCell>
                    <TableCell className="text-xs font-medium max-w-[200px] truncate">
                      {d.institution_name}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800">
                        {d.rule_id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <MaskedValue value={d.apaar_id} kind="apaar" />
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-[240px] truncate">
                      {d.dispute_reason}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          d.status === 'PENDING_REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : d.status === 'UPHELD'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {d.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDispute(d)}
                        className="text-xs"
                      >
                        Review Case
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Case Review Modal */}
      {selectedDispute && (
        <div
          role="dialog"
          aria-labelledby="case-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-4 border-gov-navy space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {selectedDispute.id}
                </span>
                <h3 id="case-modal-title" className="text-lg font-bold text-gov-navy">
                  Adjudicate Appeal: {selectedDispute.rule_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
              <div>
                <span className="text-slate-500">Institution:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {selectedDispute.institution_name}
                </span>
              </div>
              <div>
                <span className="text-slate-500">APAAR ID:</span>{' '}
                <span className="font-mono font-semibold text-gov-navy">
                  {selectedDispute.apaar_id}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Institutional Grounds:</span>
                <p className="mt-1 font-medium text-slate-800 bg-white p-2 rounded border border-slate-200">
                  {selectedDispute.dispute_reason}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Upholding this appeal creates an auditable DAB exemption certificate and clears the validation block for admission rollover.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDispute(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleResolve(selectedDispute.id, 'DISMISSED')}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Dismiss Appeal
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleResolve(selectedDispute.id, 'UPHELD')}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Uphold & Issue Exemption
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal for Issued Degrees */}
      {certModalOpen && certGraduate && modalCredential && modalStudent && (
        <CertificateModal
          isOpen={certModalOpen}
          onClose={() => {
            setCertModalOpen(false);
            setCertGraduate(null);
          }}
          credential={modalCredential}
          student={modalStudent}
        />
      )}
    </div>
  );
};
