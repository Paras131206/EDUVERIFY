import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, KeyRound, RefreshCw, Smartphone, Lock } from 'lucide-react';
import { clearHolderKey, getOrInitHolderKey } from '@/lib/holderKey';

interface HolderKeyBannerProps {
  publicJwk: JsonWebKey | null;
  isRegistered: boolean;
  onKeyRefreshed: () => void;
}

export const HolderKeyBanner: React.FC<HolderKeyBannerProps> = ({
  publicJwk,
  isRegistered,
  onKeyRefreshed,
}) => {
  const [reissuing, setReissuing] = useState(false);
  const [showConfirmReissue, setShowConfirmReissue] = useState(false);

  const handleReissueKey = async () => {
    setReissuing(true);
    try {
      await clearHolderKey();
      await getOrInitHolderKey(true);
      onKeyRefreshed();
      setShowConfirmReissue(false);
    } catch (err) {
      console.error('Failed to reissue key:', err);
    } finally {
      setReissuing(false);
    }
  };

  const keyThumbprint = publicJwk?.x ? `${String(publicJwk.x).slice(0, 10)}...${String(publicJwk.x).slice(-6)}` : 'Generating...';

  return (
    <Card
      className="border-gov-navy/20 bg-gradient-to-r from-gov-navyDark via-gov-navy to-slate-900 text-white p-4 shadow-md"
      data-testid="holder-key-banner"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-gov-saffron/20 text-gov-saffron border border-gov-saffron/30">
              <KeyRound className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-gov-saffron">
              Client-Side WebCrypto Custody Active
            </span>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full"
              data-testid="holder-key-badge"
            >
              <ShieldCheck className="w-3 h-3" />
              Hardware Key Active • extractable: false
            </span>
          </div>

          <p className="text-sm font-semibold text-slate-100 flex items-center gap-1.5" data-testid="holder-key-notice">
            <Smartphone className="w-4 h-4 text-gov-saffron shrink-0" />
            <span>This device holds your key; if you clear browser data you must request re-issue</span>
          </p>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 pt-0.5 font-mono">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              Algorithm: <strong>ECDSA P-256 (ES256)</strong>
            </span>
            <span>•</span>
            <span>
              Public Key Thumbprint: <strong>{keyThumbprint}</strong>
            </span>
            <span>•</span>
            <span className="text-green-400 font-sans font-medium">
              {isRegistered ? 'Registered with Central Registry' : 'Syncing...'}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {!showConfirmReissue ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmReissue(true)}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs h-8"
              data-testid="reissue-key-btn"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Request Key Re-Issue
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-red-950/80 p-2 rounded-lg border border-red-800 animate-in fade-in">
              <span className="text-[11px] text-red-200">Revoke old key?</span>
              <Button
                size="sm"
                variant="destructive"
                disabled={reissuing}
                onClick={handleReissueKey}
                className="h-7 text-xs px-2"
                data-testid="confirm-reissue-btn"
              >
                {reissuing ? 'Reissuing...' : 'Confirm'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowConfirmReissue(false)}
                className="h-7 text-xs px-2 text-slate-300 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
