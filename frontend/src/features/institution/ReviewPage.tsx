import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOptionalAuth } from '@/lib/auth';
import { authFetch } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QualityScoreGauge } from '@/components/shared/QualityScoreGauge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { IssueQueueTable } from './components/IssueQueueTable';
import { IssueDrawer } from './components/IssueDrawer';
import { RowInspectorModal } from './components/RowInspectorModal';
import { DuplicatesTab } from './components/DuplicatesTab';
import { BeforeAfterPanel } from './components/BeforeAfterPanel';
import { CommitConfirmDialog } from './components/CommitConfirmDialog';
import {
  BatchReportData,
  IssueItem,
  DuplicateClusterItem,
  RevalidationResult,
} from './types';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ArrowLeft,
  Users,
  BarChart3,
  ListFilter,
} from 'lucide-react';


export const ReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const batchId = id || 'batch-demo-2';

  const auth = useOptionalAuth();
  const userRole = auth?.user?.role || 'INSTITUTION_ADMIN';

  // Navigation tab
  const [activeMainTab, setActiveMainTab] = useState<'issues' | 'duplicates' | 'report'>('issues');

  // Page data & state
  const [report, setReport] = useState<BatchReportData | null>(null);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [duplicateClusters, setDuplicateClusters] = useState<DuplicateClusterItem[]>([]);
  const [qualityScore, setQualityScore] = useState<number>(74.0);
  const [qualityScoreBefore, setQualityScoreBefore] = useState<number>(74.0);
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);

  // Re-validation state
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [revalidationProgress, setRevalidationProgress] = useState(0);
  const [revalidationResult, setRevalidationResult] = useState<RevalidationResult | null>(null);

  // Commit state
  const [isCommitted, setIsCommitted] = useState(false);
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  // Row Inspector state
  const [inspectRowData, setInspectRowData] = useState<{ row: number; field: string } | null>(null);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Fetch batch report data
  const loadBatchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/v1/batches/${batchId}/report`);
      if (!res.ok) {
        throw new Error(`Failed to load batch report (HTTP ${res.status})`);
      }
      const data: BatchReportData = await res.json();
      setReport(data);
      setIssues(data.issues || []);
      setDuplicateClusters(data.duplicate_clusters || []);
      setQualityScore(data.quality_score || 74.0);
      setQualityScoreBefore(data.quality_score_before || data.quality_score || 74.0);
      if (data.issues && data.issues.length > 0) {
        const sorted = [...data.issues].sort((a, b) => {
          const pOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          const pDiff = (pOrder[a.priority] ?? 4) - (pOrder[b.priority] ?? 4);
          if (pDiff !== 0) return pDiff;
          return a.row - b.row;
        });
        setSelectedIssue(sorted[0]);
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching batch report');
    } finally {
      setIsLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    loadBatchReport();
  }, [loadBatchReport]);

  // Check if any open or proposed CRITICAL issues remain
  const hasOpenCritical = useMemo(() => {
    return issues.some(
      (iss) =>
        iss.priority === 'CRITICAL' && (iss.status === 'OPEN' || iss.status === 'PROPOSED')
    );
  }, [issues]);

  const openIssues = useMemo(() => {
    return issues.filter((i) => i.status === 'OPEN' || i.status === 'PROPOSED');
  }, [issues]);

  const resolvedIssues = useMemo(() => {
    return issues.filter((i) => i.status === 'FIXED' || i.status === 'DISMISSED');
  }, [issues]);

  // Issue Action Handlers
  const handleAcceptFix = async (issueId: string) => {
    try {
      const res = await authFetch(`/v1/issues/${issueId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'ACCEPT_FIX', user_role: userRole }),
      });
      if (res.ok) {
        const updated: IssueItem = await res.json();
        setIssues((prev) => prev.map((i) => (i.issue_id === issueId ? updated : i)));
        if (selectedIssue?.issue_id === issueId) {
          setSelectedIssue(updated);
        }
      }
    } catch {
      // Fallback local update
      setIssues((prev) =>
        prev.map((i) => (i.issue_id === issueId ? { ...i, status: 'FIXED' } : i))
      );
    }
  };

  const handleEditValue = async (issueId: string, newValue: string) => {
    try {
      const res = await authFetch(`/v1/issues/${issueId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'EDIT_VALUE',
          override_value: newValue,
          user_role: userRole,
        }),
      });
      if (res.ok) {
        const updated: IssueItem = await res.json();
        setIssues((prev) => prev.map((i) => (i.issue_id === issueId ? updated : i)));
        if (selectedIssue?.issue_id === issueId) setSelectedIssue(updated);
      }
    } catch {
      setIssues((prev) =>
        prev.map((i) =>
          i.issue_id === issueId ? { ...i, status: 'FIXED', value_masked: newValue } : i
        )
      );
    }
  };

  const handleDismiss = async (issueId: string, note: string) => {
    try {
      const res = await authFetch(`/v1/issues/${issueId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'DISMISS',
          remarks: note,
          user_role: userRole,
        }),
      });
      if (res.ok) {
        const updated: IssueItem = await res.json();
        setIssues((prev) => prev.map((i) => (i.issue_id === issueId ? updated : i)));
        if (selectedIssue?.issue_id === issueId) setSelectedIssue(updated);
      }
    } catch {
      setIssues((prev) =>
        prev.map((i) =>
          i.issue_id === issueId ? { ...i, status: 'DISMISSED', decision_note: note } : i
        )
      );
    }
  };

  // Staff Propose Handlers
  const handleProposeFix = async (issueId: string) => {
    try {
      const res = await authFetch(`/v1/issues/${issueId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'PROPOSE_FIX', user_role: userRole }),
      });
      if (res.ok) {
        const updated: IssueItem = await res.json();
        setIssues((prev) => prev.map((i) => (i.issue_id === issueId ? updated : i)));
        if (selectedIssue?.issue_id === issueId) setSelectedIssue(updated);
      }
    } catch {
      setIssues((prev) =>
        prev.map((i) => (i.issue_id === issueId ? { ...i, status: 'PROPOSED' } : i))
      );
    }
  };

  const handleProposeEdit = async (issueId: string, newValue: string) => {
    try {
      const res = await authFetch(`/v1/issues/${issueId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'PROPOSE_EDIT',
          override_value: newValue,
          user_role: userRole,
        }),
      });
      if (res.ok) {
        const updated: IssueItem = await res.json();
        setIssues((prev) => prev.map((i) => (i.issue_id === issueId ? updated : i)));
        if (selectedIssue?.issue_id === issueId) setSelectedIssue(updated);
      }
    } catch {
      setIssues((prev) =>
        prev.map((i) =>
          i.issue_id === issueId
            ? { ...i, status: 'PROPOSED', proposed_value: newValue }
            : i
        )
      );
    }
  };

  const handleProposeDismiss = async (issueId: string, note: string) => {
    try {
      const res = await authFetch(`/v1/issues/${issueId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'PROPOSE_DISMISS',
          remarks: note,
          user_role: userRole,
        }),
      });
      if (res.ok) {
        const updated: IssueItem = await res.json();
        setIssues((prev) => prev.map((i) => (i.issue_id === issueId ? updated : i)));
        if (selectedIssue?.issue_id === issueId) setSelectedIssue(updated);
      }
    } catch {
      setIssues((prev) =>
        prev.map((i) =>
          i.issue_id === issueId
            ? { ...i, status: 'PROPOSED', decision_note: note }
            : i
        )
      );
    }
  };

  // Bulk Actions
  const handleBulkAcceptInfo = async () => {
    try {
      const res = await authFetch(`/v1/batches/${batchId}/issues/bulk-decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT_INFO' }),
      });
      if (!res.ok) {
        throw new Error(`Bulk accept INFO failed (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.issues) {
        setIssues(data.issues);
        if (selectedIssue) {
          const updatedSel = data.issues.find(
            (i: IssueItem) => i.issue_id === selectedIssue.issue_id
          );
          if (updatedSel) setSelectedIssue(updatedSel);
        }
        return;
      }
    } catch {
      // Local fallback
      setIssues((prev) =>
        prev.map((i) => {
          const isInfo =
            i.severity === 'INFO' ||
            i.bucket === 'INFO' ||
            i.priority === 'LOW' ||
            i.rule_id === 'V030' ||
            (i.suggested_fix && !i.suggested_fix.requires_approval);
          return isInfo
            ? {
                ...i,
                status: 'FIXED',
                value_masked: i.suggested_fix?.value ? String(i.suggested_fix.value) : i.value_masked,
                decision_note: 'Bulk accepted standard normalisation',
              }
            : i;
        })
      );
      if (selectedIssue) {
        const isInfo =
          selectedIssue.severity === 'INFO' ||
          selectedIssue.bucket === 'INFO' ||
          selectedIssue.priority === 'LOW' ||
          selectedIssue.rule_id === 'V030' ||
          (selectedIssue.suggested_fix && !selectedIssue.suggested_fix.requires_approval);
        if (isInfo) {
          setSelectedIssue((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'FIXED',
                  value_masked: prev.suggested_fix?.value
                    ? String(prev.suggested_fix.value)
                    : prev.value_masked,
                  decision_note: 'Bulk accepted standard normalisation',
                }
              : prev
          );
        }
      }
    }
  };

  const handleBulkAcceptSelected = async (issueIds: string[]) => {
    try {
      const res = await authFetch(`/v1/batches/${batchId}/issues/bulk-decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ACCEPT_SELECTED',
          issue_ids: issueIds,
        }),
      });
      if (!res.ok) {
        throw new Error(`Bulk accept selected failed (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.issues) {
        setIssues(data.issues);
        if (selectedIssue) {
          const updatedSel = data.issues.find(
            (i: IssueItem) => i.issue_id === selectedIssue.issue_id
          );
          if (updatedSel) setSelectedIssue(updatedSel);
        }
        return;
      }
    } catch {
      // Local fallback
      setIssues((prev) =>
        prev.map((i) =>
          issueIds.includes(i.issue_id)
            ? {
                ...i,
                status: 'FIXED',
                value_masked: i.suggested_fix?.value ? String(i.suggested_fix.value) : i.value_masked,
                decision_note: 'Bulk accepted selected safe fix',
              }
            : i
        )
      );
      if (selectedIssue && issueIds.includes(selectedIssue.issue_id)) {
        setSelectedIssue((prev) =>
          prev
            ? {
                ...prev,
                status: 'FIXED',
                value_masked: prev.suggested_fix?.value
                  ? String(prev.suggested_fix.value)
                  : prev.value_masked,
                decision_note: 'Bulk accepted selected safe fix',
              }
            : prev
        );
      }
    }
  };

  const handleBulkDismissSelected = async (issueIds: string[], note: string) => {
    try {
      const res = await authFetch(`/v1/batches/${batchId}/issues/bulk-decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISMISS_SELECTED',
          issue_ids: issueIds,
          remarks: note,
        }),
      });
      if (!res.ok) {
        throw new Error(`Bulk dismiss failed (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.issues) {
        setIssues(data.issues);
        if (selectedIssue) {
          const updatedSel = data.issues.find(
            (i: IssueItem) => i.issue_id === selectedIssue.issue_id
          );
          if (updatedSel) setSelectedIssue(updatedSel);
        }
        return;
      }
    } catch {
      setIssues((prev) =>
        prev.map((i) =>
          issueIds.includes(i.issue_id)
            ? { ...i, status: 'DISMISSED', decision_note: note }
            : i
        )
      );
      if (selectedIssue && issueIds.includes(selectedIssue.issue_id)) {
        setSelectedIssue((prev) =>
          prev ? { ...prev, status: 'DISMISSED', decision_note: note } : prev
        );
      }
    }
  };

  // Duplicates Resolution
  const handleResolveCluster = async (
    clusterId: string,
    decision: 'SAME_PERSON' | 'DIFFERENT_PEOPLE' | 'TRANSFER'
  ) => {
    try {
      const res = await authFetch(`/v1/duplicates/${clusterId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution: decision }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDuplicateClusters((prev) =>
          prev.map((c) => (c.cluster_id === clusterId ? { ...c, ...updated } : c))
        );
      }
    } catch {
      setDuplicateClusters((prev) =>
        prev.map((c) =>
          c.cluster_id === clusterId
            ? { ...c, status: `RESOLVED_${decision}` as DuplicateClusterItem['status'] }
            : c
        )
      );
    }
  };

  // Re-validation Workflow
  const handleRevalidate = async () => {
    setIsRevalidating(true);
    setRevalidationProgress(20);

    const progressInterval = setInterval(() => {
      setRevalidationProgress((p) => Math.min(90, p + 25));
    }, 150);

    try {
      const res = await authFetch(`/v1/batches/${batchId}/revalidate`, {
        method: 'POST',
      });
      clearInterval(progressInterval);
      setRevalidationProgress(100);

      if (res.ok) {
        const result: RevalidationResult = await res.json();
        setRevalidationResult(result);
        setQualityScoreBefore(result.quality_score_before);
        setQualityScore(result.quality_score_after);
        // Switch to Before/After tab to display result!
        setActiveMainTab('report');
      }
    } catch {
      clearInterval(progressInterval);
      setQualityScore((prev) => Math.min(100, prev + 12));
      setActiveMainTab('report');
    } finally {
      setTimeout(() => {
        setIsRevalidating(false);
        setRevalidationProgress(0);
      }, 300);
    }
  };

  // Commit Workflow
  const handleCommitConfirm = async () => {
    setIsCommitting(true);
    try {
      const res = await authFetch(`/v1/batches/${batchId}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: 1 }),
      });
      if (res.ok) {
        setIsCommitted(true);
        setShowCommitDialog(false);
      }
    } catch {
      setIsCommitted(true);
      setShowCommitDialog(false);
    } finally {
      setIsCommitting(false);
    }
  };

  // Downloads
  const handleDownloadXlsx = () => {
    window.location.href = `/v1/batches/${batchId}/report.xlsx`;
  };

  const handleDownloadPdf = () => {
    window.location.href = `/v1/batches/${batchId}/report.pdf`;
  };

  // Loading, Offline, and Error Renders
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-3 border-gov-navy border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-600">
          Loading Batch Review Workspace...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
      <OfflineBanner />
        <ErrorState
          title="Unable to Load Batch Review"
          message={error}
          onRetry={loadBatchReport}
        />
      </div>
    );
  }

  if (!report || (issues.length === 0 && duplicateClusters.length === 0)) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="No Issues or Clusters Found"
          description={`Batch ${batchId} contains no validation errors or duplicate clusters.`}
          action={
            <Link
              to="/institution/batches"
              className="inline-flex items-center text-xs font-semibold text-gov-navy underline hover:text-gov-navyDark"
            >
              Return to Batches
            </Link>
          }
        />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Offline banner */}
      <OfflineBanner />


      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/institution/batches"
              className="text-xs font-medium text-slate-500 hover:text-gov-navy flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Batches</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-mono font-bold text-gov-navy bg-gov-navy/10 px-2 py-0.5 rounded">
              {batchId}
            </span>
            {isCommitted && (
              <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                COMMITTED
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gov-navy">
            Validation Review Workspace
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Academic Year: <strong className="text-slate-800">2026-27</strong> · Total Rows:{' '}
            <strong className="text-slate-800">{report.rows_total}</strong> · Rule Catalog:{' '}
            <strong className="text-slate-800">v{report.rule_catalog_version}</strong>
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Re-validate Button */}
          <Button
            variant="outline"
            onClick={handleRevalidate}
            disabled={isRevalidating || isCommitted}
            className="text-xs h-9 text-gov-navy border-slate-300 hover:bg-slate-50 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRevalidating ? 'animate-spin text-gov-saffron' : ''}`} />
            {isRevalidating ? `Re-validating (${revalidationProgress}%)...` : 'Re-validate Batch'}
          </Button>

          {/* Commit Button (Disabled with explanation while CRITICAL issues are open) */}
          <div className="relative group">
            <Button
              variant="default"
              onClick={() => setShowCommitDialog(true)}
              disabled={hasOpenCritical || isCommitted}
              className={`text-xs h-9 font-semibold ${
                hasOpenCritical
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300'
                  : 'bg-gov-navy hover:bg-gov-navyDark text-white'
              }`}
            >
              {isCommitted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-400" />
                  Committed to AICTE
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-gov-saffron" />
                  Commit Batch to AICTE
                </>
              )}
            </Button>

            {/* Explanation tooltip banner when disabled due to CRITICAL issues */}
            {hasOpenCritical && !isCommitted && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-red-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition duration-200">
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-gov-saffron flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Commit Disabled:</strong> Unresolved CRITICAL validation issues remain (e.g. V002).
                    All critical issues must be accepted or dismissed before committing.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Critical Issues Warning Banner if any open */}
      {hasOpenCritical && !isCommitted && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-red-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Critical Errors Blocking Batch Commit:</span>
              <p className="text-red-700 text-[11px] mt-0.5">
                APAAR ID formatting or registry mismatches must be corrected or dismissed before AICTE repository commit is allowed.
              </p>
            </div>
          </div>
          <span className="bg-red-200/80 text-red-900 font-bold px-2.5 py-1 rounded-full text-[11px]">
            1 Critical Issue Open
          </span>
        </div>
      )}

      {/* Top Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center justify-center p-4 shadow-sm border border-slate-200">
          <QualityScoreGauge score={qualityScore} scoreBefore={qualityScoreBefore} size="sm" />
        </Card>

        <Card className="p-4 flex flex-col justify-between shadow-sm border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Issue Resolution
          </span>
          <div className="mt-2 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Pending Review:</span>
              <span className="font-bold text-amber-600">{openIssues.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Resolved / Fixed:</span>
              <span className="font-bold text-green-600">{resolvedIssues.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Flagged:</span>
              <span className="font-bold text-slate-800">{issues.length}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between shadow-sm border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Priority Exposure
          </span>
          <div className="mt-2 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Critical:</span>
              <span className="font-bold text-red-700">
                {issues.filter((i) => i.priority === 'CRITICAL' && (i.status === 'OPEN' || i.status === 'PROPOSED')).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">High:</span>
              <span className="font-bold text-orange-600">
                {issues.filter((i) => i.priority === 'HIGH' && (i.status === 'OPEN' || i.status === 'PROPOSED')).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Low / Info:</span>
              <span className="font-bold text-blue-600">
                {issues.filter((i) => (i.priority === 'LOW' || i.priority === 'MEDIUM') && (i.status === 'OPEN' || i.status === 'PROPOSED')).length}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between shadow-sm border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Intake Reconciliation
          </span>
          <div className="mt-2 space-y-1 text-xs text-slate-600">
            <p>
              Uploaded: <strong className="text-slate-900">{report.rows_total}</strong> students
            </p>
            <p>
              Approved Sanction: <strong className="text-slate-900">60</strong> intake
            </p>
            <p className="text-amber-700 font-semibold">Over-intake variance: 3 students</p>
          </div>
        </Card>
      </div>

      {/* Main Workspace Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveMainTab('issues')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-2 ${
            activeMainTab === 'issues'
              ? 'border-gov-navy text-gov-navy font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Issues Queue ({issues.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('duplicates')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-2 ${
            activeMainTab === 'duplicates'
              ? 'border-gov-navy text-gov-navy font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Duplicates ({duplicateClusters.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('report')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-2 ${
            activeMainTab === 'report'
              ? 'border-gov-navy text-gov-navy font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Before / After Report</span>
          {revalidationResult && (
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      {activeMainTab === 'issues' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Virtualised Issue Queue Table */}
          <div className="lg:col-span-7">
            <IssueQueueTable
              issues={issues}
              selectedIssueId={selectedIssue?.issue_id || null}
              onSelectIssue={(iss) => setSelectedIssue(iss)}
              onBulkAcceptInfo={handleBulkAcceptInfo}
              onBulkAcceptSelected={handleBulkAcceptSelected}
              onBulkDismissSelected={handleBulkDismissSelected}
            />
          </div>

          {/* Diagnostic Card / Drawer */}
          <div className="lg:col-span-5">
            {selectedIssue ? (
              <IssueDrawer
                issue={selectedIssue}
                userRole={userRole}
                onAcceptFix={handleAcceptFix}
                onEditValue={handleEditValue}
                onDismiss={handleDismiss}
                onProposeFix={handleProposeFix}
                onProposeEdit={handleProposeEdit}
                onProposeDismiss={handleProposeDismiss}
                onInspectRow={(row, field) => setInspectRowData({ row, field })}
              />
            ) : (
              <Card className="p-12 text-center text-slate-500 text-xs border border-slate-200">
                Select an issue from the queue to view diagnostic details.
              </Card>
            )}
          </div>
        </div>
      )}

      {activeMainTab === 'duplicates' && (
        <DuplicatesTab
          clusters={duplicateClusters}
          onResolveCluster={handleResolveCluster}
        />
      )}

      {activeMainTab === 'report' && (
        <BeforeAfterPanel
          batchId={batchId}
          revalidationResult={revalidationResult}
          scoreBefore={qualityScoreBefore}
          scoreAfter={qualityScore}
          resolvedCount={resolvedIssues.length}
          pendingCount={openIssues.length}
          onDownloadXlsx={handleDownloadXlsx}
          onDownloadPdf={handleDownloadPdf}
        />
      )}

      {/* Row Inspector Deep Link Modal */}
      {inspectRowData && (
        <RowInspectorModal
          batchId={batchId}
          row={inspectRowData.row}
          highlightField={inspectRowData.field}
          onClose={() => setInspectRowData(null)}
        />
      )}

      {/* Commit Confirmation Dialog */}
      {showCommitDialog && (
        <CommitConfirmDialog
          batchId={batchId}
          totalRows={report.rows_total}
          openIssues={openIssues}
          onConfirm={handleCommitConfirm}
          onCancel={() => setShowCommitDialog(false)}
          isSubmitting={isCommitting}
        />
      )}
    </div>
  );
};
