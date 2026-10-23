import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileBarChart2, Download } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-gov-navy">Reports & Quality Audits</h2>
        <p className="text-xs text-slate-500 mt-1">
          Export before/after data quality audit reports, intake compliance certificates and statutory submissions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileBarChart2 className="w-5 h-5 text-gov-navy" />
              <CardTitle className="text-base">Data Quality Audit Report (XLSX / PDF)</CardTitle>
            </div>
            <CardDescription>
              Detailed multi-tab before/after report: metrics, rule violations, resolution trail, and score delta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="default" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Generate DQ Audit XLSX
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileBarChart2 className="w-5 h-5 text-gov-saffronDark" />
              <CardTitle className="text-base">AICTE Compliance & Accreditation Summary</CardTitle>
            </div>
            <CardDescription>
              Intake vs enrolment comparison, supernumerary breakdown, and reservation compliance certificate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export PDF Certificate
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
