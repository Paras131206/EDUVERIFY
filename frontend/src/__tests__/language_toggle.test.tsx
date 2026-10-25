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

  it('translates elements from institution dashboard screenshots and cards', () => {
    // TopBar & Sidebar
    expect(translateText('Institution Admin')).toBe('संस्थान व्यवस्थापक');
    expect(translateText('INSTITUTION ADMIN NAVIGATION')).toBe('संस्थान व्यवस्थापक नेविगेशन');

    // KPI cards
    expect(translateText('Needs Review')).toBe('समीक्षा आवश्यक');
    expect(translateText('+6.0 pts improvement')).toBe('+6.0 अंक सुधार');
    expect(translateText('/ 520 seats')).toBe('/ 520 सीटें');
    expect(translateText('1 Pending Inbound (15d notice) • 1 Approved Outbound')).toBe('1 लंबित आवक (15-दिन नोटिस) • 1 स्वीकृत जावक');
    expect(translateText('4 Open Issues')).toBe('4 सक्रिय मुद्दे');
    expect(translateText('1 CRITICAL')).toBe('1 गंभीर');
    expect(translateText('3 HIGH')).toBe('3 उच्च');

    // Issues & Row numbers
    expect(translateText('• Row #22')).toBe('• पंक्ति #22');
    expect(translateText('• Row #14')).toBe('• पंक्ति #14');
    expect(translateText('• Row #35')).toBe('• पंक्ति #35');
    expect(translateText('• Row #50')).toBe('• पंक्ति #50');
    expect(translateText('APAAR ID format invalid / Excel truncated')).toBe('अपार आईडी प्रारूप अमान्य / एक्सेल ट्रंकेटेड');
    expect(translateText('Minor student enrolled without guardian consent record')).toBe('अभिभावक सहमति रिकॉर्ड के बिना नामांकित नाबालिग छात्र');
    expect(translateText('Lateral entry student enrolled directly into Year 1 invalid')).toBe('प्रथम वर्ष में सीधे नामांकित पार्श्व प्रवेश (Lateral Entry) छात्र अमान्य');
    expect(translateText('Department name whitespace and case normalisation')).toBe('विभाग के नाम में अतिरिक्त रिक्त स्थान और केस सामान्यीकरण');

    // Alerts & timestamps
    expect(translateText('1 New')).toBe('1 नई');
    expect(translateText('10 mins ago')).toBe('10 मिनट पहले');
    expect(translateText('2 hours ago')).toBe('2 घंटे पहले');
    expect(translateText('1 day ago')).toBe('1 दिन पहले');

    // Footer
    expect(translateText('Privacy Policy (DPDP 2023)')).toBe('गोपनीयता नीति (DPDP 2023)');
    expect(translateText('AICTE Guidelines')).toBe('एआईसीटीई दिशानिर्देश');
    expect(translateText('Built with')).toBe('के साथ निर्मित');
    expect(translateText('for Digital India')).toBe('डिजिटल इंडिया के लिए');
  });
});
