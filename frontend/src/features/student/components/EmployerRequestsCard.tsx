import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmployerHiringRequestItem } from '../types';
import { API_BASE_URL, authFetch } from '@/lib/api';
import {
  Briefcase,
  XCircle,
  Clock,
  Building2,
  Lock,
  Unlock,
} from 'lucide-react';

interface EmployerRequestsCardProps {
  requests: EmployerHiringRequestItem[];
  onRequestDecided: (msg: string) => void;
}

export const EmployerRequestsCard: React.FC<EmployerRequestsCardProps> = ({
  requests,
  onRequestDecided,
}) => {
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleDecision = async (requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    setSubmittingId(requestId);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/v1/students/me/employer-requests/${requestId}/decision`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision }),
        }
      );
      if (res.ok) {
        onRequestDecided(
          decision === 'APPROVED'
            ? 'Employer hiring access approved. Verified academic marks unlocked for this recruiter.'
            : 'Employer hiring access rejected/revoked. Previous marks remain strictly locked.'
        );
      } else {
        const data = await res.json().catch(() => ({}));
        onRequestDecided(`Failed to update request: ${data.detail || res.statusText}`);
      }
    } catch (err: any) {
      console.error('Employer request decision error:', err);
      onRequestDecided('Network error updating hiring request decision.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-xs" data-testid="employer-requests-card">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-gov-navy flex items-center gap-2">
              Employer Hiring Access Requests
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold border border-indigo-200">
                DPDP Act §8.4
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Corporate recruiters requesting permission to view your verified academic marks (10th, 12th, semester SGPA/CGPA, skills)
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {requests.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Building2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700">No Employer Access Requests Pending</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              When corporate recruiters or campus placement teams request permission to view your verified marks, they will appear here for your explicit review and consent.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const isPending = req.status === 'PENDING';
              const isApproved = req.status === 'APPROVED';
              const isProcessing = submittingId === req.id;

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isPending
                      ? 'border-amber-200 bg-amber-50/30'
                      : isApproved
                      ? 'border-green-200 bg-green-50/20'
                      : 'border-slate-200 bg-slate-50/40'
                  }`}
                  data-testid={`employer-request-${req.id}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                          {req.employer_name}
                        </span>
                        {req.organization && (
                          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {req.organization}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : isApproved
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      {req.job_title && (
                        <div className="text-xs font-semibold text-gov-navy flex items-center gap-1">
                          <span>Target Role:</span>
                          <span className="font-normal text-slate-700">{req.job_title}</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-600 leading-relaxed bg-white/70 p-2 rounded-lg border border-slate-200/60">
                        <span className="font-semibold text-slate-700">Recruiter&apos;s Stated Purpose: </span>
                        {req.purpose}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Requested: {new Date(req.requested_at).toLocaleDateString()}
                        </span>
                        {req.decided_at && (
                          <span>
                            • Decided: {new Date(req.decided_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex sm:flex-col items-center gap-2 shrink-0 sm:min-w-[130px]">
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleDecision(req.id, 'APPROVED')}
                            className="bg-green-700 hover:bg-green-800 text-white text-xs h-8 w-full font-semibold flex items-center justify-center gap-1.5"
                            data-testid={`approve-request-btn-${req.id}`}
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            {isProcessing ? 'Saving...' : 'Grant Access'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isProcessing}
                            onClick={() => handleDecision(req.id, 'REJECTED')}
                            className="text-xs h-8 w-full border-red-200 text-red-700 hover:bg-red-50 font-semibold flex items-center justify-center gap-1.5"
                            data-testid={`reject-request-btn-${req.id}`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Decline
                          </Button>
                        </>
                      )}

                      {isApproved && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isProcessing}
                          onClick={() => handleDecision(req.id, 'REJECTED')}
                          className="text-xs h-8 w-full border-amber-300 text-amber-900 hover:bg-amber-50 font-semibold flex items-center justify-center gap-1.5"
                          data-testid={`revoke-request-btn-${req.id}`}
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                          {isProcessing ? 'Revoking...' : 'Revoke Access'}
                        </Button>
                      )}

                      {!isPending && !isApproved && (
                        <span className="text-[11px] text-slate-400 italic">
                          Decision recorded
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
