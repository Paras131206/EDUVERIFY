import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriorityBadge, type Priority } from '@/components/shared/PriorityBadge';
import { BucketBadge, type Bucket } from '@/components/shared/BucketBadge';
import { IssueItem, IssuePriority } from '../types';
import {
  CheckCheck,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';


interface IssueQueueTableProps {
  issues: IssueItem[];
  selectedIssueId: string | null;
  onSelectIssue: (issue: IssueItem) => void;
  onBulkAcceptInfo: () => Promise<void> | void;
  onBulkAcceptSelected?: (issueIds: string[]) => Promise<void> | void;
  onBulkDismissSelected: (issueIds: string[], note: string) => Promise<void> | void;
}

export type QueueTab = 'ALL' | 'AUTO_FLAG' | 'HUMAN_REVIEW' | 'INFO';

const PRIORITY_ORDER: Record<IssuePriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const ROW_HEIGHT = 44;
const CONTAINER_HEIGHT = 460;
const OVERSCAN = 6;

export const IssueQueueTable: React.FC<IssueQueueTableProps> = ({
  issues,
  selectedIssueId,
  onSelectIssue,
  onBulkAcceptInfo,
  onBulkAcceptSelected,
  onBulkDismissSelected,
}) => {
  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<QueueTab>('ALL');
  const [filterRule, setFilterRule] = useState<string>('ALL');
  const [filterField, setFilterField] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterBucket, setFilterBucket] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('OPEN');

  // Sorting: default is priority ASC (CRITICAL -> LOW), then row ASC
  const [sortField, setSortField] = useState<'priority' | 'row' | 'field' | 'status'>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Virtualization Scroll Ref
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Extract filter options
  const uniqueRules = useMemo(() => {
    const set = new Set<string>();
    issues.forEach((i) => set.add(i.rule_id));
    return Array.from(set).sort();
  }, [issues]);

  const uniqueFields = useMemo(() => {
    const set = new Set<string>();
    issues.forEach((i) => set.add(i.field));
    return Array.from(set).sort();
  }, [issues]);

  // Tab counts reflect active/unresolved issues under current status filter
  const tabCounts = useMemo(() => {
    const list =
      filterStatus === 'ALL'
        ? issues
        : filterStatus === 'OPEN'
        ? issues.filter((i) => i.status === 'OPEN' || i.status === 'PROPOSED')
        : issues.filter((i) => i.status === filterStatus);

    return {
      ALL: list.length,
      AUTO_FLAG: list.filter((i) => i.bucket === 'AUTO_FLAG').length,
      HUMAN_REVIEW: list.filter((i) => i.bucket === 'HUMAN_REVIEW').length,
      INFO: list.filter(
        (i) =>
          i.bucket === 'INFO' ||
          i.severity === 'INFO' ||
          i.priority === 'LOW' ||
          i.rule_id === 'V030'
      ).length,
    };
  }, [issues, filterStatus]);

  // Overall open/pending issues count
  const openIssuesCount = useMemo(() => {
    return issues.filter((i) => i.status === 'OPEN' || i.status === 'PROPOSED').length;
  }, [issues]);

  // Open INFO normalisations count
  const openInfoCount = useMemo(() => {
    return issues.filter(
      (i) =>
        (i.bucket === 'INFO' ||
          i.severity === 'INFO' ||
          i.priority === 'LOW' ||
          i.rule_id === 'V030' ||
          (i.suggested_fix && !i.suggested_fix.requires_approval)) &&
        i.status !== 'FIXED' &&
        i.status !== 'DISMISSED'
    ).length;
  }, [issues]);

  // Filtered & Sorted items
  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      // Tab filter
      if (activeTab === 'AUTO_FLAG' && iss.bucket !== 'AUTO_FLAG') return false;
      if (activeTab === 'HUMAN_REVIEW' && iss.bucket !== 'HUMAN_REVIEW') return false;
      if (
        activeTab === 'INFO' &&
        iss.bucket !== 'INFO' &&
        iss.severity !== 'INFO' &&
        iss.priority !== 'LOW' &&
        iss.rule_id !== 'V030'
      )
        return false;

      // Select filters
      if (filterRule !== 'ALL' && iss.rule_id !== filterRule) return false;
      if (filterField !== 'ALL' && iss.field !== filterField) return false;
      if (filterSeverity !== 'ALL' && iss.severity !== filterSeverity) return false;
      if (filterPriority !== 'ALL' && iss.priority !== filterPriority) return false;
      if (filterBucket !== 'ALL' && iss.bucket !== filterBucket) return false;
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'OPEN') {
          if (iss.status !== 'OPEN' && iss.status !== 'PROPOSED') return false;
        } else if (iss.status !== filterStatus) {
          return false;
        }
      }

      return true;
    });
  }, [
    issues,
    activeTab,
    filterRule,
    filterField,
    filterSeverity,
    filterPriority,
    filterBucket,
    filterStatus,
  ]);

  const sortedIssues = useMemo(() => {
    const list = [...filteredIssues];
    list.sort((a, b) => {
      if (sortField === 'priority') {
        const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (pDiff !== 0) return sortDirection === 'asc' ? pDiff : -pDiff;
        return a.row - b.row;
      }
      if (sortField === 'row') {
        const diff = a.row - b.row;
        return sortDirection === 'asc' ? diff : -diff;
      }
      if (sortField === 'field') {
        const diff = a.field.localeCompare(b.field);
        return sortDirection === 'asc' ? diff : -diff;
      }
      if (sortField === 'status') {
        const diff = a.status.localeCompare(b.status);
        return sortDirection === 'asc' ? diff : -diff;
      }
      return 0;
    });
    return list;
  }, [filteredIssues, sortField, sortDirection]);

  // Virtualization window indices
  const totalCount = sortedIssues.length;
  const totalHeight = totalCount * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    totalCount,
    Math.ceil((scrollTop + CONTAINER_HEIGHT) / ROW_HEIGHT) + OVERSCAN
  );
  const visibleIssues = sortedIssues.slice(startIndex, endIndex);

  // Checkbox handlers - only allow selecting actionable (non-fixed, non-dismissed) issues
  const handleToggleSelectAll = () => {
    const selectable = sortedIssues.filter(
      (i) => i.status !== 'FIXED' && i.status !== 'DISMISSED'
    );
    if (selectable.length > 0 && selectedIds.size === selectable.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectable.map((i) => i.issue_id)));
    }
  };

  const handleToggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = issues.find((i) => i.issue_id === id);
    if (target && (target.status === 'FIXED' || target.status === 'DISMISSED')) {
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAccept = async () => {
    setIsProcessingBulk(true);
    try {
      await onBulkAcceptInfo();
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkAcceptSelected = async () => {
    if (selectedIds.size === 0 || !onBulkAcceptSelected) return;
    setIsProcessingBulk(true);
    try {
      await onBulkAcceptSelected(Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleConfirmBulkDismiss = async () => {
    if (!dismissReason.trim()) return;
    setIsProcessingBulk(true);
    try {
      await onBulkDismissSelected(Array.from(selectedIds), dismissReason);
      setShowDismissModal(false);
      setDismissReason('');
      setSelectedIds(new Set());
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleResetFilters = () => {
    setActiveTab('ALL');
    setFilterRule('ALL');
    setFilterField('ALL');
    setFilterSeverity('ALL');
    setFilterPriority('ALL');
    setFilterBucket('ALL');
    setFilterStatus('OPEN');
    setSortField('priority');
    setSortDirection('asc');
  };

  return (
    <Card className="shadow-sm border border-slate-200" data-testid="issue-queue-card">
      <CardHeader className="py-4 px-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base text-gov-navy font-bold flex items-center gap-2">
              <span>Explainable Issue Queue</span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                  openIssuesCount === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gov-navy/10 text-gov-navy'
                }`}
              >
                {openIssuesCount === 0
                  ? `All Resolved (${issues.length})`
                  : `${openIssuesCount} Pending (${issues.length} Total)`}
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Prioritised verification errors with AI-driven root cause and safe suggestions
            </CardDescription>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.size > 0 && onBulkAcceptSelected && (
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkAcceptSelected}
                disabled={isProcessingBulk}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-8 shadow-sm font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                Accept Selected Fixes ({selectedIds.size})
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkAccept}
              disabled={isProcessingBulk}
              className={`text-xs h-8 font-medium transition ${
                openInfoCount === 0
                  ? 'text-emerald-700 border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100'
                  : 'text-blue-700 border-blue-200 hover:bg-blue-50'
              }`}
            >
              {openInfoCount === 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              )}
              Accept All INFO Normalisations
              {openInfoCount > 0 ? ` (${openInfoCount})` : ' (All Accepted)'}
            </Button>

            {selectedIds.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDismissModal(true)}
                disabled={isProcessingBulk}
                className="text-xs text-red-700 border-red-200 hover:bg-red-50 h-8"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5 text-red-600" />
                Dismiss Selected ({selectedIds.size})
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 pt-3 border-t border-slate-200/60 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'ALL'
                ? 'bg-gov-navy text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>All Issues</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {tabCounts.ALL}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('AUTO_FLAG')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'AUTO_FLAG'
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Auto-flagged</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'AUTO_FLAG' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-700'
              }`}
            >
              {tabCounts.AUTO_FLAG}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('HUMAN_REVIEW')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'HUMAN_REVIEW'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Needs human review</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'HUMAN_REVIEW' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {tabCounts.HUMAN_REVIEW}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('INFO')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'INFO'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Info</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'INFO' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
              }`}
            >
              {tabCounts.INFO}
            </span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-3 text-xs">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Rule
            </label>
            <select
              aria-label="Filter by Rule"
              value={filterRule}
              onChange={(e) => setFilterRule(e.target.value)}
              className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-xs text-slate-700 font-mono"
            >
              <option value="ALL">All Rules</option>
              {uniqueRules.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Field
            </label>
            <select
              aria-label="Filter by Field"
              value={filterField}
              onChange={(e) => setFilterField(e.target.value)}
              className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-xs text-slate-700"
            >
              <option value="ALL">All Fields</option>
              {uniqueFields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Severity
            </label>
            <select
              aria-label="Filter by Severity"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-xs text-slate-700"
            >
              <option value="ALL">All Severities</option>
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Priority
            </label>
            <select
              aria-label="Filter by Priority"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-xs text-slate-700"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Bucket
            </label>
            <select
              aria-label="Filter by Bucket"
              value={filterBucket}
              onChange={(e) => setFilterBucket(e.target.value)}
              className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-xs text-slate-700"
            >
              <option value="ALL">All Buckets</option>
              <option value="AUTO_FLAG">AUTO_FLAG</option>
              <option value="HUMAN_REVIEW">HUMAN_REVIEW</option>
              <option value="INFO">INFO</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Status
            </label>
            <select
              aria-label="Filter by Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-xs text-slate-700"
            >
              <option value="OPEN">Open (Pending)</option>
              <option value="ALL">All Statuses</option>
              <option value="FIXED">FIXED</option>
              <option value="DISMISSED">DISMISSED</option>
              <option value="PROPOSED">PROPOSED</option>
            </select>
          </div>
        </div>

        {/* Filter stats & reset */}
        <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
          <span>
            {`Showing ${sortedIssues.length} of ${issues.length} issues${sortField === 'priority' ? ' (Sorted: Priority CRITICAL→LOW, then Row)' : ''}`}
          </span>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-slate-500 hover:text-gov-navy transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>
      </CardHeader>

      {/* Virtualised Table View */}
      <div className="relative border-b border-slate-200">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 font-semibold text-xs border-b border-slate-200 items-center select-none">
          <div className="col-span-1 flex items-center gap-2">
            <input
              type="checkbox"
              aria-label="Select all issues"
              checked={
                sortedIssues.some((i) => i.status !== 'FIXED' && i.status !== 'DISMISSED') &&
                selectedIds.size ===
                  sortedIssues.filter((i) => i.status !== 'FIXED' && i.status !== 'DISMISSED').length
              }
              onChange={handleToggleSelectAll}
              className="rounded border-slate-300 text-gov-navy focus:ring-gov-navy"
            />
            <span
              onClick={() => {
                if (sortField === 'row') setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
                else {
                  setSortField('row');
                  setSortDirection('asc');
                }
              }}
              className="cursor-pointer hover:text-gov-navy"
            >
              Row
            </span>
          </div>
          <div
            className="col-span-3 cursor-pointer hover:text-gov-navy"
            onClick={() => {
              if (sortField === 'field') setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
              else {
                setSortField('field');
                setSortDirection('asc');
              }
            }}
          >
            Field / Rule
          </div>
          <div
            className="col-span-2 cursor-pointer hover:text-gov-navy"
            onClick={() => {
              if (sortField === 'priority') setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
              else {
                setSortField('priority');
                setSortDirection('asc');
              }
            }}
          >
            Priority
          </div>
          <div className="col-span-2">Bucket</div>
          <div className="col-span-2">Reason / Message</div>
          <div
            className="col-span-2 text-right cursor-pointer hover:text-gov-navy"
            onClick={() => {
              if (sortField === 'status') setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
              else {
                setSortField('status');
                setSortDirection('asc');
              }
            }}
          >
            Status
          </div>
        </div>

        {/* Scrollable Virtual Container */}
        {sortedIssues.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            {issues.length > 0 && issues.every((i) => i.status === 'FIXED' || i.status === 'DISMISSED') ? (
              <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="font-bold text-slate-900 text-sm">All Validation Issues Resolved!</span>
                <p className="text-slate-500 text-xs leading-relaxed">
                  All issues in this batch have been fixed or dismissed. Switch Status to &ldquo;All Statuses&rdquo; or &ldquo;FIXED&rdquo; if you wish to review resolved items.
                </p>
              </div>
            ) : (
              'No validation issues match the selected filters.'
            )}
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{ height: CONTAINER_HEIGHT }}
            className="overflow-y-auto relative divide-y divide-slate-100"
          >
            {/* Virtual height spacer */}
            <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: startIndex * ROW_HEIGHT,
                  left: 0,
                  right: 0,
                }}
              >
                {visibleIssues.map((iss) => {
                  const isSelected = selectedIssueId === iss.issue_id;
                  const isChecked = selectedIds.has(iss.issue_id);

                  return (
                    <div
                      key={iss.issue_id}
                      onClick={() => onSelectIssue(iss)}
                      style={{ height: ROW_HEIGHT }}
                      className={`grid grid-cols-12 gap-2 px-4 items-center cursor-pointer text-xs transition border-b border-slate-100 ${
                        isSelected
                          ? 'bg-amber-50/80 border-l-4 border-l-gov-saffron font-medium'
                          : isChecked
                          ? 'bg-slate-50'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="col-span-1 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={iss.status === 'FIXED' || iss.status === 'DISMISSED'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleToggleSelectOne(iss.issue_id, e as unknown as React.MouseEvent)}
                          className="rounded border-slate-300 text-gov-navy focus:ring-gov-navy disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                        <span className="font-mono text-slate-600 font-semibold">#{iss.row}</span>
                      </div>

                      <div className="col-span-3 flex flex-col justify-center">
                        <span className="font-semibold text-slate-900 truncate">{iss.field}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {iss.rule_id}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <PriorityBadge priority={iss.priority as Priority} />
                      </div>

                      <div className="col-span-2">
                        <BucketBadge bucket={iss.bucket as Bucket} />
                      </div>

                      <div className="col-span-2 truncate text-slate-600 text-[11px]" title={iss.message}>
                        {iss.message}
                      </div>

                      <div className="col-span-2 text-right">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1 ${
                            iss.status === 'FIXED'
                              ? 'bg-green-100 text-green-800'
                              : iss.status === 'DISMISSED'
                              ? 'bg-slate-100 text-slate-600'
                              : iss.status === 'PROPOSED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {iss.status === 'FIXED' && <CheckCircle2 className="w-3 h-3" />}
                          {iss.status === 'DISMISSED' && <XCircle className="w-3 h-3" />}
                          {iss.status === 'PROPOSED' && <Clock className="w-3 h-3" />}
                          {iss.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dismiss with reason modal */}
      {showDismissModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Dismiss {selectedIds.size} Selected Issues
            </h3>
            <p className="text-xs text-slate-500">
              Provide an audit justification for dismissing these validation issues.
            </p>
            <textarea
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              placeholder="e.g. Verified with registrar physical records..."
              rows={3}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-gov-navy"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDismissModal(false)}
                disabled={isProcessingBulk}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleConfirmBulkDismiss}
                disabled={isProcessingBulk || !dismissReason.trim()}
                className="bg-red-700 hover:bg-red-800 text-white"
              >
                Confirm Dismissal
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
