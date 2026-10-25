import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConsentPurposeSetting, ConsentHistoryRecord, ConsentPurpose } from '../types';
import { API_BASE_URL, authFetch } from '@/lib/api';
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  History,
  HelpCircle,
} from 'lucide-react';

interface ConsentManagementCardProps {
  purposes: ConsentPurposeSetting[];
  history: ConsentHistoryRecord[];
  onConsentUpdated: (msg?: string) => void;
}

export const ConsentManagementCard: React.FC<ConsentManagementCardProps> = ({
  purposes,
  history,
  onConsentUpdated,
}) => {
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmWithdrawPurpose, setConfirmWithdrawPurpose] = useState<ConsentPurposeSetting | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleToggleConsent = async (purposeSetting: ConsentPurposeSetting) => {
    // If withdrawing VERIFICATION_SHARE, require explicit confirmation of consequences
    if (purposeSetting.is_granted && purposeSetting.purpose === 'VERIFICATION_SHARE') {
      setConfirmWithdrawPurpose(purposeSetting);
      return;
    }

    await executeConsentChange(purposeSetting.purpose, purposeSetting.is_granted ? 'WITHDRAWN' : 'GRANTED');
  };

  const executeConsentChange = async (purpose: ConsentPurpose, action: 'GRANTED' | 'WITHDRAWN') => {
    setUpdating(purpose);
    try {
      const res = await authFetch(`${API_BASE_URL}/v1/students/me/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose,
          action,
          notes: action === 'WITHDRAWN' ? 'Withdrawn by student from wallet UI' : 'Granted by student',
        }),
      });
      if (res.ok) {
        const msg =
          action === 'WITHDRAWN' && purpose === 'VERIFICATION_SHARE'
            ? 'VERIFICATION_SHARE consent withdrawn. Credentials have been suspended on the AICTE status list.'
            : `Consent for ${purpose} set to ${action}.`;
        onConsentUpdated(msg);
      }
    } catch (err) {
      console.error('Consent update error:', err);
    } finally {
      setUpdating(null);
      setConfirmWithdrawPurpose(null);
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-xs" data-testid="consent-management-card">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-gov-navy">
              Statutory Consent & Purpose Governance
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Purpose-bound granular consent per Section 8.4 • DPDP Act 2023 Conforming
            </CardDescription>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs h-8 border-slate-300 text-slate-700 hover:bg-slate-50"
          data-testid="toggle-consent-history-btn"
        >
          <History className="w-3.5 h-3.5 mr-1.5 text-gov-navy" />
          <span>Consent History ({history.length})</span>
        </Button>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Purpose Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {purposes.map((p) => {
            const isVerificationShare = p.purpose === 'VERIFICATION_SHARE';
            const isRepository = p.purpose === 'REPOSITORY';

            return (
              <div
                key={p.purpose}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  p.is_granted
                    ? isVerificationShare
                      ? 'border-green-200 bg-green-50/30'
                      : 'border-slate-200 bg-slate-50/50'
                    : 'border-amber-300 bg-amber-50/40'
                }`}
                data-testid={`consent-card-${p.purpose}`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          {p.purpose}
                        </span>
                        {isRepository && (
                          <span className="text-[10px] text-gov-navy font-bold flex items-center gap-0.5">
                            <Lock className="w-3 h-3 text-gov-navy" /> Statutory
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{p.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{p.title_hi}</p>
                    </div>

                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        p.is_granted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                      data-testid={`consent-status-${p.purpose}`}
                    >
                      {p.is_granted ? 'GRANTED' : 'WITHDRAWN'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-[11px] space-y-1">
                    <span className="font-bold text-slate-700 block flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-gov-saffron" />
                      Legal & Technical Consequences:
                    </span>
                    <p className="text-slate-600 leading-snug">{p.consequences}</p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between">
                  {p.can_toggle ? (
                    <Button
                      size="sm"
                      variant={p.is_granted ? 'outline' : 'default'}
                      disabled={updating === p.purpose}
                      onClick={() => handleToggleConsent(p)}
                      className={`w-full text-xs font-semibold h-8 ${
                        p.is_granted
                          ? 'border-amber-300 text-amber-900 hover:bg-amber-100/60'
                          : 'bg-green-700 hover:bg-green-800 text-white'
                      }`}
                      data-testid={`consent-toggle-${p.purpose}`}
                    >
                      {updating === p.purpose
                        ? 'Updating...'
                        : p.is_granted
                        ? 'Withdraw Consent'
                        : 'Grant Consent'}
                    </Button>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic w-full text-center">
                      Statutory requirement (Section 8.4)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Withdrawal Consequence Confirmation Modal */}
        {confirmWithdrawPurpose && (
          <div
            role="dialog"
            aria-labelledby="withdraw-modal-title"
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
            data-testid="withdraw-confirmation-modal"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-t-4 border-amber-500 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-amber-100 text-amber-700 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 id="withdraw-modal-title" className="text-base font-bold text-slate-900">
                    Withdraw Verification Consent?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Withdrawing {confirmWithdrawPurpose.purpose} has immediate statutory effects
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-2">
                <p className="font-semibold">
                  {confirmWithdrawPurpose.warning_on_withdraw}
                </p>
                <p className="text-[11px] text-amber-800">
                  Per Section 8.4: Withdrawing VERIFICATION_SHARE suspends credentials (status list suspension bit set). Third-party verification will return &quot;Holder has withdrawn consent&quot; without revealing any data.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmWithdrawPurpose(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => executeConsentChange('VERIFICATION_SHARE', 'WITHDRAWN')}
                  className="text-xs bg-amber-700 hover:bg-amber-800 text-white"
                  data-testid="confirm-withdraw-consent-btn"
                >
                  Confirm & Suspend Credentials
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Expandable Consent History Log */}
        {showHistory && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-in fade-in" data-testid="consent-history-panel">
            <h4 className="text-xs font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-gov-saffron" />
              <span>Consent Ledger Audit Trail</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-2 font-semibold">Timestamp</th>
                    <th className="p-2 font-semibold">Purpose</th>
                    <th className="p-2 font-semibold">Action</th>
                    <th className="p-2 font-semibold">Actor</th>
                    <th className="p-2 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="p-2 font-mono text-[11px] text-slate-600">
                        {new Date(h.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2 font-mono font-bold text-slate-800">{h.purpose}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            h.action === 'GRANTED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {h.action}
                        </span>
                      </td>
                      <td className="p-2 text-slate-700">{h.actor}</td>
                      <td className="p-2 text-slate-500 italic max-w-xs truncate">{h.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
