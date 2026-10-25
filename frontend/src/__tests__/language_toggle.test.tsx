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
});

