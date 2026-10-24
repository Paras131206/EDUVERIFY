import React from 'react';
import { Button } from '@/components/ui/button';
import { StudentCredentialItem, StudentOwnRecord } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  credential: StudentCredentialItem | null;
  student: StudentOwnRecord | null;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  credential,
  student,
}) => {
  if (!isOpen || !credential || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  const verificationUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/verify?credential_id=${credential.id}`;

  return (
    <div
      role="dialog"
      aria-labelledby="cert-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
      data-testid="certificate-modal"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border-t-4 border-gov-navy overflow-hidden my-6">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-gov-navy text-white text-xs font-bold">A4</span>
            <h3 id="cert-modal-title" className="text-sm font-bold text-gov-navy">
              Official Degree / Enrolment Certificate Preview (Section 8.6 & PS Req 10)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs h-8"
              data-testid="print-certificate-btn"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print / Save as PDF
            </Button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate A4 Container Preview */}
        <div className="p-6 bg-slate-100 flex justify-center overflow-x-auto">
          <div
            className="bg-white border-4 border-double border-gov-navy p-8 shadow-md max-w-3xl w-full space-y-6 text-center text-slate-800"
            style={{ minHeight: '500px' }}
            data-testid="certificate-preview-container"
          >
            {/* Header */}
            <div className="border-b-2 border-slate-200 pb-4">
              <p className="text-xs font-bold text-gov-navy uppercase tracking-wider">
                अखिल भारतीय तकनीकी शिक्षा परिषद • ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
              </p>
              <h2 className="text-xl font-black text-gov-navy mt-1 uppercase">
                {credential.issuer_name}
              </h2>
              <p className="text-xs text-slate-500">
                Statutory Degree-Awarding Authority • Trust Root Registered
              </p>
            </div>

            {/* Title */}
            <div>
              <p className="text-xs font-bold text-gov-saffronDark">उपाधि प्रमाण पत्र</p>
              <h3 className="text-2xl font-black text-gov-navy tracking-wide">
                {credential.title}
              </h3>
            </div>

            {/* Conferment Text */}
            <div className="text-xs space-y-2 max-w-xl mx-auto leading-relaxed text-slate-700">
              <p>प्रमाणित किया जाता है कि / This is to certify that</p>
              <p className="text-lg font-bold text-slate-900 underline underline-offset-4">
                {student.full_name}
              </p>
              <p>
                having successfully fulfilled all statutory requirements in <strong>{student.academic_year}</strong>, has been admitted to the degree of
              </p>
              <p className="text-base font-bold text-gov-navy">
                {student.program_name} ({student.course_level})
              </p>
            </div>

            {/* PS Requirement 10: APAAR ID + Student ID Table */}
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-left">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">अपार पहचान पत्र / APAAR ID:</span>
                <span className="font-mono font-bold text-gov-navy text-sm" data-testid="cert-apaar-id">
                  {student.apaar_id}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">अनुक्रमांक / Student ID:</span>
                <span className="font-mono font-bold text-slate-900 text-sm" data-testid="cert-student-id">
                  {student.institution_student_id}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">संबद्ध संस्थान / Institution:</span>
                <span className="font-semibold text-slate-800 text-[11px] truncate block" title={student.institution_name}>
                  {student.institution_name}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">जारी करने की तिथि / Issue Date:</span>
                <span className="font-semibold text-slate-800 text-[11px]">
                  {new Date(credential.issued_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Verification QR & Signatures */}
            <div className="pt-4 border-t border-slate-200 flex items-end justify-between px-4">
              <div className="text-left space-y-1">
                <div className="p-1.5 bg-white border border-slate-200 rounded inline-block" data-testid="cert-qr-wrapper">
                  <QRCodeSVG value={verificationUrl} size={75} level="M" />
                </div>
                <p className="text-[9px] font-mono text-slate-500">
                  SCAN TO VERIFY<br />
                  ID: {credential.id}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mx-auto text-[8px] font-bold text-slate-400 uppercase">
                  OFFICIAL<br />SEAL
                </div>
              </div>

              <div className="flex gap-8 text-right">
                <div className="text-center">
                  <div className="w-28 border-t border-slate-600 mb-1"></div>
                  <p className="text-[10px] font-bold text-slate-700">कुलसचिव</p>
                  <p className="text-[9px] text-slate-500">Registrar</p>
                </div>
                <div className="text-center">
                  <div className="w-28 border-t border-slate-600 mb-1"></div>
                  <p className="text-[10px] font-bold text-slate-700">कुलपति / निदेशक</p>
                  <p className="text-[9px] text-slate-500">Vice Chancellor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
