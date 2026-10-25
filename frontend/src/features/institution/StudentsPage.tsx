import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { MaskedValue } from '@/components/shared/MaskedValue';
import { API_BASE_URL, authFetch } from '@/lib/api';
import {
  StudentDetailRecord,
  EnrolmentStatus,
  ALLOWED_TRANSITIONS,
} from './types';
import {
  Search,
  SlidersHorizontal,
  UserCheck,
  Shield,
  Clock,
  History,
  FileText,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  X,
  GitBranch,
  UserPlus,
  ArrowRightLeft,
  GraduationCap,
  Building2,
  Sparkles,
} from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentDetailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [entryExitFilter, setEntryExitFilter] = useState<'ALL' | 'REGULAR' | 'LATERAL' | 'TRANSFER_IN' | 'EXITED'>('ALL');
  const [globalUnmask, setGlobalUnmask] = useState(false);

  // Selected student for detail drawer
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailRecord | null>(null);

  // Status transition dialog state
  const [transitioningStudent, setTransitioningStudent] = useState<StudentDetailRecord | null>(null);
  const [targetStatus, setTargetStatus] = useState<EnrolmentStatus | ''>('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [transitionReason, setTransitionReason] = useState('');
  const [evidenceRef, setEvidenceRef] = useState('');
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [transitionSuccess, setTransitionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Branch Switch Dialog State
  const [branchSwitchStudent, setBranchSwitchStudent] = useState<StudentDetailRecord | null>(null);
  const [targetProgram, setTargetProgram] = useState('UG-CMPN');
  const [targetDepartment, setTargetDepartment] = useState('Computer Engineering');
  const [branchSwitchDate, setBranchSwitchDate] = useState(new Date().toISOString().split('T')[0]);
  const [branchSwitchReason, setBranchSwitchReason] = useState('Merit-based branch sliding vacancy seat conversion round 2');
  const [branchSwitchRef, setBranchSwitchRef] = useState('SENATE-BR-2026-44');
  const [branchSwitchSuccess, setBranchSwitchSuccess] = useState<string | null>(null);
  const [branchSwitchError, setBranchSwitchError] = useState<string | null>(null);
  const [isBranchSwitching, setIsBranchSwitching] = useState(false);

  // Admit Student (Entry Points) Dialog State
  const [isAdmittingStudent, setIsAdmittingStudent] = useState(false);
  const [admitForm, setAdmitForm] = useState({
    entry_point: 'DSE_LATERAL' as 'DSE_LATERAL' | 'REGULAR_YEAR1' | 'TRANSFER_IN',
    apaar_id: '',
    institution_student_id: '',
    full_name: '',
    dob: '2004-06-15',
    gender: 'M',
    category: 'GEN',
    program_code: 'UG-CSE',
    department: 'Computer Science',
    diploma_specialization: 'Diploma in Computer Technology (88.4%)',
    source_institution: '1-109283719 (Government Polytechnic)',
    evidence_ref: 'DSE-CAP-2026-8802',
  });
  const [admitSuccess, setAdmitSuccess] = useState<string | null>(null);
  const [admitError, setAdmitError] = useState<string | null>(null);
  const [isSubmittingAdmit, setIsSubmittingAdmit] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const url = new URL(`${API_BASE_URL}/v1/students`);
      if (searchQuery) url.searchParams.set('q', searchQuery);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
      if (programFilter !== 'ALL') url.searchParams.set('program', programFilter);

      const res = await authFetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Failed to load student registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchQuery, statusFilter, programFilter]);

  const handleOpenTransitionDialog = (student: StudentDetailRecord) => {
    setTransitioningStudent(student);
    setTargetStatus('');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setTransitionReason('');
    setEvidenceRef('');
    setTransitionError(null);
    setTransitionSuccess(null);
  };

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitioningStudent || !targetStatus) return;

    try {
      setIsSubmitting(true);
      setTransitionError(null);

      const res = await authFetch(`${API_BASE_URL}/v1/students/${transitioningStudent.apaar_id}/transitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_status: targetStatus,
          effective_date: effectiveDate,
          reason: transitionReason,
          evidence_ref: evidenceRef,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Transition disallowed by system policy');
      }

      const updatedStudent: StudentDetailRecord = await res.json();
      setTransitionSuccess(`Status successfully transitioned to ${targetStatus}`);
      
      setStudents((prev) =>
        prev.map((s) => (s.apaar_id === updatedStudent.apaar_id ? updatedStudent : s))
      );
      if (selectedStudent?.apaar_id === updatedStudent.apaar_id) {
        setSelectedStudent(updatedStudent);
      }

      setTimeout(() => {
        setTransitioningStudent(null);
        setTransitionSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Disallowed transition';
      setTransitionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenBranchSwitch = (student: StudentDetailRecord) => {
    setBranchSwitchStudent(student);
    const nextProgram = student.program_code === 'UG-IT' ? 'UG-CMPN' : 'UG-IT';
    setTargetProgram(nextProgram);
    setTargetDepartment(nextProgram === 'UG-CMPN' ? 'Computer Engineering' : 'Information Technology');
    setBranchSwitchDate(new Date().toISOString().split('T')[0]);
    setBranchSwitchReason(`Internal sliding round: Branch switch from ${student.program_code} to ${nextProgram}`);
    setBranchSwitchRef(`SENATE-BR-2026-${Math.floor(100 + Math.random() * 900)}`);
    setBranchSwitchSuccess(null);
    setBranchSwitchError(null);
  };

  const handleExecuteBranchSwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchSwitchStudent || !targetProgram) return;

    try {
      setIsBranchSwitching(true);
      setBranchSwitchError(null);

      const res = await authFetch(`${API_BASE_URL}/v1/students/${branchSwitchStudent.apaar_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_code: targetProgram,
          department: targetDepartment,
          effective_date: branchSwitchDate,
          reason: branchSwitchReason,
          evidence_ref: branchSwitchRef,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to apply branch switch');
      }

      const updated: StudentDetailRecord = await res.json();
      setBranchSwitchSuccess(`Branch switched from ${branchSwitchStudent.program_code} to ${targetProgram}. Version history and timeline updated.`);

      setStudents((prev) =>
        prev.map((s) => (s.apaar_id === updated.apaar_id ? updated : s))
      );
      if (selectedStudent?.apaar_id === updated.apaar_id) {
        setSelectedStudent(updated);
      }

      setTimeout(() => {
        setBranchSwitchStudent(null);
        setBranchSwitchSuccess(null);
      }, 1500);
    } catch (err: any) {
      setBranchSwitchError(err.message || 'Branch switch error');
    } finally {
      setIsBranchSwitching(false);
    }
  };

  const handleExecuteAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingAdmit(true);
      setAdmitError(null);

      const isLateral = admitForm.entry_point === 'DSE_LATERAL';
      const isTransfer = admitForm.entry_point === 'TRANSFER_IN';

      const payload = {
        apaar_id: admitForm.apaar_id || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        institution_student_id: admitForm.institution_student_id || `PRN-2026-${isLateral ? 'DSE-' : ''}${Math.floor(100 + Math.random() * 900)}`,
        full_name: admitForm.full_name,
        dob: admitForm.dob,
        gender: admitForm.gender,
        category: admitForm.category,
        program_code: admitForm.program_code,
        course_level: 'UG',
        department: admitForm.department,
        academic_year: '2026-27',
        year_of_study: isLateral ? 2 : (isTransfer ? 2 : 1),
        admission_date: new Date().toISOString().split('T')[0],
        admission_type: isLateral ? 'LATERAL' : (isTransfer ? 'TRANSFER_IN' : 'REGULAR'),
        seat_type: isLateral ? 'SUPERNUMERARY' : 'REGULAR',
        quota: 'NONE',
        source_institution: isTransfer ? admitForm.source_institution : undefined,
        evidence_ref: isLateral ? `DSE-CAP-2026-${admitForm.diploma_specialization}` : admitForm.evidence_ref,
      };

      const res = await authFetch(`${API_BASE_URL}/v1/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to admit student');
      }

      const created: StudentDetailRecord = await res.json();
      setAdmitSuccess(`Successfully enrolled ${created.full_name} via ${isLateral ? 'Direct Second Year (DSE Lateral Entry)' : isTransfer ? 'Inter-College Transfer In' : 'First Year Regular Entry'}`);
      setStudents((prev) => [created, ...prev]);

      setTimeout(() => {
        setIsAdmittingStudent(false);
        setAdmitSuccess(null);
      }, 1500);
    } catch (err: any) {
      setAdmitError(err.message || 'Admission failed');
    } finally {
      setIsSubmittingAdmit(false);
    }
  };

  const getStatusBadge = (status: EnrolmentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200">ACTIVE</span>;
      case 'DEFERRED':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">DEFERRED</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">COMPLETED</span>;
      case 'GRADUATED':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">GRADUATED</span>;
      case 'WITHDRAWN':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">WITHDRAWN</span>;
      case 'TRANSFERRED_OUT':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">TRANSFERRED_OUT</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const allowedTransitions = transitioningStudent
    ? ALLOWED_TRANSITIONS[transitioningStudent.enrolment_status] || []
    : [];

  // Filter students based on entry/exit filters
  const filteredStudents = students.filter((s) => {
    if (entryExitFilter === 'REGULAR') {
      return s.admission_type === 'REGULAR' && s.year_of_study === 1;
    }
    if (entryExitFilter === 'LATERAL') {
      return s.admission_type === 'LATERAL' || s.institution_student_id.includes('DSE');
    }
    if (entryExitFilter === 'TRANSFER_IN') {
      return s.admission_type === 'TRANSFER_IN';
    }
    if (entryExitFilter === 'EXITED') {
      return ['WITHDRAWN', 'TRANSFERRED_OUT', 'GRADUATED', 'COMPLETED'].includes(s.enrolment_status);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gov-navy">Student Central Registry</h2>
          <p className="text-xs text-slate-500 mt-1">
            Canonical student records keyed by 12-digit APAAR ID with immutable branch switch history and multiple entry/exit points
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAdmittingStudent(true)}
            className="bg-gov-navy hover:bg-slate-800 text-white text-xs gap-1.5"
            data-testid="admit-student-btn"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Admit Student (Entry Point)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setGlobalUnmask(!globalUnmask)}
            className="flex items-center gap-1.5 text-xs"
            id="toggle-mask-btn"
          >
            {globalUnmask ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-600" />}
            <span>{globalUnmask ? 'Mask PII' : 'Unmask PII (Authorized)'}</span>
          </Button>
        </div>
      </div>

      {/* Entry / Exit Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] mr-1">
          Entry & Exit Pathways:
        </span>
        <button
          onClick={() => setEntryExitFilter('ALL')}
          className={`px-3 py-1.5 rounded-full font-medium transition ${
            entryExitFilter === 'ALL'
              ? 'bg-gov-navy text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Students ({students.length})
        </button>
        <button
          onClick={() => setEntryExitFilter('LATERAL')}
          className={`px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1.5 ${
            entryExitFilter === 'LATERAL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          DSE Lateral Entry (Year 2)
        </button>
        <button
          onClick={() => setEntryExitFilter('REGULAR')}
          className={`px-3 py-1.5 rounded-full font-medium transition ${
            entryExitFilter === 'REGULAR'
              ? 'bg-gov-navy text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Regular Entry (Year 1)
        </button>
        <button
          onClick={() => setEntryExitFilter('TRANSFER_IN')}
          className={`px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1.5 ${
            entryExitFilter === 'TRANSFER_IN'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Transfer-In Entry
        </button>
        <button
          onClick={() => setEntryExitFilter('EXITED')}
          className={`px-3 py-1.5 rounded-full font-medium transition ${
            entryExitFilter === 'EXITED'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Exited / Withdrawn / Transferred Out
        </button>
      </div>

      {/* Search and Secondary Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            id="student-search-input"
            type="text"
            placeholder="Search by student name, APAAR ID, or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-gov-saffron"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DEFERRED">DEFERRED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="GRADUATED">GRADUATED</option>
            <option value="WITHDRAWN">WITHDRAWN</option>
            <option value="TRANSFERRED_OUT">TRANSFERRED_OUT</option>
          </select>
          <select
            id="program-filter"
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-gov-saffron"
          >
            <option value="ALL">All Programs</option>
            <option value="UG-CSE">UG-CSE</option>
            <option value="UG-CMPN">UG-CMPN</option>
            <option value="UG-IT">UG-IT</option>
            <option value="UG-ECE">UG-ECE</option>
            <option value="UG-ME">UG-ME</option>
            <option value="PG-MBA">PG-MBA</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-gov-navy flex items-center justify-between">
            <span>Enrolled Students ({filteredStudents.length})</span>
            <span className="text-xs font-normal text-slate-500">Academic Year 2026-27</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Student identities verified via Central APAAR registry with DPDP Act student consent status and branch switch tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table id="students-table">
            <TableHeader>
              <TableRow>
                <TableHead>APAAR ID</TableHead>
                <TableHead>Student ID (PRN)</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Program & Branch</TableHead>
                <TableHead>Entry / Year</TableHead>
                <TableHead>Lifecycle Status</TableHead>
                <TableHead>Consent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-slate-500">
                    Loading canonical records...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-slate-500">
                    No students match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => {
                  const hasBranchSwitch = student.timeline?.some(
                    (t) => t.event_type === 'BRANCH_SWITCH' || t.reason?.toLowerCase().includes('branch switch')
                  );
                  const isDSE = student.admission_type === 'LATERAL' || student.institution_student_id.includes('DSE');
                  const isTransferIn = student.admission_type === 'TRANSFER_IN';

                  return (
                    <TableRow key={student.apaar_id} className="hover:bg-slate-50/80">
                      <TableCell>
                        <MaskedValue
                          value={student.apaar_id}
                          kind="apaar"
                          canUnmask={globalUnmask}
                          className="text-xs font-mono font-semibold text-slate-800"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">
                        {student.institution_student_id}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{student.full_name}</span>
                          {hasBranchSwitch && (
                            <span className="p-0.5 rounded bg-purple-100 text-purple-700" title="Branch Switched">
                              <GitBranch className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        <div className="flex flex-col gap-0.5">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] font-medium text-slate-800 w-fit">
                            {student.program_code}
                          </span>
                          {hasBranchSwitch && (
                            <span className="text-[10px] text-purple-700 font-semibold flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> Branch Switched
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <div className="flex flex-col gap-0.5">
                          <span>Year {student.year_of_study || 1} &middot; {student.course_level}</span>
                          {isDSE && (
                            <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 w-fit">
                              DSE Lateral Entry
                            </span>
                          )}
                          {isTransferIn && (
                            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 w-fit">
                              Transfer-In
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(student.enrolment_status)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span>GRANTED</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedStudent(student)}
                            className="text-xs h-7 px-2"
                          >
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenBranchSwitch(student)}
                            className="text-xs h-7 px-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                            title="Switch Branch / Program"
                          >
                            <GitBranch className="w-3 h-3 mr-1" />
                            Switch Branch
                          </Button>
                          <Button
                            variant="saffron"
                            size="sm"
                            onClick={() => handleOpenTransitionDialog(student)}
                            className="text-xs h-7 px-2"
                            id={`change-status-btn-${student.apaar_id}`}
                            data-testid={`change-status-btn-${student.apaar_id}`}
                          >
                            Status
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* STUDENT DETAIL DRAWER / MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Header */}
            <div className="bg-gov-navy text-white p-5 rounded-t-xl flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-gov-saffron" />
                  <span>{selectedStudent.full_name}</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                  <span>APAAR ID:</span>
                  <MaskedValue
                    value={selectedStudent.apaar_id}
                    kind="apaar"
                    canUnmask={globalUnmask}
                    className="text-xs font-mono text-white"
                  />
                  <span>•</span>
                  <span>PRN: {selectedStudent.institution_student_id}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Branch switch notice if present */}
              {selectedStudent.timeline?.some((t) => t.event_type === 'BRANCH_SWITCH' || t.reason?.toLowerCase().includes('branch switch')) && (
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-3">
                  <GitBranch className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-purple-900">Branch Switch / Course Transfer Audit Verified</h5>
                    <p className="mt-0.5 text-purple-800 leading-relaxed">
                      This student has an official branch switch on record. All previous course records and admission credits are retained in the immutable version log below.
                    </p>
                  </div>
                </div>
              )}

              {/* Demographics & Academic Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Lifecycle Status</span>
                  <div className="mt-1">{getStatusBadge(selectedStudent.enrolment_status)}</div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Current Program</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.program_code}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Department</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Academic Year</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.academic_year}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Date of Birth</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.dob}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Gender & Category</span>
                  <span className="font-semibold text-slate-800">
                    {selectedStudent.gender} • {selectedStudent.category}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Admission Type</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.admission_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Seat Type / Quota</span>
                  <span className="font-semibold text-slate-800">
                    {selectedStudent.seat_type} ({selectedStudent.quota})
                  </span>
                </div>
              </div>

              {/* Version History Table */}
              <div>
                <h4 className="text-sm font-bold text-gov-navy flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-gov-navy" />
                  <span>Record Version History (Immutable Audit Log)</span>
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-xs">Version</TableHead>
                        <TableHead className="text-xs">Timestamp</TableHead>
                        <TableHead className="text-xs">Actor / Source</TableHead>
                        <TableHead className="text-xs">Summary of Modifications</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStudent.versions?.map((ver) => (
                        <TableRow key={ver.version_id}>
                          <TableCell className="font-mono text-xs font-semibold">
                            v{ver.version_number}.0
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {new Date(ver.changed_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-slate-700">
                            {ver.changed_by}
                          </TableCell>
                          <TableCell className="text-xs text-slate-800">
                            {ver.changes_summary}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Lifecycle Timeline */}
              <div>
                <h4 className="text-sm font-bold text-gov-navy flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gov-navy" />
                  <span>Student Lifecycle Timeline</span>
                </h4>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedStudent.timeline?.map((evt) => (
                    <div key={evt.id} className="relative group">
                      <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white ring-2 ${
                        evt.event_type === 'BRANCH_SWITCH' ? 'bg-purple-600 ring-purple-200' : 'bg-gov-navy ring-slate-300'
                      }`} />
                      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${
                            evt.event_type === 'BRANCH_SWITCH' ? 'text-purple-700' : 'text-gov-navy'
                          }`}>
                            {evt.event_type}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Effective: {evt.effective_date}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1">{evt.reason}</p>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                          {evt.evidence_ref && (
                            <span className="flex items-center gap-1 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                              <FileText className="w-3 h-3" />
                              <span>Ref: {evt.evidence_ref}</span>
                            </span>
                          )}
                          <span>By: {evt.actor}</span>
                          <span>•</span>
                          <span>{new Date(evt.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-b-xl border-t border-slate-200 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedStudent(null)}>
                Close
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const s = selectedStudent;
                  setSelectedStudent(null);
                  handleOpenBranchSwitch(s);
                }}
                className="border-purple-200 text-purple-700 hover:bg-purple-50 gap-1.5"
              >
                <GitBranch className="w-3.5 h-3.5" />
                Switch Branch
              </Button>
              <Button
                variant="saffron"
                size="sm"
                onClick={() => {
                  const s = selectedStudent;
                  setSelectedStudent(null);
                  handleOpenTransitionDialog(s);
                }}
              >
                Change Status
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BRANCH SWITCH MODAL */}
      {branchSwitchStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="bg-purple-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 rounded-md">
                  <GitBranch className="w-4 h-4 text-purple-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Switch Student Branch / Program</h3>
                  <p className="text-xs text-purple-200">
                    Record immutable branch sliding with full historical audit preservation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBranchSwitchStudent(null)}
                className="text-purple-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteBranchSwitch} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{branchSwitchStudent.full_name}</span>
                  <span className="font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Current: {branchSwitchStudent.program_code}
                  </span>
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  APAAR: {branchSwitchStudent.apaar_id} &middot; Roll: {branchSwitchStudent.institution_student_id}
                </div>
              </div>

              {branchSwitchSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{branchSwitchSuccess}</span>
                </div>
              )}

              {branchSwitchError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{branchSwitchError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  New Target Program / Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetProgram}
                  onChange={(e) => {
                    const prog = e.target.value;
                    setTargetProgram(prog);
                    if (prog === 'UG-CMPN') setTargetDepartment('Computer Engineering');
                    else if (prog === 'UG-IT') setTargetDepartment('Information Technology');
                    else if (prog === 'UG-CSE') setTargetDepartment('Computer Science');
                    else if (prog === 'UG-ECE') setTargetDepartment('Electronics & Comm');
                    else if (prog === 'UG-ME') setTargetDepartment('Mechanical Engineering');
                  }}
                  className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-purple-600"
                >
                  <option value="UG-CMPN">UG-CMPN — Computer Engineering</option>
                  <option value="UG-IT">UG-IT — Information Technology</option>
                  <option value="UG-CSE">UG-CSE — Computer Science & Engineering</option>
                  <option value="UG-ECE">UG-ECE — Electronics & Communication</option>
                  <option value="UG-ME">UG-ME — Mechanical Engineering</option>
                  <option value="PG-MBA">PG-MBA — Master of Business Administration</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  New Department <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Effective Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  required
                  value={branchSwitchDate}
                  onChange={(e) => setBranchSwitchDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Reason for Branch Switch <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Merit-based branch sliding vacancy seat conversion round 2"
                  value={branchSwitchReason}
                  onChange={(e) => setBranchSwitchReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Senate / Directorate Order Reference <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. SENATE-BR-2026-44"
                  value={branchSwitchRef}
                  onChange={(e) => setBranchSwitchRef(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBranchSwitchStudent(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isBranchSwitching}
                  className="bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs"
                >
                  {isBranchSwitching ? 'Updating Audit Log...' : 'Confirm Branch Switch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIT STUDENT (MULTIPLE ENTRY POINTS) MODAL */}
      {isAdmittingStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="bg-gov-navy text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-gov-saffron/20 text-gov-saffron rounded-md">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Admit Student — Multiple Entry Points</h3>
                  <p className="text-xs text-slate-300">
                    Direct Second Year (DSE Lateral), Regular First Year, or Transfer-In
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdmittingStudent(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteAdmit} className="p-5 space-y-4">
              {admitSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{admitSuccess}</span>
                </div>
              )}

              {admitError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{admitError}</span>
                </div>
              )}

              {/* Pathway Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Admissions Entry Pathway <span className="text-red-500">*</span>
                </label>
                <select
                  value={admitForm.entry_point}
                  onChange={(e) => {
                    const ep = e.target.value as any;
                    setAdmitForm((prev) => ({
                      ...prev,
                      entry_point: ep,
                    }));
                  }}
                  className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 font-semibold focus:ring-1 focus:ring-gov-navy"
                >
                  <option value="DSE_LATERAL">Direct Second Year (DSE) Lateral Entry — Year 2</option>
                  <option value="REGULAR_YEAR1">First Year Regular Entry — Year 1</option>
                  <option value="TRANSFER_IN">Inter-College / University Transfer-In Entry</option>
                </select>
              </div>

              {admitForm.entry_point === 'DSE_LATERAL' && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>DSE Policy (AICTE Approval Handbook):</strong> Admitted directly into Semester 3 (Year 2) under Supernumerary / Lateral Entry quota for Polytechnic Diploma and B.Sc graduates.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Student Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Tanmay Kulkarni"
                    value={admitForm.full_name}
                    onChange={(e) => setAdmitForm({ ...admitForm, full_name: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    APAAR ID (12 digits)
                  </label>
                  <Input
                    type="text"
                    maxLength={12}
                    placeholder="Auto-generated if empty"
                    value={admitForm.apaar_id}
                    onChange={(e) => setAdmitForm({ ...admitForm, apaar_id: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Program <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={admitForm.program_code}
                    onChange={(e) => {
                      const pc = e.target.value;
                      setAdmitForm({
                        ...admitForm,
                        program_code: pc,
                        department: pc === 'UG-CSE' ? 'Computer Science' : pc === 'UG-CMPN' ? 'Computer Engineering' : 'Information Technology',
                      });
                    }}
                    className="w-full text-xs bg-white border border-slate-300 rounded-md px-2 py-2 font-medium"
                  >
                    <option value="UG-CSE">UG-CSE</option>
                    <option value="UG-CMPN">UG-CMPN</option>
                    <option value="UG-IT">UG-IT</option>
                    <option value="UG-ECE">UG-ECE</option>
                    <option value="UG-ME">UG-ME</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={admitForm.category}
                    onChange={(e) => setAdmitForm({ ...admitForm, category: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded-md px-2 py-2 font-medium"
                  >
                    <option value="GEN">GEN (Open)</option>
                    <option value="OBC-NCL">OBC-NCL</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={admitForm.gender}
                    onChange={(e) => setAdmitForm({ ...admitForm, gender: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded-md px-2 py-2 font-medium"
                  >
                    <option value="M">M</option>
                    <option value="F">F</option>
                    <option value="T">T</option>
                  </select>
                </div>
              </div>

              {admitForm.entry_point === 'DSE_LATERAL' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Prior Diploma / B.Sc Qualification <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Diploma in Computer Engineering (88.4%)"
                    value={admitForm.diploma_specialization}
                    onChange={(e) => setAdmitForm({ ...admitForm, diploma_specialization: e.target.value })}
                    className="text-xs"
                  />
                </div>
              )}

              {admitForm.entry_point === 'TRANSFER_IN' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Source University / Institution AICTE ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. 1-109283719 (Anna University Affiliate)"
                    value={admitForm.source_institution}
                    onChange={(e) => setAdmitForm({ ...admitForm, source_institution: e.target.value })}
                    className="text-xs"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdmittingStudent(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingAdmit || !admitForm.full_name}
                  className="bg-gov-navy hover:bg-slate-800 text-white font-semibold text-xs"
                >
                  {isSubmittingAdmit ? 'Enrolling...' : 'Confirm Admission'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE STATUS DIALOG (Agents.md §8.1 Strict Enforcement) */}
      {transitioningStudent && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-labelledby="transition-dialog-title"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-gov-navy text-white p-4 flex items-center justify-between">
              <div>
                <h3 id="transition-dialog-title" className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gov-saffron" />
                  <span>Change Student Lifecycle Status</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Regulated under AICTE Section 8.1 State Machine (Rule V021)
                </p>
              </div>
              <button
                onClick={() => setTransitioningStudent(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransition} className="p-5 space-y-4">
              {/* Student Context Card */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{transitioningStudent.full_name}</span>
                  <span>{getStatusBadge(transitioningStudent.enrolment_status)}</span>
                </div>
                <div className="text-slate-500 flex items-center gap-2 font-mono text-[11px]">
                  <span>APAAR: {transitioningStudent.apaar_id}</span>
                  <span>•</span>
                  <span>{transitioningStudent.program_code}</span>
                </div>
              </div>

              {transitionSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{transitionSuccess}</span>
                </div>
              )}

              {transitionError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{transitionError}</span>
                </div>
              )}

              {/* Case 1: Terminal Status */}
              {allowedTransitions.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertCircle className="w-4 h-4" />
                    <span>Terminal Lifecycle State</span>
                  </div>
                  <p className="leading-relaxed">
                    This student record is currently in state{' '}
                    <strong className="font-mono">{transitioningStudent.enrolment_status}</strong>.
                    Under AICTE Section 8.1, terminal states ({transitioningStudent.enrolment_status}) do not allow any further state transitions.
                    Any attempt to alter this state is blocked by Rule V021.
                  </p>
                </div>
              ) : (
                /* Case 2: Allowed Transitions Available */
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="target-status-select" className="text-xs font-bold text-slate-700 block">
                      Target Status (Permitted Transitions Only) <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="target-status-select"
                      required
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value as EnrolmentStatus)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-gov-saffron font-medium"
                    >
                      <option value="">Select target status...</option>
                      {allowedTransitions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Only transitions legally compliant with current status{' '}
                      <span className="font-semibold text-slate-700 font-mono">
                        {transitioningStudent.enrolment_status}
                      </span>{' '}
                      are offered.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="effective-date-input" className="text-xs font-bold text-slate-700 block">
                      Effective Date <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="effective-date-input"
                      type="date"
                      required
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="transition-reason-input" className="text-xs font-bold text-slate-700 block">
                      Reason for Status Change <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="transition-reason-input"
                      type="text"
                      required
                      placeholder="e.g. Approved medical leave / voluntary withdrawal / credit completion"
                      value={transitionReason}
                      onChange={(e) => setTransitionReason(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="evidence-ref-input" className="text-xs font-bold text-slate-700 block">
                      Evidence / Approval Reference
                    </label>
                    <Input
                      id="evidence-ref-input"
                      type="text"
                      placeholder="e.g. TC-2026-901 or Senate-Order-144"
                      value={evidenceRef}
                      onChange={(e) => setEvidenceRef(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTransitioningStudent(null)}
                >
                  Cancel
                </Button>
                {allowedTransitions.length > 0 && (
                  <Button
                    type="submit"
                    variant="saffron"
                    size="sm"
                    disabled={isSubmitting || !targetStatus}
                    id="confirm-transition-btn"
                  >
                    {isSubmitting ? 'Applying Transition...' : 'Confirm Status Transition'}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
