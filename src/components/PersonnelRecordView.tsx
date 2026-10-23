/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Teacher Profile and Performance Rating Registry
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { safeSetJSON } from '../utils/safeStorage';
import { 
  Users, 
  User, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Briefcase, 
  GraduationCap, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Download, 
  RotateCcw,
  Heart,
  Sparkles,
  Award,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle,
  FileText,
  ShieldCheck,
  Percent,
  Compass,
  FileCheck2,
  Lock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Database,
  FolderOpen,
  Building2
} from 'lucide-react';
import { motion } from 'motion/react';
import { PersonnelRecord } from '../types';

const SEED_PERSONNEL_RECORDS: PersonnelRecord[] = [
  {
    id: 'pers-1',
    employeeNo: 'DEPED-2018-8021',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
    teacherName: 'AQUINO, MELODY ANNE B.',
    schoolAssigned: 'Tarlac West Central Elementary School',
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
    file201Link: 'https://drive.google.com/drive/folders/mock-201-melody-aquino',
    performanceRating: 4.88,
    adjectivalRating: 'Outstanding',
    linkToPr: 'https://docs.google.com/spreadsheets/d/mock-pr-1/edit'
  },
  {
    id: 'pers-2',
    employeeNo: 'DEPED-2020-1492',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    teacherName: 'CALDOZA, MERVIN C.',
    schoolAssigned: 'San Vicente Elementary School',
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
    file201Link: 'https://drive.google.com/drive/folders/mock-201-mervin-caldoza',
    performanceRating: 4.62,
    adjectivalRating: 'Outstanding',
    linkToPr: 'https://docs.google.com/spreadsheets/d/mock-pr-2/edit'
  },
  {
    id: 'pers-3',
    employeeNo: 'DEPED-2015-0520',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    teacherName: 'DOMINGO, REYNALDO M. JR.',
    schoolAssigned: 'Sto. Cristo Integrated School',
    gender: 'Male',
    birthDate: '1980-01-05',
    age: 46,
    civilStatus: 'Married',
    email: 'reynaldo.domingo@deped.gov.ph',
    position: 'Mobile Teacher',
    careerStage: 'Highly Proficient',
    salaryGrade: 'SG-15',
    stepIncrement: 'Step 5',
    contactNo: '+63 945 101 4482',
    permanentAddress: 'Block 12 Lot 9, Phase 2, Ligtasan Subd, Tarlac City',
    highestEducationalAttainment: 'Bachelor of Elementary Education (BEEd)',
    eligibility: 'LET (Board for Professional Teachers)',
    eligibilityRating: '84.80%',
    dateAppointed: '2015-03-15',
    yearsInService: 11,
    dateAppointedALS: '2016-06-01',
    yearsInServiceALS: 10,
    gsisNo: '193019482-T',
    pagIbigNo: '9018-3841-1029',
    philHealthNo: '44-192840192-5',
    prcNo: '0519284',
    tinNo: '119-204-586-000',
    file201Link: 'https://drive.google.com/drive/folders/mock-201-reynaldo-domingo',
    performanceRating: 4.45,
    adjectivalRating: 'Very Satisfactory',
    linkToPr: 'https://docs.google.com/spreadsheets/d/mock-pr-3/edit'
  },
  {
    id: 'pers-4',
    employeeNo: 'DEPED-2021-3041',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    teacherName: 'CANLAS, ANGELICA G.',
    schoolAssigned: 'San Roque Elementary School',
    gender: 'Female',
    birthDate: '1993-08-14',
    age: 32,
    civilStatus: 'Single',
    email: 'angelica.canlas@deped.gov.ph',
    position: 'Mobile Teacher',
    careerStage: 'Proficient',
    salaryGrade: 'SG-11',
    stepIncrement: 'Step 1',
    contactNo: '+63 936 505 1198',
    permanentAddress: '78 Barangay San Roque, Tarlac City, Tarlac',
    highestEducationalAttainment: 'Bachelor of Secondary Education (BSEd)',
    eligibility: 'LET (Board for Professional Teachers)',
    eligibilityRating: '80.50%',
    dateAppointed: '2021-09-12',
    yearsInService: 5,
    dateAppointedALS: '2021-09-12',
    yearsInServiceALS: 5,
    gsisNo: '401928410-X',
    pagIbigNo: '2019-3841-1182',
    philHealthNo: '52-391039401-9',
    prcNo: '1102930',
    tinNo: '392-102-394-000',
    file201Link: 'https://drive.google.com/drive/folders/mock-201-angelica-canlas',
    performanceRating: 4.58,
    adjectivalRating: 'Very Satisfactory',
    linkToPr: 'https://docs.google.com/spreadsheets/d/mock-pr-4/edit'
  },
  {
    id: 'pers-5',
    employeeNo: 'DEPED-2019-4112',
    imageUrl: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=150&h=150&q=80',
    teacherName: 'DIONISIO, RUSSEL M.',
    schoolAssigned: 'Tibag Elementary School',
    gender: 'Male',
    birthDate: '1988-10-28',
    age: 37,
    civilStatus: 'Married',
    email: 'russel.dionisio@deped.gov.ph',
    position: 'Mobile Teacher',
    careerStage: 'Proficient',
    salaryGrade: 'SG-12',
    stepIncrement: 'Step 3',
    contactNo: '+63 928 313 0041',
    permanentAddress: 'Villa Soliman Barangay Tibag, Tarlac City, Tarlac',
    highestEducationalAttainment: 'Master of Arts in Education (MAEd) - Enrolled',
    eligibility: 'LET (Board for Professional Teachers)',
    eligibilityRating: '85.20%',
    dateAppointed: '2019-05-20',
    yearsInService: 7,
    dateAppointedALS: '2019-05-20',
    yearsInServiceALS: 7,
    gsisNo: '592810398-E',
    pagIbigNo: '4820-9103-2940',
    philHealthNo: '19-204910294-0',
    prcNo: '0892041',
    tinNo: '294-102-192-000',
    file201Link: 'https://drive.google.com/drive/folders/mock-201-russel-dionisio',
    performanceRating: 4.70,
    adjectivalRating: 'Outstanding',
    linkToPr: 'https://docs.google.com/spreadsheets/d/mock-pr-5/edit'
  },
  {
    id: 'pers-6',
    employeeNo: 'DEPED-2022-0941',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    teacherName: 'CAPIENDO, RANIELLE PAOLO D.',
    schoolAssigned: 'Tarlac National High School - Main',
    gender: 'Male',
    birthDate: '1995-02-11',
    age: 31,
    civilStatus: 'Single',
    email: 'ranielle.capiendo@deped.gov.ph',
    position: 'ALS Teacher',
    careerStage: 'Proficient',
    salaryGrade: 'SG-11',
    stepIncrement: 'Step 2',
    contactNo: '+63 955 882 1032',
    permanentAddress: 'Brgy. San Vicente, Tarlac City',
    highestEducationalAttainment: 'Bachelor of Secondary Education (BSEd)',
    eligibility: 'LET',
    eligibilityRating: '81.10%',
    dateAppointed: '2022-01-10',
    yearsInService: 4,
    dateAppointedALS: '2022-01-10',
    yearsInServiceALS: 4,
    gsisNo: '192039485-M',
    pagIbigNo: '1029-4562-1249',
    philHealthNo: '10-294829102-3',
    prcNo: '1029481',
    tinNo: '491-391-204-000',
    file201Link: 'https://drive.google.com/drive/folders/mock-201-ranielle-capiendo',
    performanceRating: 4.51,
    adjectivalRating: 'Very Satisfactory',
    linkToPr: 'https://docs.google.com/spreadsheets/d/mock-pr-6/edit'
  }
];

export const TEACHER_NAMES_FILTER_LIST = [
  "Melody Anne B. Aquino",
  "Mervin C. Caldoza",
  "Angelica G. Canlas",
  "Ranielle Paolo D. Capiendo",
  "Russel M. Dionisio",
  "Reynaldo M. Domingo Jr.",
  "Jenny I. Dueñas",
  "Celeste R. Espinosa",
  "Antonio B. Guban",
  "Arnold T. Lumba",
  "Jennilyn D. Martinez",
  "Jumar M. Mendoza",
  "Ricardo S. Morales",
  "Julius C. Pangilinan",
  "Mariella A. Pornillosa",
  "Heizel B. Pucate",
  "Ramil H. Valentino",
  "Joel D. Baquing",
  "Joel L. Abad",
  "Ma. Monique A. Francisco",
  "Janice J. Gamis",
  "Cindy M. Valete"
];

export function getRenderableImageUrl(url: string): string {
  if (!url) return 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80';
  const cleanUrl = url.trim();
  if (cleanUrl.includes('drive.google.com')) {
    let fileId = '';
    const fileDMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch && fileDMatch[1]) {
      fileId = fileDMatch[1];
    } else {
      const idMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        fileId = idMatch[1];
      }
    }
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w150`;
    }
  }
  return cleanUrl;
}

export function isSameTeacher(dbName: string, filterName: string): boolean {
  if (!dbName || !filterName) return false;
  if (filterName === 'All') return true;
  
  const cleanDb = dbName.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const cleanFilter = filterName.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  
  const dbWords = cleanDb.split(/\s+/).filter(Boolean);
  const filterWords = cleanFilter.split(/\s+/).filter(Boolean);
  
  const matchCount = filterWords.filter(word => {
    if (word.length === 1) return true; 
    return dbWords.some(dbWord => dbWord.includes(word) || word.includes(dbWord));
  }).length;
  
  return matchCount >= filterWords.filter(word => word.length > 1).length;
}

export function PersonnelRecordView({ viewMode = 'profile' }: { viewMode?: 'dashboard' | 'profile' }) {
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

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

        // We can key by both name and employee ID for flexible lookups
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
          // Get the latest year's rating
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
      setPersonnel(mergedProfiles);
      setSyncMessage(`Success: Synchronized ${mergedProfiles.length} teacher profiles with multi-year historical ratings.`);
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err: any) {
      console.error('Sync failed:', err);
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

  const [personnel, setPersonnel] = useState<PersonnelRecord[]>(() => {
    const saved = localStorage.getItem('tcsd_personnel_records');
    if (!saved) return SEED_PERSONNEL_RECORDS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((p: any) => {
          let teacherName = p.teacherName;
          if (!teacherName && (p.lastName || p.firstName)) {
            teacherName = `${p.lastName || ''}, ${p.firstName || ''} ${p.middleName || ''}`.trim().toUpperCase();
          }
          return {
            id: p.id || `pers-${Math.random()}`,
            employeeNo: p.employeeNo || `DEPED-MIGRATED-${Math.floor(1000 + Math.random() * 9000)}`,
            imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
            teacherName: teacherName || 'UNKNOWN TEACHER',
            gender: p.gender || 'Female',
            birthDate: p.birthDate || '1990-01-01',
            age: typeof p.age === 'number' ? p.age : 36,
            civilStatus: p.civilStatus || 'Single',
            email: p.email || '',
            position: p.position || 'Mobile Teacher',
            careerStage: p.careerStage || 'Proficient',
            salaryGrade: p.salaryGrade || 'SG-11',
            stepIncrement: p.stepIncrement || 'Step 1',
            contactNo: p.contactNo || '',
            permanentAddress: p.permanentAddress || p.stationAssignment || 'Tarlac City, Tarlac',
            highestEducationalAttainment: p.highestEducationalAttainment || '',
            eligibility: p.eligibility || 'LET',
            eligibilityRating: p.eligibilityRating || '80.00%',
            dateAppointed: p.dateAppointed || '2020-01-01',
            yearsInService: typeof p.yearsInService === 'number' ? p.yearsInService : 6,
            dateAppointedALS: p.dateAppointedALS || p.dateAppointed || '2020-01-01',
            yearsInServiceALS: typeof p.yearsInServiceALS === 'number' ? p.yearsInServiceALS : 6,
            gsisNo: p.gsisNo || '',
            pagIbigNo: p.pagIbigNo || '',
            philHealthNo: p.philHealthNo || '',
            prcNo: p.prcNo || '',
            tinNo: p.tinNo || '',
            performanceRating: typeof p.performanceRating === 'number' ? p.performanceRating : 4.50,
            adjectivalRating: p.adjectivalRating || 'Very Satisfactory',
            linkToPr: p.linkToPr || 'https://docs.google.com/spreadsheets/d/mock-pr/edit'
          };
        });
      }
    } catch (e) {
      console.error("Failed to parse personnel records", e);
    }
    return SEED_PERSONNEL_RECORDS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('All');
  const [selectedRatingGroup, setSelectedRatingGroup] = useState('All');

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonnelRecord | null>(null);

  // Form fields
  const [formEmployeeNo, setFormEmployeeNo] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formTeacherName, setFormTeacherName] = useState('');
  const [formSchoolAssigned, setFormSchoolAssigned] = useState('Tarlac West Central ES');
  const [formFile201Link, setFormFile201Link] = useState('');
  const [formGender, setFormGender] = useState<'Male' | 'Female'>('Male');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formCivilStatus, setFormCivilStatus] = useState<'Single' | 'Married' | 'Widowed' | 'Separated'>('Single');
  const [formEmail, setFormEmail] = useState('');
  const [formPosition, setFormPosition] = useState('Mobile Teacher');
  const [formCareerStage, setFormCareerStage] = useState('Proficient');
  const [formSalaryGrade, setFormSalaryGrade] = useState('SG-11');
  const [formStepIncrement, setFormStepIncrement] = useState('Step 1');
  const [formContactNo, setFormContactNo] = useState('');
  const [formPermanentAddress, setFormPermanentAddress] = useState('');
  const [formHighestEducationalAttainment, setFormHighestEducationalAttainment] = useState('');
  const [formEligibility, setFormEligibility] = useState('');
  const [formEligibilityRating, setFormEligibilityRating] = useState('');
  const [formDateAppointed, setFormDateAppointed] = useState('');
  const [formDateAppointedALS, setFormDateAppointedALS] = useState('');
  const [formGsisNo, setFormGsisNo] = useState('');
  const [formPagIbigNo, setFormPagIbigNo] = useState('');
  const [formPhilHealthNo, setFormPhilHealthNo] = useState('');
  const [formPrcNo, setFormPrcNo] = useState('');
  const [formTinNo, setFormTinNo] = useState('');
  const [formPerformanceRating, setFormPerformanceRating] = useState('4.50');
  const [formAdjectivalRating, setFormAdjectivalRating] = useState<'Outstanding' | 'Very Satisfactory' | 'Satisfactory' | 'Unsatisfactory' | 'Poor'>('Very Satisfactory');
  const [formLinkToPr, setFormLinkToPr] = useState('');

  // Auto-persist in localStorage
  useEffect(() => {
    safeSetJSON('tcsd_personnel_records', personnel);
  }, [personnel]);

  // Year computations helper
  const computeYearsSince = (dateStr: string) => {
    if (!dateStr) return 0;
    const yearParsed = parseInt(dateStr.split('-')[0], 10);
    if (isNaN(yearParsed)) return 0;
    return Math.max(0, 2026 - yearParsed); // Local anchor is 2026
  };

  // Age computing
  const computeAge = (birthdayStr: string) => {
    if (!birthdayStr) return 30;
    const yearParsed = parseInt(birthdayStr.split('-')[0], 10);
    if (isNaN(yearParsed)) return 30;
    return Math.max(18, 2026 - yearParsed);
  };

  // Compute stats
  const stats = useMemo(() => {
    const total = personnel.length;
    let sumRating = 0;
    personnel.forEach(p => {
      sumRating += p.performanceRating || 0;
    });
    const avgRating = total > 0 ? (sumRating / total).toFixed(2) : '0.00';
    const outstandingCount = personnel.filter(p => p.adjectivalRating === 'Outstanding').length;
    const vsCount = personnel.filter(p => p.adjectivalRating === 'Very Satisfactory').length;

    return {
      total,
      avgRating,
      outstandingCount,
      verySatisfactoryCount: vsCount
    };
  }, [personnel]);

  // Apply filters
  const filteredPersonnel = useMemo(() => {
    return personnel.filter(p => {
      const fieldSearch = searchQuery.toLowerCase();
      const matchQuery = 
        (p.teacherName || '').toLowerCase().includes(fieldSearch) ||
        (p.employeeNo || '').toLowerCase().includes(fieldSearch) ||
        (p.schoolAssigned || '').toLowerCase().includes(fieldSearch) ||
        (p.position || '').toLowerCase().includes(fieldSearch) ||
        (p.highestEducationalAttainment || '').toLowerCase().includes(fieldSearch) ||
        (p.eligibility || '').toLowerCase().includes(fieldSearch);

      const matchTeacher = selectedTeacherFilter === 'All' || isSameTeacher(p.teacherName, selectedTeacherFilter);
      
      let matchRating = true;
      if (selectedRatingGroup !== 'All') {
        matchRating = p.adjectivalRating === selectedRatingGroup;
      }

      return matchQuery && matchTeacher && matchRating;
    });
  }, [personnel, searchQuery, selectedTeacherFilter, selectedRatingGroup]);

  // Open creation modal
  const handleAddClick = () => {
    setEditingItem(null);
    setFormEmployeeNo(`DEPED-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormImageUrl('https://images.unsplash.com/photo-1544055313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80');
    setFormTeacherName('');
    setFormSchoolAssigned('Tarlac West Central Elementary School');
    setFormFile201Link('');
    setFormGender('Female');
    setFormBirthDate('1990-05-15');
    setFormCivilStatus('Married');
    setFormEmail('');
    setFormPosition('Mobile Teacher');
    setFormCareerStage('Proficient');
    setFormSalaryGrade('SG-12');
    setFormStepIncrement('Step 1');
    setFormContactNo('+63 9');
    setFormPermanentAddress('Tarlac City, Tarlac');
    setFormHighestEducationalAttainment('Bachelor of Secondary Education (BSEd)');
    setFormEligibility('LET (Teacher Board)');
    setFormEligibilityRating('84.00%');
    setFormDateAppointed('2020-06-15');
    setFormDateAppointedALS('2021-01-10');
    setFormGsisNo(`${Math.floor(100000000 + Math.random() * 900000000)}-M`);
    setFormPagIbigNo('1210-2291-3041');
    setFormPhilHealthNo('09-122938491-1');
    setFormPrcNo(`${Math.floor(1000000 + Math.random() * 9000000)}`);
    setFormTinNo('491-209-112-000');
    setFormPerformanceRating('4.65');
    setFormAdjectivalRating('Outstanding');
    setFormLinkToPr('https://docs.google.com/spreadsheets/d/mock-pr/edit');
    setShowModal(true);
  };

  // Open edit modal
  const handleEditClick = (p: PersonnelRecord) => {
    setEditingItem(p);
    setFormEmployeeNo(p.employeeNo);
    setFormImageUrl(p.imageUrl || '');
    setFormTeacherName(p.teacherName);
    setFormSchoolAssigned(p.schoolAssigned || 'Tarlac West Central Elementary School');
    setFormFile201Link(p.file201Link || '');
    setFormGender(p.gender);
    setFormBirthDate(p.birthDate);
    setFormCivilStatus(p.civilStatus);
    setFormEmail(p.email);
    setFormPosition(p.position);
    setFormCareerStage(p.careerStage);
    setFormSalaryGrade(p.salaryGrade);
    setFormStepIncrement(p.stepIncrement);
    setFormContactNo(p.contactNo);
    setFormPermanentAddress(p.permanentAddress || '');
    setFormHighestEducationalAttainment(p.highestEducationalAttainment || '');
    setFormEligibility(p.eligibility || '');
    setFormEligibilityRating(p.eligibilityRating || '');
    setFormDateAppointed(p.dateAppointed || '');
    setFormDateAppointedALS(p.dateAppointedALS || '');
    setFormGsisNo(p.gsisNo || '');
    setFormPagIbigNo(p.pagIbigNo || '');
    setFormPhilHealthNo(p.philHealthNo || '');
    setFormPrcNo(p.prcNo || '');
    setFormTinNo(p.tinNo || '');
    setFormPerformanceRating(String(p.performanceRating || '4.00'));
    setFormAdjectivalRating(p.adjectivalRating || 'Very Satisfactory');
    setFormLinkToPr(p.linkToPr || '');
    setShowModal(true);
  };

  // Delete personnel file
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you absolutely sure you want to permanently delete the profile of teacher "${name}"?\nThis will remove all their profile records and performance ratings.`)) {
      setPersonnel(prev => prev.filter(p => p.id !== id));
    }
  };

  // Restore fallback seed
  const handleReset = () => {
    if (window.confirm('Reset Teacher Profiles and Ratings to initial DepEd Tarlac City baseline data? All modifications will be lost.')) {
      setPersonnel(SEED_PERSONNEL_RECORDS);
    }
  };

  // Handle submit form
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTeacherName.trim()) {
      alert('Please fill in the Teacher Name.');
      return;
    }

    if (!formEmployeeNo.trim()) {
      alert('Please specify the Employee ID.');
      return;
    }

    const age = computeAge(formBirthDate);
    const yearsInService = computeYearsSince(formDateAppointed);
    const yearsInServiceALS = computeYearsSince(formDateAppointedALS);
    const numericalRating = parseFloat(formPerformanceRating) || 0.00;

    // Auto calculate adjectival rating based on score
    let computedAdjectival: 'Outstanding' | 'Very Satisfactory' | 'Satisfactory' | 'Unsatisfactory' | 'Poor' = 'Very Satisfactory';
    if (numericalRating >= 4.5) {
      computedAdjectival = 'Outstanding';
    } else if (numericalRating >= 3.5) {
      computedAdjectival = 'Very Satisfactory';
    } else if (numericalRating >= 2.5) {
      computedAdjectival = 'Satisfactory';
    } else if (numericalRating >= 1.5) {
      computedAdjectival = 'Unsatisfactory';
    } else {
      computedAdjectival = 'Poor';
    }

    const payload: PersonnelRecord = {
      id: editingItem ? editingItem.id : `pers-${Date.now()}`,
      employeeNo: formEmployeeNo.trim(),
      imageUrl: formImageUrl.trim() || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
      teacherName: formTeacherName.trim().toUpperCase(),
      schoolAssigned: formSchoolAssigned.trim() || 'Tarlac West Central Elementary School',
      gender: formGender,
      birthDate: formBirthDate,
      age,
      civilStatus: formCivilStatus,
      email: formEmail.trim().toLowerCase(),
      position: formPosition.trim(),
      careerStage: formCareerStage.trim(),
      salaryGrade: formSalaryGrade.trim(),
      stepIncrement: formStepIncrement.trim(),
      contactNo: formContactNo.trim(),
      permanentAddress: formPermanentAddress.trim(),
      highestEducationalAttainment: formHighestEducationalAttainment.trim(),
      eligibility: formEligibility.trim(),
      eligibilityRating: formEligibilityRating.trim(),
      dateAppointed: formDateAppointed,
      yearsInService,
      dateAppointedALS: formDateAppointedALS,
      yearsInServiceALS,
      gsisNo: formGsisNo.trim(),
      pagIbigNo: formPagIbigNo.trim(),
      philHealthNo: formPhilHealthNo.trim(),
      prcNo: formPrcNo.trim(),
      tinNo: formTinNo.trim(),
      file201Link: formFile201Link.trim(),
      performanceRating: numericalRating,
      adjectivalRating: computedAdjectival,
      linkToPr: formLinkToPr.trim() || 'https://docs.google.com/spreadsheets/d/mock-pr/edit'
    };

    if (editingItem) {
      setPersonnel(prev => prev.map(p => p.id === editingItem.id ? payload : p));
    } else {
      setPersonnel(prev => [payload, ...prev]);
    }

    setShowModal(false);
  };

  // Export CSV helper with exact requested column order
  const handleExportCSV = () => {
    // Left profile columns matching requested specification
    const headers = [
      'No.', 'Employee ID', 'Teacher Name', 'IMAGE 2 X 2 (Link)', 'School Assigned (Form 3)',
      'Sex', 'Date of Birth', 'Age', 'Civil Status', 'Email Address', 'Position', 'Career Stage',
      'Salary Grade', 'Step Increment', 'Mobile Number', 'Permanent Address',
      'Highest Educational Attainment', 'Eligibility', 'Eligibility Rating',
      'Original Date of Appointment', 'Years in Service', 'Date of Appointment on ALS',
      'Years in Service in ALS', 'GSIS Number', 'Pag-IBIG No.', 'PhilHealth No.',
      'PRC No.', 'TIN No.', '201 File Link'
    ];

    const rows = filteredPersonnel.map((p, idx) => [
      idx + 1,
      `"${p.employeeNo}"`,
      `"${p.teacherName}"`,
      `"${p.imageUrl}"`,
      `"${p.schoolAssigned || 'Tarlac West Central ES'}"`,
      `"${p.gender}"`,
      `"${p.birthDate}"`,
      p.age,
      `"${p.civilStatus}"`,
      `"${p.email}"`,
      `"${p.position}"`,
      `"${p.careerStage}"`,
      `"${p.salaryGrade}"`,
      `"${p.stepIncrement}"`,
      `"${p.contactNo}"`,
      `"${p.permanentAddress}"`,
      `"${p.highestEducationalAttainment}"`,
      `"${p.eligibility}"`,
      `"${p.eligibilityRating}"`,
      `"${p.dateAppointed}"`,
      p.yearsInService,
      `"${p.dateAppointedALS}"`,
      p.yearsInServiceALS,
      `"${p.gsisNo || ''}"`,
      `"${p.pagIbigNo || ''}"`,
      `"${p.philHealthNo || ''}"`,
      `"${p.prcNo || ''}"`,
      `"${p.tinNo || ''}"`,
      `"${p.file201Link || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tcsd_teacher_profiles_registry_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (viewMode === 'dashboard') {
    // Calculate custom dashboard analytics
    const highlyProficientCount = personnel.filter(p => p.careerStage.includes('Highly')).length;
    const proficientCount = stats.total - highlyProficientCount;
    
    const seniorTenureCount = personnel.filter(p => (p.yearsInService || 0) >= 10).length;
    const midTenureCount = personnel.filter(p => (p.yearsInService || 0) >= 5 && (p.yearsInService || 0) < 10).length;
    const juniorTenureCount = personnel.filter(p => (p.yearsInService || 0) < 5).length;

    const masterCount = personnel.filter(p => (p.highestEducationalAttainment || '').includes('Master') || (p.highestEducationalAttainment || '').includes('MAEd')).length;
    const bachelorCount = personnel.filter(p => (p.highestEducationalAttainment || '').includes('Bachelor') || (p.highestEducationalAttainment || '').includes('BSEd') || (p.highestEducationalAttainment || '').includes('BEEd')).length;
    const otherEducationCount = Math.max(0, stats.total - masterCount - bachelorCount);

    // Administrative compliance
    const gsisLogged = personnel.filter(p => p.gsisNo && p.gsisNo !== '-').length;
    const pagIbigLogged = personnel.filter(p => p.pagIbigNo && p.pagIbigNo !== '-').length;
    const philHealthLogged = personnel.filter(p => p.philHealthNo && p.philHealthNo !== '-').length;
    const prcLogged = personnel.filter(p => p.prcNo && p.prcNo !== '-').length;
    const tinLogged = personnel.filter(p => p.tinNo && p.tinNo !== '-').length;

    // Spotlight high performers: sorted by performanceRating desc, limited to 3
    const spotlightTeachers = [...personnel]
      .sort((a, b) => (b.performanceRating || 0) - (a.performanceRating || 0))
      .slice(0, 3);

    return (
      <div id="personnel-dashboard-container" className="space-y-6">
        {/* Dashboard Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#002B6D] to-[#0A47A3] text-white p-6 rounded-3xl shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-400 text-[#002B6D] text-[9px] font-black rounded uppercase tracking-wider animate-pulse">
                Live Portal
              </span>
              <span className="text-[10px] text-sky-200 font-mono tracking-wider">
                DEPED SCHOOLS DIVISION OF TARLAC CITY
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2.5">
              <Compass className="w-5.5 h-5.5 text-amber-300 shrink-0" />
              Personnel Analytics & Performance Dashboard
            </h2>
            <p className="text-xs text-sky-100 max-w-3xl font-medium">
              Comprehensive live analytics of the schools division educator demographic, performance certifications, civil profiles, and administrative credentials.
            </p>
          </div>
          <div className="flex gap-2 text-xs font-bold bg-white/10 px-4.5 py-2 rounded-xl text-sky-200 select-none">
            Active Registry Version: <span className="text-white ml-1 font-mono font-black">2026.01</span>
          </div>
        </div>

        {/* Analytics KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#002B6D] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">Active Staff Count</span>
              <span className="text-xl font-black text-slate-800">{stats.total} Educators</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Mobile, Coordinator & ALS roles</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">Average Division Rating</span>
              <span className="text-xl font-black text-slate-800">{stats.avgRating} / 5.00</span>
              <span className="text-[9px] text-amber-600 font-bold block mt-0.5">Very Satisfactory Baseline</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">Outstanding Staff</span>
              <span className="text-xl font-black text-slate-800">{stats.outstandingCount} Teachers</span>
              <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">{((stats.outstandingCount / stats.total) * 100).toFixed(0)}% of total strength</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">Very Satisfactory</span>
              <span className="text-xl font-black text-slate-800">{stats.verySatisfactoryCount} Teachers</span>
              <span className="text-[9px] text-purple-600 font-bold block mt-0.5">{((stats.verySatisfactoryCount / stats.total) * 100).toFixed(0)}% of total strength</span>
            </div>
          </div>
        </div>

        {/* Visual Charts and Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Chart 1: Performance rating breakdown list */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black text-[#002B6D] uppercase tracking-wider mb-1 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                IPCRF Performance Rating Breakdown
              </h3>
              <p className="text-[11px] text-slate-400 mb-6 font-medium">
                Distribution of teachers across official DepEd performance groups based on formal evaluations.
              </p>

              <div className="space-y-4">
                {/* Outstanding bar */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                    <span className="text-slate-700 flex items-center gap-1.5 font-extrabold">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                      Outstanding (4.50 - 5.00)
                    </span>
                    <span className="text-[#002B6D] font-mono font-black">
                      {stats.outstandingCount} ({((stats.outstandingCount / Math.max(1, stats.total)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(stats.outstandingCount / Math.max(1, stats.total)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Very Satisfactory bar */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                    <span className="text-slate-700 flex items-center gap-1.5 font-extrabold">
                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                      Very Satisfactory (3.50 - 4.49)
                    </span>
                    <span className="text-[#002B6D] font-mono font-black">
                      {stats.verySatisfactoryCount} ({((stats.verySatisfactoryCount / Math.max(1, stats.total)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(stats.verySatisfactoryCount / Math.max(1, stats.total)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Satisfactory bar */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                    <span className="text-slate-700 flex items-center gap-1.5 font-extrabold">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                      Satisfactory (2.50 - 3.49)
                    </span>
                    <span className="text-[#002B6D] font-mono font-black">
                      {personnel.filter(p => p.adjectivalRating === 'Satisfactory').length} ({((personnel.filter(p => p.adjectivalRating === 'Satisfactory').length / Math.max(1, stats.total)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(personnel.filter(p => p.adjectivalRating === 'Satisfactory').length / Math.max(1, stats.total)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Unsatisfactory/Poor bar */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                    <span className="text-slate-700 flex items-center gap-1.5 font-extrabold">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                      Unsatisfactory & Below (&lt; 2.50)
                    </span>
                    <span className="text-[#002B6D] font-mono font-black">
                      {personnel.filter(p => p.adjectivalRating === 'Unsatisfactory' || p.adjectivalRating === 'Poor').length} (0.0%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `0%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] text-emerald-800 font-semibold mt-6 flex items-center gap-2 shadow-2xs">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Great news! 100% of ALS personnel in Division of Tarlac City meet outstanding or very satisfactory marks.</span>
            </div>
          </div>

          {/* Chart 2: Career Stage and Expertise Composition */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black text-[#002B6D] uppercase tracking-wider mb-1 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Career Stage & Position Composition
              </h3>
              <p className="text-[11px] text-slate-400 mb-6 font-medium">
                Distribution of educators across Professional stages (PPST guidelines) and active organizational roles.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-2">
                {/* Stage 1 Check */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Highly Proficient</span>
                    <span className="text-2xl font-black text-indigo-900 mt-1 block">{highlyProficientCount}</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-[10.5px] font-bold text-indigo-600 block">{((highlyProficientCount / Math.max(1, stats.total)) * 100).toFixed(0)}% division strength</span>
                    <div className="w-full bg-indigo-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-indigo-600 h-full block rounded-full" style={{ width: `${(highlyProficientCount / Math.max(1, stats.total)) * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Stage 2 Check */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Proficient Stage</span>
                    <span className="text-2xl font-black text-blue-900 mt-1 block">{proficientCount}</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-[10.5px] font-bold text-blue-600 block">{((proficientCount / Math.max(1, stats.total)) * 100).toFixed(0)}% division strength</span>
                    <div className="w-full bg-blue-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-blue-600 h-full block rounded-full" style={{ width: `${(proficientCount / Math.max(1, stats.total)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Roles Breakdown pill list */}
              <div className="mt-5 space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Staff Positions Density</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-3 py-1.5 bg-sky-50 text-sky-800 border border-sky-100 font-bold rounded-xl text-[10.5px] inline-flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                    District ALS Coordinator: <strong>{personnel.filter(p => (p.position || '').includes('Coordinator') || (p.position || '').includes('DALSC')).length}</strong>
                  </span>
                  <span className="px-3 py-1.5 bg-indigo-50 text-indigo-800 border border-indigo-100 font-bold rounded-xl text-[10.5px] inline-flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    Mobile Teachers: <strong>{personnel.filter(p => (p.position || '').includes('Mobile')).length}</strong>
                  </span>
                  <span className="px-3 py-1.5 bg-pink-50 text-pink-800 border border-pink-100 font-bold rounded-xl text-[10.5px] inline-flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-pink-600" />
                    Regular ALS Teachers: <strong>{personnel.filter(p => (p.position || '').includes('ALS Teacher')).length}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 3: Tenure & Service Brackets */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-[#002B6D] uppercase tracking-wider mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              Years in Service Tenure Brackets
            </h3>
            <p className="text-[11px] text-slate-400 mb-6 font-medium">
              Distribution of educators by administrative service duration milestone logs.
            </p>

            <div className="space-y-4.5">
              {/* Senior Brackets */}
              <div className="flex items-center gap-4">
                <div className="w-24 text-right pr-2">
                  <span className="text-xs font-black text-slate-600 block">10+ Years</span>
                  <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block">Senior staff</span>
                </div>
                <div className="grow">
                  <div className="w-full bg-slate-100 h-4.5 rounded-xl overflow-hidden relative flex items-center">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-rose-600 h-full rounded-xl transition-all duration-500"
                      style={{ width: `${(seniorTenureCount / Math.max(1, stats.total)) * 100}%` }}
                    />
                    <span className="absolute right-3 text-[10px] font-black text-slate-750 font-mono">
                      {seniorTenureCount} ({((seniorTenureCount / Math.max(1, stats.total)) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Mid Brackets */}
              <div className="flex items-center gap-4">
                <div className="w-24 text-right pr-2">
                  <span className="text-xs font-black text-slate-600 block">5 - 9 Years</span>
                  <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block">Intermediate</span>
                </div>
                <div className="grow">
                  <div className="w-full bg-slate-100 h-4.5 rounded-xl overflow-hidden relative flex items-center">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-xl transition-all duration-500"
                      style={{ width: `${(midTenureCount / Math.max(1, stats.total)) * 100}%` }}
                    />
                    <span className="absolute right-3 text-[10px] font-black text-slate-750 font-mono">
                      {midTenureCount} ({((midTenureCount / Math.max(1, stats.total)) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Rising Brackets */}
              <div className="flex items-center gap-4">
                <div className="w-24 text-right pr-2">
                  <span className="text-xs font-black text-slate-600 block">&lt; 5 Years</span>
                  <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block">Rising staff</span>
                </div>
                <div className="grow">
                  <div className="w-full bg-slate-100 h-4.5 rounded-xl overflow-hidden relative flex items-center">
                    <div 
                      className="bg-gradient-to-r from-emerald-400 to-green-500 h-full rounded-xl transition-all duration-500"
                      style={{ width: `${(juniorTenureCount / Math.max(1, stats.total)) * 100}%` }}
                    />
                    <span className="absolute right-3 text-[10px] font-black text-slate-750 font-mono">
                      {juniorTenureCount} ({((juniorTenureCount / Math.max(1, stats.total)) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[9.5px] uppercase font-black text-slate-450 tracking-wider block">Division Tenure Peak</span>
                <span className="text-base font-black text-slate-800 mt-1 block">11 Years</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[9.5px] uppercase font-black text-slate-450 tracking-wider block">Average Experience</span>
                <span className="text-base font-black text-slate-800 mt-1 block">6.5 Years</span>
              </div>
            </div>
          </div>

          {/* Chart 4: Admin Compliance checklist score */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black text-[#002B6D] uppercase tracking-wider mb-1 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Administrative Compliance Checklist Details
              </h3>
              <p className="text-[11px] text-slate-400 mb-6 font-medium">
                Ensures 100% database registration of standard statutory benefit identifiers and professional licenses.
              </p>

              <div className="space-y-3">
                {/* 1. PRC License */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    PRC Professional Teacher Board License No.
                  </span>
                  <span className="font-mono bg-blue-50 text-[#002B6D] font-black px-2.5 py-0.5 rounded-lg border border-blue-100">
                    {prcLogged} / {stats.total} ({((prcLogged/stats.total)*100).toFixed(0)}%)
                  </span>
                </div>

                {/* 2. GSIS */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    GSIS Government Account Identifiers
                  </span>
                  <span className="font-mono bg-blue-50 text-[#002B6D] font-black px-2.5 py-0.5 rounded-lg border border-blue-100">
                    {gsisLogged} / {stats.total} ({((gsisLogged/stats.total)*100).toFixed(0)}%)
                  </span>
                </div>

                {/* 3. Pag-ibig */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    PAG-IBIG Home Mutual Account Registries
                  </span>
                  <span className="font-mono bg-blue-50 text-[#002B6D] font-black px-2.5 py-0.5 rounded-lg border border-blue-100">
                    {pagIbigLogged} / {stats.total} ({((pagIbigLogged/stats.total)*100).toFixed(0)}%)
                  </span>
                </div>

                {/* 4. Philhealth */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    PhilHealth Medical Insurance Logs
                  </span>
                  <span className="font-mono bg-blue-50 text-[#002B6D] font-black px-2.5 py-0.5 rounded-lg border border-blue-100">
                    {philHealthLogged} / {stats.total} ({((philHealthLogged/stats.total)*100).toFixed(0)}%)
                  </span>
                </div>

                {/* 5. TIN */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    TIN Internal Revenue Tax Registry Cards
                  </span>
                  <span className="font-mono bg-blue-50 text-[#002B6D] font-black px-2.5 py-0.5 rounded-lg border border-blue-100">
                    {tinLogged} / {stats.total} ({((tinLogged/stats.total)*100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3.5 mt-4 border-t border-slate-100 flex items-center justify-between text-[10.5px] font-bold text-slate-450">
              <span>Overall Administrative compliance:</span>
              <span className="text-emerald-600 font-extrabold font-mono uppercase bg-emerald-50 p-1 px-2 rounded-md">100% SECURED REGISTERED</span>
            </div>
          </div>

        </div>

        {/* Section: Outstanding Spotlight Recognition Grid */}
        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-sm space-y-4">
          <div className="space-y-0.5">
            <span className="text-[10px] text-amber-400 font-black tracking-widest uppercase block">
              Educators Honor Spotlight
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-amber-400" />
              Division of Tarlac City Spotlight High Performers
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {spotlightTeachers.map((teacher, idx) => (
              <div 
                key={`spot-${teacher.id}`} 
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 hover:bg-white/8 transition-colors relative overflow-hidden"
              >
                <div className="absolute top-3 right-3 text-xs font-mono font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                  ★ # {idx + 1}
                </div>

                <img 
                  src={getRenderableImageUrl(teacher.imageUrl)} 
                  alt={teacher.teacherName} 
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0 self-center"
                />

                <div className="space-y-1 self-center">
                  <h4 className="text-xs font-black truncate max-w-[170px]" title={teacher.teacherName}>
                    {teacher.teacherName}
                  </h4>
                  <p className="text-[10px] text-indigo-200 font-black">
                    {teacher.position}
                  </p>
                  <p className="text-[10px] text-amber-300 font-bold font-mono">
                    IPCRF Score: {teacher.performanceRating.toFixed(2)} ({teacher.adjectivalRating})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="teacher-profile-container" className="space-y-6">
      
      {/* Header section with DepEd/TCSD Theme */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#002B6D] to-[#0A47A3] text-white p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-sky-400 text-[#002B6D] text-[9px] font-black rounded uppercase tracking-wider">
              Sub-Portal
            </span>
            <span className="text-[10px] text-sky-200 font-mono tracking-wider">
              DEPED SCHOOLS DIVISION OF TARLAC CITY
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2.5">
            <Users className="w-5.5 h-5.5 text-sky-200 shrink-0" />
            Teacher Profile & Performance Ratings
          </h2>
          <p className="text-xs text-sky-100 max-w-3xl font-medium">
            National Registry Database for ALS Educators and Mobile Teachers. Tracks images, personal biological data, Government agency accounts, academic records, and career stage performance evaluations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 self-start md:self-center">
          <button
            onClick={handleAddClick}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all outline-none cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Register Teacher Profile
          </button>

          <button
            onClick={handleSyncFromSheets}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-550 hover:bg-sky-600 disabled:bg-sky-700 text-white border border-sky-400 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all outline-none cursor-pointer"
            title="Sync Profiles & Ratings from SDO Tarlac Sheets"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync SDO Sheets'}
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/12 hover:bg-white/18 text-white border border-white/15 rounded-xl text-xs font-bold active:scale-95 transition-all outline-none cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Database CSV
          </button>
          
          <button
            onClick={handleReset}
            className="flex items-center justify-center p-2.5 bg-white/5 hover:bg-white/10 text-sky-100 hover:text-white border border-white/5 hover:border-white/10 rounded-xl text-xs font-medium active:scale-95 transition-all outline-none cursor-pointer"
            title="Reset to DepEd Tarlac Baseline Baseline Data"
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

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#002B6D]" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Teachers</span>
            <span className="text-lg font-black text-slate-800">{stats.total} Active Profile Sheets</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Mid-Year Performance KPI</span>
            <span className="text-lg font-black text-slate-800">{stats.avgRating} / 5.00 Avg GP</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Outstanding Rating</span>
            <span className="text-lg font-black text-slate-800">{stats.outstandingCount} High Performers</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Very Satisfactory</span>
            <span className="text-lg font-black text-slate-800">{stats.verySatisfactoryCount} Educators</span>
          </div>
        </div>
      </div>

      {/* Control Filter panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grow relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search database by Teacher Name, Employee ID, Position, Academic background, Eligibility..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold placeholder-slate-450 focus:bg-white focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] transition-all outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 shrink-0 items-center">
          <select
            value={selectedTeacherFilter}
            onChange={e => setSelectedTeacherFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none cursor-pointer max-w-[200px]"
            title="Filter by Name of Teacher"
          >
            <option value="All">All Teachers</option>
            {TEACHER_NAMES_FILTER_LIST.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          <select
            value={selectedRatingGroup}
            onChange={e => setSelectedRatingGroup(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none cursor-pointer"
          >
            <option value="All">All Rating Groups</option>
            <option value="Outstanding">Outstanding</option>
            <option value="Very Satisfactory">Very Satisfactory</option>
            <option value="Satisfactory">Satisfactory</option>
          </select>
        </div>
      </div>

      {/* DUAL TABLES CONTAINER: SIDE-BY-SIDE GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* TABLE 1 (LEFT PANE / 7 COLS): TEACHER PROFILE */}
        <div className="xl:col-span-12 bg-white border border-slate-200/85 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/75 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#002B6D]" />
              <h3 className="text-xs font-black text-[#002B6D] uppercase tracking-wider">
                Teacher Profile Database Table
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-450 font-bold bg-slate-100 px-2.5 py-1 rounded-full">
              {filteredPersonnel.length} listed profiles
            </span>
          </div>

          <div className="relative group/table grow">
            {/* Floating Left Smooth-Scrolling Arrow Slider */}
            <button
              type="button"
              onClick={() => scrollTable('left')}
              className="absolute left-3 top-[50%] -translate-y-1/2 z-40 p-3 bg-white hover:bg-[#002B6D] text-slate-700 hover:text-white border border-slate-200 shadow-md rounded-full opacity-0 group-hover/table:opacity-95 hover:opacity-100 transition-all focus:outline-none flex items-center justify-center cursor-pointer transform hover:scale-110 active:scale-95 duration-150 backdrop-blur-xs print:hidden"
              title="Scroll Left"
              aria-label="Scroll table left"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Floating Right Smooth-Scrolling Arrow Slider */}
            <button
              type="button"
              onClick={() => scrollTable('right')}
              className="absolute right-3 top-[50%] -translate-y-1/2 z-40 p-3 bg-white hover:bg-[#002B6D] text-slate-700 hover:text-white border border-slate-200 shadow-md rounded-full opacity-0 group-hover/table:opacity-95 hover:opacity-100 transition-all focus:outline-none flex items-center justify-center cursor-pointer transform hover:scale-110 active:scale-95 duration-150 backdrop-blur-xs print:hidden"
              title="Scroll Right"
              aria-label="Scroll table right"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div ref={tableContainerRef} className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[3800px] text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
                  {/* 1. No. */}
                  <th className="py-2.5 px-3 text-center sticky left-0 bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-12 z-20">No.</th>
                  {/* 2. Employee ID */}
                  <th className="py-2.5 px-3 sticky left-12 bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-36 z-20">Employee ID</th>
                  {/* 3. Teacher Name */}
                  <th className="py-2.5 px-4 sticky left-48 bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)] min-w-[200px] z-20">Teacher Name</th>
                  {/* 4. IMAGE 2 X 2 (Link) */}
                  <th className="py-2.5 px-3 text-center min-w-[120px]">IMAGE 2 X 2 (Link)</th>
                  {/* 5. School Assigned (Form 3) */}
                  <th className="py-2.5 px-4 min-w-[220px]">School Assigned (Form 3)</th>
                  {/* 6. Sex */}
                  <th className="py-2.5 px-3 text-center min-w-[90px]">Sex</th>
                  {/* 7. Date of Birth */}
                  <th className="py-2.5 px-3 min-w-[120px]">Date of Birth</th>
                  {/* 8. Age */}
                  <th className="py-2.5 px-3 text-center min-w-[80px]">Age</th>
                  {/* 9. Civil Status */}
                  <th className="py-2.5 px-3 min-w-[110px]">Civil Status</th>
                  {/* 10. Email Address */}
                  <th className="py-2.5 px-4 min-w-[200px]">Email Address</th>
                  {/* 11. Position */}
                  <th className="py-2.5 px-4 min-w-[180px]">Position</th>
                  {/* 12. Career Stage */}
                  <th className="py-2.5 px-4 min-w-[150px]">Career Stage</th>
                  {/* 13. Salary Grade */}
                  <th className="py-2.5 px-3 min-w-[110px]">Salary Grade</th>
                  {/* 14. Step Increment */}
                  <th className="py-2.5 px-3 min-w-[120px]">Step Increment</th>
                  {/* 15. Mobile Number */}
                  <th className="py-2.5 px-3 min-w-[130px]">Mobile Number</th>
                  {/* 16. Permanent Address */}
                  <th className="py-2.5 px-4 min-w-[220px]">Permanent Address</th>
                  {/* 17. Highest Educational Attainment */}
                  <th className="py-2.5 px-4 min-w-[220px]">Highest Educational Attainment</th>
                  {/* 18. Eligibility */}
                  <th className="py-2.5 px-4 min-w-[180px]">Eligibility</th>
                  {/* 19. Eligibility Rating */}
                  <th className="py-2.5 px-3 text-right min-w-[120px]">Eligibility Rating</th>
                  {/* 20. Original Date of Appointment */}
                  <th className="py-2.5 px-3 min-w-[160px]">Original Date of Appointment</th>
                  {/* 21. Years in Service */}
                  <th className="py-2.5 px-3 text-center min-w-[120px]">Years in Service</th>
                  {/* 22. Date of Appointment on ALS */}
                  <th className="py-2.5 px-3 min-w-[170px]">Date of Appointment on ALS</th>
                  {/* 23. Years in Service in ALS */}
                  <th className="py-2.5 px-3 text-center min-w-[140px]">Years in Service in ALS</th>
                  {/* 24. GSIS Number */}
                  <th className="py-2.5 px-3 min-w-[130px]">GSIS Number</th>
                  {/* 25. Pag-IBIG No. */}
                  <th className="py-2.5 px-3 min-w-[130px]">Pag-IBIG No.</th>
                  {/* 26. PhilHealth No. */}
                  <th className="py-2.5 px-3 min-w-[130px]">PhilHealth No.</th>
                  {/* 27. PRC No. */}
                  <th className="py-2.5 px-3 min-w-[120px]">PRC No.</th>
                  {/* 28. TIN No. */}
                  <th className="py-2.5 px-3 min-w-[130px]">TIN No.</th>
                  {/* 29. 201 File Link */}
                  <th className="py-2.5 px-3 min-w-[180px]">201 File Link</th>
                  {/* 30. Actions */}
                  <th className="py-2.5 px-3 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
                {filteredPersonnel.length === 0 ? (
                  <tr>
                    <td colSpan={30} className="py-12 text-center text-slate-400 font-bold font-sans">
                      No educator profiles match the active search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPersonnel.map((p, index) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* 1. No. */}
                      <td className="py-2 px-3 text-center font-bold text-slate-400 sticky left-0 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.03)] z-20">
                        {index + 1}
                      </td>

                      {/* 2. Employee ID */}
                      <td className="py-2 px-3 font-mono font-extrabold text-[#002B6D] sticky left-12 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.03)] z-20 whitespace-nowrap">
                        {p.employeeNo}
                      </td>

                      {/* 3. Teacher Name */}
                      <td className="py-2 px-4 font-bold text-slate-800 whitespace-nowrap sticky left-48 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.03)] z-20">
                        {p.teacherName}
                      </td>

                      {/* 4. IMAGE 2 X 2 (Link) */}
                      <td className="py-2 px-3 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <img
                            src={getRenderableImageUrl(p.imageUrl)}
                            alt={p.teacherName}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded shadow-2xs border border-slate-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80';
                            }}
                          />
                          <a 
                            href={p.imageUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5"
                          >
                            <ImageIcon className="w-2.5 h-2.5" />
                            Link
                          </a>
                        </div>
                      </td>

                      {/* 5. School Assigned (Form 3) */}
                      <td className="py-2 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{p.schoolAssigned || 'Tarlac West Central ES'}</span>
                        </div>
                      </td>

                      {/* 6. Sex */}
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          p.gender === 'Female' 
                            ? 'bg-pink-50 text-pink-700 border border-pink-100'
                            : 'bg-sky-50 text-sky-700 border border-sky-100'
                        }`}>
                          {p.gender}
                        </span>
                      </td>

                      {/* 7. Date of Birth */}
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-600">
                        {p.birthDate}
                      </td>

                      {/* 8. Age */}
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">
                        {p.age}
                      </td>

                      {/* 9. Civil Status */}
                      <td className="py-2 px-3 font-semibold text-slate-600">
                        {p.civilStatus}
                      </td>

                      {/* 10. Email Address */}
                      <td className="py-2 px-4 whitespace-nowrap font-mono text-slate-550 lowercase">
                        {p.email}
                      </td>

                      {/* 11. Position */}
                      <td className="py-2 px-4 font-bold text-[#002B6D] whitespace-nowrap">
                        {p.position}
                      </td>

                      {/* 12. Career Stage */}
                      <td className="py-2 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.careerStage.includes('Highly')
                            ? 'bg-purple-50 text-purple-700 border border-purple-150'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                        }`}>
                          {p.careerStage}
                        </span>
                      </td>

                      {/* 13. Salary Grade */}
                      <td className="py-2 px-3 font-mono font-black text-slate-800">
                        {p.salaryGrade}
                      </td>

                      {/* 14. Step Increment */}
                      <td className="py-2 px-3 text-slate-600">
                        {p.stepIncrement}
                      </td>

                      {/* 15. Mobile Number */}
                      <td className="py-2 px-3 whitespace-nowrap font-mono">
                        {p.contactNo}
                      </td>

                      {/* 16. Permanent Address */}
                      <td className="py-2 px-4 text-[11px] text-slate-500 whitespace-nowrap overflow-hidden max-w-[200px]" title={p.permanentAddress}>
                        {p.permanentAddress}
                      </td>

                      {/* 17. Highest Educational Attainment */}
                      <td className="py-2 px-4 font-bold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                          <span>{p.highestEducationalAttainment}</span>
                        </div>
                      </td>

                      {/* 18. Eligibility */}
                      <td className="py-2 px-4 whitespace-nowrap text-slate-600">
                        {p.eligibility}
                      </td>

                      {/* 19. Eligibility Rating */}
                      <td className="py-2 px-3 text-right font-mono font-black text-slate-700">
                        {p.eligibilityRating}
                      </td>

                      {/* 20. Original Date of Appointment */}
                      <td className="py-2 px-3 font-mono">
                        {p.dateAppointed}
                      </td>

                      {/* 21. Years in Service */}
                      <td className="py-2 px-3 text-center font-bold text-slate-800">
                        {p.yearsInService}
                      </td>

                      {/* 22. Date of Appointment on ALS */}
                      <td className="py-2 px-3 font-mono">
                        {p.dateAppointedALS}
                      </td>

                      {/* 23. Years in Service in ALS */}
                      <td className="py-2 px-3 text-center font-black text-blue-850">
                        {p.yearsInServiceALS}
                      </td>

                      {/* 24. GSIS Number */}
                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {p.gsisNo || '-'}
                      </td>

                      {/* 25. Pag-IBIG No. */}
                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {p.pagIbigNo || '-'}
                      </td>

                      {/* 26. PhilHealth No. */}
                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {p.philHealthNo || '-'}
                      </td>

                      {/* 27. PRC No. */}
                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {p.prcNo || '-'}
                      </td>

                      {/* 28. TIN No. */}
                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {p.tinNo || '-'}
                      </td>

                      {/* 29. 201 File Link */}
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-xs">
                        {p.file201Link ? (
                          <a
                            href={p.file201Link.startsWith('http') ? p.file201Link : `https://${p.file201Link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#002B6D] font-bold text-[11px] transition-colors border border-blue-200/60"
                            title={p.file201Link}
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                            <span>201 File</span>
                            <ExternalLink className="w-3 h-3 text-blue-500" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No link</span>
                        )}
                      </td>

                      {/* 30. Actions */}
                      <td className="py-2 px-3 text-center whitespace-nowrap bg-slate-50/20">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="p-1 px-2.5 bg-blue-50 text-[#002B6D] hover:bg-blue-100 rounded-lg flex items-center gap-1 text-[11px] font-bold active:scale-95 transition-all outline-none"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.teacherName)}
                            className="p-1 px-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg flex items-center gap-1 text-[11px] font-bold active:scale-95 transition-all outline-none"
                            title="Delete file"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
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

      </div>

      {/* FORM MODAL WITH FULL 27 COLUMNS + RATINGS */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 bg-[#002B6D] text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[9px] text-sky-200 font-mono tracking-widest uppercase block font-black">
                  TCSD Teacher Registry Service
                </span>
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-200" />
                  {editingItem ? `Edit Profile & Settings: ${formTeacherName}` : 'Register New Philippine Teacher Profile & Performance file'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* GROUP 1: Primary Biological and Identity Details */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#002B6D] flex items-center gap-1.5 border-b pb-1.5">
                  <Compass className="w-3.5 h-3.5" /> 
                  Section 1: Biological and Identity Profile
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      Employee ID Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formEmployeeNo}
                      onChange={e => setFormEmployeeNo(e.target.value)}
                      placeholder="e.g. DEPED-2020-1492"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      Full Teacher Name (LAST NAME, FIRST NAME MIDDLE INITIAL) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formTeacherName}
                      onChange={e => setFormTeacherName(e.target.value)}
                      placeholder="e.g. AQUINO, MELODY ANNE B."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      Sex (Gender) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formGender}
                      onChange={e => setFormGender(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] bg-white outline-none cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formBirthDate}
                      onChange={e => setFormBirthDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      Civil Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formCivilStatus}
                      onChange={e => setFormCivilStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] bg-white outline-none cursor-pointer"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated font-sans">Separated</option>
                    </select>
                  </div>

                  <div className="flex gap-3 items-center">
                    <img 
                      src={getRenderableImageUrl(formImageUrl)}
                      alt="Form Preview"
                      className="w-11 h-11 rounded-lg object-cover border border-slate-200 mt-5 shrink-0 bg-slate-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80';
                      }}
                    />
                    <div className="grow">
                      <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                        2x2 Image Link URL <span className="text-slate-400 font-normal">(Avatar portrait)</span>
                      </label>
                      <input
                        type="url"
                        value={formImageUrl}
                        onChange={e => setFormImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      DepEd Email Address
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      placeholder="teacher@deped.gov.ph"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      value={formContactNo}
                      onChange={e => setFormContactNo(e.target.value)}
                      placeholder="+63 917..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                    Permanent Residential Address
                  </label>
                  <input
                    type="text"
                    value={formPermanentAddress}
                    onChange={e => setFormPermanentAddress(e.target.value)}
                    placeholder="Barangay, Tarlac City, Tarlac"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 border-t border-slate-200/60">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      School Assigned (Form 3) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formSchoolAssigned}
                      onChange={e => setFormSchoolAssigned(e.target.value)}
                      placeholder="e.g. Tarlac West Central Elementary School"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      201 File Link (Google Drive / Repository URL)
                    </label>
                    <input
                      type="url"
                      value={formFile201Link}
                      onChange={e => setFormFile201Link(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* GROUP 2: Career & Appointing Credentials */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#002B6D] flex items-center gap-1.5 border-b pb-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> 
                  Section 2: Employment, Appointed Dates & Scale
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      Official Position / Rank <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formPosition}
                      onChange={e => setFormPosition(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] bg-white outline-none cursor-pointer"
                    >
                      <option value="Mobile Teacher">Mobile Teacher</option>
                      <option value="ALS Teacher">ALS Teacher</option>
                      <option value="District ALS Coordinator (DALSC)">District ALS Coordinator (DALSC)</option>
                      <option value="Education Program Specialist II (EPSA)">Education Program Specialist II (EPSA)</option>
                      <option value="School Principal I">School Principal I</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      Career Stage Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formCareerStage}
                      onChange={e => setFormCareerStage(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] bg-white outline-none cursor-pointer"
                    >
                      <option value="Proficient">Proficient</option>
                      <option value="Highly Proficient">Highly Proficient</option>
                      <option value="Distinguished">Distinguished</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                        Salary Grade
                      </label>
                      <select
                        value={formSalaryGrade}
                        onChange={e => setFormSalaryGrade(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] bg-white outline-none cursor-pointer"
                      >
                        {Array.from({ length: 30 }, (_, idx) => `SG-${idx + 1}`).map(sg => (
                          <option key={sg} value={sg}>{sg}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                        Step Increment
                      </label>
                      <select
                        value={formStepIncrement}
                        onChange={e => setFormStepIncrement(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] bg-white outline-none cursor-pointer"
                      >
                        {Array.from({ length: 8 }, (_, idx) => `Step ${idx + 1}`).map(step => (
                          <option key={step} value={step}>{step}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1 block">
                      Original Date of Appointment <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formDateAppointed}
                      onChange={e => setFormDateAppointed(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                    <span className="text-[9px] text-slate-400 block mt-1">
                      Computed Years in Service: <strong>{computeYearsSince(formDateAppointed)} years</strong> (Relative to 2026 anchor)
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1 block">
                      Date of Appointment on ALS <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formDateAppointedALS}
                      onChange={e => setFormDateAppointedALS(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                    <span className="text-[9px] text-blue-500 block mt-1">
                      Computed Years in ALS: <strong>{computeYearsSince(formDateAppointedALS)} years in ALS</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* GROUP 3: Educational backgrounds and Licensure codes */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#002B6D] flex items-center gap-1.5 border-b pb-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> 
                  Section 3: Credentials, License & Eligibility
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      Highest Educational Attainment <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formHighestEducationalAttainment}
                      onChange={e => setFormHighestEducationalAttainment(e.target.value)}
                      placeholder="e.g. Master of Arts in Education (MAEd)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      TCSD / Civil Board Eligibility
                    </label>
                    <input
                      type="text"
                      value={formEligibility}
                      onChange={e => setFormEligibility(e.target.value)}
                      placeholder="e.g. LET (Teacher Professional Board)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      Eligibility Rating
                    </label>
                    <input
                      type="text"
                      value={formEligibilityRating}
                      onChange={e => setFormEligibilityRating(e.target.value)}
                      placeholder="85.40%"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      GSIS Number
                    </label>
                    <input
                      type="text"
                      value={formGsisNo}
                      onChange={e => setFormGsisNo(e.target.value)}
                      placeholder="40192841"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      Pag-IBIG Number
                    </label>
                    <input
                      type="text"
                      value={formPagIbigNo}
                      onChange={e => setFormPagIbigNo(e.target.value)}
                      placeholder="1210-2948-11"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      PhilHealth No.
                    </label>
                    <input
                      type="text"
                      value={formPhilHealthNo}
                      onChange={e => setFormPhilHealthNo(e.target.value)}
                      placeholder="09-122938491"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      PRC Licence No.
                    </label>
                    <input
                      type="text"
                      value={formPrcNo}
                      onChange={e => setFormPrcNo(e.target.value)}
                      placeholder="e.g. 0749122"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">
                      TIN Number
                    </label>
                    <input
                      type="text"
                      value={formTinNo}
                      onChange={e => setFormTinNo(e.target.value)}
                      placeholder="491-039-112"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* GROUP 4: Performance Ratings and Document file links */}
              <div className="bg-amber-50/20 p-4 rounded-2xl border border-amber-200/50 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-800 flex items-center gap-1.5 border-b pb-1.5 border-amber-200/50">
                  <Award className="w-3.5 h-3.5 text-amber-600" /> 
                  Section 4: Performance Evaluation & Rating Document Links
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-amber-800 mb-1">
                      Performance Rating Score (0.00 to 5.00) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="1.00"
                      max="5.00"
                      value={formPerformanceRating}
                      onChange={e => setFormPerformanceRating(e.target.value)}
                      className="w-full px-3 py-2 border border-amber-300 bg-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                    />
                    <span className="text-[9px] text-slate-450 block mt-1">
                      Score &ge; 4.50 auto-computes as <strong>Outstanding</strong> rating.
                    </span>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-black text-amber-800 mb-1">
                      Performance Document Cloud Drive Link (Link to PR / OPCRF Sheet)
                    </label>
                    <input
                      type="url"
                      value={formLinkToPr}
                      onChange={e => setFormLinkToPr(e.target.value)}
                      placeholder="e.g. https://docs.google.com/spreadsheets/d/your-opcrf-id"
                      className="w-full px-3 py-2 border border-amber-300 bg-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>

            </form>

            {/* Footer buttons */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black active:scale-95 transition-all outline-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-[#002B6D] hover:bg-[#0A47A3] text-white rounded-xl text-xs font-black shadow-xs active:scale-95 transition-all outline-none cursor-pointer"
              >
                {editingItem ? 'Save Updates' : 'Register Profile & Rating'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
