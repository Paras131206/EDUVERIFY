import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { MaskedValue } from '@/components/shared/MaskedValue';
import { ArrowLeftRight, Check, X } from 'lucide-react';

export const TransfersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gov-navy">Inter-Institution Transfers</h2>
          <p className="text-xs text-slate-500 mt-1">
            Governed by Section 8.1: Destination requests, Source approves, AICTE 15-day override
          </p>
        </div>
        <Button variant="default">
          <ArrowLeftRight className="w-4 h-4 mr-2" />
          Request Student Transfer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending Inbound & Outbound Transfers</CardTitle>
          <CardDescription>
            Approved transfers transition source records to TRANSFERRED_OUT without raising duplicate flags (V010)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer ID</TableHead>
                <TableHead>APAAR ID</TableHead>
                <TableHead>From Institution</TableHead>
                <TableHead>To Institution</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-xs">TR-2026-0881</TableCell>
                <TableCell>
                  <MaskedValue value="984512349012" kind="apaar" />
                </TableCell>
                <TableCell className="text-xs">1-1234567890 (Current)</TableCell>
                <TableCell className="text-xs">1-9876543210 (NIT Delhi)</TableCell>
                <TableCell className="text-xs text-slate-600">Family relocation to NCR</TableCell>
                <TableCell>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                    PENDING APPROVAL
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5">
                    <Button variant="saffron" size="sm">
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button variant="outline" size="sm">
                      <X className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
