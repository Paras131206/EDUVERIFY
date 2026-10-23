import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, Webhook, Shield } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-gov-navy">System Settings & Integrations</h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage institution API keys, webhook subscriptions, and security credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-gov-navy" />
              <CardTitle className="text-base">Institutional API Keys</CardTitle>
            </div>
            <CardDescription>
              Provision scoped API keys (<code className="text-xs font-mono">evk_...</code>) for automated ERP sync
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="default" size="sm">
              Generate New API Key
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-gov-saffronDark" />
              <CardTitle className="text-base">HMAC-Signed Webhooks</CardTitle>
            </div>
            <CardDescription>
              Receive real-time notifications for batch completion, transfer approvals and credential revocations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm">
              Configure Webhook Endpoint
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-700" />
            <CardTitle className="text-base">Audit Trail Verification</CardTitle>
          </div>
          <CardDescription>
            Cryptographically verify the SHA-256 hash chain of your institution's immutable audit log
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-green-100 text-green-800 text-xs font-semibold">
              Chain Integrity: VERIFIED (142 blocks intact)
            </span>
            <Button variant="outline" size="sm">
              Re-verify Chain Hashes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
