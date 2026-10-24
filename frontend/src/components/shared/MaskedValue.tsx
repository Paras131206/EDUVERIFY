import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { maskApaar, maskEmail, maskMobile } from '@/lib/masking';

export type MaskKind = 'apaar' | 'email' | 'mobile' | 'custom';

interface MaskedValueProps {
  value: string | null | undefined;
  kind?: MaskKind;
  canUnmask?: boolean;
  className?: string;
}

export const MaskedValue: React.FC<MaskedValueProps> = ({
  value,
  kind = 'apaar',
  canUnmask = false,
  className = '',
}) => {
  const [revealed, setRevealed] = useState(false);

  if (!value) {
    return <span className="text-gray-400">—</span>;
  }

  let masked = value;
  if (kind === 'apaar') masked = maskApaar(value);
  else if (kind === 'email') masked = maskEmail(value);
  else if (kind === 'mobile') masked = maskMobile(value);
  else masked = '••••••••';

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-sm ${className}`}>
      <span>{revealed ? value : masked}</span>
      {canUnmask && (
        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          className="text-gray-500 hover:text-gray-700 p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
          aria-label={revealed ? 'Hide sensitive data' : 'Reveal sensitive data'}
        >
          {revealed ? (
            <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
      )}
    </span>
  );
};
