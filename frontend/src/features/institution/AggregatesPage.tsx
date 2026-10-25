import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { API_BASE_URL, fetchWithAuth } from '@/lib/api';
import { ProgramAggregateItem, ReconciliationStatusItem } from './types';
import {
  CheckCircle2,
  AlertTriangle,
  Save,
  Layers,
  Scale,
  AlertCircle,
} from 'lucide-react';

export const AggregatesPage: React.FC = () => {
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [aggregates, setAggregates] = useState<ProgramAggregateItem[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aggRes, recRes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/v1/aggregates`),
        fetchWithAuth(`${API_BASE_URL}/v1/reconciliation`),
      ]);

      if (aggRes.ok) {
        const aggData = await aggRes.json();
        setAggregates(aggData);
      }
      if (recRes.ok) {
        const recData = await recRes.json();
        setReconciliation(recData);
      }
    } catch (err) {
      console.error('Failed to load aggregates data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAggregateFieldChange = (index: number, field: keyof ProgramAggregateItem, value: number) => {
    setAggregates((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: Number.isNaN(value) ? 0 : Math.max(0, value),
      };
      return copy;
    });
  };

  const handleSaveAggregates = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(null);

      const res = await fetchWithAuth(`${API_BASE_URL}/v1/aggregates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academic_year: academicYear,
          programs: aggregates,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to record aggregate enrolment submission');
      }

      setSaveSuccess('Aggregate enrolments saved and reconciled against declared intake figures.');
      // Refresh reconciliation table from backend
      const recRes = await fetch(`${API_BASE_URL}/v1/reconciliation`);
      if (recRes.ok) {
        const recData = await recRes.json();
        setReconciliation(recData);
      }

      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving aggregates';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const totalDeclared = reconciliation.reduce((acc, r) => acc + r.declared, 0);
  const totalSubmitted = reconciliation.reduce((acc, r) => acc + r.submitted, 0);
  const mismatchesCount = reconciliation.filter((r) => r.status !== 'MATCH').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gov-navy">
            Aggregate Enrolment Reporting
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dedicated submission workspace for institutions in AGGREGATE_ONLY mode and statutory AICTE intake reconciliation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            id="aggregate-academic-year"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-gov-saffron"
          >
            <option value="2026-27">Academic Year 2026-27</option>
            <option value="2025-26">Academic Year 2025-26</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-200 bg-white">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Approved Declared Seats
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalDeclared}</div>
          <p className="text-xs text-slate-400 mt-1">Sanctioned intake across all active programs</p>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Submitted Enrolment
          </span>
          <div className="mt-2 text-2xl font-bold text-gov-navy">{totalSubmitted}</div>
          <p className="text-xs text-slate-400 mt-1">Sum of aggregate submissions for {academicYear}</p>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Reconciliation Variance
          </span>
          <div className={`mt-2 text-2xl font-bold ${mismatchesCount === 0 ? 'text-green-700' : 'text-amber-600'}`}>
            {mismatchesCount === 0 ? 'Fully Reconciled' : `${mismatchesCount} Variance Discrepancies`}
          </div>
          <p className="text-xs text-slate-400 mt-1">Evaluated under AICTE Rule V022</p>
        </Card>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* SECTION 1: AGGREGATE ENROLMENT FORM */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base text-gov-navy flex items-center gap-2">
              <Layers className="w-4 h-4 text-gov-saffron" />
              <span>Program Enrolment Breakdown Form</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Enter total enrolled heads along with supernumerary and foreign quota sub-counts for each program
            </CardDescription>
          </div>
          <Button
            form="aggregate-form"
            type="submit"
            variant="saffron"
            size="sm"
            disabled={saving || loading}
            id="submit-aggregates-btn"
            className="flex items-center gap-1.5 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save & Reconcile'}</span>
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <form id="aggregate-form" onSubmit={handleSaveAggregates}>
            <Table id="aggregates-form-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Program Code & Title</TableHead>
                  <TableHead className="w-28 text-center">Declared Intake</TableHead>
                  <TableHead className="w-32 text-center">Total Enrolled *</TableHead>
                  <TableHead className="w-28 text-center">Supernumerary</TableHead>
                  <TableHead className="w-24 text-center">NRI</TableHead>
                  <TableHead className="w-24 text-center">OCI</TableHead>
                  <TableHead className="w-24 text-center">FN (Foreign)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-xs text-slate-500">
                      Loading program templates...
                    </TableCell>
                  </TableRow>
                ) : (
                  aggregates.map((item, idx) => (
                    <TableRow key={item.program_code} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="font-bold text-xs text-slate-900">{item.program_code}</div>
                        <div className="text-[11px] text-slate-500">{item.program_name}</div>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-xs text-slate-600 bg-slate-50/80">
                        {item.declared_intake}
                      </TableCell>
                      <TableCell>
                        <Input
                          id={`agg-total-${item.program_code}`}
                          type="number"
                          min={0}
                          value={item.total_enrolment}
                          onChange={(e) => handleAggregateFieldChange(idx, 'total_enrolment', parseInt(e.target.value, 10))}
                          className="text-xs font-mono font-bold text-center h-8"
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          id={`agg-super-${item.program_code}`}
                          type="number"
                          min={0}
                          value={item.supernumerary_count}
                          onChange={(e) => handleAggregateFieldChange(idx, 'supernumerary_count', parseInt(e.target.value, 10))}
                          className="text-xs font-mono text-center h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          id={`agg-nri-${item.program_code}`}
                          type="number"
                          min={0}
                          value={item.nri_count}
                          onChange={(e) => handleAggregateFieldChange(idx, 'nri_count', parseInt(e.target.value, 10))}
                          className="text-xs font-mono text-center h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          id={`agg-oci-${item.program_code}`}
                          type="number"
                          min={0}
                          value={item.oci_count}
                          onChange={(e) => handleAggregateFieldChange(idx, 'oci_count', parseInt(e.target.value, 10))}
                          className="text-xs font-mono text-center h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          id={`agg-fn-${item.program_code}`}
                          type="number"
                          min={0}
                          value={item.fn_count}
                          onChange={(e) => handleAggregateFieldChange(idx, 'fn_count', parseInt(e.target.value, 10))}
                          className="text-xs font-mono text-center h-8"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </form>
        </CardContent>
      </Card>

      {/* SECTION 2: RECONCILIATION VIEW DECLARED VS SUBMITTED */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base text-gov-navy flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-gov-navy" />
              <span>Intake Reconciliation: Declared Quota vs. Submitted Enrolment</span>
            </div>
            <span className="text-xs text-slate-500 font-normal">Automated Audit per Rule V022</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Comparison between approved sanction from AICTE Approval Portal and actual enrolments reported by institution
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Table id="reconciliation-table">
            <TableHeader>
              <TableRow>
                <TableHead>Program Code & Title</TableHead>
                <TableHead className="text-right">Declared (Approved Intake)</TableHead>
                <TableHead className="text-right">Submitted Enrolment</TableHead>
                <TableHead className="text-right">Variance (Delta)</TableHead>
                <TableHead className="text-center">Reconciliation Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliation.map((rec) => {
                const isMatch = rec.status === 'MATCH';
                const isExcess = rec.status === 'EXCESS';
                return (
                  <TableRow key={rec.program_code} className="hover:bg-slate-50/50">
                    <TableCell>
                      <span className="font-bold text-xs text-slate-900 block">{rec.program_code}</span>
                      <span className="text-[11px] text-slate-500">{rec.program_name}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-slate-700">
                      {rec.declared} seats
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                      {rec.submitted} students
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">
                      <span
                        className={
                          rec.delta === 0
                            ? 'text-slate-500'
                            : rec.delta > 0
                            ? 'text-red-600'
                            : 'text-amber-600'
                        }
                      >
                        {rec.delta > 0 ? `+${rec.delta}` : rec.delta}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {isMatch ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span>MATCH</span>
                        </span>
                      ) : isExcess ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>EXCESS (OVER-ENROLLED)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>MISMATCH (UNDER-FILLED)</span>
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
