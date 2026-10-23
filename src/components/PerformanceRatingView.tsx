/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SDO Tarlac City Teacher Performance Rating Registry
 */

import React, { useState, useMemo, useEffect } from 'react';
import { safeSetJSON } from '../utils/safeStorage';
import { 
  Award, 
  Search, 
  Download, 
  TrendingUp, 
  CheckCircle,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  Bookmark,
  RefreshCw,
  Database
} from 'lucide-react';
import { PersonnelRecord } from '../types';

const SEED_PERSONNEL_RECORDS: PersonnelRecord[] = [
  {
    id: 'pers-1',
    employeeNo: 'DEPED-2018-8021',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
    teacherName: 'AQUINO, MELODY ANNE B.',
    gender: 'Female',
    birthDate: '1985-09-12',
    age: 40,
    civilStatus: 'Married',
    email: 'melody.aquino@deped.gov.ph',
    position: 'District ALS Coordinator (DALSC)',
    careerStage: 'Highly Proficient',
    salaryGrade: 'SG-21',
    stepIncrement: 'Step 3',
    contactNo: '+63 917 283 5519',
    permanentAddress: '154 Barangay Maliwalo, Tarlac City, Tarlac',
    highestEducationalAttainment: 'Master of Arts in Education (MAEd)',
    eligibility: 'LET (Board for Professional Teachers)',
    eligibilityRating: '86.40%',
    dateAppointed: '2018-11-10',
    yearsInService: 8,
    dateAppointedALS: '2019-01-15',
    yearsInServiceALS: 7,
    gsisNo: '892110294-M',
    pagIbigNo: '1210-4491-0391',
    philHealthNo: '09-122930194-2',
    prcNo: '0749122',
    tinNo: '491-039-112-000',
    performanceRating: 4.88,
    adjectivalRating: 'Outstanding',
    linkToPr: 'https://docs.google.com/spreadsheets/d/mock-pr-1/edit',
    schoolYear: '2025-2026'
  },
  {
    id: 'pers-2',
    employeeNo: 'DEPED-2020-1492',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    teacherName: 'CALDOZA, MERVIN C.',
    gender: 'Male',
    birthDate: '1990-05-22',
    age: 36,
    civilStatus: 'Single',
    email: 'mervin.caldoza@deped.gov.ph',
    position: 'Mobile Teacher',
    careerStage: 'Proficient',
    salaryGrade: 'SG-13',
    stepIncrement: 'Step 2',
    contactNo: '+63 909 381 2291',
    permanentAddress: 'Row 4, Barangay San Vicente, Tarlac City, Tarlac',
    highestEducationalAttainment: 'Bachelor of Secondary Education (BSEd)',
    eligibility: 'LET (Board for Professional Teachers)',
    eligibilityRating: '82.15%',
    dateAppointed: '2020-07-01',
    yearsInService: 6,
    dateAppointedALS: '2020-07-01',
    yearsInServiceALS: 6,
    gsisNo: '301928401-K',
    pagIbigNo: '5910-3841-9201',
    philHealthNo: '12-039401928-1',
    prcNo: '0912384',
    tinNo: '381-940-192-000',
    performanceRating: 4.62,
    adjectivalRating: 'Outstanding',
    linkToPr: 'https://docs.google.com/spreadsheets/d/mock-pr-2/edit',
    schoolYear: '2024-2025'
  }
];

export function PerformanceRatingView() {
  const [personnel, setPersonnel] = useState<PersonnelRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchoolYearFilter, setSelectedSchoolYearFilter] = useState<string>('All');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncFromSheets = async () => {
    setIsSyncing(true);
    setSyncMessage('Connecting to Google Sheets: Fetching teacher profiles...');
    try {
      const profileRes = await fetch('/api/sheets/fetch-teacher-profiles');
      const profileJson = await profileRes.json();
      if (!profileJson.success) {
        throw new Error(profileJson.error || 'Failed to fetch profiles');
      }

      setSyncMessage('Connecting to Google Sheets: Fetching multi-year performance ratings...');
      const ratingsRes = await fetch('/api/sheets/fetch-teacher-performance-ratings');
      const ratingsJson = await ratingsRes.json();
      if (!ratingsJson.success) {
        throw new Error(ratingsJson.error || 'Failed to fetch performance ratings');
      }

      const fetchedProfiles: PersonnelRecord[] = profileJson.data;
      const fetchedRatings: any[] = ratingsJson.data;

      // Group historical ratings by teacher name and employee ID
      const ratingsMap: { [key: string]: { [year: string]: { rating: number, adjectival: string, link: string } } } = {};
      fetchedRatings.forEach((item) => {
        const nameKey = item.teacherName.toUpperCase().trim();
        const empIdKey = item.employeeId ? item.employeeId.trim() : '';

        // We can key by both name and employee ID
        const keys = [nameKey];
        if (empIdKey) keys.push(empIdKey);

        keys.forEach((k) => {
          if (!ratingsMap[k]) {
            ratingsMap[k] = {};
          }
          ratingsMap[k][item.schoolYear] = {
            rating: item.performanceRating,
            adjectival: item.adjectivalRating,
            link: item.linkToPr
          };
        });
      });

      // Merge historical ratings into the fetched profiles
      const mergedProfiles = fetchedProfiles.map((p) => {
        const nameKey = p.teacherName.toUpperCase().trim();
        const empIdKey = p.employeeNo ? p.employeeNo.trim() : '';

        // Lookup ratings for this teacher
        const ratings = ratingsMap[empIdKey] || ratingsMap[nameKey] || {};
        
        // Find latest rating year to set as the primary performance rating
        const ratingYears = Object.keys(ratings).sort();
        let primaryRating = p.performanceRating || 4.50;
        let primaryAdjectival = p.adjectivalRating || 'Very Satisfactory';
        let primaryLink = p.linkToPr || 'https://docs.google.com/spreadsheets/d/mock-pr/edit';
        let primaryYear = p.schoolYear || '2025-2026';

        if (ratingYears.length > 0) {
          const latestYear = ratingYears[ratingYears.length - 1];
          const latestData = ratings[latestYear];
          primaryRating = latestData.rating;
          primaryAdjectival = latestData.adjectival as any;
          primaryLink = latestData.link;
          primaryYear = latestYear;
        }

        return {
          ...p,
          performanceRating: primaryRating,
          adjectivalRating: primaryAdjectival,
          linkToPr: primaryLink,
          schoolYear: primaryYear,
          historicalRatings: ratings
        };
      });

      // Update state and save
      saveToStorage(mergedProfiles);
      setSyncMessage(`Success: Synchronized ${mergedProfiles.length} teacher records with historical rating grids.`);
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSyncMessage(`Sync failed: ${err.message || String(err)}`);
      setTimeout(() => setSyncMessage(null), 7000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto load from both baseline registries
  const loadPersonnelData = () => {
    const saved = localStorage.getItem('tcsd_personnel_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const loaded = parsed.map(p => ({
            ...p,
            schoolYear: p.schoolYear || '2025-2026'
          }));
          setPersonnel(loaded);
          return;
        }
      } catch (e) {
        console.error("Failed to parse personnel records", e);
      }
    }
    
    // Seed default if nothing exists
    setPersonnel(SEED_PERSONNEL_RECORDS);
    safeSetJSON('tcsd_personnel_records', SEED_PERSONNEL_RECORDS);
  };

  useEffect(() => {
    loadPersonnelData();
    window.addEventListener('storage', loadPersonnelData);
    return () => {
      window.removeEventListener('storage', loadPersonnelData);
    };
  }, []);

  const saveToStorage = (updated: PersonnelRecord[]) => {
    setPersonnel(updated);
    safeSetJSON('tcsd_personnel_records', updated);
  };

  // Helper to determine DepEd adjectival rating standard on numerical input
  const getSuggestedAdjectival = (val: number): PersonnelRecord['adjectivalRating'] => {
    if (val >= 4.50) return 'Outstanding';
    if (val >= 3.50) return 'Very Satisfactory';
    if (val >= 2.50) return 'Satisfactory';
    if (val >= 1.50) return 'Unsatisfactory';
    return 'Poor';
  };

  // Handler for direct inline editing
  const handlePerformanceRatingChange = (id: string, numRating: number) => {
    const isFlattened = id.includes('-');
    let targetId = id;
    let targetYear = '2025-2026';
    
    if (isFlattened && id.startsWith('pers-')) {
      const parts = id.split('-');
      if (parts.length >= 3) {
        targetYear = parts.slice(-2).join('-');
        targetId = parts.slice(0, -2).join('-');
      }
    }

    const updated = personnel.map((p) => {
      if (p.id === targetId) {
        const validatedNum = Math.min(5.00, Math.max(0.00, Number(numRating.toFixed(3))));
        const adjectival = getSuggestedAdjectival(validatedNum);
        
        if (p.historicalRatings) {
          const hist = { ...p.historicalRatings };
          hist[targetYear] = {
            ...(hist[targetYear] || { link: p.linkToPr || '' }),
            rating: validatedNum,
            adjectival
          };
          return {
            ...p,
            performanceRating: validatedNum,
            adjectivalRating: adjectival,
            historicalRatings: hist
          };
        } else {
          return {
            ...p,
            performanceRating: validatedNum,
            adjectivalRating: adjectival
          };
        }
      }
      return p;
    });
    saveToStorage(updated);
  };

  const handleLinkChange = (id: string, newLink: string) => {
    const isFlattened = id.includes('-');
    let targetId = id;
    let targetYear = '2025-2026';
    
    if (isFlattened && id.startsWith('pers-')) {
      const parts = id.split('-');
      if (parts.length >= 3) {
        targetYear = parts.slice(-2).join('-');
        targetId = parts.slice(0, -2).join('-');
      }
    }

    const updated = personnel.map((p) => {
      if (p.id === targetId) {
        if (p.historicalRatings) {
          const hist = { ...p.historicalRatings };
          hist[targetYear] = {
            ...(hist[targetYear] || { rating: p.performanceRating || 4.5, adjectival: p.adjectivalRating || 'Very Satisfactory' }),
            link: newLink
          };
          return {
            ...p,
            linkToPr: newLink,
            historicalRatings: hist
          };
        } else {
          return {
            ...p,
            linkToPr: newLink
          };
        }
      }
      return p;
    });
    saveToStorage(updated);
  };

  const handleAdjectivalChange = (id: string, newAdjectival: PersonnelRecord['adjectivalRating']) => {
    const isFlattened = id.includes('-');
    let targetId = id;
    let targetYear = '2025-2026';
    
    if (isFlattened && id.startsWith('pers-')) {
      const parts = id.split('-');
      if (parts.length >= 3) {
        targetYear = parts.slice(-2).join('-');
        targetId = parts.slice(0, -2).join('-');
      }
    }

    const updated = personnel.map((p) => {
      if (p.id === targetId) {
        if (p.historicalRatings) {
          const hist = { ...p.historicalRatings };
          hist[targetYear] = {
            ...(hist[targetYear] || { rating: p.performanceRating || 4.5, link: p.linkToPr || '' }),
            adjectival: newAdjectival
          };
          return {
            ...p,
            adjectivalRating: newAdjectival,
            historicalRatings: hist
          };
        } else {
          return {
            ...p,
            adjectivalRating: newAdjectival
          };
        }
      }
      return p;
    });
    saveToStorage(updated);
  };

  const handleSchoolYearChange = (id: string, newSchoolYear: string) => {
    const isFlattened = id.includes('-');
    let targetId = id;
    let oldYear = '2025-2026';
    
    if (isFlattened && id.startsWith('pers-')) {
      const parts = id.split('-');
      if (parts.length >= 3) {
        oldYear = parts.slice(-2).join('-');
        targetId = parts.slice(0, -2).join('-');
      }
    }

    const updated = personnel.map((p) => {
      if (p.id === targetId) {
        if (p.historicalRatings) {
          const hist = { ...p.historicalRatings };
          const oldData = hist[oldYear] || { rating: p.performanceRating || 4.5, adjectival: p.adjectivalRating || 'Very Satisfactory', link: p.linkToPr || '' };
          delete hist[oldYear];
          hist[newSchoolYear] = oldData;
          return {
            ...p,
            schoolYear: newSchoolYear,
            historicalRatings: hist
          };
        } else {
          return {
            ...p,
            schoolYear: newSchoolYear
          };
        }
      }
      return p;
    });
    saveToStorage(updated);
  };

  // Compute stats based on current filtered school year
  const performanceStats = useMemo(() => {
    const list: number[] = [];
    let outstanding = 0;
    let vs = 0;

    personnel.forEach((p) => {
      if (p.historicalRatings && Object.keys(p.historicalRatings).length > 0) {
        Object.entries(p.historicalRatings).forEach(([year, data]: [string, any]) => {
          if (selectedSchoolYearFilter === 'All' || year === selectedSchoolYearFilter) {
            list.push(data.rating);
            if (data.adjectival === 'Outstanding') outstanding++;
            if (data.adjectival === 'Very Satisfactory') vs++;
          }
        });
      } else {
        const year = p.schoolYear || '2025-2026';
        if (selectedSchoolYearFilter === 'All' || year === selectedSchoolYearFilter) {
          const rating = typeof p.performanceRating === 'number' ? p.performanceRating : 4.50;
          list.push(rating);
          if (p.adjectivalRating === 'Outstanding') outstanding++;
          if (p.adjectivalRating === 'Very Satisfactory') vs++;
        }
      }
    });

    if (list.length === 0) return { avg: "0.00", outstandingCount: 0, vsCount: 0, totalCount: 0 };
    const sum = list.reduce((a, b) => a + b, 0);

    return {
      avg: (sum / list.length).toFixed(2),
      outstandingCount: outstanding,
      vsCount: vs,
      totalCount: list.length
    };
  }, [personnel, selectedSchoolYearFilter]);

  // Filtered listing
  const filteredPersonnel = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list: any[] = [];
    
    personnel.forEach((p) => {
      if (p.historicalRatings && Object.keys(p.historicalRatings).length > 0) {
        Object.entries(p.historicalRatings).forEach(([year, data]: [string, any]) => {
          if (selectedSchoolYearFilter === 'All' || year === selectedSchoolYearFilter) {
            const matchesSearch = (
              p.teacherName.toLowerCase().includes(q) ||
              (p.employeeNo || '').toLowerCase().includes(q) ||
              (p.position || '').toLowerCase().includes(q)
            );
            if (matchesSearch) {
              list.push({
                ...p,
                id: `${p.id}-${year}`, // unique composite ID for rendering
                schoolYear: year,
                performanceRating: data.rating,
                adjectivalRating: data.adjectival,
                linkToPr: data.link
              });
            }
          }
        });
      } else {
        const year = p.schoolYear || '2025-2026';
        if (selectedSchoolYearFilter === 'All' || year === selectedSchoolYearFilter) {
          const matchesSearch = (
            p.teacherName.toLowerCase().includes(q) ||
            (p.employeeNo || '').toLowerCase().includes(q) ||
            (p.position || '').toLowerCase().includes(q)
          );
          if (matchesSearch) {
            list.push({
              ...p,
              schoolYear: year
            });
          }
        }
      }
    });
    
    return list;
  }, [personnel, searchQuery, selectedSchoolYearFilter]);

  // CSV Report Generator
  const handleExportCSV = () => {
    const headers = [
      'No.',
      'Employee ID',
      'Teacher Name',
      'School Year',
      'Performance Rating',
      'Adjectival Rating',
      'Link'
    ];

    const rows = filteredPersonnel.map((p, idx) => [
      idx + 1,
      `"${p.employeeNo}"`,
      `"${p.teacherName}"`,
      `"${p.schoolYear || '2025-2026'}"`,
      p.performanceRating?.toFixed(2) || '0.00',
      `"${p.adjectivalRating || 'Very Satisfactory'}"`,
      `"${p.linkToPr || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sdo_tarlac_teacher_performance_ratings_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="performance-rating-container" className="space-y-6">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#1E3A8A] to-[#0D9488] text-white p-6 rounded-3xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-400 text-slate-900 text-[9px] font-black rounded uppercase tracking-wider">
              PR Office
            </span>
            <span className="text-[10px] text-emerald-200 font-mono tracking-wider">
              SDO TARLAC CITY • PERFORMANCE RATINGS
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2.5">
            <Award className="w-5.5 h-5.5 text-emerald-300" />
            Teacher Performance Rating Registry
          </h2>
          <p className="text-xs text-emerald-100 max-w-3xl font-medium">
            Monitor IPCRF scores, adjectival ratings, and link corresponding performance records for all active Division personnel.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 shrink-0 self-start md:self-center">
          <button
            onClick={handleSyncFromSheets}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all outline-none cursor-pointer"
            title="Sync SDO Ratings from SDO Tarlac Sheets"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Ratings'}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/12 hover:bg-white/18 text-white border border-white/15 rounded-xl text-xs font-bold active:scale-95 transition-all outline-none cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PR Report
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className={`p-4 rounded-2xl text-xs font-semibold border flex items-center gap-2.5 transition-all shadow-xs ${
          syncMessage.toLowerCase().includes('failed') || syncMessage.toLowerCase().includes('error')
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : syncMessage.toLowerCase().includes('success')
              ? 'bg-emerald-50 border-emerald-200 text-emerald-850'
              : 'bg-blue-50 border-blue-200 text-blue-800 animate-pulse'
        }`}>
          <Database className="w-4 h-4 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5.5 h-5.5 text-[#1E3A8A]" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Division Average</span>
            <span className="text-lg font-black text-slate-800">{performanceStats.avg} / 5.00</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5.5 h-5.5 text-emerald-650" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Outstanding rated</span>
            <span className="text-lg font-black text-slate-800">{performanceStats.outstandingCount} Teachers</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <Sparkles className="w-5.5 h-5.5 text-teal-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Very Satisfactory</span>
            <span className="text-lg font-black text-slate-800">{performanceStats.vsCount} Teachers</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
            <Layers className="w-5.5 h-5.5 text-slate-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Evaluated</span>
            <span className="text-lg font-black text-slate-800">{performanceStats.totalCount} overall</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grow relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search Teacher by name, employee ID, position or assignment..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
          />
        </div>

        {/* School Year Filter Control */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            Filter School Year:
          </span>
          <select
            value={selectedSchoolYearFilter}
            onChange={e => setSelectedSchoolYearFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200/95 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="All">All School Years</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
            <option value="2022-2023">2022-2023</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/75 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
              Performance Ratings Matrix Logs
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-450 font-bold bg-slate-100 px-2.5 py-1 rounded-full">
            {filteredPersonnel.length} Records displayed
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider select-none">
                <th className="py-3.5 px-4 text-center w-12">No.</th>
                <th className="py-3.5 px-4 w-44">Employee ID</th>
                <th className="py-3.5 px-4 w-72">Teacher Name</th>
                <th className="py-3.5 px-4 text-center w-40">School Year</th>
                <th className="py-3.5 px-4 text-center w-48">Performance Rating</th>
                <th className="py-3.5 px-4 text-center w-52">Adjectival Rating</th>
                <th className="py-3.5 px-4">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-slate-705 font-semibold">
              {filteredPersonnel.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold font-sans">
                    No matching performance ratings found in the SDO database.
                  </td>
                </tr>
              ) : (
                filteredPersonnel.map((p, idx) => (
                  <tr key={`pr-${p.id}`} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* No. */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Employee ID */}
                    <td className="py-3.5 px-4 font-mono font-black text-indigo-900">
                      {p.employeeNo}
                    </td>

                    {/* Teacher Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <span className="truncate">{p.teacherName}</span>
                    </td>

                    {/* School Year */}
                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={p.schoolYear || '2025-2026'}
                        onChange={(e) => handleSchoolYearChange(p.id, e.target.value)}
                        className="px-2.5 py-1 bg-white border border-slate-250/70 rounded-full text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono cursor-pointer"
                      >
                        <option value="2025-2026">2025-2026</option>
                        <option value="2024-2025">2024-2025</option>
                        <option value="2023-2024">2023-2024</option>
                        <option value="2022-2023">2022-2023</option>
                      </select>
                    </td>

                    {/* Performance Rating */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center gap-1.5 justify-center max-w-[130px] mx-auto">
                        <input
                          type="number"
                          step="0.01"
                          min="0.00"
                          max="5.00"
                          value={p.performanceRating !== undefined ? p.performanceRating : 0}
                          onChange={(e) => handlePerformanceRatingChange(p.id, parseFloat(e.target.value) || 0)}
                          className="w-20 text-center px-1.5 py-1 bg-slate-50 border border-slate-250/70 rounded-lg text-xs font-bold focus:bg-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">/ 5.0</span>
                      </div>
                    </td>

                    {/* Adjectival Rating */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex max-w-[170px] mx-auto">
                        <select
                          value={p.adjectivalRating || 'Very Satisfactory'}
                          onChange={(e) => handleAdjectivalChange(p.id, e.target.value as PersonnelRecord['adjectivalRating'])}
                          className={`px-3 py-1 bg-white border border-slate-250 font-sans text-[11px] font-black uppercase rounded-full outline-none transition-all ${
                            (p.adjectivalRating === 'Outstanding')
                              ? 'text-emerald-700 font-black border-emerald-300 bg-emerald-50/40'
                              : (p.adjectivalRating === 'Very Satisfactory')
                                ? 'text-indigo-700 font-black border-indigo-300 bg-indigo-50/40'
                                : (p.adjectivalRating === 'Satisfactory')
                                  ? 'text-amber-700 font-black border-amber-300 bg-amber-50/40'
                                  : 'text-rose-700 font-black border-rose-300 bg-rose-50/40'
                          }`}
                        >
                          <option value="Outstanding">Outstanding</option>
                          <option value="Very Satisfactory">Very Satisfactory</option>
                          <option value="Satisfactory">Satisfactory</option>
                          <option value="Unsatisfactory">Unsatisfactory</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </div>
                    </td>

                    {/* Link */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 w-full max-w-[400px]">
                        <input
                          type="text"
                          value={p.linkToPr || ''}
                          placeholder="No link attached..."
                          onChange={(e) => handleLinkChange(p.id, e.target.value)}
                          className="grow px-2 py-1 bg-slate-50 border border-slate-200/80 hover:border-slate-350 rounded-lg text-[11px] font-mono text-slate-700 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                        />
                        {p.linkToPr && (p.linkToPr.startsWith('http') || p.linkToPr.includes('.')) && (
                          <a
                            href={p.linkToPr.startsWith('http') ? p.linkToPr : `https://${p.linkToPr}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#1E3A8A] rounded-lg transition-all shrink-0"
                            title="Open link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
