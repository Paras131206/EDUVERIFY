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

  it('translates batch upload wizard elements and dialogs to Hindi', () => {
    // Step 1: File Choose & Session
    expect(translateText('Official Student Ingestion Template')).toBe('आधिकारिक छात्र अंतर्ग्रहण टेम्पलेट');
    expect(translateText('Pre-formatted with 12-digit APAAR text validation, dropdown lists for categories & quotas, and field instructions.'))
      .toBe('12-अंकीय अपार पाठ सत्यापन, श्रेणियों और कोटे के लिए ड्रॉपडाउन सूची, और फ़ील्ड निर्देशों के साथ पूर्व-स्वरूपित।');
    expect(translateText('Download Template (.xlsx)')).toBe('टेम्पलेट डाउनलोड करें (.xlsx)');
    expect(translateText('Step 1: Choose File & Academic Session')).toBe('चरण 1: फ़ाइल चुनें एवं शैक्षणिक सत्र');
    expect(translateText('Select the target academic year and upload student admission records (CSV or XLSX up to 10 MB).'))
      .toBe('लक्षित शैक्षणिक वर्ष चुनें और छात्र प्रवेश रिकॉर्ड (CSV या XLSX 10 MB तक) अपलोड करें।');
    expect(translateText('2026-27 (Current Academic Year)')).toBe('2026-27 (वर्तमान शैक्षणिक वर्ष)');
    expect(translateText('Records will be validated against this year\'s AICTE approved intake.'))
      .toBe('रिकॉर्ड को इस वर्ष की एआईसीटीई स्वीकृत प्रवेश क्षमता के अनुसार सत्यापित किया जाएगा।');
    expect(translateText('REPLACES PREVIOUS BATCH (OPTIONAL)')).toBe('पिछला बैच प्रतिस्थापित करें (वैकल्पिक)');
    expect(translateText('-- None (New independent batch) --')).toBe('-- कोई नहीं (नया स्वतंत्र बैच) --');
    expect(translateText('If replacing an earlier revision, previous uncommitted records will be marked SUPERSEDED.'))
      .toBe('यदि किसी पूर्व संशोधन को प्रतिस्थापित कर रहे हैं, तो पिछले असंबद्ध रिकॉर्ड को \'अतिक्रमित\' (SUPERSEDED) चिह्नित किया जाएगा।');
    expect(translateText('SELECT OR DROP BATCH FILE *')).toBe('बैच फ़ाइल चुनें या यहाँ छोड़ें *');
    expect(translateText('Drag & drop batch file here, or click to browse')).toBe('बैच फ़ाइल यहाँ खींचें और छोड़ें, या ब्राउज़ करने के लिए क्लिक करें');
    expect(translateText('Supports .csv, .xlsx, .xls up to 10 MB per file')).toBe('.csv, .xlsx, .xls प्रति फ़ाइल 10 MB तक समर्थित');
    expect(translateText('Want to test real verification with errors?')).toBe('त्रुटियों के साथ वास्तविक सत्यापन का परीक्षण करना चाहते हैं?');
    expect(translateText('Use Demo File: batch_2_errors.xlsx')).toBe('डेमो फ़ाइल का उपयोग करें: batch_2_errors.xlsx');
    expect(translateText('11.6 KB · Ready for smart column mapping')).toBe('11.6 KB · स्मार्ट कॉलम मैपिंग के लिए तैयार');
    expect(translateText('Remove')).toBe('हटाएं');
    expect(translateText('Idempotency protection enabled (UUID key generated per upload)'))
      .toBe('आइडम्पोटेंसी सुरक्षा सक्षम (प्रति अपलोड UUID कुंजी उत्पन्न)');
    expect(translateText('Proceed to Column Mapping')).toBe('कॉलम मैपिंग पर आगे बढ़ें');

    // Step 2: Smart Column Mapping & Table Headers
    expect(translateText('Step 2: Smart Column Mapping')).toBe('चरण 2: स्मार्ट कॉलम मैपिंग');
    expect(translateText('SUGGESTED CANONICAL FIELD')).toBe('सुझाया गया विहित फ़ील्ड');
    expect(translateText('METHOD')).toBe('विधि');
    expect(translateText('SAMPLE VALUES PREVIEW (APAAR MASKED)')).toBe('नमूना मान पूर्वावलोकन (अपार मास्क किया गया)');
    expect(translateText('Mandatory Canonical Field')).toBe('अनिवार्य विहित फ़ील्ड');
    expect(translateText('Synonym')).toBe('समानार्थी');
    expect(translateText('Fuzzy Match')).toBe('फ़ज़ी मिलान');
    expect(translateText('Fuzzy सटीक मिलान')).toBe('फ़ज़ी मिलान');
    expect(translateText('Pattern / Regex')).toBe('पैटर्न / रेगेक्स');
    expect(translateText('Saved Profile')).toBe('सहेजी गई प्रोफ़ाइल');
    expect(translateText('Institution Student / Roll / PRN *')).toBe('संस्थान छात्र / रोल / पीआरएन *');
    expect(translateText('Institution छात्र / रोल / पीआरएन *')).toBe('संस्थान छात्र / रोल / पीआरएन *');
    expect(translateText('Full Name *')).toBe('पूरा नाम *');
    expect(translateText('Department Name')).toBe('विभाग का नाम');
    expect(translateText('Quota (NONE/NRI/OCI/FN/PIO/CIWG) *')).toBe('कोटा (NONE/NRI/OCI/FN/PIO/CIWG) *');
    expect(translateText('Nationality (ISO-2 Code) *')).toBe('राष्ट्रीयता (ISO-2 कोड) *');
    expect(translateText('Foreign National Status *')).toBe('विदेशी नागरिक स्थिति *');
    expect(translateText('Foreign National स्थिति')).toBe('विदेशी नागरिक स्थिति');
    expect(translateText('Consent Status (GRANTED/REFUSED) *')).toBe('सहमति स्थिति (स्वीकृत/अस्वीकृत) *');
    expect(translateText('Consent स्थिति')).toBe('सहमति स्थिति');
    expect(translateText('Target Academic Year: 2026-27')).toBe('लक्षित शैक्षणिक वर्ष: 2026-27');
    expect(translateText('Target शैक्षणिक वर्ष: 2026-27')).toBe('लक्षित शैक्षणिक वर्ष: 2026-27');
    expect(translateText('File: batch_2_errors.xlsx')).toBe('फ़ाइल: batch_2_errors.xlsx');
    expect(translateText('Batch ID: batch-123')).toBe('बैच आईडी: batch-123');
    expect(translateText('22 / 22 Required Fields Mapped')).toBe('22 / 22 आवश्यक फ़ील्ड मैप किए गए');
    expect(translateText('6 columns identified')).toBe('6 कॉलम पहचाने गए');
    expect(translateText('Commit Batch to Central Repository')).toBe('बैच को केंद्रीय भंडार में कमिट करें');

    // Step 3: Real-Time Engine Validation
    expect(translateText('Step 3: Real-Time Engine Validation')).toBe('चरण 3: वास्तविक समय इंजन सत्यापन');
    expect(translateText('Live SSE EventStream Connected')).toBe('लाइव SSE इवेंटस्ट्रीम कनेक्टेड');
    expect(translateText('MULTI-STAGE INGESTION PIPELINE')).toBe('बहु-चरणीय अंतर्ग्रहण पाइपलाइन');
    expect(translateText('PASSED')).toBe('सफल');
    expect(translateText('Validation Complete. Quality score and issues ready for review.'))
      .toBe('सत्यापन पूर्ण हुआ। गुणवत्ता स्कोर एवं मुद्दे समीक्षा के लिए तैयार हैं।');
    expect(translateText('सत्यापन पूर्ण हुआ. Quality स्कोर and issues ready for review.'))
      .toBe('सत्यापन पूर्ण हुआ। गुणवत्ता स्कोर एवं मुद्दे समीक्षा के लिए तैयार हैं।');
    expect(translateText('View Result Summary')).toBe('परिणाम सारांश देखें');
    expect(translateText('देखें Result Summary')).toBe('परिणाम सारांश देखें');
    expect(translateText('Streaming live telemetry from AICTE Verification Engine'))
      .toBe('एआईसीटीई सत्यापन इंजन से लाइव टेलीमेट्री स्ट्रीमिंग जारी');
  });

  it('translates Settings tab elements from user screenshot to Hindi', () => {
    // Header & Subtitle
    expect(translateText('Institution Administration & Settings')).toBe('संस्थान प्रशासन एवं सेटिंग्स');
    expect(translateText('Institution Administration & सेटिंग्स')).toBe('संस्थान प्रशासन एवं सेटिंग्स');
    expect(translateText('Self-service institutional API keys, team role assignments, webhooks, and security compliance'))
      .toBe('स्वयं-सेवा संस्थागत एपीआई कुंजियां, टीम भूमिका आवंटन, वेबहुक, और सुरक्षा अनुपालन');
    expect(translateText('Self-service institutional एपीआई कुंजियां, team role assignments, webhooks, and security compliance'))
      .toBe('स्वयं-सेवा संस्थागत एपीआई कुंजियां, टीम भूमिका आवंटन, वेबहुक, और सुरक्षा अनुपालन');

    // Subtabs
    expect(translateText('API Keys')).toBe('एपीआई कुंजियां');
    expect(translateText('Webhooks')).toBe('वेबहुक्स');
    expect(translateText('User Management')).toBe('उपयोगकर्ता प्रबंधन');
    expect(translateText('Audit & Compliance')).toBe('ऑडिट एवं अनुपालन');

    // API Keys Card
    expect(translateText('Institutional API Keys')).toBe('संस्थागत एपीआई कुंजियां');
    expect(translateText('Institutional एपीआई कुंजियां')).toBe('संस्थागत एपीआई कुंजियां');
    expect(translateText('Provision high-throughput API credentials for programmatic CSV/JSON ingestion from your campus ERP'))
      .toBe('अपने कैंपस ERP से प्रोग्रामेटिक CSV/JSON अंतर्ग्रहण हेतु उच्च-थ्रूपुट एपीआई क्रेडेंशियल्स प्राप्त करें');
    expect(translateText('Provision उच्च-throughput API credentials for programmatic CSV/JSON ingestion from your campus ERP'))
      .toBe('अपने कैंपस ERP से प्रोग्रामेटिक CSV/JSON अंतर्ग्रहण हेतु उच्च-थ्रूपुट एपीआई क्रेडेंशियल्स प्राप्त करें');
    expect(translateText('+ Generate New Key')).toBe('+ नई कुंजी बनाएं');
    expect(translateText('+ Generate नई Key')).toBe('+ नई कुंजी बनाएं');
    expect(translateText('Generate New Key')).toBe('नई कुंजी बनाएं');

    // Table Headers & Actions
    expect(translateText('KEY NAME')).toBe('कुंजी का नाम');
    expect(translateText('PREFIX')).toBe('उपसर्ग (Prefix)');
    expect(translateText('SCOPES')).toBe('अनुमतियां (Scopes)');
    expect(translateText('CREATED')).toBe('सृजन तिथि');
    expect(translateText('LAST USED')).toBe('अंतिम उपयोग');
    expect(translateText('Status')).toBe('स्थिति');
    expect(translateText('Actions')).toBe('कार्रवाई');
    expect(translateText('Revoke')).toBe('रद्द करें');
  });

  it('translates Reports & Statutory Audits tab elements from user screenshot to Hindi', () => {
    // Header & Subtitle
    expect(translateText('Statutory Reports & Quality Audits')).toBe('सांविधिक रिपोर्ट एवं गुणवत्ता ऑडिट');
    expect(translateText('प्रतिवेदन एवं सांविधिक लेखापरीक्षा · Generate AICTE policy reports, NBA/NAAC accreditation summaries, intake monitoring, and reservation compliance packages.'))
      .toBe('प्रतिवेदन एवं सांविधिक लेखापरीक्षा · एआईसीटीई नीति रिपोर्ट, NBA/NAAC प्रत्यायन सारांश, प्रवेश निगरानी और आरक्षण अनुपालन पैकेज तैयार करें।');
    expect(translateText('Generate Authority Access Link')).toBe('प्राधिकरण एक्सेस लिंक उत्पन्न करें');
    expect(translateText('Refresh')).toBe('ताज़ा करें');

    // Preset Cards
    expect(translateText('Annual Policy Report')).toBe('वार्षिक नीति रिपोर्ट');
    expect(translateText('National intake ceilings, excess enrollments, and state seat utilization.'))
      .toBe('राष्ट्रीय प्रवेश सीमाएं, अतिरिक्त नामांकन, और राज्य सीट उपयोग।');
    expect(translateText('National intake ceilings, अतिरिक्त enrollments, and state seat utilization.'))
      .toBe('राष्ट्रीय प्रवेश सीमाएं, अतिरिक्त नामांकन, और राज्य सीट उपयोग।');

    expect(translateText('Accreditation Audit')).toBe('प्रत्यायन ऑडिट');
    expect(translateText('NBA/NAAC multi-tab student intake, faculty ratios, and referential integrity.'))
      .toBe('NBA/NAAC बहु-टैब छात्र प्रवेश, संकाय अनुपात, और संदर्भात्मक सत्यनिष्ठा।');
    expect(translateText('NBA/NAAC multi-tab विद्यार्थी intake, faculty ratios, and referential integrity.'))
      .toBe('NBA/NAAC बहु-टैब छात्र प्रवेश, संकाय अनुपात, और संदर्भात्मक सत्यनिष्ठा।');

    expect(translateText('Seat Monitoring')).toBe('सीट निगरानी');
    expect(translateText('Supernumerary schemes (TFW/PMSSS/JK), NRI/OCI/FN shares by state.'))
      .toBe('अतिरिक्त सीटें (सुपरन्यूमरेरी योजनाएं - TFW/PMSSS/JK), राज्यवार NRI/OCI/FN हिस्सेदारी।');
    expect(translateText('अतिरिक्त सीटें (Supernumerary) schemes (TFW/PMSSS/JK), NRI/OCI/FN shares by state.'))
      .toBe('अतिरिक्त सीटें (सुपरन्यूमरेरी योजनाएं - TFW/PMSSS/JK), राज्यवार NRI/OCI/FN हिस्सेदारी।');

    expect(translateText('Reservation Compliance')).toBe('आरक्षण अनुपालन');
    expect(translateText('Statutory GEN/OBC/SC/ST/EWS breakdown and quota audit certificate.'))
      .toBe('सांविधिक GEN/अन्य पिछड़ा वर्ग (OBC)/SC/ST/आर्थिक रूप से कमजोर वर्ग (EWS) विवरण और कोटा ऑडिट प्रमाणपत्र।');
    expect(translateText('Statutory GEN/अन्य पिछड़ा वर्ग (OBC)/SC/ST/आर्थिक रूप से कमजोर वर्ग (EWS) breakdown and कोटा audit certificate.'))
      .toBe('सांविधिक GEN/अन्य पिछड़ा वर्ग (OBC)/SC/ST/आर्थिक रूप से कमजोर वर्ग (EWS) विवरण और कोटा ऑडिट प्रमाणपत्र।');

    // Custom Report Builder Form
    expect(translateText('Custom Report Builder')).toBe('कस्टम रिपोर्ट बिल्डर');
    expect(translateText('Configure report scope, institutional filters, target demographic dimensions, and output format.'))
      .toBe('रिपोर्ट दायरा, संस्थागत फ़िल्टर, लक्षित जनसांख्यिकीय आयाम और आउटपुट प्रारूप कॉन्फ़िगर करें।');
    expect(translateText('1. REPORT TYPE')).toBe('1. रिपोर्ट का प्रकार');
    expect(translateText('POLICY — National & State Intake Policy Report')).toBe('नीति — राष्ट्रीय एवं राज्य प्रवेश नीति रिपोर्ट');
    expect(translateText('2. Academic Year')).toBe('2. शैक्षणिक वर्ष');
    expect(translateText('2026-27 (Current Active Batch)')).toBe('2026-27 (वर्तमान सक्रिय बैच)');
    expect(translateText('2026-27 (Current सत्रिम Batch)')).toBe('2026-27 (वर्तमान सक्रिय बैच)');
    expect(translateText('3. STATE SCOPE')).toBe('3. राज्य दायरा (Scope)');
    expect(translateText('All India (National Aggregation)')).toBe('अखिल भारतीय (राष्ट्रीय संकलन)');
    expect(translateText('सभी India (National Aggregation)')).toBe('अखिल भारतीय (राष्ट्रीय संकलन)');
    expect(translateText('4. PROGRAM DISCIPLINE')).toBe('4. कार्यक्रम अनुशासन (Discipline)');
    expect(translateText('All Disciplines & Programs')).toBe('सभी विषय एवं कार्यक्रम');
    expect(translateText('सभी Disciplines & Programs')).toBe('सभी विषय एवं कार्यक्रम');
    expect(translateText('5. RESERVATION CATEGORY')).toBe('5. आरक्षण श्रेणी');
    expect(translateText('5. RESERVATION श्रेणी')).toBe('5. आरक्षण श्रेणी');
    expect(translateText('All Social Categories')).toBe('सभी सामाजिक श्रेणियां');
    expect(translateText('सभी Social Categories')).toBe('सभी सामाजिक श्रेणियां');
    expect(translateText('6. OUTPUT FORMAT')).toBe('6. आउटपुट प्रारूप');
    expect(translateText('PDF (Print A4)')).toBe('PDF (प्रिंट A4)');
    expect(translateText('XLSX (Excel)')).toBe('XLSX (एक्सेल)');
    expect(translateText('* Reports are compiled live from the central verified repository and rendered using WeasyPrint print styles.'))
      .toBe('* रिपोर्ट केंद्रीय सत्यापित भंडार से लाइव संकलित की जाती हैं और WeasyPrint प्रिंट शैलियों का उपयोग करके प्रस्तुत की जाती हैं।');
    expect(translateText('Generate PDF Report')).toBe('पीडीएफ रिपोर्ट तैयार करें');

    // Generated Reports History
    expect(translateText('Generated Reports History')).toBe('तैयार की गई रिपोर्ट का इतिहास');
    expect(translateText('Audit trail of compiled policy documents, accreditation tables, and statutory downloads.'))
      .toBe('संकलित नीति दस्तावेजों, प्रत्यायन तालिकाओं और सांविधिक डाउनलोड का ऑडिट ट्रेल।');
    expect(translateText('Search reports...')).toBe('रिपोर्ट खोजें...');
    expect(translateText('खोजें reports...')).toBe('रिपोर्ट खोजें...');
    expect(translateText('All Types')).toBe('सभी प्रकार');
    expect(translateText('सभी Types')).toBe('सभी प्रकार');
    expect(translateText('All Formats')).toBe('सभी प्रारूप');
    expect(translateText('सभी Formats')).toBe('सभी प्रारूप');
    expect(translateText('REPORT ID')).toBe('रिपोर्ट आईडी');
    expect(translateText('TITLE & SCOPE')).toBe('शीर्षक एवं दायरा');
    expect(translateText('TYPE')).toBe('प्रकार');
    expect(translateText('FORMAT')).toBe('प्रारूप');
    expect(translateText('GENERATED AT')).toBe('तैयार करने का समय');
    expect(translateText('SIZE')).toBe('आकार');
  });

  it('translates Verifier tab elements from user screenshot to Hindi', () => {
    // Header & Badges
    expect(translateText('PUBLIC VERIFIER')).toBe('सार्वजनिक सत्यापनकर्ता');
    expect(translateText('Authorized Credential Verification Portal')).toBe('अधिकृत प्रमाणपत्र सत्यापन पोर्टल');
    expect(translateText('Real-time verification of SD-JWT credentials against AICTE trust roots and national status lists'))
      .toBe('एआईसीटीई ट्रस्ट रूट्स और राष्ट्रीय स्थिति सूचियों के विरुद्ध SD-JWT क्रेडेंशियल्स का रीयल-टाइम सत्यापन');
    expect(translateText('Real-time verification of SD-JWT credentials against AICTE trust roots and national स्थिति lists'))
      .toBe('एआईसीटीई ट्रस्ट रूट्स और राष्ट्रीय स्थिति सूचियों के विरुद्ध SD-JWT क्रेडेंशियल्स का रीयल-टाइम सत्यापन');
    expect(translateText('AICTE Trust Root Connected')).toBe('एआईसीटीई ट्रस्ट रूट कनेक्टेड');

    // Input Card
    expect(translateText('Verify Student Presentation')).toBe('विद्यार्थी प्रस्तुति सत्यापित करें');
    expect(translateText('Verify विद्यार्थी Presentation')).toBe('विद्यार्थी प्रस्तुति सत्यापित करें');
    expect(translateText('Accepts raw SD-JWT presentation strings or full verification URLs generated from the Student Wallet'))
      .toBe('छात्र वॉलेट से उत्पन्न रॉ SD-JWT प्रस्तुति स्ट्रिंग्स या पूर्ण सत्यापन URL स्वीकार करता है');
    expect(translateText('Accepts raw SD-JWT presentation strings or full verification URLs generated from the छात्र वॉलेट'))
      .toBe('छात्र वॉलेट से उत्पन्न रॉ SD-JWT प्रस्तुति स्ट्रिंग्स या पूर्ण सत्यापन URL स्वीकार करता है');
    expect(translateText('PRESENTATION TOKEN / SHARE LINK:')).toBe('प्रस्तुति टोकन / साझाकरण लिंक:');
    expect(translateText('Presentation Token / Share Link:')).toBe('प्रस्तुति टोकन / साझाकरण लिंक:');
    expect(translateText('Verify Credential Presentation')).toBe('प्रमाणपत्र प्रस्तुति सत्यापित करें');
    expect(translateText('प्रमाणपत्र सत्यापित करें Presentation')).toBe('प्रमाणपत्र प्रस्तुति सत्यापित करें');
  });
});

