import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  PieChart,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  Info,
} from 'lucide-react';

export interface CategoryQuotaItem {
  id: string;
  category: string;
  label: string;
  statutory_percentage: number;
  allocated_seats: number;
  enrolled_seats: number;
  is_horizontal?: boolean;
}

const INITIAL_QUOTAS: CategoryQuotaItem[] = [
  {
    id: 'gen',
    category: 'GEN',
    label: 'General / Open Merit',
    statutory_percentage: 40.5,
    allocated_seats: 211,
    enrolled_seats: 205,
  },
  {
    id: 'obc',
    category: 'OBC-NCL',
    label: 'Other Backward Classes (NCL)',
    statutory_percentage: 27.0,
    allocated_seats: 140,
    enrolled_seats: 138,
  },
  {
    id: 'sc',
    category: 'SC',
    label: 'Scheduled Castes',
    statutory_percentage: 15.0,
    allocated_seats: 78,
    enrolled_seats: 81, // Over-quota demo trigger
  },
  {
    id: 'st',
    category: 'ST',
    label: 'Scheduled Tribes',
    statutory_percentage: 7.5,
    allocated_seats: 39,
    enrolled_seats: 36,
  },
  {
    id: 'ews',
    category: 'EWS',
    label: 'Economically Weaker Section',
    statutory_percentage: 10.0,
    allocated_seats: 52,
    enrolled_seats: 48,
  },
  {
    id: 'pwd',
    category: 'PwD',
    label: 'Persons with Disabilities (Horizontal 5%)',
    statutory_percentage: 5.0,
    allocated_seats: 26,
    enrolled_seats: 22,
    is_horizontal: true,
  },
];

export const CategoryQuotaEngine: React.FC = () => {
  const [quotas, setQuotas] = useState<CategoryQuotaItem[]>(INITIAL_QUOTAS);
  const [editingModalOpen, setEditingModalOpen] = useState(false);
  const [tempQuotas, setTempQuotas] = useState<CategoryQuotaItem[]>(INITIAL_QUOTAS);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');

  const totalSanctionedIntake = 520;
  const regularQuotas = quotas.filter((q) => !q.is_horizontal);
  const totalAllocated = regularQuotas.reduce((sum, q) => sum + q.allocated_seats, 0);
  const totalEnrolled = regularQuotas.reduce((sum, q) => sum + q.enrolled_seats, 0);

  // Identify breach alerts
  const breaches = quotas.filter((q) => q.enrolled_seats > q.allocated_seats);
  const nearCapacities = quotas.filter(
    (q) =>
      q.enrolled_seats <= q.allocated_seats &&
      q.enrolled_seats / q.allocated_seats >= 0.95
  );

  const handleOpenEdit = () => {
    setTempQuotas(JSON.parse(JSON.stringify(quotas)));
    setEditingModalOpen(true);
    setSaveMessage(null);
  };

  const handleSeatChange = (id: string, newSeats: number) => {
    setTempQuotas((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, allocated_seats: Math.max(0, newSeats) } : item
      )
    );
  };

  const tempTotalAllocated = tempQuotas
    .filter((q) => !q.is_horizontal)
    .reduce((sum, q) => sum + q.allocated_seats, 0);

  const handleSaveQuotas = (e: React.FormEvent) => {
    e.preventDefault();
    setQuotas(tempQuotas);
    setEditingModalOpen(false);
    setSaveMessage(
      'Category quota seat allocation successfully updated. Automated admission verification refreshed.'
    );
    setTimeout(() => setSaveMessage(null), 4000);
  };

  return (
    <Card className="border-slate-200 bg-white shadow-xs" data-testid="category-quota-engine">
      <CardHeader className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-gov-saffron/20 text-gov-navy text-[10px] font-bold uppercase tracking-wider">
              ANALYTICAL ENGINE
            </span>
            <CardTitle className="text-base font-bold text-gov-navy flex items-center gap-2">
              <PieChart className="w-4 h-4 text-gov-saffron" />
              <span>Statutory Category Quotas & Seat Allocation Engine</span>
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Real-time compliance monitoring for SC, ST, OBC-NCL, EWS, and General category intake limits under central/state statutory reservation mandates.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-gov-navy"
            aria-label="Filter by Program"
          >
            <option value="ALL">All Programs (520 Seats)</option>
            <option value="UG-CSE">UG-CSE (Computer Science - 60)</option>
            <option value="UG-ECE">UG-ECE (Electronics - 60)</option>
            <option value="UG-ME">UG-ME (Mechanical - 60)</option>
            <option value="PG-MBA">PG-MBA (Management - 40)</option>
          </select>
          <Button
            size="sm"
            onClick={handleOpenEdit}
            className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold"
          >
            <Sliders className="w-3.5 h-3.5 mr-1.5" />
            Adjust Category Quotas
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {saveMessage && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-900 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Real-time Alerts */}
        {breaches.length > 0 && (
          <div
            role="alert"
            className="p-3.5 rounded-lg border-2 border-red-300 bg-red-50 text-red-900 flex items-start gap-3 animate-in fade-in"
          >
            <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-800">
                Statutory Reservation Quota Breach Detected ({breaches.length} Category Alert)
              </h4>
              <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                {breaches.map((b) => (
                  <span key={b.id} className="block">
                    • <strong>{b.label} ({b.category})</strong>: Enrolled count ({b.enrolled_seats} seats) exceeds approved statutory quota ({b.allocated_seats} seats) by <strong>+{b.enrolled_seats - b.allocated_seats} excess students</strong>. AICTE Rule V012/V015 alert triggered.
                  </span>
                ))}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenEdit}
              className="text-xs border-red-300 bg-white text-red-800 hover:bg-red-50 shrink-0"
            >
              Reallocate Seats
            </Button>
          </div>
        )}

        {nearCapacities.length > 0 && breaches.length === 0 && (
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/70 text-amber-900 flex items-center gap-2.5 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Near Capacity Alert: {nearCapacities.map((n) => `${n.category} (${Math.round((n.enrolled_seats / n.allocated_seats) * 100)}% filled)`).join(', ')}. Automated admission pipeline approaching threshold.
            </span>
          </div>
        )}

        {/* Category Breakdown Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs">Category Code</TableHead>
                <TableHead className="text-xs">Statutory Category Name</TableHead>
                <TableHead className="text-xs text-right">Statutory %</TableHead>
                <TableHead className="text-xs text-right">Allocated Quota</TableHead>
                <TableHead className="text-xs text-right">Enrolled Students</TableHead>
                <TableHead className="text-xs text-right">Fill Ratio</TableHead>
                <TableHead className="text-xs text-right">Vacancy / Excess</TableHead>
                <TableHead className="text-xs text-center">Compliance Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotas.map((item) => {
                const fillRatio = ((item.enrolled_seats / item.allocated_seats) * 100).toFixed(1);
                const variance = item.allocated_seats - item.enrolled_seats;
                const isBreached = item.enrolled_seats > item.allocated_seats;
                const isNearCapacity = !isBreached && Number(fillRatio) >= 95;

                return (
                  <TableRow
                    key={item.id}
                    className={isBreached ? 'bg-red-50/60 font-medium' : undefined}
                  >
                    <TableCell className="font-mono text-xs font-bold text-gov-navy">
                      {item.category}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-800">
                      {item.label}
                      {item.is_horizontal && (
                        <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-normal">
                          Horizontal
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono">
                      {item.statutory_percentage}%
                    </TableCell>
                    <TableCell className="text-xs text-right font-bold text-slate-900">
                      {item.allocated_seats} seats
                    </TableCell>
                    <TableCell className="text-xs text-right font-bold">
                      <span className={isBreached ? 'text-red-700' : 'text-slate-900'}>
                        {item.enrolled_seats}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono text-xs font-semibold">{fillRatio}%</span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              isBreached
                                ? 'bg-red-600'
                                : isNearCapacity
                                ? 'bg-amber-500'
                                : 'bg-gov-navy'
                            }`}
                            style={{ width: `${Math.min(100, Number(fillRatio))}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono font-semibold">
                      {variance >= 0 ? (
                        <span className="text-green-700">{variance} vacant</span>
                      ) : (
                        <span className="text-red-700 font-bold">+{Math.abs(variance)} excess</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isBreached ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                          <AlertOctagon className="w-3 h-3 text-red-600" />
                          QUOTA BREACH
                        </span>
                      ) : isNearCapacity ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          NEAR LIMIT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                          <ShieldCheck className="w-3 h-3 text-green-600" />
                          COMPLIANT
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary Footer */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <span>
              Total Approved Ceiling: <strong>{totalSanctionedIntake} seats</strong>
            </span>
            <span>•</span>
            <span>
              Total Quota Allocated: <strong>{totalAllocated} seats</strong>
            </span>
            <span>•</span>
            <span>
              Total Category Enrolled: <strong>{totalEnrolled} students</strong>
            </span>
          </div>
          <span className="font-semibold text-gov-navy flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-gov-saffron" />
            <span>Automated AICTE Reservation Balancing Active</span>
          </span>
        </div>
      </CardContent>

      {/* Dynamic Quota Reallocation Modal */}
      {editingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-gov-navy text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-gov-saffron" />
                  <span>Adjust Category Seat Quotas</span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  Dynamically adjust statutory category seats for Academic Year 2026-27
                </p>
              </div>
              <button
                onClick={() => setEditingModalOpen(false)}
                className="text-slate-300 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuotas} className="p-5 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
                Reallocate seats according to state government notifications or institution reservation orders. Total regular category seats must equal <strong>{totalSanctionedIntake} seats</strong>.
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {tempQuotas.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50"
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{q.label}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {q.category} • Statutory Base: {q.statutory_percentage}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="520"
                        value={q.allocated_seats}
                        onChange={(e) => handleSeatChange(q.id, parseInt(e.target.value) || 0)}
                        className="w-24 text-right font-mono text-xs font-bold"
                      />
                      <span className="text-xs text-slate-500">seats</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-between text-xs">
                <span>Sum of Regular Category Seats:</span>
                <span
                  className={`font-mono font-bold ${
                    tempTotalAllocated === totalSanctionedIntake
                      ? 'text-green-700'
                      : 'text-amber-700'
                  }`}
                >
                  {tempTotalAllocated} / {totalSanctionedIntake} seats
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Save & Apply Quotas
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};
