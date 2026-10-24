import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { MaskedValue } from '@/components/shared/MaskedValue';
import { Scale, CheckCircle2, XCircle } from 'lucide-react';

interface DisputeItem {
  id: string;
  institution_name: string;
  academic_year: string;
  rule_id: string;
  field: string;
  apaar_id: string;
  dispute_reason: string;
  status: 'PENDING_REVIEW' | 'UPHELD' | 'DISMISSED';
  filed_at: string;
}

const mockDisputes: DisputeItem[] = [
  {
    id: 'dsp-001',
    institution_name: 'Delhi Institute of Engineering & Technology',
    academic_year: '2026-27',
    rule_id: 'V010',
    field: 'apaar_id',
    apaar_id: '984572912301',
    dispute_reason: 'Inter-state lateral migration approved by state Directorate of Technical Education.',
    status: 'PENDING_REVIEW',
    filed_at: '2026-08-11T11:20:00Z',
  },
  {
    id: 'dsp-002',
    institution_name: 'Pune College of Engineering',
    academic_year: '2026-27',
    rule_id: 'V014',
    field: 'category',
    apaar_id: '984588129944',
    dispute_reason: 'EWS reservation quota reallocated under state government notification No. 44/2026.',
    status: 'PENDING_REVIEW',
    filed_at: '2026-08-10T16:05:00Z',
  },
];

export const DabDashboardPage: React.FC = () => {
  const [disputes, setDisputes] = useState<DisputeItem[]>(mockDisputes);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleResolve = (id: string, resolution: 'UPHELD' | 'DISMISSED') => {
    setDisputes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: resolution } : d))
    );
    setSelectedDispute(null);
    setToastMessage(`Dispute ${id} marked as ${resolution}. Official appellate order registered.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-gov-navy" />
            <h2 className="text-2xl font-bold tracking-tight text-gov-navy">
              Defect Advisory Board (DAB) Portal
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Independent dispute resolution, institutional appeals, and cross-regulatory exception adjudication
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-semibold border border-slate-200">
            North Regional Bench (Panel 04)
          </span>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-md text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Active Appeals</CardDescription>
            <CardTitle className="text-2xl font-bold text-gov-navy">
              {disputes.filter((d) => d.status === 'PENDING_REVIEW').length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-slate-500">
            Pending hearing before appellate quorum
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Avg. Resolution Time</CardDescription>
            <CardTitle className="text-2xl font-bold text-gov-saffronDark">
              2.4 Days
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-slate-500">
            Statutory limit: 7 working days
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Uphold Rate</CardDescription>
            <CardTitle className="text-2xl font-bold text-green-700">
              68.5%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-slate-500">
            Institutions granted relief on documentation
          </CardContent>
        </Card>
      </div>

      {/* Disputes Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adjudication Docket</CardTitle>
          <CardDescription>
            Review and resolve student record validation disputes escalated by institutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Rule Violation</TableHead>
                <TableHead>APAAR ID</TableHead>
                <TableHead>Filing Summary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs font-semibold text-gov-navy">
                    {d.id}
                  </TableCell>
                  <TableCell className="text-xs font-medium max-w-[200px] truncate">
                    {d.institution_name}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800">
                      {d.rule_id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <MaskedValue value={d.apaar_id} kind="apaar" />
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-[240px] truncate">
                    {d.dispute_reason}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        d.status === 'PENDING_REVIEW'
                          ? 'bg-amber-100 text-amber-800'
                          : d.status === 'UPHELD'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {d.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDispute(d)}
                      className="text-xs"
                    >
                      Review Case
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Case Review Modal */}
      {selectedDispute && (
        <div
          role="dialog"
          aria-labelledby="case-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-4 border-gov-navy space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {selectedDispute.id}
                </span>
                <h3 id="case-modal-title" className="text-lg font-bold text-gov-navy">
                  Adjudicate Appeal: {selectedDispute.rule_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
              <div>
                <span className="text-slate-500">Institution:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {selectedDispute.institution_name}
                </span>
              </div>
              <div>
                <span className="text-slate-500">APAAR ID:</span>{' '}
                <span className="font-mono font-semibold text-gov-navy">
                  {selectedDispute.apaar_id}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Institutional Grounds:</span>
                <p className="mt-1 font-medium text-slate-800 bg-white p-2 rounded border border-slate-200">
                  {selectedDispute.dispute_reason}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Upholding this appeal creates an auditable DAB exemption certificate and clears the validation block for admission rollover.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDispute(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleResolve(selectedDispute.id, 'DISMISSED')}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Dismiss Appeal
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleResolve(selectedDispute.id, 'UPHELD')}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Uphold & Issue Exemption
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
