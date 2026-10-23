import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { mockAicteSummary } from '@/mocks/data';
import { Building, Users, AlertTriangle, ShieldCheck } from 'lucide-react';

export const AicteDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-gov-navy">AICTE Central Repository Console</h2>
        <p className="text-xs text-slate-500 mt-1">
          National apex dashboard: APAAR-keyed student data management, anomaly feeds & coverage analytics
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-gov-navy rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Verified Students</p>
              <p className="text-xl font-bold text-slate-900">{mockAicteSummary.total_students.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Approved Institutions</p>
              <p className="text-xl font-bold text-slate-900">{mockAicteSummary.total_institutions.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 text-green-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">National Coverage</p>
              <p className="text-xl font-bold text-slate-900">{mockAicteSummary.coverage_percentage}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-700 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Cross-Institution Dupes</p>
              <p className="text-xl font-bold text-red-600">{mockAicteSummary.cross_institution_dupes_count}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">National Anomaly & Duplicate Detection Feed</CardTitle>
          <CardDescription>
            Real-time heuristic flags across all institutions using vectorised fuzzy comparison and IsolationForest
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-semibold text-slate-800">Inst 1-9876543210 vs Inst 1-1234567890</span>
              <span className="text-red-700 font-semibold bg-red-100 px-2 py-0.5 rounded">V010 Active Duplicate</span>
            </div>
            <p>Same APAAR ID 1234****9012 enrolled concurrently in regular programs across two institutions without transfer approval.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
