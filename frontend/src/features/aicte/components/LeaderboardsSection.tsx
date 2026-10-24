import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LeaderboardItem } from '../types';
import {
  Trophy,
  AlertTriangle,
  Flame,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Building,
} from 'lucide-react';

interface LeaderboardsSectionProps {
  leaderboards: {
    excess_enrolment: LeaderboardItem[];
    lowest_dq: LeaderboardItem[];
    cross_duplicates: LeaderboardItem[];
  };
}

export const LeaderboardsSection: React.FC<LeaderboardsSectionProps> = ({ leaderboards }) => {
  const [activeTab, setActiveTab] = useState<'excess' | 'dq' | 'duplicates'>('excess');

  return (
    <Card className="border-slate-200 bg-white shadow-xs" data-testid="leaderboards-section">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-base text-gov-navy flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gov-saffron" />
            <span>National Regulatory Leaderboards & Priority Hotspots</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Ranking institutions requiring immediate AICTE intervention across statutory over-enrolment, audit quality deficits, and duplicate enrollees
          </CardDescription>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('excess')}
            data-testid="tab-leaderboard-excess"
            className={`px-3 py-1 font-semibold rounded-md transition ${
              activeTab === 'excess' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Excess Enrolment
          </button>
          <button
            onClick={() => setActiveTab('dq')}
            data-testid="tab-leaderboard-dq"
            className={`px-3 py-1 font-semibold rounded-md transition ${
              activeTab === 'dq' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lowest DQ Score
          </button>
          <button
            onClick={() => setActiveTab('duplicates')}
            data-testid="tab-leaderboard-duplicates"
            className={`px-3 py-1 font-semibold rounded-md transition ${
              activeTab === 'duplicates' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cross-Institution Dupes
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* TAB 1: EXCESS ENROLMENT */}
        {activeTab === 'excess' && (
          <div className="space-y-3" data-testid="leaderboard-excess-content">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-500" />
                <span>Top Institutions Exceeding Approved AICTE Intake (Rule V012)</span>
              </span>
              <span className="text-[11px] text-slate-400">Ranked by Total Excess Students</span>
            </div>

            <div className="divide-y divide-slate-100">
              {leaderboards.excess_enrolment.map((item) => (
                <div
                  key={item.institution_aicte_id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        item.rank === 1
                          ? 'bg-red-600 text-white shadow-xs'
                          : item.rank === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      #{item.rank}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>{item.institution_name}</span>
                        <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {item.institution_aicte_id}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.state_name} • {item.secondary_value}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      +{item.value} Excess
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: LOWEST DQ */}
        {activeTab === 'dq' && (
          <div className="space-y-3" data-testid="leaderboard-dq-content">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                <span>Institutions with Lowest Data Quality Verification Scores</span>
              </span>
              <span className="text-[11px] text-slate-400">Ranked by Aggregate DQ Score</span>
            </div>

            <div className="divide-y divide-slate-100">
              {leaderboards.lowest_dq.map((item) => (
                <div
                  key={item.institution_aicte_id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        item.rank === 1
                          ? 'bg-red-600 text-white shadow-xs'
                          : item.rank === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      #{item.rank}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>{item.institution_name}</span>
                        <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {item.institution_aicte_id}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.state_name} • {item.secondary_value}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      {item.value}% DQ
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CROSS-INSTITUTION DUPLICATES */}
        {activeTab === 'duplicates' && (
          <div className="space-y-3" data-testid="leaderboard-duplicates-content">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                <span>Institutions with Highest Cross-Institution Enrolment Duplicates (Rule V010)</span>
              </span>
              <span className="text-[11px] text-slate-400">Ranked by Inter-Institution Cluster Count</span>
            </div>

            <div className="divide-y divide-slate-100">
              {leaderboards.cross_duplicates.map((item) => (
                <div
                  key={item.institution_aicte_id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        item.rank === 1
                          ? 'bg-purple-600 text-white shadow-xs'
                          : item.rank === 2
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      #{item.rank}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>{item.institution_name}</span>
                        <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {item.institution_aicte_id}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.state_name} • {item.secondary_value}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                      {item.value} Dupes
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      {item.status}
                    </span>
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
