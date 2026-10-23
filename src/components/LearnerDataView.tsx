/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  Filter, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Phone, 
  Calendar, 
  User, 
  FileText, 
  RefreshCw, 
  Database,
  MapPin,
  HelpCircle,
  Clock,
  Briefcase,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Printer,
  CheckCircle,
  ExternalLink,
  Download,
  Copy,
  Info,
  Search
} from 'lucide-react';
import { LearnerRecord, formatDistrictName, formatDateOfBirth, formatDateMapped } from '../types';
import { exportElementToPdf, printHtmlViaIframe } from '../utils/pdfExport';
import { DEPED_LOGO_BASE64 } from '../assets/deped_logo_base64';
import { barangayGids, fillRecordDefaults } from '../data/alsData';
import { syncGoogleSheetToFirestore } from '../services/firestoreSyncService';
import { 
  calculateCurrentAge, 
  MASTERLIST_PRINT_COLUMNS, 
  getDefaultPrintColumnSelection 
} from '../utils/printColumns';

export const BASELINE_LITERACY_MAPPING_SHEET_ID = '1Z-GsOOh5DV5CSilR7AZFZX_s1K1ktvC7sVVgFcJR3o0';
export const CLASS_PROGRAM_SHEET_ID = '1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc';
export const SERVICE_ACCOUNT_EMAIL = 'datasphere-core-engine@gen-lang-client-0675008110.iam.gserviceaccount.com';

/**
 * Normalizes and compares barangay names to ensure robust matching across different casing,
 * punctuation, and roman vs arabic numerals (e.g. "Balibago I" vs "Balibago 1").
 */
export function isSameBarangay(bg1?: string, bg2?: string): boolean {
  if (!bg1 || !bg2) return false;
  const clean = (s: string) => s.toLowerCase().trim()
    .replace(/^brgy\.?\s*/i, '')
    .replace(/^barangay\s*/i, '')
    .replace(/\bsto\.?\s*/g, 'santo')
    .replace(/\bsta\.?\s*/g, 'santa')
    .replace(/[^a-z0-9]/g, '');
  const c1 = clean(bg1);
  const c2 = clean(bg2);
  if (c1 === c2) return true;
  // Handle roman numerals vs numbers e.g. "balibagoi" vs "balibago1", "cutcuti" vs "cutcut1"
  const numNormalize = (s: string) => s
    .replace(/ii$/i, '2')
    .replace(/i$/i, '1');
  return numNormalize(c1) === numNormalize(c2);
}

/**
 * Safely compares two record numbers following numerical sequence order.
 * Follows the order of numbering in "RECORD NUMBER".
 * Examples: "AGU-001" vs "AGU-002", "1" vs "2", "ALV-1" vs "ALV-10", "REC-09" vs "REC-10".
 */
export function compareRecordNumbers(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const strA = String(a).trim();
  const strB = String(b).trim();

  // 1. Direct numeric comparison if both are pure numbers (e.g. "1" vs "10")
  const numA = Number(strA);
  const numB = Number(strB);
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }

  // 2. Extract numeric sequences (e.g. "AGU-001" vs "AGU-002", "REC-1" vs "REC-10")
  const matchA = strA.match(/\d+/g);
  const matchB = strB.match(/\d+/g);

  if (matchA && matchB) {
    const lastNumA = parseInt(matchA[matchA.length - 1], 10);
    const lastNumB = parseInt(matchB[matchB.length - 1], 10);
    if (!isNaN(lastNumA) && !isNaN(lastNumB) && lastNumA !== lastNumB) {
      return lastNumA - lastNumB;
    }
  }

  // 3. Fallback to natural alphanumeric sort
  return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Resolves the numeric order displayed in the "Order" column based on "RECORD NUMBER".
 * Follows the order of numbering in "RECORD NUMBER", display in "Order".
 * E.g., "AGU-001" -> 1, "002" -> 2, "15" -> 15. If no numeric suffix, falls back to index + 1.
 */
export function getOrderNumberFromRecordNumber(recNum?: string, fallbackIdx: number = 0): number | string {
  if (!recNum || String(recNum).trim() === '' || String(recNum).trim() === '—') {
    return fallbackIdx + 1;
  }
  const str = String(recNum).trim();
  const num = Number(str);
  if (!isNaN(num) && num > 0) {
    return num;
  }
  const matches = str.match(/\d+/g);
  if (matches && matches.length > 0) {
    const lastDigits = matches[matches.length - 1];
    const parsed = parseInt(lastDigits, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return fallbackIdx + 1;
}

/**
 * Resolves the preferred ALS program name for AF1 and Literacy Mapping displays.
 * If "Yes" was marked in raw survey entries, smartly infers the correct ALS program.
 */
export function getLearnerPreferredProgram(l: LearnerRecord): string {
  const pref = (l.preferredProgram || '').trim();
  const prog = (l.program || '').trim();
  if (pref && pref.toLowerCase() !== 'yes' && pref !== '—') {
    return pref;
  }
  if (prog && prog.toLowerCase() !== 'yes' && prog !== '—') {
    return prog;
  }
  if (l.lastGradeLevelCompleted) {
    const grade = l.lastGradeLevelCompleted.toLowerCase();
    if (grade.includes('secondary') || grade.includes('grade 7') || grade.includes('grade 8') || grade.includes('grade 9') || grade.includes('grade 10') || grade.includes('grade 11') || grade.includes('grade 12') || grade.includes('high school') || grade.includes('jhs') || grade.includes('shs')) {
      return 'A&E Secondary';
    }
    if (grade.includes('elem') || grade.includes('grade 1') || grade.includes('grade 2') || grade.includes('grade 3') || grade.includes('grade 4') || grade.includes('grade 5') || grade.includes('grade 6')) {
      return 'A&E Elementary';
    }
    if (grade.includes('basic') || grade.includes('literacy') || grade.includes('blp')) {
      return 'Basic Literacy';
    }
  }
  return pref || prog || 'A&E Secondary';
}

/**
 * Accurately computes learner's age dynamically against the current, present date.
 * Automatically accounts for month and day differences to guarantee updated, live age.
 */
export function computeCurrentAge(dob?: string | null, fallbackAge?: number | string | null): number | string {
  if (!dob) {
    if (fallbackAge !== undefined && fallbackAge !== null && fallbackAge !== '' && fallbackAge !== '—') {
      const parsed = Number(fallbackAge);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return '—';
  }
  
  const cleanDob = String(dob).trim();
  if (!cleanDob || cleanDob === '-' || cleanDob.toLowerCase() === 'n/a') {
    if (fallbackAge !== undefined && fallbackAge !== null && fallbackAge !== '' && fallbackAge !== '—') {
      const parsed = Number(fallbackAge);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return '—';
  }

  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];
  let birthDate: Date | null = null;

  // 1. Verbal format "Month Day, Year" or "August 05, 1990"
  const verbalRegex = /^([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})$/;
  const verbalMatch = cleanDob.match(verbalRegex);
  if (verbalMatch) {
    const mName = verbalMatch[1].toLowerCase();
    const mIdx = months.findIndex(m => m.startsWith(mName.slice(0, 3)));
    if (mIdx !== -1) {
      birthDate = new Date(parseInt(verbalMatch[3], 10), mIdx, parseInt(verbalMatch[2], 10));
    }
  }

  // 2. Hyphen format "YYYY-MM-DD" or "MM-DD-YYYY" or "DD-MM-YYYY"
  if (!birthDate && cleanDob.includes('-')) {
    const parts = cleanDob.split('-');
    if (parts.length === 3) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);
      if (parts[0].length === 4 && !isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        birthDate = new Date(p0, p1 - 1, p2);
      } else if (parts[2].length === 4 && !isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        if (p0 <= 12) birthDate = new Date(p2, p0 - 1, p1);
        else birthDate = new Date(p2, p1 - 1, p0);
      }
    }
  }

  // 3. Slash format "MM/DD/YYYY" or "YYYY/MM/DD"
  if (!birthDate && cleanDob.includes('/')) {
    const parts = cleanDob.split('/');
    if (parts.length === 3) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);
      if (parts[2].length === 4 && !isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        if (p0 <= 12) birthDate = new Date(p2, p0 - 1, p1);
        else birthDate = new Date(p2, p1 - 1, p0);
      } else if (parts[0].length === 4 && !isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        birthDate = new Date(p0, p1 - 1, p2);
      }
    }
  }

  // 4. Native Date fallback
  if (!birthDate || isNaN(birthDate.getTime())) {
    const d = new Date(cleanDob);
    if (!isNaN(d.getTime())) {
      birthDate = d;
    }
  }

  if (birthDate && !isNaN(birthDate.getTime())) {
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    if (calculatedAge >= 0 && calculatedAge < 130) {
      return calculatedAge;
    }
  }

  if (fallbackAge !== undefined && fallbackAge !== null && fallbackAge !== '' && fallbackAge !== '—') {
    const parsed = Number(fallbackAge);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return '—';
}

export interface MasterlistDisplayColumnConfig {
  id: string;
  label: string;
  align: 'left' | 'center';
  widthStyle?: string;
}

export const MASTERLIST_COLUMNS_CONFIG: MasterlistDisplayColumnConfig[] = [
  { id: 'orderNo', label: 'Order No.', align: 'center', widthStyle: '0.8cm' },
  { id: 'recordNumber', label: 'Record Number', align: 'center', widthStyle: '1.2cm' },
  { id: 'lastName', label: 'Last Name', align: 'left', widthStyle: '1.5cm' },
  { id: 'firstName', label: 'First Name', align: 'left', widthStyle: '1.5cm' },
  { id: 'middleName', label: 'Middle Name', align: 'left', widthStyle: '1.2cm' },
  { id: 'gender', label: 'Gender', align: 'center', widthStyle: '0.9cm' },
  { id: 'dateOfBirth', label: 'Date of Birth', align: 'left', widthStyle: '1.8cm' },
  { id: 'age', label: 'Age', align: 'center', widthStyle: '0.8cm' },
  { id: 'motherTongue', label: 'Mother Tongue', align: 'left', widthStyle: '1.3cm' },
  { id: 'indigenousPeople', label: 'Indigenous People (Yes/No)', align: 'center', widthStyle: '1.6cm' },
  { id: 'religion', label: 'Religion', align: 'left', widthStyle: '1.2cm' },
  { id: 'houseNo', label: 'HOUSE NO.', align: 'left', widthStyle: '1.0cm' },
  { id: 'street', label: 'Street', align: 'left', widthStyle: '1.3cm' },
  { id: 'barangay', label: 'Barangay', align: 'left', widthStyle: '1.3cm' },
  { id: 'city', label: 'City', align: 'left', widthStyle: '1.2cm' },
  { id: 'province', label: 'Province', align: 'left', widthStyle: '1.1cm' },
  { id: 'fatherName', label: 'Name of Father (Last Name, First Name, Middle Name)', align: 'left', widthStyle: '2.5cm' },
  { id: 'motherName', label: 'Name of Mother (Last Name, First Name, Middle Name)', align: 'left', widthStyle: '2.5cm' },
  { id: 'contactNumber', label: 'Contact Number', align: 'left', widthStyle: '1.5cm' },
  { id: 'lastGradeLevelCompleted', label: 'LAST GRADE LEAVEL COMPLETED IN FORMAL SCHOOL', align: 'left', widthStyle: '2.2cm' },
  { id: 'dateMapped', label: 'Date Mapped (mm/dd/yyyy)', align: 'center', widthStyle: '1.3cm' },
  { id: 'interestedInALS', label: 'Interested in ALS Program (Yes/No)', align: 'center', widthStyle: '1.3cm' },
  { id: 'preferredProgram', label: 'If Yes, Preferred Program', align: 'left', widthStyle: '1.5cm' },
  { id: 'enrolledInAls', label: 'ENROLLED IN ALS', align: 'center', widthStyle: '1.1cm' },
  { id: 'dateOfFirstAttendance', label: 'IF ALREADY ENROLLED IN ALS, PROVIDED DATE OF FIRST ATTENDANCE', align: 'center', widthStyle: '2.2cm' },
  { id: 'reasonsForNotAttending', label: 'Reasons for Not Attending, Stopping, or Dropping Out of Formal Schooling', align: 'left', widthStyle: '2.5cm' },
  { id: 'alsCertificationStatus', label: 'ALS Certification and Completion Status', align: 'left', widthStyle: '2.0cm' }
];

export const BARANGAY_LIST_WITH_GIDS = [
  { name: 'Aguso', gid: '1420984178' },
  { name: 'Alvindia', gid: '1177426590' },
  { name: 'Amucao', gid: '1128262418' },
  { name: 'Armenia', gid: '140528583' },
  { name: 'Asturias', gid: '1620350667' },
  { name: 'Atioc', gid: '1591476287' },
  { name: 'Balanti', gid: '1994498169' },
  { name: 'Balete', gid: '390652637' },
  { name: 'Balibago I', gid: '950417836' },
  { name: 'Balibago II', gid: '1568112947' },
  { name: 'Balingcanaway', gid: '37686490' },
  { name: 'Banaba', gid: '894841331' },
  { name: 'Bantog', gid: '1730282470' },
  { name: 'Baras-Baras', gid: '1276684070' },
  { name: 'Batang-Batang', gid: '1222633096' },
  { name: 'Binauganan', gid: '1311238089' },
  { name: 'Bora', gid: '1819181282' },
  { name: 'Buenavista', gid: '1449529608' },
  { name: 'Buhilit', gid: '899247425' },
  { name: 'Burot', gid: '1093408926' },
  { name: 'Calingcuan', gid: '1517430457' },
  { name: 'Capehan', gid: '1762482242' },
  { name: 'Carangian', gid: '153841883' },
  { name: 'Care', gid: '197909116' },
  { name: 'Central', gid: '1513518253' },
  { name: 'Culipat', gid: '1614630804' },
  { name: 'Cut Cut I', gid: '183734870' },
  { name: 'Cut Cut II', gid: '561791877' },
  { name: 'Dalayap', gid: '169358221' },
  { name: 'Dela Paz', gid: '1008581392' },
  { name: 'Dolores', gid: '1107281292' },
  { name: 'Laoang', gid: '1559799693' },
  { name: 'Ligtasan', gid: '1967098992' },
  { name: 'Lourdes', gid: '1448349702' },
  { name: 'Mabini', gid: '2099060218' },
  { name: 'Maligaya', gid: '1643024082' },
  { name: 'Maliwalo', gid: '205442069' },
  { name: 'Mapalacsiao', gid: '108346015' },
  { name: 'Mapalad', gid: '648348564' },
  { name: 'Matatalaib', gid: '1171094375' },
  { name: 'Paraiso', gid: '304729035' },
  { name: 'Poblacion', gid: '616175080' },
  { name: 'Salapungan', gid: '2005542006' },
  { name: 'San Carlos', gid: '1070873009' },
  { name: 'San Francisco', gid: '1574228210' },
  { name: 'San Isidro', gid: '626497509' },
  { name: 'San Jose', gid: '230887233' },
  { name: 'San Jose De Urquico', gid: '211306950' },
  { name: 'San Juan Bautista', gid: '1580779889' },
  { name: 'San Juan De Mata', gid: '1557061591' },
  { name: 'San Luis', gid: '407316572' },
  { name: 'San Miguel', gid: '1602550268' },
  { name: 'San Manuel', gid: '319138086' },
  { name: 'San Nicolas', gid: '147216439' },
  { name: 'San Pablo', gid: '991380775' },
  { name: 'San Pascual', gid: '643556810' },
  { name: 'San Rafael', gid: '174468144' },
  { name: 'San Roque', gid: '143322848' },
  { name: 'San Sebastian', gid: '2027681779' },
  { name: 'San Vicente', gid: '1574585180' },
  { name: 'Santa Cruz', gid: '1268697426' },
  { name: 'Santa Maria', gid: '1217355021' },
  { name: 'Sto. Cristo', gid: '896016426' },
  { name: 'Sto. Domingo', gid: '2028717688' },
  { name: 'Sto. Nino', gid: '157317607' },
  { name: 'Sapang Tagalog', gid: '915969212' },
  { name: 'Sapang Maragul', gid: '1149506706' },
  { name: 'Sepung Calzada', gid: '1568552552' },
  { name: 'Sinait', gid: '1879142578' },
  { name: 'Suizo', gid: '1148124938' },
  { name: 'Tariji', gid: '1244741725' },
  { name: 'Tibagan', gid: '221027565' },
  { name: 'Tibag', gid: '1955731841' },
  { name: 'Trinidad', gid: '1072886762' },
  { name: 'Ungot', gid: '916343598' },
  { name: 'Villa Bacolor', gid: '706883358' },
  { name: 'Baras Baras BJMP Male Dorm', gid: '484086484' },
  { name: 'Baras Baras BJMP Female Dorm', gid: '1120058691' }
];

interface LearnerDataViewProps {
  selectedDistrict: string;
  learners: LearnerRecord[];
  onAddLearner: (learner: LearnerRecord) => void;
  onUpdateLearner: (id: string, updatedFields: Partial<LearnerRecord>) => void;
  onDeleteLearner: (id: string) => void;
  onSetLearners?: React.Dispatch<React.SetStateAction<LearnerRecord[]>>;
  forceShowAddForm?: boolean;
  isAf1Mode?: boolean;
  customTitle?: string;
}

export function LearnerDataView({
  selectedDistrict,
  learners,
  onAddLearner,
  onUpdateLearner,
  onDeleteLearner,
  onSetLearners,
  forceShowAddForm = false,
  isAf1Mode = false,
  customTitle
}: LearnerDataViewProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [barangayFilter, setBarangayFilter] = useState<string>('all');

  // Sub-tabs for Learner List View: Masterlist vs QuickCount live summary
  const [subTab, setSubTab] = useState<'masterlist' | 'quickcount'>('masterlist');
  const [quickCountTeacher, setQuickCountTeacher] = useState<string>('MELODY ANNE B. AQUINO');
  const [quickCountRows, setQuickCountRows] = useState<any[]>([]);
  const [quickCountLoading, setQuickCountLoading] = useState<boolean>(false);
  const [quickCountError, setQuickCountError] = useState<string>('');

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Columns to be displayed in the print output state
  const [selectedPrintColumns, setSelectedPrintColumns] = useState<Record<string, boolean>>(getDefaultPrintColumnSelection);

  const handleSelectAllPrintColumns = () => {
    const updated: Record<string, boolean> = {};
    MASTERLIST_PRINT_COLUMNS.forEach(col => { updated[col.id] = true; });
    setSelectedPrintColumns(updated);
  };

  const handleDeselectAllPrintColumns = () => {
    const updated: Record<string, boolean> = {};
    MASTERLIST_PRINT_COLUMNS.forEach(col => { updated[col.id] = false; });
    setSelectedPrintColumns(updated);
  };

  const handleResetDefaultPrintColumns = () => {
    setSelectedPrintColumns(getDefaultPrintColumnSelection());
  };

  const visiblePrintColumns = useMemo(() => {
    return MASTERLIST_PRINT_COLUMNS.filter(col => selectedPrintColumns[col.id]);
  }, [selectedPrintColumns]);

  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollTable = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      tableContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  // Helper to transform Google Drive viewer links to direct rendering streams
  const getGoogleDriveDirectLink = (url: string) => {
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
    }
    return url;
  };

  const generateMasterlistPrintHtml = () => {
    const depedLogoUrl = DEPED_LOGO_BASE64;
    const alsLogoUrl = getGoogleDriveDirectLink('https://drive.google.com/file/d/1RMiZninylXhyjgIjOKQC_9F7trv8EuQm/view?usp=drive_link');

    const rowsHtml = filteredLearners.map((l, idx) => {
      const bdateStr = l.dateOfBirth || l.birthdate || '';
      if (isAf1Mode) {
        return '<tr>' +
          '<td style="font-family: monospace; text-align: center;">' + (l.recordNumber || '—') + '</td>' +
          '<td style="font-weight: bold;">' + (l.lastName || '—') + '</td>' +
          '<td>' + (l.firstName || '—') + '</td>' +
          '<td>' + (l.middleName || '—') + '</td>' +
          '<td style="text-align: center;">' + (l.gender || l.sex || '—') + '</td>' +
          '<td style="text-align: left; white-space: nowrap; font-family: monospace;">' + (bdateStr ? formatDateOfBirth(bdateStr) : '—') + '</td>' +
          '<td style="text-align: center; font-weight: bold;">' + calculateCurrentAge(bdateStr, l.age) + '</td>' +
          '<td style="font-family: monospace; white-space: nowrap;">' + (l.contactNumber || l.contact || '—') + '</td>' +
          '<td style="text-align: center; font-weight: bold;">' + (l.interestedInALS || 'Yes') + '</td>' +
          '<td style="text-align: center; font-weight: bold;">' + getLearnerPreferredProgram(l) + '</td>' +
        '</tr>';
      }

      const isEnrolled = l.enrolledInAls === 'Yes' || l.status === 'Enrolled' || !!l.dateOfFirstAttendance;
      const targetCols = visiblePrintColumns.length > 0 ? visiblePrintColumns : MASTERLIST_PRINT_COLUMNS;
      return '<tr>' + targetCols.map(col => col.renderHtml(l, idx, isEnrolled)).join('') + '</tr>';
    }).join('');

    const targetCols = visiblePrintColumns.length > 0 ? visiblePrintColumns : MASTERLIST_PRINT_COLUMNS;
    const headerColsHtml = isAf1Mode ? [
      '<th style="width: 70px;">Record Number</th>',
      '<th style="width: 80px;">Last Name</th>',
      '<th style="width: 80px;">First Name</th>',
      '<th style="width: 80px;">Middle Name</th>',
      '<th style="width: 45px;">Gender</th>',
      '<th style="width: 75px; text-align: left;">Date of Birth</th>',
      '<th style="width: 35px;">Age</th>',
      '<th style="width: 2.2cm; min-width: 2.2cm; max-width: 2.2cm;">Contact Number</th>',
      '<th style="width: 2cm;">Interested in ALS Program (Yes/No)</th>',
      '<th style="width: 100px;">If Yes, Preferred Program</th>'
    ].join('\n') : targetCols.map(col => (
      '<th style="' + (col.align === 'center' ? 'text-align: center;' : col.align === 'right' ? 'text-align: right;' : 'text-align: left;') + (col.width ? ' width: ' + col.width + ';' : '') + '">' + col.label + '</th>'
    )).join('');

    return `
      <style>
        @page {
          size: A4 landscape;
          margin: 0.5cm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 0;
          font-size: 7pt;
          line-height: 1.25;
          background: #ffffff;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
          border: none !important;
        }
        .header-table td {
          border: none !important;
          padding: 2px;
          vertical-align: middle;
        }
        .deped-logo {
          height: 48px;
          width: auto;
          object-fit: contain;
        }
        .als-logo {
          height: 48px;
          width: auto;
          object-fit: contain;
        }
        .title-section {
          text-align: center;
        }
        .title-section .republic {
          font-size: 8pt;
          margin: 0;
          color: #475569;
          font-family: Georgia, serif;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .title-section .division {
          font-size: 9pt;
          margin: 1px 0;
          color: #0f172a;
          font-family: Georgia, serif;
          font-weight: 800;
          text-transform: uppercase;
        }
        .title-section .main-title {
          font-size: 11pt;
          margin: 2px 0 0 0;
          color: #002B6D;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .meta-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8pt;
          color: #1e293b;
          border-top: 1.5px solid #cbd5e1;
          border-bottom: 2px solid #002B6D;
          padding: 4px 6px;
          margin-bottom: 8px;
          background: #f8fafc;
        }
        .meta-info strong {
          color: #002B6D;
          font-weight: 800;
        }
        table.data-table {
          width: 100% !important;
          border-collapse: collapse !important;
          font-size: 6.5pt;
          page-break-inside: auto;
          border: 1px solid #94a3b8;
          table-layout: fixed;
          word-wrap: break-word;
        }
        table.data-table thead {
          display: table-header-group !important;
        }
        table.data-table tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        table.data-table th {
          background-color: #002B6D !important;
          color: #ffffff !important;
          font-weight: 800;
          text-transform: uppercase;
          border: 1px solid #64748b;
          padding: 3.5px 2px;
          font-size: 6pt;
          text-align: center;
          vertical-align: middle;
          letter-spacing: 0.2px;
        }
        table.data-table td {
          border: 1px solid #cbd5e1;
          padding: 3px 2px;
          font-size: 6pt;
          word-break: break-word;
          vertical-align: middle;
        }
        table.data-table tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .signature-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 18px;
          border: none !important;
          page-break-inside: avoid;
        }
        .signature-table td {
          border: none !important;
          padding: 0;
          vertical-align: top;
        }
        .sig-block {
          width: 240px;
        }
        .sig-role {
          font-size: 7.5pt;
          color: #64748b;
          margin-bottom: 30px;
        }
        .sig-name {
          font-size: 8.5pt;
          font-weight: 900;
          text-transform: uppercase;
          color: #0f172a;
          border-bottom: 1.5px solid #0f172a;
          padding-bottom: 2px;
          display: inline-block;
          min-width: 200px;
        }
        .sig-title {
          font-size: 7.5pt;
          font-weight: 700;
          color: #475569;
          margin-top: 3px;
        }
        .footer {
          margin-top: 16px;
          font-size: 6.5pt;
          color: #94a3b8;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 6px;
        }
      </style>

      <div style="text-align: center; margin-bottom: 10px; border-bottom: 2px solid #0f172a; padding-bottom: 8px;">
        <div style="text-align: center; margin: 0 auto 8px auto;">
          <div style="display: inline-flex; align-items: center; justify-content: center; gap: 20px; margin: 0 auto; text-align: center;">
            <img src="${depedLogoUrl}" class="deped-logo" alt="DepEd Logo" style="height: 50px; width: auto; object-fit: contain; vertical-align: middle;" />
            <img src="${alsLogoUrl}" class="als-logo" alt="ALS Logo" style="height: 50px; width: auto; object-fit: contain; vertical-align: middle;" />
          </div>
        </div>
        <p class="republic" style="font-size: 8pt; margin: 0; color: #475569; font-family: Georgia, serif; font-weight: bold; text-transform: uppercase; text-align: center;">Republic of the Philippines. Department of Education. Region III</p>
        <p class="division" style="font-size: 9pt; margin: 2px 0; color: #0f172a; font-family: Georgia, serif; font-weight: 800; text-transform: uppercase; text-align: center;">Schools Division Office of Tarlac City. District of Tarlac City</p>
        <h1 class="main-title" style="font-size: 11pt; margin: 3px 0; color: #002B6D; font-weight: 900; text-transform: uppercase; text-align: center;">${customTitle ? customTitle.toUpperCase() : "Alternative Learning System (ALS) Literacy Mapping Master Registry"}</h1>
        <div style="text-align: center; font-size: 8pt; color: #1e293b; border-top: 1px solid #cbd5e1; padding-top: 4px; margin-top: 6px; line-height: 1.45;">
          <div style="text-align: center;"><strong>Division:</strong> Tarlac City Schools Division</div>
          <div style="text-align: center;"><strong>Barangay:</strong> ${activeSyncBarangay || 'Aguso'}</div>
          <div style="text-align: center;"><strong>Total Records:</strong> ${filteredLearners.length} Mapped Learners</div>
          <div style="text-align: center; color: #002B6D; font-weight: 800;"><strong>Format:</strong> A4 Landscape</div>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            ${headerColsHtml}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="27" style="text-align: center; padding: 20px; color: #94a3b8;">No records mapped for this barangay.</td></tr>'}
        </tbody>
      </table>

      <table class="signature-table">
        <tr>
          <td style="width: 50%;">
            <div class="sig-block">
              <div class="sig-role">Prepared by:</div>
              <div class="sig-name">ELMER V. FABROS</div>
              <div class="sig-title">Education Program Specialist II - ALS</div>
            </div>
          </td>
          <td style="width: 50%; text-align: right;">
            <div class="sig-block" style="margin-left: auto;">
              <div class="sig-role" style="text-align: right;">Checked by:</div>
              <div class="sig-name" style="text-align: center;">RENE B. MICLAT, PhD</div>
              <div class="sig-title" style="text-align: right;">PSDS / Division ALS Coordinator</div>
            </div>
          </td>
        </tr>
      </table>

      <div class="footer">
        Department of Education • Schools Division Office of Tarlac City • Alternative Learning System (ALS) DataSphere • Formatted in A4 Landscape
      </div>
    `;
  };

  const handleExecutePrint = () => {
    window.print();
  };

  const handleDirectPrint = () => {
    if (!isPrintModalOpen) {
      setIsPrintModalOpen(true);
      setTimeout(() => {
        window.print();
      }, 50);
    } else {
      window.print();
    }
  };

  const handleSaveAsPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById('masterlist-pdf-document');
      if (!element) {
        window.print();
        return;
      }

      const pdfBaseName = (customTitle || 'Official_Learner_Masterlist').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${pdfBaseName}_${activeSyncBarangay.replace(/[^a-zA-Z0-9]/g, '_')}_A4_Landscape.pdf`;
      const success = await exportElementToPdf({
        element,
        filename,
        orientation: 'landscape',
        format: 'a4',
        margin: [5, 5, 5, 5],
        scale: 1.5,
        multiPage: true
      });

      if (!success) {
        window.print();
      }
    } catch (err) {
      console.warn('PDF export fallback to browser print/save-as-pdf:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredLearners.length === 0) {
      alert("No learner records available to export.");
      return;
    }

    const headers = isAf1Mode ? [
      "Record Number",
      "Last Name",
      "First Name",
      "Middle Name",
      "Gender",
      "Date of Birth",
      "Age",
      "Contact Number",
      "Interested in ALS Program (Yes/No)",
      "If Yes, Preferred Program"
    ] : [
      "Order",
      "Record Number",
      "Last Name",
      "First Name",
      "Middle Name",
      "Gender",
      "Date of Birth",
      "Age",
      "Mother Tongue",
      "Indigenous People (Yes/No)",
      "Religion",
      "House No.",
      "Street",
      "Barangay",
      "City",
      "Province",
      "Name of Father (Last Name, First Name, Middle Name)",
      "Name of Mother (Last Name, First Name, Middle Name)",
      "Contact Number",
      "Last Grade Level Completed in Formal School",
      "Date Mapped (mm/dd/yyyy)",
      "Interested in ALS Program (Yes/No)",
      "If Yes, Preferred Program",
      "Enrolled in ALS",
      "If already enrolled in ALS, provide date of first attendance",
      "Reasons for Not Attending, Stopping, or Dropping Out of Formal Schooling",
      "ALS Certification and Completion Status"
    ];

    const escapeCSV = (str: any) => {
      const val = str === null || str === undefined ? '' : String(str).trim();
      if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvRows = [headers.map(h => escapeCSV(h)).join(',')];

    filteredLearners.forEach((l, idx) => {
      const bdateStr = l.dateOfBirth || l.birthdate || '';
      if (isAf1Mode) {
        const rowData = [
          l.recordNumber || '',
          l.lastName || '',
          l.firstName || '',
          l.middleName || '',
          l.gender || l.sex || 'Male',
          bdateStr ? formatDateOfBirth(bdateStr) : '',
          l.age !== undefined && l.age !== null ? String(l.age) : '',
          l.contactNumber || l.contact || '',
          l.interestedInALS || 'Yes',
          getLearnerPreferredProgram(l)
        ];
        csvRows.push(rowData.map(escapeCSV).join(','));
        return;
      }

      const isEnrolled = l.enrolledInAls === 'Yes' || l.status === 'Enrolled' || !!l.dateOfFirstAttendance;
      const enrolledVal = isEnrolled ? 'Yes' : 'No';
      const mappedDateStr = l.dateMapped || '';
      const ipStatusStr = l.indigenousPeople || l.isIP || 'No';

      const rowData = [
        String(getOrderNumberFromRecordNumber(l.recordNumber, idx)),
        l.recordNumber || '',
        l.lastName || '',
        l.firstName || '',
        l.middleName || '',
        l.gender || l.sex || 'Male',
        bdateStr ? formatDateOfBirth(bdateStr) : '',
        l.age !== undefined && l.age !== null ? String(l.age) : '',
        l.motherTongue || '',
        ipStatusStr,
        l.religion || '',
        l.houseNo || '',
        l.street || l.sitioStreet || '',
        l.barangay || '',
        l.city || l.municipalityCity || 'Tarlac City',
        l.province || 'Tarlac',
        l.fatherName || '',
        l.motherName || '',
        l.contactNumber || l.contact || '',
        l.lastGradeLevelCompleted || l.lastGradeCompleted || '',
        mappedDateStr ? formatDateMapped(mappedDateStr) : '',
        l.interestedInALS || '',
        l.preferredProgram || l.program || '',
        enrolledVal,
        l.dateOfFirstAttendance ? formatDateMapped(l.dateOfFirstAttendance) : '',
        l.reasonsForNotAttending || l.whyNotAttend || '',
        l.alsCertificationStatus || (l.remarks && (l.remarks.toLowerCase().includes('completer') || l.remarks.toLowerCase().includes('graduate') || l.remarks.toLowerCase().includes('passer')) ? l.remarks : '')
      ];

      csvRows.push(rowData.map(escapeCSV).join(','));
    });

    const csvString = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Masterlist_Learners_${(activeSyncBarangay || 'Tarlac_City').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const scrollToSection = (section: 'start' | 'demographics' | 'location' | 'family' | 'status' | 'end') => {
    if (tableContainerRef.current) {
      let scrollPosition = 0;
      switch (section) {
        case 'start':
          scrollPosition = 0;
          break;
        case 'demographics':
          scrollPosition = 450;
          break;
        case 'location':
          scrollPosition = 1000;
          break;
        case 'family':
          scrollPosition = 1600;
          break;
        case 'status':
          scrollPosition = 2300;
          break;
        case 'end':
          scrollPosition = 3200;
          break;
      }
      tableContainerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  };

  // API sync states
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    const saved = localStorage.getItem('literacyMappingSpreadsheetId') || localStorage.getItem('spreadsheetId');
    if (saved && saved !== CLASS_PROGRAM_SHEET_ID && !saved.includes('1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc')) {
      return saved;
    }
    return BASELINE_LITERACY_MAPPING_SHEET_ID;
  });
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    return localStorage.getItem('appsScriptUrl') || 'https://script.google.com/macros/s/AKfycbzA_aZEgCh_4GKxaS7b98l3zBz-rhwEQp0ZWYZgjdBUMQ5wLSX_aH6mKpo92X7oRMKsIA/exec';
  });
  const [activeSyncBarangay, setActiveSyncBarangay] = useState<string>('Aguso');
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [showSyncConfig, setShowSyncConfig] = useState<boolean>(false);
  const [copiedServiceAccount, setCopiedServiceAccount] = useState<boolean>(false);

  const handleCopyServiceAccount = () => {
    navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
    setCopiedServiceAccount(true);
    setTimeout(() => setCopiedServiceAccount(false), 2500);
  };

  // Google Drive & Sheets Live Integration States
  const [driveSearchQuery, setDriveSearchQuery] = useState<string>('Tarlac City ALS Baseline Data on Literacy Mapping');
  const [driveSearchResults, setDriveSearchResults] = useState<any[]>([]);
  const [driveSearchLoading, setDriveSearchLoading] = useState<boolean>(false);
  const [driveSearchError, setDriveSearchError] = useState<string>('');

  const handleSearchGoogleDrive = async () => {
    setDriveSearchLoading(true);
    setDriveSearchError('');
    try {
      const resp = await fetch(`/api/drive/search?q=${encodeURIComponent(driveSearchQuery)}`);
      if (!resp.ok) {
        throw new Error(`Drive connection exception: status ${resp.status}`);
      }
      const data = await resp.json();
      if (data.status === 'NO_API_KEY') {
        setDriveSearchError("Google Sheets and Drive API key is not mapped. Please ensure GOOGLE_API_KEY is configured.");
        setDriveSearchResults([]);
      } else {
        setDriveSearchResults(data.files || []);
        if ((data.files || []).length === 0) {
          setDriveSearchError("No spreadsheet files matching criteria found under this Google Cloud API credentials scope.");
        }
      }
    } catch (err: any) {
      setDriveSearchError(err.message || 'Unknown network error');
      setDriveSearchResults([]);
    } finally {
      setDriveSearchLoading(false);
    }
  };

  // Sync state items to localStorage on change
  React.useEffect(() => {
    localStorage.setItem('literacyMappingSpreadsheetId', spreadsheetId);
  }, [spreadsheetId]);

  React.useEffect(() => {
    localStorage.setItem('appsScriptUrl', appsScriptUrl);
  }, [appsScriptUrl]);

  // List of professional ALS mobile teachers requested in prompt
  const QUICK_COUNT_TEACHERS = [
    "MELODY ANNE B. AQUINO",
    "MERVIN C. CALDOZA",
    "REYNALDO M. DOMINGO JR.",
    "ANGELICA G. CANLAS",
    "RUSSEL M. DIONISIO",
    "RANIELLE PAOLO D. CAPIENDO",
    "JENNY I. DUENAS",
    "CELESTE R. ESPINOSA",
    "ANTONIO B. GUBAN",
    "ARNOLD T. LUMBA",
    "JENNILYN D. MARTINEZ",
    "JUMAR M. MENDOZA",
    "RICARDO S. MORALES",
    "JULIUS C. PANGILINAN",
    "MARIELLA A. PORNILLOSA",
    "HEIZEL P. PANGILINAN",
    "RAMIL H. VALENTINO",
    "JOEL D. BAQUING"
  ];

  // Helper to map columns/headers in QuickCount sheets dynamically
  const mapHeaders = (headerRow: any[]) => {
    const map: Record<string, number> = {};
    if (!headerRow) return map;
    headerRow.forEach((cell, idx) => {
      if (!cell) return;
      const norm = String(cell).toLowerCase().trim();
      if (norm === 'no' || norm === 'no.' || norm === 'num' || norm === 'no. #') map['No'] = idx;
      else if (norm.includes('learning center') || norm.includes('clc') || norm.includes('school')) map['Community Learning Center'] = idx;
      else if (norm === 'male' || norm === 'm') map['Male'] = idx;
      else if (norm === 'female' || norm === 'f') map['Female'] = idx;
      else if (norm === 'total' || norm === 't') map['Total'] = idx;
      else if (norm.includes('average age') || norm.includes('avg age') || norm.includes('age')) map['Average Age'] = idx;
      else if (norm.includes('basic literacy') || norm.includes('blp')) map['Basic Literacy Program'] = idx;
      else if (norm.includes('elementary') || norm.includes('elem')) map['A&E Elementary'] = idx;
      else if (norm.includes('junior high') || norm.includes('jhs') || norm.includes('junior')) map['A&E Junior High School'] = idx;
      else if (norm.includes('senior high') || norm.includes('shs') || norm.includes('senior')) map['Senior High School'] = idx;
      else if (norm.includes('face to face') || norm.includes('f2f') || norm.includes('face')) map['Face to Face'] = idx;
      else if (norm.includes('print')) map['Modular (Print)'] = idx;
      else if (norm.includes('digital') || norm.includes('online')) map['Modular (Digital Online)'] = idx;
      else if (norm.includes('broadcast')) map['Broadcast Instruction'] = idx;
      else if (norm.includes('new learner') || norm === 'new') map['New Learner'] = idx;
      else if (norm.includes('continuing') || norm === 'continuing learner') map['Continuing Learner'] = idx;
      else if (norm.includes('teacher') || norm.includes('instructor')) map['Name of Teacher'] = idx;
    });
    return map;
  };

  const handleFetchQuickCount = async (selectedTeacher: string) => {
    setQuickCountLoading(true);
    setQuickCountError('');
    setQuickCountRows([]);
    try {
      const spreadsheetIdQuery = '1_XHlGABuB2u2NROx2vWQ31WirPUKBs1KsNBgNIwIC2M';
      const response = await fetch(`/api/sheets/fetch?spreadsheetId=${encodeURIComponent(spreadsheetIdQuery)}&tabName=${encodeURIComponent(selectedTeacher)}&_=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`Google Sheets fetch failed with status ${response.status}`);
      }
      const resJson = await response.json();
      if (resJson.success && Array.isArray(resJson.data) && resJson.data.length > 0) {
        const headers = resJson.data[0];
        const headerMap = mapHeaders(headers);
        
        const rows = resJson.data.slice(1).map((row: any[], i: number) => {
          const getV = (colName: string, directIdx: number) => {
            const idx = headerMap[colName] !== undefined ? headerMap[colName] : directIdx;
            return row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : '';
          };

          return {
            no: getV('No', 0) || String(i + 1),
            clc: getV('Community Learning Center', 1),
            male: getV('Male', 2),
            female: getV('Female', 3),
            total: getV('Total', 4),
            avgAge: getV('Average Age', 5),
            blp: getV('Basic Literacy Program', 6),
            aeElem: getV('A&E Elementary', 7),
            aeJhs: getV('A&E Junior High School', 8),
            shs: getV('Senior High School', 9),
            f2f: getV('Face to Face', 10),
            modPrint: getV('Modular (Print)', 11),
            modDigital: getV('Modular (Digital Online)', 12),
            broadcast: getV('Broadcast Instruction', 13),
            newLearner: getV('New Learner', 14),
            contLearner: getV('Continuing Learner', 15),
            teacher: getV('Name of Teacher', 16) || selectedTeacher
          };
        }).filter(r => r.clc && r.clc.toLowerCase() !== 'community learning center' && r.clc !== '—');
        
        setQuickCountRows(rows);
      } else {
        setQuickCountError("No active data rows loaded. Choose another tab or verify headers.");
      }
    } catch (err: any) {
      console.error("Error fetching QuickCount tab:", err);
      setQuickCountError(`Google Sheets Pipeline offline: ${err.message || err}`);
    } finally {
      setQuickCountLoading(false);
    }
  };

  // Auto-fetch active QuickCount sheets when teacher or tab changes
  React.useEffect(() => {
    if (subTab === 'quickcount' && quickCountTeacher) {
      handleFetchQuickCount(quickCountTeacher);
    }
  }, [subTab, quickCountTeacher]);

  // Expanded details record ID state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form states
  const [isAdding, setIsAdding] = useState<boolean>(forceShowAddForm);
  
  // 28 form elements representing literacy mapping scheme (22 basic + 6 geographical/meta columns)
  const [recordNumInput, setRecordNumInput] = useState<string>('');
  const [lastNameInput, setLastNameInput] = useState<string>('');
  const [firstNameInput, setFirstNameInput] = useState<string>('');
  const [middleNameInput, setMiddleNameInput] = useState<string>('');
  const [genderInput, setGenderInput] = useState<'Male' | 'Female'>('Male');
  const [dobInput, setDobInput] = useState<string>('');
  const [ageInput, setAgeInput] = useState<number>(18);
  const [motherTongueInput, setMotherTongueInput] = useState<string>('Kapampangan');
  const [ipInput, setIpInput] = useState<'Yes' | 'No'>('No');
  const [religionInput, setReligionInput] = useState<string>('Roman Catholic');
  const [houseNoInput, setHouseNoInput] = useState<string>('');
  const [streetInput, setStreetInput] = useState<string>('');
  const [barangayInput, setBarangayInput] = useState<string>('Aguso');
  const [cityInput, setCityInput] = useState<string>('Tarlac City');
  const [provinceInput, setProvinceInput] = useState<string>('Tarlac');
  const [fatherNameInput, setFatherNameInput] = useState<string>('');
  const [motherNameInput, setMotherNameInput] = useState<string>('');
  const [contactInput, setContactInput] = useState<string>('');
  const [lastGradeInput, setLastGradeInput] = useState<string>('Grade 6');
  const [dateMappedInput, setDateMappedInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [interestInput, setInterestInput] = useState<'Yes' | 'No'>('Yes');
  const [prefProgramInput, setPrefProgramInput] = useState<string>('A&E Secondary');
  const [firstAttendanceInput, setFirstAttendanceInput] = useState<string>('');
  const [latitudeInput, setLatitudeInput] = useState<string>('');
  const [longitudeInput, setLongitudeInput] = useState<string>('');
  const [staticGeoLocationInput, setStaticGeoLocationInput] = useState<string>('');
  const [reasonsInput, setReasonsInput] = useState<string>('');
  const [reasons2Input, setReasons2Input] = useState<string>('');
  const [alsCertificationStatusInput, setAlsCertificationStatusInput] = useState<string>('BLP Developing Level Completer');
  const [remarksInput, setRemarksInput] = useState<string>('');
  const [mappedByInput, setMappedByInput] = useState<string>('Division Representative');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<LearnerRecord['status']>('Enrolled');
  const [editProgram, setEditProgram] = useState<LearnerRecord['program']>('A&E Secondary');

  // Trigger Google Sheets sync over Express server proxy
  const handleFetchFromGoogleSheet = async (targetBarangay?: string) => {
    const bgToFetch = targetBarangay || activeSyncBarangay;
    setSyncLoading(true);
    setSyncStatus(`Initiating pipeline transfer for ${bgToFetch}...`);
    const gid = barangayGids[bgToFetch] || '0';
    
    try {
      const targetSpreadsheetId = (spreadsheetId && spreadsheetId !== CLASS_PROGRAM_SHEET_ID && !spreadsheetId.includes('1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc'))
        ? spreadsheetId
        : BASELINE_LITERACY_MAPPING_SHEET_ID;
      const queryUrl = `/api/sheets/fetch?spreadsheetId=${encodeURIComponent(targetSpreadsheetId)}&gid=${encodeURIComponent(gid)}&tab=${encodeURIComponent(bgToFetch)}&_=${Date.now()}`;
      
      const response = await fetch(queryUrl);
      if (!response.ok) {
        throw new Error(`HTTP network exception: status ${response.status}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      const importedRecords: LearnerRecord[] = (data.records || []).filter((r: any) => {
        // Discard any erroneous CLC directory rows
        const lName = (r.lastName || '').toLowerCase();
        const fName = (r.firstName || '').toLowerCase();
        return !lName.includes('learning center') && !lName.includes('community based') && !fName.includes('learning center');
      });
      if (importedRecords.length === 0) {
        setSyncStatus(`Sheet connected, but zero pupil rows loaded. Check header formats.`);
        return;
      }
      
      // Inject imported records to the global registry
      const updatedRecords = importedRecords.map((record) => {
        // Classify district based on barangay name mappings
        const districtBBgs = [
          "central", "culipat", "cut cut", "cut-cut", "dalayap", "dela paz", "dolores", "laoang",
          "ligtasan", "lourdes", "mabini", "maligaya", "maliwalo", "mapalacsiao", "mapalad",
          "matatalaib", "paraiso", "poblacion", "salapungan", "san carlos", "san francisco",
          "san isidro", "san jose", "san jose de urquico", "san juan bautista", "san juan de bautista", "san juan de mata",
          "san luis", "san miguel", "san manuel", "san nicolas", "san pablo", "san pascual",
          "san rafael", "san roque", "san sebastian", "san vicente", "santa cruz", "santa maria",
          "sto. cristo", "sto. domingo", "sto. nino", "sapang tagalog", "sapang maragul",
          "sepung calzada", "sinait", "suizo", "tariji", "tibagan", "tibag", "trinidad", "ungot",
          "villa bacolor", "bjmp"
        ];
        
        const bNameLower = (record.barangay || '').toLowerCase();
        const calculatedDistrict = districtBBgs.some(dBg => bNameLower.includes(dBg)) ? 'District B' : 'District A';
        
        return {
          ...record,
          barangayTab: bgToFetch,
          originTab: bgToFetch,
          district: calculatedDistrict
        };
      });

      if (onSetLearners) {
        onSetLearners(prev => {
          const prevArr = Array.isArray(prev) ? prev : [];
          const otherRecords = prevArr.filter(l => {
            const isClc = (l.lastName || '').toLowerCase().includes('learning center') || 
                          (l.lastName || '').toLowerCase().includes('community based') ||
                          (l.name || '').toLowerCase().includes('learning center');
            if (isClc) return false;
            const lTab = l.barangayTab || l.originTab || l.barangay;
            return !isSameBarangay(lTab, bgToFetch);
          });
          return [...updatedRecords, ...otherRecords];
        });
      } else {
        updatedRecords.forEach((record) => {
          onAddLearner(record);
        });
      }

      // Automatically cache and persist Google Sheets records into Cloud Firestore
      syncGoogleSheetToFirestore({
        spreadsheetId: targetSpreadsheetId,
        tabName: bgToFetch,
        gid: gid
      }).then(res => {
        console.log(`[Cloud Firestore] ✅ Synchronized ${res.rowCount} records for tab "${bgToFetch}"`);
      }).catch(err => {
        console.warn(`[Cloud Firestore Sync Notice]`, err.message || err);
      });
      
      setSyncStatus(`Import success: ${importedRecords.length} learner mapping dossier records fetched from Tab: "${bgToFetch}" and synced to Cloud Firestore!`);
    } catch (error: any) {
      console.error(error);
      setSyncStatus(`Import Error: ${error.message || error}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleBarangayChange = (newBg: string) => {
    setActiveSyncBarangay(newBg);
    handleFetchFromGoogleSheet(newBg);
  };

  // Auto-fetch mapping from Google Sheet on mount or tab change if active barangay records are missing, mock-only, or contain erroneous CLC titles
  React.useEffect(() => {
    const currentBarangayRecords = learners.filter(l => {
      const lTab = l.barangayTab || l.originTab || l.barangay;
      return isSameBarangay(lTab, activeSyncBarangay);
    });
    const hasCorruptClcData = currentBarangayRecords.some(l => 
      (l.lastName || '').toLowerCase().includes('learning center') || 
      (l.lastName || '').toLowerCase().includes('community based')
    );
    const isMockOrEmpty = currentBarangayRecords.length === 0 || 
      hasCorruptClcData || 
      currentBarangayRecords.every(l => l.id?.startsWith('ALS-') && !l.id?.includes('sheet') && !l.id?.includes('apps-script'));

    if (isMockOrEmpty) {
      const timer = setTimeout(() => {
        handleFetchFromGoogleSheet(activeSyncBarangay);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeSyncBarangay]);

  // Handle manual addition
  const handleSubmitNewLearner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstNameInput.trim() || !lastNameInput.trim()) return;

    // Classify district based on selected barangay
    let calculatedDistrict = 'District A';
    const centralBgs = ["poblacion", "central", "ligtasan", "mabini", "san nicolas", "san vicente", "cut_cut", "sto._cristo", "lourdes"];
    const districtBBgs = ["san_carlos", "san_francisco", "san_isidro", "san_jose", "san_juan", "san_luis", "san_miguel", "san_manuel", "san_pablo", "san_pascual", "san_rafael", "san_sebastian", "santa_cruz", "santa_maria", "sto._domingo", "sto._nino", "sapang", "sepung", "sinait", "suizo", "tariji", "tibagan", "trinidad", "ungot", "villa_bacolor", "bjmp"];
    const bNameLower = barangayInput.toLowerCase();
    
    if (centralBgs.some(cBg => bNameLower.includes(cBg.replace('_', ' ')))) {
      calculatedDistrict = 'Physical Count of Inventories';
    } else if (districtBBgs.some(dBg => bNameLower.includes(dBg.replace('_', ' ')))) {
      calculatedDistrict = 'District B';
    }

    const calculatedName = `${firstNameInput.trim()} ${middleNameInput.trim() ? middleNameInput.trim() + ' ' : ''}${lastNameInput.trim()}`.trim();
    
    // Program assignment
    let cleanProg: 'Basic Literacy' | 'A&E Elementary' | 'A&E Secondary' = "A&E Secondary";
    if (prefProgramInput.toLowerCase().includes("literacy")) {
      cleanProg = "Basic Literacy";
    } else if (prefProgramInput.toLowerCase().includes("elementary")) {
      cleanProg = "A&E Elementary";
    }

    const newRecord: LearnerRecord = {
      id: `lrn-manual-${Date.now()}`,
      recordNumber: recordNumInput.trim() || String(learners.length + 1),
      lastName: lastNameInput.trim(),
      firstName: firstNameInput.trim(),
      middleName: middleNameInput.trim(),
      gender: genderInput,
      dateOfBirth: dobInput || '2005-01-01',
      age: Number(ageInput) || 18,
      motherTongue: motherTongueInput.trim(),
      indigenousPeople: ipInput,
      religion: religionInput.trim(),
      houseNo: houseNoInput.trim() || 'N/A',
      street: streetInput.trim(),
      barangay: barangayInput,
      city: cityInput.trim() || 'Tarlac City',
      province: provinceInput.trim() || 'Tarlac',
      fatherName: fatherNameInput.trim() || 'Not Mapped',
      motherName: motherNameInput.trim() || 'Not Mapped',
      contactNumber: contactInput.trim() || 'No explicit contact listed',
      lastGradeLevelCompleted: lastGradeInput,
      dateMapped: dateMappedInput,
      interestedInALS: interestInput,
      preferredProgram: prefProgramInput,
      dateOfFirstAttendance: firstAttendanceInput,
      enrolledInAls: firstAttendanceInput ? 'Yes' : 'No',
      latitude: latitudeInput.trim(),
      longitude: longitudeInput.trim(),
      staticGeoLocation: staticGeoLocationInput.trim(),
      reasonsForNotAttending: reasonsInput.trim() || 'Economic barriers',
      reasonsForNotAttending2: reasons2Input.trim() || 'Academic difficulty',
      alsCertificationStatus: alsCertificationStatusInput.trim() || 'BLP Developing Level Completer',
      remarks: remarksInput.trim() || 'Field mapping verified',
      mappedBy: mappedByInput.trim() || 'Division Representative',

      // backward compatibility fields
      name: calculatedName,
      program: cleanProg,
      status: firstAttendanceInput ? 'Enrolled' : (interestInput === 'Yes' ? 'In Processing' : 'On Leave'),
      district: calculatedDistrict,
      contact: contactInput.trim() || 'No explicit contact listed',
      admissionDate: firstAttendanceInput || dateMappedInput
    };

    onAddLearner(newRecord);
    setIsAdding(false);
    
    // Automatically push to Google Sheet via backend proxy if Apps Script URL is configured
    if (appsScriptUrl && appsScriptUrl.trim() !== "") {
      setSyncStatus(`Pushing ${calculatedName} registry to Google Sheet...`);
      fetch('/api/sheets/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appsScriptUrl: appsScriptUrl.trim(),
          record: newRecord
        })
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setSyncStatus(`Sheet Sync: Successfully appended ${calculatedName} to Tab $[${newRecord.barangay}]!`);
        } else {
          setSyncStatus(`Saved locally, but Sheet Sync failed: ${result.error}`);
        }
      })
      .catch(err => {
        console.error("Google Apps Script sync push failure:", err);
        setSyncStatus(`Saved locally, but Sheet Connection timed out: ${err.message || err}`);
      });
    }
    
    // Reset fields
    setRecordNumInput('');
    setLastNameInput('');
    setFirstNameInput('');
    setMiddleNameInput('');
    setContactInput('');
    setReasonsInput('');
    setReasons2Input('');
    setAlsCertificationStatusInput('BLP Developing Level Completer');
    setRemarksInput('');
    setLatitudeInput('');
    setLongitudeInput('');
    setStaticGeoLocationInput('');
    setMappedByInput('Division Representative');
  };

  // Filter and sort records specifically for the active Barangay Tab
  // Follows the order of numbering in "RECORD NUMBER", display in "Order"
  const filteredLearners = useMemo(() => {
    return learners
      .filter((learner) => {
        // Exclude any erroneous CLC directory rows
        const lName = (learner.lastName || '').toLowerCase();
        const fName = (learner.firstName || '').toLowerCase();
        if (lName.includes('learning center') || lName.includes('community based') || fName.includes('learning center')) {
          return false;
        }

        // Strictly match the selected Barangay Tab:
        // If the record was sourced from a specific sheet tab (barangayTab), match against that tab.
        // Otherwise fall back to the record's barangay name.
        const recordTab = learner.barangayTab || learner.originTab || learner.barangay;
        const matchesBarangay = !activeSyncBarangay || isSameBarangay(recordTab, activeSyncBarangay);
        if (!matchesBarangay) return false;

        // Search terms matches Name, Record Number, ID, or Contact
        const matchesSearch = !searchTerm || (
          learner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (learner.contactNumber && learner.contactNumber.includes(searchTerm)) ||
          (learner.id && learner.id.includes(searchTerm)) ||
          (learner.recordNumber && learner.recordNumber.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        // Sub filters if applied
        const matchesProgram = programFilter === 'all' ? true : learner.program === programFilter;
        const matchesStatus = statusFilter === 'all' ? true : learner.status === statusFilter;
        const matchesGender = genderFilter === 'all' ? true : learner.gender === genderFilter;

        // AF1 Identified ALS Learners requirement: Display only the listing having a display "Yes" in the column "If Yes, Preferred Program"
        if (isAf1Mode) {
          const isNoInterest = String(learner.interestedInALS || '').trim().toLowerCase() === 'no';
          const isNoProg = String(learner.preferredProgram || '').trim().toLowerCase() === 'no' ||
                           String(learner.program || '').trim().toLowerCase() === 'no';
          if (isNoInterest || isNoProg) {
            return false;
          }
          const hasInterestOrProgram = String(learner.interestedInALS || '').trim().toLowerCase() === 'yes' ||
                                       String(learner.preferredProgram || '').trim().toLowerCase() === 'yes' ||
                                       Boolean(learner.preferredProgram) ||
                                       Boolean(learner.program);
          if (!hasInterestOrProgram) {
            return false;
          }
        }

        return matchesBarangay && matchesSearch && matchesProgram && matchesStatus && matchesGender;
      })
      .sort((a, b) => {
        const cmp = compareRecordNumbers(a.recordNumber, b.recordNumber);
        if (cmp !== 0) return cmp;
        const nameA = `${a.lastName || ''} ${a.firstName || ''}`;
        const nameB = `${b.lastName || ''} ${b.firstName || ''}`;
        return nameA.localeCompare(nameB);
      });
  }, [learners, activeSyncBarangay, searchTerm, programFilter, statusFilter, genderFilter, isAf1Mode]);

  // Extract all unique barangays available in current filters for subfilter Dropdown
  const uniqueBarangaysInDossier = Array.from(new Set(learners.map(l => l.barangay))).sort();

  return (
    <div className="space-y-6">
      <div className="space-y-6 print:hidden">
      
      {/* SECTION 1: GOOGLE SHEETS LIVE SYNC CONTROLLER PANEL */}
      <div className="bg-gradient-to-r from-slate-900 to-[#0A1F44] text-white p-5 rounded-2xl shadow-md border border-[#1E293B]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="https://lh3.googleusercontent.com/d/1uRzRgW_7CIad7rdz5gzRAoQzCCWAOlsQ" 
              alt="TCSD ALS Logo" 
              className="w-12 h-12 rounded-xl object-contain shrink-0 bg-white/10 p-1 border border-white/20 shadow-sm"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/1uRzRgW_7CIad7rdz5gzRAoQzCCWAOlsQ";
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  {customTitle || "Masterlist of Mapped and Potential Learners Per Barangay"}
                </h3>
                {isAf1Mode && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide">
                    AF1 Registry
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-200/80 font-medium">
                Source: <span className="text-amber-300 font-semibold">{isAf1Mode ? "Tarlac City ALS Baseline Data on Literacy Mapping — AF1 Individual Inventory" : "Tarlac City ALS Baseline Data on Literacy Mapping"}</span>
              </p>
            </div>
          </div>

          {/* Service Account & Spreadsheet Details */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-black/30 border border-slate-700/60 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Google Cloud Service Account</span>
                <span className="text-[11px] font-mono text-amber-300 truncate max-w-[260px] sm:max-w-none" title={SERVICE_ACCOUNT_EMAIL}>
                  {SERVICE_ACCOUNT_EMAIL}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyServiceAccount}
                className="ml-1 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all text-xs flex items-center gap-1 font-semibold"
                title="Copy service account email to share your Google Sheet & Google Drive"
              >
                {copiedServiceAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px] hidden sm:inline">{copiedServiceAccount ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSyncConfig(!showSyncConfig)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors"
              title="Toggle Spreadsheet Configuration"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Sync Config */}
        {showSyncConfig && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
              <span className="font-bold text-sky-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> Spreadsheet Mapping Configuration
              </span>
              <button
                type="button"
                onClick={() => {
                  setSpreadsheetId(BASELINE_LITERACY_MAPPING_SHEET_ID);
                  localStorage.setItem('literacyMappingSpreadsheetId', BASELINE_LITERACY_MAPPING_SHEET_ID);
                }}
                className="text-[11px] text-amber-300 hover:underline font-medium"
              >
                Reset to Official Sheet ID
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-semibold">Spreadsheet ID</label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value.trim())}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:border-sky-500"
                  placeholder="e.g. 1Z-GsOOh5DV5CSilR7AZFZX_s1K1ktvC7sVVgFcJR3o0"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-semibold">Active Tab GID</label>
                <div className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono text-[11px]">
                  {activeSyncBarangay}: <span className="font-bold">{barangayGids[activeSyncBarangay] || '0'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sync Controls Hub */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">Select Barangay Tab</span>
              <select
                value={activeSyncBarangay}
                onChange={(e) => handleBarangayChange(e.target.value)}
                className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
              >
                {BARANGAY_LIST_WITH_GIDS.map((bg) => (
                  <option key={bg.name} value={bg.name}>
                    {bg.name} (GID: {bg.gid})
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => handleFetchFromGoogleSheet()}
              disabled={syncLoading}
              className="mt-4 sm:mt-0 self-end bg-[#002B6D] border border-sky-500/20 hover:bg-[#00255c] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 tracking-tight transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
              {syncLoading ? 'Syncing Records...' : `Fetch & Import [${activeSyncBarangay}] TabData`}
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono text-right flex items-center gap-2 bg-black/10 px-3.5 py-2 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            {syncStatus || `Connected: ${activeSyncBarangay} (GID: ${barangayGids[activeSyncBarangay] || '0'})`}
          </div>
        </div>
      </div>

      {/* SECTION 3: COMPLEX HAND-CARVED 22-INDICATOR ADMISSION REGISTRY FORM */}
      {isAdding && (
        <form onSubmit={handleSubmitNewLearner} className="bg-white border border-indigo-100 rounded-2xl p-6 space-y-4 shadow-sm animate-fade-in text-xs max-w-5xl">
          <div className="flex justify-between items-center pb-3 border-b border-indigo-100/50">
            <h4 className="font-extrabold text-[#002B6D] text-sm flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-500" />
              File Mapped Literacy Dossier Registration
            </h4>
            <span className="text-[10px] text-indigo-500 font-bold uppercase font-mono bg-indigo-50 px-2.5 py-1 rounded-md">
              Complete baseline dossier Mapping Scheme
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* COLUMN 1: Basic Demographics & Identifiers */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-3.5 border border-slate-200/50">
              <h5 className="font-bold text-slate-700 tracking-tight flex items-center gap-1.5 pb-1 border-b border-slate-200/65">
                <User className="w-4 h-4 text-slate-400" /> Demographics & Identity
              </h5>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-550 font-bold mb-0.5">Record Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 1"
                    value={recordNumInput}
                    onChange={(e) => setRecordNumInput(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none text-slate-700 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-550 font-bold mb-0.5">Gender</label>
                  <select
                    value={genderInput}
                    onChange={(e: any) => setGenderInput(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-550 font-bold mb-0.5">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan"
                  value={firstNameInput}
                  onChange={(e) => setFirstNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-550 font-bold mb-0.5">Middle Name</label>
                <input
                  type="text"
                  placeholder="e.g. Basco"
                  value={middleNameInput}
                  onChange={(e) => setMiddleNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-550 font-bold mb-0.5">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dela Cruz"
                  value={lastNameInput}
                  onChange={(e) => setLastNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-505 font-bold mb-0.5">Date of Birth</label>
                  <input
                    type="date"
                    value={dobInput}
                    onChange={(e) => setDobInput(e.target.value)}
                    className="w-full px-3 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-550 font-bold mb-0.5">Mapped Age</label>
                  <input
                    type="number"
                    min="3"
                    value={ageInput}
                    onChange={(e) => setAgeInput(Math.max(3, Number(e.target.value)))}
                    className="w-full px-3 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* COLUMN 2: Cultural Attributes & Residence Address */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-3.5 border border-slate-200/50">
              <h5 className="font-bold text-slate-700 tracking-tight flex items-center gap-1.5 pb-1 border-b border-slate-200/65">
                <MapPin className="w-4 h-4 text-slate-400" /> Geography & Cultural background
              </h5>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-550 font-bold mb-0.5">Mother Tongue</label>
                  <input
                    type="text"
                    value={motherTongueInput}
                    onChange={(e) => setMotherTongueInput(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-550 font-bold mb-0.5">IP Member (Yes/No)</label>
                  <select
                    value={ipInput}
                    onChange={(e: any) => setIpInput(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-550 font-bold mb-0.5">Religion</label>
                <input
                  type="text"
                  value={religionInput}
                  onChange={(e) => setReligionInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block mb-2">Residential Address</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-slate-500 text-[9px] font-bold mb-0.5">House No</label>
                    <input
                      type="text"
                      placeholder="e.g. 102"
                      value={houseNoInput}
                      onChange={(e) => setHouseNoInput(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-500 text-[9px] font-bold mb-0.5">Street</label>
                    <input
                      type="text"
                      placeholder="e.g. Purok 3"
                      value={streetInput}
                      onChange={(e) => setStreetInput(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                    />
                  </div>
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 text-[9px] font-bold mb-0.5">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Tarlac City"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[9px] font-bold mb-0.5">Province</label>
                    <input
                      type="text"
                      placeholder="e.g. Tarlac"
                      value={provinceInput}
                      onChange={(e) => setProvinceInput(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <label className="block text-slate-550 font-bold mb-0.5">Home Barangay *</label>
                  <select
                    value={barangayInput}
                    onChange={(e) => setBarangayInput(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none font-bold text-[#002B6D]"
                  >
                    {Object.keys(barangayGids).map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 font-mono text-[10px]">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block mb-1">Geographical Mapping Coordinates</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 text-[9px] font-bold mb-0.5">Latitude</label>
                      <input
                        type="text"
                        placeholder="e.g. 15.48"
                        value={latitudeInput}
                        onChange={(e) => setLatitudeInput(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[9px] font-bold mb-0.5">Longitude</label>
                      <input
                        type="text"
                        placeholder="e.g. 120.59"
                        value={longitudeInput}
                        onChange={(e) => setLongitudeInput(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="block text-slate-500 text-[9px] font-bold mb-0.5">Static GeoLocation URL/Data</label>
                    <input
                      type="text"
                      placeholder="e.g. Point(15.48, 120.59)"
                      value={staticGeoLocationInput}
                      onChange={(e) => setStaticGeoLocationInput(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 3: Family Support System & Educational Intent */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-3.5 border border-slate-200/50">
              <h5 className="font-bold text-slate-700 tracking-tight flex items-center gap-1.5 pb-1 border-b border-slate-200/65">
                <HelpCircle className="w-4 h-4 text-slate-400" /> Family Structure & Intent
              </h5>

              <div>
                <label className="block text-slate-550 font-bold mb-0.5">Full Name of Father</label>
                <input
                  type="text"
                  placeholder="Last, First, Middle Name"
                  value={fatherNameInput}
                  onChange={(e) => setFatherNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-550 font-bold mb-0.5">Full Name of Mother</label>
                <input
                  type="text"
                  placeholder="Last, First, Middle Name"
                  value={motherNameInput}
                  onChange={(e) => setMotherNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-slate-[10px] font-bold mb-0.5">Contact No.</label>
                  <input
                    type="text"
                    placeholder="+63 9xx xxx xxxx"
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-[10px] font-bold mb-0.5">Last Grade Completed</label>
                  <input
                    type="text"
                    placeholder="e.g. Grade 5"
                    value={lastGradeInput}
                    onChange={(e) => setLastGradeInput(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-slate-[10px] font-bold mb-0.5">Date Mapped</label>
                  <input
                    type="date"
                    value={dateMappedInput}
                    onChange={(e) => setDateMappedInput(e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-[10px] font-bold mb-0.5">Interested in ALS?</label>
                  <select
                    value={interestInput}
                    onChange={(e: any) => setInterestInput(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {interestInput === 'Yes' && (
                <div className="grid grid-cols-2 gap-2 mt-1 animate-fade-in">
                  <div>
                    <label className="block text-slate-[10px] font-bold mb-0.5">Preferred Track</label>
                    <select
                      value={prefProgramInput}
                      onChange={(e) => setPrefProgramInput(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                    >
                      <option value="A&E Secondary">A&E Secondary</option>
                      <option value="A&E Elementary">A&E Elementary</option>
                      <option value="Basic Literacy">Basic Literacy Program</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#002B6D] font-bold mb-0.5">Enrollment First Date</label>
                    <input
                      type="date"
                      value={firstAttendanceInput}
                      onChange={(e) => setFirstAttendanceInput(e.target.value)}
                      className="w-full px-2 py-1 border border-teal-200 bg-teal-50 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-550 font-bold mb-0.5">Reasons For Stopping/Dropping Out (Primary)</label>
                <textarea
                  placeholder="Primary reason for stopping formal school"
                  value={reasonsInput}
                  onChange={(e) => setReasonsInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none h-11"
                />
              </div>

              <div>
                <label className="block text-slate-550 font-bold mb-0.5">Reasons For Stopping/Dropping Out (Secondary/Specific)</label>
                <textarea
                  placeholder="Specific or secondary reason for stopping formal school"
                  value={reasons2Input}
                  onChange={(e) => setReasons2Input(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none h-11"
                />
              </div>

              <div>
                <label className="block text-slate-550 font-bold mb-0.5">ALS Certification and Completion Status</label>
                <input
                  type="text"
                  placeholder="e.g. BLP Developing Level Completer, A&E JHS Passer"
                  value={alsCertificationStatusInput}
                  onChange={(e) => setAlsCertificationStatusInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-550 font-bold mb-0.5">Remarks</label>
                <input
                  type="text"
                  placeholder="Additional remarks or notes"
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-550 font-bold mb-0.5">Mapped By *</label>
                <input
                  type="text"
                  required
                  placeholder="Name of mapping representative/co-ordinator"
                  value={mappedByInput}
                  onChange={(e) => setMappedByInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                />
              </div>

            </div>

          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 border border-slate-200"
            >
              Cancel Profile
            </button>
            <button
              type="submit"
              className="bg-[#002B6D] text-white hover:bg-[#00255c] px-6 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Confirm Admission Mapped Dossier
            </button>
          </div>
        </form>
      )}

      {/* Columns to be displayed in the print output container (per user request) */}
      {!isAf1Mode && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3 font-sans print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#002B6D] flex items-center justify-center font-bold shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-black text-[#002B6D] tracking-tight uppercase">
                    Columns to be displayed in the print output
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#002B6D] text-[10px] font-bold font-mono">
                    {visiblePrintColumns.length} of {MASTERLIST_PRINT_COLUMNS.length} Active in Print & PDF
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tick the checkboxes on the left of each column header. Once ticked, the ticked column headers are displayed only on the print output and downloaded PDF.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleSelectAllPrintColumns}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAllPrintColumns}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Deselect All
              </button>
              <button
                type="button"
                onClick={handleResetDefaultPrintColumns}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-[#002B6D] transition cursor-pointer"
              >
                Reset Default
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1 rounded-lg text-[11px] font-black bg-[#002B6D] hover:bg-[#001D4A] text-white transition flex items-center gap-1.5 shadow-3xs cursor-pointer"
                title="Open interactive Preview Hub"
              >
                <FileText className="w-3.5 h-3.5" />
                Preview Hub
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
            {MASTERLIST_PRINT_COLUMNS.map((col) => {
              const isChecked = Boolean(selectedPrintColumns[col.id]);
              return (
                <label 
                  key={col.id} 
                  className={`flex items-center gap-2 p-1.5 rounded-lg border transition cursor-pointer select-none text-[11px] ${
                    isChecked
                      ? 'border-[#002B6D] bg-blue-50/80 text-[#002B6D] font-bold shadow-3xs ring-1 ring-[#002B6D]/20'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      setSelectedPrintColumns(prev => ({
                        ...prev,
                        [col.id]: e.target.checked
                      }));
                    }}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#002B6D] focus:ring-[#002B6D] cursor-pointer"
                  />
                  <span className="truncate" title={col.label}>
                    {col.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: MAIN REGISTRY DATA TABLE LIST */}
      <div className="bg-slate-100 p-3 border border-slate-200 rounded-t-2xl space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xs font-extrabold text-[#002B6D] flex items-center gap-2">
              {customTitle ? `${customTitle} Per Barangay` : "Masterlist of Mapped and Potential Learners Per Barangay"}
            </h4>
            <span className="bg-[#002B6D] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-3xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Barangay: {activeSyncBarangay} ({filteredLearners.length} Records)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {subTab === 'masterlist' && (
              <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-3xs">
                <button
                  type="button"
                  onClick={() => scrollTable('left')}
                  className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 font-extrabold rounded-md text-[10px] transition flex items-center gap-1 cursor-pointer"
                  title="Scroll table left"
                >
                  ◀ Left
                </button>
                <div className="w-px bg-slate-200 my-0.5"></div>
                <button
                  type="button"
                  onClick={() => scrollTable('right')}
                  className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 font-extrabold rounded-md text-[10px] transition flex items-center gap-1 cursor-pointer"
                  title="Scroll table right"
                >
                  Right ▶
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrint}
                className="bg-[#002B6D] hover:bg-[#001D4A] text-white font-extrabold rounded-lg text-[10px] px-3.5 py-1.5 flex items-center gap-1.5 shadow-3xs cursor-pointer transition"
                title="Open Preview Hub"
              >
                <FileText className="w-3.5 h-3.5 text-white" />
                Preview Hub
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controller for Active Barangay (Search bar removed as requested) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 text-[11px] font-semibold focus:outline-none shadow-3xs"
            >
              <option value="all">All Programs</option>
              <option value="Basic Literacy">Basic Literacy</option>
              <option value="A&E Elementary">A&E Elementary</option>
              <option value="A&E Secondary">A&E Secondary</option>
            </select>

            {!isAf1Mode && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 text-[11px] font-semibold focus:outline-none shadow-3xs"
              >
                <option value="all">All Statuses</option>
                <option value="Enrolled">Enrolled</option>
                <option value="In Processing">In Processing</option>
                <option value="Completed">Completed</option>
                <option value="On Leave">On Leave</option>
              </select>
            )}

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 text-[11px] font-semibold focus:outline-none shadow-3xs"
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            {(searchTerm || programFilter !== 'all' || (!isAf1Mode && statusFilter !== 'all') || genderFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setProgramFilter('all');
                  setStatusFilter('all');
                  setGenderFilter('all');
                }}
                className="text-[10px] text-rose-600 hover:text-rose-700 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-300 rounded-b-2xl overflow-hidden shadow-xs relative group/table">
        {/* Floating Arrow "<" for Navigation on the Table */}
        <button
          type="button"
          onClick={() => scrollTable('left')}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 bg-[#002B6D]/90 hover:bg-[#002B6D] text-white w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/80 transition transform hover:scale-115 active:scale-95 cursor-pointer print:hidden text-lg font-black select-none"
          title="Scroll Table Left (<)"
          aria-label="Scroll Table Left"
        >
          &lt;
        </button>

        {/* Floating Arrow ">" for Navigation on the Table */}
        <button
          type="button"
          onClick={() => scrollTable('right')}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 bg-[#002B6D]/90 hover:bg-[#002B6D] text-white w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/80 transition transform hover:scale-115 active:scale-95 cursor-pointer print:hidden text-lg font-black select-none"
          title="Scroll Table Right (>)"
          aria-label="Scroll Table Right"
        >
          &gt;
        </button>

        <div ref={tableContainerRef} className="overflow-x-auto scroll-smooth">
          <table className={`w-full text-left border-collapse border border-slate-300 ${isAf1Mode ? 'min-w-[1100px]' : 'min-w-[2900px]'}`}>
              <thead>
                {isAf1Mode ? (
                  <tr className="bg-[#002B6D] text-white border-b border-[#001f4d] font-bold uppercase tracking-wider text-[7pt]">
                    <th className="py-2.5 px-2 text-center font-bold border border-slate-300 text-[7pt] leading-tight align-middle" style={{ fontSize: '7pt', width: '2.0cm', minWidth: '2.0cm' }}>
                      Record Number
                    </th>
                    <th className="py-2.5 px-2 text-center font-bold border border-slate-300 text-[7pt] leading-tight align-middle" style={{ fontSize: '7pt', width: '2.5cm', minWidth: '2.5cm' }}>
                      Last Name
                    </th>
                    <th className="py-2.5 px-2 text-center font-bold border border-slate-300 text-[7pt] leading-tight align-middle" style={{ fontSize: '7pt', width: '2.5cm', minWidth: '2.5cm' }}>
                      First Name
                    </th>
                    <th className="py-2.5 px-2 text-center font-bold border border-slate-300 text-[7pt] leading-tight align-middle" style={{ fontSize: '7pt', width: '2.2cm', minWidth: '2.2cm' }}>
                      Middle Name
                    </th>
                    <th className="py-2.5 px-2 text-center font-bold border border-slate-300 text-[7pt] leading-tight align-middle" style={{ fontSize: '7pt', width: '1.4cm', minWidth: '1.4cm' }}>
                      Gender
                    </th>
                    <th className="py-2.5 px-2 text-left font-bold border border-slate-300 text-[7pt] leading-tight align-middle" style={{ fontSize: '7pt', width: '2.2cm', minWidth: '2.2cm' }}>
                      Date of Birth
                    </th>
                    <th className="py-2.5 px-2 text-center font-bold border border-slate-300 text-[7pt] leading-tight align-middle" style={{ fontSize: '7pt', width: '1.2cm', minWidth: '1.2cm' }}>
                      Age
                    </th>
                    <th className="py-2.5 px-2 text-center font-bold border border-slate-300 text-[7pt] leading-tight align-middle" style={{ fontSize: '7pt', width: '2.2cm', minWidth: '2.2cm', maxWidth: '2.2cm' }}>
                      Contact Number
                    </th>
                    <th className="py-2.5 px-2 text-center font-bold border border-slate-300 text-[7pt] leading-tight align-middle" style={{ fontSize: '7pt', width: '2cm', minWidth: '2cm', maxWidth: '2cm' }}>
                      Interested in ALS Program<br />(Yes/No)
                    </th>
                    <th className="py-2.5 px-2 text-center font-bold border border-slate-300 text-[7pt] leading-tight align-middle" style={{ fontSize: '7pt', width: '2.5cm', minWidth: '2.5cm' }}>
                      If Yes, Preferred Program
                    </th>
                  </tr>
                ) : (
                  <tr className="bg-[#002B6D] text-white border-b border-[#001f4d] font-bold uppercase tracking-wider text-[7pt]">
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '1.4cm', minWidth: '1.4cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['order'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, order: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Order No.</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.0cm', minWidth: '2.0cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['recordNumber'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, recordNumber: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Record Number</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.2cm', minWidth: '2.2cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['lastName'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, lastName: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Last Name</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.2cm', minWidth: '2.2cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['firstName'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, firstName: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>First Name</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.0cm', minWidth: '2.0cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['middleName'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, middleName: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Middle Name</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '1.4cm', minWidth: '1.4cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['gender'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, gender: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Gender</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-left font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.2cm', minWidth: '2.2cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-start gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['dateOfBirth'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, dateOfBirth: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Date of Birth</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '1.2cm', minWidth: '1.2cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['age'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, age: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Age</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.0cm', minWidth: '2.0cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['motherTongue'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, motherTongue: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Mother Tongue</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.2cm', minWidth: '2.2cm', maxWidth: '2.2cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['indigenousPeople'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, indigenousPeople: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Indigenous People<br />(Yes/No)</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.0cm', minWidth: '2.0cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['religion'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, religion: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Religion</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '1.2cm', minWidth: '1.2cm', maxWidth: '1.2cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['houseNo'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, houseNo: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>HOUSE<br />NO.</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.2cm', minWidth: '2.2cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['street'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, street: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Street</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.2cm', minWidth: '2.2cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['barangay'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, barangay: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Barangay</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.0cm', minWidth: '2.0cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['city'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, city: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>City</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '1.8cm', minWidth: '1.8cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['province'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, province: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Province</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1.5 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '3.2cm', minWidth: '3.2cm', maxWidth: '3.2cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['fatherName'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, fatherName: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Name of Father<br />(Last, First, Middle)</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1.5 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '3.2cm', minWidth: '3.2cm', maxWidth: '3.2cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['motherName'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, motherName: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Name of Mother<br />(Last, First, Middle)</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.2cm', minWidth: '2.2cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['contactNumber'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, contactNumber: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Contact Number</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.5cm', minWidth: '2.5cm', maxWidth: '2.5cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['lastGradeLevelCompleted'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, lastGradeLevelCompleted: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>LAST GRADE LEVEL COMPLETED</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.0cm', minWidth: '2.0cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['dateMapped'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, dateMapped: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Date Mapped<br />(mm/dd/yyyy)</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.0cm', minWidth: '2.0cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['interestedInALS'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, interestedInALS: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Interested in ALS<br />(Yes/No)</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.2cm', minWidth: '2.2cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['preferredProgram'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, preferredProgram: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>If Yes, Preferred Program</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-0.5 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '1.2cm', minWidth: '1.2cm', maxWidth: '1.2cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['enrolledInAls'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, enrolledInAls: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>ENROLLED<br />IN ALS</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.5cm', minWidth: '2.5cm', maxWidth: '2.5cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['dateOfFirstAttendance'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, dateOfFirstAttendance: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>DATE OF FIRST ATTENDANCE</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1.5 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '3.5cm', minWidth: '3.5cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['reasonsForNotAttending'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, reasonsForNotAttending: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Reasons for Not Attending, Stopping, or Dropping Out</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-1 text-center font-bold border border-slate-300 text-[7pt] leading-tight whitespace-normal break-words align-middle" style={{ fontSize: '7pt', width: '2.8cm', minWidth: '2.8cm', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', textWrap: 'wrap' }}>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedPrintColumns['alsCertificationStatus'])}
                          onChange={(e) => setSelectedPrintColumns(prev => ({ ...prev, alsCertificationStatus: e.target.checked }))}
                          title="Tick to display in print output and PDF"
                          className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>ALS Certification and Completion Status</span>
                      </div>
                    </th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm bg-white">
                {filteredLearners.length > 0 ? (
                  filteredLearners.map((l, index) => {
                    const bdateStr = l.dateOfBirth || l.birthdate || '';
                    const mappedDateStr = l.dateMapped || '';
                    const ipStatusStr = l.indigenousPeople || l.isIP || 'No';

                    if (isAf1Mode) {
                      return (
                        <tr key={`${l.id || 'af1-lrn'}-${index}`} className="hover:bg-slate-50 border-b border-slate-200 transition text-[11px] text-slate-700">
                          {/* Record Number */}
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800 whitespace-nowrap border border-slate-200">
                            {l.recordNumber || '—'}
                          </td>

                          {/* Last Name */}
                          <td className="py-2.5 px-2 font-bold text-slate-900 whitespace-nowrap border border-slate-200">
                            {l.lastName || '—'}
                          </td>

                          {/* First Name */}
                          <td className="py-2.5 px-2 whitespace-nowrap font-semibold text-slate-800 border border-slate-200">
                            {l.firstName || '—'}
                          </td>

                          {/* Middle Name */}
                          <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap border border-slate-200">
                            {l.middleName || '—'}
                          </td>

                          {/* Gender */}
                          <td className="py-2.5 px-2 text-center whitespace-nowrap border border-slate-200">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              l.gender === 'Female' ? 'bg-amber-100 text-[#b45309]' : 'bg-blue-100 text-[#002B6D]'
                            }`}>
                              {l.gender || l.sex || 'Male'}
                            </span>
                          </td>

                          {/* Date of Birth - Left aligned per user request */}
                          <td className="py-2.5 px-2 font-mono text-left text-slate-600 whitespace-nowrap border border-slate-200">
                            {bdateStr ? formatDateOfBirth(bdateStr) : '—'}
                          </td>

                          {/* Age - Computed and updated to current live date */}
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800 whitespace-nowrap border border-slate-200">
                            {calculateCurrentAge(bdateStr, l.age)}
                          </td>

                          {/* Contact Number */}
                          <td className="py-2.5 px-2 font-mono text-slate-700 whitespace-nowrap border border-slate-200" style={{ width: '2.2cm', minWidth: '2.2cm', maxWidth: '2.2cm' }}>
                            {l.contactNumber || l.contact || '—'}
                          </td>

                          {/* Interested in ALS Program (Yes/No) */}
                          <td className="py-2.5 px-2 text-center whitespace-nowrap border border-slate-200" style={{ width: '2cm', minWidth: '2cm', maxWidth: '2cm' }}>
                            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-850">
                              {l.interestedInALS || 'Yes'}
                            </span>
                          </td>

                          {/* If Yes, Preferred Program */}
                          <td className="py-2.5 px-2 text-center whitespace-nowrap border border-slate-200">
                            {(() => {
                              const prog = getLearnerPreferredProgram(l);
                              const isSecondary = prog.toLowerCase().includes('secondary');
                              const isElem = prog.toLowerCase().includes('elem');
                              const isBLP = prog.toLowerCase().includes('literacy') || prog.toLowerCase().includes('blp');
                              const badgeStyle = isSecondary
                                ? 'bg-blue-50 text-[#002B6D] border border-blue-200'
                                : isElem
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : isBLP
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200';
                              return (
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${badgeStyle}`}>
                                  {prog}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={`${l.id || 'lrn'}-${index}`} className="hover:bg-slate-50 border-b border-slate-200 transition text-[11px] text-slate-700">
                        {/* Order */}
                        <td className="py-2 px-2 text-center font-mono font-bold text-slate-600 whitespace-nowrap bg-slate-50/50 border border-slate-200">
                          {getOrderNumberFromRecordNumber(l.recordNumber, index)}
                        </td>

                        {/* Record Number */}
                        <td className="py-2 px-2 text-center font-mono font-bold text-slate-800 whitespace-nowrap border border-slate-200">
                          {l.recordNumber || '—'}
                        </td>

                        {/* Last Name */}
                        <td className="py-2 px-2 font-bold text-slate-900 whitespace-nowrap border border-slate-200">
                          {l.lastName}
                        </td>

                        {/* First Name */}
                        <td className="py-2 px-2 whitespace-nowrap font-semibold text-slate-800 border border-slate-200">
                          {l.firstName}
                        </td>

                        {/* Middle Name */}
                        <td className="py-2 px-2 text-slate-600 whitespace-nowrap border border-slate-200">
                          {l.middleName || '—'}
                        </td>

                        {/* Gender */}
                        <td className="py-2 px-2 text-center whitespace-nowrap border border-slate-200">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            l.gender === 'Female' ? 'bg-amber-100 text-[#b45309]' : 'bg-blue-100 text-[#002B6D]'
                          }`}>
                            {l.gender || l.sex || 'Male'}
                          </span>
                        </td>

                        {/* Date of Birth - Left aligned per user request */}
                        <td className="py-2 px-2 font-mono text-left text-slate-600 whitespace-nowrap border border-slate-200">
                          {bdateStr ? formatDateOfBirth(bdateStr) : '—'}
                        </td>

                        {/* Age - Computed and updated to current live date */}
                        <td className="py-2 px-2 text-center font-bold text-slate-800 whitespace-nowrap border border-slate-200">
                          {calculateCurrentAge(bdateStr, l.age)}
                        </td>

                        {/* Mother Tongue */}
                        <td className="py-2 px-2 text-slate-650 max-w-[150px] truncate whitespace-nowrap border border-slate-200" title={l.motherTongue}>
                          {l.motherTongue || '—'}
                        </td>

                        {/* Indigenous People (Yes/No) - 2.2 cm */}
                        <td className="py-2 px-2 text-center whitespace-nowrap border border-slate-200" style={{ width: '2.2cm', minWidth: '2.2cm', maxWidth: '2.2cm' }}>
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                            ipStatusStr === 'Yes' ? 'bg-purple-100 text-purple-850' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {ipStatusStr}
                          </span>
                        </td>

                        {/* Religion */}
                        <td className="py-2 px-2 text-slate-650 max-w-[150px] truncate whitespace-nowrap border border-slate-200" title={l.religion}>
                          {l.religion || '—'}
                        </td>

                        {/* House No. - 1 cm */}
                        <td className="py-2 px-2 text-slate-650 whitespace-nowrap text-center border border-slate-200" style={{ width: '1cm', minWidth: '1cm', maxWidth: '1cm' }}>
                          {l.houseNo || '—'}
                        </td>

                        {/* Street */}
                        <td className="py-2 px-2 text-slate-650 max-w-[180px] truncate whitespace-nowrap border border-slate-200" title={l.street || l.sitioStreet}>
                          {l.street || l.sitioStreet || '—'}
                        </td>

                        {/* Barangay */}
                        <td className="py-2 px-2 font-medium text-slate-800 whitespace-nowrap border border-slate-200">
                          {l.barangay || '—'}
                        </td>

                        {/* City */}
                        <td className="py-2 px-2 text-slate-650 whitespace-nowrap border border-slate-200">
                          {l.city || l.municipalityCity || 'Tarlac City'}
                        </td>

                        {/* Province */}
                        <td className="py-2 px-2 text-slate-650 whitespace-nowrap border border-slate-200">
                          {l.province || 'Tarlac'}
                        </td>

                        {/* Name of Father - 3 cm */}
                        <td className="py-2 px-2 text-slate-705 truncate font-medium whitespace-nowrap border border-slate-200" style={{ width: '3cm', minWidth: '3cm', maxWidth: '3cm' }} title={l.fatherName}>
                          {l.fatherName || '—'}
                        </td>

                        {/* Name of Mother - 3 cm */}
                        <td className="py-2 px-2 text-slate-705 truncate font-medium whitespace-nowrap border border-slate-200" style={{ width: '3cm', minWidth: '3cm', maxWidth: '3cm' }} title={l.motherName}>
                          {l.motherName || '—'}
                        </td>

                        {/* Contact Number */}
                        <td className="py-2 px-2 font-mono text-slate-605 whitespace-nowrap border border-slate-200">
                          {l.contactNumber || '—'}
                        </td>

                        {/* LAST GRADE LEAVEL COMPLETED IN FORMAL SCHOOL - 2.5 cm */}
                        <td className="py-2 px-2 text-slate-700 truncate whitespace-nowrap border border-slate-200" style={{ width: '2.5cm', minWidth: '2.5cm', maxWidth: '2.5cm' }} title={l.lastGradeLevelCompleted || l.lastGradeCompleted}>
                          {l.lastGradeLevelCompleted || l.lastGradeCompleted || '—'}
                        </td>

                        {/* Date Mapped (mm/dd/yyyy) */}
                        <td className="py-2 px-2 font-mono text-center text-slate-600 whitespace-nowrap border border-slate-200">
                          {mappedDateStr ? formatDateMapped(mappedDateStr) : '—'}
                        </td>

                        {/* Interested in ALS Program (Yes/No) */}
                        <td className="py-2 px-2 text-center whitespace-nowrap border border-slate-200">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                            l.interestedInALS === 'Yes' ? 'bg-emerald-100 text-emerald-850' : 'bg-red-50 text-red-550'
                          }`}>
                            {l.interestedInALS || '—'}
                          </span>
                        </td>

                        {/* If Yes, Preferred Program */}
                        <td className="py-2 px-2 font-medium text-slate-750 max-w-[180px] truncate whitespace-nowrap border border-slate-200" title={l.preferredProgram || l.program}>
                          {l.preferredProgram || l.program || '—'}
                        </td>

                        {/* ENROLLED IN ALS - 1.1 cm */}
                        <td className="py-2 px-2 text-center whitespace-nowrap border border-slate-200" style={{ width: '1.1cm', minWidth: '1.1cm', maxWidth: '1.1cm' }}>
                          {(() => {
                            const isEnrolled = l.enrolledInAls === 'Yes' || l.status === 'Enrolled' || !!l.dateOfFirstAttendance;
                            const displayValue = isEnrolled ? 'Yes' : 'No';
                            return (
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isEnrolled ? 'bg-blue-100 text-[#002B6D]' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {displayValue}
                              </span>
                            );
                          })()}
                        </td>

                        {/* IF ALREADY ENROLLED IN ALS, PROVIDED DATE OF FIRST ATTENDANCE - 2.5 cm */}
                        <td className="py-2 px-2 font-mono text-center text-slate-700 whitespace-nowrap border border-slate-200" style={{ width: '2.5cm', minWidth: '2.5cm', maxWidth: '2.5cm' }}>
                          {l.dateOfFirstAttendance ? formatDateMapped(l.dateOfFirstAttendance) : '—'}
                        </td>

                        {/* Reasons for Not Attending, Stopping, or Dropping Out of Formal Schooling */}
                        <td className="py-2 px-2 text-slate-600 max-w-[350px] truncate whitespace-nowrap border border-slate-200" title={l.reasonsForNotAttending || l.whyNotAttend}>
                          {l.reasonsForNotAttending || l.whyNotAttend || '—'}
                        </td>

                        {/* ALS Certification and Completion Status */}
                        <td className="py-2 px-2 text-slate-700 font-medium max-w-[280px] truncate whitespace-nowrap border border-slate-200" title={l.alsCertificationStatus || l.remarks}>
                          {l.alsCertificationStatus || (l.remarks && (l.remarks.toLowerCase().includes('completer') || l.remarks.toLowerCase().includes('graduate') || l.remarks.toLowerCase().includes('passer')) ? l.remarks : '—')}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isAf1Mode ? 10 : 27} className="py-16 text-center text-slate-500 font-medium">
                      {syncLoading ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-[#002B6D]" />
                          <span className="font-bold text-slate-800 text-sm">Loading {activeSyncBarangay} Literacy Mapping Dossiers...</span>
                          <span className="text-xs text-slate-400 font-mono">Fetching tab &quot;{activeSyncBarangay}&quot; from Google Sheet &amp; Cloud Firestore</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
                            <Info className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-slate-800 text-sm">No mapped learners found for Barangay {activeSyncBarangay}</span>
                          <p className="text-xs text-slate-500">
                            Click the button below to fetch and import the live records for this barangay from the Tarlac City ALS Baseline Data on Literacy Mapping spreadsheet.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleFetchFromGoogleSheet(activeSyncBarangay)}
                            disabled={syncLoading}
                            className="mt-2 bg-[#002B6D] hover:bg-[#00255c] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Fetch &amp; Import [{activeSyncBarangay}] TabData
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      </div>
      </div>

      {/* Official Masterlist A4 Landscape Print Preview Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto print:static print:inset-auto print:p-0 print:bg-white print:z-auto print:block print:overflow-visible">
          <div className="bg-slate-100 rounded-2xl border border-slate-300 shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none print:bg-white print:rounded-none print:block print:overflow-visible">
            {/* Modal Header Bar */}
            <div className="bg-[#002B6D] text-white p-4 px-6 flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    {customTitle ? `Official ${customTitle} — Print & PDF Hub` : "Official Masterlist of Mapped Learners — Print & PDF Hub"}
                  </h3>
                  <p className="text-xs text-blue-100 font-medium">
                    A4 Landscape Layout • Barangay: <span className="font-extrabold text-white">{activeSyncBarangay}</span> • Total Records: <span className="font-extrabold text-white">{filteredLearners.length}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAsPdf}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  title="Download complete multi-page A4 Landscape PDF directly"
                >
                  <Download className="w-3.5 h-3.5" /> {isGeneratingPdf ? 'Saving PDF...' : 'Download PDF (A4 Landscape)'}
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
                <span>Division: <strong className="text-slate-900">Tarlac City Schools Division</strong></span>
                <span className="text-blue-300">•</span>
                <span>Barangay: <strong className="text-slate-900">{activeSyncBarangay}</strong></span>
                <span className="text-blue-300">•</span>
                <span>Active Cohort: <strong className="text-slate-900">{filteredLearners.length} Mapped Learners</strong></span>
              </div>
              <div className="text-[11px] font-mono font-black text-blue-900 bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-200">
                Official Paper Specification: A4 Landscape (297mm × 210mm) • Margins: 0.5cm
              </div>
            </div>

            {/* Dedicated Print Stylesheet ensuring exact front-end representation */}
            <style>{`
              @media print {
                @page {
                  size: A4 landscape;
                  margin: 0.5cm;
                }
                body, html {
                  background: #ffffff !important;
                  color: #0f172a !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .print\\:hidden, header, aside, nav, button {
                  display: none !important;
                }
                #masterlist-pdf-document {
                  width: 100% !important;
                  min-width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  overflow: visible !important;
                }
                #masterlist-pdf-document table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                  font-size: 7.5pt !important;
                }
                #masterlist-pdf-document th, #masterlist-pdf-document td {
                  font-size: 7.5pt !important;
                  padding: 2px 4px !important;
                }
                #masterlist-pdf-document tr {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            `}</style>

            {/* A4 Landscape Document Preview Container */}
            <div className="p-6 overflow-x-auto overflow-y-auto space-y-6 bg-slate-200/60 flex-1 print:p-0 print:bg-white print:overflow-visible print:block">
              <div id="masterlist-pdf-document" className="bg-white rounded-xl border border-slate-300 p-8 shadow-md space-y-5 text-slate-900 w-[1080px] min-w-[1080px] mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full print:min-w-0 print:rounded-none print:block">
                {/* Header - Centered Layout with Centered Logos & Text */}
                <div style={{ textAlign: 'center' }} className="text-center pb-3 border-b-2 border-slate-900 space-y-2">
                  {/* Logos - Centered Horizontally */}
                  <div style={{ textAlign: 'center', width: '100%', margin: '0 auto 6px auto' }} className="text-center">
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '0 auto' }}>
                      <img 
                        src={DEPED_LOGO_BASE64} 
                        alt="DepEd Logo" 
                        style={{ height: '52px', width: 'auto', objectFit: 'contain', verticalAlign: 'middle' }}
                        className="h-13 w-auto object-contain shrink-0" 
                      />
                      <img 
                        src="https://lh3.googleusercontent.com/d/1RMiZninylXhyjgIjOKQC_9F7trv8EuQm" 
                        alt="ALS Logo" 
                        style={{ height: '52px', width: 'auto', objectFit: 'contain', verticalAlign: 'middle' }}
                        className="h-13 w-auto object-contain shrink-0" 
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/1uRzRgW_7CIad7rdz5gzRAoQzCCWAOlsQ";
                        }}
                      />
                    </div>
                  </div>

                  {/* Header Titles - Centered Text */}
                  <div style={{ textAlign: 'center' }} className="space-y-0.5 text-center">
                    <div style={{ textAlign: 'center' }} className="text-[10px] font-serif font-bold uppercase tracking-wider text-slate-700">
                      Republic of the Philippines. Department of Education. Region III
                    </div>
                    <div style={{ textAlign: 'center' }} className="text-[11px] font-serif font-extrabold uppercase text-slate-900">
                      Schools Division Office of Tarlac City. District of Tarlac City
                    </div>
                    <h1 style={{ textAlign: 'center' }} className="text-base font-black uppercase text-[#002B6D] tracking-tight pt-0.5">
                      {customTitle ? customTitle.toUpperCase() : "Alternative Learning System (ALS) Literacy Mapping Master Registry"}
                    </h1>
                  </div>

                  {/* Metadata Lines - Centered */}
                  <div style={{ textAlign: 'center', margin: '4px auto 0 auto' }} className="text-center space-y-0.5 pt-1.5 border-t border-slate-300">
                    <div style={{ textAlign: 'center' }} className="text-[10px] font-bold text-slate-800">
                      <span className="font-extrabold text-slate-900">Division:</span> Tarlac City Schools Division
                    </div>
                    <div style={{ textAlign: 'center' }} className="text-[10px] font-bold text-slate-800">
                      <span className="font-extrabold text-slate-900">Barangay:</span> {activeSyncBarangay || 'Aguso'}
                    </div>
                    <div style={{ textAlign: 'center' }} className="text-[10px] font-bold text-slate-800">
                      <span className="font-extrabold text-slate-900">Total Records:</span> {filteredLearners.length} Mapped Learners
                    </div>
                    <div style={{ textAlign: 'center' }} className="text-[10px] font-bold text-[#002B6D]">
                      <span className="font-extrabold text-slate-900">Format:</span> A4 Landscape
                    </div>
                  </div>
                </div>

                {/* Table Preview */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-300 text-[9.5px]">
                    <thead>
                      {isAf1Mode ? (
                        <tr className="bg-[#002B6D] text-white text-[9px] font-black uppercase tracking-wider divide-x divide-blue-900">
                          <th className="py-2 px-1 text-center border-b border-slate-300">Record Number</th>
                          <th className="py-2 px-1.5 border-b border-slate-300">Last Name</th>
                          <th className="py-2 px-1.5 border-b border-slate-300">First Name</th>
                          <th className="py-2 px-1.5 border-b border-slate-300">Middle Name</th>
                          <th className="py-2 px-1 text-center border-b border-slate-300">Gender</th>
                          <th className="py-2 px-1 text-center border-b border-slate-300">Date of Birth</th>
                          <th className="py-2 px-1 text-center border-b border-slate-300">Age</th>
                          <th className="py-2 px-1 border-b border-slate-300" style={{ width: '2.2cm', minWidth: '2.2cm', maxWidth: '2.2cm' }}>Contact Number</th>
                          <th className="py-2 px-1 text-center border-b border-slate-300" style={{ width: '2cm', minWidth: '2cm', maxWidth: '2cm' }}>Interested in ALS Program (Yes/No)</th>
                          <th className="py-2 px-1 text-center border-b border-slate-300">If Yes, Preferred Program</th>
                        </tr>
                      ) : (
                        <tr className="bg-[#002B6D] text-white text-[9px] font-black uppercase tracking-wider divide-x divide-blue-900">
                          {(visiblePrintColumns.length > 0 ? visiblePrintColumns : MASTERLIST_PRINT_COLUMNS).map(col => (
                            <th 
                              key={col.id} 
                              className={`py-2 px-1 border-b border-slate-300 ${
                                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                              }`}
                              style={col.width ? { width: col.width } : undefined}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredLearners.length > 0 ? (
                        filteredLearners.map((l, idx) => {
                          if (isAf1Mode) {
                            const bdateStr = l.dateOfBirth || l.birthdate || '';
                            return (
                              <tr key={`print-row-${l.id || idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                                <td className="py-1.5 px-1 font-mono text-center font-bold text-slate-700">{l.recordNumber || '—'}</td>
                                <td className="py-1.5 px-1.5 font-bold text-slate-900">{l.lastName || '—'}</td>
                                <td className="py-1.5 px-1.5 font-semibold text-slate-800">{l.firstName || '—'}</td>
                                <td className="py-1.5 px-1.5 text-slate-700">{l.middleName || '—'}</td>
                                <td className="py-1.5 px-1 text-center">{l.gender || l.sex || '—'}</td>
                                <td className="py-1.5 px-1 text-left whitespace-nowrap font-mono">{bdateStr ? formatDateOfBirth(bdateStr) : '—'}</td>
                                <td className="py-1.5 px-1 text-center font-bold">{calculateCurrentAge(bdateStr, l.age)}</td>
                                <td className="py-1.5 px-1 font-mono text-slate-700" style={{ width: '2.2cm', minWidth: '2.2cm', maxWidth: '2.2cm' }}>{l.contactNumber || l.contact || '—'}</td>
                                <td className="py-1.5 px-1 text-center font-bold text-emerald-800" style={{ width: '2cm', minWidth: '2cm', maxWidth: '2cm' }}>{l.interestedInALS || 'Yes'}</td>
                                <td className="py-1.5 px-1 text-center font-bold text-slate-800 whitespace-nowrap">{getLearnerPreferredProgram(l)}</td>
                              </tr>
                            );
                          }

                          const isEnrolled = l.enrolledInAls === 'Yes' || l.status === 'Enrolled' || !!l.dateOfFirstAttendance;
                          const activeCols = visiblePrintColumns.length > 0 ? visiblePrintColumns : MASTERLIST_PRINT_COLUMNS;
                          return (
                            <tr key={`print-row-${l.id || idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                              {activeCols.map(col => (
                                <td 
                                  key={col.id} 
                                  className={`py-1.5 px-1 ${
                                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                                  }`}
                                >
                                  {col.renderValue(l, idx, isEnrolled)}
                                </td>
                              ))}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={isAf1Mode ? 10 : (visiblePrintColumns.length > 0 ? visiblePrintColumns.length : 27)} className="py-8 text-center text-slate-400 font-semibold">
                            No mapped learner records available for printing.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Approval Signatures */}
                <div className="grid grid-cols-2 gap-8 text-center pt-4">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-medium block">Prepared by:</span>
                    <div className="pt-6 pb-1 border-b-2 border-slate-800">
                      <h5 className="text-xs font-black text-slate-900 uppercase">ELMER V. FABROS</h5>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 block">Education Program Specialist II- ALS</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-medium block">Checked by:</span>
                    <div className="pt-6 pb-1 border-b-2 border-slate-800">
                      <h5 className="text-xs font-black text-slate-900 uppercase">RENE B. MICLAT, PhD</h5>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 block">PSDS / Division ALS Coordinator</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white border-t border-slate-300 p-4 px-6 flex items-center justify-between shrink-0 print:hidden">
              <div className="text-xs text-slate-500 font-semibold">
                Clicking <strong className="text-slate-900">Print Document Now</strong> opens your system printer in A4 Landscape mode. Clicking <strong className="text-slate-900">Download PDF</strong> exports a crisp multi-page A4 Landscape document.
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
                  <Download className="w-4 h-4" /> {isGeneratingPdf ? 'Saving PDF...' : 'Download PDF (A4 Landscape)'}
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

    </div>
  );
}
