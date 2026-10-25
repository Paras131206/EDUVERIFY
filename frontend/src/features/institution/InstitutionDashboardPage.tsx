import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QualityScoreGauge } from '@/components/shared/QualityScoreGauge';
import { API_BASE_URL, fetchWithAuth } from '@/lib/api';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  CheckSquare,
  ArrowLeftRight,
  Users,
  AlertTriangle,
  TrendingUp,
  BarChart2,
  Bell,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Info,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const ZERO_SUMMARY = {
  institution_name: 'Delhi Institute of Engineering & Technology (AICTE ID: 1-1234567890)',
  total_enrolled: 0,
  approved_intake: 520,
  batches_count: 0,
  latest_quality_score: 0.0,
  pending_review_count: 0,
  active_transfers_count: 0,
  dq_trend: [] as { date: string; score: number }[],
  intake_distribution: [
    { program: 'UG-CSE', approved: 60, enrolled: 0 },
    { program: 'UG-ECE', approved: 60, enrolled: 0 },
    { program: 'UG-ME', approved: 60, enrolled: 0 },
    { program: 'PG-MBA', approved: 40, enrolled: 0 },
  ],
  notifications: [] as {
    id: string;
    title: string;
    message: string;
    priority: string;
    time: string;
    unread: boolean;
  }[],
};

const DEMO_SUMMARY = {
  institution_name: 'Delhi Institute of Engineering & Technology (AICTE ID: 1-1234567890)',
  total_enrolled: 480,
  approved_intake: 520,
  batches_count: 4,
  latest_quality_score: 74.0,
  pending_review_count: 4,
  active_transfers_count: 1,
  dq_trend: [
    { date: 'Batch 1 (Jul 15)', score: 68.2 },
    { date: 'Batch 2 (Jul 28)', score: 74.0 },
    { date: 'Batch 3 (Aug 04)', score: 85.5 },
    { date: 'Batch 4 (Aug 11)', score: 92.4 },
  ],
  intake_distribution: [
    { program: 'UG-CSE', approved: 60, enrolled: 63 },
    { program: 'UG-ECE', approved: 60, enrolled: 58 },
    { program: 'UG-ME', approved: 60, enrolled: 65 },
    { program: 'PG-MBA', approved: 40, enrolled: 40 },
  ],
  notifications: [
    {
      id: 'notif-1',
      title: 'Transfer Request Awaiting Decision',
      message: 'Inbound transfer TR-2026-0881 exceeds 15-day AICTE window',
      priority: 'HIGH',
      time: '10 mins ago',
      unread: true,
    },
    {
      id: 'notif-2',
      title: 'Batch 2 Ingestion Complete',
      message: '480 student records committed to Central Registry',
      priority: 'NORMAL',
      time: '2 hours ago',
      unread: false,
    },
    {
      id: 'notif-3',
      title: 'Data Quality Alert',
      message: 'Overall data quality score improved from 68.0 to 74.0',
      priority: 'INFO',
      time: '1 day ago',
      unread: false,
    },
  ],
};

export const InstitutionDashboardPage: React.FC = () => {
  const isUploadedInitial = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem('eduverify_data_uploaded') === 'true';
      }
    } catch {
      // ignore
    }
    return false;
  };

  const [hasUploaded, setHasUploaded] = useState<boolean>(isUploadedInitial);
  const [summary, setSummary] = useState(isUploadedInitial() ? DEMO_SUMMARY : ZERO_SUMMARY);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/v1/dashboards/institution/summary`);
        if (res.ok) {
          const data = await res.json();
          // If server reports batches/students, or local storage has uploaded flag
          const hasData = (data.total_enrolled && data.total_enrolled > 0) || isUploadedInitial();
          if (hasData) {
            setHasUploaded(true);
            setSummary((prev) => ({ ...prev, ...data }));
          } else {
            setHasUploaded(false);
            setSummary(ZERO_SUMMARY);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard summary:', err);
      }
    };
    fetchDashboard();
  }, []);

  const handleLoadDemoDocument = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('eduverify_data_uploaded', 'true');
      }
    } catch {}
    setHasUploaded(true);
    setSummary(DEMO_SUMMARY);
  };

  const handleResetToZero = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('eduverify_data_uploaded');
      }
    } catch {}
    setHasUploaded(false);
    setSummary(ZERO_SUMMARY);
  };

  const fillPercentage = summary.approved_intake > 0
    ? ((summary.total_enrolled / summary.approved_intake) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gov-navy">Institution Portal</h2>
          <p className="text-xs text-slate-500 mt-1">{summary.institution_name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasUploaded ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToZero}
              className="text-xs text-slate-600 border-slate-300 hover:bg-slate-50"
              title="Reset stats to zero to simulate fresh state"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Reset Stats to Zero
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadDemoDocument}
              className="text-xs font-semibold text-amber-800 bg-amber-50 border-amber-300 hover:bg-amber-100"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              Load Demo Document
            </Button>
          )}
          <Link to="/institution/students">
            <Button variant="outline" size="sm" className="text-xs">
              <Users className="w-4 h-4 mr-1.5" />
              Student Registry
            </Button>
          </Link>
          <Link to="/institution/transfers">
            <Button variant="outline" size="sm" className="text-xs">
              <ArrowLeftRight className="w-4 h-4 mr-1.5" />
              Transfers
            </Button>
          </Link>
          <Link to="/institution/upload">
            <Button variant="default" size="sm" className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs">
              <UploadCloud className="w-4 h-4 mr-1.5" />
              Upload Batch
            </Button>
          </Link>
        </div>
      </div>

      {/* No Data Uploaded Banner */}
      {!hasUploaded && (
        <div
          role="status"
          className="p-5 rounded-xl border border-amber-200 bg-linear-to-r from-amber-50/90 via-orange-50/50 to-white text-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  No Student Data Uploaded Yet
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                  Academic Year 2026-27
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                No student admission batches have been ingested yet. All enrolment statistics,
                data quality scores, and statutory validation checks are currently set to zero.
                Upload your institution&apos;s batch file or load the demo document to populate real-time analytics.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
            <Button
              onClick={handleLoadDemoDocument}
              size="sm"
              className="bg-gov-saffron hover:bg-amber-600 text-slate-900 font-bold text-xs shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
              Load Demo Document
            </Button>
            <Link to="/institution/upload">
              <Button
                size="sm"
                className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold shadow-xs"
              >
                <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                Upload Batch
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards (Students, Fill %, DQ score, Transfers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: DQ Score */}
        <Card className="flex flex-col items-center justify-center p-5 text-center bg-white border border-slate-200 shadow-xs" id="kpi-dq-score" data-testid="kpi-dq-score">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Data Quality Score
          </span>
          <QualityScoreGauge
            score={summary.latest_quality_score}
            scoreBefore={hasUploaded ? 68.0 : undefined}
            size="md"
          />
          {hasUploaded ? (
            <p className="text-[11px] text-green-700 font-bold mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+6.0 pts improvement</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 font-medium mt-2 flex items-center gap-1">
              <span>Awaiting batch data upload</span>
            </p>
          )}
        </Card>

        {/* KPI 2: Total Students & Fill % */}
        <Card className="p-5 flex flex-col justify-between bg-white border border-slate-200 shadow-xs" id="kpi-students-fill" data-testid="kpi-students-fill">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Enrolment & Seat Fill %
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{summary.total_enrolled}</span>
              <span className="text-xs text-slate-500 font-medium">/ {summary.approved_intake} seats</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Fill Ratio</span>
                <span className="text-gov-navy">{fillPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gov-navy h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Number(fillPercentage))}%` }}
                />
              </div>
            </div>
          </div>
          {hasUploaded ? (
            <p className="text-[11px] text-green-700 font-semibold mt-3 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Within approved AICTE ceiling (0 excess)</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 font-medium mt-3 flex items-center gap-1">
              <span>No student records uploaded</span>
            </p>
          )}
        </Card>

        {/* KPI 3: Active Transfers */}
        <Card className="p-5 flex flex-col justify-between bg-white border border-slate-200 shadow-xs" id="kpi-transfers" data-testid="kpi-transfers">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Inter-Institution Transfers
            </span>
            <div className="mt-3 text-3xl font-extrabold text-gov-navy">
              {summary.active_transfers_count} Active
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {hasUploaded
                ? '1 Pending Inbound (15d notice) • 1 Approved Outbound'
                : '0 Pending Inbound • 0 Outbound'}
            </p>
          </div>
          <Link to="/institution/transfers" className="mt-3">
            <Button variant="outline" size="sm" className="w-full text-xs flex items-center justify-between">
              <span>View Transfer Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>

        {/* KPI 4: Open Issues by Priority */}
        <Card className="p-5 flex flex-col justify-between bg-white border border-slate-200 shadow-xs" id="kpi-open-issues" data-testid="kpi-open-issues">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Action Required
            </span>
            <div className="mt-3 text-3xl font-extrabold text-amber-600">
              {summary.pending_review_count} Open Issues
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  summary.pending_review_count > 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {hasUploaded ? '1 CRITICAL' : '0 CRITICAL'}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  summary.pending_review_count > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {hasUploaded ? '3 HIGH' : '0 HIGH'}
              </span>
            </div>
          </div>
          {hasUploaded ? (
            <Link to="/institution/batches/batch-demo-2/review" className="mt-3">
              <Button variant="saffron" size="sm" className="w-full text-xs flex items-center justify-between">
                <span>Open Review Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          ) : (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="w-full text-xs flex items-center justify-between opacity-50 cursor-not-allowed"
              >
                <span>No Issues Pending</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* CHARTS GRID (DQ Trend Line + Intake vs Enrolment Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: DQ Trend Line */}
        <Card className="p-5 border border-slate-200 bg-white shadow-xs" id="card-dq-trend" data-testid="card-dq-trend">
          <CardHeader className="p-0 pb-4 border-b border-slate-100">
            <CardTitle className="text-base text-gov-navy flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gov-navy" />
              <span>Data Quality (DQ) Score Trajectory</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Historical progression of automated completeness, uniqueness, and format validation scores across batches
            </CardDescription>
          </CardHeader>
          <div className="pt-4 h-64 w-full">
            {hasUploaded && summary.dq_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.dq_trend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0B2545" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0B2545" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Quality Score']}
                    contentStyle={{ backgroundColor: '#0B2545', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#0B2545"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#scoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No Historical Batch Data</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Batch-by-batch data quality progression will plot here automatically once batches are uploaded and validated.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* CHART 2: Intake vs Enrolment per Program */}
        <Card className="p-5 border border-slate-200 bg-white shadow-xs" id="card-intake-chart" data-testid="card-intake-chart">
          <CardHeader className="p-0 pb-4 border-b border-slate-100">
            <CardTitle className="text-base text-gov-navy flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-gov-navy" />
              <span>Program Sanctioned Intake vs Actual Enrolment</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Program-by-program comparison against AICTE Approved Intake ceilings for Academic Year 2026-27
            </CardDescription>
          </CardHeader>
          <div className="pt-4 h-64 w-full">
            {hasUploaded ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.intake_distribution} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="program" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B2545', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="approved" name="Sanctioned Intake" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="enrolled" name="Enrolled Students" fill="#D97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                <BarChart2 className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No Enrolment Records</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Intake ceiling comparisons per program will populate once student admission batches are uploaded.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* LOWER SECTION: Open Issues Breakdown + Notifications List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Issues Breakdown */}
        <Card className="border border-slate-200 bg-white shadow-xs" id="dashboard-open-issues-card" data-testid="dashboard-open-issues-card">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-gov-navy flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-gov-saffron" />
                <span>Open Data Quality Issues</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Pending resolution before full statutory compliance clearance
              </CardDescription>
            </div>
            {hasUploaded && (
              <Link to="/institution/batches/batch-demo-2/review">
                <Button variant="outline" size="sm" className="text-xs">
                  Resolve All
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            {hasUploaded ? (
              <div className="space-y-3">
                {[
                  {
                    id: 'iss-002',
                    rule: 'V002',
                    title: 'APAAR ID format invalid / Excel truncated',
                    priority: 'CRITICAL',
                    field: 'apaar_id',
                    row: 22,
                  },
                  {
                    id: 'iss-001',
                    rule: 'V018',
                    title: 'Minor student enrolled without guardian consent record',
                    priority: 'HIGH',
                    field: 'guardian_consent',
                    row: 14,
                  },
                  {
                    id: 'iss-003',
                    rule: 'V028',
                    title: 'Lateral entry student enrolled directly into Year 1 invalid',
                    priority: 'HIGH',
                    field: 'admission_type',
                    row: 35,
                  },
                  {
                    id: 'iss-005',
                    rule: 'V030',
                    title: 'Department name whitespace and case normalisation',
                    priority: 'LOW',
                    field: 'department',
                    row: 50,
                  },
                ].map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            issue.priority === 'CRITICAL'
                              ? 'bg-red-100 text-red-800'
                              : issue.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {issue.priority}
                        </span>
                        <span className="font-mono text-xs font-bold text-gov-navy">{issue.rule}</span>
                        <span className="text-xs text-slate-500">• Row #{issue.row}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-800">{issue.title}</p>
                    </div>
                    <Link to="/institution/batches/batch-demo-2/review">
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                        Inspect
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                <p className="text-xs font-bold text-slate-700">No Open Issues</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  No data uploaded yet. Ingest student admission records to run statutory validation checks.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real-time Notifications List */}
        <Card className="border border-slate-200 bg-white shadow-xs" id="dashboard-notifications-card" data-testid="dashboard-notifications-card">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-gov-navy flex items-center gap-2">
                <Bell className="w-4 h-4 text-gov-saffron" />
                <span>Institutional Alerts & Notifications</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Time-sensitive regulatory alerts and system event broadcasts
              </CardDescription>
            </div>
            <span className="text-xs font-semibold text-gov-navy bg-gov-navy/10 px-2 py-0.5 rounded-full">
              {summary.notifications.filter((n) => n.unread).length} New
            </span>
          </CardHeader>
          <CardContent className="pt-4">
            {hasUploaded && summary.notifications.length > 0 ? (
              <div className="space-y-3">
                {summary.notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg border transition ${
                      notif.unread
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        {notif.priority === 'HIGH' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                        {notif.priority === 'INFO' && <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
                        <span>{notif.title}</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">{notif.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                <Bell className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">No Notifications</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Regulatory alerts, deadline notices, and ingestion events will appear here once active.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
