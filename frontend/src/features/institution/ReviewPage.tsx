import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { PriorityBadge, type Priority } from '@/components/shared/PriorityBadge';
import { BucketBadge, type Bucket } from '@/components/shared/BucketBadge';
import { QualityScoreGauge } from '@/components/shared/QualityScoreGauge';
import { MaskedValue } from '@/components/shared/MaskedValue';
import { mockBatchReport } from '@/mocks/data';
import type { components } from '@/api/schema.gen';
import { Check, X, Sparkles, CheckCircle2 } from 'lucide-react';

type IssueItem = components['schemas']['Issue'];

export const ReviewPage: React.FC = () => {
  const [issues, setIssues] = useState<IssueItem[]>(mockBatchReport.issues as IssueItem[]);
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(issues[0] || null);
  const [isCommitted, setIsCommitted] = useState(false);
  const [score, setScore] = useState(mockBatchReport.quality_score);

  const handleApplyFix = (issueId: string) => {
    setIssues((prev) =>
      prev.map((iss) => (iss.issue_id === issueId ? { ...iss, status: 'FIXED' } : iss))
    );
    setScore((prev) => Math.min(100, prev + 6));
    if (selectedIssue?.issue_id === issueId) {
      setSelectedIssue((prev) => (prev ? { ...prev, status: 'FIXED' } : null));
    }
  };

  const handleDismiss = (issueId: string) => {
    setIssues((prev) =>
      prev.map((iss) => (iss.issue_id === issueId ? { ...iss, status: 'DISMISSED' } : iss))
    );
    if (selectedIssue?.issue_id === issueId) {
      setSelectedIssue((prev) => (prev ? { ...prev, status: 'DISMISSED' } : null));
    }
  };

  const handleCommit = () => {
    setIsCommitted(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gov-navy">Validation Review Workspace</h2>
          <p className="text-xs text-slate-500 mt-1">
            Batch ID: {mockBatchReport.batch_id} · Academic Year: 2026-27 · Rows: {mockBatchReport.rows_total}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="default"
            onClick={handleCommit}
            disabled={isCommitted}
            className="bg-gov-navy hover:bg-gov-navyDark"
          >
            {isCommitted ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                Committed to Central Repository
              </>
            ) : (
              'Commit Batch to AICTE'
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center justify-center p-4">
          <QualityScoreGauge score={score} scoreBefore={mockBatchReport.quality_score} size="sm" />
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bucket Summary</span>
          <div className="mt-2 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Auto-Flagged:</span>
              <span className="font-bold text-red-600">{mockBatchReport.review_summary.AUTO_FLAG}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Human Review:</span>
              <span className="font-bold text-amber-600">{mockBatchReport.review_summary.HUMAN_REVIEW}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Informational:</span>
              <span className="font-bold text-slate-600">{mockBatchReport.review_summary.INFO}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority Risk</span>
          <div className="mt-2 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Critical:</span>
              <span className="font-bold text-red-700">{mockBatchReport.priority_summary.CRITICAL}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">High:</span>
              <span className="font-bold text-orange-600">{mockBatchReport.priority_summary.HIGH}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Medium/Low:</span>
              <span className="font-bold text-blue-600">
                {mockBatchReport.priority_summary.MEDIUM + mockBatchReport.priority_summary.LOW}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reconciliation</span>
          <div className="mt-2 space-y-1 text-xs text-slate-600">
            <p>Uploaded: <strong className="text-slate-900">58</strong> students</p>
            <p>Declared: <strong className="text-slate-900">60</strong> intake</p>
            <p className="text-amber-700 font-medium">Delta: -2 students</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Explainable Issue Queue</CardTitle>
                <CardDescription className="text-xs">
                  Prioritised issues with AI evidence and safe suggested fixes
                </CardDescription>
              </div>
              <span className="text-xs font-semibold bg-slate-100 px-2.5 py-1 rounded-full text-slate-700">
                {issues.filter((i) => i.status === 'OPEN').length} Pending
              </span>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row / Key</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Bucket</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((iss) => (
                  <TableRow
                    key={iss.issue_id}
                    className={`cursor-pointer transition ${
                      selectedIssue?.issue_id === iss.issue_id ? 'bg-amber-50/70 border-l-4 border-l-gov-saffron' : ''
                    }`}
                    onClick={() => setSelectedIssue(iss)}
                  >
                    <TableCell className="font-mono text-xs">
                      #{iss.row} <span className="text-slate-400">({iss.record_key})</span>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-slate-700">{iss.field}</TableCell>
                    <TableCell>
                      <PriorityBadge priority={iss.priority as Priority} />
                    </TableCell>
                    <TableCell>
                      <BucketBadge bucket={iss.bucket as Bucket} />
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          iss.status === 'FIXED'
                            ? 'bg-green-100 text-green-800'
                            : iss.status === 'DISMISSED'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {iss.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div>
          {selectedIssue ? (
            <Card className="border-t-4 border-t-gov-saffron sticky top-6 shadow-md">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-slate-400">Rule {selectedIssue.rule_id}</span>
                    <CardTitle className="text-base text-slate-900">{selectedIssue.field}</CardTitle>
                  </div>
                  <PriorityBadge priority={selectedIssue.priority as Priority} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Issue Message</span>
                  <p className="text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-200">
                    {selectedIssue.message}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">AI Root Cause & Reason</span>
                  <p className="text-slate-600 leading-relaxed">{selectedIssue.reason}</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Evidence</span>
                  <pre className="bg-slate-900 text-slate-100 p-2.5 rounded font-mono text-[11px] overflow-auto">
                    {JSON.stringify(selectedIssue.evidence, null, 2)}
                  </pre>
                </div>

                {selectedIssue.suggested_fix && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-amber-900 font-semibold mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-gov-saffron" />
                      <span>Suggested Fix</span>
                    </div>
                    <p className="text-slate-700">
                      Value: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold">{selectedIssue.suggested_fix.value}</code>
                    </p>
                    <p className="text-slate-500 mt-1 text-[11px]">{selectedIssue.suggested_fix.rationale}</p>
                  </div>
                )}

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Current Masked Value</span>
                  <MaskedValue value={selectedIssue.value_masked} kind="apaar" canUnmask />
                </div>

                {selectedIssue.status === 'OPEN' && (
                  <div className="pt-2 flex gap-2">
                    <Button
                      variant="saffron"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleApplyFix(selectedIssue.issue_id)}
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      Approve & Fix
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDismiss(selectedIssue.issue_id)}
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Dismiss
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-500 text-xs">
              Select an issue from the queue to view explainable diagnostics.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
