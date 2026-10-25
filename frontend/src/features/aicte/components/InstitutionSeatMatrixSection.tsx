import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { API_BASE_URL } from '@/lib/api';
import { InstitutionSeatMatrixRecord } from '../types';
import { mockMasterInstitutions } from '@/mocks/data';
import { RegisterInstitutionModal } from './RegisterInstitutionModal';
import { UploadSeatMatrixDocModal } from './UploadSeatMatrixDocModal';
import { SeatMatrixCertificateModal } from './SeatMatrixCertificateModal';
import {
  Building2,
  Plus,
  Upload,
  Search,
  Filter,
  FileText,
  ShieldCheck,
  Award,
  Download,
  Users,
  Hash,
} from 'lucide-react';

export const InstitutionSeatMatrixSection: React.FC = () => {
  const [institutions, setInstitutions] = useState<InstitutionSeatMatrixRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState<boolean>(false);
  const [selectedInstForUpload, setSelectedInstForUpload] = useState<InstitutionSeatMatrixRecord | null>(null);
  const [selectedInstForCert, setSelectedInstForCert] = useState<InstitutionSeatMatrixRecord | null>(null);

  // Load institutions from API or fallback to mock
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`${API_BASE_URL}/v1/master/institutions`)
      .then((res) => (res.ok ? res.json() : mockMasterInstitutions))
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) && data.length > 0 ? data : mockMasterInstitutions;
        setInstitutions(list as InstitutionSeatMatrixRecord[]);
      })
      .catch(() => {
        if (isMounted) setInstitutions(mockMasterInstitutions as InstitutionSeatMatrixRecord[]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRegisterSuccess = (newInst: InstitutionSeatMatrixRecord) => {
    setInstitutions((prev) => {
      const idx = prev.findIndex((i) => i.institution_aicte_id === newInst.institution_aicte_id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newInst;
        return next;
      }
      return [newInst, ...prev];
    });
  };

  const handleUploadDocSuccess = (updatedInst: InstitutionSeatMatrixRecord) => {
    setInstitutions((prev) =>
      prev.map((i) =>
        i.institution_aicte_id === updatedInst.institution_aicte_id ? updatedInst : i
      )
    );
  };

  const handleOpenUploadForInst = (inst: InstitutionSeatMatrixRecord) => {
    setSelectedInstForUpload(inst);
    setIsUploadDocModalOpen(true);
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'institution_aicte_id,name,state_name,state_code,district_name,type,approved_intake,gen_seats,obc_seats,sc_seats,st_seats,ews_seats,tfw_seats,pmsss_seats,nri_seats,approval_order_ref\n' +
      '1-100010041,College of Engineering Pune,Maharashtra,27,Pune,ENGINEERING,600,300,162,90,45,60,30,10,90,F.No. AICTE/WR/2026/APH-COEP-01\n' +
      '1-100010042,Veermata Jijabai Technological Institute,Maharashtra,27,Mumbai,ENGINEERING,540,270,146,81,40,54,27,10,81,F.No. AICTE/WR/2026/APH-VJTI-02\n' +
      '1-100010043,R.V. College of Engineering,Karnataka,29,Bengaluru,ENGINEERING,480,240,130,72,36,48,24,10,72,F.No. AICTE/SW/2026/APH-RVCE-03\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'aicte_sanctioned_seat_matrix_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered institutions
  const filteredInstitutions = institutions.filter((inst) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inst.name?.toLowerCase().includes(q) ||
      inst.institution_aicte_id?.toLowerCase().includes(q) ||
      inst.aishe_code?.toLowerCase().includes(q) ||
      inst.state_name?.toLowerCase().includes(q);

    const matchesState =
      selectedStateFilter === 'ALL' ||
      String(inst.state_code) === selectedStateFilter ||
      inst.state_name?.toLowerCase() === selectedStateFilter.toLowerCase();

    const matchesType =
      selectedTypeFilter === 'ALL' || inst.type?.toUpperCase() === selectedTypeFilter.toUpperCase();

    return matchesSearch && matchesState && matchesType;
  });

  // Calculate statistics
  const totalApprovedIntake = institutions.reduce((acc, i) => acc + (i.approved_intake || 360), 0);
  const totalGenSeats = institutions.reduce((acc, i) => acc + (i.quotas?.gen ?? Math.round((i.approved_intake || 360) * 0.5)), 0);
  const totalReservedSeats = institutions.reduce((acc, i) => {
    const intake = i.approved_intake || 360;
    const sc = i.quotas?.sc ?? Math.round(intake * 0.15);
    const st = i.quotas?.st ?? Math.round(intake * 0.075);
    const obc = i.quotas?.obc ?? Math.round(intake * 0.27);
    const ews = i.quotas?.ews ?? Math.round(intake * 0.1);
    return acc + sc + st + obc + ews;
  }, 0);
  const totalSupernumerary = institutions.reduce((acc, i) => {
    const intake = i.approved_intake || 360;
    const tfw = i.supernumerary?.tfw ?? Math.round(intake * 0.05);
    const pmsss = i.supernumerary?.pmsss ?? 10;
    const nri = i.supernumerary?.nri_oci_fn ?? Math.round(intake * 0.15);
    return acc + tfw + pmsss + nri;
  }, 0);

  const statesList = Array.from(new Set(institutions.map((i) => i.state_name || String(i.state_code)))).filter(Boolean);

  return (
    <Card className="border-slate-200 shadow-sm" data-testid="institution-seat-matrix-section">
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gov-navy text-white shadow-xs">
              <Building2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-gov-navy">
                  Institution Registration & Sanctioned Seat Matrix
                </CardTitle>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Statutory Capacity Registry
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Register approved institutions, define sanctioned seat capacity, configure constitutional quotas, and upload statutory approval orders.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs h-8 gap-1.5 text-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedInstForUpload(null);
                setIsUploadDocModalOpen(true);
              }}
              data-testid="upload-seat-matrix-doc-btn"
              className="text-xs h-8 gap-1.5 font-semibold text-blue-900 border-blue-300 bg-blue-50/70 hover:bg-blue-100"
            >
              <Upload className="w-3.5 h-3.5 text-blue-700" />
              Upload Seat Matrix Document
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsRegisterModalOpen(true)}
              data-testid="register-institution-btn"
              className="text-xs h-8 gap-1.5 bg-gov-navy hover:bg-gov-navyDark text-white font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              Register New Institution
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Registered Institutions
            </span>
            <div className="text-xl font-bold text-gov-navy mt-1 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{institutions.length}</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">Full & Aggregate Status</span>
          </div>

          <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Approved Seats
            </span>
            <div className="text-xl font-bold text-gov-navy mt-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>{totalApprovedIntake.toLocaleString()}</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">Annual Sanctioned Intake</span>
          </div>

          <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Open / General Seats
            </span>
            <div className="text-xl font-bold text-emerald-800 mt-1 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>{totalGenSeats.toLocaleString()}</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">~50% Constitutional Open</span>
          </div>

          <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Reserved Quota Seats
            </span>
            <div className="text-xl font-bold text-indigo-900 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>{totalReservedSeats.toLocaleString()}</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">OBC, SC, ST & EWS</span>
          </div>

          <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs col-span-2 lg:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Supernumerary Allowances
            </span>
            <div className="text-xl font-bold text-purple-900 mt-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>{totalSupernumerary.toLocaleString()}</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">TFW, PMSSS & NRI/OCI</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <Input
              type="text"
              placeholder="Search by Institution Name, AICTE ID, or AISHE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-seat-matrix-input"
              className="h-8 pl-8 text-xs bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>State:</span>
            </div>
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              data-testid="filter-state-select"
              className="h-8 text-xs rounded-md border border-slate-300 bg-white px-2 font-medium"
            >
              <option value="ALL">All States ({institutions.length})</option>
              {statesList.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              data-testid="filter-type-select"
              className="h-8 text-xs rounded-md border border-slate-300 bg-white px-2 font-medium"
            >
              <option value="ALL">All Disciplines</option>
              <option value="ENGINEERING">Engineering</option>
              <option value="MANAGEMENT">Management</option>
              <option value="PHARMACY">Pharmacy</option>
              <option value="POLYTECHNIC">Polytechnic</option>
            </select>
          </div>
        </div>

        {/* Main Data Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs">Institution Identification</TableHead>
                <TableHead className="text-xs">State / District</TableHead>
                <TableHead className="text-xs text-center">Sanctioned Intake</TableHead>
                <TableHead className="text-xs">Category Quota Breakdown</TableHead>
                <TableHead className="text-xs">Supernumerary Caps</TableHead>
                <TableHead className="text-xs">Statutory Sanction Order</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">
                    Loading registered institutions and seat matrices...
                  </TableCell>
                </TableRow>
              ) : filteredInstitutions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">
                    No institutions matching the specified filters. Try adjusting your search query or state filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInstitutions.map((inst) => {
                  const intake = inst.approved_intake || 360;
                  const q = inst.quotas || {
                    gen: Math.round(intake * 0.5),
                    obc: Math.round(intake * 0.27),
                    sc: Math.round(intake * 0.15),
                    st: Math.round(intake * 0.075),
                    ews: Math.round(intake * 0.1),
                    pwd: Math.round(intake * 0.05),
                  };
                  const s = inst.supernumerary || {
                    tfw: Math.round(intake * 0.05),
                    pmsss: 10,
                    nri_oci_fn: Math.round(intake * 0.15),
                  };

                  return (
                    <TableRow key={inst.institution_aicte_id} className="hover:bg-slate-50/60 transition">
                      {/* Name & ID */}
                      <TableCell className="max-w-xs">
                        <div className="font-bold text-xs text-slate-900 truncate" title={inst.name}>
                          {inst.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] font-semibold text-gov-navy">
                            {inst.institution_aicte_id}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {inst.type}
                          </span>
                          {inst.aishe_code && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-blue-50 text-blue-900 border border-blue-200">
                              {inst.aishe_code}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* State / District */}
                      <TableCell className="text-xs text-slate-700">
                        <div className="font-medium text-slate-900">{inst.state_name || inst.state_code}</div>
                        <div className="text-[11px] text-slate-500">{inst.district_name || inst.district_code}</div>
                      </TableCell>

                      {/* Sanctioned Intake Capacity */}
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-950 border border-blue-300">
                          <Award className="w-3.5 h-3.5 text-blue-700" />
                          <span>{intake} Seats</span>
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">AY {inst.academic_year || '2026-27'}</div>
                      </TableCell>

                      {/* Category Quotas */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1 text-[10px] max-w-xs">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200" title="General (Open) Seats">
                            GEN: {q.gen}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-900 font-semibold border border-indigo-200" title="OBC-NCL Seats">
                            OBC: {q.obc}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 font-semibold border border-blue-200" title="Scheduled Caste Seats">
                            SC: {q.sc}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 font-semibold border border-amber-200" title="Scheduled Tribe Seats">
                            ST: {q.st}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-900 font-semibold border border-purple-200" title="EWS Seats">
                            EWS: {q.ews}
                          </span>
                        </div>
                      </TableCell>

                      {/* Supernumerary Allowances */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-medium" title="Tuition Fee Waiver">
                            TFW: {s.tfw}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-medium" title="Prime Minister Special Scholarship Scheme">
                            PMSSS: {s.pmsss}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-medium" title="NRI / OCI / Foreign Nationals">
                            NRI: {s.nri_oci_fn}
                          </span>
                        </div>
                      </TableCell>

                      {/* Document Proof & Gazette */}
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1 font-semibold text-gov-navy truncate max-w-xs" title={inst.document_name || 'AICTE_Approval_Letter.pdf'}>
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{inst.document_name || 'AICTE_Approval_Letter.pdf'}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate" title={inst.approval_order_ref}>
                          {inst.approval_order_ref || 'F.No. AICTE/AB/2026/APH-1049'}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 flex items-center gap-0.5 mt-0.5">
                          <Hash className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[120px]">
                            {inst.document_hash || inst.source_file_hash || 'sha256:7f83b165...'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenUploadForInst(inst)}
                            data-testid={`upload-doc-btn-${inst.institution_aicte_id}`}
                            className="h-7 px-2 text-[11px] gap-1 text-blue-900 border-blue-200 hover:bg-blue-50"
                            title="Upload new or revised seat matrix document"
                          >
                            <Upload className="w-3 h-3 text-blue-700" />
                            Upload Doc
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInstForCert(inst)}
                            data-testid={`inspect-seat-cert-${inst.institution_aicte_id}`}
                            className="h-7 px-2 text-[11px] gap-1 font-semibold text-gov-navy border-slate-300 hover:bg-slate-50"
                            title="Inspect official seat capacity certificate"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Certificate
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Modal 1: Register New Institution */}
      <RegisterInstitutionModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegisterSuccess}
      />

      {/* Modal 2: Upload Seat Matrix Document */}
      <UploadSeatMatrixDocModal
        isOpen={isUploadDocModalOpen}
        institution={selectedInstForUpload}
        institutionsList={institutions}
        onClose={() => {
          setIsUploadDocModalOpen(false);
          setSelectedInstForUpload(null);
        }}
        onSuccess={handleUploadDocSuccess}
      />

      {/* Modal 3: Inspect Seat Matrix Certificate */}
      <SeatMatrixCertificateModal
        institution={selectedInstForCert}
        onClose={() => setSelectedInstForCert(null)}
      />
    </Card>
  );
};
