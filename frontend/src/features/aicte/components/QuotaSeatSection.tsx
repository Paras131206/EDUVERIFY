import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SupernumerarySchemeStat, QuotaShareStat } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { PieChart, Layers, Users, Globe2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface QuotaSeatSectionProps {
  schemes: SupernumerarySchemeStat[];
  shares: {
    by_state: QuotaShareStat[];
    by_program: QuotaShareStat[];
  };
}

export const QuotaSeatSection: React.FC<QuotaSeatSectionProps> = ({ schemes, shares }) => {
  const [viewMode, setViewMode] = useState<'state' | 'program'>('state');

  const chartData = viewMode === 'state' ? shares.by_state : shares.by_program;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="quota-seat-section">
      {/* 1. SUPERNUMERARY SCHEMES BREAKDOWN */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base text-gov-navy flex items-center gap-2">
            <Layers className="w-5 h-5 text-gov-navy" />
            <span>Supernumerary Schemes Statutory Ceiling Breakdown</span>
          </CardTitle>
          <CardDescription className="text-xs">
            AICTE approved supernumerary quotas (over and above sanctioned intake) evaluated under Rule V013
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-3">
          {schemes.map((scheme) => (
            <div
              key={scheme.scheme_code}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-gov-navy bg-gov-navy/10 px-1.5 py-0.5 rounded">
                    {scheme.scheme_code}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{scheme.scheme_name}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Statutory Ceiling: <strong>{scheme.allowed_cap}</strong>
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">
                  {scheme.allotted_count.toLocaleString()} seats
                </div>
                {scheme.flagged_excess_count > 0 ? (
                  <span className="text-[10px] text-red-700 font-bold bg-red-100 px-1.5 py-0.5 rounded flex items-center gap-1 mt-0.5 justify-end">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span>+{scheme.flagged_excess_count} Excess</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-green-700 font-bold flex items-center gap-1 mt-0.5 justify-end">
                    <ShieldCheck className="w-3 h-3 text-green-600" />
                    <span>Within Cap</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 2. NRI / OCI / FN STACKED BARS */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-base text-gov-navy flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-gov-navy" />
              <span>Foreign National & NRI Seat Distribution</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Stacked distribution across Regular, Supernumerary, NRI, OCI, and Foreign National seats
            </CardDescription>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
            <button
              onClick={() => setViewMode('state')}
              className={`px-2.5 py-1 font-semibold rounded-md transition ${
                viewMode === 'state' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Top States
            </button>
            <button
              onClick={() => setViewMode('program')}
              className={`px-2.5 py-1 font-semibold rounded-md transition ${
                viewMode === 'program' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Top Programs
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: number) => val.toLocaleString()}
                  contentStyle={{ backgroundColor: '#0B2545', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="regular" name="Regular Seats" stackId="a" fill="#0B2545" />
                <Bar dataKey="supernumerary" name="Supernumerary" stackId="a" fill="#D97706" />
                <Bar dataKey="nri" name="NRI Quota" stackId="a" fill="#2563EB" />
                <Bar dataKey="oci" name="OCI" stackId="a" fill="#8B5CF6" />
                <Bar dataKey="fn" name="Foreign National" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
