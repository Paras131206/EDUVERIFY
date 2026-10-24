import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QualityScoreGauge } from '@/components/shared/QualityScoreGauge';
import { AicteConsoleSummary, SseTickerEvent } from '../types';
import { API_BASE_URL } from '@/lib/api';
import {
  Building2,
  Users,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Pause,
  Play,
  RotateCw,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AicteKpiOverviewProps {
  summary: AicteConsoleSummary;
  initialEvents: SseTickerEvent[];
}

export const AicteKpiOverview: React.FC<AicteKpiOverviewProps> = ({
  summary,
  initialEvents,
}) => {
  const [events, setEvents] = useState<SseTickerEvent[]>(initialEvents);
  const [isTickerActive, setIsTickerActive] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Poll for live ticker events (SSE fallback)
  useEffect(() => {
    if (!isTickerActive) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/v1/events/ticker`);
        if (res.ok) {
          const latestEvents: SseTickerEvent[] = await res.json();
          setEvents(latestEvents);
        }
      } catch (err) {
        console.error('Ticker fetch error:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isTickerActive]);

  const handleSimulateEvent = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/events/ticker/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'batch.committed',
          title: 'Live Batch Ingestion',
          message: `Live Batch committed: 510 records verified for Maharashtra Inst of Tech`,
          severity: 'INFO',
          institution_name: 'Maharashtra Institute of Technology Pune',
        }),
      });
      if (res.ok) {
        const newEvt: SseTickerEvent = await res.json();
        setEvents((prev) => [newEvt, ...prev]);
      }
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="aicte-kpi-overview">
      {/* 6 EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Approved Institutions */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 bg-white shadow-xs" data-testid="kpi-institutions">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Institutions
            </span>
            <div className="mt-2 text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
              <span>{summary.total_institutions.toLocaleString()}</span>
              <span className="text-xs text-slate-500 font-medium">Total</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 font-medium">
              {summary.onboarded_institutions.toLocaleString()} Onboarded ({summary.coverage_percentage}%)
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
            <Building2 className="w-3.5 h-3.5 text-gov-navy" />
            <span>AICTE Approved Apex List</span>
          </div>
        </Card>

        {/* KPI 2: Coverage (Student-Level vs Aggregate-Only) */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 bg-white shadow-xs" data-testid="kpi-coverage">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Coverage Model
            </span>
            <div className="mt-2 text-2xl font-black text-gov-navy">
              {summary.student_level_coverage_pct}%
            </div>
            <div className="mt-1 flex flex-col gap-0.5 text-[11px]">
              <span className="text-green-700 font-bold">
                Student-Level: {summary.student_level_institutions_count}
              </span>
              <span className="text-amber-700 font-bold">
                Aggregate-Only: {summary.aggregate_only_institutions_count} ({summary.aggregate_only_coverage_pct}%)
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
            <Layers className="w-3.5 h-3.5 text-green-600" />
            <span>Dual Ingestion Architecture</span>
          </div>
        </Card>

        {/* KPI 3: Total Enrolled Students */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 bg-white shadow-xs" data-testid="kpi-students">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Verified Students
            </span>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {summary.total_students.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Active APAAR Identity Keys
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-green-700 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Central Registry Synced</span>
          </div>
        </Card>

        {/* KPI 4: Average Fill % */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 bg-white shadow-xs" data-testid="kpi-avg-fill">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Average Fill %
            </span>
            <div className="mt-2 text-2xl font-black text-gov-navy">
              {summary.avg_fill_percentage}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-gov-navy h-2 rounded-full"
                style={{ width: `${Math.min(100, summary.avg_fill_percentage)}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>Quota Ceiling</span>
            <span className="text-gov-navy font-bold">Approved Baseline</span>
          </div>
        </Card>

        {/* KPI 5: Excess Seats */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 bg-white shadow-xs" data-testid="kpi-excess-seats">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Excess Seats
            </span>
            <div className="mt-2 text-2xl font-black text-red-600">
              +{summary.excess_seats_count}
            </div>
            <p className="text-[11px] text-red-700 font-bold mt-1">
              Violating Rule V012
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-red-700 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Over-Enrolment Notices</span>
          </div>
        </Card>

        {/* KPI 6: National Avg DQ Score */}
        <Card className="p-4 flex flex-col items-center justify-between text-center border-slate-200 bg-white shadow-xs" data-testid="kpi-avg-dq">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            National Avg DQ
          </span>
          <div className="my-1 scale-90">
            <QualityScoreGauge score={summary.avg_quality_score} size="sm" />
          </div>
          <div className="w-full pt-1 border-t border-slate-100 text-[10px] text-green-700 font-bold">
            Grade A Statutory Compliance
          </div>
        </Card>
      </div>

      {/* SSE REAL-TIME BROADCAST TICKER */}
      <Card className="border-gov-navy/20 bg-gradient-to-r from-gov-navyDark to-slate-900 text-white shadow-md overflow-hidden" data-testid="sse-live-ticker">
        <CardHeader className="py-2.5 px-4 bg-black/20 flex flex-row items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-gov-saffron flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span>National Event Broadcast (SSE Live Ticker)</span>
            </span>
            <span className="text-[10px] text-slate-300 font-mono bg-white/10 px-2 py-0.5 rounded-full">
              {events.length} Events Received
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTickerActive(!isTickerActive)}
              className="text-slate-300 hover:text-white hover:bg-white/10 h-7 text-xs px-2"
              title={isTickerActive ? 'Pause Ticker' : 'Resume Ticker'}
            >
              {isTickerActive ? (
                <>
                  <Pause className="w-3 h-3 mr-1 text-amber-400" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1 text-green-400" />
                  <span>Resume</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateEvent}
              disabled={simulating}
              className="h-7 text-xs px-2.5 bg-white/10 border-white/20 text-white hover:bg-white/20"
              id="simulate-batch-event-btn"
            >
              <Sparkles className="w-3 h-3 mr-1 text-gov-saffron" />
              <span>Simulate Commit</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3">
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {events.slice(0, 5).map((evt) => (
              <div
                key={evt.id}
                className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition animate-in fade-in duration-300"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                      evt.severity === 'CRITICAL'
                        ? 'bg-red-500/80 text-white'
                        : evt.severity === 'WARNING'
                        ? 'bg-amber-500/80 text-white'
                        : 'bg-blue-500/80 text-white'
                    }`}
                  >
                    {evt.event_type.replace('.', ' ')}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white leading-snug">{evt.message}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      <span>{evt.timestamp}</span>
                      {evt.institution_name && (
                        <>
                          <span>•</span>
                          <span>{evt.institution_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {evt.link && (
                  <Link to={evt.link} className="shrink-0 text-gov-saffron hover:underline text-[11px] flex items-center gap-1">
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
