import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StudentCredentialItem, CredentialStatus } from '../types';
import {
  Wallet,
  AlertTriangle,
  Clock,
  Ban,
  CheckCircle2,
  QrCode,
  Download,
} from 'lucide-react';

interface CredentialsListCardProps {
  credentials: StudentCredentialItem[];
  onOpenShareModal: (cred: StudentCredentialItem) => void;
  onDownloadCertificate: (cred: StudentCredentialItem) => void;
}

export const CredentialsListCard: React.FC<CredentialsListCardProps> = ({
  credentials,
  onOpenShareModal,
  onDownloadCertificate,
}) => {
  const getStatusBadge = (status: CredentialStatus) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            VALID
          </span>
        );
      case 'SUPERSEDED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            SUPERSEDED
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-600" />
            SUSPENDED
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
            <Ban className="w-3.5 h-3.5 text-red-600" />
            REVOKED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-xs" data-testid="credentials-list-card">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gov-navy/10 text-gov-navy flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gov-navy">
                Issued Verifiable Credentials
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                SD-JWT Credentials bound to APAAR identity and your hardware key
              </CardDescription>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
            {credentials.length} Available
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {credentials.map((cred) => {
            const isSuspended = cred.status === 'SUSPENDED';

            return (
              <div
                key={cred.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isSuspended
                    ? 'border-slate-300 bg-slate-50/80 opacity-90'
                    : 'border-slate-200 bg-white shadow-xs hover:border-gov-navy/40'
                }`}
                data-testid={`credential-card-${cred.id}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {cred.credential_type.replace('_', ' ')}
                      </span>
                      <h4 className="text-sm font-bold text-gov-navy mt-0.5">{cred.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{cred.title_hi}</p>
                    </div>
                    <div data-testid={`credential-status-${cred.id}`}>
                      {getStatusBadge(cred.status)}
                    </div>
                  </div>

                  {cred.status_reason && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{cred.status_reason}</span>
                    </div>
                  )}

                  <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Issuer:</span>
                      <strong className="text-slate-800 truncate max-w-[170px]" title={cred.issuer_name}>
                        {cred.issuer_name}
                      </strong>
                    </div>
                    <div className="flex justify-between py-0.5 font-mono text-[11px]">
                      <span className="text-slate-500 font-sans">Issuer DID:</span>
                      <strong className="text-gov-navy truncate max-w-[170px]" title={cred.issuer_did}>
                        {cred.issuer_did}
                      </strong>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Issued On:</span>
                      <strong className="text-slate-800">{new Date(cred.issued_at).toLocaleDateString()}</strong>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Subject Version:</span>
                      <strong className="text-gov-navy font-mono">v{cred.record_version}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={isSuspended}
                    onClick={() => onOpenShareModal(cred)}
                    className="flex-1 bg-gov-navy hover:bg-gov-navyDark text-white text-xs h-8 font-semibold"
                    data-testid={`share-cred-btn-${cred.id}`}
                  >
                    <QrCode className="w-3.5 h-3.5 mr-1.5 text-gov-saffron" />
                    Share Selected Fields
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownloadCertificate(cred)}
                    className="border-slate-300 text-slate-700 text-xs h-8 hover:bg-slate-50"
                    title="Download A4 PDF Certificate"
                    data-testid={`download-cert-btn-${cred.id}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
