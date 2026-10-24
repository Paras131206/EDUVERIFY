import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MaskedValue } from '@/components/shared/MaskedValue';
import { DuplicateClusterItem } from '../types';
import {
  Users,
  CheckCircle2,
  ArrowRightLeft,
  UserCheck,
  UserX,
  Layers,
} from 'lucide-react';


interface DuplicatesTabProps {
  clusters: DuplicateClusterItem[];
  onResolveCluster: (
    clusterId: string,
    decision: 'SAME_PERSON' | 'DIFFERENT_PEOPLE' | 'TRANSFER'
  ) => Promise<void> | void;
}

export const DuplicatesTab: React.FC<DuplicatesTabProps> = ({ clusters, onResolveCluster }) => {
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleResolve = async (
    clusterId: string,
    decision: 'SAME_PERSON' | 'DIFFERENT_PEOPLE' | 'TRANSFER'
  ) => {
    setResolvingId(clusterId);
    try {
      await onResolveCluster(clusterId, decision);
    } finally {
      setResolvingId(null);
    }
  };

  if (!clusters || clusters.length === 0) {
    return (
      <Card className="p-12 text-center text-slate-500">
        <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="font-bold text-slate-700 text-sm">No Duplicate Clusters Detected</h3>
        <p className="text-xs text-slate-500 mt-1">
          Identity deduplication algorithms found no duplicate student records across intra- or cross-institutional registries.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-base font-bold text-gov-navy flex items-center gap-2">
            <Users className="w-4 h-4 text-gov-saffron" />
            <span>Identity & Deduplication Resolution</span>
            <span className="text-xs bg-gov-navy/10 text-gov-navy px-2 py-0.5 rounded-full font-bold">
              {clusters.length} Cluster{clusters.length > 1 ? 's' : ''}
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Side-by-side biometric & demographic comparison with per-field similarity weights
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {clusters.map((cluster) => {
          const m1 = cluster.members[0];
          const m2 = cluster.members[1] || cluster.members[0];
          const isResolved = cluster.status && cluster.status.startsWith('RESOLVED');
          const isProcessing = resolvingId === cluster.cluster_id;

          // Normalized score percentage
          const scorePercent =
            cluster.score <= 1.0 ? Math.round(cluster.score * 100) : Math.round(cluster.score);

          // Fields to align and compare
          const fieldsToCompare = [
            { key: 'row', label: 'Batch Row', val1: `#${m1?.row}`, val2: `#${m2?.row}`, isDiff: m1?.row !== m2?.row },
            {
              key: 'apaar_id',
              label: 'APAAR ID',
              val1: m1?.apaar_masked,
              val2: m2?.apaar_masked,
              isDiff: m1?.apaar_masked !== m2?.apaar_masked,
              isMasked: true,
            },
            {
              key: 'full_name',
              label: 'Student Name',
              val1: m1?.full_name,
              val2: m2?.full_name,
              isDiff: m1?.full_name?.toLowerCase() !== m2?.full_name?.toLowerCase(),
            },
            {
              key: 'dob',
              label: 'Date of Birth',
              val1: m1?.dob || '2004-05-12',
              val2: m2?.dob || '2004-05-12',
              isDiff: (m1?.dob || '2004-05-12') !== (m2?.dob || '2004-05-12'),
            },
            {
              key: 'gender',
              label: 'Gender',
              val1: m1?.gender || 'M',
              val2: m2?.gender || 'M',
              isDiff: (m1?.gender || 'M') !== (m2?.gender || 'M'),
            },
            {
              key: 'program_code',
              label: 'Program Code',
              val1: m1?.program_code || 'BTECH-CSE',
              val2: m2?.program_code || 'BTECH-ECE',
              isDiff: (m1?.program_code || 'BTECH-CSE') !== (m2?.program_code || 'BTECH-ECE'),
            },
            {
              key: 'institution',
              label: 'Institution AICTE ID',
              val1: m1?.institution || '1-1234567890',
              val2: m2?.institution || '1-1234567890',
              isDiff: m1?.institution !== m2?.institution,
            },
            {
              key: 'admission_date',
              label: 'Admission Date',
              val1: m1?.admission_date || '2026-08-01',
              val2: m2?.admission_date || '2026-08-01',
              isDiff: (m1?.admission_date || '2026-08-01') !== (m2?.admission_date || '2026-08-01'),
            },
          ];

          return (
            <Card
              key={cluster.cluster_id}
              className={`border transition shadow-sm overflow-hidden ${
                isResolved ? 'border-green-300 bg-green-50/20' : 'border-slate-200'
              }`}
            >
              {/* Cluster Header */}
              <CardHeader className="py-3 px-6 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gov-navy/10 text-gov-navy flex items-center justify-center font-mono font-bold text-sm">
                    {scorePercent}%
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-bold text-slate-900">
                        Cluster #{cluster.cluster_id}
                      </CardTitle>
                      <span className="text-[11px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {cluster.scope}
                      </span>
                    </div>
                    <CardDescription className="text-xs text-slate-500">
                      Overall Match Confidence: <strong className="text-slate-800">{scorePercent}%</strong>
                    </CardDescription>
                  </div>
                </div>

                {/* Resolution Status Chip */}
                {isResolved ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-300">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>
                      {cluster.status === 'RESOLVED_SAME'
                        ? 'Resolved: Same Person (Merge)'
                        : cluster.status === 'RESOLVED_DIFFERENT'
                        ? 'Resolved: Different People (Verified)'
                        : 'Resolved: Transfer Action Triggered'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      Decision Required
                    </span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Per-field similarity bars from matched_fields */}
                {cluster.matched_fields && Object.keys(cluster.matched_fields).length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-gov-navy" />
                      <span>Per-Field Similarity Breakdown (matched_fields)</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {Object.entries(cluster.matched_fields).map(([fieldName, weight]) => {
                        const pct = Math.round(weight * 100);
                        return (
                          <div key={fieldName} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="font-mono text-slate-600 truncate">{fieldName}</span>
                              <span className="font-bold text-slate-900">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  pct >= 90
                                    ? 'bg-green-500'
                                    : pct >= 70
                                    ? 'bg-amber-500'
                                    : 'bg-red-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Side-by-side Aligned Field Compare Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="grid grid-cols-12 bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2.5 border-b border-slate-200">
                    <div className="col-span-4 uppercase tracking-wider text-[11px] text-slate-500">
                      Demographic / Registry Field
                    </div>
                    <div className="col-span-4 text-gov-navy flex items-center gap-1.5">
                      <span>Record A (Row #{m1?.row})</span>
                      <span className="text-[10px] bg-gov-navy/10 px-1.5 py-0.2 rounded font-normal">Candidate 1</span>
                    </div>
                    <div className="col-span-4 text-slate-900 flex items-center gap-1.5">
                      <span>Record B (Row #{m2?.row})</span>
                      <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded font-normal">Candidate 2</span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {fieldsToCompare.map((item) => (
                      <div
                        key={item.key}
                        className={`grid grid-cols-12 px-4 py-2.5 items-center transition ${
                          item.isDiff ? 'bg-amber-50/70 border-l-4 border-l-amber-500' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="col-span-4 font-medium text-slate-600 flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.isDiff && (
                            <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                              Difference
                            </span>
                          )}
                        </div>

                        <div className="col-span-4 font-mono font-semibold text-slate-800">
                          {item.isMasked ? (
                            <MaskedValue value={item.val1 || ''} kind="apaar" canUnmask />
                          ) : (
                            <span className={item.isDiff ? 'text-amber-900 font-bold' : ''}>
                              {item.val1}
                            </span>
                          )}
                        </div>

                        <div className="col-span-4 font-mono font-semibold text-slate-800">
                          {item.isMasked ? (
                            <MaskedValue value={item.val2 || ''} kind="apaar" canUnmask />
                          ) : (
                            <span className={item.isDiff ? 'text-amber-900 font-bold' : ''}>
                              {item.val2}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decision Buttons */}
                {!isResolved && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-slate-600 font-medium">
                      Select official human verification decision for this cluster:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleResolve(cluster.cluster_id, 'SAME_PERSON')}
                        disabled={isProcessing}
                        className="bg-gov-navy hover:bg-gov-navyDark text-xs h-8"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1 text-green-400" />
                        Same person (Merge)
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolve(cluster.cluster_id, 'DIFFERENT_PEOPLE')}
                        disabled={isProcessing}
                        className="text-xs h-8 text-slate-700"
                      >
                        <UserX className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        Different people
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolve(cluster.cluster_id, 'TRANSFER')}
                        disabled={isProcessing}
                        className="text-xs h-8 text-blue-700 border-blue-200 hover:bg-blue-50"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        Transfer
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
