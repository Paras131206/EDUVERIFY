import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QualityScoreGauge } from '@/components/shared/QualityScoreGauge';
import { RevalidationResult } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface BeforeAfterPanelProps {
  batchId: string;
  revalidationResult?: RevalidationResult | null;
  scoreBefore: number;
  scoreAfter: number;
  resolvedCount: number;
  pendingCount: number;
  onDownloadXlsx: () => void;
  onDownloadPdf: () => void;
}

export const BeforeAfterPanel: React.FC<BeforeAfterPanelProps> = ({
  batchId,
  revalidationResult,
  scoreBefore,
  scoreAfter,
  resolvedCount,
  pendingCount,
  onDownloadXlsx,
  onDownloadPdf,
}) => {

  // Chart Data for Priority Deltas
  const priorityChartData = revalidationResult?.priority_deltas?.map((p) => ({
    name: p.priority,
    'Before (Open)': p.before,
    'After (Remaining)': p.after,
  })) || [
    { name: 'CRITICAL', 'Before (Open)': 1, 'After (Remaining)': 0 },
    { name: 'HIGH', 'Before (Open)': 3, 'After (Remaining)': 1 },
    { name: 'MEDIUM', 'Before (Open)': 0, 'After (Remaining)': 0 },
    { name: 'LOW', 'Before (Open)': 1, 'After (Remaining)': 0 },
  ];

  // Chart Data for Rule Deltas
  const ruleChartData = revalidationResult?.rule_deltas?.map((r) => ({
    name: r.rule_id,
    fullName: r.rule_name,
    'Before (Violations)': r.before,
    'After (Remaining)': r.after,
  })) || [
    { name: 'V002', fullName: 'apaar_id 12-digit format', 'Before (Violations)': 1, 'After (Remaining)': 0 },
    { name: 'V004', fullName: 'Name/DOB registry mismatch', 'Before (Violations)': 1, 'After (Remaining)': 1 },
    { name: 'V021', fullName: 'Sanction ceiling excess', 'Before (Violations)': 1, 'After (Remaining)': 0 },
    { name: 'V030', fullName: 'Enum casing normalization', 'Before (Violations)': 1, 'After (Remaining)': 0 },
  ];

  const scoreDelta = Math.round((scoreAfter - scoreBefore) * 10) / 10;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner with Score Gauge and Key Metrics */}
      <Card className="border-t-4 border-t-gov-saffron shadow-sm overflow-hidden bg-gradient-to-r from-slate-50 via-white to-amber-50/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Score Comparison Gauge */}
            <div className="md:col-span-5 flex flex-col sm:flex-row items-center gap-6 border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-6">
              <QualityScoreGauge score={scoreAfter} scoreBefore={scoreBefore} size="lg" />
              <div className="space-y-1.5 text-center sm:text-left">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Quality Score Progression · Batch {batchId}
                </span>
                <div className="text-2xl font-black text-gov-navy flex items-center gap-2">
                  <span>{scoreBefore}%</span>
                  <span className="text-slate-400 font-normal">→</span>
                  <span className="text-green-600">{scoreAfter}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full inline-flex">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{scoreDelta}% DQ Improvement</span>
                </div>
              </div>
            </div>

            {/* Resolved vs Pending Counters */}
            <div className="md:col-span-4 grid grid-cols-2 gap-3 text-center">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-center gap-1 text-green-700 text-xs font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Resolved Issues</span>
                </div>
                <span className="text-2xl font-bold text-slate-900">{resolvedCount}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Fixed or Justified</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-center gap-1 text-amber-700 text-xs font-semibold mb-1">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Pending Issues</span>
                </div>
                <span className="text-2xl font-bold text-slate-900">{pendingCount}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Remaining in Queue</p>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="md:col-span-3 flex flex-col gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadXlsx}
                className="w-full text-xs h-9 text-slate-700 justify-start"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                <span>Download DQ comparison XLSX</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadPdf}
                className="w-full text-xs h-9 text-slate-700 justify-start"
              >
                <FileText className="w-4 h-4 mr-2 text-red-600" />
                <span>Download DQ comparison PDF</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delta Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Deltas Chart */}
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="py-4 px-6 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gov-saffron" />
              <span>Priority Level Impact (Before vs After)</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Distribution of open issues across priority bands before and after re-validation
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: '#cbd5e1' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="Before (Open)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="After (Remaining)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rule-by-Rule Deltas Chart */}
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="py-4 px-6 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gov-navy" />
              <span>Rule-Level Resolution Deltas</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Rule violations count comparison before and after review actions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ruleChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: '#cbd5e1' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="Before (Violations)" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="After (Remaining)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
