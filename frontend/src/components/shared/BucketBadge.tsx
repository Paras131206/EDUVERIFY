import React from 'react';
import { ShieldAlert, UserCheck, HelpCircle } from 'lucide-react';

export type Bucket = 'AUTO_FLAG' | 'HUMAN_REVIEW' | 'INFO';

interface BucketBadgeProps {
  bucket: Bucket;
  className?: string;
}

export const BucketBadge: React.FC<BucketBadgeProps> = ({ bucket, className = '' }) => {
  const configs: Record<Bucket, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
    AUTO_FLAG: {
      label: 'Auto Flag',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-red-700" aria-hidden="true" />,
      bg: 'bg-red-100',
      text: 'text-red-900',
      border: 'border-red-300',
    },
    HUMAN_REVIEW: {
      label: 'Human Review',
      icon: <UserCheck className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />,
      bg: 'bg-amber-100',
      text: 'text-amber-900',
      border: 'border-amber-300',
    },
    INFO: {
      label: 'Info',
      icon: <HelpCircle className="w-3.5 h-3.5 text-slate-700" aria-hidden="true" />,
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-300',
    },
  };

  const config = configs[bucket] || configs.INFO;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
      role="status"
      aria-label={`Bucket: ${config.label}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
