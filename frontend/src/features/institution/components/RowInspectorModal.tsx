import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MaskedValue } from '@/components/shared/MaskedValue';
import { X, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';
import { CanonicalStudentRecord } from '../types';
import { fetchWithAuth } from '@/lib/api';

interface RowInspectorModalProps {
  batchId: string;
  row: number;
  highlightField: string;
  onClose: () => void;
}

export const RowInspectorModal: React.FC<RowInspectorModalProps> = ({
  batchId,
  row,
  highlightField,
  onClose,
}) => {
  const [record, setRecord] = useState<CanonicalStudentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchWithAuth(`/v1/batches/${batchId}/records/${row}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setRecord(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch row record');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [batchId, row]);

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const fieldLabels: Record<keyof CanonicalStudentRecord, string> = {
    row: 'Row Number',
    apaar_id: 'APAAR ID (12-digit)',
    institution_aicte_id: 'AICTE Institution ID',
    institution_student_id: 'Student / Roll / PRN',
    full_name: 'Full Legal Name',
    dob: 'Date of Birth (YYYY-MM-DD)',
    gender: 'Gender',
    category: 'Category (Social Reservation)',
    program_code: 'Program Code',
    course_level: 'Course Level',
    department: 'Department',
    academic_year: 'Academic Year',
    year_of_study: 'Year of Study',
    admission_date: 'Admission Date',
    admission_type: 'Admission Type',
    seat_type: 'Seat Type',
    quota: 'Quota Category',
    nationality: 'Nationality',
    enrolment_status: 'Enrolment Status',
    consent_status: 'DPDP Consent Status',
    email: 'Email (Masked)',
    mobile: 'Mobile Number (Masked)',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="row-inspector-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gov-navy text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-gov-saffron" />
            <div>
              <h3 id="row-inspector-title" className="font-bold text-base">
                Row #{row} Full Student Record
              </h3>
              <p className="text-xs text-slate-300">
                Batch: <code className="font-mono text-gov-saffron">{batchId}</code> · Masked PII per DPDP Act
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Inspector"
            className="text-slate-300 hover:text-white p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight notification */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Offending field under diagnostic review: <strong className="font-mono text-amber-950 underline">{highlightField}</strong>
            </span>
          </div>
          <span className="bg-amber-200/70 text-amber-950 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
            Target Cell
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-gov-navy border-t-transparent rounded-full animate-spin" />
              <span>Loading student record...</span>
            </div>
          ) : error || !record ? (
            <div className="text-center py-8 text-xs text-red-600">
              {error || 'Unable to load record for row #' + row}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {(Object.keys(fieldLabels) as (keyof CanonicalStudentRecord)[]).map((fieldKey) => {
                const isTarget = fieldKey.toLowerCase() === highlightField.toLowerCase();
                const rawVal = record[fieldKey];
                const displayVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : '—';

                return (
                  <div
                    key={fieldKey}
                    className={`p-2.5 rounded-lg border transition ${
                      isTarget
                        ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-300 shadow-sm'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-500 text-[11px]">
                        {fieldLabels[fieldKey] || fieldKey}
                      </span>
                      {isTarget && (
                        <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded">
                          OFFENDING CELL
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-slate-800 break-all font-semibold">
                      {fieldKey === 'apaar_id' ? (
                        <MaskedValue value={displayVal} kind="apaar" canUnmask />
                      ) : fieldKey === 'email' ? (
                        <MaskedValue value={displayVal} kind="email" canUnmask />
                      ) : fieldKey === 'mobile' ? (
                        <MaskedValue value={displayVal} kind="mobile" canUnmask />
                      ) : (
                        displayVal
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            <span>Audited row extraction under DPDP Act compliance</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
};
