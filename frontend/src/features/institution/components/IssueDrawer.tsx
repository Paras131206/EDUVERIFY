import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PriorityBadge, type Priority } from '@/components/shared/PriorityBadge';
import { BucketBadge, type Bucket } from '@/components/shared/BucketBadge';
import { MaskedValue } from '@/components/shared/MaskedValue';
import { IssueItem } from '../types';
import {
  Sparkles,
  Check,
  X,
  Edit2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

interface IssueDrawerProps {
  issue: IssueItem;
  userRole?: string;
  onAcceptFix: (issueId: string) => Promise<void> | void;
  onEditValue: (issueId: string, newValue: string) => Promise<void> | void;
  onDismiss: (issueId: string, note: string) => Promise<void> | void;
  onProposeFix: (issueId: string) => Promise<void> | void;
  onProposeEdit: (issueId: string, newValue: string) => Promise<void> | void;
  onProposeDismiss: (issueId: string, note: string) => Promise<void> | void;
  onInspectRow: (row: number, field: string) => void;
}

export const IssueDrawer: React.FC<IssueDrawerProps> = ({
  issue,
  userRole = 'INSTITUTION_ADMIN',
  onAcceptFix,
  onEditValue,
  onDismiss,
  onProposeFix,
  onProposeEdit,
  onProposeDismiss,
  onInspectRow,
}) => {

  const isAdmin = userRole === 'INSTITUTION_ADMIN' || userRole === 'AICTE_ADMIN';
  const isStaff = !isAdmin;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(issue.suggested_fix?.value ? String(issue.suggested_fix.value) : '');
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissNote, setDismissNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApplyFix = async () => {
    setIsSubmitting(true);
    try {
      if (isAdmin) {
        await onAcceptFix(issue.issue_id);
      } else {
        await onProposeFix(issue.issue_id);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim()) return;
    setIsSubmitting(true);
    try {
      if (isAdmin) {
        await onEditValue(issue.issue_id, editValue);
      } else {
        await onProposeEdit(issue.issue_id, editValue);
      }
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDismiss = async () => {
    if (!dismissNote.trim()) return;
    setIsSubmitting(true);
    try {
      if (isAdmin) {
        await onDismiss(issue.issue_id, dismissNote);
      } else {
        await onProposeDismiss(issue.issue_id, dismissNote);
      }
      setIsDismissing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-t-4 border-t-gov-saffron shadow-lg rounded-xl overflow-hidden sticky top-6">
      {/* Header */}
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-gov-navy bg-gov-navy/10 px-2 py-0.5 rounded">
                {issue.rule_id}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {issue.rule_name || `Rule ${issue.rule_id}`}
              </span>
            </div>
            <CardTitle className="text-base text-slate-900 font-bold flex items-center gap-2">
              <span>{`Field: ${issue.field}`}</span>
              <span className="text-xs text-slate-400 font-normal font-mono">
                (Row #{issue.row})
              </span>
            </CardTitle>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <PriorityBadge priority={issue.priority as Priority} />
            <BucketBadge bucket={issue.bucket as Bucket} />
          </div>
        </div>

        {/* Role Mode Banner */}
        <div className="mt-2 text-[11px] flex items-center justify-between text-slate-500 bg-white p-1.5 rounded border border-slate-200">
          <span className="font-medium">
            Active Persona: <strong className="text-gov-navy">{userRole}</strong>
          </span>
          {isStaff ? (
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
              Propose Only (Requires Admin Approval)
            </span>
          ) : (
            <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded font-semibold">
              Approval Authority
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4 text-xs">
        {/* Status Callout if not open */}
        {issue.status === 'FIXED' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Issue Resolved</span>
              {issue.decision_note && <p className="text-[11px] text-green-700">{issue.decision_note}</p>}
            </div>
          </div>
        )}

        {issue.status === 'DISMISSED' && (
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-2.5 flex items-center gap-2 text-slate-700">
            <XCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div>
              <span className="font-bold">Issue Dismissed</span>
              {issue.decision_note && <p className="text-[11px] text-slate-600">Note: {issue.decision_note}</p>}
            </div>
          </div>
        )}

        {issue.status === 'PROPOSED' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center gap-2 text-amber-800">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Change Proposed by Staff</span>
              {issue.proposed_value && (
                <p className="text-[11px] text-amber-900">
                  Proposed Value: <code className="font-mono font-bold">{issue.proposed_value}</code>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Message */}
        <div>
          <span className="font-semibold text-slate-700 block mb-1">Issue Description</span>
          <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed font-medium">
            {issue.message}
          </p>
        </div>

        {/* Reason sentence */}
        <div>
          <span className="font-semibold text-slate-700 block mb-1">AI Root Cause & Reason</span>
          <p className="text-slate-600 leading-relaxed bg-amber-50/40 p-2.5 rounded-lg border border-amber-100">
            {issue.reason}
          </p>
        </div>

        {/* Evidence Table */}
        <div>
          <span className="font-semibold text-slate-700 block mb-1">Evidence Used</span>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-100 text-slate-600 text-left">
                <tr>
                  <th className="py-1.5 px-2.5 font-semibold">Key</th>
                  <th className="py-1.5 px-2.5 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issue.evidence && Object.keys(issue.evidence).length > 0 ? (
                  Object.entries(issue.evidence).map(([k, v]) => (
                    <tr key={k} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 font-mono text-slate-500">{k}</td>
                      <td className="py-1.5 px-2.5 font-mono font-semibold text-slate-800">
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-1.5 px-2.5 text-slate-400 italic">
                      No explicit evidence attributes recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Suggested Fix */}
        {issue.suggested_fix && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <Sparkles className="w-4 h-4 text-gov-saffron" />
                <span>Suggested Safe Fix</span>
              </div>
              {issue.suggested_fix.requires_approval && (
                <span className="text-[10px] bg-amber-200/80 text-amber-900 font-semibold px-2 py-0.5 rounded">
                  Requires Approval
                </span>
              )}
            </div>
            <div className="mt-1 bg-white p-2 rounded border border-amber-200">
              <span className="text-slate-500 text-[11px] block">Suggested Value:</span>
              <code className="font-mono text-xs font-bold text-slate-900">
                {String(issue.suggested_fix.value)}
              </code>
            </div>
            <p className="text-slate-600 mt-2 text-[11px] leading-relaxed">
              <strong>Rationale:</strong> {issue.suggested_fix.rationale}
            </p>
          </div>
        )}

        {/* Current Masked Value */}
        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <span className="font-medium text-slate-500 text-[11px] block">Current Uploaded Value</span>
            <div className="font-mono font-bold text-slate-800 mt-0.5">
              <MaskedValue value={issue.value_masked || '—'} kind="apaar" canUnmask />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInspectRow(issue.row, issue.field)}
            className="text-xs h-8 text-gov-navy hover:text-gov-navyDark"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Inspect Full Row
          </Button>
        </div>

        {/* Edit Value Form Inline */}
        {isEditing && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2">
            <span className="font-semibold text-blue-900 block text-xs">
              {isAdmin ? 'Edit / Override Value' : 'Propose New Value'}
            </span>
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter replacement value..."
              className="text-xs h-8 bg-white"
              disabled={isSubmitting}
            />
            <div className="flex gap-2 justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSubmitting || !editValue.trim()}
                className="h-7 text-xs bg-gov-navy hover:bg-gov-navyDark"
              >
                {isAdmin ? 'Apply Edit' : 'Propose Edit'}
              </Button>
            </div>
          </div>
        )}

        {/* Dismiss with Note Form Inline */}
        {isDismissing && (
          <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg space-y-2">
            <span className="font-semibold text-red-900 block text-xs">
              {isAdmin ? 'Dismiss with Justification Note' : 'Propose Dismissal with Note'}
            </span>
            <textarea
              value={dismissNote}
              onChange={(e) => setDismissNote(e.target.value)}
              placeholder="Provide reason for dismissal (e.g., student verified manually with DigiLocker)..."
              rows={2}
              className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
              disabled={isSubmitting}
            />
            <div className="flex gap-2 justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDismissing(false)}
                disabled={isSubmitting}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleConfirmDismiss}
                disabled={isSubmitting || !dismissNote.trim()}
                className="h-7 text-xs bg-red-700 hover:bg-red-800 text-white"
              >
                {isAdmin ? 'Confirm Dismiss' : 'Submit Proposal'}
              </Button>
            </div>
          </div>
        )}

        {/* Actions Bar (when not editing or dismissing) */}
        {!isEditing && !isDismissing && (issue.status === 'OPEN' || issue.status === 'PROPOSED') && (
          <div className="pt-2 flex flex-col gap-2">
            <div className="flex gap-2">
              {issue.suggested_fix && (
                <Button
                  variant="saffron"
                  size="sm"
                  className="flex-1"
                  onClick={handleApplyFix}
                  disabled={isSubmitting}
                >
                  <Check className="w-4 h-4 mr-1" />
                  {isAdmin ? 'Accept Fix' : 'Propose Fix'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isSubmitting}
                className="flex-1 text-slate-700"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                {isAdmin ? 'Edit Value' : 'Propose Edit'}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDismissing(true)}
              disabled={isSubmitting}
              className="text-red-700 border-red-200 hover:bg-red-50 w-full"
            >
              <X className="w-4 h-4 mr-1" />
              {isAdmin ? 'Dismiss with Note' : 'Propose Dismissal'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
