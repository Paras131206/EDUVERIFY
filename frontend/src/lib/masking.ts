/**
 * Masking utilities to protect PII
 */

export function maskApaar(apaar: string | null | undefined): string {
  if (!apaar) return '—';
  const clean = apaar.trim();
  if (clean.length < 8) return '****';
  return `${clean.slice(0, 4)}****${clean.slice(-4)}`;
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return '****';
  const maskedLocal = local.length <= 2 ? `${local[0]}*` : `${local[0]}***${local.slice(-1)}`;
  return `${maskedLocal}@${domain}`;
}

export function maskMobile(mobile: string | null | undefined): string {
  if (!mobile) return '—';
  const clean = mobile.replace(/\D/g, '');
  if (clean.length < 5) return '******';
  return `${clean.slice(0, 2)}******${clean.slice(-2)}`;
}
