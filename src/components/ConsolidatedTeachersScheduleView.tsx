import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  User,
  Calendar,
  Clock,
  MapPin,
  Search,
  Filter,
  Download,
  Printer,
  ChevronRight,
  CheckCircle,
  Building,
  BookOpen,
  Award,
  Layers,
  FileSpreadsheet,
  ExternalLink,
  Eye,
  X,
  FileText,
  RefreshCw,
  Phone
} from 'lucide-react';
import {
  getConsolidatedWeeklySchedules,
  TeacherConsolidatedWeeklySchedule,
  CLASS_PROGRAM_TEACHERS,
  fetchLiveClcDetails,
  getAllOfficialDistricts,
  resolveClcDistrict,
  CLC_DETAILS_SHEET_NAME,
  CLC_DETAILS_GID
} from '../utils/classProgramSync';
import {
  CLCDetailItem,
  OFFICIAL_CLC_DETAILS_LIST,
  CLC_DETAILS_VERSION,
  normalizeClcName,
  isClcNameMatch,
  getPsdsForDistrict
} from '../data/clcDetailsData';
import { exportElementToPdf, printHtmlViaIframe } from '../utils/pdfExport';
import { DEPED_LOGO_BASE64 } from '../assets/deped_logo_base64';

interface ConsolidatedTeachersScheduleViewProps {
  onSelectTeacher: (teacherName: string) => void;
  selectedTeacherName: string;
}

export interface ScheduledSession {
  teacherName: string;
  time: string;
  isMorning: boolean;
  isAfternoon: boolean;
  district: string;
  program: string;
}

export interface MasterTableDayEntry {
  clcItem: CLCDetailItem;
  session: ScheduledSession;
}

export function getSessionsForClcAndDay(
  clcItem: CLCDetailItem,
  dayKey: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday',
  schedules: TeacherConsolidatedWeeklySchedule[]
): ScheduledSession[] {
  const sessions: ScheduledSession[] = [];

  schedules.forEach(teacher => {
    const dayData = teacher.days[dayKey];
    if (!dayData) return;

    const mornMatch = isClcNameMatch(clcItem.clcName, dayData.morningClc);
    const aftMatch = isClcNameMatch(clcItem.clcName, dayData.afternoonClc);

    if (mornMatch || aftMatch) {
      let time = '8:00 AM – 3:00 PM';
      if (mornMatch && !aftMatch) {
        time = '8:00 AM – 12:00 PM (AM)';
      } else if (!mornMatch && aftMatch) {
        time = '1:00 PM – 3:00 PM (PM)';
      }

      sessions.push({
        teacherName: teacher.name,
        time,
        isMorning: mornMatch,
        isAfternoon: aftMatch,
        district: clcItem.district || dayData.district || teacher.primaryDistrict,
        program: 'Basic Literacy Program, A&E Elementary, and A&E Junior High School'
      });
    }
  });

  return sessions;
}

export const ConsolidatedTeachersScheduleView: React.FC<ConsolidatedTeachersScheduleViewProps> = ({
  onSelectTeacher,
  selectedTeacherName
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<'all' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'>('all');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'learning_center_details'>('table');
  const [isConsolidatedPrintModalOpen, setIsConsolidatedPrintModalOpen] = useState(false);
  const [isGeneratingConsolidatedPdf, setIsGeneratingConsolidatedPdf] = useState(false);
  const [clcDistrictMap, setClcDistrictMap] = useState<Record<string, string>>({});
  const [isFetchingClcDetails, setIsFetchingClcDetails] = useState<boolean>(false);
  const [clcItems, setClcItems] = useState<CLCDetailItem[]>(() => {
    try {
      const cached = localStorage.getItem('classProgramClcDetailsCache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.version === CLC_DETAILS_VERSION && Array.isArray(parsed.data) && parsed.data.length === OFFICIAL_CLC_DETAILS_LIST.length) {
          return parsed.data;
        }
      }
    } catch (e) {}
    return OFFICIAL_CLC_DETAILS_LIST;
  });
  const [clcDetailsMeta, setClcDetailsMeta] = useState<{
    isFromSheet: boolean;
    source: string;
    totalItems: number;
    sheetName: string;
    gid: string;
  }>({
    isFromSheet: false,
    source: 'deped_default_template',
    totalItems: OFFICIAL_CLC_DETAILS_LIST.length,
    sheetName: CLC_DETAILS_SHEET_NAME,
    gid: CLC_DETAILS_GID
  });

  // Guard: if district was previously set to "Central", reset to "all"
  useEffect(() => {
    if (selectedDistrictFilter && selectedDistrictFilter.toLowerCase() === 'central') {
      setSelectedDistrictFilter('all');
    }
  }, [selectedDistrictFilter]);

  // Fetch live CLC Details from Sheet: "CLC DETAILS (CHECK THIS & UPDATE)" (GID: 279279947)
  useEffect(() => {
    let isMounted = true;
    setIsFetchingClcDetails(true);
    fetchLiveClcDetails()
      .then(res => {
        if (!isMounted) return;
        setClcDistrictMap(res.clcToDistrictMap || {});
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setClcItems(res.data);
        }
        setClcDetailsMeta({
          isFromSheet: res.isFromSheet,
          source: res.source,
          totalItems: res.totalItems || res.data?.length || OFFICIAL_CLC_DETAILS_LIST.length,
          sheetName: res.sheetName || CLC_DETAILS_SHEET_NAME,
          gid: res.gid
        });
      })
      .catch(err => {
        console.warn('Failed to fetch live CLC details:', err);
      })
      .finally(() => {
        if (isMounted) setIsFetchingClcDetails(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefreshClcDetails = async () => {
    setIsFetchingClcDetails(true);
    try {
      const res = await fetchLiveClcDetails();
      setClcDistrictMap(res.clcToDistrictMap || {});
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setClcItems(res.data);
      }
      setClcDetailsMeta({
        isFromSheet: res.isFromSheet,
        source: res.source,
        totalItems: res.totalItems || res.data?.length || OFFICIAL_CLC_DETAILS_LIST.length,
        sheetName: res.sheetName || CLC_DETAILS_SHEET_NAME,
        gid: res.gid
      });
    } catch (e) {
      console.warn('Manual refresh error:', e);
    } finally {
      setIsFetchingClcDetails(false);
    }
  };

  // Consolidated schedules for all 17 mobile teachers with live District mapping
  const allSchedules = useMemo(() => getConsolidatedWeeklySchedules(clcDistrictMap), [clcDistrictMap]);

  // Collect all unique Districts (ensuring 'Central' is removed as instructed)
  const allUniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    clcItems.forEach(item => {
      if (item.district) {
        const d = item.district.trim();
        if (d && d.toLowerCase() !== 'central' && d !== 'District') {
          set.add(d);
        }
      }
    });
    allSchedules.forEach(item => {
      if (item.primaryDistrict && item.primaryDistrict !== 'District' && item.primaryDistrict.toLowerCase() !== 'central') {
        set.add(item.primaryDistrict);
      }
      (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).forEach(dayKey => {
        const d = item.days[dayKey];
        if (d.morningDistrict && d.morningDistrict !== 'District' && d.morningDistrict.toLowerCase() !== 'central') {
          set.add(d.morningDistrict);
        }
        if (d.afternoonDistrict && d.afternoonDistrict !== 'District' && d.afternoonDistrict.toLowerCase() !== 'central') {
          set.add(d.afternoonDistrict);
        }
      });
    });
    getAllOfficialDistricts().forEach(d => {
      if (d && d.toLowerCase() !== 'central' && d !== 'District') {
        set.add(d);
      }
    });
    return Array.from(set).sort();
  }, [clcItems, allSchedules]);

  // Collect all unique CLCs across all teachers for filter dropdown
  const allUniqueCLCs = useMemo(() => {
    const set = new Set<string>();
    allSchedules.forEach(item => {
      item.allAssignedClcs.forEach(clc => set.add(clc));
    });
    return Array.from(set).sort();
  }, [allSchedules]);

  // Collect all unique Program Levels
  const allProgramLevels = useMemo(() => {
    const set = new Set<string>();
    allSchedules.forEach(item => {
      set.add(item.programLevel);
    });
    return Array.from(set);
  }, [allSchedules]);

  // Map of teacher name to Contact Number referenced from Learning Center Details (clcItems)
  const teacherContactMap = useMemo(() => {
    const map: Record<string, string> = {};
    clcItems.forEach(item => {
      if (item.teacherName && item.contactNumber) {
        const norm = item.teacherName.toUpperCase().replace(/Ň|Ñ/g, 'N').trim();
        if (!map[norm]) {
          map[norm] = item.contactNumber.trim();
        }
      }
    });
    return map;
  }, [clcItems]);

  // Helper to safely resolve a teacher's contact number referencing Learning Center Details
  const getTeacherContactNumber = useCallback((teacherName?: string, fallbackContact?: string) => {
    if (!teacherName) return fallbackContact?.trim() || '';
    const norm = teacherName.toUpperCase().replace(/Ň|Ñ/g, 'N').trim();
    return teacherContactMap[norm] || fallbackContact?.trim() || '';
  }, [teacherContactMap]);

  // Filtered schedules based on search and dropdown filters
  const filteredSchedules = useMemo(() => {
    return allSchedules.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.clcName.toLowerCase().includes(q) ||
        item.primaryDistrict.toLowerCase().includes(q) ||
        item.programLevel.toLowerCase().includes(q) ||
        item.gid.includes(q) ||
        item.allAssignedClcs.some(clc => clc.toLowerCase().includes(q)) ||
        [item.days.monday, item.days.tuesday, item.days.wednesday, item.days.thursday, item.days.friday].some(
          d =>
            d.morningClc.toLowerCase().includes(q) ||
            d.afternoonClc.toLowerCase().includes(q) ||
            d.morningDistrict.toLowerCase().includes(q) ||
            d.afternoonDistrict.toLowerCase().includes(q) ||
            d.district.toLowerCase().includes(q) ||
            d.morningActivities.toLowerCase().includes(q)
        );

      const matchesProgram =
        selectedProgramFilter === 'all' || item.programLevel === selectedProgramFilter;

      const matchesDistrict =
        selectedDistrictFilter === 'all' ||
        item.primaryDistrict.toLowerCase().trim() === selectedDistrictFilter.toLowerCase().trim() ||
        [item.days.monday, item.days.tuesday, item.days.wednesday, item.days.thursday, item.days.friday].some(
          d => d.morningDistrict.toLowerCase().trim() === selectedDistrictFilter.toLowerCase().trim() || d.afternoonDistrict.toLowerCase().trim() === selectedDistrictFilter.toLowerCase().trim()
        );

      return matchesSearch && matchesProgram && matchesDistrict;
    });
  }, [allSchedules, searchQuery, selectedProgramFilter, selectedDistrictFilter]);

  // Filtered Community Learning Center entries for Master Table
  // Crucial: Displays only the Learning Center entries that correspond to the selected value in the District dropdown
  const filteredClcItems = useMemo(() => {
    return clcItems.filter(item => {
      // 1. District filter: Display only the Learning Center entries that correspond to the selected value in the District dropdown
      if (selectedDistrictFilter !== 'all') {
        const itemDist = (item.district || '').trim().toLowerCase();
        const selDist = selectedDistrictFilter.trim().toLowerCase();
        if (itemDist !== selDist) {
          return false;
        }
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (item.clcName || '').toLowerCase().includes(q);
        const matchCode = (item.clcCode || '').toLowerCase().includes(q);
        const matchAddr = (item.address || '').toLowerCase().includes(q);
        const matchDist = (item.district || '').toLowerCase().includes(q);
        const matchTeacher = (item.teacherName || '').toLowerCase().includes(q);
        const matchProg = (item.program || '').toLowerCase().includes(q);
        const matchCat = (item.category || '').toLowerCase().includes(q);
        const matchType = (item.type || '').toLowerCase().includes(q);
        const matchMod = (item.modality || '').toLowerCase().includes(q);
        const matchPsds = (item.psdsSupervisor || '').toLowerCase().includes(q);
        const matchContact = (item.contactNumber || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchAddr && !matchDist && !matchTeacher && !matchProg && !matchCat && !matchType && !matchMod && !matchPsds && !matchContact) {
          return false;
        }
      }

      // 3. Program filter if selected
      if (selectedProgramFilter !== 'all' && item.program) {
        if (!item.program.toLowerCase().includes(selectedProgramFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [clcItems, selectedDistrictFilter, searchQuery, selectedProgramFilter]);

  // Build uniform day-by-day columns where each day starts at Row 1, followed by the next container
  const masterTableColumns = useMemo(() => {
    const days: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'> = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday'
    ];

    const dayEntries: Record<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday', MasterTableDayEntry[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: []
    };

    days.forEach(dayKey => {
      filteredClcItems.forEach(item => {
        const sessions = getSessionsForClcAndDay(item, dayKey, allSchedules);
        sessions.forEach(session => {
          dayEntries[dayKey].push({
            clcItem: item,
            session
          });
        });
      });
    });

    const maxRows = Math.max(
      dayEntries.monday.length,
      dayEntries.tuesday.length,
      dayEntries.wednesday.length,
      dayEntries.thursday.length,
      dayEntries.friday.length
    );

    return {
      dayEntries,
      maxRows
    };
  }, [filteredClcItems, allSchedules]);

  // Dynamic Public Schools' District Supervisor (PSDS) Signatory based on selected "District:" dropdown
  // References Learning Center Details (GID 279279947) and official district-to-PSDS mapping
  const psdsSignatory = useMemo(() => {
    return getPsdsForDistrict(selectedDistrictFilter, clcItems);
  }, [selectedDistrictFilter, clcItems]);

  // Export Consolidated Schedule / CLC Masterlist to CSV
  const handleExportConsolidatedCSV = () => {
    // If viewing Master Table, export the Learning Centers, Districts, Teachers, and Monday-Friday schedules
    if (viewMode === 'table') {
      const headers = [
        'COMMUNITY LEARNING CENTER',
        'COMMUNITY LEARNING CENTER CODE',
        'Address',
        'DISTRICT',
        'ALS MOBILE TEACHER',
        'CONTACT NUMBER',
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY'
      ];

      const rows = filteredClcItems.map((item, idx) => {
        const mon = getSessionsForClcAndDay(item, 'monday', allSchedules).map(s => `${s.teacherName} (${s.time})`).join('; ');
        const tue = getSessionsForClcAndDay(item, 'tuesday', allSchedules).map(s => `${s.teacherName} (${s.time})`).join('; ');
        const wed = getSessionsForClcAndDay(item, 'wednesday', allSchedules).map(s => `${s.teacherName} (${s.time})`).join('; ');
        const thu = getSessionsForClcAndDay(item, 'thursday', allSchedules).map(s => `${s.teacherName} (${s.time})`).join('; ');
        const fri = getSessionsForClcAndDay(item, 'friday', allSchedules).map(s => `${s.teacherName} (${s.time})`).join('; ');
        const teacherContact = getTeacherContactNumber(item.teacherName, item.contactNumber);

        return [
          `"${(item.clcName || '').replace(/"/g, '""')}"`,
          `"${(item.clcCode || '').replace(/"/g, '""')}"`,
          `"${(item.address || '').replace(/"/g, '""')}"`,
          `"${(item.district || '').replace(/"/g, '""')}"`,
          `"${(item.teacherName || 'Unassigned').replace(/"/g, '""')}"`,
          `"${teacherContact.replace(/"/g, '""')}"`,
          `"${mon.replace(/"/g, '""')}"`,
          `"${tue.replace(/"/g, '""')}"`,
          `"${wed.replace(/"/g, '""')}"`,
          `"${thu.replace(/"/g, '""')}"`,
          `"${fri.replace(/"/g, '""')}"`
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      const distSuffix = selectedDistrictFilter !== 'all' ? `_${selectedDistrictFilter.replace(/\s+/g, '_')}` : '';
      link.setAttribute('download', `ALS_Tarlac_City_Schedule_Masterlist${distSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // If viewing Learning Center Details, export the exact 12 columns
    if (viewMode === 'learning_center_details') {
      const headers = [
        'NO.',
        'COMMUNITY LEARNING CENTER',
        'COMMUNITY LEARNING CENTER CODE',
        'Address',
        'DISTRICT',
        "PUBLIC SCHOOLS' DISTRICT SUPERVISOR",
        'CATEGORY',
        'TYPE',
        'MODALITY',
        'PROGRAM',
        'NAME OF TEACHER',
        'Contact Number'
      ];

      const rows = filteredClcItems.map(item => [
        `"${item.no}"`,
        `"${(item.clcName || '').replace(/"/g, '""')}"`,
        `"${(item.clcCode || '').replace(/"/g, '""')}"`,
        `"${(item.address || '').replace(/"/g, '""')}"`,
        `"${(item.district || '').replace(/"/g, '""')}"`,
        `"${(item.psdsSupervisor || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        `"${(item.type || '').replace(/"/g, '""')}"`,
        `"${(item.modality || '').replace(/"/g, '""')}"`,
        `"${(item.program || '').replace(/"/g, '""')}"`,
        `"${(item.teacherName || '').replace(/"/g, '""')}"`,
        `"${(item.contactNumber || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      const distSuffix = selectedDistrictFilter !== 'all' ? `_${selectedDistrictFilter.replace(/\s+/g, '_')}` : '';
      link.setAttribute('download', `CLC_DETAILS_279279947${distSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const headers = [
      '#',
      'Teacher Name',
      'Sheet GID',
      'Program Level',
      'District',
      'Primary CLC',
      'All Assigned CLCs',
      'Monday Morning CLC',
      'Monday Afternoon CLC',
      'Monday District',
      'Tuesday Morning CLC',
      'Tuesday Afternoon CLC',
      'Tuesday District',
      'Wednesday Morning CLC',
      'Wednesday Afternoon CLC',
      'Wednesday District',
      'Thursday Morning CLC',
      'Thursday Afternoon CLC',
      'Thursday District',
      'Friday Morning CLC',
      'Friday Afternoon CLC',
      'Friday District',
      'Daily Classroom Mins',
      'Daily Ancillary Mins',
      'Total Weekly Hours',
      'Compliance'
    ];

    const rows = filteredSchedules.map((t, idx) => [
      (idx + 1).toString(),
      `"${t.name}"`,
      `"${t.gid}"`,
      `"${t.programLevel}"`,
      `"${t.primaryDistrict}"`,
      `"${t.clcName}"`,
      `"${t.allAssignedClcs.join('; ')}"`,
      `"${t.days.monday.morningClc}"`,
      `"${t.days.monday.afternoonClc}"`,
      `"${t.days.monday.morningDistrict}"`,
      `"${t.days.tuesday.morningClc}"`,
      `"${t.days.tuesday.afternoonClc}"`,
      `"${t.days.tuesday.morningDistrict}"`,
      `"${t.days.wednesday.morningClc}"`,
      `"${t.days.wednesday.afternoonClc}"`,
      `"${t.days.wednesday.morningDistrict}"`,
      `"${t.days.thursday.morningClc}"`,
      `"${t.days.thursday.afternoonClc}"`,
      `"${t.days.thursday.morningDistrict}"`,
      `"${t.days.friday.morningClc}"`,
      `"${t.days.friday.afternoonClc}"`,
      `"${t.days.friday.morningDistrict}"`,
      '360 mins (6 hrs)',
      '120 mins (2 hrs)',
      '40.0 hrs/wk',
      '100% DepEd Compliant'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ALS_Tarlac_City_Consolidated_Weekly_Schedule_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate Consolidated Schedule HTML for Print & PDF
  const generateConsolidatedHtml = () => {
    // If viewing Master Table, print the unified Division Schedule Masterlist
    if (viewMode === 'table') {
      const maxRows = masterTableColumns.maxRows || 1;
      // Adaptive tiering for audit-ready balance:
      // - Sparse tier (1-4 rows, e.g. single district with 2-4 teachers): expands row heights, padding, and font size so output is balanced and never looks empty.
      // - Normal tier (5-8 rows): standard generous spacing.
      // - Medium tier (9-14 rows): compact balanced spacing.
      // - High density tier (15+ rows, e.g. division-wide all districts): ultra-compact to guarantee 100% single page A4 landscape fit.
      const isSparseDensity = maxRows <= 4;
      const isNormalDensity = maxRows > 4 && maxRows <= 8;
      const isMediumDensity = maxRows > 8 && maxRows <= 14;
      const isHighDensity = maxRows > 14;

      // Adaptive typography and geometry
      const logoSize = isSparseDensity ? '48px' : isNormalDensity ? '42px' : isMediumDensity ? '36px' : '30px';
      const headerMarginBottom = isSparseDensity ? '6px' : isNormalDensity ? '4px' : isMediumDensity ? '2px' : '1px';
      const tableHeaderPadding = isSparseDensity ? '5px 6px' : isNormalDensity ? '3.5px 5px' : isMediumDensity ? '2px 3px' : '1px 2px';
      const tableHeaderFontSize = isSparseDensity ? '8pt' : isNormalDensity ? '7.2pt' : isMediumDensity ? '6.5pt' : '5.5pt';
      
      // Proportional row cell padding and minimum height for balanced page filling
      const cellPadding = isSparseDensity ? '6px 7px' : isNormalDensity ? '4px 5px' : isMediumDensity ? '2px 3px' : '1px 2.5px';
      const minRowHeight = isSparseDensity ? (maxRows <= 2 ? '110px' : '85px') : isNormalDensity ? '48px' : 'auto';
      
      const clcFontSize = isSparseDensity ? '8pt' : isNormalDensity ? '7.2pt' : isMediumDensity ? '6.2pt' : '5.3pt';
      const metaFontSize = isSparseDensity ? '6.8pt' : isNormalDensity ? '6pt' : isMediumDensity ? '5.2pt' : '4.5pt';
      const teacherFontSize = isSparseDensity ? '8.2pt' : isNormalDensity ? '7.2pt' : isMediumDensity ? '6.2pt' : '5.3pt';
      const contactFontSize = isSparseDensity ? '6.8pt' : isNormalDensity ? '6pt' : isMediumDensity ? '5.2pt' : '4.5pt';
      const progFontSize = isSparseDensity ? '6.5pt' : isNormalDensity ? '5.6pt' : isMediumDensity ? '5pt' : '4.2pt';
      const entrySpacing = isSparseDensity ? '2.5px' : isNormalDensity ? '1.5px' : '0.5px';
      
      const signatureMarginTop = isSparseDensity ? '10px' : isNormalDensity ? '7px' : isMediumDensity ? '4px' : '2px';
      const footnotePadding = isSparseDensity ? '3px 6px' : isNormalDensity ? '2px 5px' : isMediumDensity ? '1.5px 4px' : '1px 3px';
      const footnoteFontSize = isSparseDensity ? '6.5pt' : isNormalDensity ? '5.8pt' : isMediumDensity ? '5.2pt' : '4.5pt';
      const signatoryFontSize = isSparseDensity ? '7.5pt' : isNormalDensity ? '6.8pt' : isMediumDensity ? '6pt' : '5.2pt';
      const signatoryTitleSize = isSparseDensity ? '8.5pt' : isNormalDensity ? '7.6pt' : isMediumDensity ? '6.8pt' : '5.8pt';

      const rowsHtml = Array.from({ length: maxRows }).map((_, rowIdx) => {
        const monEntry = masterTableColumns.dayEntries.monday[rowIdx];
        const tueEntry = masterTableColumns.dayEntries.tuesday[rowIdx];
        const wedEntry = masterTableColumns.dayEntries.wednesday[rowIdx];
        const thuEntry = masterTableColumns.dayEntries.thursday[rowIdx];
        const friEntry = masterTableColumns.dayEntries.friday[rowIdx];

        const renderPrintEntry = (entry?: MasterTableDayEntry) => {
          if (!entry) return '<div style="color: #cbd5e1; text-align: center; font-size: 5.5pt; line-height: 1; font-style: italic;">— No Scheduled Session —</div>';
          const { clcItem: item, session: s } = entry;
          const teacherContact = getTeacherContactNumber(s.teacherName, item.contactNumber);
          return `
            <div style="font-weight: 800; color: #000000; font-size: ${clcFontSize}; line-height: 1; margin: 0 0 ${entrySpacing} 0;">${item.clcName}</div>
            <div style="font-size: ${metaFontSize}; color: #000000; font-weight: 600; line-height: 1; margin: 0 0 ${entrySpacing} 0;">Barangay ${item.address || 'Tarlac City'}${item.clcCode ? ` • ${item.clcCode}` : ''} | <span style="font-weight: 800;">${s.time}</span></div>
            <div style="font-size: ${metaFontSize}; font-weight: 700; color: #000000; line-height: 1; margin: 0 0 ${entrySpacing} 0;">District: ${s.district || item.district}</div>
            <div style="font-weight: 800; color: #000000; font-size: ${teacherFontSize}; text-transform: uppercase; line-height: 1; margin: 0 0 ${entrySpacing} 0;">${s.teacherName}</div>
            ${teacherContact ? `<div style="font-size: ${contactFontSize}; font-family: monospace; font-weight: bold; color: #047857; line-height: 1; margin: 0 0 ${entrySpacing} 0;">📞 ${teacherContact}</div>` : ''}
            <div style="font-size: ${progFontSize}; color: #000000; font-weight: 600; line-height: 1; margin: 0;">${s.program}</div>
          `;
        };

        return `
          <tr style="border-bottom: 1.2px solid #cbd5e1; page-break-inside: avoid; break-inside: avoid; background-color: ${rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc'}; line-height: 1; ${minRowHeight !== 'auto' ? `height: ${minRowHeight};` : ''}">
            <td style="padding: ${cellPadding}; width: 20%; vertical-align: top; border-right: 1.2px solid #cbd5e1; line-height: 1;">${renderPrintEntry(monEntry)}</td>
            <td style="padding: ${cellPadding}; width: 20%; vertical-align: top; border-right: 1.2px solid #cbd5e1; line-height: 1;">${renderPrintEntry(tueEntry)}</td>
            <td style="padding: ${cellPadding}; width: 20%; vertical-align: top; border-right: 1.2px solid #cbd5e1; line-height: 1;">${renderPrintEntry(wedEntry)}</td>
            <td style="padding: ${cellPadding}; width: 20%; vertical-align: top; border-right: 1.2px solid #cbd5e1; line-height: 1;">${renderPrintEntry(thuEntry)}</td>
            <td style="padding: ${cellPadding}; width: 20%; vertical-align: top; line-height: 1;">${renderPrintEntry(friEntry)}</td>
          </tr>
        `;
      }).join('');

      return `
        <div id="master-table-print-doc" class="master-table-print-page" style="width: 100%; height: 100%; max-height: 100%; box-sizing: border-box; background: #ffffff; padding: 0; margin: 0; font-family: Arial, 'Segoe UI', sans-serif; color: #0f172a; display: flex; flex-direction: column; justify-content: space-between; line-height: 1;">
          <!-- DepEd Official Header -->
          <div style="position: relative; width: 100%; margin-bottom: ${headerMarginBottom}; line-height: 1;">
            <div style="position: absolute; left: 0px; top: 0px; display: flex; align-items: center;">
              <img src="${DEPED_LOGO_BASE64}" alt="DepEd Logo" style="height: ${logoSize}; width: ${logoSize}; object-fit: contain;" />
            </div>
            <div style="text-align: center; width: 100%; line-height: 1;">
              <div style="font-size: ${isSparseDensity ? '6.2pt' : '5.5pt'}; font-family: 'Times New Roman', Times, serif; text-transform: uppercase; color: #334155; letter-spacing: 0.5px; line-height: 1;">Republic of the Philippines</div>
              <div style="font-size: ${isSparseDensity ? '8pt' : '7pt'}; font-family: 'Times New Roman', Times, serif; font-weight: bold; text-transform: uppercase; color: #0f172a; line-height: 1; margin-top: 1px;">Department of Education</div>
              <div style="font-size: ${isSparseDensity ? '6.2pt' : '5.5pt'}; font-family: 'Times New Roman', Times, serif; text-transform: uppercase; color: #334155; line-height: 1; margin-top: 1px;">Region III – Central Luzon</div>
              <div style="font-size: ${isSparseDensity ? '7.5pt' : '6.5pt'}; font-family: 'Times New Roman', Times, serif; font-weight: bold; text-transform: uppercase; color: #0f172a; line-height: 1; margin-top: 1px;">TARLAC CITY SCHOOLS DIVISION</div>
              <div style="font-size: ${isSparseDensity ? '8pt' : '7pt'}; font-family: 'Times New Roman', Times, serif; font-weight: bold; text-transform: uppercase; color: #002060; letter-spacing: 0.4px; line-height: 1; margin-top: 1px;">Alternative Learning System</div>
              <div style="font-size: ${isSparseDensity ? '10pt' : '8.5pt'}; font-weight: 900; text-transform: uppercase; color: #002060; letter-spacing: 0.8px; margin-top: 1px; line-height: 1;">DIVISION-WIDE MOBILE TEACHERS WEEKLY SCHEDULE MASTERLIST</div>
              <div style="font-size: ${isSparseDensity ? '6.5pt' : '5.5pt'}; font-style: italic; color: #475569; line-height: 1; margin-top: 1px;">School Year 2026–2027 • ${selectedDistrictFilter !== 'all' ? `District: ${selectedDistrictFilter} • ` : 'All 10 Districts • '}${filteredClcItems.length} Learning Centers • Single-Page A4 Landscape</div>
            </div>
          </div>

          <!-- Master Schedule Table (Standardized Gridlines & Proportional Balance) -->
          <div style="width: 100%; border: 1.5px solid #002060; box-sizing: border-box; margin-bottom: 2px; flex-grow: 1; line-height: 1; display: flex; flex-direction: column;">
            <table style="width: 100%; height: 100%; border-collapse: collapse; font-size: 7pt; text-align: left; table-layout: fixed; line-height: 1;">
              <thead>
                <tr style="background-color: #002060; color: #ffffff; text-transform: uppercase; font-size: ${tableHeaderFontSize}; font-weight: bold; text-align: center; line-height: 1;">
                  <th style="padding: ${tableHeaderPadding}; border-right: 1.2px solid #1e3a8a; width: 20%; text-align: center; line-height: 1;">MONDAY</th>
                  <th style="padding: ${tableHeaderPadding}; border-right: 1.2px solid #1e3a8a; width: 20%; text-align: center; line-height: 1;">TUESDAY</th>
                  <th style="padding: ${tableHeaderPadding}; border-right: 1.2px solid #1e3a8a; width: 20%; text-align: center; line-height: 1;">WEDNESDAY</th>
                  <th style="padding: ${tableHeaderPadding}; border-right: 1.2px solid #1e3a8a; width: 20%; text-align: center; line-height: 1;">THURSDAY</th>
                  <th style="padding: ${tableHeaderPadding}; width: 20%; text-align: center; line-height: 1;">FRIDAY</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>

          <!-- Footnotes & Regulatory Workload Reference -->
          <div style="padding: ${footnotePadding}; font-size: ${footnoteFontSize}; font-weight: bold; color: #1e293b; border-top: 1.2px solid #94a3b8; line-height: 1;">
            <div>Teaching Schedule: Morning Session (08:00 AM – 12:00 PM: LS1 to LS4) &nbsp;|&nbsp; Afternoon Session (01:00 PM – 03:00 PM: LS5 to LS6) &nbsp;|&nbsp; Ancillary/Community Mapping (03:00 PM – 05:00 PM)</div>
            <div style="font-weight: 800; color: #002060; margin-top: 1px;">Official Workload Standard: 6.0 hours Classroom Teaching + 2.0 hours Ancillary Tasks = 8.0 hours/day (40.0 hours/week) per DepEd Order No. 005, s. 2024.</div>
          </div>

          <!-- Signatures (3.5 cm horizontal spacing between signatory blocks, single line spacing, A4 Landscape Single Page) -->
          <div style="margin-top: ${signatureMarginTop}; display: flex; justify-content: center; align-items: flex-start; gap: 3.5cm; width: 100%; margin-left: auto; margin-right: auto; text-align: left; font-size: ${signatoryFontSize}; line-height: 1; page-break-inside: avoid; break-inside: avoid;">
            <!-- Block 1: Prepared by -->
            <div style="flex: 1; max-width: 240px; line-height: 1;">
              <div style="font-size: ${signatoryFontSize}; font-weight: 700; color: #334155; margin-bottom: 2px; line-height: 1;">Prepared by:</div>
              <div style="font-weight: 900; text-transform: uppercase; font-size: ${signatoryTitleSize}; color: #0f172a; line-height: 1;">ELMER V. FABROS</div>
              <div style="font-size: ${signatoryFontSize}; color: #475569; margin-top: 1px; line-height: 1;">Education Program Specialist II - ALS</div>
              <div style="font-size: ${signatoryFontSize}; color: #0f172a; margin-top: 3px; line-height: 1;">Signature: <span style="display: inline-block; width: 120px; border-bottom: 1px solid #000000; vertical-align: bottom;"></span></div>
              <div style="font-size: ${signatoryFontSize}; color: #0f172a; margin-top: 2px; line-height: 1;">Date: <span style="display: inline-block; width: 145px; border-bottom: 1px solid #000000; vertical-align: bottom;"></span></div>
            </div>

            <!-- Block 2: Verified by (with 3.5cm gap to left and right) -->
            <div style="flex: 1; max-width: 240px; line-height: 1;">
              <div style="font-size: ${signatoryFontSize}; font-weight: 700; color: #334155; margin-bottom: 2px; line-height: 1;">Verified by:</div>
              <div style="font-weight: 900; text-transform: uppercase; font-size: ${signatoryTitleSize}; color: #0f172a; line-height: 1;">${psdsSignatory.psdsName}</div>
              <div style="font-size: ${signatoryFontSize}; color: #475569; margin-top: 1px; line-height: 1;">${psdsSignatory.districtDesignation}</div>
              <div style="font-size: ${signatoryFontSize}; color: #0f172a; margin-top: 3px; line-height: 1;">Signature: <span style="display: inline-block; width: 120px; border-bottom: 1px solid #000000; vertical-align: bottom;"></span></div>
              <div style="font-size: ${signatoryFontSize}; color: #0f172a; margin-top: 2px; line-height: 1;">Date: <span style="display: inline-block; width: 145px; border-bottom: 1px solid #000000; vertical-align: bottom;"></span></div>
            </div>

            <!-- Block 3: Approved -->
            <div style="flex: 1; max-width: 240px; line-height: 1;">
              <div style="font-size: ${signatoryFontSize}; font-weight: 700; color: #334155; margin-bottom: 2px; line-height: 1;">Approved:</div>
              <div style="font-weight: 900; text-transform: uppercase; font-size: ${signatoryTitleSize}; color: #0f172a; line-height: 1;">RENE B. MICLAT, PhD</div>
              <div style="font-size: ${signatoryFontSize}; color: #475569; margin-top: 1px; line-height: 1;">PSDS / Division ALS Focal Person</div>
              <div style="font-size: ${signatoryFontSize}; color: #0f172a; margin-top: 3px; line-height: 1;">Signature: <span style="display: inline-block; width: 120px; border-bottom: 1px solid #000000; vertical-align: bottom;"></span></div>
              <div style="font-size: ${signatoryFontSize}; color: #0f172a; margin-top: 2px; line-height: 1;">Date: <span style="display: inline-block; width: 145px; border-bottom: 1px solid #000000; vertical-align: bottom;"></span></div>
            </div>
          </div>
        </div>
      `;
    }

    // If viewing Learning Center Details, print the Official CLC Directory Table
    if (viewMode === 'learning_center_details') {
      const rowsHtml = filteredClcItems.map((item, idx) => `
        <tr style="border-bottom: 1px solid #cbd5e1; page-break-inside: avoid; break-inside: avoid; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 4px 5px; text-align: center; font-family: monospace; font-size: 6.5pt; font-weight: bold; color: #475569;">${item.no || idx + 1}</td>
          <td style="padding: 4px 5px; font-weight: bold; color: #002060; font-size: 6.5pt;">${item.clcName}</td>
          <td style="padding: 4px 5px; text-align: center; font-family: monospace; font-size: 6pt; color: #334155;">${item.clcCode || '—'}</td>
          <td style="padding: 4px 5px; font-size: 6pt; color: #334155;">${item.address || 'Tarlac City'}</td>
          <td style="padding: 4px 5px; text-align: center; font-weight: bold; color: #0284c7; font-size: 6pt;">${item.district}</td>
          <td style="padding: 4px 5px; font-size: 6pt; color: #0f172a; font-weight: 600;">${item.psdsSupervisor || '—'}</td>
          <td style="padding: 4px 5px; font-size: 6pt; color: #334155;">${item.category || '—'}</td>
          <td style="padding: 4px 5px; text-align: center; font-size: 6pt; color: #6b21a8; font-weight: bold;">${item.type || '—'}</td>
          <td style="padding: 4px 5px; text-align: center; font-size: 6pt; color: #92400e; font-weight: bold;">${item.modality || '—'}</td>
          <td style="padding: 4px 5px; font-size: 5.5pt; color: #475569; line-height: 1.15;">${item.program || '—'}</td>
          <td style="padding: 4px 5px; font-weight: 800; color: #002060; font-size: 6.5pt; text-transform: uppercase;">${item.teacherName || 'Unassigned'}</td>
          <td style="padding: 4px 5px; text-align: center; font-family: monospace; font-size: 6pt; color: #047857; font-weight: bold;">${item.contactNumber || '—'}</td>
        </tr>
      `).join('');

      return `
        <div style="width: 100%; box-sizing: border-box; background: #ffffff; padding: 0; margin: 0; font-family: Arial, 'Segoe UI', sans-serif; color: #0f172a;">
          <!-- DepEd Header -->
          <div style="position: relative; width: 100%; margin-bottom: 8px; line-height: 1.15;">
            <div style="position: absolute; left: 0.2cm; top: 0px; display: flex; align-items: center;">
              <img src="${DEPED_LOGO_BASE64}" alt="DepEd Logo" style="height: calc(48px + 0.6cm); width: calc(48px + 0.6cm); object-fit: contain;" />
            </div>
            <div style="text-align: center; width: 100%;">
              <div style="font-size: 7.5pt; font-family: 'Times New Roman', Times, serif; text-transform: uppercase; color: #334155; letter-spacing: 0.5px; line-height: 1.15;">Republic of the Philippines</div>
              <div style="font-size: 9.5pt; font-family: 'Times New Roman', Times, serif; font-weight: bold; text-transform: uppercase; color: #0f172a; line-height: 1.15;">Department of Education</div>
              <div style="font-size: 7.5pt; font-family: 'Times New Roman', Times, serif; text-transform: uppercase; color: #334155; line-height: 1.15;">Region III – Central Luzon</div>
              <div style="font-size: 8pt; font-family: 'Times New Roman', Times, serif; font-weight: bold; text-transform: uppercase; color: #0f172a; line-height: 1.15;">TARLAC CITY SCHOOLS DIVISION</div>
              <div style="font-size: 8.5pt; font-family: 'Times New Roman', Times, serif; font-weight: bold; text-transform: uppercase; color: #002060; letter-spacing: 0.4px; line-height: 1.15;">Alternative Learning System</div>
              <div style="font-size: 11pt; font-weight: 900; text-transform: uppercase; color: #002060; letter-spacing: 1.2px; margin-top: 2px; line-height: 1.15;">COMMUNITY LEARNING CENTER (CLC) DETAILS DIRECTORY</div>
              <div style="font-size: 7.5pt; font-style: italic; color: #475569; line-height: 1.15;">Google Sheet: Class Program • Tab: CLC DETAILS (CHECK THIS & UPDATE) • GID: 279279947 • ${selectedDistrictFilter !== 'all' ? `District: ${selectedDistrictFilter} • ` : ''}${filteredClcItems.length} Learning Centers</div>
            </div>
          </div>

          <!-- CLC Details Table -->
          <div style="width: 100%; border: 1.5px solid #002060; box-sizing: border-box; margin-bottom: 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; text-align: left;">
              <thead>
                <tr style="background-color: #002060; color: #ffffff; text-transform: uppercase; font-size: 6pt; font-weight: bold; text-align: center;">
                  <th style="padding: 4px 3px; border-right: 1px solid #1e3a8a; width: 3%;">NO.</th>
                  <th style="padding: 4px 3px; border-right: 1px solid #1e3a8a; width: 15%;">COMMUNITY LEARNING CENTER</th>
                  <th style="padding: 4px 3px; border-right: 1px solid #1e3a8a; width: 7%;">CODE</th>
                  <th style="padding: 4px 3px; border-right: 1px solid #1e3a8a; width: 10%;">Address</th>
                  <th style="padding: 4px 3px; border-right: 1px solid #1e3a8a; width: 6%;">DISTRICT</th>
                  <th style="padding: 4px 3px; border-right: 1px solid #1e3a8a; width: 11%;">SUPERVISOR (PSDS)</th>
                  <th style="padding: 4px 3px; border-right: 1px solid #1e3a8a; width: 11%;">CATEGORY</th>
                  <th style="padding: 4px 3px; border-right: 1px solid #1e3a8a; width: 5%;">TYPE</th>
                  <th style="padding: 4px 3px; border-right: 1px solid #1e3a8a; width: 7%;">MODALITY</th>
                  <th style="padding: 4px 3px; border-right: 1px solid #1e3a8a; width: 10%;">PROGRAM</th>
                  <th style="padding: 4px 3px; border-right: 1px solid #1e3a8a; width: 9%;">NAME OF TEACHER</th>
                  <th style="padding: 4px 3px; width: 6%;">CONTACT</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>

          <!-- Signatures -->
          <div style="margin-top: 14px; display: flex; justify-content: space-around; gap: 48px; max-width: 800px; margin-left: auto; margin-right: auto; text-align: center; font-size: 7.5pt; line-height: 1.2; page-break-inside: avoid; break-inside: avoid;">
            <div style="flex: 1; max-width: 320px;">
              <div style="font-size: 7pt; color: #475569; margin-bottom: 22px;">Prepared by:</div>
              <div style="border-bottom: 1.5px solid #000000; padding-bottom: 1px; font-weight: 900; text-transform: uppercase; font-size: 7.5pt;">ELMER V. FABROS / ANGELO G. MANDAP</div>
              <div style="font-size: 7pt; color: #334155; margin-top: 1px;">Education Program Specialist II - ALS</div>
            </div>
            <div style="flex: 1; max-width: 320px;">
              <div style="font-size: 7pt; color: #475569; margin-bottom: 22px;">Approved:</div>
              <div style="border-bottom: 1.5px solid #000000; padding-bottom: 1px; font-weight: 900; text-transform: uppercase; font-size: 7.5pt;">RENE B. MICLAT, PhD</div>
              <div style="font-size: 7pt; color: #334155; margin-top: 1px;">PSDS / Division ALS Focal Person</div>
            </div>
          </div>
        </div>
      `;
    }
    const tableRows = filteredSchedules.map((t, idx) => {
      return `
        <tr style="border-bottom: 1px solid #cbd5e1; page-break-inside: avoid; break-inside: avoid; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 4px 6px; text-align: center; font-weight: bold; color: #64748b; font-size: 7.5pt;">${idx + 1}</td>
          <td style="padding: 4px 6px; font-size: 7pt; color: #0f172a;">
            <div style="font-weight: bold; color: #1e3a8a;">${t.days.monday.morningClc === t.days.monday.afternoonClc ? t.days.monday.morningClc : `AM: ${t.days.monday.morningClc} | PM: ${t.days.monday.afternoonClc}`}</div>
            <div style="font-size: 6.5pt; color: #64748b; margin-top: 1px;">8:00 AM – 3:00 PM</div>
            <div style="font-size: 6.5pt; font-weight: bold; color: #0284c7; margin-top: 2px;">District: ${t.days.monday.district || t.days.monday.morningDistrict}</div>
            <div style="font-size: 7.5pt; font-weight: 900; color: #002060; margin-top: 2px; text-transform: uppercase;">${t.name}</div>
            <div style="font-size: 6pt; font-weight: 600; color: #475569; margin-top: 1px; line-height: 1.15;">Basic Literacy Program, A&E Elementary, and A&E Junior High School</div>
          </td>
          <td style="padding: 4px 6px; font-size: 7pt; color: #0f172a;">
            <div style="font-weight: bold; color: #1e3a8a;">${t.days.tuesday.morningClc === t.days.tuesday.afternoonClc ? t.days.tuesday.morningClc : `AM: ${t.days.tuesday.morningClc} | PM: ${t.days.tuesday.afternoonClc}`}</div>
            <div style="font-size: 6.5pt; color: #64748b; margin-top: 1px;">8:00 AM – 3:00 PM</div>
            <div style="font-size: 6.5pt; font-weight: bold; color: #0284c7; margin-top: 2px;">District: ${t.days.tuesday.district || t.days.tuesday.morningDistrict}</div>
            <div style="font-size: 7.5pt; font-weight: 900; color: #002060; margin-top: 2px; text-transform: uppercase;">${t.name}</div>
            <div style="font-size: 6pt; font-weight: 600; color: #475569; margin-top: 1px; line-height: 1.15;">Basic Literacy Program, A&E Elementary, and A&E Junior High School</div>
          </td>
          <td style="padding: 4px 6px; font-size: 7pt; color: #0f172a;">
            <div style="font-weight: bold; color: #1e3a8a;">${t.days.wednesday.morningClc === t.days.wednesday.afternoonClc ? t.days.wednesday.morningClc : `AM: ${t.days.wednesday.morningClc} | PM: ${t.days.wednesday.afternoonClc}`}</div>
            <div style="font-size: 6.5pt; color: #64748b; margin-top: 1px;">8:00 AM – 3:00 PM</div>
            <div style="font-size: 6.5pt; font-weight: bold; color: #0284c7; margin-top: 2px;">District: ${t.days.wednesday.district || t.days.wednesday.morningDistrict}</div>
            <div style="font-size: 7.5pt; font-weight: 900; color: #002060; margin-top: 2px; text-transform: uppercase;">${t.name}</div>
            <div style="font-size: 6pt; font-weight: 600; color: #475569; margin-top: 1px; line-height: 1.15;">Basic Literacy Program, A&E Elementary, and A&E Junior High School</div>
          </td>
          <td style="padding: 4px 6px; font-size: 7pt; color: #0f172a;">
            <div style="font-weight: bold; color: #1e3a8a;">${t.days.thursday.morningClc === t.days.thursday.afternoonClc ? t.days.thursday.morningClc : `AM: ${t.days.thursday.morningClc} | PM: ${t.days.thursday.afternoonClc}`}</div>
            <div style="font-size: 6.5pt; color: #64748b; margin-top: 1px;">8:00 AM – 3:00 PM</div>
            <div style="font-size: 6.5pt; font-weight: bold; color: #0284c7; margin-top: 2px;">District: ${t.days.thursday.district || t.days.thursday.morningDistrict}</div>
            <div style="font-size: 7.5pt; font-weight: 900; color: #002060; margin-top: 2px; text-transform: uppercase;">${t.name}</div>
            <div style="font-size: 6pt; font-weight: 600; color: #475569; margin-top: 1px; line-height: 1.15;">Basic Literacy Program, A&E Elementary, and A&E Junior High School</div>
          </td>
          <td style="padding: 4px 6px; font-size: 7pt; color: #0f172a;">
            <div style="font-weight: bold; color: #1e3a8a;">${t.days.friday.morningClc === t.days.friday.afternoonClc ? t.days.friday.morningClc : `AM: ${t.days.friday.morningClc} | PM: ${t.days.friday.afternoonClc}`}</div>
            <div style="font-size: 6.5pt; color: #64748b; margin-top: 1px;">8:00 AM – 3:00 PM</div>
            <div style="font-size: 6.5pt; font-weight: bold; color: #0284c7; margin-top: 2px;">District: ${t.days.friday.district || t.days.friday.morningDistrict}</div>
            <div style="font-size: 7.5pt; font-weight: 900; color: #002060; margin-top: 2px; text-transform: uppercase;">${t.name}</div>
            <div style="font-size: 6pt; font-weight: 600; color: #475569; margin-top: 1px; line-height: 1.15;">Basic Literacy Program, A&E Elementary, and A&E Junior High School</div>
          </td>
          <td style="padding: 4px 6px; text-align: center; font-size: 7pt;">
            <span style="display: inline-block; padding: 1.5px 5px; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; border-radius: 3px; font-weight: bold; font-size: 6.5pt;">
              40.0 Hrs / Wk
            </span>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div style="width: 100%; box-sizing: border-box; background: #ffffff; padding: 0; margin: 0; font-family: Arial, 'Segoe UI', sans-serif; color: #0f172a;">
        <!-- Official DepEd 7-Line Header -->
        <div style="position: relative; width: 100%; margin-bottom: 8px; line-height: 1.15;">
          <div style="position: absolute; left: 0.2cm; top: 0px; display: flex; align-items: center;">
            <img src="${DEPED_LOGO_BASE64}" alt="DepEd Logo" style="height: calc(48px + 0.6cm); width: calc(48px + 0.6cm); object-fit: contain;" />
          </div>
          <div style="text-align: center; width: 100%;">
            <div style="font-size: 7.5pt; font-family: 'Times New Roman', Times, serif; text-transform: uppercase; color: #334155; letter-spacing: 0.5px; line-height: 1.15;">Republic of the Philippines</div>
            <div style="font-size: 9.5pt; font-family: 'Times New Roman', Times, serif; font-weight: bold; text-transform: uppercase; color: #0f172a; line-height: 1.15;">Department of Education</div>
            <div style="font-size: 7.5pt; font-family: 'Times New Roman', Times, serif; text-transform: uppercase; color: #334155; line-height: 1.15;">Region III – Central Luzon</div>
            <div style="font-size: 8pt; font-family: 'Times New Roman', Times, serif; font-weight: bold; text-transform: uppercase; color: #0f172a; line-height: 1.15;">TARLAC CITY SCHOOLS DIVISION</div>
            <div style="font-size: 8.5pt; font-family: 'Times New Roman', Times, serif; font-weight: bold; text-transform: uppercase; color: #002060; letter-spacing: 0.4px; line-height: 1.15;">Alternative Learning System</div>
            <div style="font-size: 11pt; font-weight: 900; text-transform: uppercase; color: #002060; letter-spacing: 1.2px; margin-top: 2px; line-height: 1.15;">CONSOLIDATED WEEKLY CLASS PROGRAM & TEACHER DEPLOYMENT MATRIX</div>
            <div style="font-size: 7.5pt; font-style: italic; color: #475569; line-height: 1.15;">School Year 2026–2027 • Division ALS Facilitators (${filteredSchedules.length} Teachers)</div>
          </div>
        </div>

        <!-- Master Consolidation Table -->
        <div style="width: 100%; border: 1.5px solid #002060; box-sizing: border-box; margin-bottom: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; text-align: left;">
            <thead>
              <tr style="background-color: #002060; color: #ffffff; text-transform: uppercase; font-size: 7.5pt; font-weight: bold; text-align: center;">
                <th style="padding: 5px 4px; border-right: 1px solid #1e3a8a; width: 24px;">#</th>
                <th style="padding: 5px 6px; border-right: 1px solid #1e3a8a; width: 170px;">Monday</th>
                <th style="padding: 5px 6px; border-right: 1px solid #1e3a8a; width: 170px;">Tuesday</th>
                <th style="padding: 5px 6px; border-right: 1px solid #1e3a8a; width: 170px;">Wednesday</th>
                <th style="padding: 5px 6px; border-right: 1px solid #1e3a8a; width: 170px;">Thursday</th>
                <th style="padding: 5px 6px; border-right: 1px solid #1e3a8a; width: 170px;">Friday</th>
                <th style="padding: 5px 4px; width: 75px;">Workload</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>

        <!-- Footnotes -->
        <div style="padding: 3px 6px; font-size: 6.8pt; font-weight: bold; color: #1e293b; border-top: 1px solid #94a3b8; line-height: 1.25;">
          <div>Teaching Schedule: Morning Session (08:00 AM – 12:00 PM: LS1 to LS4) &nbsp;|&nbsp; Afternoon Session (01:00 PM – 03:00 PM: LS5 to LS6) &nbsp;|&nbsp; Ancillary/Mapping (03:00 PM – 05:00 PM)</div>
          <div style="font-weight: 800; color: #002060; margin-top: 1px;">Standard Workload: 6 hours Classroom Teaching + 2 hours Ancillary Tasks = 8.0 hours/day (40.0 hours/week) per DepEd Order No. 005, s. 2024.</div>
        </div>

        <!-- Institutional Signature Blocks (2 Column Layout) -->
        <div style="margin-top: 14px; display: flex; justify-content: space-around; gap: 48px; max-width: 800px; margin-left: auto; margin-right: auto; text-align: center; font-size: 7.5pt; line-height: 1.2; page-break-inside: avoid; break-inside: avoid;">
          <div style="flex: 1; max-width: 320px;">
            <div style="font-size: 7pt; color: #475569; margin-bottom: 22px;">Prepared by:</div>
            <div style="border-bottom: 1.5px solid #000000; padding-bottom: 1px; font-weight: 900; text-transform: uppercase; font-size: 7.5pt;">ELMER V. FABROS / ANGELO G. MANDAP</div>
            <div style="font-size: 7pt; color: #334155; margin-top: 1px;">Education Program Specialist II - ALS</div>
          </div>

          <div style="flex: 1; max-width: 320px;">
            <div style="font-size: 7pt; color: #475569; margin-bottom: 22px;">Approved:</div>
            <div style="border-bottom: 1.5px solid #000000; padding-bottom: 1px; font-weight: 900; text-transform: uppercase; font-size: 7.5pt;">RENE B. MICLAT, PhD</div>
            <div style="font-size: 7pt; color: #334155; margin-top: 1px;">PSDS / Division ALS Focal Person</div>
          </div>
        </div>
      </div>
    `;
  };

  const handleSaveConsolidatedPdf = async () => {
    setIsGeneratingConsolidatedPdf(true);
    let tempContainer: HTMLElement | null = null;
    try {
      tempContainer = document.createElement('div');
      tempContainer.id = 'temp-consolidated-schedule-export';
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
      tempContainer.innerHTML = generateConsolidatedHtml();
      document.body.appendChild(tempContainer);

      // Auto-fit guard to strictly constrain height for a single page A4 landscape
      const maxAllowedHeight = 745;
      if (tempContainer.scrollHeight > maxAllowedHeight) {
        const scale = (maxAllowedHeight / tempContainer.scrollHeight) * 0.99;
        tempContainer.style.transformOrigin = 'top center';
        tempContainer.style.transform = `scale(${scale})`;
      }

      await exportElementToPdf({
        element: tempContainer,
        filename: viewMode === 'table' 
          ? `ALS_Tarlac_City_Mobile_Teachers_Weekly_Schedule_Masterlist_SY2026_2027.pdf`
          : `ALS_Tarlac_City_Consolidated_Weekly_Schedule_SY2026_2027.pdf`,
        orientation: 'landscape',
        format: 'a4',
        margin: [4, 5, 4, 5],
        scale: 2.0,
        selfContained: true
      });
    } catch (err) {
      console.error('Error generating consolidated PDF:', err);
    } finally {
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      setIsGeneratingConsolidatedPdf(false);
    }
  };

  const handlePrintConsolidated = () => {
    printHtmlViaIframe(
      generateConsolidatedHtml(),
      `${viewMode === 'table' ? 'Division-Wide Mobile Teachers Weekly Schedule Masterlist' : 'Consolidated Weekly Schedule'} - DepEd SDO Tarlac City ALS`,
      'landscape'
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. Executive Banner & Summary Statistics */}
      <div className="bg-gradient-to-r from-[#002060] via-[#002B6D] to-[#1E3A8A] rounded-2xl p-5 text-white shadow-md border border-blue-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-sky-200 text-[10px] font-black uppercase tracking-widest border border-blue-400/30">
              <Building className="w-3 h-3" /> DepEd Tarlac City Schools Division • ALS Roster Consolidation
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Division-Wide Mobile Teachers Weekly Schedule Masterlist
            </h2>
            <p className="text-xs text-blue-100/80 leading-relaxed font-normal">
              Consolidated weekly teaching matrix, community learning center venue assignments, learning strands distribution, and 40.0-hour statutory workload compliance for all {CLASS_PROGRAM_TEACHERS.length} ALS Facilitators.
            </p>
          </div>

          {/* Quick Metrics Bento in Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-xs border border-white/15">
            <div className="text-center px-2">
              <div className="text-lg font-black text-white">{CLASS_PROGRAM_TEACHERS.length}</div>
              <div className="text-[10px] uppercase font-bold text-blue-200">Mobile Teachers</div>
            </div>
            <div className="text-center px-2 border-l border-white/15">
              <div className="text-lg font-black text-amber-300">{allUniqueCLCs.length}+</div>
              <div className="text-[10px] uppercase font-bold text-blue-200">Assigned CLCs</div>
            </div>
            <div className="text-center px-2 border-l border-white/15">
              <div className="text-lg font-black text-emerald-300">40.0</div>
              <div className="text-[10px] uppercase font-bold text-blue-200">Hrs/Wk Standard</div>
            </div>
            <div className="text-center px-2 border-l border-white/15">
              <div className="text-lg font-black text-sky-300">100%</div>
              <div className="text-[10px] uppercase font-bold text-blue-200">DO 005 Compliant</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Controls Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search teacher, CLC venue, barangay, strand, or GID..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-[#002060]/20 focus:border-[#002060]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start lg:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#002060] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Master Table
            </button>

            <button
              onClick={() => setViewMode('learning_center_details')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'learning_center_details'
                  ? 'bg-white text-[#002060] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              Learning Center Details
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportConsolidatedCSV}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Export all teachers weekly schedules to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              Export CSV
            </button>

            <button
              onClick={() => setIsConsolidatedPrintModalOpen(true)}
              className="px-3.5 py-2 bg-[#002060] hover:bg-[#001848] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Print official consolidated schedule document"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Masterlist (A4)
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-bold mr-1">
            <Filter className="w-3 h-3" /> Filters:
          </div>

          {/* Day of Week Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-400 font-semibold">Day:</span>
            <select
              value={selectedDayFilter}
              onChange={e => setSelectedDayFilter(e.target.value as any)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Days (Mon–Fri)</option>
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
            </select>
          </div>

          {/* District Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-400 font-semibold">District:</span>
            <select
              value={selectedDistrictFilter}
              onChange={e => setSelectedDistrictFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer max-w-[180px] truncate"
            >
              <option value="all">All Districts ({allUniqueDistricts.length})</option>
              {allUniqueDistricts.map(dist => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          </div>

          {/* Live Sheet Badge & Refresh */}
          <div className="hidden md:flex items-center gap-1.5 ml-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-mono">
            <FileSpreadsheet className="w-3 h-3 text-sky-600 shrink-0" />
            <span className="truncate max-w-[210px]" title={`Tab: ${clcDetailsMeta.sheetName} (GID: ${clcDetailsMeta.gid})`}>
              Districts: {clcDetailsMeta.sheetName}
            </span>
            <button
              onClick={handleRefreshClcDetails}
              disabled={isFetchingClcDetails}
              className="hover:text-sky-950 ml-0.5 cursor-pointer disabled:opacity-50"
              title="Refresh District mappings from Google Sheet"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isFetchingClcDetails ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Reset Filters */}
          {(searchQuery || selectedDayFilter !== 'all' || selectedDistrictFilter !== 'all' || selectedProgramFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDayFilter('all');
                setSelectedDistrictFilter('all');
                setSelectedProgramFilter('all');
              }}
              className="text-rose-600 hover:text-rose-700 font-bold ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Views */}

      {/* MODE 1: MASTER TABLE & CONSOLIDATED SCHEDULE */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
          {/* Active District Filter Notification Banner */}
          {selectedDistrictFilter !== 'all' && (
            <div className="px-4 py-2 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between text-xs text-[#002060]">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  Showing only Community Learning Centers located in <strong>{selectedDistrictFilter}</strong> ({filteredClcItems.length} found).
                </span>
              </div>
              <button
                onClick={() => setSelectedDistrictFilter('all')}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
              >
                Show All Districts
              </button>
            </div>
          )}

          {/* Division Master Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-[#002060] text-white text-[11px] font-black uppercase tracking-wider divide-x divide-blue-900">
                  <th className={`py-3.5 px-3 min-w-[200px] border-b border-slate-300 text-center ${selectedDayFilter === 'monday' ? 'bg-blue-950 ring-2 ring-sky-400' : ''}`}>Monday</th>
                  <th className={`py-3.5 px-3 min-w-[200px] border-b border-slate-300 text-center ${selectedDayFilter === 'tuesday' ? 'bg-blue-950 ring-2 ring-sky-400' : ''}`}>Tuesday</th>
                  <th className={`py-3.5 px-3 min-w-[200px] border-b border-slate-300 text-center ${selectedDayFilter === 'wednesday' ? 'bg-blue-950 ring-2 ring-sky-400' : ''}`}>Wednesday</th>
                  <th className={`py-3.5 px-3 min-w-[200px] border-b border-slate-300 text-center ${selectedDayFilter === 'thursday' ? 'bg-blue-950 ring-2 ring-sky-400' : ''}`}>Thursday</th>
                  <th className={`py-3.5 px-3 min-w-[200px] border-b border-slate-300 text-center ${selectedDayFilter === 'friday' ? 'bg-blue-950 ring-2 ring-sky-400' : ''}`}>Friday</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-200">
                {masterTableColumns.maxRows === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-slate-400">
                      <Building className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-sm text-slate-700">No Learning Centers Found</p>
                      <p className="text-xs mt-1 text-slate-500">
                        {selectedDistrictFilter !== 'all'
                          ? `No Community Learning Centers match District: "${selectedDistrictFilter}".`
                          : 'No Community Learning Centers match your current search criteria.'}
                      </p>
                      {selectedDistrictFilter !== 'all' && (
                        <button
                          onClick={() => setSelectedDistrictFilter('all')}
                          className="mt-3 px-3.5 py-1.5 bg-[#002060] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-blue-900 transition"
                        >
                          Show All Districts
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  Array.from({ length: masterTableColumns.maxRows }).map((_, rowIdx) => {
                    const mondayEntry = masterTableColumns.dayEntries.monday[rowIdx];
                    const tuesdayEntry = masterTableColumns.dayEntries.tuesday[rowIdx];
                    const wednesdayEntry = masterTableColumns.dayEntries.wednesday[rowIdx];
                    const thursdayEntry = masterTableColumns.dayEntries.thursday[rowIdx];
                    const fridayEntry = masterTableColumns.dayEntries.friday[rowIdx];

                    const renderCellEntry = (entry?: MasterTableDayEntry) => {
                      if (!entry) {
                        return (
                          <div className="h-full min-h-[48px] flex items-center justify-center">
                            <span className="text-slate-300 font-mono text-sm select-none">—</span>
                          </div>
                        );
                      }

                      const { clcItem: item, session } = entry;

                      return (
                        <div className="bg-white rounded-lg p-2.5 border border-slate-200 shadow-2xs space-y-1.5 h-full flex flex-col justify-between text-black">
                          <div className="space-y-1.5">
                            {/* Community Learning Center name & address placed above Time */}
                            <div className="border-b border-slate-100 pb-1">
                              <div className="font-extrabold text-black text-xs leading-snug">
                                {item.clcName}
                              </div>
                              <div className="text-[10px] text-black font-medium mt-0.5 flex items-center gap-1 flex-wrap">
                                <MapPin className="w-2.5 h-2.5 text-black shrink-0" />
                                <span>Barangay {item.address || 'Tarlac City'}</span>
                                {item.clcCode && (
                                  <>
                                    <span className="text-black/40">•</span>
                                    <span className="font-mono text-black text-[9px] font-bold">{item.clcCode}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Time directly below Community Learning Center */}
                            <div className="text-[10px] text-black font-bold flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-black shrink-0" />
                              <span>{session.time}</span>
                            </div>

                            {/* District badge */}
                            <div className="text-[9px] font-bold text-black flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 w-fit">
                              <span className="text-[8.5px] font-bold text-black uppercase">District:</span>
                              <span className="truncate max-w-[120px] font-black text-black">{session.district || item.district}</span>
                            </div>

                            {/* Teacher's Name directly below District */}
                            <div className="text-[11px] font-black text-black uppercase leading-tight flex items-center gap-1">
                              <User className="w-3 h-3 text-black shrink-0" />
                              <button
                                onClick={() => onSelectTeacher(session.teacherName)}
                                className={`text-left text-black hover:text-black hover:underline transition cursor-pointer ${
                                  session.teacherName === selectedTeacherName ? 'font-black' : 'font-bold'
                                }`}
                                title={`View weekly matrix for ${session.teacherName}`}
                              >
                                {session.teacherName}
                              </button>
                            </div>

                            {/* Teacher CONTACT NUMBER directly below Name of Teacher (Referenced from Learning Center Details) - EXCLUDED from Dark Black per request */}
                            {(() => {
                              const contactNum = getTeacherContactNumber(session.teacherName, item.contactNumber);
                              if (!contactNum) return null;
                              return (
                                <div className="text-[9.5px] font-bold text-emerald-800 flex items-center gap-1 bg-emerald-50/90 hover:bg-emerald-100/90 transition px-1.5 py-0.5 rounded border border-emerald-200/80 w-fit">
                                  <Phone className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                  <a
                                    href={`tel:${contactNum}`}
                                    className="font-mono tracking-tight hover:underline cursor-pointer"
                                    title={`Call ${session.teacherName}: ${contactNum}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {contactNum}
                                  </a>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Program details */}
                          <div className="text-[8.5px] font-bold text-black bg-slate-100 rounded px-1.5 py-0.5 border border-slate-300 leading-tight mt-1">
                            {session.program}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <tr
                        key={`row_${rowIdx}`}
                        className={`hover:bg-slate-50/80 transition ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                      >
                        {/* 1. MONDAY */}
                        <td className="py-2.5 px-2.5 bg-slate-50/30 align-top">
                          {renderCellEntry(mondayEntry)}
                        </td>

                        {/* 2. TUESDAY */}
                        <td className="py-2.5 px-2.5 align-top">
                          {renderCellEntry(tuesdayEntry)}
                        </td>

                        {/* 3. WEDNESDAY */}
                        <td className="py-2.5 px-2.5 bg-slate-50/30 align-top">
                          {renderCellEntry(wednesdayEntry)}
                        </td>

                        {/* 4. THURSDAY */}
                        <td className="py-2.5 px-2.5 align-top">
                          {renderCellEntry(thursdayEntry)}
                        </td>

                        {/* 5. FRIDAY */}
                        <td className="py-2.5 px-2.5 bg-slate-50/30 align-top">
                          {renderCellEntry(fridayEntry)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>

            {/* Signatory Section under Master Table (Institutional DepEd 3-Signatory Layout) */}
            <div className="p-6 md:p-8 bg-slate-50/70 border-t border-slate-200">
              <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-6xl mx-auto border-b border-slate-200 pb-3">
                <div className="text-center sm:text-left text-xs text-slate-600">
                  <div className="font-black text-[#002060] uppercase tracking-wide">
                    Alternative Learning System • SDO Tarlac City
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-none">
                    Mobile Teachers Weekly Schedule Masterlist • SY 2026–2027
                  </div>
                </div>
                {selectedDistrictFilter !== 'all' ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold">
                    <span className="text-blue-600 uppercase text-[10px]">Active District:</span>
                    <span className="font-extrabold">{psdsSignatory.districtName}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                    <span>Division-Wide Masterlist (All 10 Districts)</span>
                  </div>
                )}
              </div>

              {/* 3 Signatory Columns with balanced spacing, single line spacing, Signature & Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto pt-2 text-left">
                {/* 1. Prepared by */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs leading-none">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 leading-none">
                    Prepared by:
                  </p>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-wide leading-tight">
                    ELMER V. FABROS
                  </p>
                  <p className="text-xs text-slate-600 font-medium mt-1 leading-tight">
                    Education Program Specialist II - ALS
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-sans font-semibold text-[11px]">Signature:</span>
                      <span className="border-b border-slate-400 w-32 inline-block"></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-sans font-semibold text-[11px]">Date:</span>
                      <span className="border-b border-slate-400 w-32 inline-block"></span>
                    </div>
                  </div>
                </div>

                {/* 2. Verified by (Bound to District) */}
                <div className="p-4 bg-white rounded-xl border-2 border-blue-200 shadow-2xs leading-none">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider leading-none">
                      Verified by:
                    </p>
                    {selectedDistrictFilter !== 'all' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        {psdsSignatory.districtName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-wide leading-tight">
                    {psdsSignatory.psdsName}
                  </p>
                  <p className="text-xs text-blue-950 font-bold mt-1 leading-tight">
                    {psdsSignatory.districtDesignation}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-sans font-semibold text-[11px]">Signature:</span>
                      <span className="border-b border-slate-400 w-32 inline-block"></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-sans font-semibold text-[11px]">Date:</span>
                      <span className="border-b border-slate-400 w-32 inline-block"></span>
                    </div>
                  </div>
                </div>

                {/* 3. Approved */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs leading-none">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 leading-none">
                    Approved:
                  </p>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-wide leading-tight">
                    RENE B. MICLAT, PhD
                  </p>
                  <p className="text-xs text-slate-600 font-medium mt-1 leading-tight">
                    PSDS / Division ALS Focal Person
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-sans font-semibold text-[11px]">Signature:</span>
                      <span className="border-b border-slate-400 w-32 inline-block"></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-sans font-semibold text-[11px]">Date:</span>
                      <span className="border-b border-slate-400 w-32 inline-block"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      )}

      {/* MODE: LEARNING CENTER DETAILS (Official CLC Directory from GID 279279947) */}
      {viewMode === 'learning_center_details' && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
          {/* Header Information Bar */}
          <div className="p-4 bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#002060] text-white rounded-lg shadow-2xs">
                  <Building className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-[#002060]">
                  Learning Center Details
                </h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[11px] font-mono font-bold rounded-full border border-blue-200">
                  {filteredClcItems.length} {filteredClcItems.length === 1 ? 'Center' : 'Centers'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 flex-wrap">
                <span>Google Sheet: <strong>Class Program</strong></span>
                <span className="text-slate-300">•</span>
                <span>Tab: <strong className="text-blue-900 font-mono">CLC DETAILS (CHECK THIS & UPDATE)</strong></span>
                <span className="text-slate-300">•</span>
                <span>GID: <code className="font-mono font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">279279947</code></span>
                {clcDetailsMeta.isFromSheet && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    <CheckCircle className="w-2.5 h-2.5" /> Live Synced
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshClcDetails}
                disabled={isFetchingClcDetails}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#002060] rounded-xl text-xs font-bold border border-slate-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                title="Fetch latest updates from Google Sheet GID 279279947"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingClcDetails ? 'animate-spin' : ''}`} />
                {isFetchingClcDetails ? 'Fetching...' : 'Fetch Updated Sheet'}
              </button>

              <a
                href="https://docs.google.com/spreadsheets/d/1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc/edit#gid=279279947"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#002060] hover:bg-[#001848] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                title="Open Google Sheet tab GID 279279947 in a new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open GID 279279947
              </a>
            </div>
          </div>

          {/* Active District Filter Notification Banner if filtered */}
          {selectedDistrictFilter !== 'all' && (
            <div className="bg-blue-50/80 px-4 py-2 border-b border-blue-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-blue-900">
                <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>
                  Showing Community Learning Centers located in <strong>{selectedDistrictFilter}</strong> ({filteredClcItems.length} found).
                </span>
              </div>
              <button
                onClick={() => setSelectedDistrictFilter('all')}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
              >
                Show All Districts
              </button>
            </div>
          )}

          {/* CLC Details Table with the 12 requested columns */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#002060] text-white text-[11px] font-black uppercase tracking-wider divide-x divide-blue-900/50">
                  <th className="py-3 px-3 w-12 text-center border-b border-blue-900">NO.</th>
                  <th className="py-3 px-3.5 min-w-[220px] border-b border-blue-900">COMMUNITY LEARNING CENTER</th>
                  <th className="py-3 px-3 min-w-[140px] text-center border-b border-blue-900">COMMUNITY LEARNING CENTER CODE</th>
                  <th className="py-3 px-3.5 min-w-[180px] border-b border-blue-900">Address</th>
                  <th className="py-3 px-3 min-w-[110px] text-center border-b border-blue-900">DISTRICT</th>
                  <th className="py-3 px-3.5 min-w-[180px] border-b border-blue-900">PUBLIC SCHOOLS' DISTRICT SUPERVISOR</th>
                  <th className="py-3 px-3.5 min-w-[180px] border-b border-blue-900">CATEGORY</th>
                  <th className="py-3 px-3 min-w-[90px] text-center border-b border-blue-900">TYPE</th>
                  <th className="py-3 px-3 min-w-[110px] text-center border-b border-blue-900">MODALITY</th>
                  <th className="py-3 px-3.5 min-w-[220px] border-b border-blue-900">PROGRAM</th>
                  <th className="py-3 px-3.5 min-w-[180px] border-b border-blue-900">NAME OF TEACHER</th>
                  <th className="py-3 px-3 min-w-[140px] text-center border-b border-blue-900">Contact Number</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-200">
                {filteredClcItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-14 text-center text-slate-400">
                      <Building className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-sm text-slate-700">No Learning Center Records Found</p>
                      <p className="text-xs mt-1 text-slate-500">
                        {selectedDistrictFilter !== 'all'
                          ? `No Community Learning Centers match District: "${selectedDistrictFilter}".`
                          : 'No Community Learning Centers match your current search criteria.'}
                      </p>
                      {selectedDistrictFilter !== 'all' && (
                        <button
                          onClick={() => setSelectedDistrictFilter('all')}
                          className="mt-3 px-3.5 py-1.5 bg-[#002060] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-blue-900 transition"
                        >
                          Show All Districts
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredClcItems.map((item, idx) => {
                    const isZebra = idx % 2 === 1;
                    return (
                      <tr
                        key={`${item.no}-${item.clcName}-${idx}`}
                        className={`transition-colors hover:bg-blue-50/40 divide-x divide-slate-100 ${
                          isZebra ? 'bg-slate-50/60' : 'bg-white'
                        }`}
                      >
                        {/* NO. */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500 text-xs">
                          {item.no || idx + 1}
                        </td>

                        {/* COMMUNITY LEARNING CENTER */}
                        <td className="py-2.5 px-3.5">
                          <div className="font-bold text-[#002060] text-xs leading-snug">
                            {item.clcName}
                          </div>
                        </td>

                        {/* COMMUNITY LEARNING CENTER CODE */}
                        <td className="py-2.5 px-3 text-center">
                          {item.clcCode ? (
                            <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 inline-block">
                              {item.clcCode}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono select-none">—</span>
                          )}
                        </td>

                        {/* Address */}
                        <td className="py-2.5 px-3.5 text-slate-700 text-xs">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.address || 'Tarlac City'}</span>
                          </div>
                        </td>

                        {/* DISTRICT */}
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 text-[11px] font-extrabold rounded-md bg-sky-50 text-sky-800 border border-sky-200 whitespace-nowrap">
                            {item.district}
                          </span>
                        </td>

                        {/* PUBLIC SCHOOLS' DISTRICT SUPERVISOR */}
                        <td className="py-2.5 px-3.5 text-slate-800 text-xs">
                          {item.psdsSupervisor ? (
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{item.psdsSupervisor}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300 select-none">—</span>
                          )}
                        </td>

                        {/* CATEGORY */}
                        <td className="py-2.5 px-3.5 text-slate-700 text-xs">
                          <span className="font-medium">{item.category || '—'}</span>
                        </td>

                        {/* TYPE */}
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                            {item.type || '—'}
                          </span>
                        </td>

                        {/* MODALITY */}
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                            {item.modality || '—'}
                          </span>
                        </td>

                        {/* PROGRAM */}
                        <td className="py-2.5 px-3.5 text-slate-600 text-xs leading-snug">
                          {item.program || '—'}
                        </td>

                        {/* NAME OF TEACHER */}
                        <td className="py-2.5 px-3.5">
                          <button
                            onClick={() => onSelectTeacher(item.teacherName)}
                            className="text-left font-bold text-[#002060] hover:text-blue-700 hover:underline flex items-center gap-1.5 cursor-pointer text-xs group"
                            title={`View ${item.teacherName}'s weekly schedule matrix`}
                          >
                            <User className="w-3.5 h-3.5 text-blue-600 shrink-0 group-hover:scale-110 transition" />
                            <span className="uppercase tracking-tight">{item.teacherName || 'Unassigned'}</span>
                          </button>
                        </td>

                        {/* Contact Number */}
                        <td className="py-2.5 px-3 text-center">
                          {item.contactNumber ? (
                            <a
                              href={`tel:${item.contactNumber}`}
                              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition"
                              title={`Call ${item.contactNumber}`}
                            >
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{item.contactNumber}</span>
                            </a>
                          ) : (
                            <span className="text-slate-300 font-mono select-none">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Showing <strong className="text-slate-800">{filteredClcItems.length}</strong> of <strong className="text-slate-800">{clcItems.length}</strong> Community Learning Centers
              {selectedDistrictFilter !== 'all' && (
                <span> in District <strong className="text-slate-800">{selectedDistrictFilter}</strong></span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span>Source: Google Sheets GID <strong>279279947</strong></span>
              <span>•</span>
              <span>DepEd SDO Tarlac City ALS</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Official Consolidated Schedule Print Preview Modal */}
      {isConsolidatedPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-[#002060] text-white flex items-center justify-between border-b border-blue-900">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-sky-300" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    Official Consolidated Master Schedule Preview (A4 Landscape)
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    DepEd SDO Tarlac City • Alternative Learning System SY 2026–2027
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConsolidatedPrintModalOpen(false)}
                className="p-1.5 text-blue-200 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Document Body Preview */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-300 max-w-4xl w-full text-xs">
                <div dangerouslySetInnerHTML={{ __html: generateConsolidatedHtml() }} />
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Compliant with DepEd Order No. 005, s. 2024 & Magna Carta for Public School Teachers.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsConsolidatedPrintModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveConsolidatedPdf}
                  disabled={isGeneratingConsolidatedPdf}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isGeneratingConsolidatedPdf ? 'Generating PDF...' : 'Download PDF'}
                </button>
                <button
                  onClick={handlePrintConsolidated}
                  className="px-4 py-2 bg-[#002060] hover:bg-[#001848] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  Print Masterlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
