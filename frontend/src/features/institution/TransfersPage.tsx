import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { MaskedValue } from '@/components/shared/MaskedValue';
import { API_BASE_URL, fetchWithAuth } from '@/lib/api';
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
} from 'lucide-react';

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
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${API_BASE_URL}/v1/transfers`);
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

      const res = await fetchWithAuth(`${API_BASE_URL}/v1/transfers`, {
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
      const res = await fetchWithAuth(`${API_BASE_URL}/v1/transfers/${decisionItem.transfer.id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionItem.action,
          remarks: decisionNotes.trim() || `Decision applied by source institution registrar`,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to record transfer decision');
      }

      const updated: TransferRequestItem = await res.json();
      setTransfers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setDecisionItem(null);
      setDecisionNotes('');
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
                <TableHead>Reason</TableHead>
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
                    <TableCell className="text-xs text-slate-600 max-w-xs">
                      <p>{tr.reason}</p>
                      {tr.evidence_ref && (
                        <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                          Ref: {tr.evidence_ref}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusChip(tr.status)}</TableCell>
                    <TableCell className="text-right">
                      {activeTab === 'incoming' && tr.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="saffron"
                            size="sm"
                            className="text-xs h-7 px-2.5"
                            id={`approve-transfer-${tr.id}`}
                            data-testid={`approve-transfer-${tr.id}`}
                            onClick={() => setDecisionItem({ transfer: tr, action: 'APPROVED' })}
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
                            onClick={() => setDecisionItem({ transfer: tr, action: 'REJECTED' })}
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {tr.decided_at ? `Decided ${new Date(tr.decided_at).toLocaleDateString()}` : 'Awaiting Source'}
                        </span>
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

      {/* DECISION DIALOG (APPROVE / REJECT WITH NOTE) */}
      {decisionItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className={`p-4 text-white flex items-center justify-between ${
              decisionItem.action === 'APPROVED' ? 'bg-green-700' : 'bg-red-700'
            }`}>
              <h3 className="text-base font-bold flex items-center gap-2">
                {decisionItem.action === 'APPROVED' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                <span>{decisionItem.action === 'APPROVED' ? 'Approve Transfer Request' : 'Reject Transfer Request'}</span>
              </h3>
              <button
                onClick={() => setDecisionItem(null)}
                className="text-white/80 hover:text-white p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteDecision} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <p className="font-semibold text-slate-800">
                  Transfer Ref: <span className="font-mono">{decisionItem.transfer.id}</span>
                </p>
                <p className="text-slate-600">
                  Student APAAR: <MaskedValue value={decisionItem.transfer.apaar_id} kind="apaar" className="font-mono" />
                </p>
                <p className="text-slate-600">
                  Target Institution: {decisionItem.transfer.to_institution_name}
                </p>
                {decisionItem.action === 'APPROVED' && (
                  <p className="text-green-800 font-semibold pt-1">
                    Notice: Approving will transition your source student record to TRANSFERRED_OUT.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="transfer-decision-notes" className="text-xs font-bold text-slate-700 block">
                  Registrar Decision Note / Remarks <span className="text-red-500">*</span>
                </label>
                <Input
                  id="transfer-decision-notes"
                  type="text"
                  required
                  placeholder={
                    decisionItem.action === 'APPROVED'
                      ? 'e.g. NOC granted by Academic Senate; TC dispatched'
                      : 'e.g. Disciplinary hold / pending semester dues / intake exceeded'
                  }
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="text-xs"
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
                  className={decisionItem.action === 'APPROVED' ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-red-700 hover:bg-red-800 text-white'}
                >
                  {decisionSubmitting ? 'Recording Decision...' : `Confirm ${decisionItem.action}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
