import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  MapPin,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Download,
  X,
  User,
  GraduationCap,
  RefreshCw,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  BarChart2,
  TrendingUp,
  Award,
  ShieldCheck,
  Layers,
  Briefcase,
  Building,
  FileText,
  RotateCcw,
  Activity,
  Info,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { LearningCenter, LearnerRecord } from '../types';
import { exportElementToPdf, printHtmlViaIframe } from '../utils/pdfExport';
import { DEPED_LOGO_BASE64 } from '../assets/deped_logo_base64';
import {
  CLASS_PROGRAM_TEACHERS,
  ClassProgramTeacher,
  ClassProgramRow,
  ClassProgramSyncDiagnostics,
  getDefaultClassProgramForTeacher,
  fetchClassProgramFromApi,
  getAllAssignedCLCsForTeacher,
  getStoredClassProgram,
  saveStoredClassProgram,
  hasClassProgramLocalCache,
  clearClassProgramLocalCache,
  OFFICIAL_CLC_DETAILS_LIST,
  CLC_DETAILS_GID,
  CLC_DETAILS_SHEET_NAME,
  CLC_DETAILS_SHEET_INFO,
  CLCDetailItem,
  OFFICIAL_CLASS_PROGRAM_SHEET_REGISTRY,
  resolveClcDistrict,
  fetchLiveClcDetails,
  ensureMorningSessionAtSecondRow
} from '../utils/classProgramSync';
import { SERVICE_ACCOUNT_EMAIL, hasOfficialSignatories, isFiveSignatorySheet, getDefaultSignatoriesForTeacher, ClassProgramSignaturesData } from '../data/clcDetailsData';
import { ConsolidatedTeachersScheduleView } from './ConsolidatedTeachersScheduleView';
import { MonthlyClassroomInstructionReportCard } from './MonthlyClassroomInstructionReportCard';
import { ALSteinChatbot } from './ALSteinChatbot';

export const OFFICIAL_CLASS_PROGRAM_SHEET_TABS = [
  { name: 'CLC DETAILS (CHECK THIS & UPDATE)', gid: '279279947', type: 'clc_registry', description: 'Master Community Learning Centers Directory (77 CLCs across 10 Districts)' },
  { name: 'Sheet List & GIDs', gid: '1668923940', type: 'metadata', description: 'Master Sheet Names & GID Index' },
  { name: 'MELODY ANNE B. AQUINO', gid: '1375844621', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'MERVIN C. CALDOZA', gid: '93349761', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'ANGELICA G. CANLAS', gid: '1044633394', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'RANIELLE PAOLO D. CAPIENDO', gid: '1950124932', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'RUSSEL M. DIONISIO', gid: '697736841', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'REYNALDO M. DOMINGO JR.', gid: '192199462', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'JENNY I. DUENAS', gid: '1728886317', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'CELESTE R. ESPINOSA', gid: '773441027', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'ANTONIO B. GUBAN', gid: '552317122', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'ARNOLD T. LUMBA', gid: '1437301840', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'JENNILYN D. MARTINEZ', gid: '15867508', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'JUMAR M. MENDOZA', gid: '1564638800', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'RICARDO S. MORALES', gid: '1321334981', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'JULIUS C. PANGILINAN', gid: '521614161', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'MARIELLA A. PORNILLOSA', gid: '1599409372', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'HEIZEL P. PANGILINAN', gid: '953364763', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' },
  { name: 'RAMIL H. VALENTINO', gid: '1371387122', type: 'teacher', description: 'ALS Teacher / Facilitator Timetable' }
];

interface ClassProgramViewProps {
  learningCenters?: LearningCenter[];
  learners?: LearnerRecord[];
}

export function ClassProgramView({ learningCenters = [], learners = [] }: ClassProgramViewProps) {
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>(CLASS_PROGRAM_TEACHERS[0].name);
  const [currentTeacherInfo, setCurrentTeacherInfo] = useState<ClassProgramTeacher>(CLASS_PROGRAM_TEACHERS[0]);
  const isJumarMendoza = currentTeacherInfo.name.trim().toUpperCase() === 'JUMAR M. MENDOZA';
  const [scheduleRows, setScheduleRows] = useState<ClassProgramRow[]>(() => {
    const teacher = CLASS_PROGRAM_TEACHERS[0];
    if (typeof window !== 'undefined') {
      try {
        const sessionRaw = sessionStorage.getItem(`classProgram_sheet_${teacher.name}`);
        if (sessionRaw) {
          const parsed = JSON.parse(sessionRaw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        const cached = getStoredClassProgram(teacher.name);
        if (cached && cached.length > 0) return cached;
      } catch (e) {}
    }
    return getDefaultClassProgramForTeacher(teacher.name);
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFromSheet, setIsFromSheet] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(sessionStorage.getItem(`classProgram_sheet_${CLASS_PROGRAM_TEACHERS[0].name}`));
    }
    return false;
  });
  const [syncSource, setSyncSource] = useState<'live' | 'cached' | 'default'>(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem(`classProgram_sheet_${CLASS_PROGRAM_TEACHERS[0].name}`)) return 'live';
      if (getStoredClassProgram(CLASS_PROGRAM_TEACHERS[0].name)) return 'cached';
    }
    return 'default';
  });
  const [syncDiagnostics, setSyncDiagnostics] = useState<ClassProgramSyncDiagnostics | null>(null);
  const [currentSignatures, setCurrentSignatures] = useState<ClassProgramSignaturesData>(() =>
    getDefaultSignatoriesForTeacher(CLASS_PROGRAM_TEACHERS[0].name)
  );
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'analytics' | 'teachers'>('matrix');

  // Modal & Sheet Config State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<string>('');
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState<string>(() => {
    const raw = localStorage.getItem('classProgramSpreadsheetId');
    if (raw && raw !== '1DJDJRfQzgkl_gtGcCDVv1uuyLGAZC-c9F-tRYI_jFPw' && raw !== '1Z-GsOOh5DV5CSilR7AZFZX_s1K1ktvC7sVVgFcJR3o0') {
      return raw;
    }
    return '1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc';
  });
  const [appsScriptUrlInput, setAppsScriptUrlInput] = useState<string>(() => {
    return localStorage.getItem('classProgramAppsScriptUrl') || '';
  });
  const [copiedServiceAccount, setCopiedServiceAccount] = useState<boolean>(false);
  const [isClcDirectoryModalOpen, setIsClcDirectoryModalOpen] = useState<boolean>(false);
  const [clcSearchQuery, setClcSearchQuery] = useState<string>('');
  const [clcDistrictFilter, setClcDistrictFilter] = useState<string>('ALL');
  const [clcCategoryFilter, setClcCategoryFilter] = useState<string>('ALL');
  const [editingRow, setEditingRow] = useState<ClassProgramRow | null>(null);
  const [formData, setFormData] = useState<Omit<ClassProgramRow, 'id'>>({
    time: '08:00 AM - 09:00 AM',
    minutes: 60,
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: ''
  });

  // Dynamic CLC to District Map sourced from Sheet "CLC DETAILS (CHECK THIS & UPDATE)" (Column E)
  // User-editable Principal's Name state (persisted per teacher in localStorage)
  const [principalNamesByTeacher, setPrincipalNamesByTeacher] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('classProgramPrincipalNames');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  });

  const activePrincipalName = useMemo(() => {
    if (principalNamesByTeacher[selectedTeacherName] !== undefined) {
      return principalNamesByTeacher[selectedTeacherName];
    }
    const sigName = currentSignatures.signatoriesList[2]?.name;
    if (sigName && sigName !== "[Principal's Name]") {
      return sigName;
    }
    return '';
  }, [principalNamesByTeacher, selectedTeacherName, currentSignatures]);

  const handlePrincipalNameChange = (newName: string) => {
    setPrincipalNamesByTeacher(prev => {
      const updated = { ...prev, [selectedTeacherName]: newName };
      try {
        localStorage.setItem('classProgramPrincipalNames', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // User-editable Principal's Designation state (persisted per teacher in localStorage)
  const [principalDesignationsByTeacher, setPrincipalDesignationsByTeacher] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('classProgramPrincipalDesignations');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  });

  const activePrincipalDesignation = useMemo(() => {
    if (principalDesignationsByTeacher[selectedTeacherName] !== undefined) {
      return principalDesignationsByTeacher[selectedTeacherName];
    }
    const sigDesig = currentSignatures.signatoriesList[2]?.designation;
    if (sigDesig && sigDesig !== 'School Principal / School Head' && sigDesig !== "Principals' Designation") {
      return sigDesig;
    }
    return "Principals' Designation";
  }, [principalDesignationsByTeacher, selectedTeacherName, currentSignatures]);

  const handlePrincipalDesignationChange = (newDesig: string) => {
    setPrincipalDesignationsByTeacher(prev => {
      const updated = { ...prev, [selectedTeacherName]: newDesig };
      try {
        localStorage.setItem('classProgramPrincipalDesignations', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const [clcDistrictMap, setClcDistrictMap] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem('classProgramClcDetailsCache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.clcToDistrictMap && Object.keys(parsed.clcToDistrictMap).length > 0) {
          return parsed.clcToDistrictMap;
        }
      }
    } catch (e) {}
    const initialMap: Record<string, string> = {};
    OFFICIAL_CLC_DETAILS_LIST.forEach(item => {
      if (item.clcName && item.district) {
        initialMap[item.clcName.toLowerCase().trim()] = item.district;
      }
    });
    return initialMap;
  });

  // Fetch live CLC details from Sheet "CLC DETAILS (CHECK THIS & UPDATE)" (GID: 279279947) on mount
  useEffect(() => {
    let isMounted = true;
    fetchLiveClcDetails()
      .then(res => {
        if (!isMounted) return;
        if (res.clcToDistrictMap && Object.keys(res.clcToDistrictMap).length > 0) {
          setClcDistrictMap(res.clcToDistrictMap);
        }
      })
      .catch(err => {
        console.warn('[ClassProgramView] Failed to fetch live CLC district mapping:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Analytics Computations for Class Program Workload & Learning Strands
  const analyticsData = useMemo(() => {
    let teachingMins = 0;
    let ancillaryMins = 0;
    let flagMins = 0;
    let lunchMins = 0;

    const strandBreakdown: { [key: string]: { mins: number; color: string; label: string } } = {
      'LS1': { mins: 0, color: 'bg-amber-500', label: 'LS1: Communication Skills (English & Filipino)' },
      'LS2': { mins: 0, color: 'bg-emerald-500', label: 'LS2: Scientific & Critical Thinking Skills' },
      'LS3': { mins: 0, color: 'bg-blue-500', label: 'LS3: Mathematical & Problem Solving Skills' },
      'LS4': { mins: 0, color: 'bg-purple-500', label: 'LS4: Life and Career Skills' },
      'LS5': { mins: 0, color: 'bg-rose-500', label: 'LS5: Understanding Self and Society' },
      'LS6': { mins: 0, color: 'bg-sky-500', label: 'LS6: Digital Citizenship' },
      'Ancillary': { mins: 0, color: 'bg-cyan-500', label: 'Ancillary Tasks & Community Mapping' },
      'Flag': { mins: 0, color: 'bg-indigo-500', label: 'Flag Ceremony & Morning Assembly' },
      'Lunch': { mins: 0, color: 'bg-slate-500', label: 'Daily Lunch Break' },
    };

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

    scheduleRows.forEach(row => {
      const mins = Number(row.minutes) || 0;
      const isHeader = row.isHeaderRow || (!row.time && row.monday.includes('Center'));
      if (isHeader) return;

      const isFlag = row.bgType === 'flag' || row.monday.toLowerCase().includes('hoisting') || row.monday.toLowerCase().includes('flag') || (row.time && row.time.includes('7:00'));
      const isLunch = row.bgType === 'lunch' || row.monday.toLowerCase().includes('lunch break') || (row.time && row.time.includes('12:00'));
      const isAncillary = row.bgType === 'ancillary' || row.monday.toLowerCase().includes('ancillary task') || (row.time && row.time.includes('3:00'));

      if (isFlag) {
        // Monday morning flag ceremony (60 mins)
        const flagDuration = mins || 60;
        flagMins += flagDuration;
        strandBreakdown['Flag'].mins += flagDuration;
      } else if (isLunch) {
        // Lunch break (60 mins across 5 days = 300 mins)
        const lunchDuration = mins || 60;
        lunchMins += lunchDuration * 5;
        strandBreakdown['Lunch'].mins += lunchDuration * 5;
      } else if (isAncillary) {
        // Ancillary tasks (120 mins per day across 5 days = 600 mins)
        const ancDuration = mins || 120;
        days.forEach(day => {
          if (row[day] && row[day].trim()) {
            ancillaryMins += ancDuration;
            strandBreakdown['Ancillary'].mins += ancDuration;
          }
        });
      } else if (mins > 0) {
        // Classroom teaching slots (60 mins per slot)
        days.forEach(day => {
          const content = row[day] ? row[day].toLowerCase().trim() : '';
          if (content) {
            teachingMins += mins;
            if (content.includes('ls1') || content.includes('communication') || content.includes('english') || content.includes('filipino')) {
              strandBreakdown['LS1'].mins += mins;
            } else if (content.includes('ls2') || content.includes('scientific') || content.includes('science')) {
              strandBreakdown['LS2'].mins += mins;
            } else if (content.includes('ls3') || content.includes('math') || content.includes('problem')) {
              strandBreakdown['LS3'].mins += mins;
            } else if (content.includes('ls4') || content.includes('life') || content.includes('career')) {
              strandBreakdown['LS4'].mins += mins;
            } else if (content.includes('ls5') || content.includes('self') || content.includes('society')) {
              strandBreakdown['LS5'].mins += mins;
            } else if (content.includes('ls6') || content.includes('digital') || content.includes('citizenship')) {
              strandBreakdown['LS6'].mins += mins;
            } else {
              strandBreakdown['LS1'].mins += mins;
            }
          }
        });
      }
    });

    const totalWeeklyMins = teachingMins + ancillaryMins + flagMins + lunchMins || 2400;
    const classroomMinsPerDay = Math.round(teachingMins / 5) || 360;
    const ancillaryMinsPerDay = Math.round(ancillaryMins / 5) || 120;

    return {
      teachingMins,
      ancillaryMins,
      flagMins,
      lunchMins,
      totalWeeklyMins,
      classroomMinsPerDay,
      ancillaryMinsPerDay,
      strandBreakdown,
      teachingHrs: (teachingMins / 60).toFixed(1),
      ancillaryHrs: (ancillaryMins / 60).toFixed(1),
      totalHrs: (totalWeeklyMins / 60).toFixed(1),
      isMagnaCartaCompliant: classroomMinsPerDay <= 360 && (classroomMinsPerDay + ancillaryMinsPerDay) <= 480
    };
  }, [scheduleRows]);

  // Rows for print output (includes all 12 rows: teaching slots, flag, lunch, and Row 12 ancillary content)
  const matrixPrintRows = useMemo(() => {
    return ensureMorningSessionAtSecondRow(scheduleRows);
  }, [scheduleRows]);

  // Aggregated Community Learning Centers for the facilitator across all days
  const assignedCLCs = useMemo(() => {
    return getAllAssignedCLCsForTeacher(currentTeacherInfo.name, scheduleRows);
  }, [currentTeacherInfo.name, scheduleRows]);

  // Load teacher info when selection changes
  useEffect(() => {
    const teacher = CLASS_PROGRAM_TEACHERS.find(
      t => t.name.trim().toUpperCase() === selectedTeacherName.trim().toUpperCase()
    ) || CLASS_PROGRAM_TEACHERS[0];
    
    setCurrentTeacherInfo(teacher);

    // Instant switch to selected teacher's session or cached or default rows to prevent stale data display
    let initialRows: ClassProgramRow[] | null = null;
    let fromSheetSession = false;
    try {
      const sessionRaw = sessionStorage.getItem(`classProgram_sheet_${teacher.name}`);
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialRows = parsed;
          fromSheetSession = true;
        }
      }
    } catch (e) {}

    if (!initialRows) {
      initialRows = getStoredClassProgram(teacher.name);
    }

    if (initialRows && initialRows.length > 0) {
      setScheduleRows(ensureMorningSessionAtSecondRow(initialRows));
      setIsFromSheet(fromSheetSession);
      setSyncSource(fromSheetSession ? 'live' : 'cached');
    } else {
      setScheduleRows(ensureMorningSessionAtSecondRow(getDefaultClassProgramForTeacher(teacher.name)));
      setIsFromSheet(false);
      setSyncSource('default');
    }

    setCurrentSignatures(getDefaultSignatoriesForTeacher(teacher.name));

    // Simultaneously fetch live from Google Sheets
    loadScheduleData(teacher, false);
  }, [selectedTeacherName]);

  const loadScheduleData = async (teacher: ClassProgramTeacher, forceFresh = false) => {
    setIsLoading(true);
    setSyncStatusMsg('');
    
    const isJumarRecord = teacher.name.trim().toUpperCase() === 'JUMAR M. MENDOZA';

    console.groupCollapsed(
      `%c[ClassProgramView] 📊 Load Schedule: "${teacher.name}" (GID: ${teacher.gid})`,
      isJumarRecord ? 'color: #002B6D; font-weight: bold; background: #e0f2fe; padding: 2px 6px; border-radius: 4px;' : 'color: #334155;'
    );

    if (isJumarRecord) {
      console.info('%c[ClassProgramView] 🎯 Specifically inspecting JUMAR M. MENDOZA record loading flow', 'color: #002060; font-weight: 800;');
      console.log('[ClassProgramView] Target Facilitator Info:', {
        name: teacher.name,
        gid: teacher.gid,
        clcName: teacher.clcName,
        programLevel: teacher.programLevel,
        forceFresh
      });
    }
    
    const sId = (spreadsheetIdInput && spreadsheetIdInput !== '1DJDJRfQzgkl_gtGcCDVv1uuyLGAZC-c9F-tRYI_jFPw' && spreadsheetIdInput !== '1Z-GsOOh5DV5CSilR7AZFZX_s1K1ktvC7sVVgFcJR3o0') ? spreadsheetIdInput : '1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc';
    const scriptUrl = localStorage.getItem('classProgramAppsScriptUrl') || appsScriptUrlInput;
    console.log(`[ClassProgramView] 🌐 Requesting API fetch for "${teacher.name}" (GID: ${teacher.gid}) on Sheet ID: "${sId}" | Apps Script: "${scriptUrl}"`);
    
    const result = await fetchClassProgramFromApi(teacher.name, teacher.gid, sId, scriptUrl);
    
    console.log(`[ClassProgramView] 📥 Raw API response object for "${teacher.name}":`, result);
    
    if (isJumarRecord) {
      console.group('%c[ClassProgramView] 🔬 Detailed Inspector: JUMAR M. MENDOZA Raw Response Payload', 'color: #047857; font-weight: bold;');
      console.log('Result Success Flag:', result.success);
      console.log('Origin Source:', result.source);
      console.log('isFromSheet:', result.isFromSheet);
      console.log('Diagnostics Metadata:', result.diagnostics);
      console.log('Total Matrix Rows Count:', result.data?.length || 0);
      
      if (result.data && result.data.length > 0) {
        console.log('Raw Matrix Rows Array:', result.data);
        console.table(
          result.data.map((row, index) => ({
            '#': index + 1,
            ID: row.id,
            Time: row.time || '—',
            Mins: row.minutes,
            Monday: row.monday,
            Tuesday: row.tuesday,
            Wednesday: row.wednesday,
            Thursday: row.thursday,
            Friday: row.friday,
            Type: row.bgType || 'default',
            Header: Boolean(row.isHeaderRow)
          }))
        );

        // Verify if any crucial day slot is missing or empty
        const emptyMondayCount = result.data.filter(r => !r.monday || r.monday.trim() === '').length;
        if (emptyMondayCount > 0) {
          console.warn(`[ClassProgramView] ⚠️ JUMAR M. MENDOZA has ${emptyMondayCount} rows with empty Monday slots.`);
        } else {
          console.log('✓ All JUMAR M. MENDOZA matrix rows have valid day slot definitions.');
        }
      } else {
        console.error('❌ JUMAR M. MENDOZA data payload is empty or malformed.');
      }
      console.groupEnd();
    }

    setSyncDiagnostics(result.diagnostics);
    
    if (result.signatures) {
      setCurrentSignatures(result.signatures);
    } else {
      setCurrentSignatures(getDefaultSignatoriesForTeacher(teacher.name));
    }
    
    if (result.success && result.isFromSheet && result.data && result.data.length > 0) {
      setScheduleRows(ensureMorningSessionAtSecondRow(result.data));
      setIsFromSheet(true);
      setSyncSource('live');
      setSyncStatusMsg(`Live Sync active: Google Sheet Tab "${teacher.name}" (GID: ${teacher.gid}, ${result.diagnostics.durationMs}ms)`);
      try {
        sessionStorage.setItem(`classProgram_sheet_${teacher.name}`, JSON.stringify(result.data));
      } catch (e) {}
    } else if (!forceFresh) {
      // Check session cache first
      let loadedFromSession = false;
      try {
        const sessionCached = sessionStorage.getItem(`classProgram_sheet_${teacher.name}`);
        if (sessionCached) {
          const parsed = JSON.parse(sessionCached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setScheduleRows(ensureMorningSessionAtSecondRow(parsed));
            setIsFromSheet(true);
            setSyncSource('live');
            setSyncStatusMsg(`Loaded Google Sheet Matrix for ${teacher.name}`);
            loadedFromSession = true;
          }
        }
      } catch (e) {}

      if (!loadedFromSession) {
        // Offline fallback: check if custom user-edited rows exist in localStorage
        const cached = getStoredClassProgram(teacher.name);
        if (cached && cached.length > 0) {
          console.log(`[ClassProgramView] 📦 Found localStorage fallback cache for "${teacher.name}":`, cached);
          setScheduleRows(ensureMorningSessionAtSecondRow(cached));
          setIsFromSheet(false);
          setSyncSource('cached');
          setSyncStatusMsg(`Loaded local offline edits for ${teacher.name} (${cached.length} rows)`);
        } else {
          const defaults = result.data && result.data.length > 0 ? result.data : getDefaultClassProgramForTeacher(teacher.name);
          setScheduleRows(ensureMorningSessionAtSecondRow(defaults));
          setIsFromSheet(false);
          setSyncSource('default');
          setSyncStatusMsg(result.diagnostics?.error 
            ? `Google Sheet unreachable (${result.diagnostics.error}). Loaded DepEd Official Baseline Schedule.`
            : `Loaded DepEd Official Standard Matrix for ${teacher.name}`);
        }
      }
    } else {
      console.warn(`[ClassProgramView] ⚠️ Fallback triggered for "${teacher.name}". Loading default matrix.`);
      const defaults = getDefaultClassProgramForTeacher(teacher.name);
      setScheduleRows(ensureMorningSessionAtSecondRow(defaults));
      setIsFromSheet(false);
      setSyncSource('default');
      setSyncStatusMsg(`Loaded DepEd Official Schedule Matrix for ${teacher.name}`);
    }
    setIsLoading(false);
    console.groupEnd();
  };

  const handleManualSync = () => {
    clearClassProgramLocalCache(currentTeacherInfo.name);
    loadScheduleData(currentTeacherInfo, true);
    fetchLiveClcDetails().then(res => {
      if (res.clcToDistrictMap && Object.keys(res.clcToDistrictMap).length > 0) {
        setClcDistrictMap(res.clcToDistrictMap);
      }
    }).catch(() => {});
  };

  const handleSyncAllFacilitators = () => {
    clearClassProgramLocalCache();
    loadScheduleData(currentTeacherInfo, true);
    fetchLiveClcDetails().then(res => {
      if (res.clcToDistrictMap && Object.keys(res.clcToDistrictMap).length > 0) {
        setClcDistrictMap(res.clcToDistrictMap);
      }
    }).catch(() => {});
    setSyncStatusMsg('All facilitator local caches purged. Fresh sync completed.');
  };

  const handleTeacherChange = (name: string) => {
    setSelectedTeacherName(name);
  };

  // Save changes to local storage for the current teacher
  const saveRowsLocally = (newRows: ClassProgramRow[]) => {
    setScheduleRows(newRows);
    saveStoredClassProgram(currentTeacherInfo.name, newRows);
    setSyncSource('cached');
  };

  const handleOpenAddModal = () => {
    setEditingRow(null);
    setFormData({
      time: '08:00 AM - 09:00 AM',
      minutes: 60,
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (row: ClassProgramRow) => {
    setEditingRow(row);
    setFormData({
      time: row.time,
      minutes: row.minutes,
      monday: row.monday,
      tuesday: row.tuesday,
      wednesday: row.wednesday,
      thursday: row.thursday,
      friday: row.friday
    });
    setIsModalOpen(true);
  };

  const handleDeleteRow = (id: string) => {
    if (confirm('Are you sure you want to remove this time slot row from the Class Program schedule?')) {
      const updated = scheduleRows.filter(r => r.id !== id);
      saveRowsLocally(updated);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRow) {
      const updated = scheduleRows.map(r => (r.id === editingRow.id ? { ...r, ...formData } : r));
      saveRowsLocally(updated);
    } else {
      const newRow: ClassProgramRow = {
        id: `cp-custom-${Date.now()}`,
        ...formData
      };
      saveRowsLocally([...scheduleRows, newRow]);
    }
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Time', 'Minutes', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', isJumarMendoza ? 'Sunday' : 'Friday'];
    const rows = scheduleRows.map(r => [
      `"${r.time.replace(/"/g, '""')}"`,
      `"${r.minutes}"`,
      `"${r.monday.replace(/"/g, '""')}"`,
      `"${r.tuesday.replace(/"/g, '""')}"`,
      `"${r.wednesday.replace(/"/g, '""')}"`,
      `"${r.thursday.replace(/"/g, '""')}"`,
      `"${r.friday.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Class_Program_${currentTeacherInfo.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (activeSubTab !== 'matrix') {
      setActiveSubTab('matrix');
    }
    setIsPrintModalOpen(true);
  };

  /**
   * Generates the complete official DepEd A4 Landscape Class Program Matrix document HTML
   * strictly formatted with single line spacing, exact column widths, professional header,
   * teacher metadata, Magna Carta footnotes, and 3-column signature block.
   */
  const generateCompleteClassProgramHtml = () => {
    const renderAncillaryCellContent = (text: string) => {
      if (!text || typeof text !== 'string') return '—';
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return '—';
      return lines.map((line, idx) => {
        const isMainTitle = idx === 0 || line.toLowerCase().startsWith('ancillary task');
        const isSectionHeader = line.toLowerCase().startsWith('key responsibilities');
        if (isMainTitle) {
          return `<div style="font-weight: 800; font-size: 5.2pt; color: #002060; line-height: 1.18; margin-bottom: 1.5px; word-break: break-word;">${line}</div>`;
        }
        if (isSectionHeader) {
          return `<div style="font-weight: 800; font-size: 4.6pt; color: #1e3a8a; line-height: 1.12; margin-top: 1px; word-break: break-word;">${line}</div>`;
        }
        return `<div style="font-size: 4.6pt; font-weight: 600; color: #0f172a; line-height: 1.16; margin-top: 0.5px; word-break: break-word;">${line}</div>`;
      }).join('');
    };

    const rowsHtml = matrixPrintRows.map((row) => {
      const isHeader = row.isHeaderRow || (!row.time && row.monday.includes('Center'));
      const isFlag = row.bgType === 'flag' || row.monday.toLowerCase().includes('hoisting') || row.monday.toLowerCase().includes('flag');
      const isLunch = row.bgType === 'lunch' || row.monday.toLowerCase().includes('lunch break');
      const isAncillary = row.bgType === 'ancillary' || row.monday.toLowerCase().includes('ancillary task');

      if (isHeader) {
        const sessionLabel = row.time || (row.id?.includes('afternoon') ? 'Afternoon Session' : 'Morning Session');
        const renderPrintClcCell = (clc: string) => {
          if (!clc || typeof clc !== 'string' || !clc.trim()) return '—';
          const dist = resolveClcDistrict(clc, currentTeacherInfo.name, clcDistrictMap);
          const showDist = Boolean(dist && dist !== 'District');
          return `
            <div style="width: 100%; box-sizing: border-box; text-align: center; padding: 1px 0;">
              <div style="font-family: Arial, sans-serif; font-weight: 700; font-size: 5.8pt; line-height: 1.25; color: #0F172A; text-align: center; word-break: break-word; overflow-wrap: break-word;">${clc}</div>
              ${showDist ? `
                <div style="margin-top: 3px; text-align: center; line-height: 1.3;">
                  <span style="display: inline-block; padding: 1.5px 6px; background-color: #D9E1F2; border: 1px solid #1E3A8A; border-radius: 3px; font-family: Arial, sans-serif; font-size: 5.2pt; font-weight: 800; color: #002060; text-transform: uppercase; letter-spacing: 0.2px; line-height: 1.35; white-space: nowrap; vertical-align: middle; box-sizing: border-box;">District: ${dist}</span>
                </div>
              ` : ''}
            </div>
          `;
        };
        return `
          <tr style="background-color: #EBF5FB !important; color: #0F172A !important; break-inside: avoid; page-break-inside: avoid; height: calc(26px + 0.2cm);">
            <td colspan="2" style="border: 1px solid #1E3A8A; padding: calc(3px + 0.1cm) 2px; text-align: center; font-family: Arial, sans-serif; color: #002060; background-color: #D9E1F2; font-size: 6.6pt; font-weight: 800; vertical-align: middle; line-height: 1.2; text-transform: uppercase; word-break: break-word;">${sessionLabel}</td>
            <td style="border: 1px solid #1E3A8A; padding: calc(4px + 0.1cm) 3px calc(5px + 0.1cm) 3px; text-align: center; background-color: #EBF5FB; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">${renderPrintClcCell(row.monday)}</td>
            <td style="border: 1px solid #1E3A8A; padding: calc(4px + 0.1cm) 3px calc(5px + 0.1cm) 3px; text-align: center; background-color: #EBF5FB; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">${renderPrintClcCell(row.tuesday)}</td>
            <td style="border: 1px solid #1E3A8A; padding: calc(4px + 0.1cm) 3px calc(5px + 0.1cm) 3px; text-align: center; background-color: #EBF5FB; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">${renderPrintClcCell(row.wednesday)}</td>
            <td style="border: 1px solid #1E3A8A; padding: calc(4px + 0.1cm) 3px calc(5px + 0.1cm) 3px; text-align: center; background-color: #EBF5FB; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">${renderPrintClcCell(row.thursday)}</td>
            <td style="border: 1px solid #1E3A8A; padding: calc(4px + 0.1cm) 3px calc(5px + 0.1cm) 3px; text-align: center; background-color: #EBF5FB; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">${renderPrintClcCell(row.friday)}</td>
          </tr>
        `;
      }

      if (isFlag || isLunch) {
        return `
          <tr style="background-color: #2F5597 !important; color: #ffffff !important; break-inside: avoid; page-break-inside: avoid; height: calc(18px + 0.2cm);">
            <td style="border: 1px solid #1E3A8A; padding: calc(4px + 0.1cm) 2px calc(5px + 0.1cm) 2px; font-family: Arial, sans-serif; text-align: center; font-weight: 800; font-size: 6.2pt; letter-spacing: -0.1px; background-color: #2F5597; color: #ffffff; vertical-align: middle; line-height: 1.35; word-break: break-word;">
              <div style="line-height: 1.35; padding: 0.5px 0;">${row.time}</div>
            </td>
            <td colspan="6" style="border: 1px solid #1E3A8A; padding: calc(4px + 0.1cm) 5px calc(5px + 0.1cm) 5px; text-align: center; font-family: Arial, sans-serif; font-style: italic; font-weight: 700; font-size: 6.2pt; letter-spacing: 0.1px; word-break: break-word; overflow-wrap: break-word; background-color: #2F5597; color: #ffffff; vertical-align: middle; line-height: 1.35;">
              <div style="line-height: 1.35; padding: 0.5px 0;">${row.monday}</div>
            </td>
          </tr>
        `;
      }

      if (isAncillary) {
        return `
          <tr style="background-color: #00FFFF !important; color: #000000 !important; break-inside: avoid; page-break-inside: avoid; height: calc(36px + 0.2cm);">
            <td style="border: 1px solid #1E3A8A; padding: calc(3px + 0.1cm) 2px calc(5px + 0.1cm) 2px; font-family: Arial, sans-serif; text-align: center; font-weight: 800; font-size: 6.2pt; letter-spacing: -0.1px; vertical-align: top; background-color: #00FFFF; color: #002060; line-height: 1.25; word-break: break-word;">${row.time}</td>
            <td style="border: 1px solid #1E3A8A; padding: calc(3px + 0.1cm) 2px calc(5px + 0.1cm) 2px; font-family: Arial, sans-serif; text-align: center; font-weight: 800; font-size: 6.2pt; vertical-align: top; background-color: #00FFFF; color: #002060; line-height: 1.25;">${row.minutes}</td>
            <td style="border: 1px solid #1E3A8A; padding: calc(3px + 0.1cm) 3px calc(6px + 0.1cm) 3px; text-align: left; vertical-align: top; font-family: Arial, sans-serif; word-break: break-word; overflow-wrap: break-word; background-color: #00FFFF; color: #000000;">${renderAncillaryCellContent(row.monday)}</td>
            <td style="border: 1px solid #1E3A8A; padding: calc(3px + 0.1cm) 3px calc(6px + 0.1cm) 3px; text-align: left; vertical-align: top; font-family: Arial, sans-serif; word-break: break-word; overflow-wrap: break-word; background-color: #00FFFF; color: #000000;">${renderAncillaryCellContent(row.tuesday || row.monday)}</td>
            <td style="border: 1px solid #1E3A8A; padding: calc(3px + 0.1cm) 3px calc(6px + 0.1cm) 3px; text-align: left; vertical-align: top; font-family: Arial, sans-serif; word-break: break-word; overflow-wrap: break-word; background-color: #00FFFF; color: #000000;">${renderAncillaryCellContent(row.wednesday || row.monday)}</td>
            <td style="border: 1px solid #1E3A8A; padding: calc(3px + 0.1cm) 3px calc(6px + 0.1cm) 3px; text-align: left; vertical-align: top; font-family: Arial, sans-serif; word-break: break-word; overflow-wrap: break-word; background-color: #00FFFF; color: #000000;">${renderAncillaryCellContent(row.thursday || row.monday)}</td>
            <td style="border: 1px solid #1E3A8A; padding: calc(3px + 0.1cm) 3px calc(6px + 0.1cm) 3px; text-align: left; vertical-align: top; font-family: Arial, sans-serif; word-break: break-word; overflow-wrap: break-word; background-color: #00FFFF; color: #000000;">${renderAncillaryCellContent(row.friday || row.monday)}</td>
          </tr>
        `;
      }

      // Default Subject (Yellow #FFFF00, crisp dark text, line-height: 1.25)
      return `
        <tr style="background-color: #FFFF00 !important; color: #000000 !important; break-inside: avoid; page-break-inside: avoid; height: calc(20px + 0.2cm);">
          <td style="border: 1px solid #1E3A8A; padding: calc(3px + 0.1cm) 2px calc(4px + 0.1cm) 2px; font-family: Arial, sans-serif; text-align: center; font-weight: 800; font-size: 6.2pt; letter-spacing: -0.1px; vertical-align: middle; background-color: #FFFF00; color: #002060; line-height: 1.25; word-break: break-word;">
            <div style="line-height: 1.25;">${row.time}</div>
          </td>
          <td style="border: 1px solid #1E3A8A; padding: calc(3px + 0.1cm) 2px calc(4px + 0.1cm) 2px; font-family: Arial, sans-serif; text-align: center; font-weight: 800; font-size: 6.2pt; vertical-align: middle; background-color: #FFFF00; color: #002060; line-height: 1.25;">
            <div style="line-height: 1.25;">${row.minutes || '—'}</div>
          </td>
          <td style="border: 1px solid #1E3A8A; padding: calc(3px + 0.1cm) 3px calc(4px + 0.1cm) 3px; text-align: left; vertical-align: middle; font-family: Arial, sans-serif; word-break: break-word; overflow-wrap: break-word; background-color: #FFFF00; color: #000000;">
            <div style="font-size: 5.8pt; font-weight: 700; line-height: 1.25; color: #000000; word-break: break-word;">${row.monday || '—'}</div>
          </td>
          <td style="border: 1px solid #1E3A8A; padding: calc(3px + 0.1cm) 3px calc(4px + 0.1cm) 3px; text-align: left; vertical-align: middle; font-family: Arial, sans-serif; word-break: break-word; overflow-wrap: break-word; background-color: #FFFF00; color: #000000;">
            <div style="font-size: 5.8pt; font-weight: 700; line-height: 1.25; color: #000000; word-break: break-word;">${row.tuesday || row.monday || '—'}</div>
          </td>
          <td style="border: 1px solid #1E3A8A; padding: calc(3px + 0.1cm) 3px calc(4px + 0.1cm) 3px; text-align: left; vertical-align: middle; font-family: Arial, sans-serif; word-break: break-word; overflow-wrap: break-word; background-color: #FFFF00; color: #000000;">
            <div style="font-size: 5.8pt; font-weight: 700; line-height: 1.25; color: #000000; word-break: break-word;">${row.wednesday || row.monday || '—'}</div>
          </td>
          <td style="border: 1px solid #1E3A8A; padding: calc(3px + 0.1cm) 3px calc(4px + 0.1cm) 3px; text-align: left; vertical-align: middle; font-family: Arial, sans-serif; word-break: break-word; overflow-wrap: break-word; background-color: #FFFF00; color: #000000;">
            <div style="font-size: 5.8pt; font-weight: 700; line-height: 1.25; color: #000000; word-break: break-word;">${row.thursday || row.monday || '—'}</div>
          </td>
          <td style="border: 1px solid #1E3A8A; padding: calc(3px + 0.1cm) 3px calc(4px + 0.1cm) 3px; text-align: left; vertical-align: middle; font-family: Arial, sans-serif; word-break: break-word; overflow-wrap: break-word; background-color: #FFFF00; color: #000000;">
            <div style="font-size: 5.8pt; font-weight: 700; line-height: 1.25; color: #000000; word-break: break-word;">${row.friday || row.monday || '—'}</div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div style="width: 100%; box-sizing: border-box; background: #ffffff; padding: 0px 4px 6px 4px; margin: 0; font-family: Arial, 'Segoe UI', sans-serif; color: #0f172a;">
        <!-- Official DepEd 7-Line Header with Logo Alongside -->
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; margin-bottom: 3px; line-height: 1.1;">
          <!-- Left-Aligned Logo Alongside Header -->
          <div style="flex: 0 0 60px; display: flex; align-items: center; justify-content: flex-start; padding-left: 2px;">
            <img src="${DEPED_LOGO_BASE64}" alt="DepEd Logo" style="height: 44px; width: 44px; object-fit: contain;" />
          </div>

          <!-- Centered Institutional Heading -->
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 6pt; font-family: 'Times New Roman', Times, serif; text-transform: uppercase; color: #334155; letter-spacing: 0.5px; line-height: 1.1;">Republic of the Philippines</div>
            <div style="font-size: 7.8pt; font-family: 'Times New Roman', Times, serif; font-weight: bold; text-transform: uppercase; color: #0f172a; line-height: 1.1;">Department of Education</div>
            <div style="font-size: 6pt; font-family: 'Times New Roman', Times, serif; text-transform: uppercase; color: #334155; line-height: 1.1;">Region III – Central Luzon</div>
            <div style="font-size: 6.8pt; font-family: 'Times New Roman', Times, serif; font-weight: bold; text-transform: uppercase; color: #0f172a; line-height: 1.1;">TARLAC CITY SCHOOLS DIVISION</div>
            <div style="font-size: 6.8pt; font-family: 'Times New Roman', Times, serif; font-weight: bold; text-transform: uppercase; color: #002060; letter-spacing: 0.4px; line-height: 1.1;">Alternative Learning System</div>
            <div style="font-size: 8.8pt; font-weight: 900; text-transform: uppercase; color: #002060; letter-spacing: 1px; margin-top: 1px; line-height: 1.1;">CLASS PROGRAM</div>
            <div style="font-size: 7pt; font-weight: 900; text-transform: uppercase; color: #1E3A8A; letter-spacing: 0.6px; margin-top: 1px; line-height: 1.1;">WEEKLY SCHEDULE TIMETABLE MATRIX</div>
            <div style="font-size: 6pt; font-style: italic; color: #475569; line-height: 1.1;">School Year 2026–2027</div>
          </div>

          <!-- Symmetrical Spacer to keep Center Alignment Perfectly Balanced -->
          <div style="flex: 0 0 60px;"></div>
        </div>

        <!-- Facilitator, Program Level & Assigned CLC Single Consolidated Metadata Container -->
        <div style="width: 100%; border: 1px solid #1E3A8A; background-color: #F8FAFC; border-radius: 3px; padding: 2px 4px; margin-bottom: 2px; box-sizing: border-box; display: flex; align-items: stretch;">
          <!-- Section 1: Name of Facilitator -->
          <div style="flex: 0 0 25%; border-right: 1px solid #CBD5E1; padding-right: 5px; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 5pt; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.05;">Name of Facilitator</div>
            <div style="font-size: 6.2pt; font-weight: 900; color: #002060; text-transform: uppercase; line-height: 1.1; margin-top: 1px; word-break: break-word;">${currentTeacherInfo.name}</div>
          </div>

          <!-- Section 2: Program Level -->
          <div style="flex: 0 0 33%; border-right: 1px solid #CBD5E1; padding-left: 5px; padding-right: 5px; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 5pt; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.05;">Program Level</div>
            <div style="font-size: 5.6pt; font-weight: 800; color: #002060; line-height: 1.1; margin-top: 1px; word-break: break-word;">Basic Literacy Program, A&E Elementary & A&E Junior High School</div>
          </div>

          <!-- Section 3: Assigned CLC / Venue -->
          <div style="flex: 1 1 auto; padding-left: 5px; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 5pt; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.05;">Assigned CLC / Venue</div>
            <div style="font-size: 5.6pt; font-weight: 800; color: #002060; line-height: 1.1; margin-top: 1px; word-break: break-word;">${assignedCLCs.join(' • ')}</div>
          </div>
        </div>

        <!-- Main Timetable Matrix Table -->
        <div style="width: 100%; border: 1.5px solid #002060; border-radius: 2px; box-sizing: border-box;">
          <table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-family: Arial, 'Segoe UI', sans-serif; font-size: 6.6pt; line-height: 1.2;">
            <thead>
              <tr style="background-color: #002060 !important; color: #ffffff !important; height: calc(18px + 0.2cm);">
                <th style="width: 11.5%; background-color: #002060; color: #ffffff; font-weight: 800; text-align: center; text-transform: uppercase; font-size: 6.6pt; letter-spacing: 0.2px; padding: calc(2.5px + 0.1cm) 2px; border: 1px solid #1E3A8A; vertical-align: middle; line-height: 1.15;">TIME</th>
                <th style="width: 5.5%; background-color: #002060; color: #ffffff; font-weight: 800; text-align: center; text-transform: uppercase; font-size: 6.6pt; letter-spacing: 0.2px; padding: calc(2.5px + 0.1cm) 2px; border: 1px solid #1E3A8A; vertical-align: middle; line-height: 1.15;">MINS</th>
                <th style="width: 16.6%; background-color: #002060; color: #ffffff; font-weight: 800; text-align: center; text-transform: uppercase; font-size: 6.6pt; letter-spacing: 0.2px; padding: calc(2.5px + 0.1cm) 3px; border: 1px solid #1E3A8A; vertical-align: middle; line-height: 1.15;">MONDAY</th>
                <th style="width: 16.6%; background-color: #002060; color: #ffffff; font-weight: 800; text-align: center; text-transform: uppercase; font-size: 6.6pt; letter-spacing: 0.2px; padding: calc(2.5px + 0.1cm) 3px; border: 1px solid #1E3A8A; vertical-align: middle; line-height: 1.15;">TUESDAY</th>
                <th style="width: 16.6%; background-color: #002060; color: #ffffff; font-weight: 800; text-align: center; text-transform: uppercase; font-size: 6.6pt; letter-spacing: 0.2px; padding: calc(2.5px + 0.1cm) 3px; border: 1px solid #1E3A8A; vertical-align: middle; line-height: 1.15;">WEDNESDAY</th>
                <th style="width: 16.6%; background-color: #002060; color: #ffffff; font-weight: 800; text-align: center; text-transform: uppercase; font-size: 6.6pt; letter-spacing: 0.2px; padding: calc(2.5px + 0.1cm) 3px; border: 1px solid #1E3A8A; vertical-align: middle; line-height: 1.15;">THURSDAY</th>
                <th style="width: 16.6%; background-color: #002060; color: #ffffff; font-weight: 800; text-align: center; text-transform: uppercase; font-size: 6.6pt; letter-spacing: 0.2px; padding: calc(2.5px + 0.1cm) 3px; border: 1px solid #1E3A8A; vertical-align: middle; line-height: 1.15;">${isJumarMendoza ? 'SUNDAY' : 'FRIDAY'}</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <!-- DepEd Workload & Magna Carta Footnotes -->
        <div style="margin-top: 2px; padding: 1px 4px; font-size: 5.2pt; font-weight: bold; color: #1e293b; border-top: 1px solid #94a3b8; line-height: 1.15; word-break: break-word;">
          <div>Actual Classroom Teaching : 6 hours (360 minutes) per day (Magna Carta for Public School Teachers) &nbsp;&nbsp;|&nbsp;&nbsp; Ancillary Tasks (Teaching-Related Work) : 2 hours (120 minutes) per day. (DepEd Order No. 005, s. 2024)</div>
          <div style="margin-top: 1px; font-weight: 800; color: #002060;">
            Total : 8 hours of service per day (or a 480-minute workday)${isJumarMendoza ? ' <span style="color: #475569; font-weight: bold; margin-left: 4px;">Note: The Friday schedule has been rescheduled to Sunday to accommodate learners who are employed or currently working.</span>' : ''}
          </div>
        </div>

        <!-- Official Signatures Block (Included on Print Output) -->
        ${isFiveSignatorySheet(currentTeacherInfo.name) ? `
          <div style="margin-top: 3px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center; font-size: 6pt; line-height: 1.15; page-break-inside: avoid !important; break-inside: avoid !important;">
            <!-- Row 1, Col 1: Prepared by -->
            <div>
              <div style="font-size: 5.2pt; color: #475569; margin-bottom: 2px;">${currentSignatures.signatoriesList[0]?.roleLabel || 'Prepared by:'}</div>
              <div style="border-bottom: 1.2px solid #000000; padding-bottom: 1px; font-weight: 900; text-transform: uppercase; font-size: 6.2pt; word-break: break-word;">${currentSignatures.signatoriesList[0]?.name || currentTeacherInfo.name}</div>
              <div style="font-size: 5.2pt; color: #334155; margin-top: 1px; word-break: break-word;">${currentSignatures.signatoriesList[0]?.designation || 'ALS Teacher'}</div>
            </div>

            <!-- Row 1, Col 2: Checked by -->
            <div>
              <div style="font-size: 5.2pt; color: #475569; margin-bottom: 2px;">${currentSignatures.signatoriesList[1]?.roleLabel || 'Checked by:'}</div>
              <div style="border-bottom: 1.2px solid #000000; padding-bottom: 1px; font-weight: 900; text-transform: uppercase; font-size: 6.2pt; word-break: break-word;">${currentSignatures.signatoriesList[1]?.name || 'ELMER V. FABROS / ANGELO G. MANDAP'}</div>
              <div style="font-size: 5.2pt; color: #334155; margin-top: 1px; word-break: break-word;">${currentSignatures.signatoriesList[1]?.designation || 'Education Program Specialist (EPS)'}</div>
            </div>

            <!-- Row 1, Col 3: Reviewed by (Principal's Name & Principals' Designation) -->
            <div>
              <div style="font-size: 5.2pt; color: #475569; margin-bottom: 2px;">${currentSignatures.signatoriesList[2]?.roleLabel || 'Reviewed by:'}</div>
              <div style="border-bottom: 1.2px solid #000000; padding-bottom: 1px; font-weight: 900; text-transform: uppercase; font-size: 6.2pt; word-break: break-word;">${activePrincipalName.trim() || currentSignatures.signatoriesList[2]?.name || "[Principal's Name]"}</div>
              <div style="font-size: 5.2pt; color: #334155; margin-top: 1px; word-break: break-word;">${activePrincipalDesignation.trim() || currentSignatures.signatoriesList[2]?.designation || "Principals' Designation"}</div>
            </div>

            <!-- Row 2, Col 1: Approved (Below ALS Teacher) -->
            <div style="margin-top: 2px;">
              <div style="font-size: 5.2pt; color: #475569; margin-bottom: 2px;">${currentSignatures.signatoriesList[3]?.roleLabel || 'Approved:'}</div>
              <div style="border-bottom: 1.2px solid #000000; padding-bottom: 1px; font-weight: 900; text-transform: uppercase; font-size: 6.2pt; word-break: break-word;">${currentSignatures.signatoriesList[3]?.name || 'RENE B. MICLAT, PhD'}</div>
              <div style="font-size: 5.2pt; color: #334155; margin-top: 1px; word-break: break-word;">${currentSignatures.signatoriesList[3]?.designation || 'PSDS / Division ALS Focal Person'}</div>
            </div>

            <!-- Row 2, Col 2: Empty Spacer -->
            <div></div>

            <!-- Row 2, Col 3: Endorsed (Below School Principal) -->
            <div style="margin-top: 2px;">
              <div style="font-size: 5.2pt; color: #475569; margin-bottom: 2px;">${currentSignatures.signatoriesList[4]?.roleLabel || 'Endorsed:'}</div>
              <div style="border-bottom: 1.2px solid #000000; padding-bottom: 1px; font-weight: 900; text-transform: uppercase; font-size: 6.2pt; word-break: break-word;">${currentSignatures.signatoriesList[4]?.name || 'ROBERT E. OSONGCO, EdD'}</div>
              <div style="font-size: 5.2pt; color: #334155; margin-top: 1px; word-break: break-word;">${currentSignatures.signatoriesList[4]?.designation || 'Chief Education Supervisor, CID'}</div>
            </div>
          </div>
        ` : `
          <div style="margin-top: 3px; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; text-align: center; font-size: 6pt; line-height: 1.15; page-break-inside: avoid !important; break-inside: avoid !important;">
            <div>
              <div style="font-size: 5.2pt; color: #475569; margin-bottom: 2px;">${currentSignatures.signatoriesList[0]?.roleLabel || 'Prepared by:'}</div>
              <div style="border-bottom: 1.2px solid #000000; padding-bottom: 1px; font-weight: 900; text-transform: uppercase; font-size: 6.2pt; word-break: break-word;">${currentSignatures.signatoriesList[0]?.name || currentTeacherInfo.name}</div>
              <div style="font-size: 5.2pt; color: #334155; margin-top: 1px; word-break: break-word;">${currentSignatures.signatoriesList[0]?.designation || 'ALS Teacher'}</div>
            </div>

            <div>
              <div style="font-size: 5.2pt; color: #475569; margin-bottom: 2px;">${currentSignatures.signatoriesList[1]?.roleLabel || 'Checked by:'}</div>
              <div style="border-bottom: 1.2px solid #000000; padding-bottom: 1px; font-weight: 900; text-transform: uppercase; font-size: 6.2pt; word-break: break-word;">${currentSignatures.signatoriesList[1]?.name || 'ELMER V. FABROS / ANGELO G. MANDAP'}</div>
              <div style="font-size: 5.2pt; color: #334155; margin-top: 1px; word-break: break-word;">${currentSignatures.signatoriesList[1]?.designation || 'Education Program Specialist II'}</div>
            </div>

            <div>
              <div style="font-size: 5.2pt; color: #475569; margin-bottom: 2px;">${currentSignatures.signatoriesList[2]?.roleLabel || 'Approved:'}</div>
              <div style="border-bottom: 1.2px solid #000000; padding-bottom: 1px; font-weight: 900; text-transform: uppercase; font-size: 6.2pt; word-break: break-word;">${currentSignatures.signatoriesList[2]?.name || 'RENE B. MICLAT, PhD'}</div>
              <div style="font-size: 5.2pt; color: #334155; margin-top: 1px; word-break: break-word;">${currentSignatures.signatoriesList[2]?.designation || 'PSDS / Division ALS Focal Person'}</div>
            </div>

            <div>
              <div style="font-size: 5.2pt; color: #475569; margin-bottom: 2px;">${currentSignatures.signatoriesList[3]?.roleLabel || 'Endorsed:'}</div>
              <div style="border-bottom: 1.2px solid #000000; padding-bottom: 1px; font-weight: 900; text-transform: uppercase; font-size: 6.2pt; word-break: break-word;">${currentSignatures.signatoriesList[3]?.name || 'ROBERT E. OSONGCO, EdD'}</div>
              <div style="font-size: 5.2pt; color: #334155; margin-top: 1px; word-break: break-word;">${currentSignatures.signatoriesList[3]?.designation || 'Chief Education Supervisor, CID'}</div>
            </div>
          </div>
        `}
      </div>
    `;
  };

  const handleSaveAsPdf = async () => {
    setIsGeneratingPdf(true);
    let tempContainer: HTMLElement | null = null;
    try {
      // Build dedicated full-width A4 Landscape DOM export container at (0, 0) underneath UI
      // using exact 1080px printable width with zero outer padding to prevent page overflow
      tempContainer = document.createElement('div');
      tempContainer.id = 'temp-class-program-matrix-export';
      tempContainer.style.width = '1080px';
      tempContainer.style.maxWidth = '1080px';
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '0';
      tempContainer.style.top = '0';
      tempContainer.style.zIndex = '-99999';
      tempContainer.style.opacity = '1';
      tempContainer.style.visibility = 'visible';
      tempContainer.style.pointerEvents = 'none';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.padding = '0';
      tempContainer.style.margin = '0';
      tempContainer.style.boxSizing = 'border-box';
      tempContainer.innerHTML = generateCompleteClassProgramHtml();
      document.body.appendChild(tempContainer);

      const cleanTeacherName = (currentTeacherInfo.name || 'ALS_Teacher').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Official_Class_Program_Weekly_Schedule_Matrix_${cleanTeacherName}.pdf`;

      const success = await exportElementToPdf({
        element: tempContainer,
        filename,
        orientation: 'landscape',
        format: 'a4',
        margin: [3, 5, 4, 5], // 3mm top margin for crisp top alignment
        valign: 'top',
        scale: 2.0,
        selfContained: true
      });

      if (!success) {
        handleExecutePrint();
      }
    } catch (err) {
      console.error('PDF export failed, falling back to standard print:', err);
      handleExecutePrint();
    } finally {
      if (tempContainer && document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      setIsGeneratingPdf(false);
    }
  };

  const handleExecutePrint = () => {
    // Isolated iframe print avoids popup blockers and does not alter parent page layout
    const printableContent = generateCompleteClassProgramHtml();
    printHtmlViaIframe(
      printableContent,
      `Class Program Schedule Matrix - ${currentTeacherInfo.name}`,
      'landscape'
    );
  };

  const filteredRows = useMemo(() => {
    const isJumar = currentTeacherInfo.name.trim().toUpperCase() === 'JUMAR M. MENDOZA';
    const orderedRows = ensureMorningSessionAtSecondRow(scheduleRows);
    const result = orderedRows.filter((r, idx) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const match = (
        (r.time || '').toLowerCase().includes(q) ||
        String(r.minutes || '').toLowerCase().includes(q) ||
        (r.monday || '').toLowerCase().includes(q) ||
        (r.tuesday || '').toLowerCase().includes(q) ||
        (r.wednesday || '').toLowerCase().includes(q) ||
        (r.thursday || '').toLowerCase().includes(q) ||
        (r.friday || '').toLowerCase().includes(q)
      );
      if (isJumar && !match) {
        console.log(`[ClassProgramView] 🔍 Row #${idx + 1} filtered out by search query "${searchQuery}":`, r);
      }
      return match;
    });

    if (isJumar && scheduleRows.length > 0) {
      console.log(`[ClassProgramView] 📋 JUMAR M. MENDOZA Iteration: ${scheduleRows.length} matrix rows -> ${result.length} displayed.`);
    }

    return result;
  }, [scheduleRows, searchQuery, currentTeacherInfo.name]);

  const totalMinutes = scheduleRows.reduce((acc, curr) => acc + (Number(curr.minutes) || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  /**
   * Renders the Learning Center name and a dedicated badge container displaying its official District
   * sourced from Sheet "CLC DETAILS (CHECK THIS & UPDATE)" Column E.
   */
  const renderLearningCenterHeaderCell = (clcName: string, dayKey: string) => {
    if (!clcName || typeof clcName !== 'string' || !clcName.trim()) {
      return <span className="text-slate-400 font-mono text-[10px] italic">—</span>;
    }

    const district = resolveClcDistrict(clcName, currentTeacherInfo.name, clcDistrictMap);
    const hasDistrict = Boolean(district && district !== 'District');

    return (
      <div className="flex flex-col items-center justify-center gap-1.5 py-1 px-1">
        <span className="font-extrabold text-slate-900 text-[11px] leading-tight text-center">
          {clcName}
        </span>
        {hasDistrict && (
          <div
            id={`matrix-clc-district-${dayKey}-${clcName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            className="inline-flex items-center gap-1.5 px-3 py-1 mt-0.5 rounded-md bg-white border border-blue-200 text-[#002B6D] text-[9.5px] font-black tracking-wide shadow-2xs hover:border-blue-300 transition-colors whitespace-nowrap"
            title={`District for ${clcName}: ${district} (Sheet: CLC DETAILS, Col E)`}
          >
            <MapPin className="w-2.5 h-2.5 text-blue-600 shrink-0" />
            <span className="text-slate-500 font-bold text-[8.5px] uppercase tracking-wider">District:</span>
            <span className="font-black text-[#002B6D]">{district}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden Print Container that is activated when window.print() or Ctrl+P is triggered */}
      <div className="hidden print:block class-program-print-container">
        <div dangerouslySetInnerHTML={{ __html: generateCompleteClassProgramHtml() }} />
      </div>

      {/* View Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-600" /> SY 2026–2027
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#002B6D] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3 text-[#002B6D]" />
              Google Sheet "Class Program" Sync
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> GID: {currentTeacherInfo.gid}
            </span>
            {syncSource === 'live' ? (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Google Sheet ({syncDiagnostics?.durationMs || 0}ms)
              </span>
            ) : syncSource === 'cached' ? (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Local Browser Edits (Unsynced)
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-500" /> DepEd Standard Baseline
              </span>
            )}
            <button
              onClick={() => setIsDiagnosticsModalOpen(true)}
              className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#002B6D] bg-slate-100 hover:bg-slate-200 px-2.5 py-0.5 rounded-full border border-slate-300 flex items-center gap-1 cursor-pointer transition"
              title="View Sync Logs & Technical Diagnostics"
            >
              <Activity className="w-3 h-3 text-[#002B6D]" /> Diagnostics
            </button>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#002B6D]" />
            Class Program Schedule Matrix
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-3xl">
            Official DepEd ALS weekly timetable matrix displaying schedule time slots, session duration in minutes, and learning strand subject allocations across Monday through {isJumarMendoza ? 'Sunday' : 'Friday'}.
          </p>
          {syncStatusMsg && (
            <p className="text-[11px] font-semibold text-blue-700 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-blue-600 shrink-0" />
              {syncStatusMsg}
            </p>
          )}
        </div>
      </div>

      {/* Teacher Selector Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#002B6D]" />
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Select ALS Teacher / Facilitator</span>
              <h3 className="text-base font-black text-slate-900">{currentTeacherInfo.name}</h3>
            </div>
          </div>

          {/* Dropdown Selector for 17 Teachers */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sheet Name:</span>
            <select
              value={selectedTeacherName}
              onChange={e => handleTeacherChange(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-extrabold text-[#002B6D] focus:outline-hidden focus:ring-2 focus:ring-[#002B6D]/20 cursor-pointer max-w-xs"
            >
              {CLASS_PROGRAM_TEACHERS.map(t => (
                <option key={t.gid} value={t.name}>
                  {t.name} (GID: {t.gid})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Tabs for Top Teachers */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CLASS_PROGRAM_TEACHERS.map(t => {
            const isSelected = t.name === selectedTeacherName;
            return (
              <button
                key={t.gid}
                onClick={() => handleTeacherChange(t.name)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-[#002B6D] text-white border-[#002B6D] shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.name.split(' ')[0]} {t.name.split(' ').pop()}
              </button>
            );
          })}
        </div>
      </div>

      {/* View Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 print:hidden overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'matrix'
              ? 'bg-[#002B6D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Schedule Matrix Table
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'analytics'
              ? 'bg-[#002B6D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Class Program Workload Analytics
        </button>

        <button
          onClick={() => setActiveSubTab('teachers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'teachers'
              ? 'bg-[#002B6D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <Users className="w-4 h-4" />
          Weekly Master Schedule Consolidation ({CLASS_PROGRAM_TEACHERS.length} Facilitators)
        </button>
      </div>

      {/* Sub-Tab 1: Schedule Matrix Table */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4 print:hidden">
          {/* Action Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search strand, subject, time, or activity..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Timetable Matrix Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Clock className="w-4 h-4 text-[#002B6D]" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Weekly Schedule Timetable Matrix
                </h4>
                <span className="text-[10px] font-bold text-[#002B6D] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  SY 2026–2027
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {filteredRows.length} Slots
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#FFFF00] border border-amber-300"></span> Learning Strands</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#2F5597]"></span> Flag / Lunch</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#00FFFF] border border-cyan-400"></span> Ancillary</span>
                </div>
                <div className="flex items-center gap-1.5 print:hidden">
                  <button
                    type="button"
                    onClick={handleSaveAsPdf}
                    disabled={isGeneratingPdf}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                    title="Export Weekly Schedule Timetable Matrix as PDF"
                  >
                    <Download className="w-3 h-3" /> {isGeneratingPdf ? 'Saving PDF...' : 'Download PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-2.5 py-1.5 bg-[#002B6D] hover:bg-[#001D4A] text-white rounded-lg text-[11px] font-black transition flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Preview & Print Matrix (A4 Landscape)"
                  >
                    <Printer className="w-3 h-3" /> Print Matrix
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-300 table-fixed text-[11px]">
                <thead>
                  <tr className="bg-[#002060] text-white font-extrabold uppercase tracking-wider divide-x divide-blue-900">
                    <th className="py-2.5 px-3 text-center w-[130px] font-mono">Time</th>
                    <th className="py-2.5 px-2 text-center w-[75px] font-mono">Minutes</th>
                    <th className="py-2.5 px-3 text-center">Monday</th>
                    <th className="py-2.5 px-3 text-center">Tuesday</th>
                    <th className="py-2.5 px-3 text-center">Wednesday</th>
                    <th className="py-2.5 px-3 text-center">Thursday</th>
                    <th className="py-2.5 px-3 text-center">{isJumarMendoza ? 'Sunday' : 'Friday'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 border-t border-slate-300">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <p className="font-bold text-sm">No schedule rows found.</p>
                        <p className="text-xs mt-1">Click "Sync Sheet" above to load data from Google Sheets.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => {
                      const mondayStr = (row.monday || '').toLowerCase();
                      const isHeader = row.isHeaderRow || (!row.time && (row.monday || '').includes('Center'));
                      const isFlag = row.bgType === 'flag' || mondayStr.includes('hoisting') || mondayStr.includes('flag');
                      const isLunch = row.bgType === 'lunch' || mondayStr.includes('lunch break');
                      const isAncillary = row.bgType === 'ancillary' || mondayStr.includes('ancillary task');

                      if (isHeader) {
                        const sessionLabel = row.time || (idx === 0 || row.id?.includes('morning') ? 'Morning Session' : 'Afternoon Session');
                        return (
                          <tr key={row.id || idx} className="bg-sky-50 font-black text-slate-900 border-b border-slate-300 divide-x divide-slate-200">
                            <td colSpan={2} className="py-2.5 px-3 text-center font-extrabold text-blue-950 font-mono text-[11px] uppercase bg-blue-100/70 border-r border-blue-200">
                              {sessionLabel}
                            </td>
                            <td className="py-2 px-2 text-center bg-sky-50 align-middle">{renderLearningCenterHeaderCell(row.monday, 'monday')}</td>
                            <td className="py-2 px-2 text-center bg-sky-50 align-middle">{renderLearningCenterHeaderCell(row.tuesday, 'tuesday')}</td>
                            <td className="py-2 px-2 text-center bg-sky-50 align-middle">{renderLearningCenterHeaderCell(row.wednesday, 'wednesday')}</td>
                            <td className="py-2 px-2 text-center bg-sky-50 align-middle">{renderLearningCenterHeaderCell(row.thursday, 'thursday')}</td>
                            <td className="py-2 px-2 text-center bg-sky-50 align-middle">{renderLearningCenterHeaderCell(row.friday, 'friday')}</td>
                          </tr>
                        );
                      }

                      if (isFlag || isLunch) {
                        return (
                          <tr key={row.id || idx} className="bg-[#2F5597] text-white border-b border-slate-300 divide-x divide-blue-800">
                            <td className="py-2.5 px-3 text-center font-extrabold whitespace-nowrap font-mono text-[11px]">
                              {row.time}
                            </td>
                            <td colSpan={6} className="py-2.5 px-4 text-center italic font-bold text-[11.5px] leading-tight bg-[#2F5597]">
                              {row.monday}
                            </td>
                          </tr>
                        );
                      }

                      if (isAncillary) {
                        return (
                          <tr key={row.id || idx} className="bg-[#CCFFFF]/85 hover:bg-[#CCFFFF] text-slate-900 font-medium border-b border-slate-300 divide-x divide-cyan-300">
                            <td className="py-2.5 px-3 text-center font-black whitespace-nowrap font-mono text-[11px] align-middle">
                              {row.time}
                            </td>
                            <td className="py-2.5 px-2 text-center font-black font-mono text-[11px] align-middle">
                              {row.minutes}
                            </td>
                            <td className="py-2.5 px-3 text-left font-bold text-[8pt] leading-tight whitespace-pre-line align-top">{row.monday}</td>
                            <td className="py-2.5 px-3 text-left font-bold text-[8pt] leading-tight whitespace-pre-line align-top">{row.tuesday}</td>
                            <td className="py-2.5 px-3 text-left font-bold text-[8pt] leading-tight whitespace-pre-line align-top">{row.wednesday}</td>
                            <td className="py-2.5 px-3 text-left font-bold text-[8pt] leading-tight whitespace-pre-line align-top">{row.thursday}</td>
                            <td className="py-2.5 px-3 text-left font-bold text-[8pt] leading-tight whitespace-pre-line align-top">{row.friday}</td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={row.id || idx} className="bg-[#FFFF00]/90 hover:bg-[#FFFF00] text-slate-950 font-medium border-b border-slate-300 divide-x divide-yellow-400">
                          <td className="py-2.5 px-3 text-center font-extrabold whitespace-nowrap font-mono text-[11px] align-middle">
                            {row.time}
                          </td>
                          <td className="py-2.5 px-2 text-center font-black font-mono text-[11px] align-middle">
                            {row.minutes}
                          </td>
                          <td className="py-2.5 px-3 text-left font-bold text-[11px] leading-tight align-middle">{row.monday}</td>
                          <td className="py-2.5 px-3 text-left font-bold text-[11px] leading-tight align-middle">{row.tuesday}</td>
                          <td className="py-2.5 px-3 text-left font-bold text-[11px] leading-tight align-middle">{row.wednesday}</td>
                          <td className="py-2.5 px-3 text-left font-bold text-[11px] leading-tight align-middle">{row.thursday}</td>
                          <td className="py-2.5 px-3 text-left font-bold text-[11px] leading-tight align-middle">{row.friday}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footnotes & Magna Carta Regulation Notes matching Sheet Rows 13-14 */}
            <div className="bg-white p-4 border-t border-slate-300 space-y-1 text-[11px] font-bold text-slate-800">
              <p className="border-b border-slate-200 pb-2">
                <span className="font-extrabold text-slate-900">Actual Classroom Teaching :</span> 6 hours (360 minutes) per day (Magna Carta for Public School Teachers) : <span className="font-extrabold text-slate-900">Ancillary Tasks (Teaching-Related Work) :</span> 2 hours (120 minutes) per day. (DepEd Order No. 005, s. 2024)
              </p>
              <p className="pt-1 font-extrabold text-slate-900 flex flex-wrap items-center gap-2">
                <span>Total : 8 hours of service per day (or a 480-minute workday)</span>
                {isJumarMendoza && (
                  <span className="text-slate-600 font-semibold text-[10.5px]">
                    Note: The Friday schedule has been rescheduled to Sunday to accommodate learners who are employed or currently working.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Official Signatures Block matching Sheet Rows 16-19 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mt-6 print-avoid-break print:border-0 print:p-0 print:mt-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-6">
              Official Class Program Approval & Signatures
            </h4>
            {isFiveSignatorySheet(currentTeacherInfo.name) ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                {/* Row 1, Col 1: Prepared By */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">
                    {currentSignatures.signatoriesList[0]?.roleLabel || 'Prepared by:'}
                  </span>
                  <div className="pt-8 pb-1 border-b-2 border-slate-800">
                    <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      {currentSignatures.signatoriesList[0]?.name || currentTeacherInfo.name}
                    </h5>
                  </div>
                  <span className="text-xs font-bold text-slate-600 block">
                    {currentSignatures.signatoriesList[0]?.designation || 'ALS Teacher'}
                  </span>
                </div>

                {/* Row 1, Col 2: Checked By */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">
                    {currentSignatures.signatoriesList[1]?.roleLabel || 'Checked by:'}
                  </span>
                  <div className="pt-8 pb-1 border-b-2 border-slate-800">
                    <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      {currentSignatures.signatoriesList[1]?.name || 'ELMER V. FABROS / ANGELO G. MANDAP'}
                    </h5>
                  </div>
                  <span className="text-xs font-bold text-slate-600 block">
                    {currentSignatures.signatoriesList[1]?.designation || 'Education Program Specialist (EPS)'}
                  </span>
                </div>

                {/* Row 1, Col 3: Reviewed By (User-Editable Principal's Name) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                    <span>{currentSignatures.signatoriesList[2]?.roleLabel || 'Reviewed by:'}</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      <Edit2 className="w-2.5 h-2.5" /> Editable
                    </span>
                  </div>
                  <div className="pt-6 pb-1 border-b-2 border-slate-800 relative group">
                    <input
                      type="text"
                      value={activePrincipalName}
                      onChange={(e) => handlePrincipalNameChange(e.target.value)}
                      placeholder="[Principal's Name]"
                      aria-label="School Principal's Name"
                      className="w-full text-center text-sm font-black text-slate-900 uppercase tracking-tight bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-0.5 placeholder:text-slate-400 placeholder:font-normal placeholder:normal-case hover:bg-slate-50/80 transition cursor-text"
                      title="Click to input or edit the School Principal / School Head name"
                    />
                  </div>
                  <div className="relative group mt-0.5">
                    <input
                      type="text"
                      value={activePrincipalDesignation}
                      onChange={(e) => handlePrincipalDesignationChange(e.target.value)}
                      placeholder="Principals' Designation"
                      aria-label="Principals' Designation"
                      className="w-full text-center text-xs font-bold text-slate-600 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-0.5 placeholder:text-slate-400 hover:bg-slate-50/80 transition cursor-text"
                      title="Click to input or edit the Principal's Designation"
                    />
                  </div>
                </div>

                {/* Row 2, Col 1: Approved (Below ALS Teacher) */}
                <div className="space-y-1 md:mt-4">
                  <span className="text-xs text-slate-500 font-medium block">
                    {currentSignatures.signatoriesList[3]?.roleLabel || 'Approved:'}
                  </span>
                  <div className="pt-8 pb-1 border-b-2 border-slate-800">
                    <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      {currentSignatures.signatoriesList[3]?.name || 'RENE B. MICLAT, PhD'}
                    </h5>
                  </div>
                  <span className="text-xs font-bold text-slate-600 block">
                    {currentSignatures.signatoriesList[3]?.designation || 'PSDS / Division ALS Focal Person'}
                  </span>
                </div>

                {/* Row 2, Col 2: Empty Spacer */}
                <div className="hidden md:block"></div>

                {/* Row 2, Col 3: Endorsed (Below School Principal / School Head) */}
                <div className="space-y-1 md:mt-4">
                  <span className="text-xs text-slate-500 font-medium block">
                    {currentSignatures.signatoriesList[4]?.roleLabel || 'Endorsed:'}
                  </span>
                  <div className="pt-8 pb-1 border-b-2 border-slate-800">
                    <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      {currentSignatures.signatoriesList[4]?.name || 'ROBERT E. OSONGCO, EdD'}
                    </h5>
                  </div>
                  <span className="text-xs font-bold text-slate-600 block">
                    {currentSignatures.signatoriesList[4]?.designation || 'Chief Education Supervisor, CID'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                {/* Prepared By */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">
                    {currentSignatures.signatoriesList[0]?.roleLabel || 'Prepared by:'}
                  </span>
                  <div className="pt-8 pb-1 border-b-2 border-slate-800">
                    <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      {currentSignatures.signatoriesList[0]?.name || currentTeacherInfo.name}
                    </h5>
                  </div>
                  <span className="text-xs font-bold text-slate-600 block">
                    {currentSignatures.signatoriesList[0]?.designation || 'ALS Teacher'}
                  </span>
                </div>

                {/* Checked By */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">
                    {currentSignatures.signatoriesList[1]?.roleLabel || 'Checked by:'}
                  </span>
                  <div className="pt-8 pb-1 border-b-2 border-slate-800">
                    <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      {currentSignatures.signatoriesList[1]?.name || 'ELMER V. FABROS / ANGELO G. MANDAP'}
                    </h5>
                  </div>
                  <span className="text-xs font-bold text-slate-600 block">
                    {currentSignatures.signatoriesList[1]?.designation || 'Education Program Specialist II'}
                  </span>
                </div>

                {/* Approved By */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">
                    {currentSignatures.signatoriesList[2]?.roleLabel || 'Approved:'}
                  </span>
                  <div className="pt-8 pb-1 border-b-2 border-slate-800">
                    <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      {currentSignatures.signatoriesList[2]?.name || 'RENE B. MICLAT, PhD'}
                    </h5>
                  </div>
                  <span className="text-xs font-bold text-slate-600 block">
                    {currentSignatures.signatoriesList[2]?.designation || 'PSDS / Division ALS Focal Person'}
                  </span>
                </div>

                {/* Endorsed By */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">
                    {currentSignatures.signatoriesList[3]?.roleLabel || 'Endorsed:'}
                  </span>
                  <div className="pt-8 pb-1 border-b-2 border-slate-800">
                    <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      {currentSignatures.signatoriesList[3]?.name || 'ROBERT E. OSONGCO, EdD'}
                    </h5>
                  </div>
                  <span className="text-xs font-bold text-slate-600 block">
                    {currentSignatures.signatoriesList[3]?.designation || 'Chief Education Supervisor, CID'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Workload & Learning Strand Analytics Dashboard */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6 print:hidden">
          {/* Executive Workload Banner */}
          <div className="bg-gradient-to-r from-[#002B6D] via-[#003B91] to-[#001D4A] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/20">
                    DepEd Order No. 005, s. 2024 & Magna Carta
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-300" />
                    Verified Compliant
                  </span>
                </div>
                <h3 className="text-2xl font-black tracking-tight text-white">
                  Class Program Teaching Load & Service Matrix Analytics
                </h3>
                <p className="text-xs text-blue-100/90 font-medium leading-relaxed">
                  Real-time workload distribution analytics for <span className="font-bold text-white">{currentTeacherInfo.name}</span>. Displays actual classroom teaching minutes, teaching-related ancillary task allocation, and DepEd ALS Learning Strand ratios.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-4 shrink-0">
                <div className="text-center px-3 border-r border-white/20">
                  <span className="text-[10px] font-mono uppercase text-blue-200 block">Classroom Teaching</span>
                  <span className="text-xl font-black text-white">{analyticsData.teachingHrs} hrs/wk</span>
                  <span className="text-[10px] text-emerald-300 font-bold block">360 mins/day</span>
                </div>
                <div className="text-center px-3">
                  <span className="text-[10px] font-mono uppercase text-blue-200 block">Ancillary Tasks</span>
                  <span className="text-xl font-black text-sky-200">{analyticsData.ancillaryHrs} hrs/wk</span>
                  <span className="text-[10px] text-sky-300 font-bold block">120 mins/day</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Analytics Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Classroom Teaching</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900">{analyticsData.teachingMins} <span className="text-xs text-slate-500 font-bold">mins/wk</span></span>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  75.0% of service • Magna Carta standard
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Ancillary Duties</span>
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900">{analyticsData.ancillaryMins} <span className="text-xs text-slate-500 font-bold">mins/wk</span></span>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  25.0% of service • DepEd Order 005 s.2024
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Total Weekly Service</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#002B6D] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900">{analyticsData.totalWeeklyMins} <span className="text-xs text-slate-500 font-bold">mins</span></span>
                <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                  {analyticsData.totalHrs} Hours / 5 Working Days
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Assigned Venue</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block truncate" title={assignedCLCs.join(' • ')}>
                  {assignedCLCs.join(' • ')}
                </span>
                <span className="text-[11px] font-extrabold text-[#002B6D] block mt-0.5">
                  {currentTeacherInfo.programLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Container: Monthly Classroom Instruction Time Report */}
          <MonthlyClassroomInstructionReportCard teacherCount={CLASS_PROGRAM_TEACHERS.length} />

          {/* Learning Strand Breakdown Visual Bars */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#002B6D]" />
                  Weekly Learning Strand & Activity Allocation Ratios
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Breakdown of time allocated across Learning Strands LS1 - LS6, Ancillary Tasks, and Assembly.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#002B6D] bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 shrink-0">
                Total: {analyticsData.totalWeeklyMins} Mins / Week
              </span>
            </div>

            <div className="space-y-4">
              {Object.entries(analyticsData.strandBreakdown).map(([key, rawItem]) => {
                const item = rawItem as { mins: number; color: string; label: string };
                const percentage = analyticsData.totalWeeklyMins > 0 
                  ? ((item.mins / analyticsData.totalWeeklyMins) * 100).toFixed(1)
                  : '0.0';
                
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        {item.label}
                      </span>
                      <span className="text-slate-900 font-mono font-black">
                        {item.mins} mins <span className="text-slate-400 font-normal">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(2, Number(percentage)))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Division-Wide Mobile Teachers Weekly Schedule Master Consolidation */}
      {activeSubTab === 'teachers' && (
        <ConsolidatedTeachersScheduleView
          onSelectTeacher={(teacherName) => {
            handleTeacherChange(teacherName);
            setActiveSubTab('matrix');
          }}
          selectedTeacherName={selectedTeacherName}
        />
      )}

      {/* Modal for Add / Edit Slot */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#002B6D] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-300" />
                  {editingRow ? 'Edit Class Program Time Slot' : 'Add New Class Schedule Time Slot'}
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Updating schedule for <span className="font-bold text-white">{currentTeacherInfo.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot (e.g. 08:30 AM - 09:30 AM)</label>
                  <input
                    type="text"
                    required
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#002B6D]"
                    placeholder="e.g. 08:00 AM - 09:00 AM"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Minutes Duration</label>
                  <input
                    type="number"
                    required
                    value={formData.minutes}
                    onChange={e => setFormData({ ...formData, minutes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#002B6D]"
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-extrabold uppercase font-mono text-[#002B6D] block">
                  Daily Learning Strand / Subject Activity:
                </span>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Monday</label>
                  <input
                    type="text"
                    value={formData.monday}
                    onChange={e => setFormData({ ...formData, monday: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#002B6D]"
                    placeholder="Subject or Activity for Monday"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tuesday</label>
                  <input
                    type="text"
                    value={formData.tuesday}
                    onChange={e => setFormData({ ...formData, tuesday: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#002B6D]"
                    placeholder="Subject or Activity for Tuesday"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Wednesday</label>
                  <input
                    type="text"
                    value={formData.wednesday}
                    onChange={e => setFormData({ ...formData, wednesday: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#002B6D]"
                    placeholder="Subject or Activity for Wednesday"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Thursday</label>
                  <input
                    type="text"
                    value={formData.thursday}
                    onChange={e => setFormData({ ...formData, thursday: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#002B6D]"
                    placeholder="Subject or Activity for Thursday"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">{isJumarMendoza ? 'Sunday' : 'Friday'}</label>
                  <input
                    type="text"
                    value={formData.friday}
                    onChange={e => setFormData({ ...formData, friday: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#002B6D]"
                    placeholder={`Subject or Activity for ${isJumarMendoza ? 'Sunday' : 'Friday'}`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#002B6D] hover:bg-[#001D4A] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {editingRow ? 'Save Changes' : 'Add Time Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official A4 Landscape Print Preview Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto print:hidden">
          <div className="bg-slate-100 rounded-2xl border border-slate-300 shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header Bar */}
            <div className="bg-[#002B6D] text-white p-4 px-6 flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Official Class Program Matrix — Print & PDF Hub
                  </h3>
                  <p className="text-xs text-blue-100 font-medium">
                    A4 Landscape Layout • Facilitator: <span className="font-extrabold text-white">{currentTeacherInfo.name}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAsPdf}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  title="Download as PDF file directly"
                >
                  <Download className="w-3.5 h-3.5" /> {isGeneratingPdf ? 'Saving PDF...' : 'Download PDF'}
                </button>
                <button
                  type="button"
                  onClick={handleExecutePrint}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" /> Print Document Now (A4 Landscape)
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Preview Info Strip */}
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-2.5 text-xs text-[#002B6D] font-bold flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Assigned CLC / Venue: <strong className="text-slate-900">{assignedCLCs.join(' • ')}</strong></span>
                <span className="text-blue-300">•</span>
                <span>Program Level: <strong className="text-slate-900">{currentTeacherInfo.programLevel}</strong></span>
              </div>
              <div className="text-[11px] font-mono font-black text-blue-900 bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-200">
                Format: 297mm x 210mm (A4 Landscape)
              </div>
            </div>

            {/* A4 Landscape Document Preview Container */}
            <div className="p-4 pt-3 overflow-y-auto bg-slate-200/60 flex-1 flex justify-center print:p-0 print:bg-white print:overflow-visible print:block">
              <div id="class-program-matrix-pdf-document" className="bg-white rounded-lg border border-slate-300 p-4 pt-3 shadow-md text-slate-900 w-full max-w-[1120px] print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none print:block">
                <div dangerouslySetInnerHTML={{ __html: generateCompleteClassProgramHtml() }} />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white border-t border-slate-300 p-4 px-6 flex items-center justify-between shrink-0 print:hidden">
              <div className="text-xs text-slate-500 font-semibold">
                Clicking <strong className="text-slate-900">Print Document Now</strong> automatically downloads the PDF file and opens your system printer / Save as PDF dialog in A4 Landscape mode.
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={handleSaveAsPdf}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> {isGeneratingPdf ? 'Saving PDF...' : 'Download PDF'}
                </button>
                <button
                  type="button"
                  onClick={handleExecutePrint}
                  disabled={isGeneratingPdf}
                  className="px-5 py-2 bg-[#002B6D] hover:bg-[#001D4A] text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" /> Print Document Now (A4 Landscape)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Diagnostics & Technical Sync Inspector Modal */}
      {isDiagnosticsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-scaleUp">
            <div className="bg-[#002B6D] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-black tracking-tight">Sync Diagnostics & Technical Logs</h3>
              </div>
              <button
                onClick={() => setIsDiagnosticsModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Facilitator</span>
                  <p className="text-xs font-black text-slate-900 truncate mt-0.5">{currentTeacherInfo.name}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Google Sheet GID</span>
                  <p className="text-xs font-mono font-black text-emerald-700 mt-0.5">{currentTeacherInfo.gid}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Active Data Origin:</span>
                  <span className={`font-mono font-black px-2 py-0.5 rounded-full text-[11px] ${
                    syncSource === 'live' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : syncSource === 'cached' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-slate-100 text-slate-800'
                  }`}>
                    {syncSource === 'live' ? '🟢 Google Sheets Live' : syncSource === 'cached' ? '🟠 Local Storage Cache' : '🔵 DepEd Baseline Matrix'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Matrix Rows Loaded:</span>
                  <span className="font-mono font-bold text-slate-900">{scheduleRows.length} Rows</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">API Resolution Time:</span>
                  <span className="font-mono font-bold text-blue-700">{syncDiagnostics?.durationMs ?? 0} ms</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Last Synced At:</span>
                  <span className="font-mono text-slate-700">{syncDiagnostics?.timestamp || 'Just now'}</span>
                </div>
              </div>

              {syncDiagnostics?.error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Sync Error Reported:
                  </div>
                  <p className="font-mono text-[11px] text-rose-700">{syncDiagnostics.error}</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                  Connected Spreadsheet ID (Class Program)
                </label>
                <div className="bg-slate-900 text-slate-100 p-2.5 rounded-xl font-mono text-[11px] break-all select-all">
                  {syncDiagnostics?.spreadsheetId || localStorage.getItem('classProgramSpreadsheetId') || '1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc'}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400">
                    Google Cloud Service Account (Sheets & Drive)
                  </label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
                      setCopiedServiceAccount(true);
                      setTimeout(() => setCopiedServiceAccount(false), 2000);
                    }}
                    className="text-[10px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedServiceAccount ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedServiceAccount ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="bg-sky-950 text-sky-200 p-2.5 rounded-xl font-mono text-[11px] break-all select-all border border-sky-800/50">
                  {SERVICE_ACCOUNT_EMAIL}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const text = JSON.stringify({
                        teacher: currentTeacherInfo.name,
                        gid: currentTeacherInfo.gid,
                        syncSource,
                        rows: scheduleRows.length,
                        diagnostics: syncDiagnostics
                      }, null, 2);
                      navigator.clipboard.writeText(text);
                      setCopyFeedback('Copied to clipboard!');
                      setTimeout(() => setCopyFeedback(''), 2500);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copyFeedback ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copyFeedback || 'Copy Diagnostic Log'}
                  </button>
                  <button
                    onClick={handleSyncAllFacilitators}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition cursor-pointer"
                    title="Purge local storage for all 22 facilitators and re-sync"
                  >
                    Purge All Caches
                  </button>
                </div>

                <button
                  onClick={() => {
                    handleManualSync();
                    setIsDiagnosticsModalOpen(false);
                  }}
                  className="px-4 py-1.5 bg-[#002B6D] hover:bg-[#001D4A] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-sync Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official CLC Directory Modal (87 Learning Centers) */}
      {isClcDirectoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-[#002B6D] px-6 py-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black tracking-tight">Official Community Learning Center (CLC) Directory</h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                      87 Learning Centers
                    </span>
                  </div>
                  <p className="text-xs text-sky-200 mt-0.5 font-medium">
                    Google Sheet: Class Program • Tab: <strong>CLC DETAILS (CHECK THIS & UPDATE)</strong> • GID: <code className="font-mono text-amber-300">279279947</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsClcDirectoryModalOpen(false)}
                className="text-slate-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs">
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 shadow-2xs">
                  Total Centers: <strong className="text-[#002B6D]">{OFFICIAL_CLC_DETAILS_LIST.length}</strong>
                </span>
                <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg font-bold text-emerald-800 shadow-2xs">
                  CBLC (Community-Based): <strong>{OFFICIAL_CLC_DETAILS_LIST.filter(c => c.category.includes('Community-Based') || c.category.includes('CBLC')).length}</strong>
                </span>
                <span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg font-bold text-blue-800 shadow-2xs">
                  SBLC (School-Based): <strong>{OFFICIAL_CLC_DETAILS_LIST.filter(c => c.category.includes('School-Based') || c.category.includes('SBLC')).length}</strong>
                </span>
                <span className="px-3 py-1 bg-purple-50 border border-purple-200 rounded-lg font-bold text-purple-800 shadow-2xs">
                  Assigned Facilitators: <strong>17</strong>
                </span>
              </div>

              {/* Direct Link to Sheet GID 279279947 */}
              <a
                href={`https://docs.google.com/spreadsheets/d/${(spreadsheetIdInput.trim().replace(/^.*\/d\//, '').replace(/\/.*$/, '') || '1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc')}/edit#gid=279279947`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#002B6D] hover:bg-[#001D4A] text-white rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 shadow-2xs shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                Open GID 279279947 in Google Sheets
              </a>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={clcSearchQuery}
                  onChange={(e) => setClcSearchQuery(e.target.value)}
                  placeholder="Search CLC name, code, barangay/address, or teacher..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D]"
                />
              </div>

              <select
                value={clcDistrictFilter}
                onChange={(e) => setClcDistrictFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#002B6D]/20"
              >
                <option value="ALL">All Districts (East, North, South, West)</option>
                <option value="East">East District</option>
                <option value="North">North District</option>
                <option value="South">South District</option>
                <option value="West">West District</option>
              </select>

              <select
                value={clcCategoryFilter}
                onChange={(e) => setClcCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#002B6D]/20"
              >
                <option value="ALL">All Categories & Types</option>
                <option value="CBLC">CBLC (Community-Based)</option>
                <option value="SBLC">SBLC (School-Based)</option>
                <option value="Type 1">Type 1</option>
                <option value="Type 3">Type 3</option>
                <option value="Type 4">Type 4</option>
              </select>
            </div>

            {/* Table of 87 CLCs */}
            <div className="overflow-y-auto grow p-4 scrollbar-thin">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 text-center w-12">#</th>
                      <th className="p-2.5">CLC Name</th>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">District</th>
                      <th className="p-2.5">Barangay / Address</th>
                      <th className="p-2.5">Assigned Teacher</th>
                      <th className="p-2.5 text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {OFFICIAL_CLC_DETAILS_LIST
                      .filter(item => {
                        if (clcDistrictFilter !== 'ALL' && !item.district.toLowerCase().includes(clcDistrictFilter.toLowerCase())) {
                          return false;
                        }
                        if (clcCategoryFilter !== 'ALL') {
                          if (clcCategoryFilter === 'CBLC') {
                            if (!item.category.includes('Community-Based') && !item.category.includes('CBLC')) return false;
                          } else if (clcCategoryFilter === 'SBLC') {
                            if (!item.category.includes('School-Based') && !item.category.includes('SBLC')) return false;
                          } else if (item.type !== clcCategoryFilter) {
                            return false;
                          }
                        }
                        if (!clcSearchQuery.trim()) return true;
                        const query = clcSearchQuery.toLowerCase();
                        return (
                          item.clcName.toLowerCase().includes(query) ||
                          item.clcCode.toLowerCase().includes(query) ||
                          (item.address && item.address.toLowerCase().includes(query)) ||
                          item.teacherName.toLowerCase().includes(query) ||
                          item.district.toLowerCase().includes(query)
                        );
                      })
                      .map((item, idx) => {
                        const isCurrentTeacher = currentTeacherInfo.name.toUpperCase().includes(item.teacherName.toUpperCase().split(' ')[0]) ||
                          item.teacherName.toUpperCase().includes(currentTeacherInfo.name.toUpperCase().split(' ')[0]);

                        const isCBLC = item.category.includes('Community-Based') || item.category.includes('CBLC');

                        return (
                          <tr key={item.no} className={`hover:bg-slate-50/80 transition ${isCurrentTeacher ? 'bg-blue-50/50' : ''}`}>
                            <td className="p-2.5 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-900">{item.clcName}</td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-600">{item.clcCode || '—'}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isCBLC 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {isCBLC ? 'CBLC' : 'SBLC'}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {item.type}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-700">{item.district}</td>
                            <td className="p-2.5 text-slate-600">{item.address}</td>
                            <td className="p-2.5">
                              <span className={`font-extrabold ${isCurrentTeacher ? 'text-[#002B6D]' : 'text-slate-800'}`}>
                                {item.teacherName}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  handleTeacherChange(item.teacherName);
                                  setIsClcDirectoryModalOpen(false);
                                }}
                                className="px-2 py-1 bg-[#002B6D] hover:bg-[#001D4A] text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                                title={`Switch schedule to ${item.teacherName}`}
                              >
                                View Matrix
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-500 font-semibold">
                DepEd Schools Division of Tarlac City • Alternative Learning System
              </span>
              <button
                type="button"
                onClick={() => setIsClcDirectoryModalOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-black transition cursor-pointer"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Assistant Chatbot: ALStein */}
      <ALSteinChatbot currentTeacherName={selectedTeacherName} />
    </div>
  );
}
