import i18n from './i18n';

// Comprehensive dictionary mapping English UI text to Hindi
export const HINDI_DICTIONARY: Record<string, string> = {
  // Navigation & Shell
  "Institution Portal": "संस्थान पोर्टल",
  "Institution Dashboard": "संस्थान डैशबोर्ड",
  "AICTE Central Console": "एआईसीटीई केंद्रीय कंसोल",
  "AICTE Central Repository Console": "एआईसीटीई केंद्रीय भंडार कंसोल",
  "DAB Portal & Degrees": "डीएबी पोर्टल एवं डिग्री",
  "Degree Awarding Body Admin": "डिग्री प्रदाता संस्था व्यवस्थापक",
  "Student Wallet": "छात्र वॉलेट",
  "Student Credential Wallet": "छात्र प्रमाणपत्र वॉलेट",
  "Verifier Portal": "सत्यापनकर्ता पोर्टल",
  "Verifier Desk": "सत्यापनकर्ता डेस्क",
  "Reports & Analytics": "रिपोर्ट एवं विश्लेषण",
  "Settings": "सेटिंग्स",
  "Settings & Configuration": "सेटिंग्स एवं विन्यास",
  "Batch Registry": "बैच रजिस्ट्री",
  "Batch Registry & Audit History": "बैच रजिस्ट्री एवं ऑडिट इतिहास",
  "Review Workspace": "समीक्षा कार्यक्षेत्र",
  "Batch Review Workspace": "बैच समीक्षा कार्यक्षेत्र",
  "Transfers": "स्थानांतरण",
  "Transfers Desk": "स्थानांतरण डेस्क",
  "Inter-Institution Transfers Desk": "अंतर-संस्थान स्थानांतरण डेस्क",
  "Student Registry": "छात्र रजिस्ट्री",
  "Aggregate Intake": "कुल प्रवेश / इंटेक",
  "Portals & Modules": "पोर्टल एवं मॉड्यूल",
  "Sign In": "साइन इन",
  "Sign Out": "साइन आउट",
  "Sign In to Portal": "पोर्टल में साइन इन करें",
  "Dark Mode": "डार्क मोड",
  "Light Mode": "लाइट मोड",
  "Home": "होम",
  "Government of India · Ministry of Education · AICTE": "भारत सरकार · शिक्षा मंत्रालय · एआईसीटीई",
  "National APAAR Student Verification & Repository System": "राष्ट्रीय अपार (APAAR) छात्र डेटा सत्यापन एवं केंद्रीय भंडार प्रणाली",
  "APAAR Keyed": "अपार सुरक्षित",
  "All data secured via 12-digit APAAR format with hash chain audit.": "सभी डेटा 12-अंकीय अपार प्रारूप और हैश चेन ऑडिट द्वारा सुरक्षित हैं।",
  "Accessibility Statement: WCAG 2.1 AA Compliant": "अभिगम्यता कथन: WCAG 2.1 AA अनुरूप",
  "© 2026 EduVerify System. All rights reserved.": "© 2026 एडुवेरीफाई प्रणाली। सर्वाधिकार सुरक्षित।",
  "You are currently offline. Actions will be queued.": "आप वर्तमान में ऑफ़लाइन हैं। कार्य कतार में जोड़े जाएंगे।",

  // KPIs & Metrics
  "Data Quality Score": "डेटा गुणवत्ता स्कोर",
  "Data Quality (DQ) Score Trajectory": "डेटा गुणवत्ता (DQ) स्कोर प्रक्षेपवक्र",
  "Enrolment & Seat Fill %": "नामांकन एवं सीट भराव %",
  "Fill Ratio": "भराव अनुपात",
  "Inter-Institution Transfers": "अंतर-संस्थान स्थानांतरण",
  "Action Required": "कार्रवाई आवश्यक",
  "Open Issues": "सक्रिय मुद्दे",
  "Open Data Quality Issues": "सक्रिय डेटा गुणवत्ता मुद्दे",
  "Open Review Queue": "समीक्षा कतार खोलें",
  "View Transfer Desk": "स्थानांतरण डेस्क देखें",
  "Resolve All": "सभी हल करें",
  "Inspect": "निरीक्षण करें",
  "Program Sanctioned Intake vs Actual Enrolment": "स्वीकृत सीटें बनाम वास्तविक नामांकन",
  "Sanctioned Intake": "स्वीकृत सीटें",
  "Enrolled Students": "नामांकित छात्र",
  "Approved Intake": "स्वीकृत प्रवेश",
  "Total Enrolled": "कुल नामांकित",
  "Before Review": "समीक्षा पूर्व",
  "After Corrections": "सुधार के बाद",
  "Within approved AICTE ceiling (0 excess)": "स्वीकृत एआईसीटीई सीमा के भीतर (0 अतिरिक्त)",
  "Historical progression of automated completeness, uniqueness, and format validation scores across batches": "बैचों में स्वचालित पूर्णता, विशिष्टता एवं प्रारूप सत्यापन का ऐतिहासिक रिकॉर्ड",
  "Program-by-program comparison against AICTE Approved Intake ceilings for Academic Year 2026-27": "शैक्षणिक वर्ष 2026-27 के लिए एआईसीटीई स्वीकृत सीटों के विरुद्ध कार्यक्रम-वार तुलना",
  "Pending resolution before full statutory compliance clearance": "वैधानिक अनुपालन मंजूरी से पहले लंबित समाधान",
  "Institutional Alerts & Notifications": "संस्थागत अलर्ट एवं सूचनाएं",
  "Time-sensitive regulatory alerts and system event broadcasts": "समय-संवेदनशील विनियामक अलर्ट और प्रणाली प्रसारण",
  "Transfer Request Awaiting Decision": "स्थानांतरण अनुरोध निर्णय हेतु प्रतीक्षारत",
  "Batch 2 Ingestion Complete": "बैच 2 अंतर्ग्रहण पूर्ण हुआ",
  "Data Quality Alert": "डेटा गुणवत्ता चेतावनी",
  "Overall data quality score improved from 68.0 to 74.0": "समग्र डेटा गुणवत्ता स्कोर 68.0 से बढ़कर 74.0 हो गया",
  "480 student records committed to Central Registry": "480 छात्र रिकॉर्ड केंद्रीय रजिस्ट्री में कमिट किए गए",
  "Inbound transfer TR-2026-0881 exceeds 15-day AICTE window": "आवक स्थानांतरण TR-2026-0881 15-दिवसीय एआईसीटीई समयसीमा से अधिक है",

  // Batch Upload Wizard
  "Upload Batch": "बैच अपलोड करें",
  "Institution Batch Upload Wizard": "संस्थान बैच अपलोड विज़ार्ड",
  "Ingest student admission records, auto-map columns with AICTE synonym catalog, and validate against national rules.": "छात्र प्रवेश रिकॉर्ड अंतर्ग्रहण करें, एआईसीटीई समानार्थी कैटलॉग से कॉलम मैप करें, और राष्ट्रीय नियमों के अनुसार सत्यापित करें।",
  "1. Choose File": "1. फ़ाइल चुनें",
  "2. Map Columns": "2. कॉलम मैपिंग",
  "3. Validate Engine": "3. इंजन सत्यापन",
  "4. Result Summary": "4. परिणाम सारांश",
  "Step 1: Choose File": "चरण 1: फ़ाइल चुनें",
  "Step 2: Column Mapping": "चरण 2: कॉलम मैपिंग",
  "Step 3: Validation": "चरण 3: सत्यापन",
  "Step 4: Summary": "चरण 4: सारांश",
  "Step 1: Upload File & Select Academic Year": "चरण 1: फ़ाइल अपलोड करें एवं शैक्षणिक वर्ष चुनें",
  "Upload Student Intake File": "छात्र प्रवेश फ़ाइल अपलोड करें",
  "Drag and drop your student CSV or Excel (.xlsx) file here, or browse": "अपनी छात्र CSV या Excel (.xlsx) फ़ाइल यहाँ खींचें और छोड़ें, या ब्राउज़ करें",
  "CSV or Excel (.xlsx) up to 50MB": "CSV या Excel (.xlsx) 50MB तक",
  "Browse File": "फ़ाइल ब्राउज़ करें",
  "Demo Batches Available": "उपलब्ध डेमो बैच",
  "Quickly test with realistic sample datasets:": "यथार्थवादी नमूना डेटासेट के साथ त्वरित परीक्षण करें:",
  "Academic Year": "शैक्षणिक वर्ष",
  "Select Academic Year": "शैक्षणिक वर्ष चुनें",
  "Intake Type": "प्रवेश प्रकार",
  "Regular Intake": "नियमित प्रवेश",
  "Lateral Entry": "पार्श्व प्रवेश (Lateral Entry)",
  "Supernumerary": "अतिरिक्त सीटें (Supernumerary)",
  "Auto-Detect File Format": "फ़ाइल प्रारूप स्वतः पहचानें",
  "Upload & Proceed to Mapping": "अपलोड करें एवं मैपिंग पर आगे बढ़ें",
  "Step 2: Map Columns with AICTE Catalog": "चरण 2: एआईसीटीई कैटलॉग के साथ कॉलम मैप करें",
  "Source Column": "स्रोत कॉलम",
  "Target Schema Field": "लक्षित स्कीमा फ़ील्ड",
  "Confidence Score": "विश्वसनीयता स्कोर",
  "Match Type": "मिलान प्रकार",
  "Sample Data": "नमूना डेटा",
  "Auto Mapped": "स्वतः मैप किया गया",
  "Manual Mapping": "मैनुअल मैपिंग",
  "Save Mapping Profile for Future Uploads": "भविष्य के अपलोड के लिए मैपिंग प्रोफ़ाइल सहेजें",
  "Confirm Mapping & Run Validation": "मैपिंग की पुष्टि करें एवं सत्यापन चलाएं",
  "Step 3: Rule Engine Validation": "चरण 3: नियम इंजन सत्यापन",
  "Validating records against national statutory guidelines...": "राष्ट्रीय वैधानिक दिशानिर्देशों के अनुसार रिकॉर्ड का सत्यापन जारी...",
  "Validation Completed": "सत्यापन पूर्ण हुआ",
  "Errors Found": "त्रुटियां पाई गईं",
  "Warnings Found": "चेतावनियां पाई गईं",
  "Valid Records": "मान्य रिकॉर्ड",
  "Total Records": "कुल रिकॉर्ड",
  "Step 4: Batch Processing Summary": "चरण 4: बैच प्रसंस्करण सारांश",
  "Proceed to Review Workspace": "समीक्षा कार्यक्षेत्र पर आगे बढ़ें",
  "Upload Another Batch": "एक अन्य बैच अपलोड करें",
  "Track, review, and commit historical and incoming student intake datasets.": "ऐतिहासिक और आने वाले छात्र प्रवेश डेटासेट को ट्रैक, समीक्षा और कमिट करें।",
  "Total Batches": "कुल बैच",
  "Pending Review": "समीक्षा लंबित",
  "Total Records Ingested": "कुल अंतर्ग्रहीत रिकॉर्ड",
  "Batch ID": "बैच आईडी",
  "Filename": "फ़ाइल नाम",
  "Uploaded At": "अपलोड समय",
  "Records": "रिकॉर्ड",
  "DQ Score": "DQ स्कोर",
  "Review Issues": "मुद्दों की समीक्षा करें",
  "Export Certificate": "प्रमाणपत्र निर्यात करें",
  "Export Audit Trail": "ऑडिट ट्रेल निर्यात करें",
  "Re-run Validation": "सत्यापन पुनः चलाएं",

  // Review Workspace
  "Data Quality & Rule Validation": "डेटा गुणवत्ता एवं नियम सत्यापन",
  "Track, resolve, and audit student data issues before committing to the national registry.": "राष्ट्रीय रजिस्ट्री में कमिट करने से पहले छात्र डेटा मुद्दों को ट्रैक, हल और ऑडिट करें।",
  "Issue Queue": "मुद्दा कतार",
  "Duplicate Clusters": "डुप्लिकेट समूह",
  "Comprehensive Report": "विस्तृत रिपोर्ट",
  "Re-Validate": "पुनः सत्यापित करें",
  "Commit to Central Registry": "केंद्रीय रजिस्ट्री में कमिट करें",
  "Committed to Central Registry": "केंद्रीय रजिस्ट्री में सफलतापूर्वक कमिट किया गया",
  "Rule ID": "नियम आईडी",
  "Rule Description": "नियम विवरण",
  "Severity": "गंभीरता",
  "Impacted Field": "प्रभावित फ़ील्ड",
  "Row Number": "पंक्ति संख्या",
  "Current Value": "वर्तमान मान",
  "Suggested Fix": "सुझाया गया सुधार",
  "Accept Correction": "सुधार स्वीकार करें",
  "Reject Correction": "सुधार अस्वीकार करें",
  "Override Rule": "नियम ओवरराइड करें",
  "Row Inspector": "पंक्ति निरीक्षक",
  "Original Row Data": "मूल पंक्ति डेटा",
  "Corrected Row Data": "संशोधित पंक्ति डेटा",
  "Commit Batch": "बैच कमिट करें",
  "Are you sure you want to commit this batch?": "क्या आप सुनिश्चित हैं कि आप इस बैच को कमिट करना चाहते हैं?",
  "This action will write student records to the permanent central repository with cryptographic audit hashing.": "यह कार्रवाई छात्र रिकॉर्ड को क्रिप्टोग्राफ़िक ऑडिट हैशिंग के साथ स्थायी केंद्रीय भंडार में दर्ज करेगी।",
  "Confirm & Commit": "पुष्टि करें एवं कमिट करें",
  "Resolve All Issues": "सभी मुद्दों का समाधान करें",

  // Transfers
  "Track and adjudicate student transfers between AICTE approved institutions.": "एआईसीटीई अनुमोदित संस्थानों के बीच छात्र स्थानांतरण को ट्रैक एवं निर्णय करें।",
  "Inbound Transfers": "आवक स्थानांतरण (Inbound)",
  "Outbound Transfers": "जावक स्थानांतरण (Outbound)",
  "Student Name": "छात्र का नाम",
  "APAAR ID": "अपार आईडी",
  "Origin Institution": "मूल संस्थान",
  "Destination Institution": "गंतव्य संस्थान",
  "Transfer Reason": "स्थानांतरण का कारण",
  "Request Date": "अनुरोध तिथि",
  "Deadline": "अंतिम तिथि",
  "AICTE NOC Status": "एआईसीटीई एनओसी स्थिति",
  "Approve Transfer": "स्थानांतरण स्वीकृत करें",
  "Reject Transfer": "स्थानांतरण अस्वीकार करें",
  "Transfer Approved": "स्थानांतरण स्वीकृत हुआ",
  "Transfer Rejected": "स्थानांतरण अस्वीकृत हुआ",

  // Student Registry & Aggregates
  "Enrolled student records across programs, academic years, and departments.": "कार्यक्रमों, शैक्षणिक वर्षों और विभागों में नामांकित छात्र रिकॉर्ड।",
  "Export Registry (CSV)": "रजिस्ट्री निर्यात करें (CSV)",
  "Search by name, APAAR ID, or enrollment number": "नाम, अपार आईडी या नामांकन संख्या द्वारा खोजें",
  "Course / Program": "पाठ्यक्रम / कार्यक्रम",
  "Year of Study": "अध्ययन का वर्ष",
  "Category": "श्रेणी",
  "Gender": "लिंग",
  "Status": "स्थिति",
  "Actions": "कार्रवाई",
  "Aggregate Intake Monitoring": "कुल प्रवेश / इंटेक निगरानी",
  "Approved Ceiling": "स्वीकृत सीमा",
  "Actual Admitted": "वास्तविक प्रवेश",
  "Excess Admitted": "अतिरिक्त प्रवेश",
  "Vacancy": "रिक्तियां",

  // AICTE Console
  "National student data registry, compliance monitoring, and anomalous intake detection.": "राष्ट्रीय छात्र डेटा रजिस्ट्री, अनुपालन निगरानी, और विसंगतिपूर्ण प्रवेश पहचान।",
  "Audit chain intact": "ऑडिट श्रृंखला अक्षुण्ण है",
  "Broken chain": "ऑडिट श्रृंखला खंडित है",
  "Audit Chain Integrity": "ऑडिट श्रृंखला अखंडता",
  "Live Ingestion Ticker": "लाइव अंतर्ग्रहण टिकर",
  "National Seat Fill Rate": "राष्ट्रीय सीट भराव दर",
  "Total AICTE Institutions": "कुल एआईसीटीई संस्थान",
  "Total Students Registered": "कुल पंजीकृत छात्र",
  "Compliance Violations": "अनुपालन उल्लंघन",
  "India Map Distribution": "भारत मानचित्र वितरण",
  "State / UT Drilldown": "राज्य / केंद्रशासित प्रदेश विवरण",
  "Select Metric": "मीट्रिक चुनें",
  "Seat Fill %": "सीट भराव %",
  "Excess Enrolment": "अतिरिक्त नामांकन",
  "Coverage %": "कवरेज %",
  "Leaderboards & Red Flags": "शीर्ष तालिकाएं एवं रेड फ़्लैग",
  "Institutions with Excess Enrolment": "अतिरिक्त नामांकन वाले संस्थान",
  "Institutions with Lowest DQ Score": "न्यूनतम DQ स्कोर वाले संस्थान",
  "Cross-Institution Duplicate Clusters": "अंतर-संस्थान डुप्लिकेट समूह",
  "Algorithmic Anomaly & Drift Feed": "एल्गोरिथम विसंगति एवं ड्रिफ्ट फ़ीड",
  "Reconciliation View (Declared vs Uploaded)": "सुलह दृश्य (घोषित बनाम अपलोड)",
  "Cryptographic Audit Log": "क्रिप्टोग्राफ़िक ऑडिट लॉग",
  "Master Data & Year Rollover": "मास्टर डेटा एवं वर्ष रोलओवर",
  "Roll Over Academic Year": "शैक्षणिक वर्ष रोल ओवर करें",
  "Root Trust List": "रूट ट्रस्ट सूची",

  // DAB Portal
  "Degree Awarding Body Degree Authorization & Institutional Oversight": "डिग्री प्रदाता संस्था डिग्री प्राधिकरण एवं संस्थागत पर्यवेक्षण",
  "Authorized Institutions": "अधिकृत संस्थान",
  "Pending Degree Approvals": "लंबित डिग्री अनुमोदन",
  "Issued Digital Credentials": "जारी किए गए डिजिटल प्रमाणपत्र",
  "Authorize Degree Issuance": "डिग्री जारी करने हेतु अधिकृत करें",

  // Student Wallet
  "Decentralized verifiable credentials backed by W3C / SD-JWT and did:web identity.": "W3C / SD-JWT और did:web पहचान समर्थित विकेंद्रीकृत सत्यापन योग्य प्रमाणपत्र।",
  "Holder Key Status": "धारक कुंजी स्थिति",
  "Private Key Available in Local Vault": "स्थानीय वॉल्ट में निजी कुंजी उपलब्ध",
  "Generate New Keypair": "नया कुंजी युग्म उत्पन्न करें",
  "My Credentials": "मेरे प्रमाणपत्र",
  "Academic Transcripts": "शैक्षणिक प्रतिलेख (ट्रांसक्रिप्ट)",
  "Degree Certificate": "डिग्री प्रमाणपत्र",
  "Selective Disclosure": "चयनात्मक प्रकटीकरण",
  "Generate SD-JWT Presentation": "SD-JWT प्रस्तुति उत्पन्न करें",
  "View Official Certificate": "आधिकारिक प्रमाणपत्र देखें",
  "Download PDF": "PDF डाउनलोड करें",
  "Download JSON": "JSON डाउनलोड करें",
  "QR Code for Verification": "सत्यापन हेतु QR कोड",

  // Verifier
  "Verify student credentials, degrees, and academic records cryptographically.": "छात्र प्रमाणपत्र, डिग्री और शैक्षणिक रिकॉर्ड को क्रिप्टोग्राफ़िक रूप से सत्यापित करें।",
  "Paste SD-JWT Credential": "SD-JWT प्रमाणपत्र चिपकाएं",
  "Upload QR / File": "QR / फ़ाइल अपलोड करें",
  "Verify Credential": "प्रमाणपत्र सत्यापित करें",
  "Verification Result": "सत्यापन परिणाम",
  "Credential Valid & Authentic": "प्रमाणपत्र मान्य एवं प्रामाणिक है",
  "Credential Invalid or Tampered": "प्रमाणपत्र अमान्य या छेड़छाड़ किया गया है",
  "Issuer Signature": "जारीकर्ता हस्ताक्षर",
  "Revocation Status": "निरसन स्थिति",
  "Not Revoked (Active)": "निरस्त नहीं (सक्रिय)",

  // Reports
  "Generate, download, and schedule statutory compliance and quality audit reports.": "वैधानिक अनुपालन और गुणवत्ता ऑडिट रिपोर्ट उत्पन्न, डाउनलोड और शेड्यूल करें।",
  "Select Report Type": "रिपोर्ट का प्रकार चुनें",
  "Institution Intake Summary": "संस्थान प्रवेश सारांश",
  "Data Quality & Audit Log": "डेटा गुणवत्ता एवं ऑडिट लॉग",
  "AICTE Statutory Compliance Report": "एआईसीटीई वैधानिक अनुपालन रिपोर्ट",
  "Generate Report": "रिपोर्ट तैयार करें",
  "Download Report": "रिपोर्ट डाउनलोड करें",

  // Settings
  "Manage institution profile, API credentials, webhooks, and security access.": "संस्थान प्रोफ़ाइल, एपीआई क्रेडेंशियल, वेबहुक और सुरक्षा एक्सेस प्रबंधित करें।",
  "API Keys": "एपीआई कुंजियां",
  "Generate New API Key": "नई एपीआई कुंजी बनाएं",
  "Webhook Subscriptions": "वेबहुक सदस्यताएं",
  "Add Webhook Endpoint": "वेबहुक समापन बिंदु जोड़ें",
  "User Access Management": "उपयोगकर्ता एक्सेस प्रबंधन",
  "Security Logs": "सुरक्षा लॉग",

  // Common UI Actions & Badges
  "Loading...": "लोड हो रहा है...",
  "Loading": "लोड हो रहा है",
  "An error occurred": "एक त्रुटि उत्पन्न हुई",
  "Retry": "पुनः प्रयास करें",
  "No records found": "कोई रिकॉर्ड नहीं मिला",
  "Save": "सहेजें",
  "Save Changes": "परिवर्तन सहेजें",
  "Cancel": "रद्द करें",
  "Submit": "प्रस्तुत करें",
  "Approve": "स्वीकृत करें",
  "Reject": "अस्वीकार करें",
  "Export": "निर्यात करें",
  "Download": "डाउनलोड",
  "Search": "खोजें",
  "Filter": "फ़िल्टर",
  "All": "सभी",
  "Clear": "साफ़ करें",
  "Apply": "लागू करें",
  "Close": "बंद करें",
  "Back": "पीछे",
  "Next": "अगला",
  "Continue": "जारी रखें",
  "Delete": "हटाएं",
  "Edit": "संपादित करें",
  "View": "देखें",
  "Refresh": "ताज़ा करें",
  "Confirm": "पुष्टि करें",
  "Yes": "हाँ",
  "No": "नहीं",
  "Success": "सफलता",
  "Error": "त्रुटि",
  "Warning": "चेतावनी",
  "Critical": "गंभीर",
  "High": "उच्च",
  "Medium": "मध्यम",
  "Low": "निम्न",
  "CRITICAL": "गंभीर",
  "HIGH": "उच्च",
  "MEDIUM": "मध्यम",
  "LOW": "निम्न",
  "Auto Flagged": "स्वतः चिह्नित",
  "Human Review": "मानव समीक्षा",
  "Info": "सूचना",
  "Active": "सक्रिय",
  "Pending": "लंबित",
  "Approved": "स्वीकृत",
  "Rejected": "अस्वीकृत",
  "Resolved": "हल किया गया",
  "Male": "पुरुष",
  "Female": "महिला",
  "General": "सामान्य (General)",
  "OBC": "अन्य पिछड़ा वर्ग (OBC)",
  "SC": "अनुसूचित जाति (SC)",
  "ST": "अनुसूचित जनजाति (ST)",
  "EWS": "आर्थिक रूप से कमजोर वर्ग (EWS)"
};

// Sorted keys by length descending to match longest phrases first
const SORTED_KEYS = Object.keys(HINDI_DICTIONARY).sort((a, b) => b.length - a.length);

const originalTextMap = new WeakMap<Node, string>();
const originalAttrMap = new WeakMap<Element, Record<string, string>>();

let isTranslating = false;
let observer: MutationObserver | null = null;

function shouldSkip(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  // Skip pure numbers or percentages
  if (/^[\d.,%+\-/#:]+$/.test(trimmed)) return true;
  // Skip URLs, DID identifiers, emails
  if (/^(http|https|mailto|did|data):/i.test(trimmed)) return true;
  if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(trimmed)) return true;
  // Skip JSON / code snippets
  if (/^[{}[\]()<>]+$/.test(trimmed)) return true;
  return false;
}

export function translateText(text: string): string {
  if (shouldSkip(text)) return text;

  const trimmed = text.trim();

  // 1. Direct exact match
  if (HINDI_DICTIONARY[trimmed]) {
    const leadingSpaces = text.match(/^\s*/)?.[0] || '';
    const trailingSpaces = text.match(/\s*$/)?.[0] || '';
    return leadingSpaces + HINDI_DICTIONARY[trimmed] + trailingSpaces;
  }

  // 2. Phrase match for composite texts
  let result = text;
  let hasMatch = false;

  for (const key of SORTED_KEYS) {
    if (key.length >= 3 && result.includes(key)) {
      // Escape special characters in key for regex
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<=^|\\s|[,.:;!?"'()])` + escaped + `(?=$|\\s|[,.:;!?"'()])`, 'g');
      if (regex.test(result)) {
        result = result.replace(regex, HINDI_DICTIONARY[key]);
        hasMatch = true;
      }
    }
  }

  return hasMatch ? result : text;
}

function translateNode(node: Text) {
  if (isTranslating) return;
  const val = node.nodeValue;
  if (!val || !val.trim()) return;

  const parent = node.parentElement;
  if (parent) {
    const tag = parent.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'code' || tag === 'pre') {
      return;
    }
  }

  let original = originalTextMap.get(node);
  if (!original) {
    original = val;
    originalTextMap.set(node, original);
  }

  const translated = translateText(original);
  if (translated !== val) {
    isTranslating = true;
    node.nodeValue = translated;
    isTranslating = false;
  }
}

function restoreNode(node: Text) {
  const original = originalTextMap.get(node);
  if (original && node.nodeValue !== original) {
    isTranslating = true;
    node.nodeValue = original;
    isTranslating = false;
  }
}

function translateElementAttrs(el: Element) {
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') {
    const placeholder = el.getAttribute('placeholder');
    if (placeholder && placeholder.trim()) {
      let orig = originalAttrMap.get(el);
      if (!orig) {
        orig = {};
        originalAttrMap.set(el, orig);
      }
      if (!orig['placeholder']) {
        orig['placeholder'] = placeholder;
      }
      const trans = translateText(orig['placeholder']);
      if (trans !== placeholder) {
        el.setAttribute('placeholder', trans);
      }
    }
  }
}

function restoreElementAttrs(el: Element) {
  const orig = originalAttrMap.get(el);
  if (orig && orig['placeholder']) {
    el.setAttribute('placeholder', orig['placeholder']);
  }
}

export function translateTree(root: Node) {
  if (!root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    translateNode(root as Text);
    return;
  }

  if (root.nodeType === Node.ELEMENT_NODE) {
    translateElementAttrs(root as Element);
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = (node as Element).tagName.toLowerCase();
          if (tag === 'script' || tag === 'style' || tag === 'code' || tag === 'pre') {
            return NodeFilter.FILTER_REJECT;
          }
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      translateNode(current as Text);
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      translateElementAttrs(current as Element);
    }
    current = walker.nextNode();
  }
}

export function restoreTree(root: Node) {
  if (!root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    restoreNode(root as Text);
    return;
  }

  if (root.nodeType === Node.ELEMENT_NODE) {
    restoreElementAttrs(root as Element);
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    null
  );

  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      restoreNode(current as Text);
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      restoreElementAttrs(current as Element);
    }
    current = walker.nextNode();
  }
}

function startObserving() {
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    if (isTranslating) return;
    const currentLang = i18n.language || 'en';
    if (!currentLang.startsWith('hi')) return;

    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        translateNode(mutation.target as Text);
      } else if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            translateNode(node as Text);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            translateTree(node);
          }
        });
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

function stopObserving() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

export function initLanguageObserver(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  const handleLanguage = () => {
    const currentLang = i18n.language || 'en';
    if (currentLang.startsWith('hi')) {
      document.documentElement.lang = 'hi';
      translateTree(document.body);
      startObserving();
    } else {
      document.documentElement.lang = 'en';
      stopObserving();
      restoreTree(document.body);
    }
  };

  i18n.on('languageChanged', handleLanguage);
  handleLanguage();

  return () => {
    i18n.off('languageChanged', handleLanguage);
    stopObserving();
  };
}
