import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ReconciliationRecordItem } from '../types';
import {
  Scale,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface ReconciliationViewSectionProps {
  initialItems: ReconciliationRecordItem[];
}

export const ReconciliationViewSection: React.FC<ReconciliationViewSectionProps> = ({
  initialItems,
}) => {
  const [items] = useState<ReconciliationRecordItem[]>(initialItems);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MISMATCH' | 'EXCESS' | 'MATCH'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.institution_name.toLowerCase().includes(q) ||
      item.institution_aicte_id.toLowerCase().includes(q) ||
      item.program_code.toLowerCase().includes(q) ||
      item.program_name.toLowerCase().includes(q)
    );
  });

  return (
    <Card className="border-slate-200 bg-white shadow-xs" data-testid="reconciliation-view-section">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-base text-gov-navy flex items-center gap-2">
            <Scale className="w-5 h-5 text-gov-navy" />
            <span>National Program Intake Reconciliation View</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Cross-verification between declared statutory quotas vs individual uploaded enrolments under AICTE Rule V022
          </CardDescription>
        </div>

        {/* Filter buttons & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              data-testid="filter-rec-all"
              className={`px-2.5 py-1 font-semibold rounded-md transition ${
                statusFilter === 'ALL' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setStatusFilter('MISMATCH')}
              data-testid="filter-rec-mismatch"
              className={`px-2.5 py-1 font-semibold rounded-md transition ${
                statusFilter === 'MISMATCH' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Mismatches Only
            </button>
            <button
              onClick={() => setStatusFilter('EXCESS')}
              data-testid="filter-rec-excess"
              className={`px-2.5 py-1 font-semibold rounded-md transition ${
                statusFilter === 'EXCESS' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Excess Only
            </button>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search institution / program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8 bg-white"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs">Institution</TableHead>
                <TableHead className="text-xs">Program</TableHead>
                <TableHead className="text-xs text-right">Declared Quota</TableHead>
                <TableHead className="text-xs text-right">Uploaded Enrolment</TableHead>
                <TableHead className="text-xs text-right">Variance / Delta</TableHead>
                <TableHead className="text-xs text-center">Reconciliation Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs text-slate-500 py-6">
                    No reconciliation items matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/60">
                    <TableCell>
                      <div className="font-bold text-xs text-slate-900">{item.institution_name}</div>
                      <div className="font-mono text-[10px] text-slate-500">{item.institution_aicte_id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-xs text-gov-navy">{item.program_code}</div>
                      <div className="text-[11px] text-slate-500">{item.program_name}</div>
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium text-slate-800">
                      {item.declared_intake}
                    </TableCell>
                    <TableCell className="text-xs text-right font-bold text-gov-navy">
                      {item.uploaded_enrolment}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono font-bold">
                      <span
                        className={
                          item.delta > 0
                            ? 'text-red-600'
                            : item.delta < 0
                            ? 'text-amber-600'
                            : 'text-green-700'
                        }
                      >
                        {item.delta > 0 ? `+${item.delta}` : item.delta}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                          item.status === 'MATCH'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : item.status === 'EXCESS'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {item.status === 'MATCH' && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                        {item.status === 'EXCESS' && <Flame className="w-3 h-3 text-red-600" />}
                        {item.status === 'MISMATCH' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                        <span>{item.status}</span>
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
