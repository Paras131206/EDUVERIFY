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

  it('translates all elements from Institution Dashboard screenshots (Screenshots 1, 2, 3)', () => {
    // Toolbar buttons
    expect(translateText('Reset Stats to Zero')).toBe('आंकड़े शून्य पर रीसेट करें');
    expect(translateText('Reset stats to zero to simulate fresh state'))
      .toBe('ताज़ा स्थिति का अनुकरण करने के लिए आंकड़े शून्य पर रीसेट करें');
    expect(translateText('Authority File Link')).toBe('प्राधिकरण फ़ाइल लिंक');
    expect(translateText('Authority फ़ाइल Link')).toBe('प्राधिकरण फ़ाइल लिंक');
    expect(translateText('Load Demo Document')).toBe('डेमो दस्तावेज़ लोड करें');

    // Deduplication Engine Banner (Screenshot 1)
    expect(translateText('Institution-Wide & Cross-Institution Deduplication Engine'))
      .toBe('संस्थान-व्यापी एवं अंतर-संस्थान डुप्लिकेट पहचान इंजन');
    expect(translateText('Rules V007 · V008 · V010 · V011')).toBe('नियम V007 · V008 · V010 · V011');
    expect(translateText('Rules V001 · V002')).toBe('नियम V001 · V002');
    expect(translateText('Biometric Soundex & Jaro-Winkler phonetic algorithms continuously check duplicates across all batches in this institution as well as cross-institutional dual-enrolments in the National AICTE Central Repository.'))
      .toBe('बायोमेट्रिक साउंडेक्स और जेरो-विंकलर ध्वन्यात्मक एल्गोरिदम इस संस्थान के सभी बैचों के साथ-साथ राष्ट्रीय एआईसीटीई केंद्रीय भंडार में अंतर-संस्थागत दोहरे नामांकनों की निरंतर जांच करते हैं।');
    expect(translateText('Biometric Soundex & Jaro-Winkler phonetic algorithms continuously check duplicates across सभी batches in this institution as well as cross-institutional dual-enrolments in the National AICTE Central Repository.'))
      .toBe('बायोमेट्रिक साउंडेक्स और जेरो-विंकलर ध्वन्यात्मक एल्गोरिदम इस संस्थान के सभी बैचों के साथ-साथ राष्ट्रीय एआईसीटीई केंद्रीय भंडार में अंतर-संस्थागत दोहरे नामांकनों की निरंतर जांच करते हैं।');
    expect(translateText('Intra-Batch Duplicates: None')).toBe('अंतः-बैच डुप्लिकेट: कोई नहीं');
    expect(translateText('Intra-Batch Duplicates: None Detected')).toBe('अंतः-बैच डुप्लिकेट: कोई नहीं मिला');
    expect(translateText('Cross-Institution Matches: 1 Flagged')).toBe('अंतर-संस्थान मिलान: 1 ध्वजांकित');
    expect(translateText('Inspect Deduplication Resolution Desk')).toBe('डुप्लिकेट समाधान डेस्क का निरीक्षण करें');
    expect(translateText('निरीक्षण करें Deduplication Resolution Desk')).toBe('डुप्लिकेट समाधान डेस्क का निरीक्षण करें');

    // Empty / Reset State Banner & Cards (Screenshot 2)
    expect(translateText('No Student Data Uploaded Yet')).toBe('अभी तक कोई छात्र डेटा अपलोड नहीं हुआ');
    expect(translateText('No विद्यार्थी Data Uploaded Yet')).toBe('अभी तक कोई छात्र डेटा अपलोड नहीं हुआ');
    expect(translateText("No student admission batches have been ingested yet. All enrolment statistics, data quality scores, and statutory validation checks are currently set to zero. Upload your institution's batch file or load the demo document to populate real-time analytics."))
      .toBe('अभी तक कोई छात्र प्रवेश बैच अंतर्ग्रहीत नहीं किया गया है। सभी नामांकन आंकड़े, डेटा गुणवत्ता स्कोर और वैधानिक सत्यापन वर्तमान में शून्य पर सेट हैं। वास्तविक समय के विश्लेषण देखने के लिए अपने संस्थान की बैच फ़ाइल अपलोड करें या डेमो दस्तावेज़ लोड करें।');
    expect(translateText('Awaiting batch data upload')).toBe('बैच डेटा अपलोड की प्रतीक्षा है');
    expect(translateText('No student records uploaded')).toBe('कोई छात्र रिकॉर्ड अपलोड नहीं हुआ');
    expect(translateText('No विद्यार्थी रिकॉर्ड uploaded')).toBe('कोई छात्र रिकॉर्ड अपलोड नहीं हुआ');
    expect(translateText('No Issues Pending')).toBe('कोई मुद्दा लंबित नहीं');
    expect(translateText('No Issues लंबित')).toBe('कोई मुद्दा लंबित नहीं');

    // Empty Chart & Card Placeholders (Screenshot 3)
    expect(translateText('No Historical Batch Data')).toBe('कोई ऐतिहासिक बैच डेटा नहीं');
    expect(translateText('Batch-by-batch data quality progression will plot here automatically once batches are uploaded and validated.'))
      .toBe('बैच अपलोड और सत्यापित होने के बाद बैच-वार डेटा गुणवत्ता प्रगति यहाँ स्वतः प्रदर्शित होगी।');
    expect(translateText('No Enrolment Records')).toBe('कोई नामांकन रिकॉर्ड नहीं');
    expect(translateText('No Enrolment रिकॉर्ड')).toBe('कोई नामांकन रिकॉर्ड नहीं');
    expect(translateText('Intake ceiling comparisons per program will populate once student admission batches are uploaded.'))
      .toBe('छात्र प्रवेश बैच अपलोड होने के बाद कार्यक्रम-वार प्रवेश सीमा तुलना यहाँ प्रदर्शित होगी।');
    expect(translateText('No Open Issues')).toBe('कोई सक्रिय मुद्दा नहीं');
    expect(translateText('No सक्रिय मुद्दे')).toBe('कोई सक्रिय मुद्दा नहीं');
    expect(translateText('No data uploaded yet. Ingest student admission records to run statutory validation checks.'))
      .toBe('अभी तक कोई डेटा अपलोड नहीं हुआ। वैधानिक सत्यापन जांच चलाने के लिए छात्र प्रवेश रिकॉर्ड अंतर्ग्रहीत करें।');
    expect(translateText('No Notifications')).toBe('कोई सूचना नहीं');
    expect(translateText('Regulatory alerts, deadline notices, and ingestion events will appear here once active.'))
      .toBe('सक्रिय होने पर नियामक अलर्ट, अंतिम तिथि नोटिस और अंतर्ग्रहण घटनाएं यहाँ दिखाई देंगी।');
  });

  it('translates Step 4 Validation Summary screenshot elements (Screenshots 4, 5)', () => {
    // Subtitle dynamic sentence
    expect(translateText('AICTE Demographics and Rule Catalog v0.1.0 executed across 65 candidate records.'))
      .toBe('एआईसीटीई जनसांख्यिकी एवं नियम कैटलॉग v0.1.0 को 65 उम्मीदवार रिकॉर्ड पर निष्पादित किया गया।');
    expect(translateText('AICTE Demographics and Rule Catalog v0.1.0 executed across 65 candidate रिकॉर्ड.'))
      .toBe('एआईसीटीई जनसांख्यिकी एवं नियम कैटलॉग v0.1.0 को 65 उम्मीदवार रिकॉर्ड पर निष्पादित किया गया।');

    // Schema Drift alert banner
    expect(translateText("Header 'PRN' has shifted from canonical 'institution_student_id' (COLUMN_RENAMED). Column mapping profile updated to maintain backward compatibility."))
      .toBe("शीर्षक 'PRN' प्रामाणिक 'institution_student_id' (COLUMN_RENAMED) से परिवर्तित हुआ है। पश्चगामी संगतता बनाए रखने के लिए कॉलम मैपिंग प्रोफ़ाइल अद्यतन की गई।");
    expect(translateText("' (COLUMN_RENAMED). Column mapping profile updated to maintain backward compatibility."))
      .toBe("' (COLUMN_RENAMED) से बदला है। पश्चगामी संगतता बनाए रखने के लिए कॉलम मैपिंग प्रोफ़ाइल अद्यतन की गई।");

    // Review Bucket Queue
    expect(translateText('Auto Flag')).toBe('स्वतः चिह्नित');

    // Next Step issue resolution callout
    expect(translateText('12 error(s) and 5 warning(s) require review. You can accept automated suggestions, edit cells with inline rationale, or dismiss items.'))
      .toBe('12 त्रुटि(यां) और 5 चेतावनी(यां) समीक्षा योग्य हैं। आप स्वचालित सुझाव स्वीकार कर सकते हैं, इनलाइन औचित्य के साथ सेल संपादित कर सकते हैं, या खारिज कर सकते हैं।');
    expect(translateText('12 त्रुटि(s) and 5 चेतावनी(s) require review. You can accept automated suggestions, संपादित करें cells with inline rationale, or dismiss items.'))
      .toBe('12 त्रुटि(यां) और 5 चेतावनी(यां) समीक्षा योग्य हैं। आप स्वचालित सुझाव स्वीकार कर सकते हैं, इनलाइन औचित्य के साथ सेल संपादित कर सकते हैं, या खारिज कर सकते हैं।');
    expect(translateText(' error(s) and ')).toBe(' त्रुटि(यां) और ');
    expect(translateText(' warning(s) require review. You can accept automated suggestions, edit cells with inline rationale, or dismiss items.'))
      .toBe(' चेतावनी(यां) समीक्षा योग्य हैं। आप स्वचालित सुझाव स्वीकार कर सकते हैं, इनलाइन औचित्य के साथ सेल संपादित कर सकते हैं, या खारिज कर सकते हैं।');
  });

  it('translates Batch Registry, Review Workspace, Issue Queue, and Issue Drawer elements (Screenshots 1-4)', () => {
    // Screenshot 1: Batch Registry
    expect(translateText('Institution Batch Registry')).toBe('संस्थान बैच रजिस्ट्री');
    expect(translateText('Institution बैच रजिस्ट्री')).toBe('संस्थान बैच रजिस्ट्री');
    expect(translateText('Complete audit trail of all student admission uploads, data quality improvements, and AICTE commitment status.'))
      .toBe('सभी छात्र प्रवेश अपलोड, डेटा गुणवत्ता सुधार और एआईसीटीई प्रतिबद्धता स्थिति का पूर्ण ऑडिट ट्रेल।');
    expect(translateText('Complete audit trail of सभी विद्यार्थी admission uploads, data quality improvements, and AICTE commitment स्थिति.'))
      .toBe('सभी छात्र प्रवेश अपलोड, डेटा गुणवत्ता सुधार और एआईसीटीई प्रतिबद्धता स्थिति का पूर्ण ऑडिट ट्रेल।');
    expect(translateText('Upload New Batch')).toBe('नया बैच अपलोड करें');
    expect(translateText('Upload नई Batch')).toBe('नया बैच अपलोड करें');
    expect(translateText('Open Batch in Progress (Conflict Prevention)')).toBe('खुला बैच प्रगति पर है (विवाद रोकथाम)');
    expect(translateText('OPEN BATCH IN PROGRESS (CONFLICT PREVENTION)')).toBe('खुला बैच प्रगति पर है (विवाद रोकथाम)');
    expect(translateText('Batch batch-demo-2 (batch_2_errors.xlsx) for Academic Year 2026-27 is currently IN_REVIEW. New uploads will require setting this batch as superseded.'))
      .toBe('बैच batch-demo-2 (batch_2_errors.xlsx) शैक्षणिक वर्ष 2026-27 के लिए वर्तमान में समीक्षाधीन है। नए अपलोड के लिए इस बैच को अतिक्रमित के रूप में सेट करना होगा।');
    expect(translateText('Batch batch-demo-2 (batch_2_errors.xlsx) for शैक्षणिक वर्ष 2026-27 is currently IN_REVIEW. नई uploads will require setting this batch as superseded.'))
      .toBe('बैच batch-demo-2 (batch_2_errors.xlsx) शैक्षणिक वर्ष 2026-27 के लिए वर्तमान में समीक्षाधीन है। नए अपलोड के लिए इस बैच को अतिक्रमित के रूप में सेट करना होगा।');
    expect(translateText('Go to Open Batch Review')).toBe('खुले बैच की समीक्षा पर जाएं');
    expect(translateText('खुले बैच पर जाएं Review')).toBe('खुले बैच की समीक्षा पर जाएं');
    expect(translateText('Uploaded Student Batches')).toBe('अपलोड किए गए छात्र बैच');
    expect(translateText('UPLOADED STUDENT BATCHES')).toBe('अपलोड किए गए छात्र बैच');
    expect(translateText('UPLOADED विद्यार्थी BATCHES')).toBe('अपलोड किए गए छात्र बैच');
    expect(translateText('0 batch record(s)')).toBe('0 बैच रिकॉर्ड');
    expect(translateText('3 batch record(s)')).toBe('3 बैच रिकॉर्ड');
    expect(translateText('Quality Score')).toBe('गुणवत्ता स्कोर');
    expect(translateText('QUALITY SCORE')).toBe('गुणवत्ता स्कोर');
    expect(translateText('QUALITY स्कोर')).toBe('गुणवत्ता स्कोर');
    expect(translateText('Records Breakdown')).toBe('रिकॉर्ड विवरण');
    expect(translateText('RECORDS BREAKDOWN')).toBe('रिकॉर्ड विवरण');
    expect(translateText('रिकॉर्ड BREAKDOWN')).toBe('रिकॉर्ड विवरण');
    expect(translateText('COMMITTED')).toBe('कमिटेड');
    expect(translateText('IN REVIEW')).toBe('समीक्षाधीन');
    expect(translateText('SUPERSEDED')).toBe('अतिक्रमित');
    expect(translateText('VALIDATING')).toBe('सत्यापन जारी');
    expect(translateText('MAPPING')).toBe('मैपिंग जारी');
    expect(translateText('Total:')).toBe('कुल:');
    expect(translateText('2 warn')).toBe('2 चेतावनी');
    expect(translateText('12 त्रुटि(s) 5 warn')).toBe('12 त्रुटियां 5 चेतावनी');
    expect(translateText('Review')).toBe('समीक्षा करें');

    // Screenshot 2: Review Workspace Overview & KPIs
    expect(translateText('← Batches')).toBe('← बैच');
    expect(translateText('Batches')).toBe('बैच');
    expect(translateText('ISSUE RESOLUTION')).toBe('मुद्दा समाधान');
    expect(translateText('PRIORITY EXPOSURE')).toBe('प्राथमिकता जोखिम');
    expect(translateText('INTAKE RECONCILIATION')).toBe('प्रवेश समाधान');
    expect(translateText('Resolved / Fixed:')).toBe('हल किया गया / ठीक किया गया:');
    expect(translateText('हल किया गया / Fixed:')).toBe('हल किया गया / ठीक किया गया:');
    expect(translateText('Total Flagged:')).toBe('कुल ध्वजांकित:');
    expect(translateText('Uploaded: 65 students')).toBe('अपलोड किए गए: 65 छात्र');
    expect(translateText('Approved Sanction: 60 intake')).toBe('स्वीकृत सीटें: 60');
    expect(translateText('स्वीकृत Sanction: 60 intake')).toBe('स्वीकृत सीटें: 60');
    expect(translateText('Over-intake variance: 3 students')).toBe('अतिरिक्त प्रवेश अंतर: 3 छात्र');
    expect(translateText('Over-Intake variance: 3 students')).toBe('अतिरिक्त प्रवेश अंतर: 3 छात्र');
    expect(translateText('Issues Queue (5)')).toBe('मुद्दा कतार (5)');
    expect(translateText('Duplicates (1)')).toBe('डुप्लिकेट (1)');
    expect(translateText('Before / After Report')).toBe('समीक्षा पूर्व / पश्चात रिपोर्ट');

    // Screenshot 3: Explainable Issue Queue
    expect(translateText('Explainable Issue Queue')).toBe('स्पष्टीकरण योग्य मुद्दा कतार');
    expect(translateText('5 Pending (5 Total)')).toBe('5 लंबित (कुल 5)');
    expect(translateText('5 लंबित (5 Total)')).toBe('5 लंबित (कुल 5)');
    expect(translateText('RULE')).toBe('नियम');
    expect(translateText('FIELD')).toBe('फ़ील्ड');
    expect(translateText('PRIORITY')).toBe('प्राथमिकता');
    expect(translateText('BUCKET')).toBe('श्रेणी');
    expect(translateText('Open (Pending)')).toBe('सक्रिय (लंबित)');
    expect(translateText('Open (लंबित)')).toBe('सक्रिय (लंबित)');
    expect(translateText('Showing 5 of 5 issues (Sorted: Priority CRITICAL→LOW, then Row)'))
      .toBe('5 में से 5 मुद्दे प्रदर्शित (क्रमबद्ध: प्राथमिकता गंभीर→निम्न, फिर पंक्ति)');
    expect(translateText('Showing 5 of 5 issues (Sorted: Priority CRITICAL→LOW, then पंक्ति)'))
      .toBe('5 में से 5 मुद्दे प्रदर्शित (क्रमबद्ध: प्राथमिकता गंभीर→निम्न, फिर पंक्ति)');
    expect(translateText('Reset Filters')).toBe('फ़िल्टर रीसेट करें');
    expect(translateText('Field / Rule')).toBe('फ़ील्ड / नियम');
    expect(translateText('Priority')).toBe('प्राथमिकता');
    expect(translateText('Bucket')).toBe('श्रेणी');
    expect(translateText('Reason / Message')).toBe('कारण / संदेश');
    expect(translateText('OPEN')).toBe('सक्रिय');

    // Screenshot 4: Issue Drawer
    expect(translateText('apaar_id missing or not 12 digits')).toBe('अपार आईडी गायब या 12 अंक नहीं');
    expect(translateText('Field: apaar_id')).toBe('फ़ील्ड: apaar_id');
    expect(translateText('Found 11 digits: Excel may have stripped leading zero or mangled scientific notation'))
      .toBe('11 अंक मिले: एक्सेल ने प्रारंभिक शून्य हटा दिया होगा या वैज्ञानिक संकेतन में बदल दिया होगा');
    expect(translateText('Key')).toBe('कुंजी');
    expect(translateText('Value')).toBe('मान');
    expect(translateText('Suggested Safe Fix')).toBe('सुझाया गया सुरक्षित समाधान');
    expect(translateText('Requires Approval')).toBe('अनुमोदन आवश्यक');
    expect(translateText('Suggested Value:')).toBe('सुझाया गया मान:');
    expect(translateText('Rationale: Prepend missing leading zero')).toBe('औचित्य: छूटा हुआ प्रारंभिक शून्य जोड़ें');
    expect(translateText('Current Uploaded Value')).toBe('वर्तमान अपलोड किया गया मान');
    expect(translateText('Inspect Full Row')).toBe('पूरी पंक्ति का निरीक्षण करें');
    expect(translateText('निरीक्षण करें Full पंक्ति')).toBe('पूरी पंक्ति का निरीक्षण करें');
  });

  it('translates Transfers Desk and Student Registry elements (Screenshots 1, 3, 4, 5)', () => {
    // Screenshot 1: Batch List Page errors count
    expect(translateText('12 error(s)')).toBe('12 त्रुटियां');
    expect(translateText('error(s)')).toBe('त्रुटियां');
    expect(translateText('12 त्रुटि(s)')).toBe('12 त्रुटियां');

    // Screenshot 3: Transfers Desk
    expect(translateText('15-Day AICTE Statutory Override Rule (Agents.md §8.1)'))
      .toBe('15-दिवसीय एआईसीटीई वैधानिक ओवरराइड नियम (Agents.md §8.1)');
    expect(translateText('When a destination institution creates a transfer request, the source institution is granted exactly 15 calendar days to decide (Approve or Reject with note). If left unaddressed beyond 15 days, the AICTE Central Desk automatically executes an administrative override. Approved or overridden transfers safely transition source records to TRANSFERRED_OUT, guaranteeing that destination enrolment will not trigger duplicate student flags (Rule V010).'))
      .toBe('जब कोई गंतव्य संस्थान स्थानांतरण अनुरोध बनाता है, तो स्रोत संस्थान को निर्णय लेने के लिए ठीक 15 कैलेंडर दिन (नोट के साथ स्वीकृत या अस्वीकार) दिए जाते हैं। यदि 15 दिनों से अधिक समय तक कोई कार्रवाई नहीं होती है, तो एआईसीटीई केंद्रीय डेस्क स्वतः प्रशासनिक ओवरराइड निष्पादित करता है। स्वीकृत या ओवरराइड किए गए स्थानांतरण स्रोत रिकॉर्ड को सुरक्षित रूप से स्थानांतरित (बाहर) में बदल देते हैं, जिससे यह सुनिश्चित होता है कि गंतव्य नामांकन से डुप्लिकेट छात्र फ़्लैग (नियम V010) ट्रिगर नहीं होंगे।');
    expect(translateText('When a गंतव्य संस्थान creates a स्थानांतरण request, the स्रोत संस्थान is granted exactly 15 calendar days to decide (स्वीकृत करें or अस्वीकार करें with note). If left unaddressed beyond 15 days, the AICTE Central Desk automatically executes an administrative override. स्वीकृत or overridden स्थानांतरण safely transition source रिकॉर्ड to TRANSFERRED_OUT , guaranteeing that destination enrolment will not trigger duplicate विद्यार्थी flags (नियम V010).'))
      .toBe('जब कोई गंतव्य संस्थान स्थानांतरण अनुरोध बनाता है, तो स्रोत संस्थान को निर्णय लेने के लिए ठीक 15 कैलेंडर दिन (नोट के साथ स्वीकृत या अस्वीकार) दिए जाते हैं। यदि 15 दिनों से अधिक समय तक कोई कार्रवाई नहीं होती है, तो एआईसीटीई केंद्रीय डेस्क स्वतः प्रशासनिक ओवरराइड निष्पादित करता है। स्वीकृत या ओवरराइड किए गए स्थानांतरण स्रोत रिकॉर्ड को सुरक्षित रूप से स्थानांतरित (बाहर) में बदल देते हैं, जिससे यह सुनिश्चित होता है कि गंतव्य नामांकन से डुप्लिकेट छात्र फ़्लैग (नियम V010) ट्रिगर नहीं होंगे।');
    expect(translateText('REASON')).toBe('कारण');
    expect(translateText('Reason')).toBe('कारण');
    expect(translateText('Family relocation to NCR')).toBe('एनसीआर (NCR) में पारिवारिक स्थानांतरण');
    expect(translateText('Parent transfer of central government defense officer')).toBe('केंद्र सरकार के रक्षा अधिकारी अभिभावक का स्थानांतरण');
    expect(translateText('Parent स्थानांतरण of central government defense officer')).toBe('केंद्र सरकार के रक्षा अधिकारी अभिभावक का स्थानांतरण');
    expect(translateText('Decided 8/4/2026')).toBe('निर्णय: 8/4/2026');
    expect(translateText('Awaiting Source')).toBe('स्रोत की प्रतीक्षा');

    // Screenshots 4 & 5: Student Central Registry
    expect(translateText('Student Central Registry')).toBe('केंद्रीय छात्र रजिस्ट्री');
    expect(translateText('विद्यार्थी Central Registry')).toBe('केंद्रीय छात्र रजिस्ट्री');
    expect(translateText('Canonical student records keyed by 12-digit APAAR ID with immutable branch switch history and multiple entry/exit points'))
      .toBe('अपरिवर्तनीय शाखा परिवर्तन इतिहास और बहु-प्रवेश/निकास बिंदुओं के साथ 12-अंकीय अपार आईडी द्वारा सुरक्षित प्रामाणिक छात्र रिकॉर्ड');
    expect(translateText('Canonical विद्यार्थी रिकॉर्ड keyed by 12-digit अपार आईडी with immutable branch switch history and multiple entry/exit points'))
      .toBe('अपरिवर्तनीय शाखा परिवर्तन इतिहास और बहु-प्रवेश/निकास बिंदुओं के साथ 12-अंकीय अपार आईडी द्वारा सुरक्षित प्रामाणिक छात्र रिकॉर्ड');
    expect(translateText('Admit Student (Entry Point)')).toBe('छात्र प्रवेश (प्रवेश बिंदु)');
    expect(translateText('Admit विद्यार्थी (Entry Point)')).toBe('छात्र प्रवेश (प्रवेश बिंदु)');
    expect(translateText('Unmask PII (Authorized)')).toBe('व्यक्तिगत पहचान (PII) अनमास्क करें (अधिकृत)');
    expect(translateText('Mask PII')).toBe('व्यक्तिगत पहचान (PII) मास्क करें');
    expect(translateText('ENTRY & EXIT PATHWAYS:')).toBe('प्रवेश एवं निकास मार्ग:');
    expect(translateText('Entry & Exit Pathways:')).toBe('प्रवेश एवं निकास मार्ग:');
    expect(translateText('All Students (8)')).toBe('सभी छात्र (8)');
    expect(translateText('सभी Students (8)')).toBe('सभी छात्र (8)');
    expect(translateText('DSE Lateral Entry (Year 2)')).toBe('डीएसई पार्श्व प्रवेश (द्वितीय वर्ष)');
    expect(translateText('DSE पार्श्व प्रवेश (Lateral Entry) (Year 2)')).toBe('डीएसई पार्श्व प्रवेश (द्वितीय वर्ष)');
    expect(translateText('Regular Entry (Year 1)')).toBe('नियमित प्रवेश (प्रथम वर्ष)');
    expect(translateText('Transfer-In Entry')).toBe('आवक स्थानांतरण प्रवेश');
    expect(translateText('स्थानांतरण-In Entry')).toBe('आवक स्थानांतरण प्रवेश');
    expect(translateText('Exited / Withdrawn / Transferred Out')).toBe('निकास / वापस लिया गया / स्थानांतरित बाहर');
    expect(translateText('Exited / वापस लिया गया / स्थानांतरित Out')).toBe('निकास / वापस लिया गया / स्थानांतरित बाहर');
    expect(translateText('Search by student name, APAAR ID, or roll number...')).toBe('छात्र का नाम, अपार आईडी, या रोल नंबर द्वारा खोजें...');
    expect(translateText('खोजें by छात्र का नाम, अपार आईडी, or roll number...')).toBe('छात्र का नाम, अपार आईडी, या रोल नंबर द्वारा खोजें...');
    expect(translateText('All Programs')).toBe('सभी कार्यक्रम');
    expect(translateText('सभी Programs')).toBe('सभी कार्यक्रम');
    expect(translateText('Student identities verified via Central APAAR registry with DPDP Act student consent status and branch switch tracking'))
      .toBe('डीपीडीपी (DPDP) अधिनियम छात्र सहमति स्थिति और शाखा परिवर्तन ट्रैकिंग के साथ केंद्रीय अपार रजिस्ट्री द्वारा सत्यापित छात्र पहचान');
    expect(translateText('विद्यार्थी identities verified via Central APAAR registry with DPDP Act विद्यार्थी सहमति स्थिति and branch switch tracking'))
      .toBe('डीपीडीपी (DPDP) अधिनियम छात्र सहमति स्थिति और शाखा परिवर्तन ट्रैकिंग के साथ केंद्रीय अपार रजिस्ट्री द्वारा सत्यापित छात्र पहचान');
    expect(translateText('Student ID (PRN)')).toBe('छात्र आईडी (PRN)');
    expect(translateText('विद्यार्थी ID (PRN)')).toBe('छात्र आईडी (PRN)');
    expect(translateText('PROGRAM & BRANCH')).toBe('कार्यक्रम एवं शाखा');
    expect(translateText('Program & Branch')).toBe('कार्यक्रम एवं शाखा');
    expect(translateText('ENTRY / YEAR')).toBe('प्रवेश / वर्ष');
    expect(translateText('Entry / Year')).toBe('प्रवेश / वर्ष');
    expect(translateText('LIFECYCLE STATUS')).toBe('जीवनचक्र स्थिति');
    expect(translateText('LIFECYCLE स्थिति')).toBe('जीवनचक्र स्थिति');
    expect(translateText('Lifecycle Status')).toBe('जीवनचक्र स्थिति');
    expect(translateText('Year 1 · UG')).toBe('वर्ष 1 · स्नातक (UG)');
    expect(translateText('Year 2 · PG')).toBe('वर्ष 2 · स्नातकोत्तर (PG)');
    expect(translateText('Year 4 · UG')).toBe('वर्ष 4 · स्नातक (UG)');
    expect(translateText('DEFERRED')).toBe('विलंबित');
    expect(translateText('GRADUATED')).toBe('स्नातक / उत्तीर्ण');
    expect(translateText('TRANSFERRED_OUT')).toBe('स्थानांतरित (बाहर)');
    expect(translateText('Branch Switched')).toBe('शाखा परिवर्तित');
    expect(translateText('Switch Branch')).toBe('शाखा बदलें');
    expect(translateText('Details')).toBe('विवरण');
  });

  it('translates Aggregates & Intake Reconciliation tab elements from user screenshot to Hindi', () => {
    // Header & Summary Cards (Image 1)
    expect(translateText('Aggregate Enrolment Reporting')).toBe('कुल नामांकन रिपोर्टिंग');
    expect(translateText('Dedicated submission workspace for institutions in AGGREGATE_ONLY mode and statutory AICTE intake reconciliation'))
      .toBe('AGGREGATE_ONLY मोड में संस्थानों के लिए समर्पित सबमिशन कार्यक्षेत्र और वैधानिक एआईसीटीई प्रवेश समाधान');
    expect(translateText('Academic Year 2026-27')).toBe('शैक्षणिक वर्ष 2026-27');
    expect(translateText('Approved Declared Seats')).toBe('स्वीकृत घोषित सीटें');
    expect(translateText('Sanctioned intake across all active programs')).toBe('सभी सक्रिय कार्यक्रमों में स्वीकृत प्रवेश');
    expect(translateText('Total Submitted Enrolment')).toBe('कुल प्रस्तुत नामांकन');
    expect(translateText('Sum of aggregate submissions for 2026-27')).toBe('2026-27 के लिए कुल सबमिशन का योग');
    expect(translateText('Reconciliation Variance')).toBe('सुलह भिन्नता');
    expect(translateText('Fully Reconciled')).toBe('पूर्णतः सुलह पूर्ण');
    expect(translateText('Evaluated under AICTE Rule V022')).toBe('एआईसीटीई नियम V022 के तहत मूल्यांकित');

    // Section 1: Form Table
    expect(translateText('Program Enrolment Breakdown Form')).toBe('कार्यक्रम नामांकन विवरण प्रपत्र');
    expect(translateText('Enter total enrolled heads along with supernumerary and foreign quota sub-counts for each program'))
      .toBe('प्रत्येक कार्यक्रम के लिए अतिरिक्त और विदेशी कोटा उप-गणना के साथ कुल नामांकित छात्र दर्ज करें');
    expect(translateText('Save & Reconcile')).toBe('सहेजें एवं सुलह करें');
    expect(translateText('सहजें & Reconcile')).toBe('सहेजें एवं सुलह करें');
    expect(translateText('सहेजें & Reconcile')).toBe('सहेजें एवं सुलह करें');
    expect(translateText('Program Code & Title')).toBe('कार्यक्रम कोड एवं शीर्षक');
    expect(translateText('PROGRAM CODE & TITLE')).toBe('कार्यक्रम कोड एवं शीर्षक');
    expect(translateText('कार्यक्रम कोड & TITLE')).toBe('कार्यक्रम कोड एवं शीर्षक');
    expect(translateText('Declared Intake')).toBe('घोषित इंटेक');
    expect(translateText('Total Enrolled *')).toBe('कुल नामांकित *');
    expect(translateText('Supernumerary')).toBe('अतिरिक्त सीटें (सुपरन्यूमरेरी)');
    expect(translateText('अतिरिक्त सीटें (SUPERNUMERARY)')).toBe('अतिरिक्त सीटें (सुपरन्यूमरेरी)');
    expect(translateText('FN (Foreign)')).toBe('विदेशी (FN)');
    expect(translateText('FN (FOREIGN)')).toBe('विदेशी (FN)');
    expect(translateText('B.Tech in Computer Science & Engineering')).toBe('बी.टेक कंप्यूटर साइंस एवं इंजीनियरिंग');
    expect(translateText('B.Tech in Electronics & Communication Engineering')).toBe('बी.टेक इलेक्ट्रॉनिक्स एवं संचार इंजीनियरिंग');
    expect(translateText('B.Tech in Mechanical Engineering')).toBe('बी.टेक मैकेनिकल इंजीनियरिंग');
    expect(translateText('Master of Business Administration')).toBe('मास्टर ऑफ बिजनेस एडमिनिस्ट्रेशन (MBA)');

    // Section 2: Intake Reconciliation (Image 1 & 2)
    expect(translateText('Intake Reconciliation: Declared Quota vs. Submitted Enrolment'))
      .toBe('प्रवेश समाधान: घोषित कोटा बनाम प्रस्तुत नामांकन');
    expect(translateText('प्रवेश समाधान: Declared कोटा vs. Submitted Enrolment'))
      .toBe('प्रवेश समाधान: घोषित कोटा बनाम प्रस्तुत नामांकन');
    expect(translateText('Automated Audit per Rule V022')).toBe('नियम V022 के अनुसार स्वचालित ऑडिट');
    expect(translateText('Automated Audit per नियम V022')).toBe('नियम V022 के अनुसार स्वचालित ऑडिट');
    expect(translateText('Comparison between approved sanction from AICTE Approval Portal and actual enrolments reported by institution'))
      .toBe('एआईसीटीई अनुमोदन पोर्टल से स्वीकृत सीटों और संस्थान द्वारा रिपोर्ट किए गए वास्तविक नामांकन के बीच तुलना');
    expect(translateText('Comparison between स्वीकृत sanction from AICTE Approval Portal and वास्तविक enrolments reported by institution'))
      .toBe('एआईसीटीई अनुमोदन पोर्टल से स्वीकृत सीटों और संस्थान द्वारा रिपोर्ट किए गए वास्तविक नामांकन के बीच तुलना');

    // Section 2: Table Columns & Rows (Image 2)
    expect(translateText('Declared (Approved Intake)')).toBe('घोषित (स्वीकृत प्रवेश)');
    expect(translateText('DECLARED (स्वीकृत प्रवेश)')).toBe('घोषित (स्वीकृत प्रवेश)');
    expect(translateText('Submitted Enrolment')).toBe('प्रस्तुत नामांकन');
    expect(translateText('SUBMITTED ENROLMENT')).toBe('प्रस्तुत नामांकन');
    expect(translateText('Variance (Delta)')).toBe('भिन्नता (अंतर (डेल्टा))');
    expect(translateText('VARIANCE (अंतर (डेल्टा))')).toBe('भिन्नता (अंतर (डेल्टा))');
    expect(translateText('Reconciliation Status')).toBe('सुलह स्थिति');
    expect(translateText('60 students')).toBe('60 छात्र');
    expect(translateText('58 students')).toBe('58 छात्र');
    expect(translateText('65 students')).toBe('65 छात्र');
    expect(translateText('40 students')).toBe('40 छात्र');
    expect(translateText('MATCH')).toBe('सटीक मिलान');
    expect(translateText('EXCESS (OVER-ENROLLED)')).toBe('अतिरिक्त (ओवर-नामांकित)');
    expect(translateText('अतिरिक्त (OVER-नामांकित)')).toBe('अतिरिक्त (ओवर-नामांकित)');
    expect(translateText('MISMATCH (UNDER-FILLED)')).toBe('बेमेल (अंडर-फिल्ड)');
    expect(translateText('बेमेल (UNDER-FILLED)')).toBe('बेमेल (अंडर-फिल्ड)');
  });

  it('translates Category Quotas & Seat Allocation Engine elements from user screenshot to Hindi', () => {
    // Top Bar & Controls (Image 3)
    expect(translateText('ANALYTICAL ENGINE')).toBe('विश्लेषणात्मक इंजन');
    expect(translateText('Statutory Category Quotas & Seat Allocation Engine'))
      .toBe('सांविधिक श्रेणी कोटा एवं सीट आवंटन इंजन');
    expect(translateText('Statutory श्रेणी Quotas & Seat Allocation Engine'))
      .toBe('सांविधिक श्रेणी कोटा एवं सीट आवंटन इंजन');
    expect(translateText('Real-time compliance monitoring for SC, ST, OBC-NCL, EWS, and General category intake limits under central/state statutory reservation mandates.'))
      .toBe('केंद्रीय/राज्य सांविधिक आरक्षण शासनादेशों के तहत SC, ST, OBC-NCL, EWS और सामान्य श्रेणी की प्रवेश सीमाओं की वास्तविक समय अनुपालन निगरानी।');
    expect(translateText('Real-time compliance निगरानी (Monitoring) for SC, ST, अन्य पिछड़ा वर्ग (OBC)-NCL, आर्थिक रूप से कमजोर वर्ग (EWS), and सामान्य (General) श्रेणी intake limits under central/state statutory reservation mandates.'))
      .toBe('केंद्रीय/राज्य सांविधिक आरक्षण शासनादेशों के तहत SC, ST, OBC-NCL, EWS और सामान्य श्रेणी की प्रवेश सीमाओं की वास्तविक समय अनुपालन निगरानी।');
    expect(translateText('All Programs (520 Seats)')).toBe('सभी कार्यक्रम (520 सीटें)');
    expect(translateText('सभी Programs (520 सीटें)')).toBe('सभी कार्यक्रम (520 सीटें)');
    expect(translateText('Adjust Category Quotas')).toBe('श्रेणी कोटा समायोजित करें');
    expect(translateText('Adjust श्रेणी Quotas')).toBe('श्रेणी कोटा समायोजित करें');

    // Breach Alert Banner
    expect(translateText('Statutory Reservation Quota Breach Detected (1 Category Alert)'))
      .toBe('सांविधिक आरक्षण कोटा उल्लंघन का पता चला (1 श्रेणी अलर्ट)');
    expect(translateText('STATUTORY RESERVATION कोटा BREACH DETECTED (1 श्रेणी ALERT)'))
      .toBe('सांविधिक आरक्षण कोटा उल्लंघन का पता चला (1 श्रेणी अलर्ट)');
    expect(translateText('• Scheduled Castes (SC): Enrolled count (81 seats) exceeds approved statutory quota (78 seats) by +3 excess students. AICTE Rule V012/V015 alert triggered.'))
      .toBe('• अनुसूचित जाति (SC): नामांकित संख्या (81 सीटें) स्वीकृत सांविधिक कोटा (78 सीटें) से +3 अतिरिक्त छात्र अधिक है। एआईसीटीई नियम V012/V015 अलर्ट ट्रिगर हुआ।');
    expect(translateText('• Scheduled Castes (अनुसूचित जाति (SC)): नामांकित count (81 सीटें) exceeds स्वीकृत statutory कोटा (78 सीटें) by +3 अतिरिक्त students. AICTE नियम V012/V015 alert triggered.'))
      .toBe('• अनुसूचित जाति (SC): नामांकित संख्या (81 सीटें) स्वीकृत सांविधिक कोटा (78 सीटें) से +3 अतिरिक्त छात्र अधिक है। एआईसीटीई नियम V012/V015 अलर्ट ट्रिगर हुआ।');
    expect(translateText('Reallocate Seats')).toBe('सीटें पुन: आवंटित करें');
    expect(translateText('Reallocate सीटें')).toBe('सीटें पुन: आवंटित करें');

    // Quotas Table
    expect(translateText('Category Code')).toBe('श्रेणी कोड');
    expect(translateText('श्रेणी CODE')).toBe('श्रेणी कोड');
    expect(translateText('Statutory Category Name')).toBe('सांविधिक श्रेणी का नाम');
    expect(translateText('STATUTORY श्रेणी NAME')).toBe('सांविधिक श्रेणी का नाम');
    expect(translateText('Statutory %')).toBe('सांविधिक %');
    expect(translateText('STATUTORY %')).toBe('सांविधिक %');
    expect(translateText('Allocated Quota')).toBe('आवंटित कोटा');
    expect(translateText('ALLOCATED कोटा')).toBe('आवंटित कोटा');
    expect(translateText('Compliance Status')).toBe('अनुपालन स्थिति');
    expect(translateText('COMPLIANCE स्थिति')).toBe('अनुपालन स्थिति');

    // Table Rows
    expect(translateText('General / Open Merit')).toBe('सामान्य / ओपन मेरिट');
    expect(translateText('सामान्य (General) / सक्रिय Merit')).toBe('सामान्य / ओपन मेरिट');
    expect(translateText('Other Backward Classes (NCL)')).toBe('अन्य पिछड़ा वर्ग (OBC-NCL)');
    expect(translateText('Scheduled Castes')).toBe('अनुसूचित जाति');
    expect(translateText('Scheduled Castes (SC)')).toBe('अनुसूचित जाति (SC)');
    expect(translateText('Scheduled Tribes')).toBe('अनुसूचित जनजाति');
    expect(translateText('Scheduled Tribes (ST)')).toBe('अनुसूचित जनजाति (ST)');
    expect(translateText('Economically Weaker Section')).toBe('आर्थिक रूप से कमजोर वर्ग');
    expect(translateText('Economically Weaker Section (EWS)')).toBe('आर्थिक रूप से कमजोर वर्ग (EWS)');
    expect(translateText('Persons with Disabilities (Horizontal 5%)')).toBe('दिव्यांगजन (क्षैतिज 5%)');
    expect(translateText('Horizontal')).toBe('क्षैतिज');
    expect(translateText('6 vacant')).toBe('6 रिक्त');
    expect(translateText('2 vacant')).toBe('2 रिक्त');
    expect(translateText('3 vacant')).toBe('3 रिक्त');
    expect(translateText('4 vacant')).toBe('4 रिक्त');
    expect(translateText('NEAR LIMIT')).toBe('सीमा के निकट');
    expect(translateText('QUOTA BREACH')).toBe('कोटा उल्लंघन');
    expect(translateText('कोटा BREACH')).toBe('कोटा उल्लंघन');
    expect(translateText('COMPLIANT')).toBe('अनुपालित');

    // Summary Footer
    expect(translateText('Total Approved Ceiling: 520 seats')).toBe('कुल स्वीकृत सीमा: 520 सीटें');
    expect(translateText('Total स्वीकृत सीमा: 520 सीटें')).toBe('कुल स्वीकृत सीमा: 520 सीटें');
    expect(translateText('Total Quota Allocated: 520 seats')).toBe('कुल आवंटित कोटा: 520 सीटें');
    expect(translateText('Total कोटा Allocated: 520 सीटें')).toBe('कुल आवंटित कोटा: 520 सीटें');
    expect(translateText('Total Category Enrolled: 508 students')).toBe('कुल श्रेणी नामांकित: 508 छात्र');
    expect(translateText('Total श्रेणी नामांकित: 508 students')).toBe('कुल श्रेणी नामांकित: 508 छात्र');
    expect(translateText('Automated AICTE Reservation Balancing Active'))
      .toBe('स्वचालित एआईसीटीई आरक्षण संतुलन सक्रिय');
    expect(translateText('Automated AICTE Reservation Balancing सक्रिय'))
      .toBe('स्वचालित एआईसीटीई आरक्षण संतुलन सक्रिय');
  });
});

