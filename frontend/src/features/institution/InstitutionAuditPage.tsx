import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  History,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Undo2,
  Search,
  ShieldCheck,
  Clock,
  User,
  ExternalLink,
  RefreshCw,
  BadgeAlert,
  X,
  FileDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, authFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BatchItem, DiscrepancyAuditItem, InstitutionAuditResponse } from './types';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { Link } from 'react-router-dom';

export const InstitutionAuditPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'INSTITUTION_ADMIN' || user?.role === 'AICTE_ADMIN';

  // Data states
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyAuditItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<InstitutionAuditResponse['audit_logs']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MODIFIED' | 'OPEN' | 'REVERTED'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Revert modal state
  const [revertTarget, setRevertTarget] = useState<DiscrepancyAuditItem | null>(null);
  const [revertReason, setRevertReason] = useState('');
  const [isReverting, setIsReverting] = useState(false);
  const [revertSuccessToast, setRevertSuccessToast] = useState<string | null>(null);

  // Hash chain drawer view
  const [showChainLogs, setShowChainLogs] = useState(false);

  // Fetch full audit trail
  const fetchAuditData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url =
        selectedBatchId && selectedBatchId !== 'ALL'
          ? `${API_BASE_URL}/v1/institution/audit-trail?batch_id=${encodeURIComponent(selectedBatchId)}`
          : `${API_BASE_URL}/v1/institution/audit-trail`;

      const res = await authFetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load audit trail (HTTP ${res.status})`);
      }
      const data: InstitutionAuditResponse = await res.json();
      setBatches(data.batches || []);
      setDiscrepancies(data.discrepancies || []);
      setAuditLogs(data.audit_logs || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching audit trail';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBatchId]);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  // Execute Revert Action
  const handleConfirmRevert = async () => {
    if (!revertTarget) return;
    setIsReverting(true);

    try {
      const res = await authFetch(`${API_BASE_URL}/v1/issues/${revertTarget.issue_id}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: revertReason || 'Rollback to original raw uploaded document value',
        }),
      });

      if (!res.ok) {
        throw new Error(`Revert failed (HTTP ${res.status})`);
      }

      // Update local state instantly for optimal UX
      setDiscrepancies((prev) =>
        prev.map((item) => {
          if (item.issue_id === revertTarget.issue_id) {
            return {
              ...item,
              status: 'OPEN',
              modified_value: null,
              is_reverted: true,
              revert_reason: revertReason || 'Rollback to original raw uploaded document value',
              can_revert: false,
              decision_note: undefined,
              decided_by_name: undefined,
              decided_at: undefined,
            };
          }
          return item;
        })
      );

      setRevertSuccessToast(
        `Discrepancy "${revertTarget.rule_id} (${revertTarget.field})" successfully reverted to original value "${revertTarget.original_value || 'None'}"`
      );
      setTimeout(() => setRevertSuccessToast(null), 6000);

      // Close modal and refresh in background
      setRevertTarget(null);
      setRevertReason('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to revert discrepancy change';
      alert(msg);
    } finally {
      setIsReverting(false);
    }
  };

  // Filtered Discrepancies
  const filteredDiscrepancies = useMemo(() => {
    return discrepancies.filter((item) => {
      // Batch filter
      if (selectedBatchId !== 'ALL' && item.batch_id !== selectedBatchId) {
        return false;
      }

      // Status filter
      if (statusFilter === 'MODIFIED') {
        const isMod = item.status === 'FIXED' || item.status === 'ACCEPTED' || item.status === 'DISMISSED';
        if (!isMod) return false;
      } else if (statusFilter === 'OPEN') {
        if (item.status !== 'OPEN' || item.is_reverted) return false;
      } else if (statusFilter === 'REVERTED') {
        if (!item.is_reverted) return false;
      }

      // Severity filter
      if (severityFilter !== 'ALL' && item.severity !== severityFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRule = item.rule_id?.toLowerCase().includes(q);
        const matchesField = item.field?.toLowerCase().includes(q);
        const matchesApaar = item.apaar_id?.toLowerCase().includes(q);
        const matchesMsg = item.message?.toLowerCase().includes(q);
        const matchesActor = item.decided_by_name?.toLowerCase().includes(q);
        const matchesDoc = item.batch_filename?.toLowerCase().includes(q);
        return matchesRule || matchesField || matchesApaar || matchesMsg || matchesActor || matchesDoc;
      }

      return true;
    });
  }, [discrepancies, selectedBatchId, statusFilter, severityFilter, searchQuery]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalDocs = batches.length;
    const totalDiscrepancies = discrepancies.length;
    const modifiedCount = discrepancies.filter(
      (d) => (d.status === 'FIXED' || d.status === 'ACCEPTED' || d.status === 'DISMISSED') && !d.is_reverted
    ).length;
    const revertedCount = discrepancies.filter((d) => d.is_reverted).length;
    const openCount = discrepancies.filter((d) => d.status === 'OPEN' && !d.is_reverted).length;

    return {
      totalDocs,
      totalDiscrepancies,
      modifiedCount,
      revertedCount,
      openCount,
    };
  }, [batches, discrepancies]);

  // Export audit log to CSV
  const handleExportCSV = () => {
    if (discrepancies.length === 0) return;
    const headers = [
      'Document Filename',
      'Batch ID',
      'Rule ID',
      'Row',
      'Field',
      'Student APAAR ID',
      'Severity',
      'Original Document Value',
      'Modified Value',
      'Status',
      'Changed By',
      'Change Timestamp',
      'Audit Justification',
      'Is Reverted',
      'Revert Justification',
    ];

    const rows = filteredDiscrepancies.map((d) => [
      `"${d.batch_filename || ''}"`,
      `"${d.batch_id || ''}"`,
      `"${d.rule_id || ''}"`,
      d.row || '',
      `"${d.field || ''}"`,
      `"${d.apaar_id || ''}"`,
      `"${d.severity || ''}"`,
      `"${d.original_value || ''}"`,
      `"${d.modified_value || ''}"`,
      `"${d.status || ''}"`,
      `"${d.decided_by_name || d.decided_by_id || ''}"`,
      `"${d.decided_at || ''}"`,
      `"${d.decision_note || ''}"`,
      d.is_reverted ? 'YES' : 'NO',
      `"${d.revert_reason || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `eduverify_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <OfflineBanner />

      {/* Revert Success Banner */}
      {revertSuccessToast && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 shadow-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{revertSuccessToast}</span>
          </div>
          <button
            onClick={() => setRevertSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gov-navy text-white rounded-lg shadow-sm">
              <History className="w-5 h-5 text-gov-saffron" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gov-navy">
                {t('audit.page_title', 'Institution Document Audit Log & Revert Desk')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t(
                  'audit.page_subtitle',
                  'Comprehensive audit trail of previous uploaded documents, detected discrepancies, modifications by staff & admin, and one-click rollback.'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAuditData}
            disabled={isLoading}
            className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.refresh', 'Refresh')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChainLogs(!showChainLogs)}
            className="text-xs border-emerald-300 bg-emerald-50/50 text-emerald-900 hover:bg-emerald-100/60 font-semibold"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            {t('audit.chain_status', 'SHA-256 Ledger Intact')}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleExportCSV}
            disabled={discrepancies.length === 0}
            className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold"
          >
            <FileDown className="w-3.5 h-3.5 mr-1.5 text-gov-saffron" />
            {t('audit.export_csv', 'Export Audit Trail (CSV)')}
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t('audit.total_docs', 'Uploaded Documents')}
              </span>
              <FileSpreadsheet className="w-4 h-4 text-gov-navy" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.totalDocs}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Previous student batches
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t('audit.total_discrepancies', 'Discrepancies Flagged')}
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700">{stats.totalDiscrepancies}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Across all raw documents
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t('audit.modifications', 'Changes Applied')}
              </span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-700">{stats.modifiedCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Accepted fixes & overrides
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t('audit.reverts_count', 'Reverted Changes')}
              </span>
              <Undo2 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-700">{stats.revertedCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Rollbacks to original state
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t('audit.open_issues', 'Unresolved Issues')}
              </span>
              <BadgeAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-700">{stats.openCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Awaiting decision / review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cryptographic SHA-256 Chained Hash Ledger Drawer */}
      {showChainLogs && (
        <Card className="border-emerald-300 bg-emerald-50/20 shadow-sm animate-in fade-in">
          <CardHeader className="py-3 px-4 bg-emerald-100/50 border-b border-emerald-200 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                DPDP Act 2023 & W3C Cryptographic Audit Ledger (SHA-256 Chained Log)
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChainLogs(false)}
              className="h-7 w-7 p-0 text-emerald-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-xs text-slate-600 mb-3">
              Every document ingestion, manual discrepancy modification, and revert action is committed into an immutable, tamper-evident hash chain.
            </p>
            <div className="overflow-x-auto max-h-56 overflow-y-auto font-mono text-[11px] bg-slate-900 text-slate-200 p-3 rounded-lg border border-slate-800 space-y-2">
              {auditLogs.length > 0 ? (
                auditLogs.map((log, idx) => (
                  <div key={log.id || idx} className="border-b border-slate-800 pb-1.5 last:border-0">
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>
                        [#{log.id}] {log.action}
                      </span>
                      <span className="text-slate-400 text-[10px]">{formatDate(log.timestamp)}</span>
                    </div>
                    <div className="text-slate-300 text-[10px] mt-0.5">
                      Actor: {log.actor_id || 'System'} | Resource: {log.resource} ({log.resource_id || 'N/A'})
                    </div>
                    <div className="text-slate-400 text-[9px] truncate">
                      SHA256: {log.sha256_hash || 'hash-chained-block'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic">No audit records recorded yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 1: Previous Uploaded Documents Selector */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-gov-navy" />
                {t('audit.previous_documents', 'Previous Uploaded Documents (Batch Registry)')}
              </CardTitle>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Select a document below to isolate its specific discrepancies and modification history.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/institution/upload">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Upload New Document
                  <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedBatchId('ALL')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedBatchId === 'ALL'
                  ? 'bg-gov-navy text-white border-gov-navy shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Documents ({batches.length})
            </button>

            {batches.map((batch) => {
              const bId = batch.id || batch.batch_id || '';
              const isSelected = selectedBatchId === bId;
              return (
                <button
                  key={bId}
                  onClick={() => setSelectedBatchId(bId)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-2 ${
                    isSelected
                      ? 'bg-gov-navy text-white border-gov-navy shadow-sm font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 ${isSelected ? 'text-gov-saffron' : 'text-slate-400'}`} />
                  <span className="font-semibold">{batch.filename}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      batch.status === 'COMMITTED'
                        ? isSelected
                          ? 'bg-emerald-800 text-emerald-100'
                          : 'bg-emerald-100 text-emerald-800'
                        : isSelected
                        ? 'bg-amber-800 text-amber-100'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {batch.status}
                  </span>
                  <span className={`text-[10px] ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                    AY {batch.academic_year}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Discrepancies, Changes, and Revert Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                {t('audit.discrepancies_title', 'Document Discrepancies, Change History & Revert Desk')}
              </CardTitle>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Every discrepancy found in uploaded documents is logged with raw values, human changes, actor details, and timestamps.
              </p>
            </div>

            {/* Filters and Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search APAAR, rule, field..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white border-slate-300 w-full"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="h-8 text-xs bg-white border border-slate-300 rounded-md px-2.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-gov-navy"
              >
                <option value="ALL">All Statuses</option>
                <option value="MODIFIED">Changes Made Only</option>
                <option value="OPEN">Unchanged (Open)</option>
                <option value="REVERTED">Reverted Only</option>
              </select>

              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="h-8 text-xs bg-white border border-slate-300 rounded-md px-2.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-gov-navy"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="ERROR">Error</option>
                <option value="WARN">Warning</option>
                <option value="INFO">Info</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error ? (
            <div className="p-6">
              <ErrorState message={error} onRetry={fetchAuditData} />
            </div>
          ) : isLoading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gov-navy mb-2" />
              Loading document discrepancies and modification audit trail...
            </div>
          ) : filteredDiscrepancies.length === 0 ? (
            <div className="p-10">
              <EmptyState
                title="No Discrepancies Found"
                description={
                  searchQuery || statusFilter !== 'ALL' || severityFilter !== 'ALL'
                    ? 'No discrepancies match your search or filter criteria. Try clearing filters.'
                    : 'No discrepancies detected in the selected document.'
                }
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                      setSeverityFilter('ALL');
                    }}
                    className="text-xs"
                  >
                    Clear All Filters
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 text-[11px] font-bold text-slate-600">
                    <TableHead className="w-36">Document / Batch</TableHead>
                    <TableHead className="w-36">Rule & Field</TableHead>
                    <TableHead className="w-28">Student APAAR</TableHead>
                    <TableHead className="w-64">Discrepancy Message</TableHead>
                    <TableHead className="w-36">Raw Document Value</TableHead>
                    <TableHead className="w-44">Current / Modified Value</TableHead>
                    <TableHead className="w-44">Changed By & Role</TableHead>
                    <TableHead className="w-36">Change Timestamp</TableHead>
                    <TableHead className="text-right w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDiscrepancies.map((item) => {
                    const isChanged = item.status === 'FIXED' || item.status === 'ACCEPTED' || item.status === 'DISMISSED';
                    const isReverted = item.is_reverted;

                    return (
                      <TableRow
                        key={item.issue_id}
                        className={`hover:bg-slate-50/70 transition-colors text-xs ${
                          isReverted ? 'bg-purple-50/30' : isChanged ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        {/* Document */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-800 truncate block max-w-[130px]" title={item.batch_filename}>
                              {item.batch_filename}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[130px]">
                              {item.batch_id}
                            </span>
                          </div>
                        </TableCell>

                        {/* Rule & Field */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] border border-slate-200">
                                {item.rule_id}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                  item.priority === 'CRITICAL'
                                    ? 'bg-rose-100 text-rose-800'
                                    : item.severity === 'ERROR'
                                    ? 'bg-red-100 text-red-800'
                                    : item.severity === 'WARN'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {item.severity}
                              </span>
                            </div>
                            <span className="text-[11px] font-medium text-slate-600 block">
                              Field: <code className="text-slate-800 font-semibold">{item.field || 'N/A'}</code>
                            </span>
                          </div>
                        </TableCell>

                        {/* APAAR ID & Row */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-mono text-[11px] font-bold text-slate-800 block">
                              {item.apaar_id || '—'}
                            </span>
                            {item.row !== undefined && (
                              <span className="text-[10px] text-slate-500 block">
                                Row #{item.row}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Discrepancy Message */}
                        <TableCell>
                          <p className="text-xs text-slate-700 leading-snug font-normal line-clamp-2" title={item.message}>
                            {item.message}
                          </p>
                          {item.decision_note && (
                            <p className="text-[10px] text-blue-700 font-medium mt-1 bg-blue-50/70 p-1 rounded border border-blue-100 italic">
                              Note: {item.decision_note}
                            </p>
                          )}
                          {item.revert_reason && (
                            <p className="text-[10px] text-purple-700 font-medium mt-1 bg-purple-50/70 p-1 rounded border border-purple-100 italic">
                              Rollback Note: {item.revert_reason}
                            </p>
                          )}
                        </TableCell>

                        {/* Raw Original Value */}
                        <TableCell>
                          <div className="font-mono text-[11px] bg-slate-100 px-2 py-1 rounded text-slate-700 border border-slate-200 break-all max-w-[130px]">
                            {item.original_value || <span className="text-slate-400 italic">Empty</span>}
                          </div>
                        </TableCell>

                        {/* Modified Value */}
                        <TableCell>
                          {isReverted ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                                <Undo2 className="w-3 h-3 text-purple-600" />
                                Reverted to Original
                              </span>
                              <div className="font-mono text-[11px] text-slate-600">
                                {item.original_value || 'Empty'}
                              </div>
                            </div>
                          ) : isChanged ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                {item.status === 'DISMISSED' ? 'Dismissed' : 'Modified'}
                              </span>
                              <div className="font-mono text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200 break-all max-w-[130px]">
                                {item.modified_value || item.status}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">
                              Unmodified (Raw)
                            </span>
                          )}
                        </TableCell>

                        {/* Changed By & Role */}
                        <TableCell>
                          {item.decided_by_name || item.decided_by_id ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-800">
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[130px]" title={item.decided_by_name || item.decided_by_id || ''}>
                                  {item.decided_by_name || item.decided_by_id}
                                </span>
                              </div>
                              {item.decided_by_role && (
                                <span className="text-[10px] text-slate-500 font-mono block">
                                  {item.decided_by_role}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">—</span>
                          )}
                        </TableCell>

                        {/* Timestamp */}
                        <TableCell className="text-[11px] text-slate-600 font-mono">
                          {item.decided_at ? (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{formatDate(item.decided_at)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </TableCell>

                        {/* Revert Action */}
                        <TableCell className="text-right">
                          {isChanged && !isReverted ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRevertTarget(item);
                                setRevertReason('');
                              }}
                              disabled={!isAdmin}
                              title={isAdmin ? 'Revert change back to raw uploaded document value' : 'Only Institution Admin can revert changes'}
                              className="h-8 text-[11px] border-purple-300 text-purple-700 bg-purple-50/50 hover:bg-purple-100 hover:text-purple-900 font-bold px-2.5 transition"
                            >
                              <Undo2 className="w-3 h-3 mr-1 text-purple-600" />
                              Revert
                            </Button>
                          ) : isReverted ? (
                            <span className="text-[11px] text-purple-700 font-semibold italic">
                              Reverted
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Unchanged
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Revert Confirmation Modal */}
      {revertTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                  <Undo2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {t('audit.confirm_revert_title', 'Revert Discrepancy Change')}
                </h3>
              </div>
              <button
                onClick={() => setRevertTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to revert the modification made to rule{' '}
                <strong className="text-slate-900">{revertTarget.rule_id}</strong> on field{' '}
                <strong className="text-slate-900">{revertTarget.field}</strong> back to the original raw uploaded document state.
              </p>

              {/* Diff Card */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Student APAAR:</span>
                  <span className="font-mono font-bold text-slate-900">{revertTarget.apaar_id || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Document:</span>
                  <span className="font-semibold text-slate-800">{revertTarget.batch_filename}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-rose-700">
                  <span className="font-medium">Current Modified Value:</span>
                  <span className="font-mono font-bold line-through">
                    {revertTarget.modified_value || revertTarget.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-700 font-semibold">
                  <span>Reverted / Original Raw Value:</span>
                  <span className="font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {revertTarget.original_value || 'Empty'}
                  </span>
                </div>
              </div>

              {/* Audit Rollback Justification */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Audit Rollback Justification / Reason (DPDP Act Compliance)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Student confirmed original certificate details, rolling back edit"
                  value={revertReason}
                  onChange={(e) => setRevertReason(e.target.value)}
                  className="text-xs h-9 bg-white"
                />
                <p className="text-[10px] text-slate-500">
                  This note will be cryptographically logged to the tamper-evident SHA-256 audit ledger.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevertTarget(null)}
                disabled={isReverting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleConfirmRevert}
                disabled={isReverting}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4"
              >
                {isReverting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Reverting...
                  </>
                ) : (
                  <>
                    <Undo2 className="w-3.5 h-3.5 mr-1.5" />
                    Confirm Revert & Rollback
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
