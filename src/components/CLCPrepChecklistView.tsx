/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Check, 
  X, 
  Search, 
  Printer, 
  ClipboardCheck, 
  Sparkles, 
  HelpCircle, 
  RotateCcw,
  RefreshCw,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { LearningCenter } from '../types';
import { safeSetJSON } from '../utils/safeStorage';

interface CLCPrepChecklistViewProps {
  learningCenters: LearningCenter[];
}

export const CHECKLIST_CRITERIA = [
  {
    key: 'structural',
    fullCriteria: 'Structural Integrity & Space: Learning areas have stable roofing, walls, and foundations free from structural hazards and leaks.'
  },
  {
    key: 'electrical',
    fullCriteria: 'Lighting & Electrical Systems: Outlets, switches, and lighting systems are fully insulated, functional, and safe from fire hazards.'
  },
  {
    key: 'ventilation',
    fullCriteria: 'Ventilation & Conduciveness: The CLC has proper windows or fans, ensuring it is well-ventilated and comfortable for learning.'
  },
  {
    key: 'wash',
    fullCriteria: 'Water & Sanitation (WASH): Clean water supply is accessible, and comfort rooms/handwashing stations are functional and clean.'
  },
  {
    key: 'ergonomics',
    fullCriteria: 'Learning Ergonomics: Desks, chairs, or presentation-style long tables are robust and sufficient for the registered ALS learner count.'
  },
  {
    key: 'sharedSpace',
    fullCriteria: 'Shared Space Safety: Clear layout definitions if sharing spaces (e.g., Barangay Hall, Covered Court) to avoid operational overlap.'
  },
  {
    key: 'hazardFree',
    fullCriteria: 'Hazard-Free Premises: Surrounding grounds are cleared of debris, stagnant water (dengue hazard), or sharp objects.'
  },
  {
    key: 'modules',
    fullCriteria: 'ALS Modules & Portfolios: Complete set of ALS K-12 aligned modules, presentation portfolios, and assessment exemplars are available.'
  },
  {
    key: 'literacyInterventions',
    fullCriteria: 'Literacy Interventions: FLT (Functional Literacy Test) sheets and early literacy diagnostic kits are printed and ready.'
  },
  {
    key: 'readingSpaces',
    fullCriteria: 'Community Reading Spaces: Dedicated book corners or open-access shelves are dry, well-organized, and safe from moisture/pests.'
  },
  {
    key: 'instructionalAids',
    fullCriteria: 'Instructional Aids: Basic teaching tools (whiteboards, flip charts, markers, and bulletin boards) are present and stocked.'
  },
  {
    key: 'technology',
    fullCriteria: 'Technology & ICT Equipment: Laptops, printers, or tablets used for digital literacy and portfolio scanning are functional and secure.'
  },
  {
    key: 'emergencySignage',
    fullCriteria: 'Emergency Signage & Access: Clear emergency exit path markings, emergency contacts directory, and disaster posters are up.'
  },
  {
    key: 'earlyWarning',
    fullCriteria: 'Early Warning Systems: The CLC is integrated into the Barangay or community\'s localized early hazard warning system.'
  },
  {
    key: 'firstAid',
    fullCriteria: 'Center First-Aid & Hygiene Kits: Fully stocked medical boxes (bandages, antiseptics) and hygiene essentials are accessible.'
  },
  {
    key: 'disasterResponse',
    fullCriteria: 'Disaster Response Kits: Emergency flashlights, whistles, and backup batteries are available for evening classes or storm seasons.'
  },
  {
    key: 'barangayLiaison',
    fullCriteria: 'Barangay Government Liaison: Active coordination protocol setup with the Barangay Chairman and local councilors.'
  },
  {
    key: 'workingCommittees',
    fullCriteria: 'Working Committees Setup: Formalized volunteer task groups consisting of ALS teachers, partners, and active learners.'
  },
  {
    key: 'noFees',
    fullCriteria: 'Complete Absence of Fee Collection: Strict enforcement mechanisms ensuring zero collection or mandatory solicitation fees.'
  }
];

export default function CLCPrepChecklistView({ learningCenters }: CLCPrepChecklistViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollTable = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      tableContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  // Dynamic compliance store saved in localStorage
  const [complianceMap, setComplianceMap] = useState<Record<string, Record<string, boolean>>>(() => {
    const saved = localStorage.getItem('clc_preparedness_checklist_compliance');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse compliance checklist. Constructing initial values.", e);
      }
    }
    
    // Fallback: seed initial compliance status pseudo-randomly using hash for consistent rendering
    const seeded: Record<string, Record<string, boolean>> = {};
    learningCenters.forEach(clc => {
      let hash = 0;
      for (let i = 0; i < clc.id.length; i++) hash += clc.id.charCodeAt(i);
      
      const machineState: Record<string, boolean> = {};
      CHECKLIST_CRITERIA.forEach((crit, critIdx) => {
        // High compatibility rate seeded by default (approx 75-80%)
        const metricDeterministicSeed = (hash + critIdx * 7) % 10;
        machineState[crit.key] = metricDeterministicSeed > 2; // complied if > 2
      });
      seeded[clc.id] = machineState;
    });
    return seeded;
  });

  // Save compliance changes to local storage
  useEffect(() => {
    if (complianceMap) {
      safeSetJSON('clc_preparedness_checklist_compliance', complianceMap);
    }
  }, [complianceMap]);

  // Sync compliance map if learningCenters prop changes (e.g., after Google Sheets sync)
  useEffect(() => {
    const saved = localStorage.getItem('clc_preparedness_checklist_compliance');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setComplianceMap(parsed);
        }
      } catch (e) {
        console.error("Failed to parse compliance checklist on prop change", e);
      }
    }
  }, [learningCenters]);

  // Handler to toggle particular list cell compliance state
  const handleToggleCompliance = (clcId: string, criteriaKey: string) => {
    setComplianceMap(prev => {
      const currentClcState = prev[clcId] || {};
      const updatedClcState = {
        ...currentClcState,
        [criteriaKey]: !currentClcState[criteriaKey]
      };
      return {
        ...prev,
        [clcId]: updatedClcState
      };
    });
  };

  // Bulk operation: Set all compliant for a single CLC
  const setAllCompliant = (clcId: string) => {
    setComplianceMap(prev => {
      const updatedClcState: Record<string, boolean> = {};
      CHECKLIST_CRITERIA.forEach(crit => {
        updatedClcState[crit.key] = true;
      });
      return {
        ...prev,
        [clcId]: updatedClcState
      };
    });
  };

  // Bulk operation: reset/clear compliance status for a single CLC
  const clearAllCompliance = (clcId: string) => {
    setComplianceMap(prev => {
      const updatedClcState: Record<string, boolean> = {};
      CHECKLIST_CRITERIA.forEach(crit => {
        updatedClcState[crit.key] = false;
      });
      return {
        ...prev,
        [clcId]: updatedClcState
      };
    });
  };

  // Filter Centers based on User search
  const filteredCenters = useMemo(() => {
    return learningCenters.filter(c => {
      const clcCode = `CLC-${c.id.replace('clc-', '').padStart(3, '0')}`;
      return (
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clcCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.district.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [learningCenters, searchQuery]);

  // Compute overall diagnostics
  const summaryMetrics = useMemo(() => {
    let totalItemsChecked = 0;
    let compliantItemsChecked = 0;
    let fullyPreparedCount = 0;

    learningCenters.forEach(clc => {
      const state = complianceMap[clc.id] || {};
      let clcComplianceCount = 0;
      
      CHECKLIST_CRITERIA.forEach(crit => {
        totalItemsChecked++;
        if (state[crit.key]) {
          compliantItemsChecked++;
          clcComplianceCount++;
        }
      });

      if (clcComplianceCount === CHECKLIST_CRITERIA.length) {
        fullyPreparedCount++;
      }
    });

    const averageScore = totalItemsChecked > 0 
      ? Math.round((compliantItemsChecked / totalItemsChecked) * 100) 
      : 0;

    return {
      averageScore,
      fullyPreparedCount,
      partiallyPreparedCount: learningCenters.length - fullyPreparedCount
    };
  }, [learningCenters, complianceMap]);

  return (
    <div className="flex flex-col gap-6 max-w-full h-full p-1" id="clc-preparedness-checklist-root">
      
      {/* Page Header and Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 px-2.5 rounded-full bg-[#E3EDFA] text-[#002B6D] text-[10px] font-bold uppercase tracking-wider">
              Safety & Compliance Assurance
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#002B6D] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              DepEd Quality Standards Verified
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5.5 h-5.5 text-[#002B6D]" /> Community Learning Center Preparedness Checklist
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official evaluation register assessing facilities, security signage, WASH setups, disaster kits, and complete absence of fee collection across all hubs.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#002B6D] hover:bg-[#002357] text-white rounded-xl text-xs font-bold transition self-start md:self-auto shrink-0 shadow-xs"
          title="Print official report representation"
        >
          <Printer className="w-3.5 h-3.5" /> Print Checklist Reports
        </button>
      </div>

      {/* Diagnostics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Readiness Compliance Score</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-slate-800 tracking-tight">{summaryMetrics.averageScore}%</span>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1 py-0.25 rounded font-extrabold">Division Avg</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-[#002B6D] shrink-0">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Fully Compliant Hubs</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-[#002B6D] tracking-tight">{summaryMetrics.fullyPreparedCount}</span>
              <span className="text-[10px] text-slate-450 font-bold uppercase">of {learningCenters.length} Centrals</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-650 shrink-0">
            <Info className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Pending Indicators On Hold</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-amber-705 tracking-tight">{summaryMetrics.partiallyPreparedCount}</span>
              <span className="text-[10px] text-slate-450 font-bold uppercase">Needs Resource Action</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Search */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex flex-col sm:flex-row gap-3 items-center justify-between print:hidden">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search learning centers, teachers, or districts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-[#002b6d] focus:bg-white transition"
            id="clc-checklist-search"
          />
        </div>
        
        <div className="text-[11px] text-slate-400 font-semibold font-mono flex items-center gap-1.5 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#002B6D] shrink-0" />
          <span>Interactive Grid: Click cells to toggle compliance status instantly</span>
        </div>
      </div>

      {/* Checklist Table Area */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col grow relative group/table">
        {/* Floating Left Smooth-Scrolling Arrow Slider */}
        <button
          type="button"
          onClick={() => scrollTable('left')}
          className="absolute left-3 top-[50%] -translate-y-1/2 z-20 p-3 bg-white hover:bg-[#002B6D] text-slate-700 hover:text-white border border-slate-200 shadow-md rounded-full opacity-0 group-hover/table:opacity-90 hover:opacity-100 transition-all focus:outline-none flex items-center justify-center cursor-pointer transform hover:scale-110 active:scale-95 duration-150 backdrop-blur-xs print:hidden"
          title="Scroll Left"
          aria-label="Scroll table left"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Floating Right Smooth-Scrolling Arrow Slider */}
        <button
          type="button"
          onClick={() => scrollTable('right')}
          className="absolute right-3 top-[50%] -translate-y-1/2 z-20 p-3 bg-white hover:bg-[#002B6D] text-slate-700 hover:text-white border border-slate-200 shadow-md rounded-full opacity-0 group-hover/table:opacity-90 hover:opacity-100 transition-all focus:outline-none flex items-center justify-center cursor-pointer transform hover:scale-110 active:scale-95 duration-150 backdrop-blur-xs print:hidden"
          title="Scroll Right"
          aria-label="Scroll table right"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div ref={tableContainerRef} className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-fixed text-xs" style={{ minWidth: '3200px' }} id="clc-preparedness-checklist-table">
            <thead>
              {/* Main headers row spanning exact requested columns */}
              <tr className="bg-slate-50 border-b border-slate-200 text-[#002B6D] uppercase font-mono text-[9px] font-bold tracking-wider">
                <th className="py-3.5 px-4 text-center font-bold w-14 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">No.</th>
                <th className="py-3.5 px-4 font-bold w-64 sticky left-14 bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-250">Name of Community Learning Center</th>
                
                {/* 19 specific criteria columns exact wording */}
                {CHECKLIST_CRITERIA.map((crit, index) => (
                  <th 
                    key={crit.key} 
                    className="py-3.5 px-4 font-bold text-slate-700 hover:text-[#002B6D] transition-colors leading-tight text-left vertical-align-top border-r border-slate-200 align-top w-52 bg-slate-50/50"
                  >
                    <div className="space-y-1">
                      <span className="text-[9px] text-[#002B6D] font-black block">CRITERION {index + 1}</span>
                      <p className="normal-case text-[10px] text-slate-600 font-semibold leading-relaxed font-sans">{crit.fullCriteria}</p>
                    </div>
                  </th>
                ))}
                
                {/* Quick actions sticky columns */}
                <th className="py-3.5 px-4 text-center font-bold w-48 sticky right-0 bg-slate-50 z-20 border-l border-slate-250 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">Utility Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-750">
              {filteredCenters.map((clc, idx) => {
                const no = clc.no || String(idx + 1);
                
                // Get compliance state
                const clcState = complianceMap[clc.id] || {};
                
                // Count compliant items to render badge progress
                let compliantsCount = 0;
                CHECKLIST_CRITERIA.forEach(crit => {
                  if (clcState[crit.key]) compliantsCount++;
                });

                const allChecked = compliantsCount === CHECKLIST_CRITERIA.length;
                const complianceScore = Math.round((compliantsCount / CHECKLIST_CRITERIA.length) * 100);

                return (
                  <tr 
                    key={clc.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                    id={`checklist-row-${clc.id}`}
                  >
                    {/* Index */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {no}
                    </td>

                    {/* CLC Center Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-800 sticky left-14 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-150">
                      <div className="flex flex-col">
                        <span className="truncate max-w-[210px]" title={clc.name}>{clc.name}</span>
                        <div className="flex items-center gap-1.5 mt-1 font-semibold text-[9px] uppercase tracking-wide">
                          <span className="text-slate-450">{clc.district}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-350"></span>
                          <span className={allChecked ? "text-emerald-600 font-extrabold" : "text-amber-600 font-extrabold"}>
                            {complianceScore}% Ready
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Rendering 19 Interactive Criteria compliance switches */}
                    {CHECKLIST_CRITERIA.map(crit => {
                      const complied = !!clcState[crit.key];
                      
                      return (
                        <td 
                          key={crit.key} 
                          className="py-3 px-4 border-r border-slate-100 hover:bg-slate-100/70 transition duration-150 cursor-pointer select-none"
                          onClick={() => handleToggleCompliance(clc.id, crit.key)}
                          title={`Click to toggle compliance status for ${crit.fullCriteria.split(':')[0]}`}
                        >
                          <div className="flex items-center justify-center">
                            {complied ? (
                              <button
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-extrabold transition duration-150 border border-emerald-100 w-full justify-center"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Complied</span>
                              </button>
                            ) : (
                              <button
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-[10px] font-extrabold transition duration-150 border border-rose-100 w-full justify-center"
                              >
                                <X className="w-3.5 h-3.5 text-rose-650" />
                                <span className="opacity-75">Action Needed</span>
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Quick Tools actions column */}
                    <td className="py-3 px-4 sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-150 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setAllCompliant(clc.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-[#E3EDFA] text-slate-650 hover:text-[#002B6D] text-[10px] font-extrabold rounded transition duration-150 border border-slate-205"
                          title="Instantly mark all compliance indicators as satisfied"
                        >
                          All Yes
                        </button>
                        
                        <button
                          onClick={() => clearAllCompliance(clc.id)}
                          className="p-1 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded text-[10px] font-bold border border-transparent hover:border-rose-100 transition duration-150"
                          title="Reset center checkbox states back to negative criteria"
                        >
                          Clear
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredCenters.length === 0 && (
                <tr id="checklist-empty-row">
                  <td colSpan={22} className="py-12 px-4 text-center bg-white">
                    <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-extrabold text-slate-700">No matching centers registered</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Adjust your search keyword above to find active Community Learning Centers.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mini Table Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2 shrink-0">
          <p className="font-bold">Total Centers Monitored: {filteredCenters.length} centers loaded of {learningCenters.length} records.</p>
          <p className="font-semibold text-slate-400 uppercase font-mono tracking-wider">DepEd Tarlac City ALS Operations Division office representative</p>
        </div>
      </div>

    </div>
  );
}
