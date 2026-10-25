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

  // Aggregates Extended
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

  // Step 3: Validate
  "Step 3: Validation Engine Progress": "चरण 3: सत्यापन इंजन प्रगति",
  "Validating student admission records against national AICTE statutory guidelines...": "राष्ट्रीय एआईसीटीई वैधानिक दिशानिर्देशों के अनुसार छात्र प्रवेश रिकॉर्ड का सत्यापन जारी...",
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
  "Validation in Progress": "सत्यापन प्रगति पर है",
  "Validation Complete": "सत्यापन पूर्ण हुआ",
  "Proceed to Summary": "सारांश पर आगे बढ़ें",

  // Step 4: Summary
  "Step 4: Batch Validation Summary & Health Report": "चरण 4: बैच सत्यापन सारांश एवं स्वास्थ्य रिपोर्ट",
  "Review detailed validation results, error breakdown, and intake ceiling reconciliation before committing records.": "रिकॉर्ड कमिट करने से पहले विस्तृत सत्यापन परिणाम, त्रुटि विवरण और प्रवेश सीमा समाधान की समीक्षा करें।",
  "Download XLSX": "XLSX डाउनलोड करें",
  "Download PDF Report": "PDF रिपोर्ट डाउनलोड करें",
  "Total Records Processed": "कुल प्रसंस्कृत रिकॉर्ड",
  "Valid Records (Zero Errors)": "मान्य रिकॉर्ड (शून्य त्रुटियां)",
  "Records with Warnings": "चेतावनियों वाले रिकॉर्ड",
  "Records with Critical Errors": "गंभीर त्रुटियों वाले रिकॉर्ड",
  "Intake Ceiling vs Uploaded Headcount": "स्वीकृत प्रवेश सीमा बनाम अपलोड की गई संख्या",
  "Program-wise reconciliation against AICTE approved ceilings": "एआईसीटीई स्वीकृत सीमा के विरुद्ध कार्यक्रम-वार समाधान",
  "Detected Schema Drift": "पहचाना गया स्कीमा विचलन",

  // Commit Modal
  "Commit Batch to Central Repository": "बैच को केंद्रीय भंडार में कमिट करें",
  "Committed Records": "कमिट किए गए रिकॉर्ड",
  "Approved & Verifiable": "स्वीकृत एवं सत्यापन योग्य",
  "Excluded Records": "बहिष्कृत रिकॉर्ड",
  "Pending Human Review": "मानव समीक्षा लंबित",
  "Excluded / Unapproved Rows:": "बहिष्कृत / अस्वीकृत पंक्तियां:",
  "Excluded rows will remain in draft status and will NOT be committed until resolved.": "बहिष्कृत पंक्तियां ड्राफ्ट स्थिति में रहेंगी और समाधान होने तक कमिट नहीं की जाएंगी।",
  "Once committed, students will be issued SD-JWT credentials keyed to their 12-digit APAAR ID and become eligible for verification desks.": "एक बार कमिट होने के बाद, छात्रों को उनके 12-अंकीय अपार आईडी से जुड़े SD-JWT क्रेडेंशियल जारी किए जाएंगे और वे सत्यापन डेस्क के लिए पात्र हो जाएंगे।"
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

  // Pattern: "Target Academic Year: 2026-27"
  if (/Target\s+Academic\s+Year:\s*([^\s·]+)/i.test(result)) {
    result = result.replace(/Target\s+Academic\s+Year:\s*([^\s·]+)/gi, 'लक्षित शैक्षणिक वर्ष: $1');
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
