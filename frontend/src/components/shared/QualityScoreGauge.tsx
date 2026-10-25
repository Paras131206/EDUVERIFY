import React from 'react';
import { useTranslation } from 'react-i18next';

interface QualityScoreGaugeProps {
  score: number;
  scoreBefore?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const QualityScoreGauge: React.FC<QualityScoreGaugeProps> = ({
  score,
  scoreBefore,
  size = 'md',
  className = '',
}) => {
  const { t } = useTranslation();
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));

  let color = 'text-green-600 bg-green-50 border-green-200';
  let badgeKey = 'excellent';
  let defaultBadgeText = 'Excellent';
  if (safeScore < 60) {
    color = 'text-red-600 bg-red-50 border-red-200';
    badgeKey = 'critical_action';
    defaultBadgeText = 'Critical Action Needed';
  } else if (safeScore < 80) {
    color = 'text-amber-600 bg-amber-50 border-amber-200';
    badgeKey = 'needs_review';
    defaultBadgeText = 'Needs Review';
  } else if (safeScore < 90) {
    color = 'text-blue-600 bg-blue-50 border-blue-200';
    badgeKey = 'good';
    defaultBadgeText = 'Good';
  }

  const dimensions = {
    sm: { box: 'w-24 h-24', text: 'text-2xl', sub: 'text-[10px]' },
    md: { box: 'w-32 h-32', text: 'text-3xl', sub: 'text-xs' },
    lg: { box: 'w-40 h-40', text: 'text-4xl', sub: 'text-sm' },
  }[size];

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`relative ${dimensions.box} rounded-full border-4 flex flex-col items-center justify-center shadow-inner ${color}`}
        role="meter"
        aria-valuenow={safeScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${t('score.label')}: ${safeScore}%`}
      >
        <span className={`font-bold tracking-tight ${dimensions.text}`}>{safeScore}%</span>
        <span className={`uppercase font-medium tracking-wider text-slate-500 ${dimensions.sub}`}>
          DQ Score
        </span>
      </div>

      <div className="flex flex-col items-center text-center">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {t(`score.${badgeKey}`, defaultBadgeText)}
        </span>
        {typeof scoreBefore === 'number' && (
          <span className="text-xs text-slate-500 mt-1">
            {t('score.before')}: <strong className="text-slate-700">{Math.round(scoreBefore)}%</strong>
            {score > scoreBefore && (
              <span className="text-green-600 font-semibold ml-1">
                (+{Math.round(score - scoreBefore)}%)
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
};
