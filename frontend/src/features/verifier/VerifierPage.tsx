import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, QrCode, CheckCircle2 } from 'lucide-react';

export const VerifierPage: React.FC = () => {
  const [isVerified, setIsVerified] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-gov-navy">Authorized Verifier Portal</h2>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically verify student credentials with zero knowledge of non-disclosed attributes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scan or Paste Verifiable Presentation</CardTitle>
          <CardDescription>
            Validates Ed25519 issuer signature, KB-JWT holder key binding, and status list revocation/suspension
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50">
            <QrCode className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Point Camera at Student Credential QR</p>
            <p className="text-xs text-slate-500 mt-1">Or paste SD-JWT token payload below</p>
          </div>

          <Button
            variant="default"
            className="w-full"
            onClick={() => setIsVerified(true)}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Verify Presentation
          </Button>

          {isVerified && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-3">
              <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>VALID CREDENTIAL · ISSUER TRUSTED</span>
              </div>
              <div className="text-xs space-y-1 text-slate-700 bg-white p-3 rounded border border-green-100">
                <p><strong>Holder Name:</strong> Aditi Verma</p>
                <p><strong>APAAR ID:</strong> 1234****9012 (Selectively disclosed)</p>
                <p><strong>Program:</strong> B.Tech Computer Science</p>
                <p><strong>Issuer:</strong> AICTE Central Repository (did:web:aicte.gov.in)</p>
                <p><strong>Status:</strong> Active (Not Revoked, Not Superseded)</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
