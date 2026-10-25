import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '@/lib/i18n';
import { translateText, translateTree, restoreTree } from '@/lib/translator';

describe('Site-Wide Language Translation System', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('translates known English phrases to Hindi', () => {
    expect(translateText('Institution Dashboard')).toBe('संस्थान डैशबोर्ड');
    expect(translateText('Upload Batch')).toBe('बैच अपलोड करें');
    expect(translateText('Data Quality Score')).toBe('डेटा गुणवत्ता स्कोर');
    expect(translateText('Student Registry')).toBe('छात्र रजिस्ट्री');
    expect(translateText('Action Required')).toBe('कार्रवाई आवश्यक');
  });

  it('preserves numbers, URLs, and emails without corruption', () => {
    expect(translateText('123456789012')).toBe('123456789012');
    expect(translateText('https://example.com/api')).toBe('https://example.com/api');
    expect(translateText('student@demo.local')).toBe('student@demo.local');
  });

  it('translates DOM tree into Hindi and restores cleanly to English', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <h1>Institution Dashboard</h1>
      <button>Upload Batch</button>
      <p>Data Quality Score</p>
      <span>Student Registry</span>
    `;
    document.body.appendChild(container);

    // Translate to Hindi
    translateTree(container);

    expect(container.querySelector('h1')?.textContent).toContain('संस्थान डैशबोर्ड');
    expect(container.querySelector('button')?.textContent).toContain('बैच अपलोड करें');
    expect(container.querySelector('p')?.textContent).toContain('डेटा गुणवत्ता स्कोर');
    expect(container.querySelector('span')?.textContent).toContain('छात्र रजिस्ट्री');

    // Restore to English
    restoreTree(container);

    expect(container.querySelector('h1')?.textContent).toContain('Institution Dashboard');
    expect(container.querySelector('button')?.textContent).toContain('Upload Batch');
    expect(container.querySelector('p')?.textContent).toContain('Data Quality Score');
    expect(container.querySelector('span')?.textContent).toContain('Student Registry');

    document.body.removeChild(container);
  });

  it('translates input placeholders in Hindi and restores to English', () => {
    const input = document.createElement('input');
    input.setAttribute('placeholder', 'Search');
    document.body.appendChild(input);

    translateTree(input);
    expect(input.getAttribute('placeholder')).toBe('खोजें');

    restoreTree(input);
    expect(input.getAttribute('placeholder')).toBe('Search');

    document.body.removeChild(input);
  });
});
