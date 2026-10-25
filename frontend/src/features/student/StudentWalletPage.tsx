import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, authFetch } from '@/lib/api';
import {
  StudentOwnRecord,
  StudentVersionHistoryItem,
  ConsentPurposeSetting,
  ConsentHistoryRecord,
  StudentCredentialItem,
  UserTypeConsentSetting,
} from './types';
import { getOrInitHolderKey } from '@/lib/holderKey';
import { StudentProfileCard } from './components/StudentProfileCard';
import { ConsentManagementCard } from './components/ConsentManagementCard';
import { CredentialsListCard } from './components/CredentialsListCard';
import { SharePresentationModal } from './components/SharePresentationModal';
import { CertificateModal } from './components/CertificateModal';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const StudentWalletPage: React.FC = () => {
  const [record, setRecord] = useState<StudentOwnRecord | null>(null);
  const [versions, setVersions] = useState<StudentVersionHistoryItem[]>([]);
  const [purposes, setPurposes] = useState<ConsentPurposeSetting[]>([]);
  const [userConsents, setUserConsents] = useState<UserTypeConsentSetting[]>([]);
  const [history, setHistory] = useState<ConsentHistoryRecord[]>([]);
  const [credentials, setCredentials] = useState<StudentCredentialItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // WebCrypto Holder Key State
  const [holderPrivateKey, setHolderPrivateKey] = useState<CryptoKey | null>(null);
  const [publicJwk, setPublicJwk] = useState<JsonWebKey | null>(null);
  const [isKeyRegistered, setIsKeyRegistered] = useState<boolean>(false);

  // Modals
  const [selectedCredForShare, setSelectedCredForShare] = useState<StudentCredentialItem | null>(null);
  const [selectedCredForCert, setSelectedCredForCert] = useState<StudentCredentialItem | null>(null);

  // Listen for online/offline browser events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize WebCrypto Holder Key (ECDSA P-256, extractable: false)
  const initHolderKey = useCallback(async () => {
    try {
      const keyResult = await getOrInitHolderKey(true);
      setHolderPrivateKey(keyResult.privateKey);
      setPublicJwk(keyResult.publicJwk);
      setIsKeyRegistered(true);
    } catch (err) {
      console.warn('Holder key initialization notice:', err);
    }
  }, []);

  // Fetch all student wallet data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [recRes, verRes, cstRes, credRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/v1/students/me`),
        authFetch(`${API_BASE_URL}/v1/students/me/versions`),
        authFetch(`${API_BASE_URL}/v1/students/me/consent`),
        authFetch(`${API_BASE_URL}/v1/credentials/me`),
      ]);

      if (!recRes.ok) {
        throw new Error(`Failed to load student record (${recRes.status})`);
      }

      const recData = await recRes.json();
      const verData = verRes.ok ? await verRes.json() : [];
      const cstData = cstRes.ok ? await cstRes.json() : { purposes: [], history: [], user_consents: [] };
      const credData = credRes.ok ? await credRes.json() : [];

      setRecord(recData);
      setVersions(verData);
      setPurposes(cstData.purposes || []);
      setUserConsents(cstData.user_consents || []);
      setHistory(cstData.history || []);
      setCredentials(credData);
    } catch (err: any) {
      console.error('Student wallet fetch error:', err);
      setError(err?.message || 'Failed to load student identity wallet.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    initHolderKey();
  }, [fetchData, initHolderKey]);

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="student-wallet-loading">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-red-200 shadow-xs space-y-4" data-testid="student-wallet-error">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Unable to Load Student Wallet</h3>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
        <Button size="sm" onClick={fetchData} className="bg-gov-navy text-white text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Request
        </Button>
      </div>
    );
  }

  if (!record) {
    return (
      <div data-testid="student-wallet-empty">
        <EmptyState
          title="No Student Record Found"
          description="Your APAAR identity key is not currently linked to an active institutional admission record."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="student-wallet-page">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs font-semibold flex items-center justify-between" data-testid="student-offline-banner">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-700" />
            <span>You are currently offline. Viewing locally cached verifiable credentials and custody keys.</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => setIsOffline(!navigator.onLine)} className="text-xs h-7">
            Check Connection
          </Button>
        </div>
      )}

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          data-testid="student-toast-msg"
          className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in"
        >
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gov-navy">
            Student Identity & Verifiable Credential Wallet
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically signed SD-JWT Verifiable Credentials bound to your hardware key and APAAR ID
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-gov-navy/10 text-gov-navy px-3 py-1 rounded-full border border-gov-navy/20">
            APAAR: {record.apaar_id}
          </span>
        </div>
      </div>


      {/* 2. Own Record Profile (Unmasked for Self per Req 1) */}
      <StudentProfileCard record={record} versions={versions} />

      {/* 3. Consent Management with Plain-Language Consequences (Req 1) */}
      <ConsentManagementCard
        purposes={purposes}
        userConsents={userConsents}
        history={history}
        onConsentUpdated={(msg) => {
          fetchData();
          if (msg) {
            setToastMessage(msg);
            setTimeout(() => setToastMessage(null), 6000);
          }
        }}
      />

      {/* 4. Credentials List & Selective Sharing Builder (Req 3) */}
      <CredentialsListCard
        credentials={credentials}
        onOpenShareModal={(cred) => setSelectedCredForShare(cred)}
        onDownloadCertificate={(cred) => setSelectedCredForCert(cred)}
      />

      {/* Selective Disclosure Presentation Builder Modal */}
      <SharePresentationModal
        credential={selectedCredForShare}
        userConsents={userConsents}
        isOpen={!!selectedCredForShare}
        onClose={() => setSelectedCredForShare(null)}
        holderPrivateKey={holderPrivateKey}
      />

      {/* Official A4 Certificate Modal Preview */}
      <CertificateModal
        credential={selectedCredForCert}
        isOpen={!!selectedCredForCert}
        onClose={() => setSelectedCredForCert(null)}
        student={record}
      />
    </div>
  );
};
