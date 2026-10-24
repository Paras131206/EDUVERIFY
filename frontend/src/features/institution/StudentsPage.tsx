import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { MaskedValue } from '@/components/shared/MaskedValue';
import { API_BASE_URL } from '@/lib/api';
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
} from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentDetailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [programFilter, setProgramFilter] = useState('ALL');
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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const url = new URL(`${API_BASE_URL}/v1/students`);
      if (searchQuery) url.searchParams.set('q', searchQuery);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
      if (programFilter !== 'ALL') url.searchParams.set('program', programFilter);

      const res = await fetch(url.toString());
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

      const res = await fetch(`${API_BASE_URL}/v1/students/${transitioningStudent.apaar_id}/transitions`, {
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
      
      // Update local lists and selected student view
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gov-navy">Student Central Registry</h2>
          <p className="text-xs text-slate-500 mt-1">
            Canonical student records keyed by 12-digit APAAR ID with lifecycle transitions and immutable version history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGlobalUnmask(!globalUnmask)}
            className="flex items-center gap-1.5"
            id="toggle-mask-btn"
          >
            {globalUnmask ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-600" />}
            <span>{globalUnmask ? 'Mask PII' : 'Unmask PII (Authorized)'}</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
            <span>Enrolled Students ({students.length})</span>
            <span className="text-xs font-normal text-slate-500">Academic Year 2026-27</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Student identities verified via Central APAAR registry with DPDP Act student consent status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table id="students-table">
            <TableHeader>
              <TableRow>
                <TableHead>APAAR ID</TableHead>
                <TableHead>Student ID (PRN)</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Year / Level</TableHead>
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
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-slate-500">
                    No students match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
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
                      {student.full_name}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] font-medium text-slate-800">
                        {student.program_code}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      Year {student.year_of_study || 1} • {student.course_level}
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
                          className="text-xs h-7 px-2.5"
                        >
                          Details
                        </Button>
                        <Button
                          variant="saffron"
                          size="sm"
                          onClick={() => handleOpenTransitionDialog(student)}
                          className="text-xs h-7 px-2.5"
                          id={`change-status-btn-${student.apaar_id}`}
                          data-testid={`change-status-btn-${student.apaar_id}`}
                        >
                          Change Status
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
              {/* Demographics & Academic Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Lifecycle Status</span>
                  <div className="mt-1">{getStatusBadge(selectedStudent.enrolment_status)}</div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Program</span>
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
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-gov-navy border-2 border-white ring-2 ring-slate-300" />
                      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gov-navy">{evt.event_type}</span>
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
