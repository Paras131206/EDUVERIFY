import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { RolloverDryRunResult, TrustListItem } from '../types';
import { API_BASE_URL } from '@/lib/api';
import {
  Database,
  Calendar,
  ShieldCheck,
  RotateCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Key,
  Building,
  GraduationCap,
} from 'lucide-react';

interface AdminSectionProps {
  initialTrustList: TrustListItem[];
  initialRollover: RolloverDryRunResult;
}

export const AdminSection: React.FC<AdminSectionProps> = ({
  initialTrustList,
  initialRollover,
}) => {
  const [adminTab, setAdminTab] = useState<'master' | 'rollover' | 'trust'>('master');
  const [masterEntity, setMasterEntity] = useState<'institutions' | 'dabs' | 'programs' | 'academic-years'>('institutions');
  const [masterData, setMasterData] = useState<any[]>([]);
  const [masterLoading, setMasterLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Rollover state
  const [rolloverResult, setRolloverResult] = useState<RolloverDryRunResult | null>(null);
  const [isDryRunning, setIsDryRunning] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [rolloverSuccess, setRolloverSuccess] = useState<string | null>(null);
  const [isExecutingRollover, setIsExecutingRollover] = useState<boolean>(false);

  // Trust list state
  const [trustList, setTrustList] = useState<TrustListItem[]>(initialTrustList);

  // Load master data on entity change
  useEffect(() => {
    let isMounted = true;
    setMasterLoading(true);
    fetch(`${API_BASE_URL}/v1/admin/master/${masterEntity}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setMasterData(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setMasterLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [masterEntity]);

  const handleRunDryRun = async () => {
    setIsDryRunning(true);
    setRolloverSuccess(null);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/admin/rollover?dry_run=true`, {
        method: 'POST',
      });
      if (res.ok) {
        const data: RolloverDryRunResult = await res.json();
        setRolloverResult(data);
      }
    } catch (err) {
      console.error('Failed to run dry run:', err);
    } finally {
      setIsDryRunning(false);
    }
  };

  const handleExecuteRollover = async () => {
    setIsExecutingRollover(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/admin/rollover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_year: '2025-26',
          to_year: '2026-27',
          preview_token: rolloverResult?.execution_preview_token,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRolloverSuccess(data.message || 'Academic Year 2026-27 rollover executed successfully!');
        setIsConfirmModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to execute rollover:', err);
    } finally {
      setIsExecutingRollover(false);
    }
  };

  const filteredMasterData = masterData.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(item).some(
      (val) => val && String(val).toLowerCase().includes(q)
    );
  });

  return (
    <Card className="border-slate-200 bg-white shadow-xs" data-testid="admin-section">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-base text-gov-navy flex items-center gap-2">
            <Database className="w-5 h-5 text-gov-navy" />
            <span>AICTE Central Administration & Master Infrastructure</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Apex registry management, academic year cohort rollover engine, and decentralized DID trust root list
          </CardDescription>
        </div>

        {/* SUBTABS */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setAdminTab('master')}
            data-testid="admin-tab-master"
            className={`px-3 py-1 font-semibold rounded-md transition ${
              adminTab === 'master' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Master Data
          </button>
          <button
            onClick={() => setAdminTab('rollover')}
            data-testid="admin-tab-rollover"
            className={`px-3 py-1 font-semibold rounded-md transition ${
              adminTab === 'rollover' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rollover Wizard
          </button>
          <button
            onClick={() => setAdminTab('trust')}
            data-testid="admin-tab-trust"
            className={`px-3 py-1 font-semibold rounded-md transition ${
              adminTab === 'trust' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Trust Root List
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* SUBTAB 1: MASTER DATA BROWSER */}
        {adminTab === 'master' && (
          <div className="space-y-4" data-testid="master-data-browser">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setMasterEntity('institutions')}
                  id="master-entity-institutions"
                  className={`px-2.5 py-1 font-semibold rounded-md transition ${
                    masterEntity === 'institutions' ? 'bg-white text-gov-navy shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Institutions
                </button>
                <button
                  onClick={() => setMasterEntity('dabs')}
                  id="master-entity-dabs"
                  className={`px-2.5 py-1 font-semibold rounded-md transition ${
                    masterEntity === 'dabs' ? 'bg-white text-gov-navy shadow-xs' : 'text-slate-600'
                  }`}
                >
                  DAB Bodies
                </button>
                <button
                  onClick={() => setMasterEntity('programs')}
                  id="master-entity-programs"
                  className={`px-2.5 py-1 font-semibold rounded-md transition ${
                    masterEntity === 'programs' ? 'bg-white text-gov-navy shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Programs
                </button>
                <button
                  onClick={() => setMasterEntity('academic-years')}
                  id="master-entity-academic-years"
                  className={`px-2.5 py-1 font-semibold rounded-md transition ${
                    masterEntity === 'academic-years' ? 'bg-white text-gov-navy shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Academic Years
                </button>
              </div>

              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Filter records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8 bg-white"
                />
              </div>
            </div>

            {masterLoading ? (
              <div className="py-10 text-center text-xs text-slate-500 font-medium">
                Loading master data catalogue...
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      {masterEntity === 'institutions' && (
                        <>
                          <TableHead className="text-xs">AICTE ID</TableHead>
                          <TableHead className="text-xs">Institution Name</TableHead>
                          <TableHead className="text-xs">State / District</TableHead>
                          <TableHead className="text-xs">Discipline</TableHead>
                          <TableHead className="text-xs">Affiliated DAB</TableHead>
                          <TableHead className="text-xs">Onboarding</TableHead>
                        </>
                      )}
                      {masterEntity === 'dabs' && (
                        <>
                          <TableHead className="text-xs">DAB Code</TableHead>
                          <TableHead className="text-xs">University / Authority Name</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs">State Jurisdiction</TableHead>
                        </>
                      )}
                      {masterEntity === 'programs' && (
                        <>
                          <TableHead className="text-xs">Program Code</TableHead>
                          <TableHead className="text-xs">Program Title</TableHead>
                          <TableHead className="text-xs">Level</TableHead>
                          <TableHead className="text-xs">Duration</TableHead>
                          <TableHead className="text-xs">Lateral Allowed</TableHead>
                        </>
                      )}
                      {masterEntity === 'academic-years' && (
                        <>
                          <TableHead className="text-xs">Academic Year</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Admission Window Start</TableHead>
                          <TableHead className="text-xs">Admission Window End</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMasterData.map((row, idx) => (
                      <TableRow key={idx} className="hover:bg-slate-50/60">
                        {masterEntity === 'institutions' && (
                          <>
                            <TableCell className="font-mono text-xs font-bold text-gov-navy">
                              {row.institution_aicte_id}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-slate-900">
                              {row.name}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">
                              {row.state_name || row.state_code} • {row.district_name || row.district_code}
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-slate-700">
                              {row.type}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-500">
                              {row.affiliated_dab_id}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  row.onboarding_level === 'FULL'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {row.onboarding_level}
                              </span>
                            </TableCell>
                          </>
                        )}
                        {masterEntity === 'dabs' && (
                          <>
                            <TableCell className="font-mono text-xs font-bold text-gov-navy">
                              {row.id}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-slate-900">{row.name}</TableCell>
                            <TableCell className="text-xs font-semibold text-slate-700">{row.type}</TableCell>
                            <TableCell className="text-xs text-slate-600">{row.state}</TableCell>
                          </>
                        )}
                        {masterEntity === 'programs' && (
                          <>
                            <TableCell className="font-mono text-xs font-bold text-gov-navy">
                              {row.program_code}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-slate-900">{row.name}</TableCell>
                            <TableCell className="text-xs font-semibold text-slate-700">{row.course_level}</TableCell>
                            <TableCell className="text-xs text-slate-600">{row.duration_years} Years</TableCell>
                            <TableCell className="text-xs font-bold text-slate-800">
                              {row.lateral_allowed ? 'YES (Year 2 Entry)' : 'NO'}
                            </TableCell>
                          </>
                        )}
                        {masterEntity === 'academic-years' && (
                          <>
                            <TableCell className="font-mono text-xs font-bold text-gov-navy">
                              {row.academic_year}
                            </TableCell>
                            <TableCell>
                              {row.is_current ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                                  CURRENT
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                  CONCLUDED
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">{row.admission_window_start}</TableCell>
                            <TableCell className="text-xs text-slate-600">{row.admission_window_end}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: ROLLOVER WIZARD */}
        {adminTab === 'rollover' && (
          <div className="space-y-6" data-testid="rollover-wizard">
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>Statutory Academic Year Cohort Rollover Engine (agents.md §8.8)</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                When transitioning from <strong>2025-26</strong> to <strong>2026-27</strong>, ACTIVE students are provisionally advanced with <code>year_of_study + 1</code>. Students at their final year duration transition to <code>COMPLETED</code>. Missing students in the subsequent batch raise AICTE Rule V034 defect flags.
              </p>
            </div>

            {rolloverSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <span>{rolloverSuccess}</span>
              </div>
            )}

            {/* Dry Run Trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <h4 className="text-sm font-bold text-gov-navy">Step 1: Execute Pre-Flight Dry Run</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculate cohort advancement projections without modifying central database records
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleRunDryRun}
                disabled={isDryRunning}
                className="bg-gov-navy text-white text-xs h-9 px-4 shrink-0"
                id="run-rollover-dryrun-btn"
              >
                <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${isDryRunning ? 'animate-spin' : ''}`} />
                <span>Run Dry Run Projection</span>
              </Button>
            </div>

            {/* Dry Run Results Panel */}
            {rolloverResult && (
              <div className="p-5 border border-slate-200 rounded-xl space-y-4 bg-white shadow-xs animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-gov-navy flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gov-saffron" />
                    <span>Dry Run Impact Projection: {rolloverResult.from_year} → {rolloverResult.to_year}</span>
                  </h4>
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Token: {rolloverResult.execution_preview_token}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Advancing to Year N+1</span>
                    <span className="text-xl font-bold text-gov-navy">
                      {rolloverResult.projected_advancements.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Graduating to COMPLETED</span>
                    <span className="text-xl font-bold text-green-700">
                      {rolloverResult.projected_completions.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Institutions Enrolled</span>
                    <span className="text-xl font-bold text-slate-900">
                      {rolloverResult.institutions_affected.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Potential Missing (V034)</span>
                    <span className="text-xl font-bold text-amber-600">
                      {rolloverResult.potential_missing_students.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button
                    variant="saffron"
                    size="sm"
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="text-xs h-9 px-4"
                    id="open-confirm-rollover-btn"
                  >
                    <span>Proceed to Confirm Rollover</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* CONFIRM MODAL */}
            {isConfirmModalOpen && (
              <div
                role="dialog"
                aria-labelledby="rollover-confirm-title"
                className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
              >
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-t-4 border-amber-500 space-y-4">
                  <h3 id="rollover-confirm-title" className="text-base font-bold text-gov-navy flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>Confirm National Cohort Rollover</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    You are about to execute the academic cohort rollover from <strong>2025-26</strong> to <strong>2026-27</strong> across all 8,420 institutions. This advances 385,200 active student records and establishes baseline cohorts for subsequent batch verification.
                  </p>

                  <div className="p-3 bg-slate-100 rounded-lg font-mono text-xs text-slate-700">
                    Action: <code>POST /v1/admin/rollover</code>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button variant="outline" size="sm" onClick={() => setIsConfirmModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="saffron"
                      size="sm"
                      onClick={handleExecuteRollover}
                      disabled={isExecutingRollover}
                      id="confirm-execute-rollover-btn"
                    >
                      {isExecutingRollover ? 'Executing...' : 'Confirm & Execute Rollover'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: TRUST LIST VIEW */}
        {adminTab === 'trust' && (
          <div className="space-y-4" data-testid="trust-list-view">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-600">
                Official Decentralized Identifier (DID) Documents & Cryptographic Signing Roots
              </span>
              <span className="text-xs text-green-700 font-bold bg-green-50 px-2.5 py-0.5 rounded border border-green-200">
                3 Trusted Issuers Active
              </span>
            </div>

            <div className="space-y-3">
              {trustList.map((item) => (
                <div
                  key={item.did}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-gov-navy" />
                      <span className="font-mono text-xs font-bold text-gov-navy">{item.did}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.type === 'ROOT_ISSUER' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    <p className="font-mono text-[11px] text-slate-500">
                      Key ID: {item.key_id} • Algorithm: {item.algorithm} • JWK Thumbprint: {item.public_key_jwk_thumbprint}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                      {item.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Expires: {new Date(item.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
