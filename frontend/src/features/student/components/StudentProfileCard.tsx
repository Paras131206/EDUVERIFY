import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StudentOwnRecord, StudentVersionHistoryItem } from '../types';
import {
  User,
  History,
  GraduationCap,
  Building2,
  Calendar,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface StudentProfileCardProps {
  record: StudentOwnRecord;
  versions: StudentVersionHistoryItem[];
}

export const StudentProfileCard: React.FC<StudentProfileCardProps> = ({
  record,
  versions,
}) => {
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  return (
    <Card className="border-slate-200 bg-white shadow-xs" data-testid="student-profile-card">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gov-navy text-white flex items-center justify-center font-bold text-base">
            {record.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold text-gov-navy" data-testid="student-full-name">
                {record.full_name}
              </CardTitle>
              <span className="text-xs bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                {record.enrolment_status}
              </span>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Unmasked Statutory Student Profile • Verified AICTE Apex Record
            </CardDescription>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowVersionHistory(!showVersionHistory)}
          className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50 h-8 shrink-0"
          data-testid="toggle-version-history-btn"
        >
          <History className="w-3.5 h-3.5 mr-1.5 text-gov-navy" />
          <span>Version History (v{record.record_version})</span>
          {showVersionHistory ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
        </Button>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Core Profile Grid (Unmasked for self per Req 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Permanent APAAR ID</span>
            <span className="text-sm font-mono font-bold text-gov-navy block mt-0.5" data-testid="student-apaar-id">
              {record.apaar_id}
            </span>
            <span className="text-[10px] text-green-700 font-medium">Unmasked for Self</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Institution Student / PRN</span>
            <span className="text-sm font-mono font-bold text-slate-900 block mt-0.5" data-testid="student-roll-no">
              {record.institution_student_id}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Roll Number</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Degree Program</span>
            <span className="text-sm font-bold text-slate-900 block mt-0.5 truncate" title={record.program_name} data-testid="student-program-name">
              {record.program_name}
            </span>
            <span className="text-[10px] text-gov-navy font-semibold">{record.program_code} ({record.course_level})</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Current Academic Year</span>
            <span className="text-sm font-bold text-gov-navy block mt-0.5">
              Year {record.year_of_study} ({record.academic_year})
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Expected Grad: {record.expected_graduation_year}</span>
          </div>
        </div>

        {/* Detailed Attribute Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1 border-t border-slate-100">
          <div className="space-y-1.5 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-200/60">
              <User className="w-3.5 h-3.5 text-gov-navy" />
              <span>Identity & Demographic</span>
            </div>
            <div className="flex justify-between py-0.5 text-slate-600">
              <span>Date of Birth:</span>
              <strong className="text-slate-800">{record.dob}</strong>
            </div>
            <div className="flex justify-between py-0.5 text-slate-600">
              <span>Gender:</span>
              <strong className="text-slate-800">{record.gender === 'M' ? 'Male' : record.gender === 'F' ? 'Female' : 'Transgender'}</strong>
            </div>
            <div className="flex justify-between py-0.5 text-slate-600">
              <span>Category:</span>
              <strong className="text-slate-800">{record.category}</strong>
            </div>
            <div className="flex justify-between py-0.5 text-slate-600">
              <span>Nationality:</span>
              <strong className="text-slate-800">{record.nationality}</strong>
            </div>
          </div>

          <div className="space-y-1.5 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-200/60">
              <Building2 className="w-3.5 h-3.5 text-gov-navy" />
              <span>Academic Affiliation</span>
            </div>
            <div className="flex justify-between py-0.5 text-slate-600">
              <span>Institution:</span>
              <strong className="text-slate-800 truncate max-w-[150px]" title={record.institution_name}>
                {record.institution_name}
              </strong>
            </div>
            <div className="flex justify-between py-0.5 text-slate-600">
              <span>AICTE ID:</span>
              <strong className="text-slate-800 font-mono">{record.institution_aicte_id}</strong>
            </div>
            <div className="flex justify-between py-0.5 text-slate-600">
              <span>Department:</span>
              <strong className="text-slate-800 truncate max-w-[150px]">{record.department}</strong>
            </div>
            <div className="flex justify-between py-0.5 text-slate-600">
              <span>Admission Type:</span>
              <strong className="text-slate-800">{record.admission_type}</strong>
            </div>
          </div>

          <div className="space-y-1.5 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-200/60">
              <GraduationCap className="w-3.5 h-3.5 text-gov-navy" />
              <span>Quota & Contact Info</span>
            </div>
            <div className="flex justify-between py-0.5 text-slate-600">
              <span>Seat Type:</span>
              <strong className="text-slate-800">{record.seat_type}</strong>
            </div>
            <div className="flex justify-between py-0.5 text-slate-600">
              <span>Email:</span>
              <strong className="text-slate-800 truncate max-w-[150px]">{record.email}</strong>
            </div>
            <div className="flex justify-between py-0.5 text-slate-600">
              <span>Mobile:</span>
              <strong className="text-slate-800 font-mono">{record.mobile}</strong>
            </div>
            <div className="flex justify-between py-0.5 text-slate-600">
              <span>Last Synchronized:</span>
              <strong className="text-slate-800">{new Date(record.updated_at).toLocaleDateString()}</strong>
            </div>
          </div>
        </div>

        {/* Expandable Version History Drawer/Section */}
        {showVersionHistory && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-in fade-in" data-testid="version-history-panel">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-gov-saffron" />
                <span>Statutory Record Version Ledger</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                Current Version: v{record.record_version}
              </span>
            </div>

            <div className="space-y-2">
              {versions.map((v) => (
                <div
                  key={v.version}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5"
                  data-testid={`version-item-${v.version}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold bg-gov-navy text-white px-2 py-0.5 rounded text-[10px]">
                        v{v.version}
                      </span>
                      <span className="font-semibold text-slate-800">{v.changed_by}</span>
                    </div>
                    <span className="text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(v.changed_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-slate-600 text-xs font-medium bg-white p-2 rounded border border-slate-100">
                    {v.change_reason}
                  </p>

                  <div className="text-[11px] font-mono text-slate-500">
                    Changes applied: {Object.keys(v.changes).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
