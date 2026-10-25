import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Download,
  CheckCircle2,
  Clock,
  RefreshCw,
  Archive,
  Layers,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { API_BASE_URL, authFetch } from '@/lib/api';
import { BatchItem } from './types';

export const BatchListPage: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = () => {
    setIsLoading(true);
    setError(null);

    authFetch(`${API_BASE_URL}/v1/batches`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: BatchItem[]) => {
        if (Array.isArray(data)) {
          setBatches(data);
        } else {
          setBatches([]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load batches');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Check for any currently open batch (IN_REVIEW, VALIDATING, MAPPING)
  const openBatch = batches.find(
    (b) => b.status === 'IN_REVIEW' || b.status === 'VALIDATING' || b.status === 'MAPPING'
  );

  const getStatusBadge = (status: BatchItem['status']) => {
    switch (status) {
      case 'COMMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800 border border-green-200">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            COMMITTED
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            IN REVIEW
          </span>
        );
      case 'VALIDATING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
            VALIDATING
          </span>
        );
      case 'MAPPING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Layers className="w-3 h-3 text-purple-600" />
            MAPPING
          </span>
        );
      case 'UPLOADED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            UPLOADED
          </span>
        );
      case 'SUPERSEDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-300 line-through">
            <Archive className="w-3 h-3 text-slate-400" />
            SUPERSEDED
          </span>
        );
      case 'REJECTED':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <OfflineBanner />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gov-navy">Institution Batch Registry</h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of all student admission uploads, data quality improvements, and AICTE commitment status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBatches}
            className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Link to="/institution/upload">
            <Button
              variant="default"
              size="sm"
              className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold px-4"
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-gov-saffron" />
              Upload New Batch
            </Button>
          </Link>
        </div>
      </div>

      {/* Open Batch Conflict Alert Banner if an active batch exists */}
      {openBatch && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Open Batch in Progress (Conflict Prevention)
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {`Batch ${openBatch.id || openBatch.batch_id} (${openBatch.filename}) for Academic Year ${openBatch.academic_year} is currently ${openBatch.status}. New uploads will require setting this batch as superseded.`}
              </p>
            </div>
          </div>
          <Link
            to={`/institution/batches/${openBatch.id || openBatch.batch_id}/review`}
            state={{ batch: openBatch }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gov-navy hover:bg-slate-50 rounded-lg text-xs font-bold border border-amber-300 shadow-sm shrink-0 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gov-saffron" />
            Go to Open Batch Review
          </Link>
        </div>
      )}

      {/* Batches Table Card */}
      {error ? (
        <ErrorState message={error} onRetry={fetchBatches} />
      ) : batches.length === 0 && !isLoading ? (
        <EmptyState
          title="No Batches Uploaded Yet"
          description="Your institution has not uploaded any student admission batches. Start by uploading an Excel or CSV file."
          action={
            <Button
              variant="default"
              onClick={() => navigate('/institution/upload')}
              className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold"
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-gov-saffron" />
              Upload First Batch
            </Button>
          }
        />
      ) : (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="py-3 px-4 bg-slate-50/70 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Uploaded Student Batches
              </CardTitle>
              <span className="text-xs text-slate-500 font-medium">
                {batches.length} batch record(s)
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/40 text-[11px] font-bold text-slate-600">
                  <TableHead className="w-32">Batch ID</TableHead>
                  <TableHead className="w-24">Academic Year</TableHead>
                  <TableHead className="w-48">Filename</TableHead>
                  <TableHead className="w-40">Uploaded At</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-32">Quality Score</TableHead>
                  <TableHead className="w-40">Records Breakdown</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch, idx) => {
                  const batchIdentifier = batch.id || batch.batch_id || `batch-${idx}`;
                  const isSuperseded = batch.status === 'SUPERSEDED';

                  return (
                    <TableRow
                      key={batchIdentifier}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSuperseded ? 'opacity-60 bg-slate-50/40' : ''
                      }`}
                    >
                      <TableCell className="font-mono text-xs font-bold text-slate-800">
                        {batch.batch_id || batch.id}
                      </TableCell>

                      <TableCell className="text-xs font-medium text-slate-700">
                        {batch.academic_year}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-gov-saffron shrink-0" />
                          <span className="truncate max-w-[180px]">{batch.filename}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-[11px] text-slate-500">
                        {formatDate(batch.created_at)}
                      </TableCell>

                      <TableCell>{getStatusBadge(batch.status)}</TableCell>

                      <TableCell>
                        {(() => {
                          const score = batch.quality_score ?? batch.quality_score_after ?? batch.quality_score_before;
                          return typeof score === 'number' ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-xs font-bold ${
                                  score >= 80
                                    ? 'text-green-600'
                                    : score >= 60
                                      ? 'text-amber-600'
                                      : 'text-red-600'
                                }`}
                              >
                                {score}%
                              </span>
                              {typeof batch.quality_score_after === 'number' &&
                                typeof batch.quality_score_before === 'number' &&
                                batch.quality_score_after > batch.quality_score_before && (
                                  <span className="text-[10px] text-green-700 font-bold">
                                    → {batch.quality_score_after}%
                                  </span>
                                )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">—</span>
                          );
                        })()}
                      </TableCell>

                      <TableCell>
                        <div className="text-[11px] space-y-0.5">
                          <span className="text-slate-700 font-medium">
                            Total: <strong>{batch.rows_total ?? '—'}</strong>
                          </span>
                          {(batch.rows_error !== undefined || batch.rows_warning !== undefined) && (
                            <div className="flex items-center gap-2 text-[10px]">
                              {batch.rows_error ? (
                                <span className="text-red-600 font-bold">
                                  {`${batch.rows_error} error(s)`}
                                </span>
                              ) : null}
                              {batch.rows_warning ? (
                                <span className="text-amber-700 font-semibold">
                                  {`${batch.rows_warning} warn`}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `${API_BASE_URL}/v1/batches/${batch.batch_id || batch.id}/report.xlsx`,
                                '_blank'
                              )
                            }
                            className="h-8 text-xs text-slate-600 hover:text-gov-navy p-1.5"
                            title="Download Report"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/institution/batches/${batch.batch_id || batch.id}/review`, {
                                state: { batch },
                              })
                            }
                            disabled={isSuperseded}
                            className="h-8 text-xs border-gov-navy text-gov-navy hover:bg-gov-navy/5 font-semibold"
                          >
                            <span>Review</span>
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
