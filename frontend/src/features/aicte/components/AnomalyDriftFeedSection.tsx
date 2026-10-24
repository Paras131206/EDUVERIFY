import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AnomalyFeedItem } from '../types';
import {
  Activity,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AnomalyDriftFeedSectionProps {
  anomalies: AnomalyFeedItem[];
}

export const AnomalyDriftFeedSection: React.FC<AnomalyDriftFeedSectionProps> = ({ anomalies }) => {
  return (
    <Card className="border-slate-200 bg-white shadow-xs" data-testid="anomaly-drift-feed-section">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-base text-gov-navy flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600" />
            <span>National Algorithmic Anomaly & Schema Drift Feed</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Automated outlier alerts detected via multi-dimensional IsolationForest and longitudinal z-score deviation
          </CardDescription>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200">
          {anomalies.length} Active Outlier Alerts
        </span>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {anomalies.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-2"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    item.priority === 'CRITICAL'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : item.priority === 'HIGH'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {item.priority}
                </span>
                <span className="font-mono text-xs font-bold text-gov-navy bg-gov-navy/10 px-2 py-0.5 rounded">
                  {item.metric}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {item.institution_name} ({item.institution_aicte_id})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  z = {item.z > 0 ? `+${item.z}` : item.z} ({item.method === 'isolation_forest' ? 'IsolationForest' : 'Z-Score'})
                </span>
                <Link
                  to={`/institution/batches/${item.batch_id}/review`}
                  className="text-xs font-bold text-gov-navy hover:text-gov-navyDark flex items-center gap-1 hover:underline"
                >
                  <span>Batch Review</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {item.reason}
            </p>

            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
              <span>
                Observed Value: <strong className="text-slate-800">{(item.value * 100).toFixed(1)}%</strong>
              </span>
              <span>•</span>
              <span>
                Historical Baseline: <strong className="text-slate-800">{(item.baseline * 100).toFixed(1)}%</strong>
              </span>
              <span>•</span>
              <span>Batch ID: <code className="font-mono">{item.batch_id}</code></span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
