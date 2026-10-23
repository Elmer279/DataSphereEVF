/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SDO Tarlac City Teacher 201 File Registry
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { safeSetJSON } from '../utils/safeStorage';
import { 
  FolderOpen, 
  Search, 
  Edit2, 
  Download, 
  RotateCcw,
  CheckCircle,
  Clock,
  MinusCircle,
  FileText,
  Sparkles,
  Info,
  HelpCircle,
  Check,
  X,
  PlusCircle,
  Users,
  Compass,
  ListFilter,
  CheckSquare,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PersonnelRecord } from '../types';

export const DOCUMENT_KEYS = [
  'Personal Data Sheet',
  'Birth Certificate (PSA Copy)',
  'Marriage Certificate (if applicable)',
  'Medical/Health Records (CSC Form 211)',
  'NBI Clearance',
  'Identification Documents (TIN, GSIS, Pag-IBIG, PhilHealth)',
  'Appointment Papers (Form 33, Original & Latest)',
  'Oath of Office',
  'Assumption to Duty',
  'Position Description Form',
  'Service Records',
  'Designation Orders (if applicable)',
  'Transcript of Records (TOR)',
  'Diploma(s)',
  'Certificates of Training, Seminars, and Workshops',
  'Certificate of Eligibilities / PRC License',
  'GSIS Membership',
  'Pag-IBIG Membership',
  'PhilHealth Membership',
  'Notices of Salary Adjustments / Step Increments',
  'Reclassification / Equivalency Records (ERF, Position Upgrading)',
  'Income Tax Return (Latest Copy)',
  'Sworn Statement of Assets, Liabilities, and Net Worth (SALN)'
];

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
    linkToPr: 'https://docs.google.com/spreadsheets/d/mock-pr-1/edit'
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
    linkToPr: 'https://docs.google.com/spreadsheets/d/mock-pr-2/edit'
  }
];

export interface Teacher201FilesMap {
  [teacherId: string]: {
    [docKey: string]: string;
  };
}

export function Teacher201FileView() {
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncFromSheets = async () => {
    setIsSyncing(true);
    setSyncMessage('Connecting to Google Sheets: Fetching 201 File Compliance Checklist...');
    try {
      const res = await fetch('/api/sheets/fetch-teacher-201-files');
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch 201 file compliance matrix');
      }

      const fetchedMap: Teacher201FilesMap = json.data;

      // Merge fetched map with current local docStatuses to preserve any manually entered links
      const mergedMap: Teacher201FilesMap = { ...docStatuses };

      Object.entries(fetchedMap).forEach(([fetchedKey, fetchedDocs]) => {
        const keyParts = fetchedKey.split('-');
        const namePart = keyParts.slice(2).join(' ').toUpperCase().trim();
        const employeePart = keyParts[1] ? keyParts[1].toUpperCase().trim() : '';

        // Find matches in our active teacher list
        const matchedTeacher = teachers.find((t) => {
          const tName = t.teacherName.toUpperCase().trim();
          const tEmpNo = t.employeeNo ? t.employeeNo.toUpperCase().trim() : '';
          return (tEmpNo && tEmpNo === employeePart) || tName === namePart;
        });

        if (matchedTeacher) {
          mergedMap[matchedTeacher.id] = {
            ...(mergedMap[matchedTeacher.id] || {}),
            ...fetchedDocs
          };
        } else {
          mergedMap[fetchedKey] = fetchedDocs;
        }
      });

      safeSetJSON('tcsd_teacher_201_files', mergedMap);
      setDocStatuses(mergedMap);
      setSyncMessage(`Success: Synchronized 201 compliance checklists for ${Object.keys(fetchedMap).length} educator folders.`);
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err: any) {
      console.error('201 sync failed:', err);
      setSyncMessage(`Sync failed: ${err.message || String(err)}`);
      setTimeout(() => setSyncMessage(null), 7000);
    } finally {
      setIsSyncing(false);
    }
  };

  const scrollTable = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      tableContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const [teachers, setTeachers] = useState<PersonnelRecord[]>([]);
  const [docStatuses, setDocStatuses] = useState<Teacher201FilesMap>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Complete (100%)' | 'Incomplete'>('All');
  const [selectedTeacher, setSelectedTeacher] = useState<PersonnelRecord | null>(null);

  // Load teachers from localStorage & construct/sync docStatuses
  const loadRegistryData = () => {
    // 1. Load active teachers
    const storedTeachersRaw = localStorage.getItem('tcsd_personnel_records');
    let loadedTeachers: PersonnelRecord[] = [];
    if (storedTeachersRaw) {
      try {
        const parsed = JSON.parse(storedTeachersRaw);
        if (Array.isArray(parsed)) {
          loadedTeachers = parsed;
        }
      } catch (e) {
        console.error("Error loading teachers", e);
      }
    }
    
    if (loadedTeachers.length === 0) {
      loadedTeachers = SEED_PERSONNEL_RECORDS;
    }
    setTeachers(loadedTeachers);

    // 2. Load 201 document submission statuses
    const storedDocsRaw = localStorage.getItem('tcsd_teacher_201_files');
    let loadedDocs: Teacher201FilesMap = {};
    if (storedDocsRaw) {
      try {
        const parsed = JSON.parse(storedDocsRaw);
        if (parsed && typeof parsed === 'object') {
          loadedDocs = parsed;
        }
      } catch (e) {
        console.error("Error loading 201 statuses", e);
      }
    }

    // Ensure every loaded teacher has robust status data for 23 documentation items
    let modified = false;
    loadedTeachers.forEach((teacher) => {
      if (!loadedDocs[teacher.id]) {
        loadedDocs[teacher.id] = {};
        modified = true;
      }
      
      DOCUMENT_KEYS.forEach((key, index) => {
        if (loadedDocs[teacher.id][key] === undefined) {
          // If previous data used old status types 'Submitted' | 'Pending' | 'N/A', convert them, or seed links
          if (teacher.id === 'pers-1') {
            loadedDocs[teacher.id][key] = `https://docs.google.com/document/d/mock-pds-${teacher.id}-${index}/edit`;
          } else if (teacher.id === 'pers-2') {
            loadedDocs[teacher.id][key] = index % 5 === 0 ? '' : `https://docs.google.com/document/d/mock-pds-${teacher.id}-${index}/edit`;
          } else {
            // Others have some default links or empty to represent Pending
            loadedDocs[teacher.id][key] = Math.random() > 0.4 
              ? `https://docs.google.com/document/d/mock-pds-file-${index}/edit` 
              : '';
          }
          modified = true;
        } else {
          // Backward compatibility check: convert legacy states
          const oldVal = loadedDocs[teacher.id][key];
          if (oldVal === 'Submitted') {
            loadedDocs[teacher.id][key] = `https://docs.google.com/document/d/mock-restored-${teacher.id}-${index}/edit`;
            modified = true;
          } else if (oldVal === 'Pending' || oldVal === 'N/A') {
            loadedDocs[teacher.id][key] = '';
            modified = true;
          }
        }
      });
    });

    if (modified) {
      safeSetJSON('tcsd_teacher_201_files', loadedDocs);
    }
    setDocStatuses(loadedDocs);
  };

  useEffect(() => {
    loadRegistryData();

    // Set up window listener to reload when other tabs save personnel updates
    window.addEventListener('storage', loadRegistryData);
    return () => {
      window.removeEventListener('storage', loadRegistryData);
    };
  }, []);

  // Sync state changes back to localStorage
  const saveDocStatuses = (updated: Teacher201FilesMap) => {
    setDocStatuses(updated);
    safeSetJSON('tcsd_teacher_201_files', updated);
  };

  // Update specific document link/text
  const handleSetDocStatus = (teacherId: string, docKey: string, linkValue: string) => {
    const teacherMap = { ...docStatuses };
    if (!teacherMap[teacherId]) {
      teacherMap[teacherId] = {};
    }
    teacherMap[teacherId][docKey] = linkValue;
    saveDocStatuses(teacherMap);
  };

  // Bulk update: Set all docs to mock google doc links for a teacher
  const handleMarkAllSubmitted = (teacherId: string) => {
    if (confirm('Set a mock documentation link for ALL 23 folder files for this teacher?')) {
      const teacherMap = { ...docStatuses };
      if (!teacherMap[teacherId]) {
        teacherMap[teacherId] = {};
      }
      DOCUMENT_KEYS.forEach((k, idx) => {
        teacherMap[teacherId][k] = `https://docs.google.com/document/d/mock-doc-drive-${teacherId}-${idx}/edit`;
      });
      saveDocStatuses(teacherMap);
    }
  };

  // Reset 201 statuses database back to default seed mix
  const handleResetRegistryLogs = () => {
    if (confirm('Reset all 201 folder document items back to standard DepEd Tarlac City compliance baseline files? Custom checklist logs will be overwritten.')) {
      localStorage.removeItem('tcsd_teacher_201_files');
      loadRegistryData();
    }
  };

  // Compute completion progress numbers based on filled link strings
  const teachersWithStats = useMemo(() => {
    return teachers.map((t) => {
      const statuses = docStatuses[t.id] || {};
      let totalCount = 0;
      let submittedCount = 0;
      let pendingCount = 0;

      DOCUMENT_KEYS.forEach((key) => {
        const val = statuses[key] || '';
        totalCount++;
        if (val.trim() !== '') {
          submittedCount++;
        } else {
          pendingCount++;
        }
      });

      const progressPercent = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 100;

      return {
        ...t,
        submittedCount,
        pendingCount,
        naCount: 0,
        progressPercent
      };
    });
  }, [teachers, docStatuses]);

  // Filter and Search calculations
  const filteredRecords = useMemo(() => {
    return teachersWithStats.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        t.teacherName.toLowerCase().includes(q) ||
        t.employeeNo.toLowerCase().includes(q) ||
        (t.position || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterStatus === 'Complete (100%)') {
        return t.progressPercent === 100;
      } else if (filterStatus === 'Incomplete') {
        return t.progressPercent < 100;
      }
      return true;
    });
  }, [teachersWithStats, searchQuery, filterStatus]);

  // SDO aggregate indicators
  const complianceAverages = useMemo(() => {
    if (teachersWithStats.length === 0) return { avg: 0, fullyCompliant: 0, totalMissing: 0 };
    
    let sumProgress = 0;
    let outstandingCompletedCount = 0;
    let missingDocSum = 0;

    teachersWithStats.forEach((t) => {
      sumProgress += t.progressPercent;
      if (t.progressPercent === 100) {
        outstandingCompletedCount++;
      }
      missingDocSum += t.pendingCount;
    });

    return {
      avg: Math.round(sumProgress / teachersWithStats.length),
      fullyCompliant: outstandingCompletedCount,
      totalMissing: missingDocSum
    };
  }, [teachersWithStats]);

  // Export 201 File Ledger to CSV format
  const handleExportCSV = () => {
    const headers = [
      'No.',
      'Employee ID',
      'Teacher Name',
      'Position',
      'Completion Progress',
      ...DOCUMENT_KEYS
    ];

    const rows = filteredRecords.map((t, idx) => {
      const rowStatuses = DOCUMENT_KEYS.map((key) => {
        return docStatuses[t.id]?.[key] || '';
      });

      return [
        idx + 1,
        `"${t.employeeNo}"`,
        `"${t.teacherName}"`,
        `"${t.position}"`,
        `"${t.progressPercent}%"`,
        ...rowStatuses.map(s => `"${s}"`)
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sdo_tarlac_teacher_201_compliance_status_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="teacher-201-container" className="space-y-6">
      
      {/* DepEd Branding Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#002B6D] to-[#1E3A8A] text-white p-6 rounded-3xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-sky-400 text-[#002B6D] text-[9px] font-black rounded uppercase tracking-wider">
              Verification Office
            </span>
            <span className="text-[10px] text-sky-200 font-mono tracking-wider">
              SDO TARLAC CITY • 201 FILE REGISTRY
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2.5">
            <FolderOpen className="w-5.5 h-5.5 text-sky-300 shrink-0" />
            Personnel 201 File Compliance Matrix
          </h2>
          <p className="text-xs text-sky-100 max-w-3xl font-medium">
            Standard 201 directory of essential teacher requirements. Enter document URL links directly into the grid columns to keep tracks of submitted items.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 shrink-0 self-start md:self-center">
          <button
            onClick={handleSyncFromSheets}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-550 hover:bg-sky-600 disabled:bg-sky-700 text-white border border-sky-400 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all outline-none cursor-pointer"
            title="Sync SDO 201 Checklist from SDO Tarlac Sheets"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync SDO Sheets'}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/12 hover:bg-white/18 text-white border border-white/15 rounded-xl text-xs font-bold active:scale-95 transition-all outline-none cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download 201 Report
          </button>
          
          <button
            onClick={handleResetRegistryLogs}
            className="flex items-center justify-center p-2.5 bg-white/5 hover:bg-white/10 text-sky-100 hover:text-white border border-white/5 hover:border-white/10 rounded-xl text-xs font-medium active:scale-95 transition-all outline-none cursor-pointer"
            title="Reset Compliance Checklist Sheets"
          >
            <RotateCcw className="w-4 h-4" />
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

      {/* Overview Analytics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Users className="w-5.5 h-5.5 text-[#002B6D]" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Teacher Files</span>
            <span className="text-lg font-black text-slate-800">{teachersWithStats.length} Inspected Folders</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5.5 h-5.5 text-emerald-650 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Comp. Average</span>
            <span className="text-lg font-black text-slate-800">{complianceAverages.avg}% overall rating</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
            <Sparkles className="w-5.5 h-5.5 text-sky-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-sans">Fully Compliant</span>
            <span className="text-lg font-black text-slate-800">{complianceAverages.fullyCompliant} / {teachersWithStats.length} Files</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
            <Clock className="w-5.5 h-5.5 text-rose-500" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Missing Documents</span>
            <span className="text-lg font-black text-slate-800">{complianceAverages.totalMissing} empty links</span>
          </div>
        </div>
      </div>

      {/* Control Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grow relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search 201 records by teacher name, DepEd employee ID, position assignment..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <ListFilter className="w-3.5 h-3.5" /> Filter Folder:
          </span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {(['All', 'Complete (100%)', 'Incomplete'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all outline-none border-none cursor-pointer ${
                  filterStatus === tab
                    ? 'bg-white text-[#002B6D] shadow-xs'
                    : 'text-slate-550 hover:text-slate-800 hover:bg-slate-50/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tips panel for cell interactions */}
      <div className="bg-blue-50/70 border border-blue-200/80 p-3 rounded-2xl text-[11px] text-blue-800 font-medium flex items-start gap-2 max-w-full">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">201 Document Link Hub Instructions:</p>
          <p className="text-blue-705 font-medium mt-0.5">
            Type or paste standard document links (e.g. Google Drive folders or files) directly inside the grid inputs corresponding to each required document column. Fully saved links will automatically update compliance counts and offer a fast <span className="font-bold">"Go"</span> shortcut button to open the link directly.
          </p>
        </div>
      </div>

      {/* MASTER 201 MATRIX DATAGRID */}
      <div className="bg-white border border-slate-200/85 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/75 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#002B6D]" />
            <h3 className="text-xs font-black text-[#002B6D] uppercase tracking-wider">
              Official 201 File Documentation Archives Log
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-450 font-bold bg-slate-100 px-2.5 py-1 rounded-full">
            {filteredRecords.length} of {teachersWithStats.length} listing files
          </span>
        </div>

        {/* Outer scrolling container supporting No. | Employee ID | Teacher Name | 201 File Link | Actions */}
        <div className="relative group/table grow">
          <div ref={tableContainerRef} className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider select-none">
                {/* 1. No. */}
                <th className="py-3 px-3 text-center w-16 bg-slate-50">
                  No.
                </th>
                {/* 2. Employee ID */}
                <th className="py-3 px-4 w-44 bg-slate-50">
                  Employee ID
                </th>
                {/* 3. Teacher Name */}
                <th className="py-3 px-4 min-w-[240px] bg-slate-50">
                  Teacher Name
                </th>
                {/* 4. 201 File Link */}
                <th className="py-3 px-4 min-w-[360px] bg-slate-50">
                  201 File Link
                </th>
                {/* 5. Actions */}
                <th className="py-3 px-4 text-center w-48 bg-slate-50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold font-sans">
                    No matching 201 verification registries found in SDO Tarlac City database.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((t, idx) => {
                  const stateVal = docStatuses[t.id]?.['201 File Link'] || t.file201Link || docStatuses[t.id]?.['Personal Data Sheet'] || '';
                  
                  return (
                    <tr key={`raw-201-${t.id}`} className="hover:bg-slate-50/60 transition-colors group">
                      
                      {/* 1. No. */}
                      <td className="py-3 px-3 text-center font-bold text-slate-400 bg-white group-hover:bg-slate-50/60">
                        {idx + 1}
                      </td>

                      {/* 2. Employee ID */}
                      <td className="py-3 px-4 font-mono font-black text-[#002B6D] bg-white group-hover:bg-slate-50/60 whitespace-nowrap">
                        {t.employeeNo}
                      </td>

                      {/* 3. Teacher Name */}
                      <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap bg-white group-hover:bg-slate-50/60">
                        <span className="truncate">{t.teacherName}</span>
                      </td>

                      {/* 4. 201 File Link */}
                      <td className="py-3 px-4 bg-white group-hover:bg-slate-50/60">
                        <div className="flex items-center gap-2 w-full max-w-xl">
                          <div className="relative grow">
                            <input
                              type="text"
                              value={stateVal}
                              placeholder="Paste or enter 201 File link (e.g. Google Drive folder)..."
                              onChange={(e) => {
                                const newLink = e.target.value;
                                handleSetDocStatus(t.id, '201 File Link', newLink);
                                setTeachers(prev => {
                                  const updated = prev.map(item => item.id === t.id ? { ...item, file201Link: newLink } : item);
                                  safeSetJSON('tcsd_personnel_records', updated);
                                  return updated;
                                });
                              }}
                              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-mono text-slate-700 placeholder-slate-400 focus:bg-white focus:border-[#002B6D] focus:ring-2 focus:ring-[#002B6D]/15 focus:outline-none transition-all"
                            />
                            <FolderOpen className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          </div>
                          {stateVal && (stateVal.startsWith('http') || stateVal.includes('.')) && (
                            <a
                              href={stateVal.startsWith('http') ? stateVal : `https://${stateVal}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-[#002B6D] text-[#002B6D] hover:text-white rounded-xl transition-all shrink-0 font-bold text-[11px] inline-flex items-center gap-1 border border-blue-200 shadow-xs"
                              title="Open 201 File Link in new window"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Open</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* 5. Actions */}
                      <td className="py-3 px-4 text-center bg-white group-hover:bg-slate-50/60 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedTeacher(t)}
                            className="px-3 py-1.5 bg-[#002B6D]/5 hover:bg-[#002B6D] text-[#002B6D] hover:text-white rounded-xl text-[11px] font-bold active:scale-95 transition-all outline-none inline-flex items-center gap-1.5 border border-[#002B6D]/15"
                            title="Open Checklist Hub to view and verify all 23 documents"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Checklist Hub</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {/* MODAL CHECKLIST SHEET DETAILS HUB */}
      <AnimatePresence>
        {selectedTeacher && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header banner */}
              <div className="px-6 py-4 bg-[#002B6D] text-white flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono font-black text-sky-200 tracking-wider">
                    201 DOCUMENTATION INTEGRITY AUDIT
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-sky-200" />
                    Inspection hub: {selectedTeacher.teacherName} ({selectedTeacher.employeeNo})
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer border-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action summary row details */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Folder Stats:</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-850 font-black text-[10px] uppercase">
                    {selectedTeacher.submittedCount} Filled Links
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-850 font-black text-[10px] uppercase">
                    {selectedTeacher.pendingCount} Empty / Pending
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkAllSubmitted(selectedTeacher.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold active:scale-95 transition-all outline-none border-none cursor-pointer"
                  >
                    Auto Fill Mock Links
                  </button>
                </div>
              </div>

              {/* 23 Document Checklist Scroll View */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DOCUMENT_KEYS.map((docKey, index) => {
                    const currentStatus = docStatuses[selectedTeacher.id]?.[docKey] || '';

                    return (
                      <div 
                        key={`modal-doc-${index}`}
                        className={`p-3 rounded-2xl border transition-all ${
                          currentStatus 
                            ? 'bg-emerald-50/30 border-emerald-150' 
                            : 'bg-slate-100/30 border-slate-150'
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start justify-between">
                            <span className="text-[10px] text-slate-400 font-mono font-bold block">
                              Document No. {index + 1}
                            </span>
                            {currentStatus && (currentStatus.startsWith('http') || currentStatus.includes('.')) && (
                              <a
                                href={currentStatus.startsWith('http') ? currentStatus : `https://${currentStatus}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-extrabold text-[#002B6D] hover:underline inline-flex items-center gap-0.5"
                              >
                                View Link <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-800 leading-tight" title={docKey}>
                            {docKey}
                          </p>
                          <input
                            type="text"
                            placeholder="Enter or paste document URL..."
                            value={currentStatus}
                            onChange={(e) => handleSetDocStatus(selectedTeacher.id, docKey, e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:border-blue-500 focus:outline-none placeholder-slate-400 transition-all"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-150 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold uppercase shrink-0">
                  <Compass className="w-4 h-4 text-slate-400" />
                  SDO Tarlac Internal Verification Desk
                </div>
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="px-4 py-2 bg-[#002B6D] hover:bg-blue-800 text-white font-bold rounded-xl text-xs active:scale-95 transition-all cursor-pointer border-none"
                >
                  Close Inspection
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
