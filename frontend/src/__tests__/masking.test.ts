import { describe, it, expect } from 'vitest';
import { maskApaar, maskEmail, maskMobile } from '@/lib/masking';

describe('Masking Utilities', () => {
  it('masks 12-digit APAAR ID leaving first 4 and last 4 digits visible', () => {
    expect(maskApaar('123456789012')).toBe('1234****9012');
  });

  it('handles null/undefined APAAR gracefully', () => {
    expect(maskApaar(null)).toBe('—');
    expect(maskApaar(undefined)).toBe('—');
  });

  it('masks emails preserving local first/last characters and domain', () => {
    expect(maskEmail('student@example.com')).toBe('s***t@example.com');
  });

  it('masks mobile numbers keeping first 2 and last 2 digits', () => {
    expect(maskMobile('9876543210')).toBe('98******10');
  });
});
