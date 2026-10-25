import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { QualityScoreGauge } from '@/components/shared/QualityScoreGauge';
import { PriorityBadge, type Priority } from '@/components/shared/PriorityBadge';
import { BucketBadge, type Bucket } from '@/components/shared/BucketBadge';
import { API_BASE_URL, authFetch } from '@/lib/api';
import { mockBatchReport } from '@/mocks/data';
import { IntakeCardData, ReconciliationRowData, SchemaDriftData } from '../types';

interface Step4SummaryProps {
  batchId: string;
  onReset: () => void;
}

export const Step4Summary: React.FC<Step4SummaryProps> = ({ batchId, onReset }) => {
  const navigate = useNavigate();
  const [report, setReport] = useState<typeof mockBatchReport>(mockBatchReport);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    authFetch(`${API_BASE_URL}/v1/batches/${batchId}/report`)
      .then((res) => (res.ok ? res.json() : mockBatchReport))
      .then((data) => {
        if (mounted) {
          setReport(data || mockBatchReport);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setReport(mockBatchReport);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [batchId]);

  const handleDownloadXlsx = () => {
    window.open(`${API_BASE_URL}/v1/batches/${batchId}/report.xlsx`, '_blank');
  };

  const handleDownloadPdf = () => {
    window.open(`${API_BASE_URL}/v1/batches/${batchId}/report.pdf`, '_blank');
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gov-navy" />
        <p className="text-xs font-semibold text-slate-700">Loading validation results...</p>
      </Card>
    );
  }

  const {
    quality_score = 74.0,
    rows_total = 65,
    rows_valid = 48,
    rows_warning = 5,
    rows_error = 12,
    priority_summary = { CRITICAL: 1, HIGH: 3, MEDIUM: 0, LOW: 0 },
    review_summary = { AUTO_FLAG: 3, HUMAN_REVIEW: 1, INFO: 0 },
    intake_summary = [
      { program_code: 'BTECH-CSE', approved: 60, enrolled: 63, supernumerary: 3, excess: 0 },
      { program_code: 'BTECH-ECE', approved: 60, enrolled: 58, supernumerary: 2, excess: 0 },
    ] as IntakeCardData[],
    reconciliation = [
      { program_code: 'BTECH-CSE', declared: 60, uploaded: 60, delta: 0, status: 'MATCH' },
      { program_code: 'BTECH-ECE', declared: 60, uploaded: 58, delta: -2, status: 'MISMATCH' },
    ] as ReconciliationRowData[],
    schema_drift = [
      {
        kind: 'COLUMN_RENAMED',
        column: 'PRN',
        previous: 'institution_student_id',
        current: 'PRN',
      },
    ] as SchemaDriftData[],
  } = report;

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-800 border border-green-200">
              VALIDATION COMPLETE
            </span>
            <span className="text-xs text-slate-400">Batch ID: {batchId}</span>
          </div>
          <h3 className="text-xl font-bold text-gov-navy mt-1">Ingestion & Quality Summary</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {`AICTE Demographics and Rule Catalog v0.1.0 executed across ${rows_total} candidate records.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Upload Another Batch
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadXlsx}
            className="text-xs border-gov-navy text-gov-navy hover:bg-gov-navy/5 font-semibold"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download Report (XLSX)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            className="text-xs border-gov-navy text-gov-navy hover:bg-gov-navy/5 font-semibold"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download PDF
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => navigate(`/institution/batches/${batchId}/review`)}
            className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold px-4"
          >
            Review Issues
            <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Schema Drift Alert Banner if present */}
      {schema_drift && schema_drift.length > 0 && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 shadow-sm flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <span>Schema Drift Detected ({schema_drift.length})</span>
            </h4>
            <div className="text-xs text-amber-800 space-y-1">
              {schema_drift.map((drift, idx) => (
                <p key={idx}>
                  {`Header '${drift.column}' has shifted from canonical '${drift.previous}' (${drift.kind}). Column mapping profile updated to maintain backward compatibility.`}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* High-Level Score and Counts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Quality Score Gauge Card */}
        <Card className="p-4 flex flex-col items-center justify-center border-slate-200 shadow-sm">
          <QualityScoreGauge score={quality_score} size="md" />
        </Card>

        {/* Rows Breakdown Card */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Row Validation Status
          </span>
          <div className="mt-2 space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Total Uploaded:</span>
              <span className="font-bold text-slate-800 font-mono text-sm">{rows_total}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-green-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                Valid Clean Rows:
              </span>
              <span className="font-bold text-green-700 font-mono text-sm">{rows_valid}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-amber-700 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Rows with Warnings:
              </span>
              <span className="font-bold text-amber-700 font-mono text-sm">{rows_warning}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-red-700 font-medium flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                Rows with Errors:
              </span>
              <span className="font-bold text-red-700 font-mono text-sm">{rows_error}</span>
            </div>
          </div>
        </Card>

        {/* Priority Breakdown Card */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Issues by Priority Risk
          </span>
          <div className="mt-2 space-y-2">
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((pri) => (
              <div key={pri} className="flex justify-between items-center text-xs">
                <PriorityBadge priority={pri} />
                <span className="font-bold font-mono text-slate-800">
                  {priority_summary[pri] || 0}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Review Bucket Breakdown Card */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Review Bucket Queue
          </span>
          <div className="mt-2 space-y-2">
            {(['AUTO_FLAG', 'HUMAN_REVIEW', 'INFO'] as Bucket[]).map((bucket) => (
              <div key={bucket} className="flex justify-between items-center text-xs">
                <BucketBadge bucket={bucket} />
                <span className="font-bold font-mono text-slate-800">
                  {review_summary[bucket] || 0}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Program Intake vs Approved Capacity Cards */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="py-3 px-4 bg-slate-50/70 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Program Intake Capacity & Excess Evaluation
            </CardTitle>
            <span className="text-[11px] text-slate-400">
              Evaluated against AICTE Approved Sanctioned Intake
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {intake_summary.map((intake) => {
              const hasExcess = intake.excess > 0;

              return (
                <div
                  key={intake.program_code}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    hasExcess
                      ? 'border-red-500 bg-red-50/60 shadow-md ring-2 ring-red-300'
                      : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span className="text-xs font-bold text-gov-navy flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-gov-saffron" />
                      {intake.program_code}
                    </span>
                    {hasExcess ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white animate-pulse">
                        EXCESS DETECTED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                        Within Capacity
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block">AICTE Approved:</span>
                      <span className="font-bold text-slate-800 font-mono text-sm">
                        {intake.approved}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Total Enrolled:</span>
                      <span className="font-bold text-slate-800 font-mono text-sm">
                        {intake.enrolled}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Supernumerary:</span>
                      <span className="font-semibold text-blue-700 font-mono text-xs">
                        +{intake.supernumerary} (TFW/NRI)
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Excess / Breach:</span>
                      <span
                        className={`font-bold font-mono text-sm ${
                          hasExcess ? 'text-red-700 font-extrabold' : 'text-slate-500'
                        }`}
                      >
                        {intake.excess}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Strip: Declared vs Uploaded */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-4 bg-slate-50/70 border-b border-slate-200">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Reconciliation Strip: Declared Total vs Ingested APAAR Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {reconciliation.map((rec) => (
              <div
                key={rec.program_code}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800 w-28">{rec.program_code}</span>
                  <span className="text-slate-500">
                    Declared Capacity:{' '}
                    <strong className="text-slate-800 font-mono">{rec.declared}</strong>
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">
                    Uploaded Records:{' '}
                    <strong className="text-slate-800 font-mono">{rec.uploaded}</strong>
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">
                    Delta:{' '}
                    <strong
                      className={`font-mono font-bold ${
                        rec.delta === 0
                          ? 'text-green-600'
                          : rec.delta < 0
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }`}
                    >
                      {rec.delta > 0 ? `+${rec.delta}` : rec.delta}
                    </strong>
                  </span>
                </div>

                <div>
                  {rec.status === 'MATCH' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      Reconciled (Match)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Mismatch Delta ({rec.delta})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Review Actions Callout Card */}
      <div className="p-4 bg-gov-navy/5 rounded-xl border border-gov-navy/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gov-navy flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-gov-saffron" />
            Next Step: Human-in-the-Loop Issue Resolution
          </h4>
          <p className="text-xs text-slate-600">
            {`${rows_error} error(s) and ${rows_warning} warning(s) require review. You can accept automated suggestions, edit cells with inline rationale, or dismiss items.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            onClick={() => navigate(`/institution/batches/${batchId}/review`)}
            className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold px-4 py-2"
          >
            Open Review Workspace
            <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
