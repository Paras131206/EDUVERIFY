import React from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { IssueItem } from '../types';

interface CommitConfirmDialogProps {
  batchId: string;
  totalRows: number;
  openIssues: IssueItem[];
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const CommitConfirmDialog: React.FC<CommitConfirmDialogProps> = ({
  batchId,
  totalRows,
  openIssues,
  onConfirm,
  onCancel,
  isSubmitting = false,
}) => {
  // Find excluded/rejected rows (rows with open issues)
  const excludedRows = Array.from(new Set(openIssues.map((i) => i.row))).sort((a, b) => a - b);
  const eligibleRows = Math.max(0, totalRows - excludedRows.length);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="commit-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gov-navy text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gov-saffron" />
            <h3 id="commit-dialog-title" className="font-bold text-base">
              Commit Batch to Central Repository
            </h3>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="text-slate-300 hover:text-white p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-700 leading-relaxed">
            You are about to commit validated student enrolment records for Batch{' '}
            <code className="font-mono font-bold text-gov-navy">{batchId}</code> into the AICTE Central Repository.
          </p>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wider block">
                Committed Records
              </span>
              <span className="text-2xl font-bold text-green-900">{eligibleRows}</span>
              <p className="text-[10px] text-green-700 mt-0.5">Approved & Verifiable</p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                Excluded Records
              </span>
              <span className="text-2xl font-bold text-amber-900">{excludedRows.length}</span>
              <p className="text-[10px] text-amber-700 mt-0.5">Pending Human Review</p>
            </div>
          </div>

          {/* Excluded rows list */}
          {excludedRows.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
              <span className="font-semibold text-slate-700 block">Excluded / Unapproved Rows:</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {excludedRows.map((r) => (
                  <span
                    key={r}
                    className="font-mono text-[11px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded border border-red-200"
                  >
                    Row #{r}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">
                Excluded rows will remain in draft status and will NOT be committed until resolved.
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[11px] text-blue-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>
              Once committed, students will be issued SD-JWT credentials keyed to their 12-digit APAAR ID and become eligible for verification desks.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-gov-navy hover:bg-gov-navyDark text-white font-semibold"
          >
            {isSubmitting ? 'Committing Batch...' : 'Confirm & Commit Records'}
          </Button>
        </div>
      </div>
    </div>
  );
};
