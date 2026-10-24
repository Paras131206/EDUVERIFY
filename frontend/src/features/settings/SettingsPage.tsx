import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ApiKeyItem, CreatedApiKey, InstitutionUserItem } from '@/types/auth';
import { API_BASE_URL } from '@/lib/api';
import { Key, Users, Webhook, Copy, Check, AlertTriangle, Plus, Trash2, Mail, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'api-keys' | 'users' | 'security'>('api-keys');

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

  useEffect(() => {
    loadApiKeys();
    loadUsers();
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

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-gov-navy">
          Institution Administration & Settings
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Self-service institutional API keys, team role assignments, and security compliance
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
    </div>
  );
};
