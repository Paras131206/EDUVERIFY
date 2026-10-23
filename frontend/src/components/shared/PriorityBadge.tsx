import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const configs: Record<Priority, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
    CRITICAL: {
      label: 'Critical',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-red-700" aria-hidden="true" />,
      bg: 'bg-red-50',
      text: 'text-red-800',
      border: 'border-red-300',
    },
    HIGH: {
      label: 'High',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-700" aria-hidden="true" />,
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-300',
    },
    MEDIUM: {
      label: 'Medium',
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />,
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
    },
    LOW: {
      label: 'Low',
      icon: <Info className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />,
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-300',
    },
  };

  const config = configs[priority] || configs.LOW;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
      role="status"
      aria-label={`Priority: ${config.label}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
