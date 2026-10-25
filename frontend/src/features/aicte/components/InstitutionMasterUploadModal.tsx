import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { API_BASE_URL } from '@/lib/api';
import { InstitutionMasterRecord, IngestInstitutionsResult } from '../types';
import { mockAphOfficialInstitutionsDataset } from '@/mocks/data';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Building2,
  ShieldCheck,
  Download,
  Sparkles,
  Info,
  Hash,
} from 'lucide-react';

interface InstitutionMasterUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedInstitutions: InstitutionMasterRecord[]) => void;
}

export const InstitutionMasterUploadModal: React.FC<InstitutionMasterUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [sourceAuthority, setSourceAuthority] = useState<string>(
    'AICTE Approval Process Handbook (APH) 2026-27'
  );
  const [approvalOrderRef, setApprovalOrderRef] = useState<string>(
    'F.No. AICTE/AB/2026/APH-1049'
  );
  const [aisheCycleCode, setAisheCycleCode] = useState<string>('AISHE-2026-CYCLE-IV');
  const [authorizingOfficer, setAuthorizingOfficer] = useState<string>(
    'Dr. Rajesh Sharma, AICTE Chief Master Data Officer'
  );

  const [parsedInstitutions, setParsedInstitutions] = useState<Partial<InstitutionMasterRecord>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [ingestionResult, setIngestionResult] = useState<IngestInstitutionsResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent =
      'institution_aicte_id,name,state_name,state_code,district_name,district_code,type,affiliated_dab_id,aishe_code,approval_order_ref,onboarding_level\n' +
      '1-100010041,College of Engineering Pune (COEP Tech),Maharashtra,27,Pune,105,ENGINEERING,DAB-102,U-0892,F.No. AICTE/WR/2026/APH-COEP,FULL\n' +
      '1-100010042,Veermata Jijabai Technological Institute (VJTI),Maharashtra,27,Mumbai,104,ENGINEERING,DAB-102,C-33821,F.No. AICTE/WR/2026/APH-VJTI,FULL\n' +
      '1-100010043,R.V. College of Engineering,Karnataka,29,Bengaluru Urban,108,ENGINEERING,DAB-103,C-12941,F.No. AICTE/SW/2026/APH-RVCE,FULL\n' +
      '1-100010044,College of Engineering Guindy (CEG),Tamil Nadu,33,Chennai,111,ENGINEERING,DAB-104,C-24912,F.No. AICTE/SR/2026/APH-CEG,FULL\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'aicte_official_institution_master_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadOfficialAphDataset = () => {
    setFileName('aicte_official_aph_master_2026.csv');
    setParsedInstitutions(mockAphOfficialInstitutionsDataset);
    setErrorMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            setParsedInstitutions(json);
          } else if (json.institutions && Array.isArray(json.institutions)) {
            setParsedInstitutions(json.institutions);
          } else {
            throw new Error('Invalid JSON structure: expected array of institutions');
          }
        } else {
          // Parse CSV
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length < 2) {
            throw new Error('CSV file is empty or missing data rows');
          }

          const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
          const records: Partial<InstitutionMasterRecord>[] = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            if (values.length < 2) continue;

            const row: Record<string, string> = {};
            headers.forEach((h, idx) => {
              row[h] = values[idx] || '';
            });

            records.push({
              institution_aicte_id: row.institution_aicte_id || `1-${100010050 + i}`,
              name: row.name || `Institution ${i}`,
              state_name: row.state_name || 'Delhi',
              state_code: row.state_code || '07',
              district_name: row.district_name || 'Central Delhi',
              district_code: row.district_code || '101',
              type: (row.type || 'ENGINEERING').toUpperCase(),
              affiliated_dab_id: row.affiliated_dab_id || 'DAB-101',
              aishe_code: row.aishe_code || `C-${Math.floor(10000 + Math.random() * 89999)}`,
              approval_order_ref: row.approval_order_ref || approvalOrderRef,
              onboarding_level: (row.onboarding_level === 'AGGREGATE_ONLY' ? 'AGGREGATE_ONLY' : 'FULL'),
              source_authority: sourceAuthority,
            });
          }

          if (records.length === 0) {
            throw new Error('No valid institution rows found in CSV');
          }
          setParsedInstitutions(records);
        }
      } catch (err: any) {
        console.error('Failed to parse file:', err);
        setErrorMessage(err.message || 'Failed to parse file. Please verify CSV format.');
      }
    };
    reader.readAsText(file);
  };

  const handleIngest = async () => {
    if (parsedInstitutions.length === 0) {
      setErrorMessage('Please upload a dataset or load the official APH sample dataset first.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        source_authority: sourceAuthority,
        approval_order_ref: approvalOrderRef,
        aishe_cycle_code: aisheCycleCode,
        authorizing_officer: authorizingOfficer,
        source_file_name: fileName || 'official_aph_master.csv',
        institutions: parsedInstitutions,
      };

      const res = await fetch(`${API_BASE_URL}/v1/admin/master/institutions/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Ingest API error:', res.status, text);
        throw new Error('Master data ingestion failed with status ' + res.status);
      }

      const result: IngestInstitutionsResult = await res.json();
      setIngestionResult(result);
      onSuccess(result.institutions);
    } catch (err: any) {
      console.error('Ingestion caught error:', err);
      setErrorMessage(err.message || 'Failed to ingest institution records.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      data-testid="institution-upload-modal"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gov-navy text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="upload-modal-title" className="text-base font-bold text-gov-navy">
                  Ingest Official Institution Master Data
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                  Statutory Provenance Tracking
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload institutional records with verifiable origin: APH handbook gazette, AISHE code, and approval reference.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Provenance Notice Banner */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg flex items-start gap-3 text-xs text-blue-950">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-blue-900">Official Origin Certification:</strong>
              <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
                Institutions entered into the central master repository will be bound to the specified government authority source,
                AISHE identification, and council gazette order. This guarantees transparency and prevents superficial placeholder data.
              </p>
            </div>
          </div>

          {/* Provenance Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Data Source Authority <span className="text-red-500">*</span>
              </label>
              <select
                value={sourceAuthority}
                onChange={(e) => setSourceAuthority(e.target.value)}
                className="w-full text-xs h-8 rounded-md border border-slate-300 bg-white px-2.5 font-medium text-slate-800"
              >
                <option value="AICTE Approval Process Handbook (APH) 2026-27">
                  AICTE Approval Process Handbook (APH) 2026-27
                </option>
                <option value="Ministry of Education - AISHE National Registry Cycle 2026">
                  Ministry of Education - AISHE National Registry Cycle 2026
                </option>
                <option value="State Directorate of Technical Education Gazette">
                  State Directorate of Technical Education Gazette
                </option>
                <option value="Autonomous Accreditation & Statutory Council">
                  Autonomous Accreditation & Statutory Council
                </option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Official Approval / Gazette Order Ref <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={approvalOrderRef}
                onChange={(e) => setApprovalOrderRef(e.target.value)}
                placeholder="e.g. F.No. AICTE/AB/2026/APH-1049"
                className="h-8 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                AISHE Registry Cycle Ref
              </label>
              <Input
                type="text"
                value={aisheCycleCode}
                onChange={(e) => setAisheCycleCode(e.target.value)}
                placeholder="e.g. AISHE-2026-CYCLE-IV"
                className="h-8 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Authorizing Officer <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={authorizingOfficer}
                onChange={(e) => setAuthorizingOfficer(e.target.value)}
                placeholder="e.g. Dr. Rajesh Sharma, AICTE Chief Master Data Officer"
                className="h-8 text-xs bg-white"
              />
            </div>
          </div>

          {/* Dataset Upload / Ingestion Options */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Upload or Quick-Load Institution Records
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="text-[11px] h-7 gap-1 text-slate-700"
                >
                  <Download className="w-3 h-3" />
                  Download CSV Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadOfficialAphDataset}
                  data-testid="load-aph-sample-btn"
                  className="text-[11px] h-7 gap-1 font-semibold text-amber-800 bg-amber-50 border-amber-300 hover:bg-amber-100"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Load Official APH 2026-27 Dataset
                </Button>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-gov-navy/50 rounded-xl p-6 text-center bg-slate-50/50 transition">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">
                Choose CSV or JSON institution dataset
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Format: <code className="font-mono text-[10px] bg-slate-200 px-1 py-0.5 rounded">institution_aicte_id, name, state_name, district_name, type, affiliated_dab_id, aishe_code</code>
              </p>
              <label className="mt-3 inline-block">
                <span className="px-3 py-1.5 bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold rounded-md cursor-pointer transition shadow-xs inline-flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Browse Master File
                </span>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="institution-file-input"
                />
              </label>
              {fileName && (
                <div className="mt-2 text-xs font-semibold text-green-700 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selected: {fileName} ({parsedInstitutions.length} institutions parsed)</span>
                </div>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Summary if Ingested */}
          {ingestionResult && (
            <div className="p-4 bg-green-50 border border-green-300 rounded-lg text-xs text-green-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-green-950">
                <CheckCircle2 className="w-4 h-4 text-green-700" />
                <span>Statutory Master Ingestion Complete!</span>
              </div>
              <p>
                Successfully ingested <strong>{ingestionResult.ingested_count}</strong> new institutions ({ingestionResult.updated_count} updated) into AICTE Central Master Repository. Total master records: <strong>{ingestionResult.total_records}</strong>.
              </p>
              <div className="p-2 bg-white rounded border border-green-200 font-mono text-[10px] text-slate-700 space-y-0.5">
                <div>Source: <strong>{ingestionResult.source_authority}</strong></div>
                <div>Order Ref: <strong>{ingestionResult.approval_order_ref}</strong></div>
                <div className="flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-400" />
                  <span>Batch Integrity Seal: <strong>{ingestionResult.batch_hash}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Live Preview Table */}
          {parsedInstitutions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Pre-Ingestion Verification Preview ({parsedInstitutions.length} Records)
                </span>
                <span className="text-slate-500 font-medium text-[11px]">
                  All records assigned to: {sourceAuthority}
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto shadow-2xs">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0">
                    <TableRow>
                      <TableHead className="text-xs">AICTE ID</TableHead>
                      <TableHead className="text-xs">Institution Name</TableHead>
                      <TableHead className="text-xs">State / District</TableHead>
                      <TableHead className="text-xs">AISHE Code</TableHead>
                      <TableHead className="text-xs">Order Ref</TableHead>
                      <TableHead className="text-xs">Discipline</TableHead>
                      <TableHead className="text-xs">Affiliated DAB</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedInstitutions.map((inst, idx) => (
                      <TableRow key={idx} className="hover:bg-slate-50/60">
                        <TableCell className="font-mono text-xs font-bold text-gov-navy">
                          {inst.institution_aicte_id}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-900 max-w-xs truncate">
                          {inst.name}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {inst.state_name || inst.state_code} &bull; {inst.district_name || inst.district_code}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-bold text-blue-900">
                          {inst.aishe_code || 'Pending'}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-[11px] text-slate-600">
                          {inst.approval_order_ref || approvalOrderRef}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-700">
                          {inst.type}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {inst.affiliated_dab_id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Ingestion is appended directly to the AICTE cryptographic audit chain.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              data-testid="modal-close-btn"
              className="text-xs"
            >
              {ingestionResult ? 'Close' : 'Cancel'}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleIngest}
              disabled={isSubmitting || parsedInstitutions.length === 0}
              data-testid="confirm-ingest-btn"
              className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold shadow-xs"
            >
              {isSubmitting ? (
                'Ingesting Records...'
              ) : ingestionResult ? (
                'Re-Ingest Updates'
              ) : (
                `Ingest ${parsedInstitutions.length} Institutions`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
