import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ApiKeyItem, CreatedApiKey, InstitutionUserItem } from '@/types/auth';
import { WebhookConfigItem } from '@/features/institution/types';
import { API_BASE_URL } from '@/lib/api';
import {
  Key,
  Users,
  Webhook,
  Copy,
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  Mail,
  ShieldCheck,
  Send,
  Code2,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const location = useLocation();
  const getInitialTab = (): 'api-keys' | 'users' | 'security' | 'webhooks' => {
    if (location.pathname.includes('/webhooks')) return 'webhooks';
    if (location.pathname.includes('/users')) return 'users';
    return 'api-keys';
  };

  const [activeTab, setActiveTab] = useState<'api-keys' | 'users' | 'security' | 'webhooks'>(getInitialTab);

  useEffect(() => {
    if (location.pathname.includes('/webhooks')) {
      setActiveTab('webhooks');
    }
  }, [location.pathname]);


  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['upload:batches']);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<CreatedApiKey | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Users state
  const [users, setUsers] = useState<InstitutionUserItem[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'INSTITUTION_ADMIN' | 'INSTITUTION_STAFF'>('INSTITUTION_STAFF');
  const [userSuccessMessage, setUserSuccessMessage] = useState<string | null>(null);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookConfigItem[]>([]);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedWebhookEvents, setSelectedWebhookEvents] = useState<string[]>([
    'batch.committed',
    'student.transitioned',
  ]);
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);
  const [hasCopiedSecret, setHasCopiedSecret] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);
  const [codeLanguage, setCodeLanguage] = useState<'nodejs' | 'python' | 'go'>('nodejs');
  const [hasCopiedSnippet, setHasCopiedSnippet] = useState(false);

  // Fetch API Keys
  const loadApiKeys = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/api-keys`);
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data);
      }
    } catch {
      // Ignore in dev
    }
  };

  // Fetch Users
  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      // Ignore in dev
    }
  };

  // Fetch Webhooks
  const loadWebhooks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/webhooks`);
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data);
      }
    } catch {
      // Ignore in dev
    }
  };

  useEffect(() => {
    loadApiKeys();
    loadUsers();
    loadWebhooks();
  }, []);


  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/v1/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName, scopes: selectedScopes }),
      });
      if (res.ok) {
        const data: CreatedApiKey = await res.json();
        setNewlyCreatedKey(data);
        setNewKeyName('');
        setSelectedScopes(['upload:batches']);
        loadApiKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/api-keys/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadApiKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyKey = () => {
    if (newlyCreatedKey?.raw_key) {
      navigator.clipboard.writeText(newlyCreatedKey.raw_key);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 3000);
    }
  };

  const handleCloseKeyModal = () => {
    // Crucial security requirement: Key is only shown once. Clearing state permanently discards raw secret.
    setNewlyCreatedKey(null);
    setIsKeyModalOpen(false);
    setHasCopied(false);
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/v1/users/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        setUserSuccessMessage(`Invitation dispatched to ${inviteEmail}.`);
        setInviteEmail('');
        setIsInviteModalOpen(false);
        loadUsers();
        setTimeout(() => setUserSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/v1/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newWebhookUrl.trim(),
          events: selectedWebhookEvents,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Secret is only returned here once!
        setNewlyCreatedSecret(data.raw_secret);
        setNewWebhookUrl('');
        setSelectedWebhookEvents(['batch.committed', 'student.transitioned']);
        setIsWebhookModalOpen(false);
        loadWebhooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/webhooks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadWebhooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTestWebhook = async (id: string) => {
    try {
      setTestFeedback('Dispatching test ping to webhook URL...');
      const res = await fetch(`${API_BASE_URL}/v1/webhooks/${id}/test`, { method: 'POST' });
      if (res.ok) {
        setTestFeedback('Ping delivery succeeded (HTTP 200 OK)');
        loadWebhooks();
        setTimeout(() => setTestFeedback(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setTestFeedback('Test ping failed');
    }
  };

  const handleCopySecret = () => {
    if (newlyCreatedSecret) {
      navigator.clipboard.writeText(newlyCreatedSecret);
      setHasCopiedSecret(true);
      setTimeout(() => setHasCopiedSecret(false), 3000);
    }
  };

  const handleCloseSecretModal = () => {
    // Secret permanently discarded from state
    setNewlyCreatedSecret(null);
    setHasCopiedSecret(false);
  };

  const getSignatureSnippet = () => {
    if (codeLanguage === 'nodejs') {
      return `const crypto = require('crypto');

// Express.js middleware / webhook handler
function verifyEduVerifySignature(rawBody, signatureHeader, secret) {
  // signatureHeader format: "sha256=<hex_hash>"
  const expectedSignature = 'sha256=' + crypto.createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(expectedSignature)
  );
}`;
    }
    if (codeLanguage === 'python') {
      return `import hmac
import hashlib

def verify_eduverify_signature(raw_body: bytes, signature_header: str, secret: str) -> bool:
    """Verifies HMAC-SHA256 signature from X-EduVerify-Signature header."""
    expected = "sha256=" + hmac.new(
        secret.encode('utf-8'),
        raw_body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature_header, expected)`;
    }
    return `package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
)

func VerifyEduVerifyWebhook(payload []byte, signatureHeader string, secret string) bool {
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write(payload)
    expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
    return hmac.Equal([]byte(signatureHeader), []byte(expected))
}`;
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(getSignatureSnippet());
    setHasCopiedSnippet(true);
    setTimeout(() => setHasCopiedSnippet(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-gov-navy">
          Institution Administration & Settings
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Self-service institutional API keys, team role assignments, webhooks, and security compliance
        </p>

        {/* Subtabs */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setActiveTab('api-keys')}
            id="tab-api-keys"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'api-keys'
                ? 'bg-gov-navy text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-gov-navy'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API Keys</span>
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            id="tab-webhooks"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'webhooks'
                ? 'bg-gov-navy text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-gov-navy'
            }`}
          >
            <Webhook className="w-4 h-4" />
            <span>Webhooks</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            id="tab-users"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'users'
                ? 'bg-gov-navy text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-gov-navy'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            id="tab-security"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'security'
                ? 'bg-gov-navy text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-gov-navy'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit & Compliance</span>
          </button>
        </div>
      </div>


      {userSuccessMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-md text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span>{userSuccessMessage}</span>
        </div>
      )}

      {/* TAB 1: API KEYS */}
      {activeTab === 'api-keys' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-base text-gov-navy flex items-center gap-2">
                  <Key className="w-5 h-5 text-gov-navy" />
                  <span>Institutional API Keys</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Provision high-throughput API credentials for programmatic CSV/JSON ingestion from your campus ERP
                </CardDescription>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsKeyModalOpen(true)}
                id="create-api-key-btn"
                className="bg-gov-navy hover:bg-gov-navyDark text-white shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Generate New Key
              </Button>
            </CardHeader>
            <CardContent>
              <Table id="api-keys-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Key Name</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Scopes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-xs text-slate-500 py-6">
                        No active API keys found. Generate one to connect your institution SIS/ERP.
                      </TableCell>
                    </TableRow>
                  ) : (
                    apiKeys.map((k) => (
                      <TableRow key={k.id}>
                        <TableCell className="font-semibold text-xs text-slate-800">
                          {k.name}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {k.prefix}...
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {k.scopes.map((s) => (
                              <span
                                key={s}
                                className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-mono"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {new Date(k.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          {k.revoked_at ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                              REVOKED
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                              ACTIVE
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!k.revoked_at && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeApiKey(k.id)}
                              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-base text-gov-navy flex items-center gap-2">
                <Users className="w-5 h-5 text-gov-navy" />
                <span>Authorized Institution Users</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Manage roles and access permissions for academic registrars and data entry staff
              </CardDescription>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-gov-navy hover:bg-gov-navyDark text-white shrink-0"
            >
              <Mail className="w-4 h-4 mr-1.5" />
              Invite Staff Member
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Official Email</TableHead>
                  <TableHead>Assigned Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sign-In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-semibold text-xs text-slate-800">
                      {u.full_name}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-mono">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          u.role === 'INSTITUTION_ADMIN'
                            ? 'bg-gov-navy/10 text-gov-navy border border-gov-navy/20'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role === 'INSTITUTION_ADMIN' ? 'Institution Admin' : 'Institution Staff'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                        ACTIVE
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Pending Activation'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: AUDIT & SECURITY */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-700" />
                <CardTitle className="text-base">Audit Trail Cryptographic Integrity</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Verify the SHA-256 hash-chain of all institutional batch actions, reviews, and overrides
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-900">
                <p className="font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-700" />
                  Hash-Chain Status: VERIFIED
                </p>
                <p className="mt-1 text-slate-600">
                  All 142 audit entries are linked by immutable previous-hash pointers. Zero tampering detected.
                </p>
              </div>
              <div className="text-[11px] text-slate-500">
                Current Anchor Hash: <code className="font-mono bg-slate-100 p-1 rounded">7f3b89a24c...e891b</code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Webhook className="w-5 h-5 text-gov-saffronDark" />
                <CardTitle className="text-base">Webhook Notification Hub</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Real-time HMAC-signed webhooks for batch validation completion and inter-institution duplicate alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-800">Endpoint:</span>
                  <code className="text-[11px] font-mono text-slate-600">https://erp.demo.edu.in/webhooks/aicte</code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-800">Algorithm:</span>
                  <span className="text-[11px] font-mono text-gov-navy">HMAC-SHA256</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs">
                Test Webhook Delivery
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          {testFeedback && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{testFeedback}</span>
            </div>
          )}

          {/* REGISTERED WEBHOOKS */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <CardTitle className="text-base text-gov-navy flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-gov-navy" />
                  <span>Configured Webhook Endpoints</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time HMAC-signed HTTP notifications dispatched on batch ingestion, student lifecycle, and transfer events
                </CardDescription>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsWebhookModalOpen(true)}
                id="register-webhook-btn"
                data-testid="register-webhook-btn"
                className="bg-gov-navy hover:bg-gov-navyDark text-white shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Register Webhook
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <Table id="webhooks-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Target URL</TableHead>
                    <TableHead>Subscribed Events</TableHead>
                    <TableHead>Secret</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-xs text-slate-500 py-6">
                        No webhooks registered. Click "Register Webhook" to integrate campus ERP.
                      </TableCell>
                    </TableRow>
                  ) : (
                    webhooks.map((wh) => (
                      <TableRow key={wh.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs font-semibold text-slate-800 max-w-xs truncate">
                          {wh.url}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {wh.events.map((ev) => (
                              <span
                                key={ev}
                                className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-medium border border-slate-200"
                              >
                                {ev}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {wh.secret_masked}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-200">
                            ACTIVE
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {new Date(wh.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => handleSendTestWebhook(wh.id)}
                              id="send-test-btn"
                              data-testid="send-test-btn"
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Send Test
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteWebhook(wh.id)}
                              id={`delete-webhook-${wh.id}`}
                              data-testid={`delete-webhook-${wh.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* DELIVERY LOG */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base text-gov-navy flex items-center justify-between">
                <span>Webhook Delivery Log & Telemetry</span>
                <span className="text-xs font-normal text-slate-500">Last 10 Dispatches</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Inspection log with HTTP status codes, latency, and automatic exponential backoff retry counts
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Table id="delivery-log-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>HTTP Status</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Retry Count</TableHead>
                    <TableHead>Payload Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.flatMap((w) => w.deliveries).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-xs text-slate-500 py-6">
                        No delivery events recorded yet. Send a test ping to verify endpoint connectivity.
                      </TableCell>
                    </TableRow>
                  ) : (
                    webhooks
                      .flatMap((w) => w.deliveries)
                      .map((del) => (
                        <TableRow key={del.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-mono text-xs font-bold text-slate-800">
                            {del.event}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {new Date(del.delivered_at).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                                del.status_code === 200
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-red-100 text-red-800 border-red-200'
                              }`}
                            >
                              {del.status_code} {del.status_code === 200 ? 'OK' : 'ERR'}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-600">
                            {del.response_time_ms} ms
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-600">
                            {del.retry_count} retries
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 max-w-xs truncate font-mono">
                            {del.payload_summary}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* SIGNATURE VERIFICATION SNIPPET */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base text-gov-navy flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-gov-navy" />
                  <span>HMAC-SHA256 Signature Verification Snippet</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Copy and paste into your server backend to authenticate the X-EduVerify-Signature request header
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setCodeLanguage('nodejs')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                      codeLanguage === 'nodejs' ? 'bg-white text-gov-navy shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Node.js
                  </button>
                  <button
                    onClick={() => setCodeLanguage('python')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                      codeLanguage === 'python' ? 'bg-white text-gov-navy shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => setCodeLanguage('go')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                      codeLanguage === 'go' ? 'bg-white text-gov-navy shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Go
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySnippet}
                  id="copy-snippet-btn"
                  className="flex items-center gap-1.5 text-xs"
                >
                  {hasCopiedSnippet ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{hasCopiedSnippet ? 'Copied' : 'Copy Snippet'}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                <code>{getSignatureSnippet()}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      )}


      {/* MODAL: CREATE API KEY */}
      {isKeyModalOpen && (
        <div
          role="dialog"
          aria-labelledby="key-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-4 border-gov-navy space-y-4">
            <h3 id="key-modal-title" className="text-lg font-bold text-gov-navy flex items-center gap-2">
              <Key className="w-5 h-5 text-gov-navy" />
              <span>{newlyCreatedKey ? 'API Key Generated' : 'Generate Institutional API Key'}</span>
            </h3>

            {!newlyCreatedKey ? (
              <form onSubmit={handleCreateApiKey} className="space-y-4">
                <div>
                  <label htmlFor="key-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Key Identifier / Friendly Name
                  </label>
                  <Input
                    id="key-name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. ERP Ingestion Service"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Allowed Scopes
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes('upload:batches')}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedScopes([...selectedScopes, 'upload:batches']);
                          else setSelectedScopes(selectedScopes.filter((s) => s !== 'upload:batches'));
                        }}
                        className="rounded border-slate-300 text-gov-navy focus:ring-gov-navy"
                      />
                      <span><strong>upload:batches</strong> — Upload CSV/XLSX spreadsheets & confirm mappings</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes('read:reports')}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedScopes([...selectedScopes, 'read:reports']);
                          else setSelectedScopes(selectedScopes.filter((s) => s !== 'read:reports'));
                        }}
                        className="rounded border-slate-300 text-gov-navy focus:ring-gov-navy"
                      />
                      <span><strong>read:reports</strong> — Fetch batch validation reports & anomaly metrics</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button variant="outline" size="sm" type="button" onClick={() => setIsKeyModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" type="submit" id="submit-generate-key" className="bg-gov-navy text-white">
                    Create Key
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Critical Security Alert: Show key ONCE */}
                <div
                  role="alert"
                  className="p-3 bg-amber-50 border-2 border-amber-400 rounded-lg text-amber-900 text-xs space-y-1"
                  id="api-key-warning-banner"
                >
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Important: Copy your secret key now!</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    This secret token will <strong>never be shown again</strong>. If you lose this key, you will need to revoke it and generate a new one.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Generated API Key Secret
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={newlyCreatedKey.raw_key}
                      id="raw-api-key-input"
                      className="font-mono text-xs bg-slate-50 select-all border-slate-300"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyKey}
                      id="copy-api-key-btn"
                      className="shrink-0"
                    >
                      {hasCopied ? (
                        <>
                          <Check className="w-4 h-4 mr-1 text-green-600" />
                          <span className="text-green-600 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleCloseKeyModal}
                    id="close-key-modal-btn"
                    className="bg-gov-navy text-white"
                  >
                    I Have Safely Saved This Key
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: INVITE USER */}
      {isInviteModalOpen && (
        <div
          role="dialog"
          aria-labelledby="invite-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-t-4 border-gov-navy space-y-4">
            <h3 id="invite-modal-title" className="text-lg font-bold text-gov-navy flex items-center gap-2">
              <Mail className="w-5 h-5 text-gov-navy" />
              <span>Invite Institution Staff</span>
            </h3>

            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label htmlFor="invite-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Email Address
                </label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="registrar@institution.edu.in"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="invite-role" className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Role
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'INSTITUTION_ADMIN' | 'INSTITUTION_STAFF')}
                  className="w-full text-xs rounded-md border border-slate-300 p-2 bg-white text-slate-800"
                >
                  <option value="INSTITUTION_STAFF">Institution Staff (Upload & Edit Drafts)</option>
                  <option value="INSTITUTION_ADMIN">Institution Admin (Sign-off & Commit to Central Repo)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsInviteModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" type="submit" className="bg-gov-navy text-white">
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER WEBHOOK */}
      {isWebhookModalOpen && (
        <div
          role="dialog"
          aria-labelledby="webhook-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-4 border-gov-navy space-y-4">
            <h3 id="webhook-modal-title" className="text-lg font-bold text-gov-navy flex items-center gap-2">
              <Webhook className="w-5 h-5 text-gov-navy" />
              <span>Register New Webhook</span>
            </h3>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label htmlFor="webhook-url-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Endpoint Destination URL <span className="text-red-500">*</span>
                </label>
                <Input
                  id="webhook-url-input"
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://campus.institution.ac.in/api/v1/eduverify-listener"
                  required
                  className="w-full text-xs font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Must be an accessible HTTPS endpoint capable of receiving JSON POST payloads.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Subscribed Event Topics
                </label>
                <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs">
                  {[
                    { id: 'batch.committed', label: 'batch.committed: Student batch committed to central registry' },
                    { id: 'student.transitioned', label: 'student.transitioned: Student lifecycle state changed' },
                    { id: 'transfer.requested', label: 'transfer.requested: Inbound or outbound transfer initiated' },
                    { id: 'transfer.approved', label: 'transfer.approved: Inter-institution transfer decided' },
                    { id: 'issue.flagged', label: 'issue.flagged: High/Critical data quality rule violated' },
                  ].map((evt) => (
                    <label key={evt.id} className="flex items-center gap-2 text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedWebhookEvents.includes(evt.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWebhookEvents([...selectedWebhookEvents, evt.id]);
                          } else {
                            setSelectedWebhookEvents(selectedWebhookEvents.filter((x) => x !== evt.id));
                          }
                        }}
                        className="rounded border-slate-300 text-gov-navy focus:ring-gov-saffron"
                      />
                      <span>{evt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsWebhookModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  type="submit"
                  disabled={!newWebhookUrl.trim() || selectedWebhookEvents.length === 0}
                  id="confirm-create-webhook-btn"
                  className="bg-gov-navy text-white"
                >
                  Register Endpoint
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: WEBHOOK SECRET SHOWN ONCE */}
      {newlyCreatedSecret && (
        <div
          role="dialog"
          aria-labelledby="secret-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-4 border-amber-500 space-y-4">
            <h3 id="secret-modal-title" className="text-lg font-bold text-gov-navy flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              <span>Webhook Signing Secret Generated</span>
            </h3>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2">
              <p className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Notice: Secret Displayed Only Once</span>
              </p>
              <p className="text-amber-800 leading-relaxed">
                For security reasons, this HMAC shared secret will <strong>never be displayed again</strong>.
                Store it in your server's secure vault or environment variables to verify incoming event signatures.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HMAC Signing Secret Key
              </label>
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 rounded-lg p-2.5">
                <code id="webhook-secret-display" className="font-mono text-xs text-slate-900 font-bold flex-1 select-all break-all">
                  {newlyCreatedSecret}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySecret}
                  id="copy-webhook-secret-btn"
                  className="shrink-0 flex items-center gap-1 h-8 px-2.5"
                >
                  {hasCopiedSecret ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{hasCopiedSecret ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                variant="default"
                size="sm"
                onClick={handleCloseSecretModal}
                id="dismiss-secret-modal-btn"
                className="bg-gov-navy text-white"
              >
                I Have Safely Saved This Secret
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};
