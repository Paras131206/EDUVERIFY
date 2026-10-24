import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { AuditVerificationVerdict, AuditLogEntry } from '../types';
import { API_BASE_URL } from '@/lib/api';
import {
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Lock,
  Link as LinkIcon,
} from 'lucide-react';

interface AuditChainSectionProps {
  initialVerdict: AuditVerificationVerdict;
  initialLogs: AuditLogEntry[];
}

export const AuditChainSection: React.FC<AuditChainSectionProps> = ({
  initialVerdict,
  initialLogs,
}) => {
  const [verdict, setVerdict] = useState<AuditVerificationVerdict>(initialVerdict);
  const [logs] = useState<AuditLogEntry[]>(initialLogs);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isBrokenSimulated, setIsBrokenSimulated] = useState<boolean>(false);

  // Poll or check audit chain
  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/audit/verify-chain/recalculate`, {
        method: 'POST',
      });
      if (res.ok) {
        const data: AuditVerificationVerdict = await res.json();
        setVerdict(data);
      }
    } catch (err) {
      console.error('Failed to verify audit chain:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateBrokenChain = () => {
    setIsBrokenSimulated(!isBrokenSimulated);
    if (!isBrokenSimulated) {
      setVerdict({
        verified: false,
        total_records: 42,
        broken_link_id: 'aud-40',
        verified_at: new Date().toISOString(),
        root_hash: 'sha256:TAMPERED_INVALID_HASH',
      });
    } else {
      setVerdict({
        verified: true,
        total_records: 42,
        broken_link_id: null,
        verified_at: new Date().toISOString(),
        root_hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      });
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-xs" data-testid="audit-chain-section">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-base text-gov-navy flex items-center gap-2">
            <Lock className="w-5 h-5 text-gov-navy" />
            <span>Cryptographic Hash-Chained Audit Trail</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Every state mutation, PII disclosure, and transfer override is immutably recorded in a SHA-256 hash chain
          </CardDescription>
        </div>

        {/* STATUS BADGE & VERIFY BUTTON */}
        <div className="flex items-center gap-2.5">
          <div
            id="audit-chain-status-badge"
            data-testid="audit-chain-status-badge"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
              verdict.verified
                ? 'bg-green-100 text-green-800 border-green-300'
                : 'bg-red-100 text-red-800 border-red-300'
            }`}
          >
            {verdict.verified ? (
              <>
                <ShieldCheck className="w-4 h-4 text-green-700" />
                <span>Audit chain intact ({verdict.total_records} links verified)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-red-700" />
                <span>Audit chain broken: link #{verdict.broken_link_id}</span>
              </>
            )}
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="bg-gov-navy text-white text-xs h-8"
            id="reverify-chain-btn"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Verify Chain</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateBrokenChain}
            className="text-xs h-8 text-slate-600"
            id="simulate-break-btn"
          >
            {isBrokenSimulated ? 'Restore Intact' : 'Simulate Break'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* HASH CHAIN PROOF SUMMARY */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-gov-navy shrink-0" />
            <span className="text-slate-700">
              Root Hash Anchor: <code className="font-mono text-slate-900 font-bold">{verdict.root_hash}</code>
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Last Verified: {new Date(verdict.verified_at).toLocaleTimeString()}
          </span>
        </div>

        {/* AUDIT LOG TABLE */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <Table id="audit-log-table">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs">Link ID</TableHead>
                <TableHead className="text-xs">Timestamp</TableHead>
                <TableHead className="text-xs">Actor / Role</TableHead>
                <TableHead className="text-xs">Action & Resource</TableHead>
                <TableHead className="text-xs font-mono">Current Hash (H_n)</TableHead>
                <TableHead className="text-xs font-mono">Previous Hash (H_n-1)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((entry) => {
                const isBroken = !verdict.verified && verdict.broken_link_id === entry.id;
                return (
                  <TableRow
                    key={entry.id}
                    className={`hover:bg-slate-50/60 ${isBroken ? 'bg-red-50/80 border-l-4 border-red-500' : ''}`}
                  >
                    <TableCell className="font-mono text-xs font-bold text-gov-navy">
                      {entry.id}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs text-slate-800">{entry.actor_email}</div>
                      <span className="text-[10px] font-bold text-slate-400">{entry.actor_role}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-slate-900 block">{entry.action}</span>
                      <span className="text-[11px] text-slate-500">{entry.resource}</span>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-700 max-w-xs truncate">
                      {entry.record_hash}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {entry.prev_record_hash}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
