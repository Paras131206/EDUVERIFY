import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MaskedValue } from '@/components/shared/MaskedValue';
import { DuplicateClusterItem } from '@/features/institution/types';
import { API_BASE_URL } from '@/lib/api';
import {
  Users,
  ShieldAlert,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Layers,
  Building,
} from 'lucide-react';

interface CrossInstitutionDuplicatesSectionProps {
  initialClusters: DuplicateClusterItem[];
}

export const CrossInstitutionDuplicatesSection: React.FC<CrossInstitutionDuplicatesSectionProps> = ({
  initialClusters,
}) => {
  const [clusters, setClusters] = useState<DuplicateClusterItem[]>(initialClusters);
  const [activeCluster, setActiveCluster] = useState<DuplicateClusterItem | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionSuccess, setResolutionSuccess] = useState<string | null>(null);

  const handleResolve = async (
    clusterId: string,
    decision: 'SAME_PERSON' | 'DIFFERENT_PEOPLE' | 'TRANSFER'
  ) => {
    setResolvingId(clusterId);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/dashboards/aicte/duplicates/${clusterId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          note: `Decision applied by AICTE National Desk: ${decision}`,
        }),
      });

      if (res.ok) {
        const updated: DuplicateClusterItem = await res.json();
        setClusters((prev) =>
          prev.map((c) => (c.cluster_id === clusterId ? { ...c, status: updated.status } : c))
        );
        setResolutionSuccess(`Cluster ${clusterId} marked as ${decision}`);
        setTimeout(() => {
          setResolutionSuccess(null);
          setActiveCluster(null);
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to resolve cross-institution dupe:', err);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-xs" data-testid="cross-duplicates-section">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-base text-gov-navy flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            <span>Cross-Institution Duplicate Enrolment Queue</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Intelligent biometric and demographic detection across institutions under AICTE Rule V010 and V011
          </CardDescription>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-purple-100 text-purple-800 border border-purple-200">
          {clusters.filter((c) => !c.status || c.status === 'PENDING_REVIEW').length} Pending Inspection
        </span>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {resolutionSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-900 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{resolutionSuccess}</span>
          </div>
        )}

        <div className="space-y-4">
          {clusters.map((cluster) => {
            const m1 = cluster.members[0];
            const m2 = cluster.members[1] || cluster.members[0];
            const isResolved = cluster.status && cluster.status.startsWith('RESOLVED');
            const scorePercent =
              cluster.score <= 1.0 ? Math.round(cluster.score * 100) : Math.round(cluster.score);

            return (
              <div
                key={cluster.cluster_id}
                className={`p-4 rounded-xl border transition ${
                  isResolved ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-gov-navy bg-gov-navy/10 px-2 py-0.5 rounded">
                      {cluster.cluster_id}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        scorePercent >= 95
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {scorePercent}% Similarity Match
                    </span>
                    <span className="text-xs text-slate-500">• Rule V010 (Concurrent Enrolment)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isResolved ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-green-100 text-green-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{cluster.status}</span>
                      </span>
                    ) : (
                      <Button
                        variant="saffron"
                        size="sm"
                        onClick={() => setActiveCluster(cluster)}
                        className="text-xs h-7 px-3"
                        id={`compare-cluster-${cluster.cluster_id}`}
                      >
                        Compare & Resolve
                      </Button>
                    )}
                  </div>
                </div>

                {/* INSTITUTION COMPARISON PREVIEW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Institution A (Primary Enrolment)
                    </span>
                    <p className="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-gov-navy" />
                      <span>AICTE ID: {m1?.institution}</span>
                    </p>
                    <div className="mt-2 space-y-0.5 text-slate-600">
                      <p>Student: <strong>{m1?.full_name}</strong></p>
                      <p className="flex items-center gap-1 font-mono text-[11px]">
                        <span>APAAR:</span>
                        <MaskedValue value={m1?.apaar_masked || ''} kind="apaar" className="text-slate-800 font-bold" />
                      </p>
                      <p>Program: <strong>{m1?.program_code}</strong> (Adm: {m1?.admission_date})</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Institution B (Concurrent Record)
                    </span>
                    <p className="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-gov-navy" />
                      <span>AICTE ID: {m2?.institution}</span>
                    </p>
                    <div className="mt-2 space-y-0.5 text-slate-600">
                      <p>Student: <strong>{m2?.full_name}</strong></p>
                      <p className="flex items-center gap-1 font-mono text-[11px]">
                        <span>APAAR:</span>
                        <MaskedValue value={m2?.apaar_masked || ''} kind="apaar" className="text-slate-800 font-bold" />
                      </p>
                      <p>Program: <strong>{m2?.program_code}</strong> (Adm: {m2?.admission_date})</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL: SIDE-BY-SIDE RESOLUTION DIALOG */}
        {activeCluster && (
          <div
            role="dialog"
            aria-labelledby="dupe-dialog-title"
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 border-t-4 border-purple-600 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 id="dupe-dialog-title" className="text-base font-bold text-gov-navy flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-purple-600" />
                    <span>Cross-Institution Duplicate Biometric & Record Compare</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cluster ID: {activeCluster.cluster_id} • Score: {Math.round(activeCluster.score * 100)}%
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveCluster(null)} className="h-8 px-2 text-xs">
                  Cancel
                </Button>
              </div>

              {/* Side-by-Side Align */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-gov-navy border-b pb-1">
                    Institution 1 ({activeCluster.members[0]?.institution})
                  </h4>
                  <p><strong>Name:</strong> {activeCluster.members[0]?.full_name}</p>
                  <p><strong>DOB:</strong> {activeCluster.members[0]?.dob}</p>
                  <p><strong>Gender:</strong> {activeCluster.members[0]?.gender}</p>
                  <p><strong>Program:</strong> {activeCluster.members[0]?.program_code}</p>
                  <p><strong>Admission Date:</strong> {activeCluster.members[0]?.admission_date}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-gov-navy border-b pb-1">
                    Institution 2 ({activeCluster.members[1]?.institution})
                  </h4>
                  <p><strong>Name:</strong> {activeCluster.members[1]?.full_name}</p>
                  <p><strong>DOB:</strong> {activeCluster.members[1]?.dob}</p>
                  <p><strong>Gender:</strong> {activeCluster.members[1]?.gender}</p>
                  <p><strong>Program:</strong> {activeCluster.members[1]?.program_code}</p>
                  <p><strong>Admission Date:</strong> {activeCluster.members[1]?.admission_date}</p>
                </div>
              </div>

              {/* SIMILARITY BARS */}
              <div className="bg-slate-100 p-3 rounded-lg text-xs space-y-2">
                <p className="font-bold text-slate-800">Field-by-Field Similarity Confidence:</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Full Name</span>
                      <span className="font-mono font-bold">96%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '96%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>DOB Match</span>
                      <span className="font-mono font-bold">100%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-green-600 h-1.5 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>APAAR Hash</span>
                      <span className="font-mono font-bold">100%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-green-600 h-1.5 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolve(activeCluster.cluster_id, 'DIFFERENT_PEOPLE')}
                  disabled={!!resolvingId}
                  className="text-xs text-slate-700"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Different Individuals
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolve(activeCluster.cluster_id, 'SAME_PERSON')}
                  disabled={!!resolvingId}
                  className="text-xs text-amber-800 border-amber-300 hover:bg-amber-50"
                >
                  <FileCheck2 className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Confirm Same Person (Rule V010 Notice)
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleResolve(activeCluster.cluster_id, 'TRANSFER')}
                  disabled={!!resolvingId}
                  className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 mr-1 text-gov-saffron" />
                  Resolve as Transfer
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
