import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { MaskedValue } from '@/components/shared/MaskedValue';
import { API_BASE_URL, authFetch } from '@/lib/api';
import { TransferRequestItem, TransferStatus } from './types';
import {
  ArrowLeftRight,
  Check,
  X,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  FileText,
} from 'lucide-react';

const APPROVAL_REASONS = [
  'Academic Senate / Governing Board NOC granted; Transfer Certificate issued',
  'Mutual inter-university transfer agreement per AICTE §8.1',
  'Approved on medical hardship / compassionate grounds with committee clearance',
  'Parental relocation of central / state government / armed forces personnel',
  'Curriculum compatibility verified & seat vacancy available at destination',
  'Other reason (specify details below)',
];

const APPROVAL_QUICK_CHIPS = [
  { label: 'Senate NOC & TC', full: 'Academic Senate / Governing Board NOC granted; Transfer Certificate issued' },
  { label: 'Medical Clearance', full: 'Approved on medical hardship / compassionate grounds with committee clearance' },
  { label: 'Parent Relocation', full: 'Parental relocation of central / state government / armed forces personnel' },
  { label: 'Mutual Agreement', full: 'Mutual inter-university transfer agreement per AICTE §8.1' },
];

const REJECTION_REASONS = [
  'Sanctioned intake capacity exceeded in target academic program',
  'Pending semester tuition fees / institutional library clearance dues',
  'Disciplinary hold or ongoing academic integrity inquiry',
  'Minimum credit / course prerequisite eligibility criteria not satisfied',
  'Invalid, forged, or unverified Transfer Certificate (TC) document',
  'Student not in active enrolment status at source institution',
  'Other reason (specify details below)',
];

const REJECTION_QUICK_CHIPS = [
  { label: 'Intake Exceeded', full: 'Sanctioned intake capacity exceeded in target academic program' },
  { label: 'Pending Dues', full: 'Pending semester tuition fees / institutional library clearance dues' },
  { label: 'Disciplinary Hold', full: 'Disciplinary hold or ongoing academic integrity inquiry' },
  { label: 'Prerequisite Mismatch', full: 'Minimum credit / course prerequisite eligibility criteria not satisfied' },
];

export const TransfersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [transfers, setTransfers] = useState<TransferRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Transfer Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [apaarId, setApaarId] = useState('');
  const [sourceInstitutionId, setSourceInstitutionId] = useState('1-100010001');
  const [sourceInstitutionName, setSourceInstitutionName] = useState('Delhi College of Engineering & Technology');
  const [targetProgram, setTargetProgram] = useState('UG-CSE');
  const [reason, setReason] = useState('');
  const [evidenceRef, setEvidenceRef] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Decision Modal State
  const [decisionItem, setDecisionItem] = useState<{
    transfer: TransferRequestItem;
    action: 'APPROVED' | 'REJECTED';
  } | null>(null);
  const [reasonPreset, setReasonPreset] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decisionRef, setDecisionRef] = useState('');
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  // View Details Modal State
  const [viewingTransfer, setViewingTransfer] = useState<TransferRequestItem | null>(null);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`${API_BASE_URL}/v1/transfers`);
      if (res.ok) {
        const data: TransferRequestItem[] = await res.json();
        setTransfers(data);
      }
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apaarId.trim() || !reason.trim()) return;

    try {
      setIsSubmitting(true);
      setCreateError(null);

      const res = await authFetch(`${API_BASE_URL}/v1/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apaar_id: apaarId.trim(),
          from_institution_id: sourceInstitutionId,
          from_institution_name: sourceInstitutionName,
          to_program_code: targetProgram,
          reason: reason.trim(),
          transfer_certificate_ref: evidenceRef.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to initiate transfer request');
      }

      const created: TransferRequestItem = await res.json();
      setCreateSuccess(`Transfer request ${created.id} initiated successfully.`);
      setTransfers((prev) => [created, ...prev]);
      setActiveTab('outgoing');

      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateSuccess(null);
        setApaarId('');
        setReason('');
        setEvidenceRef('');
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creating transfer';
      setCreateError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionItem) return;

    try {
      setDecisionSubmitting(true);
      let remarksToSend = decisionNotes.trim();
      if (decisionRef.trim()) {
        remarksToSend = `${remarksToSend} [Ref: ${decisionRef.trim()}]`;
      }

      const res = await authFetch(`${API_BASE_URL}/v1/transfers/${decisionItem.transfer.id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionItem.action,
          remarks: remarksToSend || `Decision applied by source institution registrar`,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to record transfer decision');
      }

      const updated: TransferRequestItem = await res.json();
      const finalUpdated: TransferRequestItem = {
        ...updated,
        decision_note: remarksToSend || updated.decision_note || `Marked ${decisionItem.action}`,
        status: decisionItem.action,
        decided_at: updated.decided_at || new Date().toISOString(),
        decided_by: updated.decided_by || 'Source Institution Registrar',
      };

      setTransfers((prev) => prev.map((t) => (t.id === finalUpdated.id ? finalUpdated : t)));
      setDecisionItem(null);
      setDecisionNotes('');
      setReasonPreset('');
      setDecisionRef('');
    } catch (err) {
      console.error(err);
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const getStatusChip = (status: TransferStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>PENDING APPROVAL</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
            <Check className="w-3 h-3 text-green-600" />
            <span>APPROVED</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <X className="w-3 h-3 text-red-600" />
            <span>REJECTED</span>
          </span>
        );
      case 'OVERRIDDEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldAlert className="w-3 h-3 text-purple-600" />
            <span>AICTE OVERRIDDEN</span>
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100">{status}</span>;
    }
  };

  const incomingTransfers = transfers.filter((t) => t.direction === 'INCOMING');
  const outgoingTransfers = transfers.filter((t) => t.direction === 'OUTGOING');
  const currentList = activeTab === 'incoming' ? incomingTransfers : outgoingTransfers;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gov-navy">Inter-Institution Transfers</h2>
          <p className="text-xs text-slate-500 mt-1">
            Governed by Section 8.1: Destination requests, Source approves, AICTE 15-day statutory override
          </p>
        </div>
        <Button
          variant="default"
          onClick={() => setIsCreateModalOpen(true)}
          id="request-transfer-btn"
          className="bg-gov-navy hover:bg-gov-navyDark text-white flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Request Student Transfer</span>
        </Button>
      </div>

      {/* 15-DAY AICTE OVERRIDE NOTICE BANNER */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-900 text-sm">
            15-Day AICTE Statutory Override Rule (Agents.md §8.1)
          </p>
          <p className="text-amber-800 leading-relaxed">
            When a destination institution creates a transfer request, the source institution is granted exactly{' '}
            <strong>15 calendar days</strong> to decide (Approve or Reject with note). If left unaddressed beyond 15 days,
            the <strong>AICTE Central Desk</strong> automatically executes an administrative override.
            Approved or overridden transfers safely transition source records to{' '}
            <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono font-bold">TRANSFERRED_OUT</code>,
            guaranteeing that destination enrolment will not trigger duplicate student flags (Rule V010).
          </p>
        </div>
      </div>

      {/* TABS & TABLE */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('incoming')}
                id="tab-incoming-transfers"
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'incoming'
                    ? 'bg-gov-navy text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Incoming Transfer Requests</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'incoming' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {incomingTransfers.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('outgoing')}
                id="tab-outgoing-transfers"
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'outgoing'
                    ? 'bg-gov-navy text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Outgoing Transfer Requests</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'outgoing' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {outgoingTransfers.length}
                </span>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Table id="transfers-table">
            <TableHeader>
              <TableRow>
                <TableHead>Transfer ID</TableHead>
                <TableHead>APAAR ID</TableHead>
                <TableHead>{activeTab === 'incoming' ? 'Source Institution' : 'Destination Institution'}</TableHead>
                <TableHead>Target Program</TableHead>
                <TableHead className="min-w-[260px]">Reason & Decision Note</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">
                    Loading transfer workflow registry...
                  </TableCell>
                </TableRow>
              ) : currentList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">
                    No {activeTab} transfer requests found.
                  </TableCell>
                </TableRow>
              ) : (
                currentList.map((tr) => (
                  <TableRow key={tr.id} className="hover:bg-slate-50/80">
                    <TableCell className="font-mono text-xs font-bold text-slate-900">
                      {tr.id}
                      {tr.is_overdue_15_days && tr.status === 'PENDING' && (
                        <div className="mt-1">
                          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded border border-red-200 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span>15d OVERDUE</span>
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <MaskedValue value={tr.apaar_id} kind="apaar" className="text-xs font-mono font-semibold" />
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 max-w-xs">
                      <div className="font-semibold text-slate-900">
                        {activeTab === 'incoming' ? tr.from_institution_name : tr.to_institution_name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        AICTE ID: {activeTab === 'incoming' ? tr.from_institution_id : tr.to_institution_id}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium text-slate-800">
                      {tr.to_program_code}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-sm">
                      <div>
                        <span className="font-semibold text-slate-700">Request:</span>{' '}
                        <span>{tr.reason}</span>
                      </div>
                      {tr.evidence_ref && (
                        <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                          Ref: {tr.evidence_ref}
                        </span>
                      )}

                      {/* Prominent, structured Decision Reason badge */}
                      {tr.decision_note && (
                        <div
                          className={`mt-2 p-2.5 rounded-lg border text-xs leading-relaxed ${
                            tr.status === 'APPROVED'
                              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                              : tr.status === 'REJECTED'
                              ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                              : 'bg-purple-50/90 border-purple-200 text-purple-950'
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1.5 mb-1">
                            {tr.status === 'APPROVED' && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                            {tr.status === 'REJECTED' && (
                              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            )}
                            {tr.status === 'OVERRIDDEN' && (
                              <ShieldAlert className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            )}
                            <span className="uppercase text-[11px] tracking-wider font-extrabold">
                              {tr.status === 'APPROVED'
                                ? 'Approval Reason'
                                : tr.status === 'REJECTED'
                                ? 'Rejection Reason'
                                : 'Override Reason'}
                            </span>
                          </div>
                          <p className="font-medium text-slate-800 bg-white/70 p-1.5 rounded border border-black/5">
                            {tr.decision_note}
                          </p>
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                            {tr.decided_by && (
                              <span>
                                Decided by: <strong className="text-slate-700">{tr.decided_by}</strong>
                              </span>
                            )}
                            {tr.decided_at && (
                              <span className="font-mono">{new Date(tr.decided_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusChip(tr.status)}</TableCell>
                    <TableCell className="text-right">
                      {activeTab === 'incoming' && tr.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="saffron"
                            size="sm"
                            className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                            id={`approve-transfer-${tr.id}`}
                            data-testid={`approve-transfer-${tr.id}`}
                            onClick={() => {
                              setDecisionItem({ transfer: tr, action: 'APPROVED' });
                              setReasonPreset('');
                              setDecisionNotes('');
                              setDecisionRef('');
                            }}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2.5 text-red-700 hover:bg-red-50 hover:text-red-800 border-red-200"
                            id={`reject-transfer-${tr.id}`}
                            data-testid={`reject-transfer-${tr.id}`}
                            onClick={() => {
                              setDecisionItem({ transfer: tr, action: 'REJECTED' });
                              setReasonPreset('');
                              setDecisionNotes('');
                              setDecisionRef('');
                            }}
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-slate-500">
                            {tr.decided_at
                              ? `Decided ${new Date(tr.decided_at).toLocaleDateString()}`
                              : 'Awaiting Decision'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setViewingTransfer(tr)}
                            className="text-[11px] font-semibold text-gov-navy hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-gov-navy" />
                            <span>View Reason</span>
                          </button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CREATE TRANSFER MODAL (OUTGOING) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-gov-navy text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-gov-saffron" />
                  <span>Initiate Student Transfer Request</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Destination Institution Application per Section 8.1
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-5 space-y-4">
              {createSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{createSuccess}</span>
                </div>
              )}

              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="transfer-apaar-input" className="text-xs font-bold text-slate-700 block">
                  Student APAAR ID (12 Digits) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="transfer-apaar-input"
                  type="text"
                  required
                  placeholder="e.g. 984572912301"
                  value={apaarId}
                  onChange={(e) => setApaarId(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="source-institution-select" className="text-xs font-bold text-slate-700 block">
                  Source Institution (Search from Master) <span className="text-red-500">*</span>
                </label>
                <select
                  id="source-institution-select"
                  value={sourceInstitutionId}
                  onChange={(e) => {
                    setSourceInstitutionId(e.target.value);
                    const opt = e.target.selectedOptions[0];
                    if (opt) setSourceInstitutionName(opt.text.split('(')[0].trim());
                  }}
                  className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-gov-saffron font-medium"
                >
                  <option value="1-100010001">Delhi College of Engineering & Technology (1-100010001)</option>
                  <option value="1-100010002">Capital Institute of Technology Delhi (1-100010002)</option>
                  <option value="1-100010005">Maharashtra Institute of Technology Pune (1-100010005)</option>
                  <option value="1-100010010">Bengaluru Institute of Technology & Science (1-100010010)</option>
                  <option value="1-100010014">Chennai College of Engineering & Technology (1-100010014)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="target-program-select" className="text-xs font-bold text-slate-700 block">
                  Target Destination Program <span className="text-red-500">*</span>
                </label>
                <select
                  id="target-program-select"
                  value={targetProgram}
                  onChange={(e) => setTargetProgram(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-gov-saffron font-medium"
                >
                  <option value="UG-CSE">UG-CSE: B.Tech Computer Science & Engineering</option>
                  <option value="UG-ECE">UG-ECE: B.Tech Electronics & Communication Engineering</option>
                  <option value="UG-ME">UG-ME: B.Tech Mechanical Engineering</option>
                  <option value="PG-MBA">PG-MBA: Master of Business Administration</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="transfer-reason-input" className="text-xs font-bold text-slate-700 block">
                  Reason for Transfer Request <span className="text-red-500">*</span>
                </label>
                <Input
                  id="transfer-reason-input"
                  type="text"
                  required
                  placeholder="e.g. Parental relocation / Medical necessity / Mutual academic agreement"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="evidence-ref-input" className="text-xs font-bold text-slate-700 block">
                  Transfer Certificate (TC) / Order Reference
                </label>
                <Input
                  id="evidence-ref-input"
                  type="text"
                  placeholder="e.g. TC-2026-NCR-11 or GOV-RELOC-ORD"
                  value={evidenceRef}
                  onChange={(e) => setEvidenceRef(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="saffron"
                  size="sm"
                  disabled={isSubmitting || !apaarId || !reason}
                  id="submit-transfer-btn"
                >
                  {isSubmitting ? 'Transmitting Request...' : 'Submit Transfer Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECISION DIALOG (APPROVE / REJECT WITH STRUCTURED REASON) */}
      {decisionItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div
              className={`p-4 text-white flex items-center justify-between ${
                decisionItem.action === 'APPROVED' ? 'bg-emerald-700' : 'bg-rose-700'
              }`}
            >
              <h3 className="text-base font-bold flex items-center gap-2">
                {decisionItem.action === 'APPROVED' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span>
                  {decisionItem.action === 'APPROVED'
                    ? 'Approve Transfer Request'
                    : 'Reject Transfer Request'}
                </span>
              </h3>
              <button
                onClick={() => setDecisionItem(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteDecision} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Transfer Reference:</span>
                  <span className="font-mono font-bold text-slate-900">{decisionItem.transfer.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Student APAAR ID:</span>
                  <MaskedValue
                    value={decisionItem.transfer.apaar_id}
                    kind="apaar"
                    className="font-mono font-semibold"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Target Institution:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {decisionItem.transfer.to_institution_name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Target Program:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {decisionItem.transfer.to_program_code}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Student's Request Reason:</span>
                  <span className="text-slate-700 italic text-right truncate max-w-[240px]">
                    {decisionItem.transfer.reason}
                  </span>
                </div>

                {decisionItem.action === 'APPROVED' && (
                  <p className="text-green-800 font-semibold pt-1">
                    Notice: Approving will transition your source student record to TRANSFERRED_OUT.
                  </p>
                )}
                {decisionItem.action === 'REJECTED' && (
                  <p className="text-rose-800 font-semibold pt-1">
                    Notice: Rejecting will deny this transfer request. A valid documented reason is required.
                  </p>
                )}
              </div>

              {/* Reason Category Selector */}
              <div className="space-y-1.5">
                <label htmlFor="reason-preset-select" className="text-xs font-bold text-slate-700 block">
                  {decisionItem.action === 'APPROVED' ? 'Approval Reason Category' : 'Rejection Reason Category'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  id="reason-preset-select"
                  value={reasonPreset}
                  onChange={(e) => {
                    const val = e.target.value;
                    setReasonPreset(val);
                    if (val && val !== 'Other reason (specify details below)') {
                      setDecisionNotes(val);
                    }
                  }}
                  className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-gov-saffron font-medium"
                >
                  <option value="">-- Select Standard Regulatory Reason --</option>
                  {(decisionItem.action === 'APPROVED' ? APPROVAL_REASONS : REJECTION_REASONS).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {/* Quick Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(decisionItem.action === 'APPROVED' ? APPROVAL_QUICK_CHIPS : REJECTION_QUICK_CHIPS).map((chip) => (
                    <button
                      type="button"
                      key={chip.label}
                      onClick={() => {
                        setReasonPreset(chip.full);
                        setDecisionNotes(chip.full);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition font-medium cursor-pointer ${
                        reasonPreset === chip.full
                          ? decisionItem.action === 'APPROVED'
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                            : 'bg-rose-100 border-rose-400 text-rose-900 font-bold'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Decision Note / Remarks Textarea */}
              <div className="space-y-1.5">
                <label htmlFor="transfer-decision-notes" className="text-xs font-bold text-slate-700 block">
                  {decisionItem.action === 'APPROVED'
                    ? 'Registrar Approval Remarks & Terms'
                    : 'Registrar Rejection Reason & Justification'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="transfer-decision-notes"
                  required
                  rows={3}
                  placeholder={
                    decisionItem.action === 'APPROVED'
                      ? 'e.g. NOC granted by Academic Senate; TC dispatched'
                      : 'e.g. Disciplinary hold / pending semester dues / intake exceeded'
                  }
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-gov-saffron resize-none font-normal"
                />
                <p className="text-[10px] text-slate-400">
                  This justification will be permanently stamped in the tamper-evident audit log and shared with the destination institution.
                </p>
              </div>

              {/* Official Order / Reference Number */}
              <div className="space-y-1.5">
                <label htmlFor="decision-order-ref" className="text-xs font-bold text-slate-700 block">
                  Official Order / Resolution / Letter Reference <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  id="decision-order-ref"
                  type="text"
                  placeholder={
                    decisionItem.action === 'APPROVED'
                      ? 'e.g. NOC-2026-AUG-14 or SENATE-RES-402'
                      : 'e.g. REJECT-MEMO-88 or DUES-NOTICE-2026'
                  }
                  value={decisionRef}
                  onChange={(e) => setDecisionRef(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDecisionItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={decisionSubmitting || !decisionNotes.trim()}
                  id="confirm-decision-btn"
                  className={
                    decisionItem.action === 'APPROVED'
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : 'bg-rose-700 hover:bg-rose-800 text-white'
                  }
                >
                  {decisionSubmitting ? 'Recording Decision...' : `Confirm ${decisionItem.action}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT / REASON DETAILS MODAL */}
      {viewingTransfer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gov-navy text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-gov-saffron" />
                <h3 className="text-base font-bold">Transfer Decision & Reason Details</h3>
              </div>
              <button
                onClick={() => setViewingTransfer(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Transfer ID:</span>
                  <span className="font-mono font-bold text-slate-900">{viewingTransfer.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Student APAAR ID:</span>
                  <MaskedValue value={viewingTransfer.apaar_id} kind="apaar" className="font-mono font-semibold" />
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Decision Status:</span>
                  <div>{getStatusChip(viewingTransfer.status)}</div>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Source Institution:</span>
                  <span className="text-right font-medium text-slate-800">{viewingTransfer.from_institution_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Destination Institution:</span>
                  <span className="text-right font-medium text-slate-800">{viewingTransfer.to_institution_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Target Program:</span>
                  <span className="font-mono font-medium text-slate-800">{viewingTransfer.to_program_code}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Request Reason:</span>
                  <span className="text-right text-slate-700">{viewingTransfer.reason}</span>
                </div>
                {viewingTransfer.evidence_ref && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Transfer Certificate / Ref:</span>
                    <span className="font-mono text-slate-700">{viewingTransfer.evidence_ref}</span>
                  </div>
                )}
              </div>

              {/* Decision reason callout */}
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  viewingTransfer.status === 'APPROVED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : viewingTransfer.status === 'REJECTED'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : 'bg-purple-50 border-purple-200 text-purple-950'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {viewingTransfer.status === 'APPROVED' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {viewingTransfer.status === 'REJECTED' && <XCircle className="w-4 h-4 text-rose-600" />}
                  {viewingTransfer.status === 'OVERRIDDEN' && <ShieldAlert className="w-4 h-4 text-purple-600" />}
                  <span className="text-sm">
                    {viewingTransfer.status === 'APPROVED'
                      ? 'Official Approval Justification'
                      : viewingTransfer.status === 'REJECTED'
                      ? 'Official Rejection Justification'
                      : 'AICTE Statutory Override Justification'}
                  </span>
                </div>
                <p className="font-medium text-slate-800 leading-relaxed pt-1">
                  {viewingTransfer.decision_note || 'No additional decision note recorded.'}
                </p>
                <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex justify-between">
                  <span>
                    Decided By:{' '}
                    <strong className="text-slate-700">{viewingTransfer.decided_by || 'Source Registrar'}</strong>
                  </span>
                  <span>{viewingTransfer.decided_at ? new Date(viewingTransfer.decided_at).toLocaleString() : ''}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingTransfer(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
