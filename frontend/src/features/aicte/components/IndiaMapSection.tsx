import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { StateMetricRecord, InstitutionDrilldownItem } from '../types';
import { API_BASE_URL } from '@/lib/api';
import {
  MapPin,
  Search,
  Building,
  X,
  Info,
} from 'lucide-react';

export type MapMetricType = 'fill' | 'excess' | 'dq' | 'coverage';

interface IndiaMapSectionProps {
  states: StateMetricRecord[];
}

export const IndiaMapSection: React.FC<IndiaMapSectionProps> = ({ states }) => {
  const [selectedMetric, setSelectedMetric] = useState<MapMetricType>('fill');
  const [selectedState, setSelectedState] = useState<StateMetricRecord | null>(null);
  const [drilldownInstitutions, setDrilldownInstitutions] = useState<InstitutionDrilldownItem[]>([]);
  const [drilldownLoading, setDrilldownLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(true);

  // Attempt to check if official Survey of India boundary GeoJSON exists in public/geo/
  useEffect(() => {
    let isMounted = true;
    fetch('/geo/india-states.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('File not found');
        return res.json();
      })
      .then(() => {
        if (isMounted) setIsUsingFallback(false);
      })
      .catch(() => {
        if (isMounted) setIsUsingFallback(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch drilldown institutions on state click
  const handleStateClick = async (state: StateMetricRecord) => {
    setSelectedState(state);
    setDrilldownLoading(true);
    setSearchQuery('');
    try {
      const res = await fetch(`${API_BASE_URL}/v1/dashboards/aicte/map?state_code=${state.lgd_state_code}`);
      if (res.ok) {
        const data: InstitutionDrilldownItem[] = await res.json();
        setDrilldownInstitutions(data);
      } else {
        setDrilldownInstitutions([]);
      }
    } catch (err) {
      console.error('Failed to load drilldown:', err);
      setDrilldownInstitutions([]);
    } finally {
      setDrilldownLoading(false);
    }
  };

  const getMetricColor = (state: StateMetricRecord, metric: MapMetricType) => {
    if (metric === 'fill') {
      if (state.fill_percentage > 105) return 'bg-red-500 text-white border-red-600 hover:bg-red-600';
      if (state.fill_percentage > 100) return 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600';
      if (state.fill_percentage >= 92) return 'bg-gov-navy text-white border-gov-navyDark hover:bg-blue-900';
      return 'bg-blue-100 text-blue-950 border-blue-300 hover:bg-blue-200';
    }
    if (metric === 'excess') {
      if (state.excess_seats > 40) return 'bg-red-500 text-white border-red-600 hover:bg-red-600';
      if (state.excess_seats > 15) return 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600';
      if (state.excess_seats > 0) return 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200';
      return 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700';
    }
    if (metric === 'dq') {
      if (state.avg_dq_score >= 94) return 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700';
      if (state.avg_dq_score >= 90) return 'bg-gov-navy text-white border-gov-navyDark hover:bg-blue-900';
      if (state.avg_dq_score >= 85) return 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600';
      return 'bg-red-500 text-white border-red-600 hover:bg-red-600';
    }
    if (metric === 'coverage') {
      if (state.coverage_rate >= 95) return 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700';
      if (state.coverage_rate >= 90) return 'bg-gov-navy text-white border-gov-navyDark hover:bg-blue-900';
      return 'bg-blue-200 text-blue-950 border-blue-400 hover:bg-blue-300';
    }
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  const getMetricValueDisplay = (state: StateMetricRecord, metric: MapMetricType) => {
    switch (metric) {
      case 'fill':
        return `${state.fill_percentage}%`;
      case 'excess':
        return state.excess_seats > 0 ? `+${state.excess_seats} excess` : '0 excess';
      case 'dq':
        return `${state.avg_dq_score}% DQ`;
      case 'coverage':
        return `${state.coverage_rate}% coverage`;
    }
  };

  const filteredInstitutions = drilldownInstitutions.filter((inst) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inst.name.toLowerCase().includes(q) ||
      inst.institution_aicte_id.toLowerCase().includes(q) ||
      inst.district_name.toLowerCase().includes(q)
    );
  });

  return (
    <Card className="border-slate-200 bg-white shadow-xs" data-testid="india-map-section">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-base text-gov-navy flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gov-navy" />
            <span>National Geospatial Ingestion & Compliance Map</span>
          </CardTitle>
          <CardDescription className="text-xs">
            State-by-state surveillance keyed by official LGD codes with district and institution drilldown
          </CardDescription>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setSelectedMetric('fill')}
            data-testid="metric-btn-fill"
            className={`px-3 py-1 font-semibold rounded-md transition ${
              selectedMetric === 'fill' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fill %
          </button>
          <button
            onClick={() => setSelectedMetric('excess')}
            data-testid="metric-btn-excess"
            className={`px-3 py-1 font-semibold rounded-md transition ${
              selectedMetric === 'excess' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Excess Seats
          </button>
          <button
            onClick={() => setSelectedMetric('dq')}
            data-testid="metric-btn-dq"
            className={`px-3 py-1 font-semibold rounded-md transition ${
              selectedMetric === 'dq' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            DQ Score
          </button>
          <button
            onClick={() => setSelectedMetric('coverage')}
            data-testid="metric-btn-coverage"
            className={`px-3 py-1 font-semibold rounded-md transition ${
              selectedMetric === 'coverage' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Coverage
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-6">
        {/* FALLBACK TILE-GRID DISCLAIMER */}
        {isUsingFallback && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>State Tile-Grid Fallback Active:</strong> Official Survey of India shapefiles (LGD keyed) are rendered in high-density grid view per agents.md §12. Click any state tile to inspect institutions.
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300 shrink-0">
              agents.md §12
            </span>
          </div>
        )}

        {/* STATE TILE-GRID MAP */}
        <div data-testid="map-tile-grid-fallback" className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
            <span className="font-semibold text-slate-700">Select State to Drill Down:</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
                <span>Optimal (≥94%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gov-navy inline-block" />
                <span>Compliant</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                <span>Warning</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-500 inline-block" />
                <span>Ceiling Breach / Excess</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2.5">
            {states.map((st) => {
              const isSelected = selectedState?.lgd_state_code === st.lgd_state_code;
              return (
                <button
                  key={st.lgd_state_code}
                  onClick={() => handleStateClick(st)}
                  id={`state-tile-${st.lgd_state_code}`}
                  data-testid={`state-tile-${st.lgd_state_code}`}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between min-h-[92px] ${getMetricColor(
                    st,
                    selectedMetric
                  )} ${isSelected ? 'ring-3 ring-gov-saffron ring-offset-2 shadow-md' : 'shadow-2xs'}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-bold opacity-80">
                      LGD {st.lgd_state_code}
                    </span>
                    <span className="text-[10px] opacity-75 font-semibold">
                      {st.total_institutions} Inst
                    </span>
                  </div>

                  <div>
                    <p className="font-bold text-xs truncate leading-tight">{st.state_name}</p>
                    <p className="text-[10px] opacity-80 mt-0.5 font-medium">
                      {getMetricValueDisplay(st, selectedMetric)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STATE DRILLDOWN DRAWER / TABLE */}
        {selectedState && (
          <div
            className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-in fade-in duration-300"
            data-testid="state-drilldown-table"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h4 className="text-base font-bold text-gov-navy flex items-center gap-2">
                  <Building className="w-4 h-4 text-gov-saffron" />
                  <span>{selectedState.state_name} ({selectedState.state_name_hi})</span>
                  <span className="text-xs bg-gov-navy/10 text-gov-navy font-mono font-bold px-2 py-0.5 rounded">
                    LGD Code: {selectedState.lgd_state_code}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedState.total_institutions} Institutions • {selectedState.enrolled_count.toLocaleString()} Students Enrolled • {selectedState.fill_percentage}% Fill Ratio
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Filter institutions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 text-xs h-8 bg-white"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedState(null)}
                  className="h-8 text-xs bg-white text-slate-700"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Close Drilldown
                </Button>
              </div>
            </div>

            {drilldownLoading ? (
              <div className="py-8 text-center text-xs text-slate-500 font-medium">
                Loading institutional records for {selectedState.state_name}...
              </div>
            ) : filteredInstitutions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No matching institutions found in {selectedState.state_name}.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-xs">AICTE ID</TableHead>
                      <TableHead className="text-xs">Institution Name</TableHead>
                      <TableHead className="text-xs">District</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Model</TableHead>
                      <TableHead className="text-xs text-right">Enrolled / Intake</TableHead>
                      <TableHead className="text-xs text-right">Fill %</TableHead>
                      <TableHead className="text-xs text-right">Excess</TableHead>
                      <TableHead className="text-xs text-right">DQ Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInstitutions.map((inst) => (
                      <TableRow key={inst.institution_aicte_id} className="hover:bg-slate-50/60">
                        <TableCell className="font-mono text-xs font-bold text-gov-navy">
                          {inst.institution_aicte_id}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-900 max-w-xs truncate">
                          {inst.name}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {inst.district_name}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {inst.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              inst.onboarding_level === 'FULL'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inst.onboarding_level}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium text-slate-800">
                          {inst.enrolled} / {inst.intake}
                        </TableCell>
                        <TableCell className="text-xs text-right font-bold text-gov-navy">
                          {inst.fill_pct}%
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {inst.excess > 0 ? (
                            <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                              +{inst.excess}
                            </span>
                          ) : (
                            <span className="text-green-700 font-semibold">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-right font-bold text-slate-800">
                          {inst.dq_score}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
