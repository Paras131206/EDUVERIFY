import i18n from './i18n';

// Comprehensive dictionary mapping English UI text to Hindi
export const HINDI_DICTIONARY: Record<string, string> = {
  // Navigation, Personas & Roles
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
  "Institution Admin": "संस्थान व्यवस्थापक",
  "Institution Staff": "संस्थान कर्मचारी",
  "AICTE Admin": "एआईसीटीई व्यवस्थापक",
  "AICTE Analyst": "एआईसीटीई विश्लेषक",
  "DAB Member": "डीएबी सदस्य",
  "Authorized Verifier": "अधिकृत सत्यापनकर्ता",
  "Student": "विद्यार्थी",
  "INSTITUTION ADMIN NAVIGATION": "संस्थान व्यवस्थापक नेविगेशन",
  "INSTITUTION STAFF NAVIGATION": "संस्थान कर्मचारी नेविगेशन",
  "AICTE ADMIN NAVIGATION": "एआईसीटीई व्यवस्थापक नेविगेशन",
  "DAB MEMBER NAVIGATION": "डीएबी सदस्य नेविगेशन",
  "STUDENT NAVIGATION": "विद्यार्थी नेविगेशन",
  "VERIFIER NAVIGATION": "सत्यापनकर्ता नेविगेशन",

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
  "Needs Review": "समीक्षा आवश्यक",
  "Critical Action Needed": "गंभीर कार्रवाई आवश्यक",
  "Good": "अच्छा",
  "Excellent": "उत्कृष्ट",
  "pts improvement": "अंक सुधार",
  "+6.0 pts improvement": "+6.0 अंक सुधार",
  "seats": "सीटें",
  "/ 520 seats": "/ 520 सीटें",
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
  "1 Pending Inbound (15d notice) • 1 Approved Outbound": "1 लंबित आवक (15-दिन नोटिस) • 1 स्वीकृत जावक",
  "Pending Inbound": "लंबित आवक",
  "Approved Outbound": "स्वीकृत जावक",
  "Inbound": "आवक",
  "Outbound": "जावक",
  "15d notice": "15-दिन नोटिस",
  "(15d notice)": "(15-दिन नोटिस)",

  // Issues & Rules (from mock data and rules catalog)
  "APAAR ID format invalid / Excel truncated": "अपार आईडी प्रारूप अमान्य / एक्सेल ट्रंकेटेड",
  "format invalid / Excel truncated": "प्रारूप अमान्य / एक्सेल ट्रंकेटेड",
  "Minor student enrolled without guardian consent record": "अभिभावक सहमति रिकॉर्ड के बिना नामांकित नाबालिग छात्र",
  "Lateral entry student enrolled directly into Year 1 invalid": "प्रथम वर्ष में सीधे नामांकित पार्श्व प्रवेश (Lateral Entry) छात्र अमान्य",
  "Department name whitespace and case normalisation": "विभाग के नाम में अतिरिक्त रिक्त स्थान और केस सामान्यीकरण",
  "Graduation year inconsistent with admission year and program duration": "स्नातक वर्ष प्रवेश वर्ष और कार्यक्रम अवधि के साथ असंगत है",
  "Invalid APAAR ID: length must be exactly 12 digits": "अमान्य अपार आईडी: लंबाई ठीक 12 अंक होनी चाहिए",
  "Probable duplicate person under different APAAR ID within batch": "बैच के भीतर भिन्न अपार आईडी के तहत संभावित डुप्लिकेट व्यक्ति",
  "Quota and nationality mismatch: OCI quota with Indian nationality": "कोटा और राष्ट्रीयता बेमेल: भारतीय राष्ट्रीयता के साथ ओसीआई कोटा",
  "Department name formatted to standard title case and trimmed": "विभाग का नाम मानक शीर्षक केस में स्वरूपित और ट्रिम किया गया",

  // Times & dynamic badges
  "1 New": "1 नई",
  "New": "नई",
  "10 mins ago": "10 मिनट पहले",
  "2 hours ago": "2 घंटे पहले",
  "1 day ago": "1 दिन पहले",
  "mins ago": "मिनट पहले",
  "hours ago": "घंटे पहले",
  "day ago": "दिन पहले",
  "days ago": "दिन पहले",
  "just now": "अभी-अभी",
  "Row": "पंक्ति",
  "Row #": "पंक्ति #",
  "• Row #": "• पंक्ति #",

  // Footer
  "Privacy Policy (DPDP 2023)": "गोपनीयता नीति (DPDP 2023)",
  "AICTE Guidelines": "एआईसीटीई दिशानिर्देश",
  "Built with": "के साथ निर्मित",
  "for Digital India": "डिजिटल इंडिया के लिए",
  "Built with ❤️ for Digital India": "डिजिटल इंडिया के लिए ❤️ से निर्मित",

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
  "Supernumerary": "अतिरिक्त सीटें (सुपरन्यूमरेरी)",
  "SUPERNUMERARY": "अतिरिक्त कोटा",
  "अतिरिक्त सीटें (Supernumerary)": "अतिरिक्त सीटें (सुपरन्यूमरेरी)",
  "अतिरिक्त सीटें (SUPERNUMERARY)": "अतिरिक्त सीटें (सुपरन्यूमरेरी)",
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

  // Review Workspace, Drawers & Queues
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
  "Active Persona": "सक्रिय भूमिका",
  "Approval Authority": "अनुमोदन प्राधिकरण",
  "Propose Only (Requires Admin Approval)": "केवल प्रस्ताव (प्रशासक अनुमोदन आवश्यक)",
  "Issue Resolved": "मुद्दा हल हुआ",
  "Issue Dismissed": "मुद्दा खारिज किया गया",
  "Change Proposed by Staff": "कर्मचारी द्वारा प्रस्तावित परिवर्तन",
  "Proposed Value": "प्रस्तावित मान",
  "Issue Description": "मुद्दा विवरण",
  "AI Root Cause & Reason": "एआई मूल कारण एवं विवरण",
  "Evidence Used": "उपयोग किया गया साक्ष्य",
  "No explicit evidence attributes recorded.": "कोई स्पष्ट साक्ष्य विशेषताएँ दर्ज नहीं हैं।",
  "Accept Fix": "सुधार स्वीकार करें",
  "Edit Value": "मान संपादित करें",
  "Dismiss with Note": "टिप्पणी के साथ खारिज करें",
  "Inspect Row": "पंक्ति का निरीक्षण करें",
  "All Issues": "सभी मुद्दे",
  "Auto-flagged": "स्वतः चिह्नित",
  "Needs human review": "मानव समीक्षा आवश्यक",
  "Dismiss Selected": "चयनित खारिज करें",
  "No Duplicate Clusters Detected": "कोई डुप्लिकेट समूह नहीं मिला",
  "Identity deduplication algorithms found no duplicate student records across intra- or cross-institutional registries.": "पहचान निष्कासन एल्गोरिदम को अंतर-संस्थागत या अंतः-संस्थागत रजिस्ट्रियों में कोई डुप्लिकेट छात्र रिकॉर्ड नहीं मिला।",
  "Same Person": "वही व्यक्ति",
  "Different People": "भिन्न व्यक्ति",
  "Transfer": "स्थानांतरण",
  "Resolve Cluster": "क्लस्टर का समाधान करें",
  "Compare Side-by-Side": "साथ-साथ तुलना करें",
  "Confidence": "विश्वसनीयता",
  "Score": "स्कोर",

  // Transfers
  "Track and adjudicate student transfers between AICTE approved institutions.": "एआईसीटीई अनुमोदित संस्थानों के बीच छात्र स्थानांतरण को ट्रैक एवं निर्णय करें।",
  "Inbound Transfers": "आवक स्थानांतरण (Inbound)",
  "Outbound Transfers": "जावक स्थानांतरण (Outbound)",
  "Student Name": "छात्र का नाम",
  "APAAR ID": "अपार आईडी",
  "Origin Institution": "मूल संस्थान",
  "Destination Institution": "गंतव्य संस्थान",
  "Target Institution": "गंतव्य संस्थान",
  "Transfer Reason": "स्थानांतरण का कारण",
  "Request Date": "अनुरोध तिथि",
  "Deadline": "अंतिम तिथि",
  "AICTE NOC Status": "एआईसीटीई एनओसी स्थिति",
  "Approve Transfer": "स्थानांतरण स्वीकृत करें",
  "Reject Transfer": "स्थानांतरण अस्वीकार करें",
  "Transfer Approved": "स्थानांतरण स्वीकृत हुआ",
  "Transfer Rejected": "स्थानांतरण अस्वीकृत हुआ",
  "Incoming Transfers": "आवक स्थानांतरण",
  "Outgoing Transfers": "जावक स्थानांतरण",
  "New Transfer Request": "नया स्थानांतरण अनुरोध",
  "Decision Notes": "निर्णय टिप्पणियाँ",
  "Target Program": "लक्षित कार्यक्रम",
  "Evidence Reference": "साक्ष्य संदर्भ",
  "15-day AICTE window": "15-दिवसीय एआईसीटीई समयसीमा",
  "Expired / Urgent": "समाप्त / अति आवश्यक",

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
  "Enrolment Status": "नामांकन स्थिति",
  "Enrolled": "नामांकित",
  "Completed": "पूर्ण",
  "Withdrawn": "वापस लिया गया",
  "Suspended": "निलंबित",
  "Transferred": "स्थानांतरित",
  "Transition Status": "स्थिति परिवर्तित करें",
  "Unmask All": "सभी अनमास्क करें",
  "Mask All": "सभी मास्क करें",
  "Student Details": "छात्र विवरण",
  "Audit History": "ऑडिट इतिहास",
  "Declared Intake": "घोषित इंटेक",
  "Uploaded Records": "अपलोड किए गए रिकॉर्ड",
  "Intake Discrepancy": "इंटेक विसंगति",
  "Reconciliation Status": "सुलह स्थिति",
  "Match": "सटीक मिलान",
  "Mismatch": "बेमेल",
  "Excess": "अतिरिक्त",
  "Sanctioned": "स्वीकृत",
  "Actual": "वास्तविक",
  "Save Aggregates": "इंटेक सहेजें",

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
  "Webhooks": "वेबहुक्स",
  "Webhook": "वेबहुक",
  "User Management": "उपयोगकर्ता प्रबंधन",
  "Audit & Compliance": "ऑडिट एवं अनुपालन",
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
  "EWS": "आर्थिक रूप से कमजोर वर्ग (EWS)",

  // Review Workspace Extended
  "Validation Review Workspace": "सत्यापन समीक्षा कार्यक्षेत्र",
  "Explainable Issue Queue": "स्पष्टीकरण योग्य मुद्दा कतार",
  "Prioritised verification errors with AI-driven root cause and safe suggestions": "एआई-संचालित मूल कारण और सुरक्षित सुझावों के साथ प्राथमिकता प्राप्त सत्यापन त्रुटियां",
  "Accept All INFO Normalisations": "सभी सूचना सामान्यीकरण स्वीकार करें",
  "Re-validate Batch": "बैच पुनः सत्यापित करें",
  "Commit Batch to AICTE": "बैच एआईसीटीई को कमिट करें",
  "Committed to AICTE": "एआईसीटीई को कमिट किया गया",
  "Critical Errors Blocking Batch Commit:": "बैच कमिट को रोकने वाली गंभीर त्रुटियां:",
  "APAAR ID formatting or registry mismatches must be corrected or dismissed before AICTE repository commit is allowed.": "एआईसीटीई भंडार कमिट की अनुमति देने से पहले अपार आईडी स्वरूपण या रजिस्ट्री बेमेल को ठीक या खारिज किया जाना चाहिए।",
  "1 Critical Issue Open": "1 गंभीर मुद्दा खुला",
  "Commit Disabled:": "कमिट अक्षम:",
  "Unresolved CRITICAL validation issues remain (e.g. V002).": "अनसुलझे गंभीर (CRITICAL) सत्यापन मुद्दे शेष हैं (उदा. V002)।",
  "All critical issues must be accepted or dismissed before committing.": "कमिट करने से पहले सभी गंभीर मुद्दों को स्वीकार या खारिज किया जाना चाहिए।",
  "Academic Year:": "शैक्षणिक वर्ष:",
  "Total Rows:": "कुल पंक्तियां:",
  "Rule Catalog:": "नियम कैटलॉग:",
  "Loading Batch Review Workspace...": "बैच समीक्षा कार्यक्षेत्र लोड हो रहा है...",
  "Unable to Load Batch Review": "बैच समीक्षा लोड करने में असमर्थ",
  "No Issues or Clusters Found": "कोई मुद्दा या समूह नहीं मिला",
  "Return to Batches": "बैचों पर वापस जाएं",
  "Identity & Deduplication Resolution": "पहचान एवं डुप्लिकेट समाधान",
  "Side-by-side biometric & demographic comparison with per-field similarity weights": "फ़ील्ड-वार समानता भार के साथ बायोमेट्रिक एवं जनसांख्यिकीय तुलना",
  "Select official human verification decision for this cluster:": "इस क्लस्टर के लिए आधिकारिक मानव सत्यापन निर्णय चुनें:",
  "Same person (Merge)": "वही व्यक्ति (विलय करें)",
  "Different people": "भिन्न व्यक्ति",
  "Batch Row": "बैच पंक्ति",
  "Resolved Issues": "हल किए गए मुद्दे",
  "Pending Issues": "लंबित मुद्दे",
  "Fixed or Justified": "सुधारा गया या उचित ठहराया गया",
  "Remaining in Queue": "कतार में शेष",
  "Download DQ comparison XLSX": "DQ तुलना XLSX डाउनलोड करें",
  "Download DQ comparison PDF": "DQ तुलना PDF डाउनलोड करें",
  "Priority Level Impact (Before vs After)": "प्राथमिकता स्तर प्रभाव (पूर्व बनाम पश्चात)",
  "Distribution of open issues across priority bands before and after re-validation": "पुनः सत्यापन से पहले और बाद में प्राथमिकता बैंड में सक्रिय मुद्दों का वितरण",
  "DQ Improvement": "DQ सुधार",
  "+% DQ Improvement": "+% DQ सुधार",
  "Quality Score Progression": "गुणवत्ता स्कोर प्रगति",
  "All Rules": "सभी नियम",
  "All Fields": "सभी फ़ील्ड",
  "All Severities": "सभी गंभीरता",
  "All Priorities": "सभी प्राथमिकताएं",
  "All Buckets": "सभी श्रेणियां",
  "All Statuses": "सभी स्थितियां",
  "Filter by Rule": "नियम अनुसार फ़िल्टर",
  "Filter by Field": "फ़ील्ड अनुसार फ़िल्टर",
  "Filter by Severity": "गंभीरता अनुसार फ़िल्टर",
  "Filter by Priority": "प्राथमिकता अनुसार फ़िल्टर",
  "Filter by Bucket": "श्रेणी अनुसार फ़िल्टर",
  "Filter by Status": "स्थिति अनुसार फ़िल्टर",

  // Transfers Desk Extended
  "Request Student Transfer": "छात्र स्थानांतरण का अनुरोध करें",
  "Incoming Transfer Requests": "आवक स्थानांतरण अनुरोध",
  "Outgoing Transfer Requests": "जावक स्थानांतरण अनुरोध",
  "Transfer ID": "स्थानांतरण आईडी",
  "Source Institution": "स्रोत संस्थान",
  "15d OVERDUE": "15-दिन अतिदेय",
  "15-Day AICTE Statutory Override Rule": "15-दिवसीय एआईसीटीई वैधानिक ओवरराइड नियम",
  "PENDING APPROVAL": "स्वीकृति लंबित",
  "AICTE OVERRIDDEN": "एआईसीटीई ओवरराइड",
  "Loading transfer workflow registry...": "स्थानांतरण वर्कफ़्लो रजिस्ट्री लोड हो रही है...",
  "Governed by Section 8.1: Destination requests, Source approves, AICTE 15-day statutory override": "अनुभाग 8.1 द्वारा शासित: गंतव्य अनुरोध करता है, स्रोत स्वीकृत करता है, एआईसीटीई 15-दिवसीय वैधानिक ओवरराइड",

  // Aggregates Extended & Intake Reconciliation (Images 1 & 2)
  "Aggregate Enrolment Reporting": "कुल नामांकन रिपोर्टिंग",
  "Dedicated submission workspace for institutions in AGGREGATE_ONLY mode and statutory AICTE intake reconciliation": "AGGREGATE_ONLY मोड में संस्थानों के लिए समर्पित सबमिशन कार्यक्षेत्र और वैधानिक एआईसीटीई प्रवेश समाधान",
  "Approved Declared Seats": "स्वीकृत घोषित सीटें",
  "Total Submitted Enrolment": "कुल प्रस्तुत नामांकन",
  "Reconciliation Variance": "सुलह भिन्नता",
  "Sanctioned intake across all active programs": "सभी सक्रिय कार्यक्रमों में स्वीकृत प्रवेश",
  "Fully Reconciled": "पूर्णतः सुलह पूर्ण",
  "Variance Discrepancies": "भिन्नता विसंगतियां",
  "Program Enrolment Breakdown Form": "कार्यक्रम नामांकन विवरण प्रपत्र",
  "Enter total enrolled heads along with supernumerary and foreign quota sub-counts for each program": "प्रत्येक कार्यक्रम के लिए अतिरिक्त और विदेशी कोटा उप-गणना के साथ कुल नामांकित छात्र दर्ज करें",
  "Evaluated under AICTE Rule V022": "एआईसीटीई नियम V022 के तहत मूल्यांकित",
  "Sum of aggregate submissions for 2026-27": "2026-27 के लिए कुल सबमिशन का योग",
  "Sum of aggregate submissions for 2025-26": "2025-26 के लिए कुल सबमिशन का योग",
  "Sum of aggregate submissions for": "के लिए कुल सबमिशन का योग",
  "Academic Year 2026-27": "शैक्षणिक वर्ष 2026-27",
  "Academic Year 2025-26": "शैक्षणिक वर्ष 2025-26",
  "Save & Reconcile": "सहेजें एवं सुलह करें",
  "सहजें & Reconcile": "सहेजें एवं सुलह करें",
  "सहेजें & Reconcile": "सहेजें एवं सुलह करें",
  "Saving...": "सहेजा जा रहा है...",
  "Program Code & Title": "कार्यक्रम कोड एवं शीर्षक",
  "PROGRAM CODE & TITLE": "कार्यक्रम कोड एवं शीर्षक",
  "Program Code & TITLE": "कार्यक्रम कोड एवं शीर्षक",
  "कार्यक्रम कोड & TITLE": "कार्यक्रम कोड एवं शीर्षक",
  "Total Enrolled *": "कुल नामांकित *",
  "Total Enrolled heads": "कुल नामांकित छात्र",
  "FN (Foreign)": "विदेशी (FN)",
  "FN (FOREIGN)": "विदेशी (FN)",
  "(Foreign)": "(विदेशी)",
  "(FOREIGN)": "(विदेशी)",
  "B.Tech in Computer Science & Engineering": "बी.टेक कंप्यूटर साइंस एवं इंजीनियरिंग",
  "B.Tech in Electronics & Communication Engineering": "बी.टेक इलेक्ट्रॉनिक्स एवं संचार इंजीनियरिंग",
  "B.Tech in Mechanical Engineering": "बी.टेक मैकेनिकल इंजीनियरिंग",
  "Master of Business Administration": "मास्टर ऑफ बिजनेस एडमिनिस्ट्रेशन (MBA)",
  "Intake Reconciliation: Declared Quota vs. Submitted Enrolment": "प्रवेश समाधान: घोषित कोटा बनाम प्रस्तुत नामांकन",
  "Declared Quota vs. Submitted Enrolment": "घोषित कोटा बनाम प्रस्तुत नामांकन",
  "Declared कोटा vs. Submitted Enrolment": "घोषित कोटा बनाम प्रस्तुत नामांकन",
  "प्रवेश समाधान: Declared कोटा vs. Submitted Enrolment": "प्रवेश समाधान: घोषित कोटा बनाम प्रस्तुत नामांकन",
  "Comparison between approved sanction from AICTE Approval Portal and actual enrolments reported by institution": "एआईसीटीई अनुमोदन पोर्टल से स्वीकृत सीटों और संस्थान द्वारा रिपोर्ट किए गए वास्तविक नामांकन के बीच तुलना",
  "Comparison between स्वीकृत sanction from AICTE Approval Portal and वास्तविक enrolments reported by institution": "एआईसीटीई अनुमोदन पोर्टल से स्वीकृत सीटों और संस्थान द्वारा रिपोर्ट किए गए वास्तविक नामांकन के बीच तुलना",
  "Automated Audit per Rule V022": "नियम V022 के अनुसार स्वचालित ऑडिट",
  "Automated Audit per नियम V022": "नियम V022 के अनुसार स्वचालित ऑडिट",
  "Automated Audit per": "के अनुसार स्वचालित ऑडिट",
  "Declared (Approved Intake)": "घोषित (स्वीकृत प्रवेश)",
  "DECLARED (Approved Intake)": "घोषित (स्वीकृत प्रवेश)",
  "DECLARED (स्वीकृत प्रवेश)": "घोषित (स्वीकृत प्रवेश)",
  "DECLARED (APPROVED INTAKE)": "घोषित (स्वीकृत प्रवेश)",
  "Submitted Enrolment": "प्रस्तुत नामांकन",
  "SUBMITTED ENROLMENT": "प्रस्तुत नामांकन",
  "Variance (Delta)": "भिन्नता (अंतर (डेल्टा))",
  "VARIANCE (Delta)": "भिन्नता (अंतर (डेल्टा))",
  "VARIANCE (अंतर (डेल्टा))": "भिन्नता (अंतर (डेल्टा))",
  "VARIANCE (DELTA)": "भिन्नता (अंतर (डेल्टा))",
  "EXCESS (OVER-ENROLLED)": "अतिरिक्त (ओवर-नामांकित)",
  "अतिरिक्त (OVER-नामांकित)": "अतिरिक्त (ओवर-नामांकित)",
  "OVER-ENROLLED": "ओवर-नामांकित",
  "(OVER-ENROLLED)": "(ओवर-नामांकित)",
  "(OVER-नामांकित)": "(ओवर-नामांकित)",
  "MISMATCH (UNDER-FILLED)": "बेमेल (अंडर-फिल्ड)",
  "बेमेल (UNDER-FILLED)": "बेमेल (अंडर-फिल्ड)",
  "UNDER-FILLED": "अंडर-फिल्ड",
  "(UNDER-FILLED)": "(अंडर-फिल्ड)",
  "MATCH": "सटीक मिलान",

  // Category Quotas & Seat Allocation Engine (Image 3)
  "ANALYTICAL ENGINE": "विश्लेषणात्मक इंजन",
  "Analytical Engine": "विश्लेषणात्मक इंजन",
  "Statutory Category Quotas & Seat Allocation Engine": "सांविधिक श्रेणी कोटा एवं सीट आवंटन इंजन",
  "Statutory श्रेणी Quotas & Seat Allocation Engine": "सांविधिक श्रेणी कोटा एवं सीट आवंटन इंजन",
  "Statutory Category Quotas": "सांविधिक श्रेणी कोटा",
  "Seat Allocation Engine": "सीट आवंटन इंजन",
  "Real-time compliance monitoring for SC, ST, OBC-NCL, EWS, and General category intake limits under central/state statutory reservation mandates.": "केंद्रीय/राज्य सांविधिक आरक्षण शासनादेशों के तहत SC, ST, OBC-NCL, EWS और सामान्य श्रेणी की प्रवेश सीमाओं की वास्तविक समय अनुपालन निगरानी।",
  "Real-time compliance निगरानी (Monitoring) for SC, ST, अन्य पिछड़ा वर्ग (OBC)-NCL, आर्थिक रूप से कमजोर वर्ग (EWS), and सामान्य (General) श्रेणी intake limits under central/state statutory reservation mandates.": "केंद्रीय/राज्य सांविधिक आरक्षण शासनादेशों के तहत SC, ST, OBC-NCL, EWS और सामान्य श्रेणी की प्रवेश सीमाओं की वास्तविक समय अनुपालन निगरानी।",
  "Real-time compliance monitoring": "वास्तविक समय अनुपालन निगरानी",
  "Real-time compliance": "वास्तविक समय अनुपालन",
  "All Programs (520 Seats)": "सभी कार्यक्रम (520 सीटें)",
  "सभी Programs (520 सीटें)": "सभी कार्यक्रम (520 सीटें)",
  "All Programs": "सभी कार्यक्रम",
  "Programs": "कार्यक्रम",
  "UG-CSE (Computer Science - 60)": "UG-CSE (कंप्यूटर साइंस - 60)",
  "UG-ECE (Electronics - 60)": "UG-ECE (इलेक्ट्रॉनिक्स - 60)",
  "UG-ME (Mechanical - 60)": "UG-ME (मैकेनिकल - 60)",
  "PG-MBA (Management - 40)": "PG-MBA (प्रबंधन - 40)",
  "Adjust Category Quotas": "श्रेणी कोटा समायोजित करें",
  "Adjust श्रेणी Quotas": "श्रेणी कोटा समायोजित करें",
  "Adjust Category Seat Quotas": "श्रेणी सीट कोटा समायोजित करें",
  "Statutory Reservation Quota Breach Detected": "सांविधिक आरक्षण कोटा उल्लंघन का पता चला",
  "STATUTORY RESERVATION QUOTA BREACH DETECTED": "सांविधिक आरक्षण कोटा उल्लंघन का पता चला",
  "STATUTORY RESERVATION कोटा BREACH DETECTED": "सांविधिक आरक्षण कोटा उल्लंघन का पता चला",
  "STATUTORY RESERVATION कोटा BREACH DETECTED (1 श्रेणी ALERT)": "सांविधिक आरक्षण कोटा उल्लंघन का पता चला (1 श्रेणी अलर्ट)",
  "STATUTORY RESERVATION QUOTA BREACH DETECTED (1 CATEGORY ALERT)": "सांविधिक आरक्षण कोटा उल्लंघन का पता चला (1 श्रेणी अलर्ट)",
  "Category Alert": "श्रेणी अलर्ट",
  "CATEGORY ALERT": "श्रेणी अलर्ट",
  "श्रेणी ALERT": "श्रेणी अलर्ट",
  "QUOTA BREACH": "कोटा उल्लंघन",
  "कोटा BREACH": "कोटा उल्लंघन",
  "Quota Breach": "कोटा उल्लंघन",
  "Breach Detected": "उल्लंघन का पता चला",
  "BREACH DETECTED": "उल्लंघन का पता चला",
  "Reallocate Seats": "सीटें पुन: आवंटित करें",
  "Reallocate सीटें": "सीटें पुन: आवंटित करें",
  "Reallocate": "पुन: आवंटित करें",
  "Category Code": "श्रेणी कोड",
  "CATEGORY CODE": "श्रेणी कोड",
  "श्रेणी CODE": "श्रेणी कोड",
  "Statutory Category Name": "सांविधिक श्रेणी का नाम",
  "STATUTORY CATEGORY NAME": "सांविधिक श्रेणी का नाम",
  "STATUTORY श्रेणी NAME": "सांविधिक श्रेणी का नाम",
  "Statutory %": "सांविधिक %",
  "STATUTORY %": "सांविधिक %",
  "Allocated Quota": "आवंटित कोटा",
  "ALLOCATED QUOTA": "आवंटित कोटा",
  "ALLOCATED कोटा": "आवंटित कोटा",
  "Allocated": "आवंटित",
  "ALLOCATED": "आवंटित",
  "Enrolled count": "नामांकित संख्या",
  "नामांकित count": "नामांकित संख्या",
  "exceeds approved statutory quota": "स्वीकृत सांविधिक कोटा से अधिक है",
  "exceeds स्वीकृत statutory कोटा": "स्वीकृत सांविधिक कोटा से अधिक है",
  "exceeds": "से अधिक है",
  "excess students": "अतिरिक्त छात्र",
  "अतिरिक्त students": "अतिरिक्त छात्र",
  "AICTE Rule V012/V015 alert triggered.": "एआईसीटीई नियम V012/V015 अलर्ट ट्रिगर हुआ।",
  "AICTE नियम V012/V015 alert triggered.": "एआईसीटीई नियम V012/V015 अलर्ट ट्रिगर हुआ।",
  "AICTE Rule V012/V015 alert triggered": "एआईसीटीई नियम V012/V015 अलर्ट ट्रिगर हुआ",
  "alert triggered.": "अलर्ट ट्रिगर हुआ।",
  "alert triggered": "अलर्ट ट्रिगर हुआ",
  "Vacancy / Excess": "रिक्तियां / अतिरिक्त",
  "Compliance Status": "अनुपालन स्थिति",
  "COMPLIANCE STATUS": "अनुपालन स्थिति",
  "COMPLIANCE स्थिति": "अनुपालन स्थिति",
  "COMPLIANCE": "अनुपालन",
  "General / Open Merit": "सामान्य / ओपन मेरिट",
  "सामान्य (General) / सक्रिय Merit": "सामान्य / ओपन मेरिट",
  "सक्रिय Merit": "ओपन मेरिट",
  "Open Merit": "ओपन मेरिट",
  "Other Backward Classes (NCL)": "अन्य पिछड़ा वर्ग (OBC-NCL)",
  "Other Backward Classes": "अन्य पिछड़ा वर्ग",
  "Scheduled Castes": "अनुसूचित जाति",
  "Scheduled Castes (अनुसूचित जाति (SC))": "अनुसूचित जाति (SC)",
  "Scheduled Castes (अनुसूचित जाति (SC)):": "अनुसूचित जाति (SC):",
  "Scheduled Tribes": "अनुसूचित जनजाति",
  "Economically Weaker Section": "आर्थिक रूप से कमजोर वर्ग",
  "Economically Weaker Sections": "आर्थिक रूप से कमजोर वर्ग",
  "Persons with Disabilities (Horizontal 5%)": "दिव्यांगजन (क्षैतिज 5%)",
  "Persons with Disabilities": "दिव्यांगजन (PwD)",
  "Horizontal": "क्षैतिज",
  "Horizontal 5%": "क्षैतिज 5%",
  "NEAR LIMIT": "सीमा के निकट",
  "Near Limit": "सीमा के निकट",
  "COMPLIANT": "अनुपालित",
  "Compliant": "अनुपालित",
  "vacant": "रिक्त",
  "Total Approved Ceiling:": "कुल स्वीकृत सीमा:",
  "Total स्वीकृत सीमा:": "कुल स्वीकृत सीमा:",
  "Total Quota Allocated:": "कुल आवंटित कोटा:",
  "Total कोटा Allocated:": "कुल आवंटित कोटा:",
  "Total Category Enrolled:": "कुल श्रेणी नामांकित:",
  "Total श्रेणी नामांकित:": "कुल श्रेणी नामांकित:",
  "Total Approved Ceiling": "कुल स्वीकृत सीमा",
  "Total Quota Allocated": "कुल आवंटित कोटा",
  "Total Category Enrolled": "कुल श्रेणी नामांकित",
  "Automated AICTE Reservation Balancing Active": "स्वचालित एआईसीटीई आरक्षण संतुलन सक्रिय",
  "Automated AICTE Reservation Balancing सक्रिय": "स्वचालित एआईसीटीई आरक्षण संतुलन सक्रिय",
  "Automated AICTE Reservation Balancing": "स्वचालित एआईसीटीई आरक्षण संतुलन",
  "Near Capacity Alert:": "क्षमता के निकट चेतावनी:",
  "Automated admission pipeline approaching threshold.": "स्वचालित प्रवेश पाइपलाइन सीमा के निकट पहुंच रही है।",
  "Category quota seat allocation successfully updated. Automated admission verification refreshed.": "श्रेणी कोटा सीट आवंटन सफलतापूर्वक अद्यतन किया गया। स्वचालित प्रवेश सत्यापन ताज़ा किया गया।",
  "Dynamically adjust statutory category seats for Academic Year 2026-27": "शैक्षणिक वर्ष 2026-27 के लिए सांविधिक श्रेणी सीटों को गतिशील रूप से समायोजित करें",
  "Reallocate seats according to state government notifications or institution reservation orders. Total regular category seats must equal": "राज्य सरकार की अधिसूचनाओं या संस्थान के आरक्षण आदेशों के अनुसार सीटें पुन: आवंटित करें। कुल नियमित श्रेणी की सीटें इसके बराबर होनी चाहिए:",
  "Statutory Base:": "सांविधिक आधार:",
  "Sum of Regular Category Seats:": "नियमित श्रेणी सीटों का योग:",
  "Save & Apply Quotas": "कोटा सहेजें एवं लागू करें",
  "Total": "कुल",
  "TOTAL": "कुल",
  "students": "छात्र",
  "students.": "छात्र।",
  "student": "छात्र",
  "Students": "छात्र",
  "STUDENTS": "छात्र",
  "SEATS": "सीटें",
  "Seats": "सीटें",
  "intake": "प्रवेश",
  "Intake": "प्रवेश",
  "INTAKE": "प्रवेश",
  "Declared": "घोषित",
  "DECLARED": "घोषित",
  "Variance": "भिन्नता",
  "VARIANCE": "भिन्नता",
  "Reconciliation": "सुलह",
  "RECONCILIATION": "सुलह",

  // Students Registry Extended
  "Student / Roll / PRN": "छात्र / रोल / पीआरएन",
  "Full Legal Name": "पूर्ण कानूनी नाम",
  "Date of Birth (YYYY-MM-DD)": "जन्म तिथि (YYYY-MM-DD)",
  "Category (Social Reservation)": "श्रेणी (सामाजिक आरक्षण)",
  "Program Code": "कार्यक्रम कोड",
  "Course Level": "पाठ्यक्रम स्तर",
  "Admission Date": "प्रवेश तिथि",
  "Admission Type": "प्रवेश प्रकार",
  "Seat Type": "सीट प्रकार",
  "Quota Category": "कोटा श्रेणी",
  "DPDP Consent Status": "DPDP सहमति स्थिति",
  "Loading student records...": "छात्र रिकॉर्ड लोड हो रहे हैं...",
  "Loading student registry...": "छात्र रजिस्ट्री लोड हो रही है...",

  // Step 1: File Choose & Session
  "Official Student Ingestion Template": "आधिकारिक छात्र अंतर्ग्रहण टेम्पलेट",
  "Official Ingestion Template": "आधिकारिक अंतर्ग्रहण टेम्पलेट",
  "Pre-formatted with 12-digit APAAR text validation, dropdown lists for categories & quotas, and field instructions.": "12-अंकीय अपार पाठ सत्यापन, श्रेणियों और कोटे के लिए ड्रॉपडाउन सूची, और फ़ील्ड निर्देशों के साथ पूर्व-स्वरूपित।",
  "Download Template (.xlsx)": "टेम्पलेट डाउनलोड करें (.xlsx)",
  "Download Template": "टेम्पलेट डाउनलोड करें",
  "Step 1: Choose File & Academic Session": "चरण 1: फ़ाइल चुनें एवं शैक्षणिक सत्र",
  "Choose File & Academic Session": "फ़ाइल चुनें एवं शैक्षणिक सत्र",
  "Select the target academic year and upload student admission records (CSV or XLSX up to 10 MB).": "लक्षित शैक्षणिक वर्ष चुनें और छात्र प्रवेश रिकॉर्ड (CSV या XLSX 10 MB तक) अपलोड करें।",
  "2026-27 (Current Academic Year)": "2026-27 (वर्तमान शैक्षणिक वर्ष)",
  "Current Academic Year": "वर्तमान शैक्षणिक वर्ष",
  "(Current Academic Year)": "(वर्तमान शैक्षणिक वर्ष)",
  "Records will be validated against this year's AICTE approved intake.": "रिकॉर्ड को इस वर्ष की एआईसीटीई स्वीकृत प्रवेश क्षमता के अनुसार सत्यापित किया जाएगा।",
  "Records will be validated against this year’s AICTE approved intake.": "रिकॉर्ड को इस वर्ष की एआईसीटीई स्वीकृत प्रवेश क्षमता के अनुसार सत्यापित किया जाएगा।",
  "Replaces Previous Batch": "पिछला बैच प्रतिस्थापित करें",
  "REPLACES PREVIOUS BATCH": "पिछला बैच प्रतिस्थापित करें",
  "Replaces Previous Batch (Optional)": "पिछला बैच प्रतिस्थापित करें (वैकल्पिक)",
  "REPLACES PREVIOUS BATCH (OPTIONAL)": "पिछला बैच प्रतिस्थापित करें (वैकल्पिक)",
  "Optional": "वैकल्पिक",
  "(Optional)": "(वैकल्पिक)",
  "-- None (New independent batch) --": "-- कोई नहीं (नया स्वतंत्र बैच) --",
  "-- None (new independent batch) --": "-- कोई नहीं (नया स्वतंत्र बैच) --",
  "None (New independent batch)": "कोई नहीं (नया स्वतंत्र बैच)",
  "None (new independent batch)": "कोई नहीं (नया स्वतंत्र बैच)",
  "New independent batch": "नया स्वतंत्र बैच",
  "new independent batch": "नया स्वतंत्र बैच",
  "If replacing an earlier revision, previous uncommitted records will be marked SUPERSEDED.": "यदि किसी पूर्व संशोधन को प्रतिस्थापित कर रहे हैं, तो पिछले असंबद्ध रिकॉर्ड को 'अतिक्रमित' (SUPERSEDED) चिह्नित किया जाएगा।",
  "Select or Drop Batch File": "बैच फ़ाइल चुनें या यहाँ छोड़ें",
  "SELECT OR DROP BATCH FILE": "बैच फ़ाइल चुनें या यहाँ छोड़ें",
  "SELECT OR DROP BATCH FILE *": "बैच फ़ाइल चुनें या यहाँ छोड़ें *",
  "Drag & drop batch file here, or click to browse": "बैच फ़ाइल यहाँ खींचें और छोड़ें, या ब्राउज़ करने के लिए क्लिक करें",
  "Drop file here to upload...": "अपलोड करने के लिए फ़ाइल यहाँ छोड़ें...",
  "Supports .csv, .xlsx, .xls up to 10 MB per file": ".csv, .xlsx, .xls प्रति फ़ाइल 10 MB तक समर्थित",
  "Want to test real verification with errors?": "त्रुटियों के साथ वास्तविक सत्यापन का परीक्षण करना चाहते हैं?",
  "Use Demo File: batch_2_errors.xlsx": "डेमो फ़ाइल का उपयोग करें: batch_2_errors.xlsx",
  "Use Demo File:": "डेमो फ़ाइल का उपयोग करें:",
  "Ready for smart column mapping": "स्मार्ट कॉलम मैपिंग के लिए तैयार",
  "Remove": "हटाएं",
  "Idempotency protection enabled (UUID key generated per upload)": "आइडम्पोटेंसी सुरक्षा सक्षम (प्रति अपलोड UUID कुंजी उत्पन्न)",
  "Proceed to Column Mapping": "कॉलम मैपिंग पर आगे बढ़ें",
  "Uploading Batch...": "बैच अपलोड हो रहा है...",
  "File rejected. Please upload a valid CSV or XLSX file under 10 MB.": "फ़ाइल अस्वीकृत। कृपया 10 MB से कम की मान्य CSV या XLSX फ़ाइल अपलोड करें।",
  "File size exceeds the 10 MB limit.": "फ़ाइल का आकार 10 MB की सीमा से अधिक है।",
  "Batch Conflict (HTTP 409) — Open Batch Exists": "बैच विरोध (HTTP 409) — खुला बैच मौजूद है",
  "Go to Open Batch": "खुले बैच पर जाएं",
  "Set as Batch to Supersede & Retry": "अतिक्रमित करने हेतु बैच सेट करें और पुनः प्रयास करें",

  // Step 2: Smart Column Mapping
  "Step 2: Smart Column Mapping": "चरण 2: स्मार्ट कॉलम मैपिंग",
  "Smart Column Mapping": "स्मार्ट कॉलम मैपिंग",
  "Auto-mapped all canonical fields": "सभी विहित फ़ील्ड स्वतः मैप किए गए",
  "Required Fields Mapped": "आवश्यक फ़ील्ड मैप किए गए",
  "Analyzing spreadsheet headers with smart synonym dictionary...": "स्मार्ट समानार्थी शब्दकोश के साथ स्प्रेडशीट हेडर का विश्लेषण जारी...",
  "Rule V001: Required Column Missing After Column Mapping": "नियम V001: कॉलम मैपिंग के बाद आवश्यक कॉलम अनुपलब्ध",
  "Mandatory canonical fields are currently unmapped:": "अनिवार्य विहित फ़ील्ड वर्तमान में अनमैप हैं:",
  "Per AICTE Rule V001, batches cannot proceed to validation until all 22 required fields are explicitly mapped.": "एआईसीटीई नियम V001 के अनुसार, सभी 22 आवश्यक फ़ील्ड स्पष्ट रूप से मैप होने तक बैच सत्यापन पर आगे नहीं बढ़ सकते।",
  "Auto-Map Remaining Canonical Fields": "शेष विहित फ़ील्ड स्वतः मैप करें",
  "Auto-Map Canonical Fields": "विहित फ़ील्ड स्वतः मैप करें",
  "Spreadsheet Header → Canonical Field Mapping": "स्प्रेडशीट हेडर → विहित फ़ील्ड मैपिंग",
  "Verify each detected column. APAAR values are masked automatically.": "प्रत्येक पहचाने गए कॉलम को सत्यापित करें। अपार मान स्वतः मास्क किए जाते हैं।",
  "columns identified": "कॉलम पहचाने गए",
  "Save as my institution's mapping profile": "मेरे संस्थान के मैपिंग प्रोफ़ाइल के रूप में सहेजें",
  "Save as my institution’s mapping profile": "मेरे संस्थान के मैपिंग प्रोफ़ाइल के रूप में सहेजें",
  "Future uploads from this institution with matching headers will be automatically mapped with highest confidence (Saved Profile method).": "मिलान वाले हेडर के साथ इस संस्थान से भविष्य के अपलोड उच्चतम विश्वसनीयता (सहेजी गई प्रोफ़ाइल विधि) के साथ स्वचालित रूप से मैप किए जाएंगे।",
  "Back to File Selection": "फ़ाइल चयन पर वापस जाएं",
  "V001 Active: Map all required fields to confirm": "V001 सक्रिय: पुष्टि करने के लिए सभी आवश्यक फ़ील्ड मैप करें",
  "Confirm Mapping & Start Validation": "मैपिंग की पुष्टि करें एवं सत्यापन प्रारंभ करें",
  "Saving Mapping...": "मैपिंग सहेजी जा रही है...",

  // Step 2: Table Headers & Labels
  "Suggested Canonical Field": "सुझाया गया विहित फ़ील्ड",
  "SUGGESTED CANONICAL FIELD": "सुझाया गया विहित फ़ील्ड",
  "Method": "विधि",
  "METHOD": "विधि",
  "Sample Values Preview (APAAR Masked)": "नमूना मान पूर्वावलोकन (अपार मास्क किया गया)",
  "SAMPLE VALUES PREVIEW (APAAR MASKED)": "नमूना मान पूर्वावलोकन (अपार मास्क किया गया)",
  "Sample Values Preview": "नमूना मान पूर्वावलोकन",
  "SAMPLE VALUES PREVIEW": "नमूना मान पूर्वावलोकन",
  "CONFIDENCE": "विश्वसनीयता",
  "SOURCE COLUMN": "स्रोत कॉलम",
  "Mandatory Canonical Field": "अनिवार्य विहित फ़ील्ड",
  "Mandatory Canonical": "अनिवार्य विहित",
  "Mandatory": "अनिवार्य",

  // Step 2: Mapping Methods
  "Synonym": "समानार्थी",
  "Fuzzy Match": "फ़ज़ी मिलान",
  "Fuzzy": "फ़ज़ी",
  "Pattern / Regex": "पैटर्न / रेगेक्स",
  "Pattern": "पैटर्न",
  "Regex": "रेगेक्स",
  "Saved Profile": "सहेजी गई प्रोफ़ाइल",
  "User Selected": "उपयोगकर्ता द्वारा चयनित",

  // Step 2: Canonical Field Select Options & Simulated Source Headers
  "-- Select Canonical Field --": "-- विहित फ़ील्ड चुनें --",
  "Institution Student / Roll / PRN *": "संस्थान छात्र / रोल / पीआरएन *",
  "Institution Student / Roll / PRN": "संस्थान छात्र / रोल / पीआरएन",
  "Institution Student": "संस्थान छात्र",
  "AICTE Institution ID *": "एआईसीटीई संस्थान आईडी *",
  "AICTE Institution ID": "एआईसीटीई संस्थान आईडी",
  "APAAR ID (12 digits) *": "अपार आईडी (12-अंकीय) *",
  "APAAR ID (12 digits)": "अपार आईडी (12-अंकीय)",
  "Full Name *": "पूरा नाम *",
  "Full Name": "पूरा नाम",
  "Date of Birth (YYYY-MM-DD) *": "जन्म तिथि (YYYY-MM-DD) *",
  "Gender (M/F/T) *": "लिंग (M/F/T) *",
  "Gender (M/F/T)": "लिंग (M/F/T)",
  "Category (GEN/EWS/OBC-NCL/SC/ST) *": "श्रेणी (GEN/EWS/OBC-NCL/SC/ST) *",
  "Category (GEN/EWS/OBC-NCL/SC/ST)": "श्रेणी (GEN/EWS/OBC-NCL/SC/ST)",
  "Person with Disability (PWD) *": "दिव्यांग व्यक्ति (PWD) *",
  "Person with Disability (PWD)": "दिव्यांग व्यक्ति (PWD)",
  "Person with Disability": "दिव्यांग व्यक्ति",
  "Program Code *": "कार्यक्रम कोड *",
  "Course Level (UG/PG/DIPLOMA/PHD) *": "पाठ्यक्रम स्तर (UG/PG/DIPLOMA/PHD) *",
  "Course Level (UG/PG/DIPLOMA/PHD)": "पाठ्यक्रम स्तर (UG/PG/DIPLOMA/PHD)",
  "Department Name *": "विभाग का नाम *",
  "Department Name": "विभाग का नाम",
  "Dept": "विभाग",
  "Academic Year *": "शैक्षणिक वर्ष *",
  "Year of Study (1-6) *": "अध्ययन का वर्ष (1-6) *",
  "Year of Study (1-6)": "अध्ययन का वर्ष (1-6)",
  "Admission Date (YYYY-MM-DD) *": "प्रवेश तिथि (YYYY-MM-DD) *",
  "Admission Date (YYYY-MM-DD)": "प्रवेश तिथि (YYYY-MM-DD)",
  "Adm Date": "प्रवेश तिथि",
  "Admission Type (REGULAR/LATERAL/TRANSFER_IN) *": "प्रवेश प्रकार (REGULAR/LATERAL/TRANSFER_IN) *",
  "Admission Type (REGULAR/LATERAL/TRANSFER_IN)": "प्रवेश प्रकार (REGULAR/LATERAL/TRANSFER_IN)",
  "Expected Graduation Year *": "अपेक्षित स्नातक वर्ष *",
  "Expected Graduation Year": "अपेक्षित स्नातक वर्ष",
  "Seat Type (REGULAR/SUPERNUMERARY) *": "सीट प्रकार (REGULAR/अतिरिक्त सीटें) *",
  "Seat Type (REGULAR/SUPERNUMERARY)": "सीट प्रकार (REGULAR/अतिरिक्त सीटें)",
  "Supernumerary Scheme (TFW/PMSSS/JK/NE/etc.) *": "अतिरिक्त सीटें योजना (TFW/PMSSS/JK/NE/इत्यादि) *",
  "Supernumerary Scheme (TFW/PMSSS/JK/NE/etc.)": "अतिरिक्त सीटें योजना (TFW/PMSSS/JK/NE/इत्यादि)",
  "Supernumerary Scheme": "अतिरिक्त सीटें योजना",
  "Quota (NONE/NRI/OCI/FN/PIO/CIWG) *": "कोटा (NONE/NRI/OCI/FN/PIO/CIWG) *",
  "Quota (NONE/NRI/OCI/FN/PIO/CIWG)": "कोटा (NONE/NRI/OCI/FN/PIO/CIWG)",
  "Quota": "कोटा",
  "Nationality (ISO-2 Code) *": "राष्ट्रीयता (ISO-2 कोड) *",
  "Nationality (ISO-2 Code)": "राष्ट्रीयता (ISO-2 कोड)",
  "Nationality": "राष्ट्रीयता",
  "NRI Status *": "एनआरआई (NRI) स्थिति *",
  "NRI Status": "एनआरआई (NRI) स्थिति",
  "NRI स्थिति *": "एनआरआई (NRI) स्थिति *",
  "NRI स्थिति": "एनआरआई (NRI) स्थिति",
  "OCI Status *": "ओसीआई (OCI) स्थिति *",
  "OCI Status": "ओसीआई (OCI) स्थिति",
  "OCI स्थिति *": "ओसीआई (OCI) स्थिति *",
  "OCI स्थिति": "ओसीआई (OCI) स्थिति",
  "Foreign National Status *": "विदेशी नागरिक स्थिति *",
  "Foreign National Status": "विदेशी नागरिक स्थिति",
  "Foreign National": "विदेशी नागरिक",
  "Foreign National स्थिति *": "विदेशी नागरिक स्थिति *",
  "Foreign National स्थिति": "विदेशी नागरिक स्थिति",
  "Enrolment Status (ACTIVE/WITHDRAWN/etc.) *": "नामांकन स्थिति (सक्रिय/वापस लिया गया/इत्यादि) *",
  "Enrolment Status (ACTIVE/WITHDRAWN/etc.)": "नामांकन स्थिति (सक्रिय/वापस लिया गया/इत्यादि)",
  "Consent Status (GRANTED/REFUSED) *": "सहमति स्थिति (स्वीकृत/अस्वीकृत) *",
  "Consent Status (GRANTED/REFUSED)": "सहमति स्थिति (स्वीकृत/अस्वीकृत)",
  "Consent Status": "सहमति स्थिति",
  "Consent स्थिति *": "सहमति स्थिति *",
  "Consent स्थिति": "सहमति स्थिति",
  "Consent": "सहमति",
  "Consent Date *": "सहमति तिथि *",
  "Consent Date": "सहमति तिथि",
  "Guardian Consent (if < 18) *": "अभिभावक सहमति (यदि < 18) *",
  "Guardian Consent (if < 18)": "अभिभावक सहमति (यदि < 18)",
  "Guardian Consent": "अभिभावक सहमति",
  "Email Address *": "ईमेल पता *",
  "Email Address": "ईमेल पता",
  "Mobile Number *": "मोबाइल नंबर *",
  "Mobile Number": "मोबाइल नंबर",

  // Metadata prefixes
  "File:": "फ़ाइल:",
  "File": "फ़ाइल",
  "Target Academic Year:": "लक्षित शैक्षणिक वर्ष:",
  "Target Academic Year": "लक्षित शैक्षणिक वर्ष",
  "Target शैक्षणिक वर्ष:": "लक्षित शैक्षणिक वर्ष:",
  "Batch ID:": "बैच आईडी:",


  // Step 3: Validate
  "Step 3: Real-Time Engine Validation": "चरण 3: वास्तविक समय इंजन सत्यापन",
  "Real-Time Engine Validation": "वास्तविक समय इंजन सत्यापन",
  "Step 3: Validation Engine Progress": "चरण 3: सत्यापन इंजन प्रगति",
  "Streaming live telemetry from AICTE Verification Engine": "एआईसीटीई सत्यापन इंजन से लाइव टेलीमेट्री स्ट्रीमिंग जारी",
  "Validating student admission records against national AICTE statutory guidelines...": "राष्ट्रीय एआईसीटीई वैधानिक दिशानिर्देशों के अनुसार छात्र प्रवेश रिकॉर्ड का सत्यापन जारी...",
  "Live SSE EventStream Connected": "लाइव SSE इवेंटस्ट्रीम कनेक्टेड",
  "Polling Fallback Active (GET /v1/batches/:id)": "पोलिंग फ़ॉलबैक सक्रिय (GET /v1/batches/:id)",
  "Multi-Stage Ingestion Pipeline": "बहु-चरणीय अंतर्ग्रहण पाइपलाइन",
  "MULTI-STAGE INGESTION PIPELINE": "बहु-चरणीय अंतर्ग्रहण पाइपलाइन",
  "1. Parsing": "1. पार्सिंग",
  "Checking file structure, header encoding, and row delimiters": "फ़ाइल संरचना, हेडर एन्कोडिंग और पंक्ति विभाजक की जाँच जारी",
  "2. Mapping": "2. मैपिंग",
  "Applying canonical column dictionary and data type coercions": "विहित कॉलम शब्दकोश और डेटा प्रकार परिवर्तन लागू करना",
  "3. Rules Engine": "3. नियम इंजन",
  "Evaluating 35 AICTE validation rules (V001–V035)": "35 एआईसीटीई सत्यापन नियमों (V001–V035) का मूल्यांकन",
  "4. Duplicates": "4. डुप्लिकेट पहचान",
  "Running Demographics + APAAR intra-batch & cross-institution match": "जनसांख्यिकी + अपार अंतः-बैच एवं अंतर-संस्थान मिलान जारी",
  "5. Anomalies": "5. विसंगति पहचान",
  "Detecting quota distribution drift and statistical z-score outliers": "कोटा वितरण विचलन और सांख्यिकीय z-स्कोर आउटलेयर की पहचान",
  "6. Report Generation": "6. रिपोर्ट तैयार करना",
  "Computing Quality Score gauge and intake reconciliation metrics": "गुणवत्ता स्कोर गेज और प्रवेश समाधान मेट्रिक्स की गणना",
  "Validation Complete. Quality score and issues ready for review.": "सत्यापन पूर्ण हुआ। गुणवत्ता स्कोर एवं मुद्दे समीक्षा के लिए तैयार हैं।",
  "Quality score and issues ready for review.": "गुणवत्ता स्कोर एवं मुद्दे समीक्षा के लिए तैयार हैं।",
  "Quality score and issues ready for review": "गुणवत्ता स्कोर एवं मुद्दे समीक्षा के लिए तैयार हैं",
  "Streaming live validation logs...": "लाइव सत्यापन लॉग स्ट्रीमिंग जारी...",
  "View Result Summary": "परिणाम सारांश देखें",
  "Result Summary": "परिणाम सारांश",
  "Validation in Progress": "सत्यापन प्रगति पर है",
  "Validation Complete": "सत्यापन पूर्ण हुआ",
  "Proceed to Summary": "सारांश पर आगे बढ़ें",
  "Passed": "सफल",
  "PASSED": "सफल",
  "Running...": "प्रगति पर...",
  "Queued": "कतारबद्ध",

  // Step 4: Summary
  "Step 4: Batch Validation Summary & Health Report": "चरण 4: बैच सत्यापन सारांश एवं स्वास्थ्य रिपोर्ट",
  "Review detailed validation results, error breakdown, and intake ceiling reconciliation before committing records.": "रिकॉर्ड कमिट करने से पहले विस्तृत सत्यापन परिणाम, त्रुटि विवरण और प्रवेश सीमा समाधान की समीक्षा करें।",
  "Ingestion & Quality Summary": "अंतर्ग्रहण एवं गुणवत्ता सारांश",
  "Download Report (XLSX)": "रिपोर्ट डाउनलोड करें (XLSX)",
  "Download PDF Report": "PDF रिपोर्ट डाउनलोड करें",
  "Download XLSX": "XLSX डाउनलोड करें",
  "Total Records Processed": "कुल प्रसंस्कृत रिकॉर्ड",
  "Valid Records (Zero Errors)": "मान्य रिकॉर्ड (शून्य त्रुटियां)",
  "Records with Warnings": "चेतावनियों वाले रिकॉर्ड",
  "Records with Critical Errors": "गंभीर त्रुटियों वाले रिकॉर्ड",
  "Intake Ceiling vs Uploaded Headcount": "स्वीकृत प्रवेश सीमा बनाम अपलोड की गई संख्या",
  "Program-wise reconciliation against AICTE approved ceilings": "एआईसीटीई स्वीकृत सीमा के विरुद्ध कार्यक्रम-वार समाधान",
  "Detected Schema Drift": "पहचाना गया स्कीमा विचलन",
  "Schema Drift Detected": "पहचाना गया स्कीमा विचलन",
  "Row Validation Status": "पंक्ति सत्यापन स्थिति",
  "Total Uploaded:": "कुल अपलोड:",
  "Total Uploaded": "कुल अपलोड",
  "Valid Clean Rows:": "मान्य स्वच्छ पंक्तियां:",
  "Valid Clean Rows": "मान्य स्वच्छ पंक्तियां",
  "Rows with Warnings:": "चेतावनियों वाली पंक्तियां:",
  "Rows with Warnings": "चेतावनियों वाली पंक्तियां",
  "Rows with Errors:": "त्रुटियों वाली पंक्तियां:",
  "Rows with Errors": "त्रुटियों वाली पंक्तियां",
  "Issues by Priority Risk": "प्राथमिकता जोखिम के अनुसार मुद्दे",
  "Review Bucket Queue": "समीक्षा बकेट कतार",
  "Program Intake Capacity & Excess Evaluation": "कार्यक्रम प्रवेश क्षमता एवं अतिरिक्त मूल्यांकन",
  "Evaluated against AICTE Approved Sanctioned Intake": "एआईसीटीई स्वीकृत स्वीकृत प्रवेश के विरुद्ध मूल्यांकित",
  "EXCESS DETECTED": "अतिरिक्त प्रवेश पाया गया",
  "Within Capacity": "क्षमता के भीतर",
  "AICTE Approved:": "एआईसीटीई स्वीकृत:",
  "AICTE Approved": "एआईसीटीई स्वीकृत",
  "Total Enrolled:": "कुल नामांकित:",
  "Supernumerary:": "अतिरिक्त सीटें:",
  "Excess / Breach:": "अतिरिक्त / उल्लंघन:",
  "Excess / Breach": "अतिरिक्त / उल्लंघन",
  "Reconciliation Strip: Declared Total vs Ingested APAAR Records": "समाधान पट्टी: घोषित कुल बनाम अंतर्ग्रहीत अपार रिकॉर्ड",
  "Declared Capacity:": "घोषित क्षमता:",
  "Declared Capacity": "घोषित क्षमता",
  "Uploaded Records:": "अपलोड किए गए रिकॉर्ड:",
  "Delta:": "अंतर (डेल्टा):",
  "Delta": "अंतर (डेल्टा)",
  "Reconciled (Match)": "समाधानित (सटीक मिलान)",
  "Mismatch Delta": "बेमेल अंतर (डेल्टा)",
  "Next Step: Human-in-the-Loop Issue Resolution": "अगला चरण: ह्यूमन-इन-द-लूप मुद्दा समाधान",
  "Open Review Workspace": "समीक्षा कार्यक्षेत्र खोलें",

  // Commit Modal
  "Commit Batch to Central Repository": "बैच को केंद्रीय भंडार में कमिट करें",
  "Committed Records": "कमिट किए गए रिकॉर्ड",
  "Approved & Verifiable": "स्वीकृत एवं सत्यापन योग्य",
  "Excluded Records": "बहिष्कृत रिकॉर्ड",
  "Pending Human Review": "मानव समीक्षा लंबित",
  "Excluded / Unapproved Rows:": "बहिष्कृत / अस्वीकृत पंक्तियां:",
  "Excluded rows will remain in draft status and will NOT be committed until resolved.": "बहिष्कृत पंक्तियां ड्राफ्ट स्थिति में रहेंगी और समाधान होने तक कमिट नहीं की जाएंगी।",
  "Once committed, students will be issued SD-JWT credentials keyed to their 12-digit APAAR ID and become eligible for verification desks.": "एक बार कमिट होने के बाद, छात्रों को उनके 12-अंकीय अपार आईडी से जुड़े SD-JWT क्रेडेंशियल जारी किए जाएंगे और वे सत्यापन डेस्क के लिए पात्र हो जाएंगे।",

  // Settings Tab (Image 1)
  "Institution Administration & Settings": "संस्थान प्रशासन एवं सेटिंग्स",
  "Institution Administration": "संस्थान प्रशासन",
  "Self-service institutional API keys, team role assignments, webhooks, and security compliance": "स्वयं-सेवा संस्थागत एपीआई कुंजियां, टीम भूमिका आवंटन, वेबहुक, और सुरक्षा अनुपालन",
  "Self-service institutional": "स्वयं-सेवा संस्थागत",
  "Institutional API Keys": "संस्थागत एपीआई कुंजियां",
  "Institutional": "संस्थागत",
  "Provision high-throughput API credentials for programmatic CSV/JSON ingestion from your campus ERP": "अपने कैंपस ERP से प्रोग्रामेटिक CSV/JSON अंतर्ग्रहण हेतु उच्च-थ्रूपुट एपीआई क्रेडेंशियल्स प्राप्त करें",
  "+ Generate New Key": "+ नई कुंजी बनाएं",
  "Generate New Key": "नई कुंजी बनाएं",
  "Generate New": "नया बनाएं",
  "Key Name": "कुंजी का नाम",
  "KEY NAME": "कुंजी का नाम",
  "Prefix": "उपसर्ग (Prefix)",
  "PREFIX": "उपसर्ग (Prefix)",
  "Scopes": "अनुमतियां (Scopes)",
  "SCOPES": "अनुमतियां (Scopes)",
  "Created": "सृजन तिथि",
  "CREATED": "सृजन तिथि",
  "Last Used": "अंतिम उपयोग",
  "LAST USED": "अंतिम उपयोग",
  "Revoke": "रद्द करें",
  "Never": "कभी नहीं",
  "REVOKED": "रद्द किया गया",
  "Authorized Institution Users": "अधिकृत संस्थान उपयोगकर्ता",
  "Manage roles and access permissions for academic registrars and data entry staff": "शैक्षणिक कुलसचिवों और डेटा प्रविष्टि कर्मचारियों के लिए भूमिकाएं और पहुंच अनुमतियां प्रबंधित करें",
  "Invite Staff Member": "कर्मचारी को आमंत्रित करें",
  "Invite User": "उपयोगकर्ता को आमंत्रित करें",
  "Staff Name": "कर्मचारी का नाम",
  "Official Email": "आधिकारिक ईमेल",
  "Assigned Role": "सौंपी गई भूमिका",
  "Last Sign-In": "अंतिम साइन-इन",
  "Pending Activation": "सक्रियण लंबित",
  "Audit Trail Cryptographic Integrity": "ऑडिट ट्रेल क्रिप्टोग्राफ़िक सत्यनिष्ठा",
  "Verify the SHA-256 hash-chain of all institutional batch actions, reviews, and overrides": "सभी संस्थागत बैच कार्रवाइयों, समीक्षाओं और ओवरराइड्स की SHA-256 हैश-चेन सत्यापित करें",
  "Hash-Chain Status: VERIFIED": "हैश-चेन स्थिति: सत्यापित",
  "All 142 audit entries are linked by immutable previous-hash pointers. Zero tampering detected.": "सभी 142 ऑडिट प्रविष्टियां अपरिवर्तनीय पूर्व-हैश पॉइंटर्स द्वारा जुड़ी हैं। कोई छेड़छाड़ नहीं मिली।",
  "Current Anchor Hash:": "वर्तमान एंकर हैश:",
  "Webhook Notification Hub": "वेबहुक अधिसूचना केंद्र",
  "Real-time HMAC-signed webhooks for batch validation completion and inter-institution duplicate alerts": "बैच सत्यापन पूर्ण होने और अंतर-संस्थान डुप्लिकेट अलर्ट के लिए वास्तविक समय HMAC-हस्ताक्षरित वेबहुक",
  "Endpoint:": "समापन बिंदु (Endpoint):",
  "Algorithm:": "एल्गोरिदम:",
  "Test Webhook Delivery": "वेबहुक वितरण परीक्षण करें",
  "Configured Webhook Endpoints": "कॉन्फ़िगर किए गए वेबहुक एंडपॉइंट्स",
  "Real-time HMAC-signed HTTP notifications dispatched on batch ingestion, student lifecycle, and transfer events": "बैच अंतर्ग्रहण, छात्र जीवनचक्र और स्थानांतरण घटनाओं पर प्रेषित रीयल-टाइम HMAC-हस्ताक्षरित HTTP सूचनाएं",
  "Register Webhook": "वेबहुक पंजीकृत करें",
  "Target URL": "लक्षित URL",
  "Subscribed Events": "सदस्यता प्राप्त घटनाएं",
  "No webhooks registered. Click \"Register Webhook\" to integrate campus ERP.": "कोई वेबहुक पंजीकृत नहीं है। कैंपस ERP को एकीकृत करने के लिए \"वेबहुक पंजीकृत करें\" पर क्लिक करें।",
  "Send Test": "परीक्षण भेजें",
  "Webhook Delivery Log & Telemetry": "वेबहुक वितरण लॉग एवं टेलीमेट्री",
  "Last 10 Dispatches": "अंतिम 10 प्रेषण",
  "Inspection log with HTTP status codes, latency, and automatic exponential backoff retry counts": "HTTP स्थिति कोड, विलंबता और स्वचालित घातीय बैकऑफ़ पुनः प्रयास गणना के साथ निरीक्षण लॉग",
  "Event Type": "इवेंट का प्रकार",
  "Payload Summary": "पेलोड सारांश",
  "Latency": "विलंबता",
  "Retry Count": "पुनः प्रयास संख्या",
  "No delivery events recorded yet. Send a test ping to verify endpoint connectivity.": "अभी तक कोई वितरण घटना दर्ज नहीं की गई है। एंडपॉइंट कनेक्टिविटी सत्यापित करने के लिए परीक्षण पिंग भेजें।",
  "HMAC-SHA256 Signature Verification Snippet": "HMAC-SHA256 हस्ताक्षर सत्यापन स्निपेट",
  "Copy and paste into your server backend to authenticate the X-EduVerify-Signature request header": "X-EduVerify-Signature अनुरोध शीर्षलेख को प्रमाणित करने के लिए अपने सर्वर बैकएंड में कॉपी और पेस्ट करें",
  "Copy Snippet": "स्निपेट कॉपी करें",
  "Copied": "कॉपी किया गया",
  "API Key Generated": "एपीआई कुंजी उत्पन्न की गई",
  "Generate Institutional API Key": "संस्थागत एपीआई कुंजी बनाएं",
  "Key Identifier / Friendly Name": "कुंजी पहचानकर्ता / नाम",
  "Allowed Scopes": "अनुमत कार्यक्षेत्र (Scopes)",
  "upload:batches — Upload CSV/XLSX spreadsheets & confirm mappings": "upload:batches — CSV/XLSX स्प्रेडशीट अपलोड करें एवं मैपिंग की पुष्टि करें",
  "read:reports — Fetch batch validation reports & anomaly metrics": "read:reports — बैच सत्यापन रिपोर्ट एवं विसंगति मेट्रिक्स प्राप्त करें",
  "Create Key": "कुंजी बनाएं",
  "Important: Copy your secret key now!": "महत्वपूर्ण: अपनी गुप्त कुंजी अभी कॉपी करें!",
  "This secret token will never be shown again. If you lose this key, you will need to revoke it and generate a new one.": "यह गुप्त टोकन फिर कभी नहीं दिखाया जाएगा। यदि आप यह कुंजी खो देते हैं, तो आपको इसे रद्द करके एक नई कुंजी उत्पन्न करनी होगी।",
  "Generated API Key Secret": "उत्पन्न एपीआई कुंजी सीक्रेट",
  "I Have Safely Saved This Key": "मैंने इस कुंजी को सुरक्षित रूप से सहेज लिया है",
  "Invite Institution Staff": "संस्थान कर्मचारियों को आमंत्रित करें",
  "Institutional Email Address": "संस्थागत ईमेल पता",
  "Institutional Role": "संस्थागत भूमिका",
  "Institution Staff (Upload & Edit Drafts)": "संस्थान कर्मचारी (ड्राफ्ट अपलोड एवं संपादित करें)",
  "Institution Admin (Sign-off & Commit to Central Repo)": "संस्थान व्यवस्थापक (हस्ताक्षर करें एवं केंद्रीय भंडार में कमिट करें)",
  "Send Invitation": "निमंत्रण भेजें",
  "Register New Webhook": "नया वेबहुक पंजीकृत करें",
  "Endpoint Destination URL": "एंडपॉइंट गंतव्य URL",
  "Must be an accessible HTTPS endpoint capable of receiving JSON POST payloads.": "JSON POST पेलोड प्राप्त करने में सक्षम एक सुलभ HTTPS एंडपॉइंट होना चाहिए।",
  "Subscribed Event Topics": "सदस्यता प्राप्त घटना विषय",
  "Register Endpoint": "एंडपॉइंट पंजीकृत करें",
  "Webhook Signing Secret Generated": "वेबहुक हस्ताक्षर सीक्रेट उत्पन्न हुआ",
  "Notice: Secret Displayed Only Once": "सूचना: सीक्रेट केवल एक बार प्रदर्शित किया जाता है",
  "For security reasons, this HMAC shared secret will never be displayed again. Store it in your server's secure vault or environment variables to verify incoming event signatures.": "सुरक्षा कारणों से, यह HMAC साझा रहस्य फिर कभी प्रदर्शित नहीं किया जाएगा। आने वाले इवेंट हस्ताक्षरों को सत्यापित करने के लिए इसे अपने सर्वर के सुरक्षित वॉल्ट या पर्यावरण चर में संग्रहीत करें।",
  "HMAC Signing Secret Key": "HMAC हस्ताक्षर सीक्रेट कुंजी",
  "I Have Safely Saved This Secret": "मैंने इस सीक्रेट को सुरक्षित रूप से सहेज लिया है",

  // Statutory Reports & Quality Audits (Image 2)
  "Statutory Reports & Quality Audits": "सांविधिक रिपोर्ट एवं गुणवत्ता ऑडिट",
  "Generate AICTE policy reports, NBA/NAAC accreditation summaries, intake monitoring, and reservation compliance packages.": "एआईसीटीई नीति रिपोर्ट, NBA/NAAC प्रत्यायन सारांश, प्रवेश निगरानी और आरक्षण अनुपालन पैकेज तैयार करें।",
  "प्रतिवेदन एवं सांविधिक लेखापरीक्षा · Generate AICTE policy reports, NBA/NAAC accreditation summaries, intake monitoring, and reservation compliance packages.": "प्रतिवेदन एवं सांविधिक लेखापरीक्षा · एआईसीटीई नीति रिपोर्ट, NBA/NAAC प्रत्यायन सारांश, प्रवेश निगरानी और आरक्षण अनुपालन पैकेज तैयार करें।",
  "Generate Authority Access Link": "प्राधिकरण एक्सेस लिंक उत्पन्न करें",
  "Annual Policy Report": "वार्षिक नीति रिपोर्ट",
  "National intake ceilings, excess enrollments, and state seat utilization.": "राष्ट्रीय प्रवेश सीमाएं, अतिरिक्त नामांकन, और राज्य सीट उपयोग।",
  "Accreditation Audit": "प्रत्यायन ऑडिट",
  "NBA/NAAC multi-tab student intake, faculty ratios, and referential integrity.": "NBA/NAAC बहु-टैब छात्र प्रवेश, संकाय अनुपात, और संदर्भात्मक सत्यनिष्ठा।",
  "Seat Monitoring": "सीट निगरानी",
  "Supernumerary schemes (TFW/PMSSS/JK), NRI/OCI/FN shares by state.": "अतिरिक्त सीटें (सुपरन्यूमरेरी योजनाएं - TFW/PMSSS/JK), राज्यवार NRI/OCI/FN हिस्सेदारी।",
  "Reservation Compliance": "आरक्षण अनुपालन",
  "Statutory GEN/OBC/SC/ST/EWS breakdown and quota audit certificate.": "सांविधिक GEN/अन्य पिछड़ा वर्ग (OBC)/SC/ST/आर्थिक रूप से कमजोर वर्ग (EWS) विवरण और कोटा ऑडिट प्रमाणपत्र।",
  "Custom Report Builder": "कस्टम रिपोर्ट बिल्डर",
  "Configure report scope, institutional filters, target demographic dimensions, and output format.": "रिपोर्ट दायरा, संस्थागत फ़िल्टर, लक्षित जनसांख्यिकीय आयाम और आउटपुट प्रारूप कॉन्फ़िगर करें।",
  "1. Report Type": "1. रिपोर्ट का प्रकार",
  "1. REPORT TYPE": "1. रिपोर्ट का प्रकार",
  "POLICY — National & State Intake Policy Report": "नीति — राष्ट्रीय एवं राज्य प्रवेश नीति रिपोर्ट",
  "ACCREDITATION — NBA/NAAC Institutional Audit": "प्रत्यायन — NBA/NAAC संस्थागत ऑडिट",
  "ACCREDITATION — NBA/NAAC Multi-Program Accreditation Reconciliation": "प्रत्यायन — NBA/NAAC बहु-कार्यक्रम प्रत्यायन समाधान",
  "MONITORING — Seat Utilization & Supernumerary Quotas": "निगरानी — सीट उपयोग एवं अतिरिक्त कोटा",
  "MONITORING — Supernumerary Quota & Seat Utilization Ledger": "निगरानी — अतिरिक्त कोटा एवं सीट उपयोग लेज़र",
  "REGULATORY — Statutory Reservation & Quota Compliance": "विनियामक — सांविधिक आरक्षण एवं कोटा अनुपालन",
  "REGULATORY — Statutory Reservation (SC/ST/OBC/EWS) Audit": "विनियामक — सांविधिक आरक्षण (SC/ST/OBC/EWS) ऑडिट",
  "2. Academic Year": "2. शैक्षणिक वर्ष",
  "2. ACADEMIC YEAR": "2. शैक्षणिक वर्ष",
  "2026-27 (Current Active Batch)": "2026-27 (वर्तमान सक्रिय बैच)",
  "2025-26 (Previous Audited Year)": "2025-26 (पिछला ऑडिट किया गया वर्ष)",
  "2024-25 (Archived Census)": "2024-25 (अभिलेखागार जनगणना)",
  "3. State Scope": "3. राज्य दायरा (Scope)",
  "3. STATE SCOPE": "3. राज्य दायरा (Scope)",
  "All India (National Aggregation)": "अखिल भारतीय (राष्ट्रीय संकलन)",
  "Maharashtra (27)": "महाराष्ट्र (27)",
  "Delhi NCT (07)": "दिल्ली एनसीटी (07)",
  "Karnataka (29)": "कर्नाटक (29)",
  "Tamil Nadu (33)": "तमिलनाडु (33)",
  "Uttar Pradesh (09)": "उत्तर प्रदेश (09)",
  "Gujarat (24)": "गुजरात (24)",
  "Haryana (06)": "हरियाणा (06)",
  "4. Program Discipline": "4. कार्यक्रम अनुशासन (Discipline)",
  "4. PROGRAM DISCIPLINE": "4. कार्यक्रम अनुशासन (Discipline)",
  "All Disciplines & Programs": "सभी विषय एवं कार्यक्रम",
  "B.Tech Computer Science & Engineering": "बी.टेक कंप्यूटर साइंस एवं इंजीनियरिंग",
  "B.Tech Electronics & Communication": "बी.टेक इलेक्ट्रॉनिक्स एवं संचार",
  "B.Tech Mechanical Engineering": "बी.टेक मैकेनिकल इंजीनियरिंग",
  "Master of Business Administration (MBA)": "मास्टर ऑफ बिजनेस एडमिनिस्ट्रेशन (MBA)",
  "Master of Computer Applications (MCA)": "मास्टर ऑफ कंप्यूटर एप्लीकेशन (MCA)",
  "5. Reservation Category": "5. आरक्षण श्रेणी",
  "5. RESERVATION CATEGORY": "5. आरक्षण श्रेणी",
  "5. RESERVATION श्रेणी": "5. आरक्षण श्रेणी",
  "All Social Categories": "सभी सामाजिक श्रेणियां",
  "General (Unreserved)": "सामान्य (अनारक्षित)",
  "General (Open Merit)": "सामान्य (ओपन मेरिट)",
  "Other Backward Classes (OBC-NCL)": "अन्य पिछड़ा वर्ग (OBC-NCL)",
  "Scheduled Castes (SC)": "अनुसूचित जाति (SC)",
  "Scheduled Tribes (ST)": "अनुसूचित जनजाति (ST)",
  "Economically Weaker Section (EWS)": "आर्थिक रूप से कमजोर वर्ग (EWS)",
  "Economically Weaker Sections (EWS)": "आर्थिक रूप से कमजोर वर्ग (EWS)",
  "Persons with Disabilities (PwD)": "दिव्यांगजन (PwD)",
  "6. Output Format": "6. आउटपुट प्रारूप",
  "6. OUTPUT FORMAT": "6. आउटपुट प्रारूप",
  "PDF (Print A4)": "PDF (प्रिंट A4)",
  "XLSX (Excel)": "XLSX (एक्सेल)",
  "* Reports are compiled live from the central verified repository and rendered using WeasyPrint print styles.": "* रिपोर्ट केंद्रीय सत्यापित भंडार से लाइव संकलित की जाती हैं और WeasyPrint प्रिंट शैलियों का उपयोग करके प्रस्तुत की जाती हैं।",
  "Generate PDF Report": "पीडीएफ रिपोर्ट तैयार करें",
  "Generate XLSX Report": "एक्सेल रिपोर्ट तैयार करें",
  "Compiling & Rendering Report...": "रिपोर्ट संकलित एवं प्रस्तुत की जा रही है...",
  "Report Job Complete": "रिपोर्ट कार्य पूर्ण हुआ",
  "Compiled across": "के पार संकलित",
  "Generated Reports History": "तैयार की गई रिपोर्ट का इतिहास",
  "Audit trail of compiled policy documents, accreditation tables, and statutory downloads.": "संकलित नीति दस्तावेजों, प्रत्यायन तालिकाओं और सांविधिक डाउनलोड का ऑडिट ट्रेल।",
  "Search reports...": "रिपोर्ट खोजें...",
  "All Types": "सभी प्रकार",
  "All Formats": "सभी प्रारूप",
  "Policy": "नीति (Policy)",
  "Accreditation": "प्रत्यायन (Accreditation)",
  "Monitoring": "निगरानी (Monitoring)",
  "Regulatory": "विनियामक (Regulatory)",
  "Report ID": "रिपोर्ट आईडी",
  "REPORT ID": "रिपोर्ट आईडी",
  "Title & Scope": "शीर्षक एवं दायरा",
  "TITLE & SCOPE": "शीर्षक एवं दायरा",
  "TYPE": "प्रकार",
  "FORMAT": "प्रारूप",
  "GENERATED AT": "तैयार करने का समय",
  "Year:": "वर्ष:",
  "State:": "राज्य:",
  "Program:": "कार्यक्रम:",
  "Size": "आकार",
  "SIZE": "आकार",
  "No reports match the selected filters.": "चयनित फ़िल्टर से मेल खाने वाली कोई रिपोर्ट नहीं मिली।",
  "PDF PREVIEW": "PDF पूर्वावलोकन",
  "XLSX PREVIEW": "XLSX पूर्वावलोकन",
  "All India Council for Technical Education": "अखिल भारतीय तकनीकी शिक्षा परिषद",
  "अखिल भारतीय तकनीकी शिक्षा परिषद · Statutory Body under Ministry of Education, Govt. of India": "अखिल भारतीय तकनीकी शिक्षा परिषद · शिक्षा मंत्रालय, भारत सरकार के अधीन सांविधिक निकाय",
  "Ref:": "संदर्भ:",
  "Date:": "दिनांक:",
  "Executive Summary & Key Indicators": "कार्यकारी सारांश एवं मुख्य संकेतक",
  "Institutions Covered": "शामिल संस्थान",
  "Total Students": "कुल छात्र",
  "Compliance Score": "अनुपालन स्कोर",
  "Scope & Regulatory Parameters": "दायरा एवं विनियामक पैरामीटर",
  "State Jurisdiction:": "राज्य क्षेत्राधिकार:",
  "Program Specialization:": "कार्यक्रम विशेषज्ञता:",
  "Category Filter:": "श्रेणी फ़िल्टर:",
  "Cryptographic Audit Chain:": "क्रिप्टोग्राफ़िक ऑडिट श्रृंखला:",
  "Generated & Authenticated by:": "द्वारा तैयार एवं प्रमाणित:",
  "Digital Seal:": "डिजिटल मुहर:",

  // Verifier Tab (Image 3)
  "PUBLIC VERIFIER": "सार्वजनिक सत्यापनकर्ता",
  "Authorized Credential Verification Portal": "अधिकृत प्रमाणपत्र सत्यापन पोर्टल",
  "Real-time verification of SD-JWT credentials against AICTE trust roots and national status lists": "एआईसीटीई ट्रस्ट रूट्स और राष्ट्रीय स्थिति सूचियों के विरुद्ध SD-JWT क्रेडेंशियल्स का रीयल-टाइम सत्यापन",
  "AICTE Trust Root Connected": "एआईसीटीई ट्रस्ट रूट कनेक्टेड",
  "Verify Student Presentation": "विद्यार्थी प्रस्तुति सत्यापित करें",
  "Accepts raw SD-JWT presentation strings or full verification URLs generated from the Student Wallet": "छात्र वॉलेट से उत्पन्न रॉ SD-JWT प्रस्तुति स्ट्रिंग्स या पूर्ण सत्यापन URL स्वीकार करता है",
  "Presentation Token / Share Link:": "प्रस्तुति टोकन / साझाकरण लिंक:",
  "PRESENTATION TOKEN / SHARE LINK:": "प्रस्तुति टोकन / साझाकरण लिंक:",
  "Presentation Token / Share Link": "प्रस्तुति टोकन / साझाकरण लिंक",
  "PRESENTATION TOKEN / SHARE LINK": "प्रस्तुति टोकन / साझाकरण लिंक",
  "Paste presentation string (eyJh...~WyJz...~eyJ0...) or http://localhost:5173/verify?presentation=...": "प्रस्तुति स्ट्रिंग पेस्ट करें (eyJh...~WyJz...~eyJ0...) या http://localhost:5173/verify?presentation=...",
  "Verify Credential Presentation": "प्रमाणपत्र प्रस्तुति सत्यापित करें",
  "Verifying Cryptographic Proofs...": "क्रिप्टोग्राफ़िक प्रमाण सत्यापित किए जा रहे हैं...",
  "VALID CREDENTIAL": "मान्य प्रमाणपत्र",
  "TRUSTED ISSUER": "विश्वसनीय जारीकर्ता",
  "Cryptographic proofs validated: Ed25519 issuer signature intact • Hardware key binding verified": "क्रिप्टोग्राफ़िक प्रमाण मान्य: Ed25519 जारीकर्ता हस्ताक्षर बरकरार • हार्डवेयर कुंजी बाइंडिंग सत्यापित",
  "Verified:": "सत्यापित:",
  "INVALID CREDENTIAL": "अमान्य प्रमाणपत्र",
  "TAMPER DETECTED": "छेड़छाड़ का पता चला",
  "Checked:": "जांचा गया:",
  "SUPERSEDED CREDENTIAL": "प्रतिस्थापित प्रमाणपत्र",
  "NEW VERSION EXISTS": "नया संस्करण उपलब्ध है",
  "A newer student record version exists; ask the holder for an updated verifiable credential.": "एक नया छात्र रिकॉर्ड संस्करण मौजूद है; धारक से एक अद्यतन सत्यापन योग्य प्रमाणपत्र मांगें।",
  "SUSPENDED CREDENTIAL": "निलंबित प्रमाणपत्र",
  "CONSENT WITHDRAWN": "सहमति वापस ली गई",
  "Holder has withdrawn VERIFICATION_SHARE consent under Section 8.4. No student data is revealed.": "धारक ने धारा 8.4 के तहत VERIFICATION_SHARE सहमति वापस ले ली है। कोई छात्र डेटा प्रकट नहीं किया गया है।",
  "Cryptographic Audit Proofs": "क्रिप्टोग्राफ़िक ऑडिट प्रमाण",
  "Issuing Authority:": "जारीकर्ता प्राधिकरण:",
  "Trust Registry Status:": "ट्रस्ट रजिस्ट्री स्थिति:",
  "Verified AICTE Trust List": "सत्यापित एआईसीटीई ट्रस्ट सूची",
  "Untrusted Authority": "अविश्वसनीय प्राधिकरण",
  "Checked Timestamp:": "सत्यापन समय:",
  "Hardware Key Binding:": "हार्डवेयर कुंजी बाइंडिंग:",
  "✓ ECDSA P-256 Validated": "✓ ECDSA P-256 मान्य",
  "Unbound": "अबाध्य (Unbound)",
  "Verification Reasons & Statutory Checks:": "सत्यापन कारण एवं सांविधिक जांच:",
  "Disclosed Student Attributes": "प्रकट की गई छात्र विशेषताएं (Claims)",
  "Fields Revealed": "फ़ील्ड प्रकट किए गए",
  "Selective disclosure zero-knowledge guarantee: non-disclosed claims were never transmitted to verifier": "चयनात्मक प्रकटीकरण ज़ीरो-नॉलेज गारंटी: अप्रकट दावे कभी भी सत्यापनकर्ता को प्रेषित नहीं किए गए",
  "Claim Key": "दावा कुंजी (Claim Key)",
  "Attribute Value": "विशेषता मान (Attribute Value)",
  "Cryptographically Disclosed": "क्रिप्टोग्राफ़िक रूप से प्रकट",
  "No claims disclosed because the holder has suspended verification consent under Section 8.4.": "कोई दावा प्रकट नहीं किया गया क्योंकि धारक ने धारा 8.4 के तहत सत्यापन सहमति को निलंबित कर दिया है।",
  "No selective claims were disclosed in this presentation.": "इस प्रस्तुति में कोई चयनात्मक दावा प्रकट नहीं किया गया था।",

  // Institution Dashboard, Empty States, Deduplication & Authority Link (Screenshots 1-5)
  "Reset Stats to Zero": "आंकड़े शून्य पर रीसेट करें",
  "Reset stats to zero to simulate fresh state": "ताज़ा स्थिति का अनुकरण करने के लिए आंकड़े शून्य पर रीसेट करें",
  "Authority File Link": "प्राधिकरण फ़ाइल लिंक",
  "Authority फ़ाइल Link": "प्राधिकरण फ़ाइल लिंक",
  "Authority File Access Link": "प्राधिकरण फ़ाइल एक्सेस लिंक",
  "Load Demo Document": "डेमो दस्तावेज़ लोड करें",

  "No Student Data Uploaded Yet": "अभी तक कोई छात्र डेटा अपलोड नहीं हुआ",
  "No विद्यार्थी Data Uploaded Yet": "अभी तक कोई छात्र डेटा अपलोड नहीं हुआ",
  "No student admission batches have been ingested yet. All enrolment statistics, data quality scores, and statutory validation checks are currently set to zero. Upload your institution's batch file or load the demo document to populate real-time analytics.": "अभी तक कोई छात्र प्रवेश बैच अंतर्ग्रहीत नहीं किया गया है। सभी नामांकन आंकड़े, डेटा गुणवत्ता स्कोर और वैधानिक सत्यापन वर्तमान में शून्य पर सेट हैं। वास्तविक समय के विश्लेषण देखने के लिए अपने संस्थान की बैच फ़ाइल अपलोड करें या डेमो दस्तावेज़ लोड करें।",
  "No विद्यार्थी admission batches have been ingested yet. सभी enrolment statistics, data quality scores, and statutory validation checks are currently set to zero. Upload your institution's batch फ़ाइल or load the demo document to populate real-time analytics.": "अभी तक कोई छात्र प्रवेश बैच अंतर्ग्रहीत नहीं किया गया है। सभी नामांकन आंकड़े, डेटा गुणवत्ता स्कोर और वैधानिक सत्यापन वर्तमान में शून्य पर सेट हैं। वास्तविक समय के विश्लेषण देखने के लिए अपने संस्थान की बैच फ़ाइल अपलोड करें या डेमो दस्तावेज़ लोड करें।",

  "Awaiting batch data upload": "बैच डेटा अपलोड की प्रतीक्षा है",
  "No student records uploaded": "कोई छात्र रिकॉर्ड अपलोड नहीं हुआ",
  "No विद्यार्थी रिकॉर्ड uploaded": "कोई छात्र रिकॉर्ड अपलोड नहीं हुआ",
  "No Issues Pending": "कोई मुद्दा लंबित नहीं",
  "No Issues लंबित": "कोई मुद्दा लंबित नहीं",
  "0 Pending Inbound • 0 Outbound": "0 लंबित आवक • 0 जावक",
  "0 Pending Inbound": "0 लंबित आवक",
  "0 Outbound": "0 जावक",

  "Institution-Wide & Cross-Institution Deduplication Engine": "संस्थान-व्यापी एवं अंतर-संस्थान डुप्लिकेट पहचान इंजन",
  "Rules V007 · V008 · V010 · V011": "नियम V007 · V008 · V010 · V011",
  "Rules V007 &middot; V008 &middot; V010 &middot; V011": "नियम V007 · V008 · V010 · V011",
  "Rules": "नियम",
  "Biometric Soundex & Jaro-Winkler phonetic algorithms continuously check duplicates across all batches in this institution as well as cross-institutional dual-enrolments in the National AICTE Central Repository.": "बायोमेट्रिक साउंडेक्स और जेरो-विंकलर ध्वन्यात्मक एल्गोरिदम इस संस्थान के सभी बैचों के साथ-साथ राष्ट्रीय एआईसीटीई केंद्रीय भंडार में अंतर-संस्थागत दोहरे नामांकनों की निरंतर जांच करते हैं।",
  "Biometric Soundex &amp; Jaro-Winkler phonetic algorithms continuously check duplicates across all batches in this institution as well as cross-institutional dual-enrolments in the National AICTE Central Repository.": "बायोमेट्रिक साउंडेक्स और जेरो-विंकलर ध्वन्यात्मक एल्गोरिदम इस संस्थान के सभी बैचों के साथ-साथ राष्ट्रीय एआईसीटीई केंद्रीय भंडार में अंतर-संस्थागत दोहरे नामांकनों की निरंतर जांच करते हैं।",
  "Biometric Soundex & Jaro-Winkler phonetic algorithms continuously check duplicates across सभी batches in this institution as well as cross-institutional dual-enrolments in the National AICTE Central Repository.": "बायोमेट्रिक साउंडेक्स और जेरो-विंकलर ध्वन्यात्मक एल्गोरिदम इस संस्थान के सभी बैचों के साथ-साथ राष्ट्रीय एआईसीटीई केंद्रीय भंडार में अंतर-संस्थागत दोहरे नामांकनों की निरंतर जांच करते हैं।",

  "Intra-Batch Duplicates:": "अंतः-बैच डुप्लिकेट:",
  "Intra-Batch Duplicates": "अंतः-बैच डुप्लिकेट",
  "Intra-Batch Duplicates: None": "अंतः-बैच डुप्लिकेट: कोई नहीं",
  "Intra-Batch Duplicates: None Detected": "अंतः-बैच डुप्लिकेट: कोई नहीं मिला",
  "Cross-Institution Matches:": "अंतर-संस्थान मिलान:",
  "Cross-Institution Matches": "अंतर-संस्थान मिलान",
  "Cross-Institution Matches: 1 Flagged": "अंतर-संस्थान मिलान: 1 ध्वजांकित",
  "Cross-Institution Matches: None Detected": "अंतर-संस्थान मिलान: कोई नहीं मिला",
  "1 Flagged": "1 ध्वजांकित",
  "None Detected": "कोई नहीं मिला",
  "None": "कोई नहीं",
  "Inspect Deduplication Resolution Desk": "डुप्लिकेट समाधान डेस्क का निरीक्षण करें",
  "निरीक्षण करें Deduplication Resolution Desk": "डुप्लिकेट समाधान डेस्क का निरीक्षण करें",
  "Deduplication Resolution Desk": "डुप्लिकेट समाधान डेस्क",
  "Fuzzy Match Confidence:": "फ़ज़ी मिलान विश्वसनीयता:",
  "Fuzzy Match Confidence": "फ़ज़ी मिलान विश्वसनीयता",

  "No Historical Batch Data": "कोई ऐतिहासिक बैच डेटा नहीं",
  "Batch-by-batch data quality progression will plot here automatically once batches are uploaded and validated.": "बैच अपलोड और सत्यापित होने के बाद बैच-वार डेटा गुणवत्ता प्रगति यहाँ स्वतः प्रदर्शित होगी।",
  "No Enrolment Records": "कोई नामांकन रिकॉर्ड नहीं",
  "No Enrolment रिकॉर्ड": "कोई नामांकन रिकॉर्ड नहीं",
  "Intake ceiling comparisons per program will populate once student admission batches are uploaded.": "छात्र प्रवेश बैच अपलोड होने के बाद कार्यक्रम-वार प्रवेश सीमा तुलना यहाँ प्रदर्शित होगी।",
  "Intake ceiling comparisons per program will populate once विद्यार्थी admission batches are uploaded.": "छात्र प्रवेश बैच अपलोड होने के बाद कार्यक्रम-वार प्रवेश सीमा तुलना यहाँ प्रदर्शित होगी।",
  "No Open Issues": "कोई सक्रिय मुद्दा नहीं",
  "No सक्रिय मुद्दे": "कोई सक्रिय मुद्दा नहीं",
  "No data uploaded yet. Ingest student admission records to run statutory validation checks.": "अभी तक कोई डेटा अपलोड नहीं हुआ। वैधानिक सत्यापन जांच चलाने के लिए छात्र प्रवेश रिकॉर्ड अंतर्ग्रहीत करें।",
  "No data uploaded yet. Ingest विद्यार्थी admission रिकॉर्ड to run statutory validation checks.": "अभी तक कोई डेटा अपलोड नहीं हुआ। वैधानिक सत्यापन जांच चलाने के लिए छात्र प्रवेश रिकॉर्ड अंतर्ग्रहीत करें।",
  "No Notifications": "कोई सूचना नहीं",
  "Regulatory alerts, deadline notices, and ingestion events will appear here once active.": "सक्रिय होने पर नियामक अलर्ट, अंतिम तिथि नोटिस और अंतर्ग्रहण घटनाएं यहाँ दिखाई देंगी।",
  "Regulatory alerts, अंतिम तिथि notices, and ingestion events will appear here once सक्रिय.": "सक्रिय होने पर नियामक अलर्ट, अंतिम तिथि नोटिस और अंतर्ग्रहण घटनाएं यहाँ दिखाई देंगी।",

  // Step 4 Summary specific additions
  "Auto Flag": "स्वतः चिह्नित",
  "Header '": "शीर्षक '",
  "' has shifted from canonical '": "' प्रामाणिक '",
  "' has shifted from canonical": "' प्रामाणिक",
  "has shifted from canonical": "प्रामाणिक से बदला है",
  "Column mapping profile updated to maintain backward compatibility.": "पश्चगामी संगतता बनाए रखने के लिए कॉलम मैपिंग प्रोफ़ाइल अद्यतन की गई।",
  "Column mapping profile updated to maintain backward compatibility": "पश्चगामी संगतता बनाए रखने के लिए कॉलम मैपिंग प्रोफ़ाइल अद्यतन की गई",
  "error(s) and": "त्रुटि(यां) और",
  "त्रुटि(s) and": "त्रुटि(यां) और",
  "candidate records": "उम्मीदवार रिकॉर्ड",
  "candidate records.": "उम्मीदवार रिकॉर्ड।",
  "candidate रिकॉर्ड": "उम्मीदवार रिकॉर्ड",
  "candidate रिकॉर्ड.": "उम्मीदवार रिकॉर्ड।",
  "You can accept automated suggestions, edit cells with inline rationale, or dismiss items.": "आप स्वचालित सुझाव स्वीकार कर सकते हैं, इनलाइन औचित्य के साथ सेल संपादित कर सकते हैं, या खारिज कर सकते हैं।",
  "You can accept automated suggestions, संपादित करें cells with inline rationale, or dismiss items.": "आप स्वचालित सुझाव स्वीकार कर सकते हैं, इनलाइन औचित्य के साथ सेल संपादित कर सकते हैं, या खारिज कर सकते हैं।",

  // Authority Modal & Gateway Access
  "Generate Authority-Restricted Link": "प्राधिकरण-प्रतिबंधित लिंक उत्पन्न करें",
  "Grant role-scoped, cryptographic file access exclusively to verified authorities": "केवल सत्यापित प्राधिकरणों को भूमिका-आधारित, क्रिप्टोग्राफ़िक फ़ाइल एक्सेस प्रदान करें",
  "Zero-Trust Access Control:": "शून्य-विश्वास एक्सेस नियंत्रण (Zero-Trust):",
  "Zero-Trust Access Control: Only users possessing active credentials for the selected authority role will be permitted to open and download the file. Unauthorized users will receive a 403 Forbidden security block.": "ज़ीरो-ट्रस्ट एक्सेस नियंत्रण: केवल चयनित प्राधिकरण भूमिका के लिए सक्रिय क्रेडेंशियल रखने वाले उपयोगकर्ताओं को फ़ाइल खोलने और डाउनलोड करने की अनुमति होगी। अनधिकृत उपयोगकर्ताओं को 403 निषिद्ध सुरक्षा ब्लॉक प्राप्त होगा।",
  "Authorized Authority Role": "अधिकृत प्राधिकरण भूमिका",
  "Restricted Resource / File": "प्रतिबंधित संसाधन / फ़ाइल",
  "Link Expiration Window": "लिंक समाप्ति समयसीमा",
  "24 Hours": "24 घंटे",
  "7 Days": "7 दिन",
  "30 Days": "30 दिन",
  "Generated Authorized Access Link:": "उत्पन्न अधिकृत एक्सेस लिंक:",
  "Test Access Link": "एक्सेस लिंक का परीक्षण करें",
  "Active persona:": "सक्रिय भूमिका:",
  "Statutory Category Reservation & Quota Clearance Certificate": "वैधानिक श्रेणी आरक्षण एवं कोटा मंजूरी प्रमाणपत्र",
  "AICTE Ingestion Quality & Compliance Audit Report (PDF)": "एआईसीटीई अंतर्ग्रहण गुणवत्ता एवं अनुपालन ऑडिट रिपोर्ट (PDF)",
  "Batch Ingestion Ledger & Deduplication Audit Log (Excel)": "बैच अंतर्ग्रहण खाता एवं डुप्लिकेट पहचान ऑडिट लॉग (Excel)",
  "Student Cryptographic SD-JWT Verification Package": "छात्र क्रिप्टोग्राफ़िक SD-JWT सत्यापन पैकेज",
  "EduVerify Authority File Access Gateway": "एडुवेरीफाई प्राधिकरण फ़ाइल एक्सेस गेटवे",
  "National Secure Cryptographic Clearance & File Dispatch": "राष्ट्रीय सुरक्षित क्रिप्टोग्राफ़िक मंजूरी एवं फ़ाइल प्रेषण",
  "Authentication Required for Authority Link": "प्राधिकरण लिंक के लिए प्रमाणीकरण आवश्यक",
  "Log In with Authority Credentials": "प्राधिकरण क्रेडेंशियल के साथ लॉग इन करें",
  "AICTE National Directorate & Inspection Desk": "एआईसीटीई राष्ट्रीय निदेशालय एवं निरीक्षण डेस्क",
  "Affiliating University & Degree Awarding Body": "संबद्ध विश्वविद्यालय एवं डिग्री प्रदाता संस्था",
  "Certified Institutional Auditor": "प्रमाणित संस्थागत लेखा परीक्षक",
  "Authorized Statutory & Employer Verification Agency": "अधिकृत वैधानिक एवं नियोक्ता सत्यापन एजेंसी",

  // Screenshot 1: Batch Registry & Batches Table
  "Institution Batch Registry": "संस्थान बैच रजिस्ट्री",
  "Institution बैच रजिस्ट्री": "संस्थान बैच रजिस्ट्री",
  "Complete audit trail of all student admission uploads, data quality improvements, and AICTE commitment status.": "सभी छात्र प्रवेश अपलोड, डेटा गुणवत्ता सुधार और एआईसीटीई प्रतिबद्धता स्थिति का पूर्ण ऑडिट ट्रेल।",
  "Complete audit trail of सभी विद्यार्थी admission uploads, data quality improvements, and AICTE commitment स्थिति.": "सभी छात्र प्रवेश अपलोड, डेटा गुणवत्ता सुधार और एआईसीटीई प्रतिबद्धता स्थिति का पूर्ण ऑडिट ट्रेल।",
  "Complete audit trail of": "का पूर्ण ऑडिट ट्रेल",
  "Upload New Batch": "नया बैच अपलोड करें",
  "Upload नई Batch": "नया बैच अपलोड करें",
  "Open Batch in Progress (Conflict Prevention)": "खुला बैच प्रगति पर है (विवाद रोकथाम)",
  "OPEN BATCH IN PROGRESS (CONFLICT PREVENTION)": "खुला बैच प्रगति पर है (विवाद रोकथाम)",
  "Go to Open Batch Review": "खुले बैच की समीक्षा पर जाएं",
  "खुले बैच पर जाएं Review": "खुले बैच की समीक्षा पर जाएं",
  "Uploaded Student Batches": "अपलोड किए गए छात्र बैच",
  "UPLOADED STUDENT BATCHES": "अपलोड किए गए छात्र बैच",
  "UPLOADED विद्यार्थी BATCHES": "अपलोड किए गए छात्र बैच",
  "batch record(s)": "बैच रिकॉर्ड",
  "Quality Score": "गुणवत्ता स्कोर",
  "QUALITY SCORE": "गुणवत्ता स्कोर",
  "QUALITY स्कोर": "गुणवत्ता स्कोर",
  "Records Breakdown": "रिकॉर्ड विवरण",
  "RECORDS BREAKDOWN": "रिकॉर्ड विवरण",
  "रिकॉर्ड BREAKDOWN": "रिकॉर्ड विवरण",
  "COMMITTED": "कमिटेड",
  "IN REVIEW": "समीक्षाधीन",
  "IN_REVIEW": "समीक्षाधीन",
  "SUPERSEDED": "अतिक्रमित",
  "VALIDATING": "सत्यापन जारी",
  "MAPPING": "मैपिंग जारी",
  "Review": "समीक्षा करें",
  "Review →": "समीक्षा करें →",
  "Total:": "कुल:",
  "Total: ": "कुल: ",
  "warn": "चेतावनी",

  // Screenshot 2: Review Workspace Overview & KPIs
  "← Batches": "← बैच",
  "Batches": "बैच",
  "ISSUE RESOLUTION": "मुद्दा समाधान",
  "Issue Resolution": "मुद्दा समाधान",
  "PRIORITY EXPOSURE": "प्राथमिकता जोखिम",
  "Priority Exposure": "प्राथमिकता जोखिम",
  "INTAKE RECONCILIATION": "प्रवेश समाधान",
  "Intake Reconciliation": "प्रवेश समाधान",
  "Resolved / Fixed:": "हल किया गया / ठीक किया गया:",
  "हल किया गया / Fixed:": "हल किया गया / ठीक किया गया:",
  "Total Flagged:": "कुल ध्वजांकित:",
  "Total Flagged": "कुल ध्वजांकित",
  "Pending Review:": "समीक्षा लंबित:",
  "Critical:": "गंभीर:",
  "High:": "उच्च:",
  "Low / Info:": "निम्न / सूचना:",
  "Uploaded: 65 students": "अपलोड किए गए: 65 छात्र",
  "Approved Sanction: 60 intake": "स्वीकृत सीटें: 60",
  "स्वीकृत Sanction: 60 intake": "स्वीकृत सीटें: 60",
  "Over-intake variance: 3 students": "अतिरिक्त प्रवेश अंतर: 3 छात्र",
  "Over-Intake variance: 3 students": "अतिरिक्त प्रवेश अंतर: 3 छात्र",
  "Issues Queue": "मुद्दा कतार",
  "Duplicates": "डुप्लिकेट",
  "Before / After Report": "समीक्षा पूर्व / पश्चात रिपोर्ट",

  // Screenshot 3: Explainable Issue Queue Table & Filters
  "All Resolved": "सभी हल किए गए",
  "Accept Selected Fixes": "चयनित सुधार स्वीकार करें",
  "RULE": "नियम",
  "FIELD": "फ़ील्ड",
  "SEVERITY": "गंभीरता",
  "PRIORITY": "प्राथमिकता",
  "BUCKET": "श्रेणी",
  "STATUS": "स्थिति",
  "Rule": "नियम",
  "Field": "फ़ील्ड",
  "Priority": "प्राथमिकता",
  "Bucket": "श्रेणी",
  "Open (Pending)": "सक्रिय (लंबित)",
  "Open (लंबित)": "सक्रिय (लंबित)",
  "Reset Filters": "फ़िल्टर रीसेट करें",
  "Field / Rule": "फ़ील्ड / नियम",
  "Reason / Message": "कारण / संदेश",
  "OPEN": "सक्रिय",
  "PROPOSED": "प्रस्तावित",
  "FIXED": "हल किया गया",
  "DISMISSED": "खारिज",

  // Screenshot 4: Issue Drawer & Diagnostics
  "apaar_id missing or not 12 digits": "अपार आईडी गायब या 12 अंक नहीं",
  "Registry name/DOB fuzzy mismatch": "रजिस्ट्री नाम/जन्म तिथि अस्पष्ट बेमेल",
  "Intake sanction ceiling exceeded": "प्रवेश स्वीकृति सीमा पार",
  "Canonical enum value mismatch": "प्रामाणिक प्रगणित मान बेमेल",
  "Field:": "फ़ील्ड:",
  "Field: ": "फ़ील्ड: ",
  "Active Persona:": "सक्रिय भूमिका:",
  "Key": "कुंजी",
  "Value": "मान",
  "Suggested Safe Fix": "सुझाया गया सुरक्षित समाधान",
  "Requires Approval": "अनुमोदन आवश्यक",
  "Suggested Value:": "सुझाया गया मान:",
  "Suggested Value: ": "सुझाया गया मान: ",
  "Rationale:": "औचित्य:",
  "Rationale: ": "औचित्य: ",
  "Rationale": "औचित्य",
  "Prepend missing leading zero": "छूटा हुआ प्रारंभिक शून्य जोड़ें",
  "Found 11 digits: Excel may have stripped leading zero or mangled scientific notation": "11 अंक मिले: एक्सेल ने प्रारंभिक शून्य हटा दिया होगा या वैज्ञानिक संकेतन में बदल दिया होगा",
  "Current Uploaded Value": "वर्तमान अपलोड किया गया मान",
  "Inspect Full Row": "पूरी पंक्ति का निरीक्षण करें",
  "निरीक्षण करें Full पंक्ति": "पूरी पंक्ति का निरीक्षण करें",
  "Full पंक्ति": "पूरी पंक्ति",
  "Full Row": "पूरी पंक्ति",
  "Full": "पूर्ण",
  "admission year + duration": "प्रवेश वर्ष + अवधि",
  "Fuzzy threshold between 0.75 and 0.92 requires human review": "0.75 और 0.92 के बीच फ़ज़ी सीमा के लिए मानव समीक्षा आवश्यक है",
  "Set quota to NONE for Indian nationals": "भारतीय नागरिकों के लिए कोटा NONE पर सेट करें",
  "Title casing normalization": "शीर्षक केस सामान्यीकरण",
  "Confirm identical or twin identity": "समान या जुड़वां पहचान की पुष्टि करें",
  "Nationality is IN but quota is marked as OCI": "राष्ट्रीयता IN है लेकिन कोटा OCI के रूप में चिह्नित है",
  "Leading whitespace and non-standard casing in \" computer science\" normalized to canonical catalog form": "\" computer science\" में प्रारंभिक व्हाइटस्पेस और गैर-मानक केसिंग को प्रामाणिक कैटलॉग रूप में सामान्यीकृत किया गया",
  "admission_date 2026-08-01 + B.Tech duration 4y indicates expected 2030, got 2028": "प्रवेश तिथि 2026-08-01 + बी.टेक अवधि 4 वर्ष से 2030 अपेक्षित है, 2028 मिला",

  // Transfers & Student Registry Additions
  "15-Day AICTE Statutory Override Rule (Agents.md §8.1)": "15-दिवसीय एआईसीटीई वैधानिक ओवरराइड नियम (Agents.md §8.1)",
  "When a destination institution creates a transfer request, the source institution is granted exactly 15 calendar days to decide (Approve or Reject with note). If left unaddressed beyond 15 days, the AICTE Central Desk automatically executes an administrative override. Approved or overridden transfers safely transition source records to TRANSFERRED_OUT, guaranteeing that destination enrolment will not trigger duplicate student flags (Rule V010).": "जब कोई गंतव्य संस्थान स्थानांतरण अनुरोध बनाता है, तो स्रोत संस्थान को निर्णय लेने के लिए ठीक 15 कैलेंडर दिन (नोट के साथ स्वीकृत या अस्वीकार) दिए जाते हैं। यदि 15 दिनों से अधिक समय तक कोई कार्रवाई नहीं होती है, तो एआईसीटीई केंद्रीय डेस्क स्वतः प्रशासनिक ओवरराइड निष्पादित करता है। स्वीकृत या ओवरराइड किए गए स्थानांतरण स्रोत रिकॉर्ड को सुरक्षित रूप से स्थानांतरित (बाहर) में बदल देते हैं, जिससे यह सुनिश्चित होता है कि गंतव्य नामांकन से डुप्लिकेट छात्र फ़्लैग (नियम V010) ट्रिगर नहीं होंगे।",
  "When a destination institution creates a transfer request, the source institution is granted exactly": "जब कोई गंतव्य संस्थान स्थानांतरण अनुरोध बनाता है, तो स्रोत संस्थान को निर्णय लेने के लिए ठीक",
  "15 calendar days": "15 कैलेंडर दिन",
  "to decide (Approve or Reject with note). If left unaddressed beyond 15 days, the": "दिए जाते हैं (नोट के साथ स्वीकृत या अस्वीकार)। यदि 15 दिनों से अधिक समय तक कोई कार्रवाई नहीं होती है, तो",
  "AICTE Central Desk": "एआईसीटीई केंद्रीय डेस्क",
  "automatically executes an administrative override. Approved or overridden transfers safely transition source records to": "स्वतः प्रशासनिक ओवरराइड निष्पादित करता है। स्वीकृत या ओवरराइड किए गए स्थानांतरण स्रोत रिकॉर्ड को सुरक्षित रूप से",
  ", guaranteeing that destination enrolment will not trigger duplicate student flags (Rule V010).": " में बदल देते हैं, जिससे यह सुनिश्चित होता है कि गंतव्य नामांकन से डुप्लिकेट छात्र फ़्लैग (नियम V010) ट्रिगर नहीं होंगे।",
  "guaranteeing that destination enrolment will not trigger duplicate student flags (Rule V010).": "में बदल देते हैं, जिससे यह सुनिश्चित होता है कि गंतव्य नामांकन से डुप्लिकेट छात्र फ़्लैग (नियम V010) ट्रिगर नहीं होंगे।",
  "REASON": "कारण",
  "Reason": "कारण",
  "reason": "कारण",
  "Family relocation to NCR": "एनसीआर (NCR) में पारिवारिक स्थानांतरण",
  "Parent transfer of central government defense officer": "केंद्र सरकार के रक्षा अधिकारी अभिभावक का स्थानांतरण",
  "Parent स्थानांतरण of central government defense officer": "केंद्र सरकार के रक्षा अधिकारी अभिभावक का स्थानांतरण",
  "Medical hardship - transfer to home state": "चिकित्सा कठिनाई - गृह राज्य में स्थानांतरण",
  "Sanctioned intake capacity exceeded in semester 3": "सत्र 3 में स्वीकृत प्रवेश क्षमता पार हो गई",
  "Approved with Medical Board clearance and NOC": "मेडिकल बोर्ड अनापत्ति और एनओसी के साथ स्वीकृत",
  "Awaiting Source": "स्रोत की प्रतीक्षा",
  "Decided": "निर्णय",

  "Student Central Registry": "केंद्रीय छात्र रजिस्ट्री",
  "विद्यार्थी Central Registry": "केंद्रीय छात्र रजिस्ट्री",
  "Central Registry": "केंद्रीय रजिस्ट्री",
  "Canonical student records keyed by 12-digit APAAR ID with immutable branch switch history and multiple entry/exit points": "अपरिवर्तनीय शाखा परिवर्तन इतिहास और बहु-प्रवेश/निकास बिंदुओं के साथ 12-अंकीय अपार आईडी द्वारा सुरक्षित प्रामाणिक छात्र रिकॉर्ड",
  "Canonical विद्यार्थी रिकॉर्ड keyed by 12-digit अपार आईडी with immutable branch switch history and multiple entry/exit points": "अपरिवर्तनीय शाखा परिवर्तन इतिहास और बहु-प्रवेश/निकास बिंदुओं के साथ 12-अंकीय अपार आईडी द्वारा सुरक्षित प्रामाणिक छात्र रिकॉर्ड",
  "Admit Student (Entry Point)": "छात्र प्रवेश (प्रवेश बिंदु)",
  "Admit विद्यार्थी (Entry Point)": "छात्र प्रवेश (प्रवेश बिंदु)",
  "Admit Student": "छात्र प्रवेश",
  "Entry Point": "प्रवेश बिंदु",
  "Unmask PII (Authorized)": "व्यक्तिगत पहचान (PII) अनमास्क करें (अधिकृत)",
  "Mask PII": "व्यक्तिगत पहचान (PII) मास्क करें",
  "Entry & Exit Pathways:": "प्रवेश एवं निकास मार्ग:",
  "ENTRY & EXIT PATHWAYS:": "प्रवेश एवं निकास मार्ग:",
  "Entry & Exit Pathways": "प्रवेश एवं निकास मार्ग",
  "ENTRY & EXIT PATHWAYS": "प्रवेश एवं निकास मार्ग",
  "All Students": "सभी छात्र",
  "all students": "सभी छात्र",
  "DSE Lateral Entry (Year 2)": "डीएसई पार्श्व प्रवेश (द्वितीय वर्ष)",
  "DSE पार्श्व प्रवेश (Lateral Entry) (Year 2)": "डीएसई पार्श्व प्रवेश (द्वितीय वर्ष)",
  "DSE Lateral Entry": "डीएसई पार्श्व प्रवेश",
  "DSE पार्श्व प्रवेश (Lateral Entry)": "डीएसई पार्श्व प्रवेश",
  "Lateral Entry (Year 2)": "पार्श्व प्रवेश (द्वितीय वर्ष)",
  "Regular Entry (Year 1)": "नियमित प्रवेश (प्रथम वर्ष)",
  "Regular Entry": "नियमित प्रवेश",
  "Transfer-In Entry": "आवक स्थानांतरण प्रवेश",
  "स्थानांतरण-In Entry": "आवक स्थानांतरण प्रवेश",
  "Transfer-In": "आवक स्थानांतरण",
  "Exited / Withdrawn / Transferred Out": "निकास / वापस लिया गया / स्थानांतरित बाहर",
  "Exited / वापस लिया गया / स्थानांतरित Out": "निकास / वापस लिया गया / स्थानांतरित बाहर",
  "Search by student name, APAAR ID, or roll number...": "छात्र का नाम, अपार आईडी, या रोल नंबर द्वारा खोजें...",
  "खोजें by छात्र का नाम, अपार आईडी, or roll number...": "छात्र का नाम, अपार आईडी, या रोल नंबर द्वारा खोजें...",
  "सभी Programs": "सभी कार्यक्रम",
  "programs": "कार्यक्रम",
  "Student identities verified via Central APAAR registry with DPDP Act student consent status and branch switch tracking": "डीपीडीपी (DPDP) अधिनियम छात्र सहमति स्थिति और शाखा परिवर्तन ट्रैकिंग के साथ केंद्रीय अपार रजिस्ट्री द्वारा सत्यापित छात्र पहचान",
  "विद्यार्थी identities verified via Central APAAR registry with DPDP Act विद्यार्थी सहमति स्थिति and branch switch tracking": "डीपीडीपी (DPDP) अधिनियम छात्र सहमति स्थिति और शाखा परिवर्तन ट्रैकिंग के साथ केंद्रीय अपार रजिस्ट्री द्वारा सत्यापित छात्र पहचान",
  "Student ID (PRN)": "छात्र आईडी (PRN)",
  "विद्यार्थी ID (PRN)": "छात्र आईडी (PRN)",
  "Program & Branch": "कार्यक्रम एवं शाखा",
  "PROGRAM & BRANCH": "कार्यक्रम एवं शाखा",
  "Entry / Year": "प्रवेश / वर्ष",
  "ENTRY / YEAR": "प्रवेश / वर्ष",
  "Lifecycle Status": "जीवनचक्र स्थिति",
  "LIFECYCLE STATUS": "जीवनचक्र स्थिति",
  "LIFECYCLE स्थिति": "जीवनचक्र स्थिति",
  "Branch Switched": "शाखा परिवर्तित",
  "Switch Branch": "शाखा बदलें",
  "Switch Branch / Program": "शाखा / कार्यक्रम बदलें",
  "Switch Student Branch / Program": "छात्र शाखा / कार्यक्रम बदलें",
  "Details": "विवरण",
  "details": "विवरण",
  "DEFERRED": "विलंबित",
  "Deferred": "विलंबित",
  "deferred": "विलंबित",
  "GRADUATED": "स्नातक / उत्तीर्ण",
  "Graduated": "स्नातक / उत्तीर्ण",
  "graduated": "स्नातक / उत्तीर्ण",
  "TRANSFERRED_OUT": "स्थानांतरित (बाहर)",
  "Transferred Out": "स्थानांतरित (बाहर)",
  "transferred_out": "स्थानांतरित (बाहर)",
  "error(s)": "त्रुटियां",
  "error(s) ": "त्रुटियां ",
  "त्रुटि(s)": "त्रुटियां",
  "त्रुटि(s) ": "त्रुटियां ",
  "UG": "स्नातक (UG)",
  "PG": "स्नातकोत्तर (PG)",
  "GRANTED": "स्वीकृत",
  "Admissions Entry Pathway": "प्रवेश मार्ग",
  "Direct Second Year (DSE) Lateral Entry — Year 2": "सीधा द्वितीय वर्ष (डीएसई) पार्श्व प्रवेश — वर्ष 2",
  "First Year Regular Entry — Year 1": "प्रथम वर्ष नियमित प्रवेश — वर्ष 1",
  "Inter-College / University Transfer-In Entry": "अंतर-कॉलेज / विश्वविद्यालय आवक स्थानांतरण प्रवेश",
  "Record immutable branch sliding with full historical audit preservation": "पूर्ण ऐतिहासिक ऑडिट संरक्षण के साथ अपरिवर्तनीय शाखा परिवर्तन दर्ज करें",
  "New Target Program / Branch": "नया लक्षित कार्यक्रम / शाखा",
  "Student Full Name": "छात्र का पूरा नाम",
  "Auto-generated if empty": "खाली होने पर स्वतः उत्पन्न",
  "Current Program": "वर्तमान कार्यक्रम",
  "Date of Birth": "जन्म तिथि",
  "Gender & Category": "लिंग एवं श्रेणी",
  "Seat Type / Quota": "सीट प्रकार / कोटा",
  "Record Version History (Immutable Audit Log)": "रिकॉर्ड संस्करण इतिहास (अपरिवर्तनीय ऑडिट लॉग)",
  "Student Lifecycle Timeline": "छात्र जीवनचक्र समयरेखा",
  "Summary of Modifications": "संशोधनों का सारांश",
  "Actor / Source": "कर्ता / स्रोत",
  "Change Status": "स्थिति बदलें",
  "Branch Switch / Course Transfer Audit Verified": "शाखा परिवर्तन / पाठ्यक्रम स्थानांतरण ऑडिट सत्यापित",
  "This student has an official branch switch on record. All previous course records and admission credits are retained in the immutable version log below.": "इस छात्र के रिकॉर्ड में आधिकारिक शाखा परिवर्तन दर्ज है। पिछले सभी पाठ्यक्रम रिकॉर्ड और प्रवेश क्रेडिट नीचे अपरिवर्तनीय संस्करण लॉग में बनाए रखे गए हैं।"
};

// Sorted keys by length descending to match longest phrases first
const SORTED_KEYS = Object.keys(HINDI_DICTIONARY).sort((a, b) => b.length - a.length);

// Lowercase lookup map for case-insensitive exact matching
const LOWERCASE_MAP = new Map<string, string>();
for (const [key, value] of Object.entries(HINDI_DICTIONARY)) {
  LOWERCASE_MAP.set(key.toLowerCase(), value);
}

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

  // 1. Direct exact or case-insensitive match
  if (HINDI_DICTIONARY[trimmed]) {
    const leadingSpaces = text.match(/^\s*/)?.[0] || '';
    const trailingSpaces = text.match(/\s*$/)?.[0] || '';
    return leadingSpaces + HINDI_DICTIONARY[trimmed] + trailingSpaces;
  }
  const lowerTrimmed = trimmed.toLowerCase();
  if (LOWERCASE_MAP.has(lowerTrimmed)) {
    const leadingSpaces = text.match(/^\s*/)?.[0] || '';
    const trailingSpaces = text.match(/\s*$/)?.[0] || '';
    return leadingSpaces + LOWERCASE_MAP.get(lowerTrimmed)! + trailingSpaces;
  }

  // 2. Dynamic regular expression patterns for dynamic values
  let result = text;
  let hasMatch = false;

  // Pattern: "Use Demo File: batch_2_errors.xlsx"
  if (/Use\s+Demo\s+File:\s*([^\s]+)/i.test(result)) {
    result = result.replace(/Use\s+Demo\s+File:\s*([^\s]+)/gi, 'डेमो फ़ाइल का उपयोग करें: $1');
    hasMatch = true;
  }

  // Pattern: "11.6 KB · Ready for smart column mapping"
  if (/(\d+(?:\.\d+)?\s*KB)\s*·\s*Ready\s+for\s+smart\s+column\s+mapping/i.test(result)) {
    result = result.replace(/(\d+(?:\.\d+)?\s*KB)\s*·\s*Ready\s+for\s+smart\s+column\s+mapping/gi, '$1 · स्मार्ट कॉलम मैपिंग के लिए तैयार');
    hasMatch = true;
  }

  // Pattern: "22 / 22 Required Fields Mapped"
  if (/(\d+)\s*\/\s*(\d+)\s*Required\s+Fields\s+Mapped/i.test(result)) {
    result = result.replace(/(\d+)\s*\/\s*(\d+)\s*Required\s+Fields\s+Mapped/gi, '$1 / $2 आवश्यक फ़ील्ड मैप किए गए');
    hasMatch = true;
  }

  // Pattern: "6 columns identified"
  if (/(\d+)\s*columns?\s*identified/i.test(result)) {
    result = result.replace(/(\d+)\s*columns?\s*identified/gi, '$1 कॉलम पहचाने गए');
    hasMatch = true;
  }

  // Pattern: "2026-27 (Current Academic Year)"
  if (/(\d{4}-\d{2})\s*\(Current\s+Academic\s+Year\)/i.test(result)) {
    result = result.replace(/(\d{4}-\d{2})\s*\(Current\s+Academic\s+Year\)/gi, '$1 (वर्तमान शैक्षणिक वर्ष)');
    hasMatch = true;
  }
  if (/\(?Current\s+Academic\s+Year\)?/i.test(result)) {
    result = result.replace(/\(?Current\s+Academic\s+Year\)?/gi, '(वर्तमान शैक्षणिक वर्ष)');
    hasMatch = true;
  }

  // Pattern: "Target Academic Year: 2026-27" or "Target Academic Year:" or "Target शैक्षणिक वर्ष:"
  if (/Target\s+(?:Academic\s+Year|शैक्षणिक\s+वर्ष)\s*:/i.test(result)) {
    result = result.replace(/Target\s+(?:Academic\s+Year|शैक्षणिक\s+वर्ष)\s*:/gi, 'लक्षित शैक्षणिक वर्ष:');
    hasMatch = true;
  }

  // Pattern: "File:" at start of line or standalone
  if (/(?:^|\b)File\s*:\s*/i.test(result)) {
    result = result.replace(/(^|\b)File\s*:\s*/gi, '$1फ़ाइल: ');
    hasMatch = true;
  }

  // Pattern: "Batch ID:"
  if (/(?:^|\b)Batch\s+ID\s*:\s*/i.test(result)) {
    result = result.replace(/(^|\b)Batch\s+ID\s*:\s*/gi, '$1बैच आईडी: ');
    hasMatch = true;
  }

  // Pattern: "Fuzzy सटीक मिलान" or "Fuzzy Match"
  if (/Fuzzy\s+(?:Match|सटीक\s+मिलान)/i.test(result)) {
    result = result.replace(/Fuzzy\s+(?:Match|सटीक\s+मिलान)/gi, 'फ़ज़ी मिलान');
    hasMatch = true;
  }

  // Pattern: "Institution छात्र / रोल / पीआरएन"
  if (/Institution\s+छात्र\s*\/\s*रोल\s*\/\s*पीआरएन/i.test(result)) {
    result = result.replace(/Institution\s+छात्र\s*\/\s*रोल\s*\/\s*पीआरएन/gi, 'संस्थान छात्र / रोल / पीआरएन');
    hasMatch = true;
  }

  // Pattern: "Consent स्थिति"
  if (/Consent\s+स्थिति/i.test(result)) {
    result = result.replace(/Consent\s+स्थिति/gi, 'सहमति स्थिति');
    hasMatch = true;
  }

  // Pattern: "Foreign National स्थिति"
  if (/Foreign\s+National\s+स्थिति/i.test(result)) {
    result = result.replace(/Foreign\s+National\s+स्थिति/gi, 'विदेशी नागरिक स्थिति');
    hasMatch = true;
  }

  // Pattern: "सत्यापन पूर्ण हुआ. Quality स्कोर and issues ready for review." or English equivalent
  if (/(?:Validation\s+Complete|सत्यापन\s+पूर्ण\s+हुआ)[.!]?\s*Quality\s+(?:score|स्कोर)\s+and\s+issues\s+ready\s+for\s+review/i.test(result)) {
    result = result.replace(/(?:Validation\s+Complete|सत्यापन\s+पूर्ण\s+हुआ)[.!]?\s*Quality\s+(?:score|स्कोर)\s+and\s+issues\s+ready\s+for\s+review\.?/gi, 'सत्यापन पूर्ण हुआ। गुणवत्ता स्कोर एवं मुद्दे समीक्षा के लिए तैयार हैं।');
    hasMatch = true;
  }

  // Pattern: "देखें Result Summary" or "View Result Summary"
  if (/(?:View|देखें)\s+Result\s+Summary/i.test(result)) {
    result = result.replace(/(?:View|देखें)\s+Result\s+Summary/gi, 'परिणाम सारांश देखें');
    hasMatch = true;
  }

  // Pattern: "Streaming live telemetry from AICTE Verification Engine"
  if (/Streaming\s+live\s+telemetry\s+from\s+AICTE\s+Verification\s+Engine/i.test(result)) {
    result = result.replace(/Streaming\s+live\s+telemetry\s+from\s+AICTE\s+Verification\s+Engine/gi, 'एआईसीटीई सत्यापन इंजन से लाइव टेलीमेट्री स्ट्रीमिंग जारी');
    hasMatch = true;
  }

  // --- Settings Tab Regex Patterns (Image 1) ---
  // Pattern: "Institution Administration & सेटिंग्स" or "Institution Administration & Settings"
  if (/Institution\s+Administration\s*&\s*(?:Settings|सेटिंग्स)/i.test(result)) {
    result = result.replace(/Institution\s+Administration\s*&\s*(?:Settings|सेटिंग्स)/gi, 'संस्थान प्रशासन एवं सेटिंग्स');
    hasMatch = true;
  }

  // Pattern: "Self-service institutional API keys..." or with "एपीआई कुंजियां"
  if (/Self-service\s+institutional\s+(?:API\s+keys|एपीआई\s+कुंजियां)/i.test(result)) {
    result = result.replace(/Self-service\s+institutional\s+(?:API\s+keys|एपीआई\s+कुंजियां)[^.]*/gi, 'स्वयं-सेवा संस्थागत एपीआई कुंजियां, टीम भूमिका आवंटन, वेबहुक, और सुरक्षा अनुपालन');
    hasMatch = true;
  }

  // Pattern: "Institutional API Keys" or "Institutional एपीआई कुंजियां"
  if (/Institutional\s+(?:API\s+Keys|एपीआई\s+कुंजियां)/i.test(result)) {
    result = result.replace(/Institutional\s+(?:API\s+Keys|एपीआई\s+कुंजियां)/gi, 'संस्थागत एपीआई कुंजियां');
    hasMatch = true;
  }

  // Pattern: "Provision high-throughput API credentials..." or with "उच्च-throughput"
  if (/Provision\s+(?:high-throughput|उच्च-throughput)\s+API\s+credentials/i.test(result)) {
    result = result.replace(/Provision\s+(?:high-throughput|उच्च-throughput)\s+API\s+credentials\s+for\s+programmatic\s+CSV\/JSON\s+ingestion\s+from\s+your\s+campus\s+ERP/gi, 'अपने कैंपस ERP से प्रोग्रामेटिक CSV/JSON अंतर्ग्रहण हेतु उच्च-थ्रूपुट एपीआई क्रेडेंशियल्स प्राप्त करें');
    hasMatch = true;
  }

  // Pattern: "+ Generate New Key" or "+ Generate नई Key" or "Generate New Key" or "Generate नई Key"
  if (/(\+?\s*)Generate\s+(?:New|नई)\s+Key/i.test(result)) {
    result = result.replace(/(\+?\s*)Generate\s+(?:New|नई)\s+Key/gi, '$1नई कुंजी बनाएं');
    hasMatch = true;
  }

  // --- Reports Tab Regex Patterns (Image 2) ---
  // Pattern: "প্রতিवेदन एवं सांविधिक लेखापरीक्षा · Generate AICTE policy reports..." or "Generate AICTE policy reports..."
  if (/Generate\s+AICTE\s+policy\s+reports,\s*NBA\/NAAC\s+accreditation\s+summaries/i.test(result)) {
    result = result.replace(/(?:प्रतिवेदन\s+एवं\s+सांविधिक\s+लेखापरीक्षा\s*·\s*)?Generate\s+AICTE\s+policy\s+reports,\s*NBA\/NAAC\s+accreditation\s+summaries,\s*intake\s+monitoring,\s*and\s*reservation\s+compliance\s+packages\.?/gi, 'प्रतिवेदन एवं सांविधिक लेखापरीक्षा · एआईसीटीई नीति रिपोर्ट, NBA/NAAC प्रत्यायन सारांश, प्रवेश निगरानी और आरक्षण अनुपालन पैकेज तैयार करें।');
    hasMatch = true;
  }

  // Pattern: "National intake ceilings, excess enrollments..." or with "अतिरिक्त enrollments"
  if (/National\s+intake\s+ceilings,\s*(?:excess|अतिरिक्त)\s+enrollments/i.test(result)) {
    result = result.replace(/National\s+intake\s+ceilings,\s*(?:excess|अतिरिक्त)\s+enrollments,\s*and\s*state\s+seat\s+utilization\.?/gi, 'राष्ट्रीय प्रवेश सीमाएं, अतिरिक्त नामांकन, और राज्य सीट उपयोग।');
    hasMatch = true;
  }

  // Pattern: "NBA/NAAC multi-tab student intake..." or with "विद्यार्थी intake"
  if (/NBA\/NAAC\s+multi-tab\s+(?:student|विद्यार्थी)\s+intake/i.test(result)) {
    result = result.replace(/NBA\/NAAC\s+multi-tab\s+(?:student|विद्यार्थी)\s+intake,\s*faculty\s+ratios,\s*and\s*referential\s+integrity\.?/gi, 'NBA/NAAC बहु-टैब छात्र प्रवेश, संकाय अनुपात, और संदर्भात्मक सत्यनिष्ठा।');
    hasMatch = true;
  }

  // Pattern: "Supernumerary schemes..." or "अतिरिक्त सीटें (Supernumerary) schemes..."
  if (/(?:Supernumerary|अतिरिक्त\s+सीटें\s*\(Supernumerary\))\s+schemes/i.test(result)) {
    result = result.replace(/(?:Supernumerary|अतिरिक्त\s+सीटें\s*\(Supernumerary\))\s+schemes\s*\(TFW\/PMSSS\/JK\),\s*NRI\/OCI\/FN\s+shares\s+by\s+state\.?/gi, 'अतिरिक्त सीटें (सुपरन्यूमरेरी योजनाएं - TFW/PMSSS/JK), राज्यवार NRI/OCI/FN हिस्सेदारी।');
    hasMatch = true;
  }

  // Pattern: "Statutory GEN/OBC..." or with "अन्य पिछड़ा वर्ग" and "कोटा audit"
  if (/Statutory\s+GEN\/(?:OBC|अन्य\s+पिछड़ा\s+वर्ग\s*\(OBC\))/i.test(result)) {
    result = result.replace(/Statutory\s+GEN\/(?:OBC|अन्य\s+पिछड़ा\s+वर्ग\s*\(OBC\))\/SC\/ST\/(?:EWS|आर्थिक\s+रूप\s+से\s+कमजोर\s+वर्ग\s*\(EWS\))\s+breakdown\s+and\s+(?:quota|कोटा)\s+audit\s+certificate\.?/gi, 'सांविधिक GEN/OBC/SC/ST/EWS विवरण और कोटा ऑडिट प्रमाणपत्र।');
    hasMatch = true;
  }

  // Pattern: "2026-27 (Current Active Batch)" or "(Current सत्रिम Batch)"
  if (/(\d{4}-\d{2})\s*\((?:Current\s+Active\s+Batch|Current\s+सत्र(?:िम)?\s+Batch)\)/i.test(result)) {
    result = result.replace(/(\d{4}-\d{2})\s*\((?:Current\s+Active\s+Batch|Current\s+सत्र(?:िम)?\s+Batch)\)/gi, '$1 (वर्तमान सक्रिय बैच)');
    hasMatch = true;
  }

  // Pattern: "All India (National Aggregation)" or "सभी India (National Aggregation)"
  if (/(?:All|सभी)\s+India\s*\(National\s+Aggregation\)/i.test(result)) {
    result = result.replace(/(?:All|सभी)\s+India\s*\(National\s+Aggregation\)/gi, 'अखिल भारतीय (राष्ट्रीय संकलन)');
    hasMatch = true;
  }

  // Pattern: "All Disciplines & Programs" or "सभी Disciplines & Programs"
  if (/(?:All|सभी)\s+Disciplines\s*&\s*Programs/i.test(result)) {
    result = result.replace(/(?:All|सभी)\s+Disciplines\s*&\s*Programs/gi, 'सभी विषय एवं कार्यक्रम');
    hasMatch = true;
  }

  // Pattern: "5. RESERVATION Category" or "5. RESERVATION श्रेणी"
  if (/5\.\s*RESERVATION\s*(?:Category|श्रेणी)/i.test(result)) {
    result = result.replace(/5\.\s*RESERVATION\s*(?:Category|श्रेणी)/gi, '5. आरक्षण श्रेणी');
    hasMatch = true;
  }

  // Pattern: "All Social Categories" or "सभी Social Categories"
  if (/(?:All|सभी)\s+Social\s+Categories/i.test(result)) {
    result = result.replace(/(?:All|सभी)\s+Social\s+Categories/gi, 'सभी सामाजिक श्रेणियां');
    hasMatch = true;
  }

  // Pattern: "Search reports..." or "खोजें reports..."
  if (/(?:Search|खोजें)\s+reports\.\.\./i.test(result)) {
    result = result.replace(/(?:Search|खोजें)\s+reports\.\.\./gi, 'रिपोर्ट खोजें...');
    hasMatch = true;
  }

  // Pattern: "All Types" or "सभी Types"
  if (/(?:All|सभी)\s+Types/i.test(result)) {
    result = result.replace(/(?:All|सभी)\s+Types/gi, 'सभी प्रकार');
    hasMatch = true;
  }

  // Pattern: "All Formats" or "सभी Formats"
  if (/(?:All|सभी)\s+Formats/i.test(result)) {
    result = result.replace(/(?:All|सभी)\s+Formats/gi, 'सभी प्रारूप');
    hasMatch = true;
  }

  // --- Verifier Tab Regex Patterns (Image 3) ---
  // Pattern: "Real-time verification of SD-JWT credentials against AICTE trust roots and national status lists" or "...national स्थिति lists"
  if (/Real-time\s+verification\s+of\s+SD-JWT\s+credentials\s+against\s+AICTE\s+trust\s+roots\s+and\s+national\s+(?:status|स्थिति)\s+lists/i.test(result)) {
    result = result.replace(/Real-time\s+verification\s+of\s+SD-JWT\s+credentials\s+against\s+AICTE\s+trust\s+roots\s+and\s+national\s+(?:status|स्थिति)\s+lists/gi, 'एआईसीटीई ट्रस्ट रूट्स और राष्ट्रीय स्थिति सूचियों के विरुद्ध SD-JWT क्रेडेंशियल्स का रीयल-टाइम सत्यापन');
    hasMatch = true;
  }

  // Pattern: "Verify Student Presentation" or "Verify विद्यार्थी Presentation"
  if (/Verify\s+(?:Student|विद्यार्थी)\s+Presentation/i.test(result)) {
    result = result.replace(/Verify\s+(?:Student|विद्यार्थी)\s+Presentation/gi, 'विद्यार्थी प्रस्तुति सत्यापित करें');
    hasMatch = true;
  }

  // Pattern: "Accepts raw SD-JWT presentation strings or full verification URLs generated from the Student Wallet" or "...from the छात्र वॉलेट"
  if (/Accepts\s+raw\s+SD-JWT\s+presentation\s+strings\s+or\s+full\s+verification\s+URLs\s+generated\s+from\s+the\s+(?:Student\s+Wallet|छात्र\s+वॉलेट)/i.test(result)) {
    result = result.replace(/Accepts\s+raw\s+SD-JWT\s+presentation\s+strings\s+or\s+full\s+verification\s+URLs\s+generated\s+from\s+the\s+(?:Student\s+Wallet|छात्र\s+वॉलेट)/gi, 'छात्र वॉलेट से उत्पन्न रॉ SD-JWT प्रस्तुति स्ट्रिंग्स या पूर्ण सत्यापन URL स्वीकार करता है');
    hasMatch = true;
  }

  // Pattern: "Verify Credential Presentation" or "प्रमाणपत्र सत्यापित करें Presentation"
  if (/(?:Verify\s+Credential|प्रमाणपत्र\s+सत्यापित\s+करें)\s+Presentation/i.test(result)) {
    result = result.replace(/(?:Verify\s+Credential|प्रमाणपत्र\s+सत्यापित\s+करें)\s+Presentation/gi, 'प्रमाणपत्र प्रस्तुति सत्यापित करें');
    hasMatch = true;
  }

  // Pattern: "Row #22", "• Row #22", "(Row #22)", "Row 22"
  if (/(\b|•\s*|\()Row\s*(?:#|No\.?|Number)?\s*(\d+)(\)?)/i.test(result)) {
    result = result.replace(/(\b|•\s*|\()Row\s*(?:#|No\.?|Number)?\s*(\d+)(\)?)/gi, '$1पंक्ति #$2$3');
    hasMatch = true;
  }

  // Pattern: "/ 520 seats" or "520 seats"
  if (/(\/\s*)?(\d+)\s*seats\b/i.test(result)) {
    result = result.replace(/(\/\s*)?(\d+)\s*seats\b/gi, (_, slash, num) => (slash || '') + `${num} सीटें`);
    hasMatch = true;
  }

  // Pattern: "Sum of aggregate submissions for 2026-27"
  if (/Sum\s+of\s+aggregate\s+submissions\s+for\s*(\d{4}-\d{2})/i.test(result)) {
    result = result.replace(/Sum\s+of\s+aggregate\s+submissions\s+for\s*(\d{4}-\d{2})/gi, '$1 के लिए कुल सबमिशन का योग');
    hasMatch = true;
  }

  // Pattern: "60 students", "58 students", "508 students"
  if (/(\d+)\s*students\b/i.test(result)) {
    result = result.replace(/(\d+)\s*students\b/gi, '$1 छात्र');
    hasMatch = true;
  }

  // Pattern: "6 vacant", "2 vacant", "3 vacant", "4 vacant"
  if (/(\d+)\s*vacant\b/i.test(result)) {
    result = result.replace(/(\d+)\s*vacant\b/gi, '$1 रिक्त');
    hasMatch = true;
  }

  // Pattern: "STATUTORY RESERVATION कोटा BREACH DETECTED (1 श्रेणी ALERT)" or English
  if (/STATUTORY\s+RESERVATION\s+(?:QUOTA|कोटा)\s+BREACH\s+DETECTED\s*\(\s*(\d+)\s*(?:CATEGORY|श्रेणी)\s+ALERT\s*\)/i.test(result)) {
    result = result.replace(
      /STATUTORY\s+RESERVATION\s+(?:QUOTA|कोटा)\s+BREACH\s+DETECTED\s*\(\s*(\d+)\s*(?:CATEGORY|श्रेणी)\s+ALERT\s*\)/gi,
      'सांविधिक आरक्षण कोटा उल्लंघन का पता चला ($1 श्रेणी अलर्ट)'
    );
    hasMatch = true;
  }

  // Pattern: CategoryQuotaEngine breach alert bullet text
  if (/(?:•\s*)?(?:Scheduled\s+Castes\s*(?:\((?:SC|अनुसूचित\s+जाति\s*\(SC\))\))?|अनुसूचित\s+जाति\s*\(SC\))\s*:\s*(?:Enrolled\s+count|नामांकित\s+count)\s*\((\d+)\s*(?:seats|सीटें)\)\s*(?:exceeds|से\s*अधिक)\s*(?:approved\s+statutory\s+quota|स्वीकृत\s+statutory\s+कोटा|स्वीकृत\s+सांविधिक\s+कोटा)\s*\((\d+)\s*(?:seats|सीटें)\)\s*by\s*(\+?\d+)\s*(?:excess\s+students|अतिरिक्त\s+students|अतिरिक्त\s+छात्र)\.\s*AICTE\s*(?:Rule|नियम)\s*(V\d+\/V\d+)\s*(?:alert\s+triggered|अलर्ट\s+ट्रिगर\s+हुआ)\.?/i.test(result)) {
    result = result.replace(
      /(?:•\s*)?(?:Scheduled\s+Castes\s*(?:\((?:SC|अनुसूचित\s+जाति\s*\(SC\))\))?|अनुसूचित\s+जाति\s*\(SC\))\s*:\s*(?:Enrolled\s+count|नामांकित\s+count)\s*\((\d+)\s*(?:seats|सीटें)\)\s*(?:exceeds|से\s*अधिक)\s*(?:approved\s+statutory\s+quota|स्वीकृत\s+statutory\s+कोटा|स्वीकृत\s+सांविधिक\s+कोटा)\s*\((\d+)\s*(?:seats|सीटें)\)\s*by\s*(\+?\d+)\s*(?:excess\s+students|अतिरिक्त\s+students|अतिरिक्त\s+छात्र)\.\s*AICTE\s*(?:Rule|नियम)\s*(V\d+\/V\d+)\s*(?:alert\s+triggered|अलर्ट\s+ट्रिगर\s+हुआ)\.?/gi,
      '• अनुसूचित जाति (SC): नामांकित संख्या ($1 सीटें) स्वीकृत सांविधिक कोटा ($2 सीटें) से $3 अतिरिक्त छात्र अधिक है। एआईसीटीई नियम $4 अलर्ट ट्रिगर हुआ।'
    );
    hasMatch = true;
  } else if (/(?:Enrolled\s+count|नामांकित\s+count)\s*\((\d+)\s*(?:seats|सीटें)\)\s*(?:exceeds|से\s*अधिक)\s*(?:approved\s+statutory\s+quota|स्वीकृत\s+statutory\s+कोटा|स्वीकृत\s+सांविधिक\s+कोटा)\s*\((\d+)\s*(?:seats|सीटें)\)\s*by\s*(\+?\d+)\s*(?:excess\s+students|अतिरिक्त\s+students|अतिरिक्त\s+छात्र)\.\s*AICTE\s*(?:Rule|नियम)\s*(V\d+\/V\d+)\s*(?:alert\s+triggered|अलर्ट\s+ट्रिगर\s+हुआ)\.?/i.test(result)) {
    result = result.replace(
      /(?:Enrolled\s+count|नामांकित\s+count)\s*\((\d+)\s*(?:seats|सीटें)\)\s*(?:exceeds|से\s*अधिक)\s*(?:approved\s+statutory\s+quota|स्वीकृत\s+statutory\s+कोटा|स्वीकृत\s+सांविधिक\s+कोटा)\s*\((\d+)\s*(?:seats|सीटें)\)\s*by\s*(\+?\d+)\s*(?:excess\s+students|अतिरिक्त\s+students|अतिरिक्त\s+छात्र)\.\s*AICTE\s*(?:Rule|नियम)\s*(V\d+\/V\d+)\s*(?:alert\s+triggered|अलर्ट\s+ट्रिगर\s+हुआ)\.?/gi,
      'नामांकित संख्या ($1 सीटें) स्वीकृत सांविधिक कोटा ($2 सीटें) से $3 अतिरिक्त छात्र अधिक है। एआईसीटीई नियम $4 अलर्ट ट्रिगर हुआ।'
    );
    hasMatch = true;
  }

  // Pattern: "Total Approved Ceiling: 520 seats" or Hinglish
  if (/(?:Total\s+Approved\s+Ceiling|Total\s+स्वीकृत\s+सीमा)\s*:\s*/i.test(result)) {
    result = result.replace(/(?:Total\s+Approved\s+Ceiling|Total\s+स्वीकृत\s+सीमा)\s*:\s*/gi, 'कुल स्वीकृत सीमा: ');
    hasMatch = true;
  }

  // Pattern: "Total Quota Allocated: 520 seats" or Hinglish
  if (/(?:Total\s+Quota\s+Allocated|Total\s+कोटा\s+Allocated)\s*:\s*/i.test(result)) {
    result = result.replace(/(?:Total\s+Quota\s+Allocated|Total\s+कोटा\s+Allocated)\s*:\s*/gi, 'कुल आवंटित कोटा: ');
    hasMatch = true;
  }

  // Pattern: "Total Category Enrolled: 508 students" or Hinglish
  if (/(?:Total\s+Category\s+Enrolled|Total\s+श्रेणी\s+नामांकित)\s*:\s*/i.test(result)) {
    result = result.replace(/(?:Total\s+Category\s+Enrolled|Total\s+श्रेणी\s+नामांकित)\s*:\s*/gi, 'कुल श्रेणी नामांकित: ');
    hasMatch = true;
  }

  // Pattern: "Automated AICTE Reservation Balancing Active" or Hinglish
  if (/Automated\s+AICTE\s+Reservation\s+Balancing\s+(?:Active|सक्रिय)/i.test(result)) {
    result = result.replace(/Automated\s+AICTE\s+Reservation\s+Balancing\s+(?:Active|सक्रिय)/gi, 'स्वचालित एआईसीटीई आरक्षण संतुलन सक्रिय');
    hasMatch = true;
  }

  // Pattern: "+6.0 pts improvement" or "6.0 pts improvement"
  if (/(\+?\d+(?:\.\d+)?)\s*pts\s+improvement\b/i.test(result)) {
    result = result.replace(/(\+?\d+(?:\.\d+)?)\s*pts\s+improvement\b/gi, '$1 अंक सुधार');
    hasMatch = true;
  }

  // Pattern: "+6.0% DQ Improvement"
  if (/(\+?\d+(?:\.\d+)?%?)\s*DQ\s*Improvement\b/i.test(result)) {
    result = result.replace(/(\+?\d+(?:\.\d+)?%?)\s*DQ\s*Improvement\b/gi, '$1 DQ सुधार');
    hasMatch = true;
  }

  // Pattern: "10 mins ago" / "2 hours ago" / "1 day ago"
  if (/(\d+)\s*mins?\s*ago\b/i.test(result)) {
    result = result.replace(/(\d+)\s*mins?\s*ago\b/gi, '$1 मिनट पहले');
    hasMatch = true;
  }
  if (/(\d+)\s*hours?\s*ago\b/i.test(result)) {
    result = result.replace(/(\d+)\s*hours?\s*ago\b/gi, '$1 घंटे पहले');
    hasMatch = true;
  }
  if (/(\d+)\s*days?\s*ago\b/i.test(result)) {
    result = result.replace(/(\d+)\s*days?\s*ago\b/gi, '$1 दिन पहले');
    hasMatch = true;
  }
  if (/(\d+)\s*secs?\s*ago\b/i.test(result)) {
    result = result.replace(/(\d+)\s*secs?\s*ago\b/gi, '$1 सेकंड पहले');
    hasMatch = true;
  }
  if (/\bjust\s+now\b/i.test(result)) {
    result = result.replace(/\bjust\s+now\b/gi, 'अभी-अभी');
    hasMatch = true;
  }

  // Pattern: "1 New", "3 New"
  if (/(\d+)\s*New\b/i.test(result)) {
    result = result.replace(/(\d+)\s*New\b/gi, '$1 नई');
    hasMatch = true;
  }

  // Pattern: "Batch 1", "Batch 2"
  if (/\bBatch\s*(\d+)\b/i.test(result)) {
    result = result.replace(/\bBatch\s*(\d+)\b/gi, 'बैच $1');
    hasMatch = true;
  }

  // Pattern: "(15d notice)" or "15d notice"
  if (/\(?(\d+)d\s*notice\)?/i.test(result)) {
    result = result.replace(/\(?(\d+)d\s*notice\)?/gi, '($1-दिन नोटिस)');
    hasMatch = true;
  }

  // Pattern: "15d OVERDUE"
  if (/(\d+)d\s*OVERDUE\b/i.test(result)) {
    result = result.replace(/(\d+)d\s*OVERDUE\b/gi, '$1-दिन अतिदेय');
    hasMatch = true;
  }

  // Pattern: "1 Pending", "1 Approved"
  if (/(\d+)\s*Pending\b/i.test(result)) {
    result = result.replace(/(\d+)\s*Pending\b/gi, '$1 लंबित');
    hasMatch = true;
  }
  if (/(\d+)\s*Approved\b/i.test(result)) {
    result = result.replace(/(\d+)\s*Approved\b/gi, '$1 स्वीकृत');
    hasMatch = true;
  }

  // Pattern: "4 Open Issues"
  if (/(\d+)\s*Open\s*Issues\b/i.test(result)) {
    result = result.replace(/(\d+)\s*Open\s*Issues\b/gi, '$1 सक्रिय मुद्दे');
    hasMatch = true;
  }

  // Pattern: "1 Critical Issue Open", "2 Critical Issues Open"
  if (/(\d+)\s*Critical\s*Issues?\s*Open\b/i.test(result)) {
    result = result.replace(/(\d+)\s*Critical\s*Issues?\s*Open\b/gi, '$1 गंभीर मुद्दा खुला');
    hasMatch = true;
  }

  // Pattern: "1 CRITICAL", "3 HIGH"
  if (/(\d+)\s*CRITICAL\b/i.test(result)) {
    result = result.replace(/(\d+)\s*CRITICAL\b/gi, '$1 गंभीर');
    hasMatch = true;
  }
  if (/(\d+)\s*HIGH\b/i.test(result)) {
    result = result.replace(/(\d+)\s*HIGH\b/gi, '$1 उच्च');
    hasMatch = true;
  }
  if (/(\d+)\s*MEDIUM\b/i.test(result)) {
    result = result.replace(/(\d+)\s*MEDIUM\b/gi, '$1 मध्यम');
    hasMatch = true;
  }
  if (/(\d+)\s*LOW\b/i.test(result)) {
    result = result.replace(/(\d+)\s*LOW\b/gi, '$1 निम्न');
    hasMatch = true;
  }

  // Pattern: "Rules V007 · V008 · V010 · V011" or "Rules V001"
  if (/^Rules\s+(V\d+.*)$/i.test(result.trim())) {
    result = result.replace(/\bRules\b/gi, 'नियम');
    hasMatch = true;
  }

  // Pattern: "Biometric Soundex & Jaro-Winkler phonetic algorithms..."
  if (/Biometric\s+Soundex\s*&(?:amp;)?\s*Jaro-Winkler\s+phonetic\s+algorithms/i.test(result)) {
    result = 'बायोमेट्रिक साउंडेक्स और जेरो-विंकलर ध्वन्यात्मक एल्गोरिदम इस संस्थान के सभी बैचों के साथ-साथ राष्ट्रीय एआईसीटीई केंद्रीय भंडार में अंतर-संस्थागत दोहरे नामांकनों की निरंतर जांच करते हैं।';
    hasMatch = true;
  }

  // Pattern: "Intra-Batch Duplicates: None" / "Cross-Institution Matches: 1 Flagged"
  if (/Intra-Batch\s+Duplicates\s*:\s*(?:None\s*Detected|कोई\s*नहीं\s*मिला)/i.test(result)) {
    result = result.replace(/Intra-Batch\s+Duplicates\s*:\s*(?:None\s*Detected|कोई\s*नहीं\s*मिला)/gi, 'अंतः-बैच डुप्लिकेट: कोई नहीं मिला');
    hasMatch = true;
  } else if (/Intra-Batch\s+Duplicates\s*:\s*(?:None|कोई\s*नहीं)/i.test(result)) {
    result = result.replace(/Intra-Batch\s+Duplicates\s*:\s*(?:None|कोई\s*नहीं)/gi, 'अंतः-बैच डुप्लिकेट: कोई नहीं');
    hasMatch = true;
  }
  if (/Cross-Institution\s+Matches\s*:\s*(\d+)\s*Flagged/i.test(result)) {
    result = result.replace(/Cross-Institution\s+Matches\s*:\s*(\d+)\s*Flagged/gi, 'अंतर-संस्थान मिलान: $1 ध्वजांकित');
    hasMatch = true;
  }
  if (/Cross-Institution\s+Matches\s*:\s*(?:None\s*(?:Detected)?|कोई\s*नहीं\s*(?:मिला)?)/i.test(result)) {
    result = result.replace(/Cross-Institution\s+Matches\s*:\s*(?:None\s*(?:Detected)?|कोई\s*नहीं\s*(?:मिला)?)/gi, 'अंतर-संस्थान मिलान: कोई नहीं मिला');
    hasMatch = true;
  }

  // Pattern: "Inspect Deduplication Resolution Desk" / "निरीक्षण करें Deduplication Resolution Desk"
  if (/(?:Inspect|निरीक्षण\s*करें)?\s*Deduplication\s+Resolution\s+Desk/i.test(result)) {
    result = result.replace(/(?:Inspect|निरीक्षण\s*करें)?\s*Deduplication\s+Resolution\s+Desk/gi, 'डुप्लिकेट समाधान डेस्क का निरीक्षण करें');
    hasMatch = true;
  }

  // Pattern: "Authority File Link" / "Authority फ़ाइल Link"
  if (/Authority\s+(?:File|फ़ाइल)\s+(?:Access\s+)?Link/i.test(result)) {
    result = result.replace(/Authority\s+(?:File|फ़ाइल)\s+(?:Access\s+)?Link/gi, 'प्राधिकरण फ़ाइल लिंक');
    hasMatch = true;
  }

  // Pattern: "AICTE Demographics and Rule Catalog v0.1.0 executed across 65 candidate records."
  if (/AICTE\s+Demographics\s+and\s+Rule\s+Catalog\s+(v?[\d.]+)\s+executed\s+across\s+(\d+)\s+candidate\s+(?:records|रिकॉर्ड)\.?/i.test(result)) {
    result = result.replace(
      /AICTE\s+Demographics\s+and\s+Rule\s+Catalog\s+(v?[\d.]+)\s+executed\s+across\s+(\d+)\s+candidate\s+(?:records|रिकॉर्ड)\.?/gi,
      'एआईसीटीई जनसांख्यिकी एवं नियम कैटलॉग $1 को $2 उम्मीदवार रिकॉर्ड पर निष्पादित किया गया।'
    );
    hasMatch = true;
  }

  // Pattern: Schema drift full sentence
  if (/Header\s*['‘"]([^'’"]+)['’"]\s*has\s*shifted\s*from\s*canonical\s*['‘"]([^'’"]+)['’"]\s*\(([^)]+)\)\.\s*Column\s*mapping\s*profile\s*updated\s*to\s*maintain\s*backward\s*compatibility\.?/i.test(result)) {
    result = result.replace(
      /Header\s*['‘"]([^'’"]+)['’"]\s*has\s*shifted\s*from\s*canonical\s*['‘"]([^'’"]+)['’"]\s*\(([^)]+)\)\.\s*Column\s*mapping\s*profile\s*updated\s*to\s*maintain\s*backward\s*compatibility\.?/gi,
      'शीर्षक \'$1\' प्रामाणिक \'$2\' ($3) से परिवर्तित हुआ है। पश्चगामी संगतता बनाए रखने के लिए कॉलम मैपिंग प्रोफ़ाइल अद्यतन की गई।'
    );
    hasMatch = true;
  }

  // Pattern: Schema drift chunk "' (COLUMN_RENAMED). Column mapping profile updated to maintain backward compatibility."
  if (/^'\s*\(([A-Z_]+)\)\.\s*Column\s+mapping\s+profile\s+updated\s+to\s+maintain\s+backward\s+compatibility\.?/i.test(result.trim())) {
    result = result.replace(
      /^'\s*\(([A-Z_]+)\)\.\s*Column\s+mapping\s+profile\s+updated\s+to\s+maintain\s+backward\s+compatibility\.?/gi,
      '\' ($1) से बदला है। पश्चगामी संगतता बनाए रखने के लिए कॉलम मैपिंग प्रोफ़ाइल अद्यतन की गई।'
    );
    hasMatch = true;
  }

  // Pattern: Next Step issue review full sentence
  if (/(?:error\(s\)|त्रुटि\(s\)|त्रुटियां|त्रुटि\(यां\))\s*and\s*.*(?:warning\(s\)|चेतावनी\(s\)|चेतावनी\(यां\))\s*require\s*review/i.test(result)) {
    result = result.replace(
      /(\d+)\s*(?:error\(s\)|त्रुटि\(s\)|त्रुटियां|त्रुटि\(यां\))\s*and\s*(\d+)\s*(?:warning\(s\)|चेतावनी\(s\)|चेतावनी\(यां\))\s*require\s*review[.\s]*You\s*can\s*accept\s*automated\s*suggestions,\s*(?:edit|संपादित\s*करें)\s*cells\s*with\s*inline\s*rationale,\s*or\s*dismiss\s*items\.?/gi,
      '$1 त्रुटि(यां) और $2 चेतावनी(यां) समीक्षा योग्य हैं। आप स्वचालित सुझाव स्वीकार कर सकते हैं, इनलाइन औचित्य के साथ सेल संपादित कर सकते हैं, या खारिज कर सकते हैं।'
    );
    hasMatch = true;
  }

  // Pattern: Next Step issue review partial text nodes
  if (/^\s*(?:error\(s\)|त्रुटि\(s\))\s+and\s*$/i.test(result)) {
    result = result.replace(/^\s*(?:error\(s\)|त्रुटि\(s\))\s+and\s*$/gi, ' त्रुटि(यां) और ');
    hasMatch = true;
  }
  if (/^\s*(?:warning\(s\)|चेतावनी\(s\)|चेतावनी\(यां\))\s*require\s*review/i.test(result)) {
    result = result.replace(
      /^\s*(?:warning\(s\)|चेतावनी\(s\)|चेतावनी\(यां\))\s*require\s*review[.\s]*You\s*can\s*accept\s*automated\s*suggestions,\s*(?:edit|संपादित\s*करें)\s*cells\s*with\s*inline\s*rationale,\s*or\s*dismiss\s*items\.?/gi,
      ' चेतावनी(यां) समीक्षा योग्य हैं। आप स्वचालित सुझाव स्वीकार कर सकते हैं, इनलाइन औचित्य के साथ सेल संपादित कर सकते हैं, या खारिज कर सकते हैं।'
    );
    hasMatch = true;
  }

  // Pattern: "No Student Data Uploaded Yet" or Hinglish
  if (/No\s+(?:Student|विद्यार्थी)\s+Data\s+Uploaded\s+Yet/i.test(result)) {
    result = 'अभी तक कोई छात्र डेटा अपलोड नहीं हुआ';
    hasMatch = true;
  }

  // Pattern: "No student admission batches have been ingested yet..." or Hinglish
  if (/No\s+(?:student|विद्यार्थी)\s+admission\s+batches\s+have\s+been\s+ingested/i.test(result)) {
    result = 'अभी तक कोई छात्र प्रवेश बैच अंतर्ग्रहीत नहीं किया गया है। सभी नामांकन आंकड़े, डेटा गुणवत्ता स्कोर और वैधानिक सत्यापन वर्तमान में शून्य पर सेट हैं। वास्तविक समय के विश्लेषण देखने के लिए अपने संस्थान की बैच फ़ाइल अपलोड करें या डेमो दस्तावेज़ लोड करें।';
    hasMatch = true;
  }

  // Pattern: "No student records uploaded" or Hinglish
  if (/No\s+(?:student|विद्यार्थी)\s+(?:records|रिकॉर्ड)\s+uploaded/i.test(result)) {
    result = 'कोई छात्र रिकॉर्ड अपलोड नहीं हुआ';
    hasMatch = true;
  }

  // Pattern: "No Issues Pending" or Hinglish
  if (/No\s+Issues\s+(?:Pending|लंबित)/i.test(result)) {
    result = 'कोई मुद्दा लंबित नहीं';
    hasMatch = true;
  }

  // Pattern: "No Enrolment Records" or Hinglish
  if (/No\s+Enrolment\s+(?:Records|रिकॉर्ड)/i.test(result)) {
    result = 'कोई नामांकन रिकॉर्ड नहीं';
    hasMatch = true;
  }

  // Pattern: "Intake ceiling comparisons per program will populate..." or Hinglish
  if (/Intake\s+ceiling\s+comparisons\s+per\s+program\s+will\s+populate/i.test(result)) {
    result = 'छात्र प्रवेश बैच अपलोड होने के बाद कार्यक्रम-वार प्रवेश सीमा तुलना यहाँ प्रदर्शित होगी।';
    hasMatch = true;
  }

  // Pattern: "No Open Issues" or Hinglish
  if (/No\s+(?:Open\s+Issues|सक्रिय\s+मुद्दे)/i.test(result)) {
    result = 'कोई सक्रिय मुद्दा नहीं';
    hasMatch = true;
  }

  // Pattern: "No data uploaded yet. Ingest student admission records..." or Hinglish
  if (/No\s+data\s+uploaded\s+yet\.\s*Ingest\s+(?:student|विद्यार्थी)\s+admission/i.test(result)) {
    result = 'अभी तक कोई डेटा अपलोड नहीं हुआ। वैधानिक सत्यापन जांच चलाने के लिए छात्र प्रवेश रिकॉर्ड अंतर्ग्रहीत करें।';
    hasMatch = true;
  }

  // Pattern: Conflict banner in Batch List Page
  if (/Batch\s+([^\s(]+)\s*\(([^)]+)\)\s*for\s*(?:Academic\s+Year|शैक्षणिक\s+वर्ष)\s*(\d{4}-\d{2})\s+is\s+currently\s+([A-Z_]+)\.?\s*(?:New|नई)?\s*uploads\s*will\s*require\s*setting\s*this\s*batch\s*as\s*superseded\.?/i.test(result)) {
    result = result.replace(
      /Batch\s+([^\s(]+)\s*\(([^)]+)\)\s*for\s*(?:Academic\s+Year|शैक्षणिक\s+वर्ष)\s*(\d{4}-\d{2})\s+is\s+currently\s+([A-Z_]+)\.?\s*(?:New|नई)?\s*uploads\s*will\s*require\s*setting\s*this\s*batch\s*as\s*superseded\.?/gi,
      'बैच $1 ($2) शैक्षणिक वर्ष $3 के लिए वर्तमान में समीक्षाधीन है। नए अपलोड के लिए इस बैच को अतिक्रमित के रूप में सेट करना होगा।'
    );
    hasMatch = true;
  }
  if (/^\s*is\s+currently\s+([A-Z_]+)\.?\s*(?:New|नई)?\s*uploads\s*will\s*require\s*setting\s*this\s*batch\s*as\s*superseded\.?/i.test(result.trim())) {
    result = result.replace(
      /^\s*is\s+currently\s+([A-Z_]+)\.?\s*(?:New|नई)?\s*uploads\s*will\s*require\s*setting\s*this\s*batch\s*as\s*superseded\.?/gi,
      'वर्तमान में समीक्षाधीन है। नए अपलोड के लिए इस बैच को अतिक्रमित के रूप में सेट करना होगा।'
    );
    hasMatch = true;
  }

  // Pattern: "0 batch record(s)", "3 batch record(s)"
  if (/(\d+)\s*batch\s*records?\(s\)?/i.test(result)) {
    result = result.replace(/(\d+)\s*batch\s*records?\(s\)?/gi, '$1 बैच रिकॉर्ड');
    hasMatch = true;
  }

  // Pattern: "2 warn", "5 warn"
  if (/(\d+)\s*warn\b/i.test(result)) {
    result = result.replace(/(\d+)\s*warn\b/gi, '$1 चेतावनी');
    hasMatch = true;
  }

  // Pattern: "12 error(s)", "12 त्रुटि(s)"
  if (/(\d+)\s*(?:error\(s\)|त्रुटि\(s\)|त्रुटियां)(?=[\s,.:;!?"'()•/\\-–—+*|~#]|$)/i.test(result)) {
    result = result.replace(/(\d+)\s*(?:error\(s\)|त्रुटि\(s\)|त्रुटियां)(?=[\s,.:;!?"'()•/\\-–—+*|~#]|$)/gi, '$1 त्रुटियां');
    hasMatch = true;
  }

  // Pattern: "Uploaded: 65 students"
  if (/Uploaded:\s*(\d+)\s*students/i.test(result)) {
    result = result.replace(/Uploaded:\s*(\d+)\s*students/gi, 'अपलोड किए गए: $1 छात्र');
    hasMatch = true;
  }

  // Pattern: "Approved Sanction: 60 intake" or "स्वीकृत Sanction: 60 intake"
  if (/(?:Approved\s+Sanction|स्वीकृत\s+Sanction)\s*:\s*(\d+)\s*(?:intake|सीटें)?/i.test(result)) {
    result = result.replace(/(?:Approved\s+Sanction|स्वीकृत\s+Sanction)\s*:\s*(\d+)\s*(?:intake|सीटें)?/gi, 'स्वीकृत सीटें: $1');
    hasMatch = true;
  }

  // Pattern: "Over-intake variance: 3 students" or "Over-Intake variance: 3 students"
  if (/(?:Over-intake|Over-Intake)\s+variance\s*:\s*(\d+)\s*students/i.test(result)) {
    result = result.replace(/(?:Over-intake|Over-Intake)\s+variance\s*:\s*(\d+)\s*students/gi, 'अतिरिक्त प्रवेश अंतर: $1 छात्र');
    hasMatch = true;
  }

  // Pattern: "Issues Queue (5)"
  if (/Issues\s+Queue\s*\((\d+)\)/i.test(result)) {
    result = result.replace(/Issues\s+Queue\s*\((\d+)\)/gi, 'मुद्दा कतार ($1)');
    hasMatch = true;
  }

  // Pattern: "Duplicates (1)"
  if (/Duplicates\s*\((\d+)\)/i.test(result)) {
    result = result.replace(/Duplicates\s*\((\d+)\)/gi, 'डुप्लिकेट ($1)');
    hasMatch = true;
  }

  // Pattern: "5 Pending (5 Total)" or "5 लंबित (5 Total)"
  if (/(\d+)\s*(?:Pending|लंबित)\s*\((\d+)\s*Total\)/i.test(result)) {
    result = result.replace(/(\d+)\s*(?:Pending|लंबित)\s*\((\d+)\s*Total\)/gi, '$1 लंबित (कुल $2)');
    hasMatch = true;
  }

  // Pattern: "Showing 5 of 5 issues (Sorted: Priority CRITICAL→LOW, then Row)" or Hinglish
  if (/Showing\s*(\d+)\s*of\s*(\d+)\s*issues(?:\s*\((?:Sorted:\s*)?Priority\s*CRITICAL→LOW,\s*then\s*(?:Row|पंक्ति)\))?/i.test(result)) {
    result = result.replace(
      /Showing\s*(\d+)\s*of\s*(\d+)\s*issues(?:\s*\((?:Sorted:\s*)?Priority\s*CRITICAL→LOW,\s*then\s*(?:Row|पंक्ति)\))?/gi,
      '$1 में से $2 मुद्दे प्रदर्शित (क्रमबद्ध: प्राथमिकता गंभीर→निम्न, फिर पंक्ति)'
    );
    hasMatch = true;
  }
  if (/^\s*Showing\s*$/i.test(result)) {
    result = 'प्रदर्शित ';
    hasMatch = true;
  }
  if (/^\s*of\s*(\d+)\s*issues(?:\s*\((?:Sorted:\s*)?Priority\s*CRITICAL→LOW,\s*then\s*(?:Row|पंक्ति)\))?/i.test(result)) {
    result = result.replace(
      /^\s*of\s*(\d+)\s*issues(?:\s*\((?:Sorted:\s*)?Priority\s*CRITICAL→LOW,\s*then\s*(?:Row|पंक्ति)\))?/gi,
      ' में से $1 मुद्दे (क्रमबद्ध: प्राथमिकता गंभीर→निम्न, फिर पंक्ति)'
    );
    hasMatch = true;
  }

  // Pattern: "Field: apaar_id"
  if (/^Field:\s*(.*)$/i.test(result.trim())) {
    result = result.replace(/^Field:\s*/i, 'फ़ील्ड: ');
    hasMatch = true;
  }

  // Pattern: "Rationale: Prepend missing leading zero"
  if (/^Rationale:\s*(.*)$/i.test(result.trim())) {
    result = result.replace(/^Rationale:\s*/i, 'औचित्य: ');
    hasMatch = true;
  }

  // Pattern: "12 त्रुटि(s)" or single error(s)
  if (/(\d+)\s*त्रुटि\(s\)/gi.test(result)) {
    result = result.replace(/(\d+)\s*त्रुटि\(s\)/gi, '$1 त्रुटियां');
    hasMatch = true;
  }
  if (/^\s*(?:error\(s\)|त्रुटि\(s\))\s*$/i.test(result)) {
    result = 'त्रुटियां';
    hasMatch = true;
  }

  // Pattern: Statutory override notice banner (full or partial Hinglish)
  if (/(?:When\s+a\s+(?:destination|गंतव्य)\s+(?:institution|संस्थान)\s+creates\s+a\s+(?:transfer|स्थानांतरण)\s+request|15-दिवसीय\s+एआईसीटीई\s+वैधानिक\s+ओवरराइड)/i.test(result)) {
    result = result.replace(
      /When\s+a\s+(?:destination|गंतव्य)\s+(?:institution|संस्थान)\s+creates\s+a\s+(?:transfer|स्थानांतरण)\s+request.*?(?:Rule\s+V010|नियम\s+V010)[^.]*\.?/gis,
      'जब कोई गंतव्य संस्थान स्थानांतरण अनुरोध बनाता है, तो स्रोत संस्थान को निर्णय लेने के लिए ठीक 15 कैलेंडर दिन (नोट के साथ स्वीकृत या अस्वीकार) दिए जाते हैं। यदि 15 दिनों से अधिक समय तक कोई कार्रवाई नहीं होती है, तो एआईसीटीई केंद्रीय डेस्क स्वतः प्रशासनिक ओवरराइड निष्पादित करता है। स्वीकृत या ओवरराइड किए गए स्थानांतरण स्रोत रिकॉर्ड को सुरक्षित रूप से स्थानांतरित (बाहर) में बदल देते हैं, जिससे यह सुनिश्चित होता है कि गंतव्य नामांकन से डुप्लिकेट छात्र फ़्लैग (नियम V010) ट्रिगर नहीं होंगे।'
    );
    hasMatch = true;
  }

  // Pattern: "Decided 8/4/2026", "Decided 2026-08-04"
  if (/Decided\s+(\d+[\/.-]\d+[\/.-]\d+)/i.test(result)) {
    result = result.replace(/Decided\s+(\d+[\/.-]\d+[\/.-]\d+)/gi, 'निर्णय: $1');
    hasMatch = true;
  }

  // Pattern: "All Students (8)", "सभी Students (8)"
  if (/(?:All|सभी)\s+Students?\s*\((\d+)\)/i.test(result)) {
    result = result.replace(/(?:All|सभी)\s+Students?\s*\((\d+)\)/gi, 'सभी छात्र ($1)');
    hasMatch = true;
  }

  // Pattern: "Year 1 · UG", "Year 2 · PG", "Year 4 · UG"
  if (/Year\s*(\d+)\s*(?:·|&middot;)\s*UG/i.test(result)) {
    result = result.replace(/Year\s*(\d+)\s*(?:·|&middot;)\s*UG/gi, 'वर्ष $1 · स्नातक (UG)');
    hasMatch = true;
  }
  if (/Year\s*(\d+)\s*(?:·|&middot;)\s*PG/i.test(result)) {
    result = result.replace(/Year\s*(\d+)\s*(?:·|&middot;)\s*PG/gi, 'वर्ष $1 · स्नातकोत्तर (PG)');
    hasMatch = true;
  }
  if (/Year\s*(\d+)\s*(?:·|&middot;)\s*Diploma/i.test(result)) {
    result = result.replace(/Year\s*(\d+)\s*(?:·|&middot;)\s*Diploma/gi, 'वर्ष $1 · डिप्लोमा');
    hasMatch = true;
  }

  // Pattern: Search placeholder
  if (/(?:Search|खोजें)\s+by\s+(?:student\s+name|छात्र\s+का\s+नाम)/i.test(result)) {
    result = 'छात्र का नाम, अपार आईडी, या रोल नंबर द्वारा खोजें...';
    hasMatch = true;
  }

  // Pattern: Student identities verified banner
  if (/(?:Student|विद्यार्थी)\s+identities\s+verified\s+via\s+Central\s+APAAR\s+registry/i.test(result)) {
    result = 'डीपीडीपी (DPDP) अधिनियम छात्र सहमति स्थिति और शाखा परिवर्तन ट्रैकिंग के साथ केंद्रीय अपार रजिस्ट्री द्वारा सत्यापित छात्र पहचान';
    hasMatch = true;
  }

  // Pattern: Canonical student records subtitle
  if (/Canonical\s+(?:student|विद्यार्थी)\s+(?:records|रिकॉर्ड)\s+keyed\s+by\s+12-digit/i.test(result)) {
    result = 'अपरिवर्तनीय शाखा परिवर्तन इतिहास और बहु-प्रवेश/निकास बिंदुओं के साथ 12-अंकीय अपार आईडी द्वारा सुरक्षित प्रामाणिक छात्र रिकॉर्ड';
    hasMatch = true;
  }

  // 3. Phrase match for composite texts with extended punctuation boundaries
  for (const key of SORTED_KEYS) {
    if (key.length >= 3) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<=^|\\s|[,.:;!?"'()•/\\-–—+*|~#])` + escaped + `(?=$|\\s|[,.:;!?"'()•/\\-–—+*|~#])`, 'gi');
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
