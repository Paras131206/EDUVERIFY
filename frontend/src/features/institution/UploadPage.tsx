import React, { useState } from 'react';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { Step1Choose } from './components/Step1Choose';
import { Step2Mapping } from './components/Step2Mapping';
import { Step3Validate } from './components/Step3Validate';
import { Step4Summary } from './components/Step4Summary';
import { ColumnMappingItem } from './types';
import { Check, UploadCloud, TableProperties, Radio, BarChart3 } from 'lucide-react';

export type WizardStep = 1 | 2 | 3 | 4;

export const UploadPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [batchInfo, setBatchInfo] = useState<{
    id: string;
    filename: string;
    academic_year: string;
  }>({
    id: 'batch-demo-2',
    filename: 'batch_2_errors.xlsx',
    academic_year: '2026-27',
  });

  const handleStep1Success = (createdBatch: {
    id: string;
    filename: string;
    academic_year: string;
  }) => {
    setBatchInfo({
      id: createdBatch.id || 'batch-demo-2',
      filename: createdBatch.filename || 'batch_2_errors.xlsx',
      academic_year: createdBatch.academic_year || '2026-27',
    });
    setCurrentStep(2);
  };

  const handleStep2Confirm = (_mappings: ColumnMappingItem[], _saveProfile: boolean) => {
    setCurrentStep(3);
  };

  const handleStep3Complete = () => {
    setCurrentStep(4);
  };

  const handleReset = () => {
    setCurrentStep(1);
  };

  const stepsMeta = [
    { num: 1, label: '1. Choose File', icon: <UploadCloud className="w-4 h-4" /> },
    { num: 2, label: '2. Map Columns', icon: <TableProperties className="w-4 h-4" /> },
    { num: 3, label: '3. Validate Engine', icon: <Radio className="w-4 h-4" /> },
    { num: 4, label: '4. Result Summary', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <OfflineBanner />

      {/* Main Page Title Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gov-navy">
              Institution Batch Upload Wizard
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ingest student admission records, auto-map columns with AICTE synonym catalog, and validate against national rules.
            </p>
          </div>
        </div>

        {/* Stepper Navigation */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stepsMeta.map((s) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <div
                key={s.num}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-gov-navy text-white border-gov-navy shadow-sm'
                    : isDone
                      ? 'bg-green-50 text-green-900 border-green-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isCurrent
                      ? 'bg-gov-saffron text-slate-900'
                      : isDone
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span className="truncate">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wizard Steps Rendering */}
      {currentStep === 1 && <Step1Choose onSuccess={handleStep1Success} />}

      {currentStep === 2 && (
        <Step2Mapping
          batchId={batchInfo.id}
          filename={batchInfo.filename}
          academicYear={batchInfo.academic_year}
          onBack={() => setCurrentStep(1)}
          onConfirm={handleStep2Confirm}
        />
      )}

      {currentStep === 3 && (
        <Step3Validate batchId={batchInfo.id} onComplete={handleStep3Complete} />
      )}

      {currentStep === 4 && (
        <Step4Summary batchId={batchInfo.id} onReset={handleReset} />
      )}
    </div>
  );
};
