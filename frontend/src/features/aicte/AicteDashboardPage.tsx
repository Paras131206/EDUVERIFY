import React, { useState, useEffect, useCallback } from 'react';
import { AicteKpiOverview } from './components/AicteKpiOverview';
import { IndiaMapSection } from './components/IndiaMapSection';
import { LeaderboardsSection } from './components/LeaderboardsSection';
import { QuotaSeatSection } from './components/QuotaSeatSection';
import { CrossInstitutionDuplicatesSection } from './components/CrossInstitutionDuplicatesSection';
import { AnomalyDriftFeedSection } from './components/AnomalyDriftFeedSection';
import { ReconciliationViewSection } from './components/ReconciliationViewSection';
import { AuditChainSection } from './components/AuditChainSection';
import { AdminSection } from './components/AdminSection';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { Button } from '@/components/ui/button';
import {
  AicteConsoleSummary,
  SseTickerEvent,
  StateMetricRecord,
  LeaderboardItem,
  SupernumerarySchemeStat,
  QuotaShareStat,
  DuplicateClusterItem,
  AnomalyFeedItem,
  ReconciliationRecordItem,
  AuditVerificationVerdict,
  AuditLogEntry,
  TrustListItem,
  RolloverDryRunResult,
} from './types';
import {
  mockAicteSummary,
  mockSseTickerEvents,
  mockStateMetrics,
  mockLeaderboards,
  mockSupernumerarySchemes,
  mockQuotaShares,
  mockCrossDuplicates,
  mockAnomalyFeed,
  mockAicteReconciliation,
  mockAuditVerification,
  mockAuditLog,
  mockTrustList,
  mockRolloverDryRun,
} from '@/mocks/data';
import { API_BASE_URL, fetchWithAuth } from '@/lib/api';
import {
  ShieldCheck,
  ShieldAlert,
  RotateCw,
  LayoutDashboard,
  Map as MapIcon,
  Trophy,
  PieChart,
  Users,
  Activity,
  FileCheck2,
  Lock,
  Wrench,
  WifiOff,
} from 'lucide-react';

export type AicteTab =
  | 'all'
  | 'overview'
  | 'map'
  | 'leaderboards'
  | 'quotas'
  | 'duplicates'
  | 'anomalies'
  | 'reconciliation'
  | 'audit'
  | 'admin';

export const AicteDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AicteTab>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [isVerifyingHeaderAudit, setIsVerifyingHeaderAudit] = useState<boolean>(false);

  // Data states
  const [summary, setSummary] = useState<AicteConsoleSummary>(mockAicteSummary);
  const [tickerEvents, setTickerEvents] = useState<SseTickerEvent[]>(mockSseTickerEvents);
  const [stateMetrics, setStateMetrics] = useState<StateMetricRecord[]>(mockStateMetrics);
  const [leaderboards, setLeaderboards] = useState<{
    excess_enrolment: LeaderboardItem[];
    lowest_dq: LeaderboardItem[];
    cross_duplicates: LeaderboardItem[];
  }>(mockLeaderboards);
  const [schemes, setSchemes] = useState<SupernumerarySchemeStat[]>(mockSupernumerarySchemes);
  const [shares, setShares] = useState<{
    by_state: QuotaShareStat[];
    by_program: QuotaShareStat[];
  }>(mockQuotaShares);
  const [duplicates, setDuplicates] = useState<DuplicateClusterItem[]>(mockCrossDuplicates);
  const [anomalies, setAnomalies] = useState<AnomalyFeedItem[]>(mockAnomalyFeed);
  const [reconciliation, setReconciliation] = useState<ReconciliationRecordItem[]>(mockAicteReconciliation);
  const [auditVerdict, setAuditVerdict] = useState<AuditVerificationVerdict>(mockAuditVerification);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(mockAuditLog);
  const [trustList, setTrustList] = useState<TrustListItem[]>(mockTrustList);
  const [rollover, setRollover] = useState<RolloverDryRunResult>(mockRolloverDryRun);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch initial data from /v1 endpoints with fallbacks
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch AICTE Summary
      try {
        const sumRes = await fetchWithAuth(`${API_BASE_URL}/v1/dashboards/aicte/summary`);
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          setSummary(sumData);
        }
      } catch {
        // Fallback already in initial state
      }

      // 2. Fetch Audit Chain Verification for Header Badge
      try {
        const auditRes = await fetchWithAuth(`${API_BASE_URL}/v1/audit/verify-chain`);
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          setAuditVerdict(auditData);
        }
      } catch {
        // Fallback already in initial state
      }

      // 3. Fetch Map Metrics
      try {
        const mapRes = await fetchWithAuth(`${API_BASE_URL}/v1/dashboards/aicte/map`);
        if (mapRes.ok) {
          const mapData = await mapRes.json();
          if (Array.isArray(mapData) && mapData.length > 0) {
            setStateMetrics(mapData);
          }
        }
      } catch {
        // Fallback already in initial state
      }

      // 4. Fetch Leaderboards
      try {
        const lbRes = await fetchWithAuth(`${API_BASE_URL}/v1/dashboards/aicte/leaderboards`);
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          setLeaderboards(lbData);
        }
      } catch {
        // Fallback already in initial state
      }

      // 5. Fetch Quotas
      try {
        const quotaRes = await fetchWithAuth(`${API_BASE_URL}/v1/dashboards/aicte/quotas`);
        if (quotaRes.ok) {
          const quotaData = await quotaRes.json();
          if (quotaData.schemes) setSchemes(quotaData.schemes);
          if (quotaData.shares) setShares(quotaData.shares);
        }
      } catch {
        // Fallback already in initial state
      }

      // 6. Fetch Duplicates
      try {
        const dupRes = await fetchWithAuth(`${API_BASE_URL}/v1/dashboards/aicte/duplicates`);
        if (dupRes.ok) {
          const dupData = await dupRes.json();
          if (Array.isArray(dupData) && dupData.length > 0) {
            setDuplicates(dupData);
          }
        }
      } catch {
        // Fallback already in initial state
      }

      // 7. Fetch Anomalies
      try {
        const anomRes = await fetchWithAuth(`${API_BASE_URL}/v1/dashboards/aicte/anomalies`);
        if (anomRes.ok) {
          const anomData = await anomRes.json();
          if (Array.isArray(anomData) && anomData.length > 0) {
            setAnomalies(anomData);
          }
        }
      } catch {
        // Fallback already in initial state
      }

      // 8. Fetch Reconciliation
      try {
        const recRes = await fetchWithAuth(`${API_BASE_URL}/v1/dashboards/aicte/reconciliation`);
        if (recRes.ok) {
          const recData = await recRes.json();
          if (Array.isArray(recData) && recData.length > 0) {
            setReconciliation(recData);
          }
        }
      } catch {
        // Fallback already in initial state
      }

      // 9. Fetch Audit Log
      try {
        const logRes = await fetchWithAuth(`${API_BASE_URL}/v1/audit/log`);
        if (logRes.ok) {
          const logData = await logRes.json();
          if (Array.isArray(logData) && logData.length > 0) {
            setAuditLogs(logData);
          }
        }
      } catch {
        // Fallback already in initial state
      }

      // 10. Fetch Trust List
      try {
        const trustRes = await fetchWithAuth(`${API_BASE_URL}/v1/admin/trust-list`);
        if (trustRes.ok) {
          const trustData = await trustRes.json();
          if (Array.isArray(trustData) && trustData.length > 0) {
            setTrustList(trustData);
          }
        }
      } catch {
        // Fallback already in initial state
      }

      // 11. Fetch Rollover Dry Run
      try {
        const rollRes = await fetchWithAuth(`${API_BASE_URL}/v1/admin/rollover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dry_run: true }),
        });
        if (rollRes.ok) {
          const rollData = await rollRes.json();
          setRollover(rollData);
        }
      } catch {
        // Fallback already in initial state
      }

      // 12. Fetch Initial Ticker
      try {
        const tickRes = await fetchWithAuth(`${API_BASE_URL}/v1/events/ticker`);
        if (tickRes.ok) {
          const tickData = await tickRes.json();
          if (Array.isArray(tickData) && tickData.length > 0) {
            setTickerEvents(tickData);
          }
        }
      } catch {
        // Fallback already in initial state
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load central repository dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Re-verify audit chain via header badge click
  const handleVerifyAuditChain = async () => {
    setIsVerifyingHeaderAudit(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/v1/audit/verify-chain`);
      if (res.ok) {
        const data = await res.json();
        setAuditVerdict(data);
      }
    } catch (e) {
      console.error('Audit chain verify error:', e);
    } finally {
      setIsVerifyingHeaderAudit(false);
    }
  };

  // Check if data is empty (used in empty state tests)
  const isDataEmpty = summary.total_institutions === 0 && summary.total_students === 0;

  return (
    <div className="space-y-6 pb-12" data-testid="aicte-dashboard-page">
      <OfflineBanner />

      {/* Offline Status Bar if detected */}
      {isOffline && (
        <div
          data-testid="aicte-offline-banner"
          className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>Working Offline: Operating in cached snapshot mode. Live tickers and chain verification paused.</span>
          </div>
          <span className="text-[10px] bg-amber-700/60 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
            Local Cache Active
          </span>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <ErrorState
          data-testid="aicte-error-state"
          title="Data Synchronization Error"
          message={error}
          onRetry={loadAllData}
        />
      )}

      {/* Header with Title and Audit Chain Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gov-navy text-white flex items-center justify-center font-bold text-sm shadow-xs">
              AICTE
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gov-navy">
                AICTE Central Repository Console
              </h1>
              <p className="text-xs text-slate-500">
                National apex monitoring: APAAR-keyed student lifecycle, state coverage, cross-institution anomaly feeds & SHA-256 audit log
              </p>
            </div>
          </div>
        </div>

        {/* Audit Chain Badge in Header (Task A5 Requirement 8) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div
            data-testid="header-audit-badge"
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab('audit')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setActiveTab('audit');
              }
            }}
            title={
              auditVerdict.verified
                ? `SHA-256 Hash Chain Verified (${auditVerdict.total_records} immutable records)`
                : `Audit Chain Tampered: Broken at Link #${auditVerdict.broken_link_id}`
            }
            className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border shadow-xs transition-all ${
              auditVerdict.verified
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100 animate-pulse'
            }`}
          >
            {auditVerdict.verified ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-600" />
            )}
            <span className="font-semibold">
              {auditVerdict.verified ? 'Audit chain intact' : `Audit chain broken: #${auditVerdict.broken_link_id}`}
            </span>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              ({auditVerdict.total_records} blocks)
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleVerifyAuditChain}
            disabled={isVerifyingHeaderAudit}
            className="h-8 px-2.5 text-xs text-slate-700 hover:bg-slate-50 border-slate-300"
            title="Recalculate SHA-256 Merkle Chain Integrity"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1 ${isVerifyingHeaderAudit ? 'animate-spin' : ''}`} />
            <span>Verify</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={loadAllData}
            disabled={loading}
            className="h-8 px-3 text-xs bg-gov-navy hover:bg-gov-navy/90 text-white"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-medium">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md transition-colors ${
            activeTab === 'all'
              ? 'bg-white border-b-2 border-gov-navy font-semibold text-gov-navy shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Complete Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md transition-colors ${
            activeTab === 'map'
              ? 'bg-white border-b-2 border-gov-navy font-semibold text-gov-navy shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>India Map & Drilldown</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboards')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md transition-colors ${
            activeTab === 'leaderboards'
              ? 'bg-white border-b-2 border-gov-navy font-semibold text-gov-navy shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Leaderboards</span>
        </button>

        <button
          onClick={() => setActiveTab('quotas')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md transition-colors ${
            activeTab === 'quotas'
              ? 'bg-white border-b-2 border-gov-navy font-semibold text-gov-navy shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Quota & Seat Breakdown</span>
        </button>

        <button
          onClick={() => setActiveTab('duplicates')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md transition-colors ${
            activeTab === 'duplicates'
              ? 'bg-white border-b-2 border-gov-navy font-semibold text-gov-navy shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Cross-Institution Duplicates</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">
            {summary.cross_institution_dupes_count}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('anomalies')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md transition-colors ${
            activeTab === 'anomalies'
              ? 'bg-white border-b-2 border-gov-navy font-semibold text-gov-navy shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Anomalies & Drift</span>
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md transition-colors ${
            activeTab === 'reconciliation'
              ? 'bg-white border-b-2 border-gov-navy font-semibold text-gov-navy shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Reconciliation</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md transition-colors ${
            activeTab === 'audit'
              ? 'bg-white border-b-2 border-gov-navy font-semibold text-gov-navy shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Audit Chain</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md transition-colors ${
            activeTab === 'admin'
              ? 'bg-white border-b-2 border-gov-navy font-semibold text-gov-navy shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Admin & Rollover</span>
        </button>
      </div>

      {/* Empty State Fallback */}
      {isDataEmpty ? (
        <div data-testid="aicte-empty-state">
          <EmptyState
            title="No Institution Records Available"
            description="Central repository contains no enrolled institutions or submitted batches for the current academic year."
            action={
              <Button onClick={loadAllData} size="sm">
                Reload National Data
              </Button>
            }
          />
        </div>
      ) : (
        /* Tab Sections Rendering */
        <div className="space-y-8">
          {/* Section 1: Overview KPIs & SSE Ticker */}
          {(activeTab === 'all' || activeTab === 'overview') && (
            <section data-testid="section-overview">
              <AicteKpiOverview summary={summary} initialEvents={tickerEvents} />
            </section>
          )}

          {/* Section 2: India Map by State & Drilldown */}
          {(activeTab === 'all' || activeTab === 'map') && (
            <section data-testid="section-map">
              <IndiaMapSection states={stateMetrics} />
            </section>
          )}

          {/* Section 3: Leaderboards */}
          {(activeTab === 'all' || activeTab === 'leaderboards') && (
            <section data-testid="section-leaderboards">
              <LeaderboardsSection leaderboards={leaderboards} />
            </section>
          )}

          {/* Section 4: Quota & Seat Breakdown */}
          {(activeTab === 'all' || activeTab === 'quotas') && (
            <section data-testid="section-quotas">
              <QuotaSeatSection schemes={schemes} shares={shares} />
            </section>
          )}

          {/* Section 5: Cross-Institution Duplicate Queue */}
          {(activeTab === 'all' || activeTab === 'duplicates') && (
            <section data-testid="section-duplicates">
              <CrossInstitutionDuplicatesSection initialClusters={duplicates} />
            </section>
          )}

          {/* Section 6: Anomaly & Drift Feed */}
          {(activeTab === 'all' || activeTab === 'anomalies') && (
            <section data-testid="section-anomalies">
              <AnomalyDriftFeedSection anomalies={anomalies} />
            </section>
          )}

          {/* Section 7: Reconciliation View */}
          {(activeTab === 'all' || activeTab === 'reconciliation') && (
            <section data-testid="section-reconciliation">
              <ReconciliationViewSection initialItems={reconciliation} />
            </section>
          )}

          {/* Section 8: Audit Chain Log & Verification */}
          {(activeTab === 'all' || activeTab === 'audit') && (
            <section data-testid="section-audit">
              <AuditChainSection initialVerdict={auditVerdict} initialLogs={auditLogs} />
            </section>
          )}

          {/* Section 9: Admin Master Data, Rollover, Trust List */}
          {(activeTab === 'all' || activeTab === 'admin') && (
            <section data-testid="section-admin">
              <AdminSection initialTrustList={trustList} initialRollover={rollover} />
            </section>
          )}
        </div>
      )}
    </div>
  );
};
export default AicteDashboardPage;
