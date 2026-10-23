import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QualityScoreGauge } from '@/components/shared/QualityScoreGauge';
import { mockInstitutionSummary, mockBatches } from '@/mocks/data';
import { Link } from 'react-router-dom';
import { UploadCloud, CheckSquare, Clock } from 'lucide-react';

export const InstitutionDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gov-navy">Institution Portal</h2>
          <p className="text-xs text-slate-500 mt-1">{mockInstitutionSummary.institution_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/institution/upload">
            <Button variant="default">
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload Student Batch
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <CardTitle className="text-sm font-medium text-slate-500 mb-3">Overall Quality Score</CardTitle>
          <QualityScoreGauge score={mockInstitutionSummary.latest_quality_score} scoreBefore={68.0} size="md" />
        </Card>

        <Card className="p-6 flex flex-col justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-slate-500">Enrolment vs Approved Intake</CardTitle>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{mockInstitutionSummary.total_enrolled}</span>
              <span className="text-sm text-slate-500">/ {mockInstitutionSummary.approved_intake} seats</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
              <div
                className="bg-gov-navy h-2 rounded-full"
                style={{
                  width: `${(mockInstitutionSummary.total_enrolled / mockInstitutionSummary.approved_intake) * 100}%`,
                }}
              />
            </div>
          </div>
          <p className="text-xs text-green-700 font-medium mt-4">Within approved limits (0 excess)</p>
        </Card>

        <Card className="p-6 flex flex-col justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-slate-500">Action Required</CardTitle>
            <div className="mt-4 text-3xl font-bold text-amber-600">
              {mockInstitutionSummary.pending_review_count} Issues
            </div>
            <p className="text-xs text-slate-500 mt-1">Found in Batch 2 (requires human review)</p>
          </div>
          <Link to="/institution/batches/batch-demo-2/review" className="mt-4">
            <Button variant="saffron" size="sm" className="w-full">
              <CheckSquare className="w-4 h-4 mr-2" />
              Open Review Workspace
            </Button>
          </Link>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Batches</CardTitle>
          <CardDescription>Upload history for academic year 2026-27</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-200">
            {mockBatches.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{b.filename}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>Uploaded {new Date(b.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{b.rows_total} rows</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                      b.status === 'COMMITTED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {b.status}
                  </span>
                  <Link to={`/institution/batches/${b.id}/review`}>
                    <Button variant="outline" size="sm">
                      View Report
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
