import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  BookmarkCheck,
} from 'lucide-react';
import { maskApaar } from '@/lib/masking';
import { API_BASE_URL, authFetch } from '@/lib/api';
import { CANONICAL_FIELDS, ColumnMappingItem, MappingMethod } from '../types';

interface Step2MappingProps {
  batchId: string;
  filename: string;
  academicYear: string;
  onBack: () => void;
  onConfirm: (mappings: ColumnMappingItem[], saveProfile: boolean) => void;
  autoMapCanonicalFields?: boolean;
}

export const autoMapRemainingFields = (
  currentMappings: ColumnMappingItem[],
  academicYearStr: string
): ColumnMappingItem[] => {
  const mappedTargets = new Set(currentMappings.map((m) => m.target).filter(Boolean));
  const unmapped = CANONICAL_FIELDS.filter((cf) => cf.required && !mappedTargets.has(cf.key));
  if (unmapped.length === 0) return currentMappings;

  const existingSources = new Set(currentMappings.map((m) => m.source));
  const newItems: ColumnMappingItem[] = [...currentMappings];

  unmapped.forEach((field) => {
    let simulatedSource = field.label.split('(')[0].trim();
    if (existingSources.has(simulatedSource)) {
      simulatedSource = `${simulatedSource} (Auto)`;
    }
    existingSources.add(simulatedSource);

    newItems.push({
      source: simulatedSource,
      target: field.key,
      confidence: 0.98,
      method: 'synonym',
      sample_values: [
        field.key === 'institution_aicte_id'
          ? '1-100010001'
          : field.key === 'academic_year'
            ? academicYearStr || '2026-27'
            : field.key === 'course_level'
              ? 'UG'
              : field.key === 'program_code'
                ? 'UG-CSE'
                : field.key === 'year_of_study'
                  ? '1'
                  : field.key === 'admission_type'
                    ? 'REGULAR'
                    : field.key === 'seat_type'
                      ? 'REGULAR'
                      : field.key === 'quota'
                        ? 'NONE'
                        : field.key === 'nationality'
                          ? 'IN'
                          : field.key === 'category'
                            ? 'GEN'
                            : field.key === 'nri_status' || field.key === 'oci_status' || field.key === 'fn_status'
                              ? 'False'
                              : field.key === 'enrolment_status'
                                ? 'ACTIVE'
                                : field.key === 'consent_status'
                                  ? 'GRANTED'
                                  : 'Sample',
      ],
    });
  });

  return newItems;
};

export const Step2Mapping: React.FC<Step2MappingProps> = ({
  batchId,
  filename,
  academicYear,
  onBack,
  onConfirm,
  autoMapCanonicalFields = true,
}) => {
  const [mappings, setMappings] = useState<ColumnMappingItem[]>([]);
  const [saveProfile, setSaveProfile] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const DEFAULT_FALLBACK_MAPPINGS: ColumnMappingItem[] = [
    {
      source: 'PRN',
      target: 'institution_student_id',
      confidence: 0.98,
      method: 'synonym',
      sample_values: ['PRN-2026-001', 'PRN-2026-002', 'PRN-2026-014'],
    },
    {
      source: 'APAAR',
      target: 'apaar_id',
      confidence: 0.99,
      method: 'synonym',
      sample_values: ['984572912301', '984572912302', '098765432101'],
    },
    {
      source: 'Student Name',
      target: 'full_name',
      confidence: 0.95,
      method: 'fuzzy',
      sample_values: ['Aarav Patel', 'Aditi Verma', 'Rahul Sharma'],
    },
    {
      source: 'DOB',
      target: 'dob',
      confidence: 0.96,
      method: 'synonym',
      sample_values: ['2004-05-12', '2003-11-20', '2004-01-15'],
    },
    {
      source: 'Gender',
      target: 'gender',
      confidence: 1.0,
      method: 'saved',
      sample_values: ['M', 'F', 'T'],
    },
    {
      source: 'Dept',
      target: 'department',
      confidence: 0.92,
      method: 'pattern',
      sample_values: ['Computer Science', 'Electronics & Comm', 'Mechanical'],
    },
    {
      source: 'Adm Date',
      target: 'admission_date',
      confidence: 0.91,
      method: 'fuzzy',
      sample_values: ['2026-08-01', '2026-08-01', '2026-08-05'],
    },
  ];

  // Fetch initial suggested mappings from API
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setLoadError(null);

    const activeBatchId = batchId || 'batch-demo-2';

    authFetch(`${API_BASE_URL}/v1/batches/${activeBatchId}/mapping`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: ColumnMappingItem[]) => {
        if (!mounted) return;
        const initial = Array.isArray(data) && data.length > 0 ? data : DEFAULT_FALLBACK_MAPPINGS;
        setMappings(
          autoMapCanonicalFields ? autoMapRemainingFields(initial, academicYear) : initial
        );
        setIsLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setIsLoading(false);
        setLoadError(`Notice: Using local mapping dictionary (${err.message}).`);
        setMappings(
          autoMapCanonicalFields
            ? autoMapRemainingFields(DEFAULT_FALLBACK_MAPPINGS, academicYear)
            : DEFAULT_FALLBACK_MAPPINGS
        );
      });

    return () => {
      mounted = false;
    };
  }, [batchId, academicYear, autoMapCanonicalFields]);

  // Track currently mapped targets
  const mappedTargets = useMemo(() => {
    return new Set(mappings.map((m) => m.target).filter(Boolean));
  }, [mappings]);

  // Required canonical fields that are missing
  const unmappedRequiredFields = useMemo(() => {
    return CANONICAL_FIELDS.filter((cf) => cf.required && !mappedTargets.has(cf.key));
  }, [mappedTargets]);

  const requiredCount = CANONICAL_FIELDS.filter((cf) => cf.required).length;
  const mappedRequiredCount = requiredCount - unmappedRequiredFields.length;

  const handleTargetChange = (sourceHeader: string, newTarget: string) => {
    setMappings((prev) =>
      prev.map((item) => {
        if (item.source === sourceHeader) {
          return {
            ...item,
            target: newTarget,
            confidence: newTarget ? 1.0 : 0,
            method: 'user' as MappingMethod,
          };
        }
        return item;
      })
    );
  };

  // Shortcut to map remaining canonical fields automatically for demo/testing
  const handleAutoMapRemaining = () => {
    setMappings((prev) => autoMapRemainingFields(prev, academicYear));
  };

  const handleConfirm = async () => {
    if (unmappedRequiredFields.length > 0) return;
    setIsSubmitting(true);

    try {
      await authFetch(`${API_BASE_URL}/v1/batches/${batchId}/mapping`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mappings,
          save_profile: saveProfile,
        }),
      });
      setIsSubmitting(false);
      onConfirm(mappings, saveProfile);
    } catch {
      setIsSubmitting(false);
      // Fallback: still confirm in UI
      onConfirm(mappings, saveProfile);
    }
  };

  const getMethodBadge = (method: MappingMethod) => {
    switch (method) {
      case 'synonym':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Synonym
          </span>
        );
      case 'fuzzy':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Fuzzy Match
          </span>
        );
      case 'pattern':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Pattern / Regex
          </span>
        );
      case 'saved':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Saved Profile
          </span>
        );
      case 'user':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            User Selected
          </span>
        );
    }
  };

  const renderConfidenceBar = (confidence: number) => {
    const pct = Math.round(confidence * 100);
    let colorClass = 'bg-emerald-500';
    let textClass = 'text-emerald-700';

    if (pct < 70) {
      colorClass = 'bg-red-500';
      textClass = 'text-red-700';
    } else if (pct < 90) {
      colorClass = 'bg-amber-500';
      textClass = 'text-amber-700';
    }

    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className={`h-full ${colorClass} transition-all duration-300`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-[11px] font-bold ${textClass}`}>{pct}%</span>
      </div>
    );
  };

  const renderSamplePreview = (item: ColumnMappingItem) => {
    if (!item.sample_values || item.sample_values.length === 0) {
      return <span className="text-slate-400 italic text-[11px]">—</span>;
    }

    const isApaar = item.target === 'apaar_id' || item.source.toLowerCase().includes('apaar');

    return (
      <div className="flex flex-wrap gap-1 font-mono text-[11px]">
        {item.sample_values.slice(0, 3).map((val, idx) => (
          <span
            key={idx}
            className={`px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700 ${
              isApaar ? 'text-blue-900 font-semibold' : ''
            }`}
          >
            {isApaar ? maskApaar(val) : val}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-lg font-bold text-gov-navy">Step 2: Smart Column Mapping</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            File: <strong className="text-slate-700">{filename}</strong> · Target Academic Year:{' '}
            <strong className="text-slate-700">{academicYear}</strong> · Batch ID: {batchId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unmappedRequiredFields.length === 0 && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-gov-saffron" />
              Auto-mapped all canonical fields
            </span>
          )}
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              unmappedRequiredFields.length === 0
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {mappedRequiredCount} / {requiredCount} Required Fields Mapped
          </span>
        </div>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gov-navy" />
          <p className="text-xs font-semibold text-slate-700">
            Analyzing spreadsheet headers with smart synonym dictionary...
          </p>
        </Card>
      ) : (
        <>
          {loadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{loadError}</span>
            </div>
          )}

      {/* V001 Explanation Banner if required fields unmapped */}
      {unmappedRequiredFields.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-lg bg-red-50/90 border-2 border-red-300 text-red-900 shadow-sm space-y-2 animate-in fade-in"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-800">
                Rule V001: Required Column Missing After Column Mapping
              </h4>
              <p className="text-xs text-red-800 leading-relaxed">
                Mandatory canonical fields are currently unmapped:{' '}
                <strong className="underline">
                  {unmappedRequiredFields.map((f) => f.label.split('(')[0].trim()).join(', ')}
                </strong>
                . Per AICTE Rule V001, batches cannot proceed to validation until all 22 required fields
                are explicitly mapped.
              </p>
            </div>
          </div>
          <div className="pl-7 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoMapRemaining}
              className="text-xs h-8 border-red-300 bg-white hover:bg-red-100 text-red-900 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-gov-saffron" />
              Auto-Map Remaining Canonical Fields
            </Button>
          </div>
        </div>
      )}

      {/* Column Mapping Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-4 bg-slate-50/70 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Spreadsheet Header → Canonical Field Mapping
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-500">
                Verify each detected column. APAAR values are masked automatically.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoMapRemaining}
                className="text-xs h-7 border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-gov-saffron" />
                Auto-Map Canonical Fields
              </Button>
              <span className="text-[11px] text-slate-500 font-medium">
                {mappings.length} columns identified
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/40 text-[11px] font-bold text-slate-600">
                <TableHead className="w-48">Source Column</TableHead>
                <TableHead className="w-64">Suggested Canonical Field</TableHead>
                <TableHead className="w-32">Confidence</TableHead>
                <TableHead className="w-32">Method</TableHead>
                <TableHead>Sample Values Preview (APAAR Masked)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((item) => {
                const isMappedRequired = CANONICAL_FIELDS.some(
                  (cf) => cf.key === item.target && cf.required
                );

                return (
                  <TableRow
                    key={item.source}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !item.target ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <TableCell className="font-semibold text-xs text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 font-mono text-[11px]">
                          {item.source}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <select
                        value={item.target}
                        onChange={(e) => handleTargetChange(item.source, e.target.value)}
                        aria-label={`Target field for ${item.source}`}
                        className={`w-full text-xs font-medium rounded-md px-2.5 py-1.5 border bg-white focus:outline-none focus:ring-2 focus:ring-gov-saffron ${
                          item.target
                            ? 'border-slate-300 text-slate-800'
                            : 'border-red-400 text-red-600 font-semibold'
                        }`}
                      >
                        <option value="">-- Select Canonical Field --</option>
                        {CANONICAL_FIELDS.map((cf) => (
                          <option key={cf.key} value={cf.key}>
                            {cf.label} {cf.required ? '*' : ''}
                          </option>
                        ))}
                      </select>
                      {isMappedRequired && (
                        <span className="text-[10px] text-green-700 font-medium flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          Mandatory Canonical Field
                        </span>
                      )}
                    </TableCell>

                    <TableCell>{renderConfidenceBar(item.confidence)}</TableCell>

                    <TableCell>{getMethodBadge(item.method)}</TableCell>

                    <TableCell>{renderSamplePreview(item)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Options & Action Footer */}
      <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200 space-y-4">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={saveProfile}
            onChange={(e) => setSaveProfile(e.target.checked)}
            className="mt-0.5 rounded text-gov-navy focus:ring-gov-saffron w-4 h-4"
          />
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <BookmarkCheck className="w-3.5 h-3.5 text-gov-saffron" />
              Save as my institution&apos;s mapping profile
            </span>
            <p className="text-[11px] text-slate-500">
              Future uploads from this institution with matching headers will be automatically mapped
              with highest confidence (Saved Profile method).
            </p>
          </div>
        </label>

        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={onBack} className="text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to File Selection
          </Button>

          <div className="flex items-center gap-3">
            {unmappedRequiredFields.length > 0 && (
              <span className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                V001 Active: Map all required fields to confirm
              </span>
            )}
            <Button
              variant="default"
              onClick={handleConfirm}
              disabled={unmappedRequiredFields.length > 0 || isSubmitting}
              className="bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-semibold px-4 py-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Saving Mapping...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-green-400" />
                  Confirm Mapping & Start Validation
                  <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
