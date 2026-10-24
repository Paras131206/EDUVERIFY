import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MaskedValue } from '@/components/shared/MaskedValue';
import { Wallet, KeyRound, QrCode, ShieldCheck } from 'lucide-react';

export const StudentWalletPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-gov-navy">Student Identity Wallet</h2>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically signed SD-JWT Verifiable Credential bound to your APAAR ID and local browser key
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-t-4 border-t-gov-navy">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-gov-navy" />
              <CardTitle className="text-base">Enrolment Credential</CardTitle>
            </div>
            <CardDescription>Issued by Delhi Institute of Engineering & Technology</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Student Name:</span>
              <span className="font-semibold text-slate-900">Rahul Sharma</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">APAAR ID:</span>
              <MaskedValue value="984512349012" kind="apaar" canUnmask />
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Program:</span>
              <span className="font-semibold text-slate-900">B.Tech Computer Science</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Enrolment Status:</span>
              <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-semibold">ACTIVE</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Key Custody:</span>
              <span className="flex items-center gap-1 text-slate-700">
                <KeyRound className="w-3.5 h-3.5 text-gov-saffron" /> WebCrypto ECDSA P-256
              </span>
            </div>

            <div className="pt-3 flex gap-2">
              <Button variant="default" size="sm" className="w-full">
                <QrCode className="w-3.5 h-3.5 mr-1.5" /> Generate Selective Share QR
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <CardTitle className="text-base">Consent & Privacy Governance</CardTitle>
            </div>
            <CardDescription>Purpose-bound consent controls per Section 8.4</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Verification Share</p>
                  <p className="text-[11px] text-slate-500">Allow employers/third parties to verify credentials</p>
                </div>
                <span className="text-xs font-semibold text-green-700">ACTIVE</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Central Repository</p>
                  <p className="text-[11px] text-slate-500">Statutory record maintenance in AICTE central repository</p>
                </div>
                <span className="text-xs font-semibold text-green-700">GRANTED</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
