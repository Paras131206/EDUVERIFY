"""
Excel Template Generator for Student Data Upload.
Generates an .xlsx workbook with:
1. 'StudentData' sheet with canonical column headers, APAAR column formatted as Text (@),
   and dropdown data validation for enumerated fields.
2. 'Instructions' sheet with complete bilingual instructions in English and Hindi.
Complies with prompt B2 item 5 and agents.md §5, §7.
"""

import io

import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from sqlalchemy.orm import Session

CANONICAL_COLUMNS = [
    ("apaar_id", "APAAR ID (12 digits, Text)", True),
    ("institution_aicte_id", "AICTE Institution ID", True),
    ("institution_student_id", "Roll / PRN / Enrolment No", True),
    ("full_name", "Student Full Name", True),
    ("dob", "Date of Birth (YYYY-MM-DD)", True),
    ("gender", "Gender (M/F/T)", True),
    ("category", "Category (GEN/EWS/OBC-NCL/SC/ST)", True),
    ("pwd", "Person with Disability (True/False)", False),
    ("program_code", "Program Code (e.g. UG-CSE)", True),
    ("course_level", "Course Level (DIPLOMA/UG/PG/PGDM/PHD)", True),
    ("department", "Department", False),
    ("academic_year", "Academic Year (e.g. 2026-27)", True),
    ("year_of_study", "Year of Study (1-6)", True),
    ("admission_date", "Admission Date (YYYY-MM-DD)", True),
    ("admission_type", "Admission Type (REGULAR/LATERAL/TRANSFER_IN)", True),
    ("expected_graduation_year", "Expected Graduation Year", False),
    ("seat_type", "Seat Type (REGULAR/SUPERNUMERARY)", True),
    ("supernumerary_scheme", "Supernumerary Scheme (TFW/PMSSS/JK/NE/etc.)", False),
    ("quota", "Quota (NONE/NRI/OCI/FN/PIO/CIWG)", True),
    ("nationality", "Nationality (ISO Alpha-2, e.g. IN)", True),
    ("nri_status", "NRI Status (True/False)", True),
    ("oci_status", "OCI Status (True/False)", True),
    ("fn_status", "Foreign National Status (True/False)", True),
    ("enrolment_status", "Enrolment Status (ACTIVE/WITHDRAWN/etc.)", True),
    ("consent_status", "Consent Status (GRANTED/REFUSED/WITHDRAWN)", True),
    ("consent_date", "Consent Date (YYYY-MM-DD)", False),
    ("guardian_consent", "Guardian Consent (True/False)", False),
    ("email", "Student Email Address", False),
    ("mobile", "Student Mobile Number (10 digits)", False),
]

ENUM_DROPDOWNS = {
    "gender": '"M,F,T"',
    "category": '"GEN,EWS,OBC-NCL,SC,ST"',
    "pwd": '"True,False"',  # nosec B105
    "course_level": '"DIPLOMA,UG,PG,PGDM,PHD"',
    "admission_type": '"REGULAR,LATERAL,TRANSFER_IN"',
    "seat_type": '"REGULAR,SUPERNUMERARY"',
    "supernumerary_scheme": '"TFW,PMSSS,JK,NE,FN_OCI_NRI,PWD,OTHER"',
    "quota": '"NONE,NRI,OCI,FN,PIO,CIWG"',
    "nri_status": '"True,False"',
    "oci_status": '"True,False"',
    "fn_status": '"True,False"',
    "enrolment_status": '"ACTIVE,WITHDRAWN,DEFERRED,TRANSFERRED_OUT,COMPLETED,GRADUATED"',
    "consent_status": '"GRANTED,REFUSED,WITHDRAWN"',
    "guardian_consent": '"True,False"',
}

INSTRUCTIONS_DATA = [
    (
        "apaar_id",
        "Mandatory 12-digit APAAR ID. MUST BE KEPT AS TEXT. "
        "Do not let Excel truncate leading zeros.",
        "अनिवार्य 12-अंकीय अपार आईडी। इसे टेक्स्ट के रूप में ही रखें। एक्सेल को शुरुआत के शून्य हटाने न दें।",
        "Yes / हाँ",
        "CRITICAL: 12 numeric digits only / केवल 12 अंक",
    ),
    (
        "institution_aicte_id",
        "AICTE Permanent Institute ID assigned to your institution.",
        "आपके संस्थान को आवंटित एआईसीटीई स्थायी संस्थान आईडी।",
        "Yes / हाँ",
        "Must match your login institution / आपके संस्थान से मेल खाना चाहिए",
    ),
    (
        "institution_student_id",
        "Unique student identifier (Roll Number, PRN, or Registration Number).",
        "अद्वितीय छात्र पहचानकर्ता (रोल नंबर, पीआरएन, या पंजीकरण संख्या)।",
        "Yes / हाँ",
        "Unique within institution + academic year / संस्थान और वर्ष में अद्वितीय",
    ),
    (
        "full_name",
        "Student legal full name as recorded in official identity documents.",
        "छात्र का आधिकारिक पहचान दस्तावेजों में दर्ज पूरा कानूनी नाम।",
        "Yes / हाँ",
        "Matches APAAR registry / अपार रिकॉर्ड से मिलान होगा",
    ),
    (
        "dob",
        "Date of Birth in ISO format: YYYY-MM-DD (e.g. 2006-05-15).",
        "जन्म तिथि आईएसओ प्रारूप में: YYYY-MM-DD (उदा. 2006-05-15)।",
        "Yes / हाँ",
        "Format strictly YYYY-MM-DD / प्रारूप YYYY-MM-DD होना चाहिए",
    ),
    (
        "gender",
        "Gender: M (Male), F (Female), T (Transgender).",
        "लिंग: M (पुरुष), F (महिला), T (ट्रांसजेंडर)।",
        "Yes / हाँ",
        "Select from dropdown / ड्रॉपडाउन से चुनें",
    ),
    (
        "category",
        "Social reservation category: GEN, EWS, OBC-NCL, SC, ST.",
        "सामाजिक आरक्षण श्रेणी: GEN, EWS, OBC-NCL, SC, ST।",
        "Yes / हाँ",
        "Select from dropdown / ड्रॉपडाउन से चुनें",
    ),
    (
        "program_code",
        "Approved AICTE Program Code (e.g. UG-CSE, UG-IT, DIP-ME).",
        "स्वीकृत एआईसीटीई कार्यक्रम कोड (उदा. UG-CSE, UG-IT, DIP-ME)।",
        "Yes / हाँ",
        "Must exist in AICTE master / मास्टर डेटा में मौजूद होना चाहिए",
    ),
    (
        "course_level",
        "Level of study: DIPLOMA, UG, PG, PGDM, PHD.",
        "अध्ययन का स्तर: DIPLOMA, UG, PG, PGDM, PHD।",
        "Yes / हाँ",
        "Must match program definition / कार्यक्रम से मेल खाना चाहिए",
    ),
    (
        "academic_year",
        "Academic Year in YYYY-YY format (e.g. 2026-27).",
        "शैक्षणिक वर्ष YYYY-YY प्रारूप में (उदा. 2026-27)।",
        "Yes / हाँ",
        "Must match active admission cycle / सक्रिय प्रवेश चक्र",
    ),
    (
        "year_of_study",
        "Current year of study: 1, 2, 3, 4, 5, or 6.",
        "वर्तमान अध्ययन वर्ष: 1, 2, 3, 4, 5, या 6।",
        "Yes / हाँ",
        "Lateral entry must be 2 or higher / लेटरल एंट्री वर्ष 2 या अधिक",
    ),
    (
        "admission_date",
        "Official date of admission in YYYY-MM-DD format.",
        "प्रवेश की आधिकारिक तिथि YYYY-MM-DD प्रारूप में।",
        "Yes / हाँ",
        "Inside academic year admission window / प्रवेश विंडो के अंदर",
    ),
    (
        "admission_type",
        "Mode of admission: REGULAR, LATERAL, or TRANSFER_IN.",
        "प्रवेश का प्रकार: REGULAR, LATERAL, या TRANSFER_IN।",
        "Yes / हाँ",
        "Select from dropdown / ड्रॉपडाउन से चुनें",
    ),
    (
        "seat_type",
        "Seat classification: REGULAR or SUPERNUMERARY.",
        "सीट वर्गीकरण: REGULAR या SUPERNUMERARY।",
        "Yes / हाँ",
        "Select from dropdown / ड्रॉपडाउन से चुनें",
    ),
    (
        "supernumerary_scheme",
        "Scheme name if seat is SUPERNUMERARY: TFW, PMSSS, JK, NE, FN_OCI_NRI, PWD, OTHER.",
        "यदि सीट SUPERNUMERARY है तो योजना: TFW, PMSSS, JK, NE, FN_OCI_NRI, PWD, OTHER।",
        "Conditional / शर्त",
        "Required if seat_type is SUPERNUMERARY / अधिसंख्य सीट के लिए आवश्यक",
    ),
    (
        "quota",
        "Quota: NONE, NRI, OCI, FN, PIO, CIWG.",
        "कोटा: NONE, NRI, OCI, FN, PIO, CIWG।",
        "Yes / हाँ",
        "Must align with nationality / राष्ट्रीयता के अनुरूप",
    ),
    (
        "nationality",
        "ISO 3166-1 alpha-2 country code (e.g. IN for India, US for USA).",
        "आईएसओ 3166-1 अल्फा-2 देश कोड (उदा. भारत के लिए IN)।",
        "Yes / हाँ",
        "Standard 2 letters / 2 अक्षरों का कोड",
    ),
    (
        "enrolment_status",
        "Status: ACTIVE, WITHDRAWN, DEFERRED, TRANSFERRED_OUT, COMPLETED, GRADUATED.",
        "स्थिति: ACTIVE, WITHDRAWN, DEFERRED, TRANSFERRED_OUT, COMPLETED, GRADUATED।",
        "Yes / हाँ",
        "Default is ACTIVE for admissions / प्रवेश हेतु ACTIVE",
    ),
    (
        "consent_status",
        "DPDP Act student consent status: GRANTED, REFUSED, WITHDRAWN.",
        "डीपीडीपी अधिनियम सहमति स्थिति: GRANTED, REFUSED, WITHDRAWN।",
        "Yes / हाँ",
        "Required for central repo storage / केंद्रीय भंडार हेतु आवश्यक",
    ),
    (
        "email",
        "Student email address (encrypted at rest in database).",
        "छात्र का ईमेल पता (डेटाबेस में एन्क्रिप्टेड रखा जाता है)।",
        "No / नहीं",
        "Valid email format / वैध ईमेल प्रारूप",
    ),
    (
        "mobile",
        "Student 10-digit mobile number (encrypted at rest in database).",
        "छात्र का 10-अंकीय मोबाइल नंबर (डेटाबेस में एन्क्रिप्टेड रखा जाता है)।",
        "No / नहीं",
        "10 numeric digits / 10 अंक",
    ),
]


def generate_student_upload_template(db: Session | None = None) -> bytes:
    """
    Generate the official Excel template for student data upload.
    Returns the binary content of the .xlsx file.
    """
    wb = openpyxl.Workbook()

    # Style definitions
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    req_fill = PatternFill(start_color="203764", end_color="203764", fill_type="solid")
    inst_header_fill = PatternFill(start_color="2E75B6", end_color="2E75B6", fill_type="solid")
    white_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    bold_font = Font(name="Calibri", size=11, bold=True)
    regular_font = Font(name="Calibri", size=11)
    title_font = Font(name="Calibri", size=14, bold=True, color="1F4E79")
    thin_border = Border(
        left=Side(style="thin", color="D9D9D9"),
        right=Side(style="thin", color="D9D9D9"),
        top=Side(style="thin", color="D9D9D9"),
        bottom=Side(style="thin", color="D9D9D9"),
    )

    # -------------------------------------------------------------
    # Sheet 1: StudentData
    # -------------------------------------------------------------
    ws_data = wb.active
    ws_data.title = "StudentData"

    # Write column headers
    for col_idx, (col_name, _friendly_name, is_req) in enumerate(CANONICAL_COLUMNS, start=1):
        cell = ws_data.cell(row=1, column=col_idx, value=col_name)
        cell.font = white_font
        cell.fill = req_fill if is_req else header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    ws_data.row_dimensions[1].height = 28

    # Apply APAAR column formatting strictly as Text ('@')
    # Column A is apaar_id (index 1)
    for row in range(2, 1002):
        cell = ws_data.cell(row=row, column=1)
        cell.number_format = "@"

    # Attach DataValidation dropdowns
    for col_idx, (col_name, _, _) in enumerate(CANONICAL_COLUMNS, start=1):
        if col_name in ENUM_DROPDOWNS:
            formula = ENUM_DROPDOWNS[col_name]
            dv = DataValidation(
                type="list",
                formula1=formula,
                allow_blank=True,
                showDropDown=False,  # False shows the in-cell dropdown arrow in Excel
            )
            col_letter = get_column_letter(col_idx)
            dv.add(f"{col_letter}2:{col_letter}1001")
            ws_data.add_data_validation(dv)

    # Auto-adjust column widths
    for col_idx, (col_name, _, _) in enumerate(CANONICAL_COLUMNS, start=1):
        col_letter = get_column_letter(col_idx)
        ws_data.column_dimensions[col_letter].width = max(len(col_name) + 4, 16)

    # -------------------------------------------------------------
    # Sheet 2: Instructions (Bilingual English + Hindi)
    # -------------------------------------------------------------
    ws_inst = wb.create_sheet(title="Instructions")

    # Title Banner
    ws_inst.merge_cells("A1:E1")
    title_cell = ws_inst["A1"]
    title_cell.value = (
        "AICTE EduVerify — Student Admission Data Upload Instructions / छात्र प्रवेश डेटा अपलोड निर्देश"
    )
    title_cell.font = title_font
    title_cell.alignment = Alignment(horizontal="left", vertical="center")
    ws_inst.row_dimensions[1].height = 30

    # General Note Banner
    ws_inst.merge_cells("A2:E2")
    note_cell = ws_inst["A2"]
    note_cell.value = (
        "IMPORTANT: Do not modify column headers in 'StudentData'. "
        "Format APAAR IDs as Text. Dates must be YYYY-MM-DD.\n"
        "महत्वपूर्ण: 'StudentData' शीट के हेडर न बदलें। "
        "अपार आईडी को टेक्स्ट प्रारूप में रखें। तारीखें YYYY-MM-DD होनी चाहिए।"
    )
    note_cell.font = Font(name="Calibri", size=10, italic=True, color="C00000")
    note_cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    ws_inst.row_dimensions[2].height = 36

    # Instruction Table Headers
    inst_headers = [
        "Field Name / फ़ील्ड नाम",
        "Description (English)",
        "विवरण (हिन्दी)",
        "Mandatory? / अनिवार्य?",
        "Validation Rule / सत्यापन नियम",
    ]
    for col_idx, header_text in enumerate(inst_headers, start=1):
        cell = ws_inst.cell(row=4, column=col_idx, value=header_text)
        cell.font = white_font
        cell.fill = inst_header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    ws_inst.row_dimensions[4].height = 26

    # Populate instructions rows
    for row_idx, row_data in enumerate(INSTRUCTIONS_DATA, start=5):
        for col_idx, val in enumerate(row_data, start=1):
            cell = ws_inst.cell(row=row_idx, column=col_idx, value=val)
            cell.font = bold_font if col_idx == 1 else regular_font
            cell.border = thin_border
            cell.alignment = Alignment(
                horizontal="center" if col_idx == 4 else "left",
                vertical="center",
                wrap_text=True,
            )
        ws_inst.row_dimensions[row_idx].height = 24

    # Set column widths for instructions sheet
    ws_inst.column_dimensions["A"].width = 24
    ws_inst.column_dimensions["B"].width = 45
    ws_inst.column_dimensions["C"].width = 45
    ws_inst.column_dimensions["D"].width = 18
    ws_inst.column_dimensions["E"].width = 38

    # Save to memory stream
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output.getvalue()
