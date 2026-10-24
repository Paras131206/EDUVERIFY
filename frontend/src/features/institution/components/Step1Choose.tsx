import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import { BatchItem } from '../types';

interface Step1ChooseProps {
  onSuccess: (batch: { id: string; filename: string; academic_year: string }) => void;
}

export const Step1Choose: React.FC<Step1ChooseProps> = ({ onSuccess }) => {
  const [academicYears, setAcademicYears] = useState<string[]>(['2026-27', '2025-26']);
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [file, setFile] = useState<File | null>(null);
  const [supersedesBatchId, setSupersedesBatchId] = useState<string>('');
  const [existingBatches, setExistingBatches] = useState<BatchItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openBatchConflict, setOpenBatchConflict] = useState<{ open_batch_id: string; detail: string } | null>(
    null
  );

  // Fetch academic years master and existing batches
  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE_URL}/v1/master/academic-years`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { academic_year: string; is_current?: boolean }[]) => {
        if (!mounted || !data.length) return;
        const years = data.map((d) => d.academic_year);
        setAcademicYears(years);
        const current = data.find((d) => d.is_current);
        if (current) setAcademicYear(current.academic_year);
      })
      .catch(() => {});

    fetch(`${API_BASE_URL}/v1/batches`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: BatchItem[]) => {
        if (mounted && Array.isArray(data)) {
          setExistingBatches(data);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const onDrop = (acceptedFiles: File[], fileRejections: unknown[]) => {
    setErrorMessage(null);
    setOpenBatchConflict(null);

    if (fileRejections && fileRejections.length > 0) {
      setErrorMessage('File rejected. Please upload a valid CSV or XLSX file under 10 MB.');
      return;
    }

    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      if (selected.size > 10 * 1024 * 1024) {
        setErrorMessage('File size exceeds the 10 MB limit.');
        return;
      }
      setFile(selected);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv', '.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const handleUseDemoFile = () => {
    const demoFile = new File(['mock demo binary'], 'batch_2_errors.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    setFile(demoFile);
    setErrorMessage(null);
    setOpenBatchConflict(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setErrorMessage(null);
    setOpenBatchConflict(null);

    const idempotencyKey =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('academic_year', academicYear);
    if (supersedesBatchId) {
      formData.append('supersedes_batch_id', supersedesBatchId);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/batches`, {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: formData,
      });

      if (response.status === 409) {
        const errData = await response.json();
        setOpenBatchConflict({
          open_batch_id: errData.open_batch_id || 'batch-demo-2',
          detail:
            errData.detail ||
            `An open batch already exists for academic year ${academicYear}. Please review the open batch or select it under "Replaces previous batch".`,
        });
        setIsUploading(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Upload failed');
      }

      const createdBatch = await response.json();
      setIsUploading(false);
      onSuccess({
        id: createdBatch.id,
        filename: file.name || createdBatch.filename || 'uploaded_batch.csv',
        academic_year: createdBatch.academic_year || academicYear,
      });
    } catch (err: unknown) {
      setIsUploading(false);
      const msg = err instanceof Error ? err.message : 'Upload failed. Please check network connection.';
      setErrorMessage(msg);
    }
  };

  const relevantPreviousBatches = existingBatches.filter(
    (b) => b.academic_year === academicYear && b.status !== 'SUPERSEDED'
  );

  return (
    <div className="space-y-6">
      {/* Official Template Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base text-gov-navy flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-gov-saffron" />
                Official Student Ingestion Template
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Pre-formatted with 12-digit APAAR text validation, dropdown lists for categories & quotas, and field instructions.
              </CardDescription>
            </div>
            <a
              href={`${API_BASE_URL}/v1/templates/student-upload.xlsx`}
              download="student-upload.xlsx"
              className="inline-flex items-center"
            >
              <Button
                variant="outline"
                size="sm"
                className="border-gov-navy text-gov-navy hover:bg-gov-navy/5 font-semibold text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download Template (.xlsx)
              </Button>
            </a>
          </div>
        </CardHeader>
      </Card>

      {/* 409 Conflict Alert Banner */}
      {openBatchConflict && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-lg bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-sm space-y-2 animate-in fade-in"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Batch Conflict (HTTP 409) — Open Batch Exists
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">{openBatchConflict.detail}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 pl-7">
            <Link
              to={`/institution/batches/${openBatchConflict.open_batch_id}/review`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gov-navy bg-white hover:bg-slate-50 px-3 py-1.5 rounded border border-amber-300 shadow-sm transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gov-saffron" />
              Go to Open Batch ({openBatchConflict.open_batch_id})
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSupersedesBatchId(openBatchConflict.open_batch_id);
                setOpenBatchConflict(null);
              }}
              className="text-xs h-8 border-amber-400 bg-amber-100/60 hover:bg-amber-100 text-amber-900"
            >
              Set as Batch to Supersede & Retry
            </Button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Form Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-gov-navy">Step 1: Choose File & Academic Session</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Select the target academic year and upload student admission records (CSV or XLSX up to 10 MB).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Academic Year select */}
            <div>
              <label
                htmlFor="academic-year-select"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                id="academic-year-select"
                value={academicYear}
                onChange={(e) => {
                  setAcademicYear(e.target.value);
                  setOpenBatchConflict(null);
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-gov-saffron"
              >
                {academicYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} {yr === '2026-27' ? '(Current Academic Year)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Records will be validated against this year&apos;s AICTE approved intake.
              </p>
            </div>

            {/* Optional Supersedes Batch Picker */}
            <div>
              <label
                htmlFor="supersedes-batch-select"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Replaces Previous Batch <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                id="supersedes-batch-select"
                value={supersedesBatchId}
                onChange={(e) => setSupersedesBatchId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-gov-saffron"
              >
                <option value="">-- None (New independent batch) --</option>
                {relevantPreviousBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} · {b.filename} ({b.status})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                If replacing an earlier revision, previous uncommitted records will be marked SUPERSEDED.
              </p>
            </div>
          </div>

          {/* react-dropzone Area */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select or Drop Batch File <span className="text-red-500">*</span>
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragReject
                  ? 'border-red-400 bg-red-50/50'
                  : isDragActive
                    ? 'border-gov-saffron bg-amber-50/40 scale-[1.01]'
                    : 'border-slate-300 hover:border-gov-navy bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              <input {...getInputProps()} aria-label="Drop student batch file here" />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-gov-navy/10 flex items-center justify-center text-gov-navy">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700">
                    {isDragActive
                      ? 'Drop file here to upload...'
                      : 'Drag & drop batch file here, or click to browse'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Supports .csv, .xlsx, .xls up to 10 MB per file
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Shortcut */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Want to test real verification with errors?
              </span>
              <button
                type="button"
                onClick={handleUseDemoFile}
                className="text-[11px] font-semibold text-gov-navy hover:text-gov-navyDark underline underline-offset-2 flex items-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-gov-saffron" />
                Use Demo File: batch_2_errors.xlsx
              </button>
            </div>
          </div>

          {/* Selected File Confirmation */}
          {file && (
            <div className="p-3.5 bg-green-50/80 rounded-lg border border-green-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center text-green-700">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-green-900">{file.name}</p>
                  <p className="text-[11px] text-green-700">
                    {(file.size / 1024).toFixed(1)} KB · Ready for smart column mapping
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-[11px] text-slate-400 hover:text-red-600 underline"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Idempotency protection enabled (UUID key generated per upload)
            </span>
            <Button
              variant="default"
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold px-4 py-2"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Uploading Batch...
                </>
              ) : (
                <>
                  Proceed to Column Mapping
                  <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
