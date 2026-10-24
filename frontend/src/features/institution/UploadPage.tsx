import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleUpload = () => {
    if (!file) return;
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      navigate('/institution/batches/batch-demo-2/review');
    }, 600);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-gov-navy">Upload Student Data</h2>
        <p className="text-xs text-slate-500 mt-1">
          Upload student admission records with 12-digit APAAR ID key (CSV or XLSX format)
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base">Step 1: Download Official Excel Template</CardTitle>
              <CardDescription>
                Contains dropdown validations, instructions, and text-formatted APAAR column
              </CardDescription>
            </div>
            <a href="http://localhost:8000/v1/templates/student-upload.xlsx" download>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </a>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 2: Upload Completed File</CardTitle>
          <CardDescription>Select academic year and drop your student admissions file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="academic-year-select" className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
            <select
              id="academic-year-select"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full sm:w-64 border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gov-saffron"
            >
              <option value="2026-27">2026-27 (Current)</option>
              <option value="2025-26">2025-26</option>
            </select>
          </div>

          <div
            className="border-2 border-dashed border-slate-300 hover:border-gov-navy rounded-lg p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition"
            onClick={() => {
              const mock = new File(['mock content'], 'batch_2_errors.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              setFile(mock);
            }}
          >
            <div className="flex flex-col items-center justify-center">
              <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                {file ? file.name : 'Click to select or drag and drop batch file'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Accepts .csv, .xlsx (Max 10 MB)</p>
            </div>
          </div>

          {file && (
            <div className="p-3 bg-green-50 rounded border border-green-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-green-800">
                <FileSpreadsheet className="w-4 h-4 text-green-700" />
                <span className="font-semibold">{file.name}</span>
                <span className="text-xs text-green-600">(Ready for smart column mapping)</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="default" onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? 'Validating...' : 'Proceed to Column Mapping'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
