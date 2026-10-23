import React, { useState, useEffect, useMemo } from 'react';
import { safeSetJSON } from '../utils/safeStorage';
import { 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Edit, 
  Trash, 
  User, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Award, 
  TrendingUp, 
  BookOpen, 
  Users,
  Settings,
  Sparkles,
  Check,
  FileText,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LearnerRecord, LearningCenter } from '../types';

export interface FunctionalLiteracyTest {
  id: string;
  learnerId: string;
  learnerName: string;
  dateAssessed: string;
  teacherName: string;
  communityLearningCenter: string;
  // Learning Strands
  ls1FilMcq: number;       // 0-10
  ls1FilWriting: number;   // 0-5
  ls1EngMcq: number;       // 0-10
  ls1EngWriting: number;   // 0-5
  ls2Science: number;      // 0-10
  ls3Math: number;         // 0-15
  ls4LifeCareer: number;   // 0-10
  ls5SelfSociety: number;  // 0-10
  ls6Digital: number;      // 0-10
  // Recommendations and Diagnostics
  strengths: string;
  weaknesses: string;
  recommendations: string;
  teacherSignature: string;
  learnerSignature: string;
  // Optional profile values (override details if set)
  lastName?: string;
  firstName?: string;
  middleName?: string;
  sex?: string;
  age?: number | string;
  lastGradeCompleted?: string;
  timeStarted?: string;
  timeFinished?: string;
  category?: string;
}

interface FunctionalLiteracyTestViewProps {
  learners: LearnerRecord[];
  learningCenters: LearningCenter[];
  mode?: 'assessment' | 'records';
  selectedDistrict?: string;
  testType?: 'Pre-Test' | 'Post-Test';
}

const DEFAULT_FLT_ASSESSMENTS: FunctionalLiteracyTest[] = [
  {
    id: 'flt-001',
    learnerId: '1',
    learnerName: 'Cardo D. Dalisay',
    dateAssessed: '2026-05-15',
    teacherName: 'Melody Anne B. Aquino',
    communityLearningCenter: 'San Miguel Community Learning Center',
    ls1FilMcq: 9,
    ls1FilWriting: 4,
    ls1EngMcq: 9,
    ls1EngWriting: 4,
    ls2Science: 8,
    ls3Math: 13,
    ls4LifeCareer: 9,
    ls5SelfSociety: 8,
    ls6Digital: 9,
    strengths: 'Excels in critical debate, active reading, and real-world practical calculations.',
    weaknesses: 'Struggles slightly with complex scientific hypothesis terminology.',
    recommendations: 'Promoted to JHS Level (Advanced Academic Track) with self-paced ALS learning.',
    teacherSignature: 'M. Aquino',
    learnerSignature: 'C. Dalisay',
    lastName: 'Dalisay',
    firstName: 'Cardo',
    middleName: 'D.',
    sex: 'Male',
    age: 24,
    timeStarted: '08:15 AM',
    timeFinished: '09:45 AM'
  },
  {
    id: 'flt-002',
    learnerId: '2',
    learnerName: 'Maria Clara L. Santos',
    dateAssessed: '2026-05-18',
    teacherName: 'Mervin C. Caldoza',
    communityLearningCenter: 'Balete Community Learning Center',
    ls1FilMcq: 8,
    ls1FilWriting: 3,
    ls1EngMcq: 8,
    ls1EngWriting: 3,
    ls2Science: 7,
    ls3Math: 11,
    ls4LifeCareer: 8,
    ls5SelfSociety: 7,
    ls6Digital: 8,
    strengths: 'Excellent writing compositions, creative sentences, and strong digital literacy.',
    weaknesses: 'Needs guidance in multi-step fraction division and scientific reasoning.',
    recommendations: 'Promoted to JHS Level (Regular Academic Track) with regular CLC modules.',
    teacherSignature: 'M. Caldoza',
    learnerSignature: 'M. Santos',
    lastName: 'Santos',
    firstName: 'Maria Clara',
    middleName: 'L.',
    sex: 'Female',
    age: 21,
    timeStarted: '09:00 AM',
    timeFinished: '10:30 AM'
  },
  {
    id: 'flt-003',
    learnerId: '3',
    learnerName: 'Juan Dela Cruz Jr.',
    dateAssessed: '2026-05-20',
    teacherName: 'Angelica G. Canlas',
    communityLearningCenter: 'Mapalacsiao Community Learning Center',
    ls1FilMcq: 5,
    ls1FilWriting: 2,
    ls1EngMcq: 4,
    ls1EngWriting: 2,
    ls2Science: 4,
    ls3Math: 6,
    ls4LifeCareer: 5,
    ls5SelfSociety: 4,
    ls6Digital: 5,
    strengths: 'Strong oral communication, works well with community groups, eager to improve.',
    weaknesses: 'Challenged by formal reading comprehension and standard mathematical fractions.',
    recommendations: 'Eligible for Advanced Elementary Level programs with targeted numeracy modules.',
    teacherSignature: 'M. Canlas',
    learnerSignature: 'J. Cruz',
    lastName: 'Cruz',
    firstName: 'Juan',
    middleName: 'Dela',
    sex: 'Male',
    age: 42,
    timeStarted: '01:30 PM',
    timeFinished: '02:45 PM'
  },
  {
    id: 'flt-004',
    learnerId: '4',
    learnerName: 'Grace Poe S. Llamanzares',
    dateAssessed: '2026-05-22',
    teacherName: 'Ranielle Paolo D. Capiendo',
    communityLearningCenter: 'San Miguel Community Learning Center',
    ls1FilMcq: 8,
    ls1FilWriting: 4,
    ls1EngMcq: 7,
    ls1EngWriting: 4,
    ls2Science: 8,
    ls3Math: 10,
    ls4LifeCareer: 8,
    ls5SelfSociety: 8,
    ls6Digital: 8,
    strengths: 'Outstanding citizenship understanding, strong leadership potential.',
    weaknesses: 'Requires extra review on algebraic equations and metric conversion tables.',
    recommendations: 'Promoted to JHS Level (Honors Section) with modular enrichment.',
    teacherSignature: 'R. Capiendo',
    learnerSignature: 'G. Llamanzares',
    lastName: 'Llamanzares',
    firstName: 'Grace Poe',
    middleName: 'S.',
    sex: 'Female',
    age: 29,
    timeStarted: '10:00 AM',
    timeFinished: '11:15 AM'
  },
  {
    id: 'flt-005',
    learnerId: '5',
    learnerName: 'Vicente S. Sotto',
    dateAssessed: '2026-05-25',
    teacherName: 'Russel M. Dionisio',
    communityLearningCenter: 'Balete Community Learning Center',
    ls1FilMcq: 9,
    ls1FilWriting: 5,
    ls1EngMcq: 9,
    ls1EngWriting: 5,
    ls2Science: 9,
    ls3Math: 14,
    ls4LifeCareer: 9,
    ls5SelfSociety: 9,
    ls6Digital: 9,
    strengths: 'Excellent overall score, outstanding mathematical skills, fully digital native.',
    weaknesses: 'Minor styling inconsistencies in English essay structures.',
    recommendations: 'Promoted to Senior High School curriculum track immediately.',
    teacherSignature: 'R. Dionisio',
    learnerSignature: 'V. Sotto',
    lastName: 'Sotto',
    firstName: 'Vicente',
    middleName: 'S.',
    sex: 'Male',
    age: 55,
    timeStarted: '03:00 PM',
    timeFinished: '04:30 PM'
  }
];

const convert12to24 = (time12h: string): string => {
  if (!time12h) return "";
  const match = time12h.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12h; // already HH:mm or unrecognized
  let [_, hoursStr, minutes, modifier] = match;
  let hours = parseInt(hoursStr, 10);
  if (modifier.toUpperCase() === 'PM' && hours < 12) {
    hours = hours + 12;
  }
  if (modifier.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

const convert24to12 = (time24h: string): string => {
  if (!time24h) return "";
  const match = time24h.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time24h; // already 12h or unrecognized
  let [_, hoursStr, minutes] = match;
  let hours = parseInt(hoursStr, 10);
  const modifier = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${String(hours).padStart(2, '0')}:${minutes} ${modifier}`;
};

export function FunctionalLiteracyTestView({ learners, learningCenters, mode: initialMode = 'records', selectedDistrict, testType = 'Pre-Test' }: FunctionalLiteracyTestViewProps) {
  const localStorageKey = testType === 'Post-Test' ? 'als_flt_assessments_post' : 'als_flt_assessments';
  const localStorageAnswersKey = testType === 'Post-Test' ? 'als_flt_answers_post' : 'als_flt_answers';

  const [assessments, setAssessments] = useState<FunctionalLiteracyTest[]>(() => {
    const saved = localStorage.getItem(localStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse FLT assessments, falling back to defaults", e);
      }
    }
    return DEFAULT_FLT_ASSESSMENTS;
  });

  const [mode, setMode] = useState<'assessment' | 'records'>(initialMode);
  
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Scoring active wizard section (Learning Strands tabs)
  const [wizardTab, setWizardTab] = useState<'info' | 'ls1_fil' | 'ls1_eng' | 'ls2' | 'ls3' | 'ls4_5_6' | 'summary'>('info');

  // Intake Form State variables
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Dynamic form state
  const [formLearnerId, setFormLearnerId] = useState<string>('manual');
  const [formLearnerName, setFormLearnerName] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formTeacher, setFormTeacher] = useState<string>('');
  const [formClc, setFormClc] = useState<string>('');

  const [mcLastName, setMcLastName] = useState<string>('');
  const [mcFirstName, setMcFirstName] = useState<string>('');
  const [mcMiddleName, setMcMiddleName] = useState<string>('');
  const [mcSex, setMcSex] = useState<string>('Male');
  const [mcAge, setMcAge] = useState<string>('');
  const [mcTimeStarted, setMcTimeStarted] = useState<string>('08:00 AM');
  const [mcTimeFinished, setMcTimeFinished] = useState<string>('09:30 AM');
  const [mcLastGradeCompleted, setMcLastGradeCompleted] = useState<string>('');
  const [mcCategory, setMcCategory] = useState<string>(testType);

  // FLT Strand States (Dynamic scores input)
  const [fltLS1FilMcq, setFltLS1FilMcq] = useState<number>(0);
  const [fltLS1FilWriting, setFltLS1FilWriting] = useState<number>(0);
  const [fltLS1EngMcq, setFltLS1EngMcq] = useState<number>(0);
  const [fltLS1EngWriting, setFltLS1EngWriting] = useState<number>(0);
  const [fltLS2Science, setFltLS2Science] = useState<number>(0);
  const [fltLS3Math, setFltLS3Math] = useState<number>(0);
  const [fltLS4LifeCareer, setFltLS4LifeCareer] = useState<number>(0);
  const [fltLS5SelfSociety, setFltLS5SelfSociety] = useState<number>(0);
  const [fltLS6Digital, setFltLS6Digital] = useState<number>(0);

  const [formStrengths, setFormStrengths] = useState<string>('');
  const [formWeaknesses, setFormWeaknesses] = useState<string>('');
  const [formRecommendations, setFormRecommendations] = useState<string>('');
  const [formTeacherSig, setFormTeacherSig] = useState<string>('');
  const [formLearnerSig, setFormLearnerSig] = useState<string>('');

  // Table Search and dropdown filter
  const [recordSearch, setRecordSearch] = useState<string>('');
  const [searchTeacher, setSearchTeacher] = useState<string>('');

  // State to support PDF Single Print Layout view mode
  const [printRecord, setPrintRecord] = useState<FunctionalLiteracyTest | null>(null);

  // Dynamic Google Sheets FLT records synchronization states
  const [sheetRecords, setSheetRecords] = useState<FunctionalLiteracyTest[]>([]);
  const [isSheetLoading, setIsSheetLoading] = useState<boolean>(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const fetchSheetRecords = async () => {
    setIsSheetLoading(true);
    setSheetError(null);
    try {
      const response = await fetch(`/api/flt/records?testType=${encodeURIComponent(testType)}&_=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setSheetRecords(data.records);
        console.info(`[Google Sheets FLT] Successfully fetched ${testType} records:`, data.records.length);
      } else {
        throw new Error(data.error || "Failed to load records from sheet");
      }
    } catch (err: any) {
      console.error("Error fetching FLT records from sheet:", err);
      setSheetError(err.message || "Failed to load Google Sheet data.");
    } finally {
      setIsSheetLoading(false);
    }
  };

  useEffect(() => {
    fetchSheetRecords();
  }, [testType]);

  // Dynamic Google Sheets FLT questions state
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [fltAnswers, setFltAnswers] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(localStorageAnswersKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse FLT answers, falling back to empty object", e);
      }
    }
    return {};
  });

  // Sync state with localStorage
  useEffect(() => {
    safeSetJSON(localStorageKey, assessments);
  }, [assessments, localStorageKey]);

  useEffect(() => {
    safeSetJSON(localStorageAnswersKey, fltAnswers);
  }, [fltAnswers, localStorageAnswersKey]);

  // Fetch FLT questions on mount
  useEffect(() => {
    setIsLoadingQuestions(true);
    fetch('/api/flt/questions')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
        }
        setIsLoadingQuestions(false);
      })
      .catch(err => {
        console.error("Failed to fetch Google Sheet FLT questions:", err);
        setQuestionsError("Hindi ma-load ang mga tanong mula sa Google Sheet. Gagamit muna ng built-in questions.");
        setIsLoadingQuestions(false);
      });
  }, []);

  // Synchronize dynamic learner picker selection
  useEffect(() => {
    if (formLearnerId && formLearnerId !== 'manual') {
      const selected = learners.find(l => l.id === formLearnerId);
      if (selected) {
        setFormLearnerName(`${selected.firstName} ${selected.middleName ? selected.middleName + ' ' : ''}${selected.lastName}`);
        setMcLastName(selected.lastName || '');
        setMcFirstName(selected.firstName || '');
        setMcMiddleName(selected.middleName || '');
        setMcSex(selected.gender || 'Male');
        setMcAge(String(selected.age || ''));
        setFormClc(selected.clcName || learningCenters[0]?.name || 'Outreach');
        setFormTeacher(selected.teacher || '');
      }
    } else if (formLearnerId === 'manual') {
      setFormLearnerName('');
      setMcLastName('');
      setMcFirstName('');
      setMcMiddleName('');
      setMcSex('Male');
      setMcAge('');
      setFormClc('');
      setFormTeacher('');
    }
  }, [formLearnerId, learners, learningCenters]);

  // Extract learner info safely
  const getLearnerParts = (rec: FunctionalLiteracyTest) => {
    if (rec.lastName || rec.firstName) {
      return {
        lastName: rec.lastName || '',
        firstName: rec.firstName || '',
        middleName: rec.middleName || '',
        sex: rec.sex || 'Male',
        age: rec.age || 'N/A'
      };
    }
    const l = learners.find(ln => ln.id === rec.learnerId);
    if (l) {
      return {
        lastName: l.lastName || '',
        firstName: l.firstName || '',
        middleName: l.middleName || '',
        sex: l.gender || 'Male',
        age: l.age || 'N/A'
      };
    }
    const name = rec.learnerName || '';
    let lastName = '';
    let firstName = '';
    let middleName = '';
    const parts = name.split(' ');
    if (parts.length >= 3) {
      firstName = parts.slice(0, parts.length - 2).join(' ');
      middleName = parts[parts.length - 2];
      lastName = parts[parts.length - 1];
    } else if (parts.length === 2) {
      firstName = parts[0];
      lastName = parts[1];
    } else {
      firstName = name;
    }
    return { lastName, firstName, middleName, sex: 'Male', age: 'N/A' };
  };

  const renderLearnerInfoForm = () => (
    <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-slate-205 space-y-6">
      <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block mb-4 border-b border-slate-200 pb-2">
        LEARNER INFORMATION
      </span>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* LAST NAME */}
        <div className="space-y-1">
          <label htmlFor="flt-last-name" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
            Last Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="flt-last-name"
            type="text"
            placeholder="E.g. dela Cruz"
            value={mcLastName}
            onChange={(e) => setMcLastName(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition"
          />
        </div>

        {/* FIRST NAME */}
        <div className="space-y-1">
          <label htmlFor="flt-first-name" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
            First Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="flt-first-name"
            type="text"
            placeholder="E.g. Juan"
            value={mcFirstName}
            onChange={(e) => setMcFirstName(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition"
          />
        </div>

        {/* MIDDLE NAME */}
        <div className="space-y-1">
          <label htmlFor="flt-middle-name" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
            Middle Name
          </label>
          <input
            id="flt-middle-name"
            type="text"
            placeholder="E.g. Santos"
            value={mcMiddleName}
            onChange={(e) => setMcMiddleName(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SEX */}
        <div className="space-y-1">
          <label htmlFor="flt-sex" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
            Sex <span className="text-rose-500">*</span>
          </label>
          <select
            id="flt-sex"
            value={mcSex}
            onChange={(e) => setMcSex(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition text-slate-755 hover:border-slate-350 cursor-pointer"
          >
            <option value="">-- Select Sex --</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        {/* AGE */}
        <div className="space-y-1">
          <label htmlFor="flt-age" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
            Age <span className="text-rose-500">*</span>
          </label>
          <input
            id="flt-age"
            type="number"
            min="1"
            max="120"
            placeholder="E.g. 18"
            value={mcAge}
            onChange={(e) => setMcAge(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition text-slate-755"
          />
        </div>

        {/* LAST GRADE LEVEL COMPLETED */}
        <div className="space-y-1">
          <label htmlFor="flt-last-grade" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
            Last Grade Level Completed <span className="text-rose-500">*</span>
          </label>
          <select
            id="flt-last-grade"
            value={mcLastGradeCompleted}
            onChange={(e) => setMcLastGradeCompleted(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition text-slate-755 hover:border-slate-350 cursor-pointer"
          >
            <option value="">-- Select Grade --</option>
            <option value="Kinder">Kinder</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
            <option value="Grade 4">Grade 4</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 6">Grade 6</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* COMMUNITY LEARNING CENTER */}
        <div className="space-y-1">
          <label htmlFor="flt-clc" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
            Community Learning Center <span className="text-rose-500">*</span>
          </label>
          <input
            id="flt-clc"
            type="text"
            placeholder="E.g. Tarlac City CLC"
            value={formClc}
            onChange={(e) => setFormClc(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition"
          />
        </div>

        {/* TEACHER */}
        <div className="space-y-1">
          <label htmlFor="flt-teacher" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
            Teacher <span className="text-rose-500">*</span>
          </label>
          <input
            id="flt-teacher"
            type="text"
            placeholder="E.g. Mrs. Maria Gomez"
            value={formTeacher}
            onChange={(e) => setFormTeacher(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* CATEGORY */}
        <div className="space-y-1">
          <label htmlFor="flt-category" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            id="flt-category"
            value={mcCategory}
            onChange={(e) => setMcCategory(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition text-slate-700 hover:border-slate-350 cursor-pointer font-sans"
          >
            <option value="Pre-Test">Pre-Test</option>
            <option value="Post-Test">Post-Test</option>
          </select>
        </div>

        {/* DATE */}
        <div className="space-y-1">
          <label htmlFor="flt-assessment-date" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
            Date <span className="text-rose-500">*</span>
          </label>
          <input
            id="flt-assessment-date"
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition text-slate-700 hover:border-slate-350 cursor-pointer"
          />
        </div>

        {/* TIME STARTED */}
        <div className="space-y-1">
          <label htmlFor="flt-time-started" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
            Time Started <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              id="flt-time-started"
              type="time"
              value={convert12to24(mcTimeStarted)}
              onChange={(e) => setMcTimeStarted(convert24to12(e.target.value))}
              className="w-full bg-white border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition text-slate-700 hover:border-slate-350 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                setMcTimeStarted(convert24to12(`${hours}:${minutes}`));
              }}
              className="absolute right-2 px-1.5 py-0.5 text-[8px] bg-slate-100 hover:bg-slate-200 text-[#002B6D] font-extrabold rounded-md cursor-pointer uppercase tracking-tight"
              title="Set started time to now"
            >
              Now
            </button>
          </div>
        </div>

        {/* TIME FINISHED */}
        <div className="space-y-1">
          <label htmlFor="flt-time-finished" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
            Time Finished
          </label>
          <div className="relative flex items-center">
            <input
              id="flt-time-finished"
              type="time"
              value={convert12to24(mcTimeFinished)}
              onChange={(e) => setMcTimeFinished(convert24to12(e.target.value))}
              className="w-full bg-white border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition text-slate-705 hover:border-slate-350 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                setMcTimeFinished(convert24to12(`${hours}:${minutes}`));
              }}
              className="absolute right-2 px-1.5 py-0.5 text-[8px] bg-slate-100 hover:bg-slate-200 text-[#002B6D] font-extrabold rounded-md cursor-pointer uppercase tracking-tight"
              title="Set finished time to now"
            >
              Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper to extract exam timing
  const getRecordTimes = (rec: FunctionalLiteracyTest) => {
    return {
      started: rec.timeStarted || '08:00 AM',
      finished: rec.timeFinished || '09:30 AM'
    };
  };

  // Score recommendation classification level
  const calcFltClassification = (total: number) => {
    if (total >= 75) return { text: 'Senior High School Level', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (total >= 60) return { text: 'Junior High School Level', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (total >= 45) return { text: 'Advanced Elementary Level', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (total >= 25) return { text: 'Lower Elementary Level', bg: 'bg-amber-50 text-amber-850 border-amber-200' };
    return { text: 'Basic Literacy Level', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
  };

  // Filtered assessments based on search terms and teacher dropdown
  const filteredRecords = useMemo(() => {
    const dataSource = sheetRecords.length > 0 ? sheetRecords : assessments;
    return dataSource.filter(rec => {
      const s = recordSearch.toLowerCase();
      const lastName = rec.lastName || '';
      const firstName = rec.firstName || '';
      const fullName = rec.learnerName || `${firstName} ${lastName}` || '';
      const clc = rec.communityLearningCenter || '';
      const teacher = rec.teacherName || '';

      const nameMatch = fullName.toLowerCase().includes(s);
      const clcMatch = clc.toLowerCase().includes(s);
      const teacherFieldMatch = teacher.toLowerCase().includes(s);
      const matchesSearch = !s || nameMatch || clcMatch || teacherFieldMatch;

      const matchesTeacherDropdown = !searchTeacher || teacher.toLowerCase() === searchTeacher.toLowerCase();

      return matchesSearch && matchesTeacherDropdown;
    });
  }, [assessments, sheetRecords, recordSearch, searchTeacher]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormLearnerId(learners[0]?.id || 'manual');
    setFormDate(new Date().toISOString().split('T')[0]);
    // Reset scores
    setFltLS1FilMcq(0);
    setFltLS1FilWriting(0);
    setFltLS1EngMcq(0);
    setFltLS1EngWriting(0);
    setFltLS2Science(0);
    setFltLS3Math(0);
    setFltLS4LifeCareer(0);
    setFltLS5SelfSociety(0);
    setFltLS6Digital(0);
    setFltAnswers({});
    // Info
    setFormStrengths('');
    setFormWeaknesses('');
    setFormRecommendations('');
    setFormTeacherSig('');
    setFormLearnerSig('');
    setMcTimeStarted('08:00 AM');
    setMcTimeFinished('09:30 AM');
    setMcLastGradeCompleted('');
    setMcCategory('Pre-Test');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: FunctionalLiteracyTest) => {
    setEditingId(rec.id);
    setFormLearnerId(rec.learnerId || 'manual');
    setFormLearnerName(rec.learnerName);
    setFormDate(rec.dateAssessed);
    setFormTeacher(rec.teacherName);
    setFormClc(rec.communityLearningCenter);

    const info = getLearnerParts(rec);
    setMcLastName(info.lastName);
    setMcFirstName(info.firstName);
    setMcMiddleName(info.middleName);
    setMcSex(info.sex || 'Male');
    setMcAge(String(info.age || ''));
    setMcLastGradeCompleted(rec.lastGradeCompleted || '');
    setMcTimeStarted(rec.timeStarted || '08:00 AM');
    setMcTimeFinished(rec.timeFinished || '09:30 AM');
    setMcCategory(rec.category || 'Pre-Test');

    setFltLS1FilMcq(rec.ls1FilMcq);
    setFltLS1FilWriting(rec.ls1FilWriting);
    setFltLS1EngMcq(rec.ls1EngMcq);
    setFltLS1EngWriting(rec.ls1EngWriting);
    setFltLS2Science(rec.ls2Science);
    setFltLS3Math(rec.ls3Math);
    setFltLS4LifeCareer(rec.ls4LifeCareer);
    setFltLS5SelfSociety(rec.ls5SelfSociety);
    setFltLS6Digital(rec.ls6Digital);

    setFormStrengths(rec.strengths || '');
    setFormWeaknesses(rec.weaknesses || '');
    setFormRecommendations(rec.recommendations || '');
    setFormTeacherSig(rec.teacherSignature || '');
    setFormLearnerSig(rec.learnerSignature || '');
    
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Sigurado ka bang nais mong burahin ang FLT record para kay ${name}?`)) {
      setAssessments(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Compile dynamic full name
    let finalName = formLearnerName || '';
    if (formLearnerId === 'manual' || !finalName) {
      const parts = [mcFirstName, mcMiddleName, mcLastName].filter(p => p.trim() !== '');
      finalName = parts.join(' ');
    }

    const calculatedTotal = fltLS1FilMcq + fltLS1FilWriting + fltLS1EngMcq + fltLS1EngWriting + fltLS2Science + fltLS3Math + fltLS4LifeCareer + fltLS5SelfSociety + fltLS6Digital;
    const defaultRec = calcFltClassification(calculatedTotal).text;

    const recordData: FunctionalLiteracyTest = {
      id: editingId || 'flt-' + Date.now(),
      learnerId: formLearnerId,
      learnerName: finalName || 'Unknown Learner',
      dateAssessed: formDate,
      teacherName: formTeacher || 'ALS Mobile Teacher',
      communityLearningCenter: formClc || 'District Extension Center',
      ls1FilMcq: Number(fltLS1FilMcq),
      ls1FilWriting: Number(fltLS1FilWriting),
      ls1EngMcq: Number(fltLS1EngMcq),
      ls1EngWriting: Number(fltLS1EngWriting),
      ls2Science: Number(fltLS2Science),
      ls3Math: Number(fltLS3Math),
      ls4LifeCareer: Number(fltLS4LifeCareer),
      ls5SelfSociety: Number(fltLS5SelfSociety),
      ls6Digital: Number(fltLS6Digital),
      strengths: formStrengths || 'Demonstrates interest in continuing modular studies.',
      weaknesses: formWeaknesses || 'Needs work on complex critical reasoning and digital tools.',
      recommendations: formRecommendations || `Enrolment to ALS Program - ${defaultRec}.`,
      teacherSignature: formTeacherSig || formTeacher.split(' ').slice(-1)[0] || 'Teacher',
      learnerSignature: formLearnerSig || finalName.split(' ')[0] || 'Learner',
      lastName: mcLastName,
      firstName: mcFirstName,
      middleName: mcMiddleName,
      category: mcCategory,
      sex: mcSex,
      age: mcAge,
      lastGradeCompleted: mcLastGradeCompleted,
      timeStarted: mcTimeStarted,
      timeFinished: mcTimeFinished
    };

    if (editingId) {
      setAssessments(prev => prev.map(item => item.id === editingId ? recordData : item));
      setSheetRecords(prev => prev.map(item => item.id === editingId ? recordData : item));
    } else {
      setAssessments(prev => [recordData, ...prev]);
      setSheetRecords(prev => [recordData, ...prev]);
    }

    // Send payload to backend to sync directly to Google Sheets
    fetch('/api/flt/records/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ record: recordData, testType }),
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          console.info("[Google Sheets FLT] Successfully synchronized graded record to Google Sheets:", resData);
          if (resData.error) {
            setSheetError(resData.error);
          } else {
            fetchSheetRecords();
          }
        } else {
          setSheetError(resData.error || "Failed to sync to Google Sheets.");
        }
      })
      .catch(err => {
        console.error("Failed to sync graded record to Google Sheets:", err);
        setSheetError(err.message || "Network error syncing Google Sheet.");
      });

    setIsModalOpen(false);
  };

  const triggerPrint = () => {
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Helpers for Google Drive document preview rendering
  const getDriveThumbnailUrl = (url: string) => {
    if (!url) return '';
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    return url;
  };

  // Standard interactive mock test questions
  const MOCK_FLT_QUESTIONS = {
    ls1Fil: [
      {
        id: 'flt-fil-1',
        text: 'Suriin ang tekstong nakalahad at magbigay ng angkop na pagpapakahulugan:',
        imageUrl: 'https://drive.google.com/file/d/1UJp3r11UPkyUw4OSuXvz9VvfWn_5EnpL/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Mahalagang may talento upang magtagumpay.' },
          { key: 'B', text: 'Ang pagtitiyaga at determinasyon ay susi sa tagumpay.' },
          { key: 'C', text: 'Madaling makamit ang pangarap basta\'t may sapat na oras.' },
          { key: 'D', text: 'Hindi dapat na pagtuunan ng pansin ang mga bagay na mahirap gawain.' }
        ],
        correctAnswer: 'B'
      },
      {
        id: 'flt-fil-2',
        text: 'Suriin ang sitwasyon ukol sa pagbabalik ng napulot na bag sa may-ari:',
        imageUrl: 'https://drive.google.com/file/d/1NgUvK3ytKmID_MOoITtPjFY5Nx6SxEqg/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Natakot siyang mahuli ng mga awtoridad kung gagamitin niya ang pera.' },
          { key: 'B', text: 'Umasa siyang gagantimpalaan siya ng may-ari ng bag dahil sa kanyang kabutihan.' },
          { key: 'C', text: 'Alam niyang walang halaga ang mga ID kaya minabuti niyang isauli na lamang ang bag.' },
          { key: 'D', text: 'Pinahalagahan niya ang prinsipyo ng katapatan kaysa sa pansariling pangangailangan.' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-fil-3',
        text: 'Unawain ang mensahe tungkol sa pagsusumikap at gabay ng Maykapal:',
        imageUrl: 'https://drive.google.com/file/d/14oSiHGCe6NdE32oy18glrZ8ILCkwEXmv/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Ang pagdarasal nang taos-puso ay sapat upang matupad ang mga pangarap.' },
          { key: 'B', text: 'Ang tulong ng Diyos ay dumarating sa mga taong marunong maghintay.' },
          { key: 'C', text: 'Ang tagumpay ay nakakamit sa pamamagitan ng awa ng Diyos at mga pagsisikap ng tao.' },
          { key: 'D', text: 'Ang tagumpay ay ipaubaya sa Diyos at hindi nangangailangan ng sariling pagsusumikap.' }
        ],
        correctAnswer: 'C'
      },
      {
        id: 'flt-fil-4',
        text: 'Anong uri ng di-berbal na komunikasyon ang ipinapakita sa larawan?',
        imageUrl: 'https://drive.google.com/file/d/1YSUXrnmAir4wYW3hwreZmxj3OPjcm973/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Kumpas ng kamay' },
          { key: 'B', text: 'Padyak ng paa' },
          { key: 'C', text: 'Tayo ng katawan' },
          { key: 'D', text: 'Tingin ng mata' }
        ],
        correctAnswer: 'C'
      },
      {
        id: 'flt-fil-5',
        text: 'Suriin ang tekstong nakalahad:',
        imageUrl: 'https://drive.google.com/file/d/1McpUJcIT52g5QCAySbMC4pYAeE90EY9F/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Balita' },
          { key: 'B', text: 'Eksposisyon' },
          { key: 'C', text: 'Talaarawan' },
          { key: 'D', text: 'Talambuhay' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-fil-6',
        text: 'Ano ang ipinahihiwatig ng kilos o gawi ng estudyante sa komiks?',
        imageUrl: 'https://drive.google.com/file/d/1j00lbl2OoVqWnMJqqE6fvN2XXt-IGmbb/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Pagkainip sa pag-aaral' },
          { key: 'B', text: 'Kasipagan ng mag-aaral' },
          { key: 'C', text: 'Pagkapagod sa pag-aaral' },
          { key: 'D', text: 'Pagiging masigasig sa pagbabasa' }
        ],
        correctAnswer: 'A'
      },
      {
        id: 'flt-fil-7',
        text: 'Bakit ginawa ang tekstong biswal na ito?',
        imageUrl: 'https://drive.google.com/file/d/1k6JvvIJkrU_ra0xZwpJLMYpg38zZKswv/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Bilang isang komiks tungkol sa pag-aaral' },
          { key: 'B', text: 'Bilang pagpapakita ng tamang paraan ng pag-aaral' },
          { key: 'C', text: 'Bilang isang babala tungkol sa kaligtasan sa pag-aaral' },
          { key: 'D', text: 'Bilang isang karaniwang karanasan ng mga mag-aaral' }
        ],
        correctAnswer: 'B'
      },
      {
        id: 'flt-fil-8',
        text: 'Kung gagawa ka ng tekstong biswal upang maghikayat na magsumikap sa pag-aaral, alin ang pinakaangkop na anyo nito?',
        choices: [
          { key: 'A', text: 'Isang impograpiko tungkol sa isang paaralan' },
          { key: 'B', text: 'Isang slogan na nagsasabing "tulog muna, bago mag-aral"' },
          { key: 'C', text: 'Isang meme na nagtutulak sa pagpapaliban ng pag-aaral' },
          { key: 'D', text: 'Isang poster na nagpapakita ng mga benepisyo ng pag-aaral' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-fil-9',
        text: 'Suriin ang tamang panlapi o gamit sa salita:',
        imageUrl: 'https://drive.google.com/file/d/1VpG9ol14jbtI3DeorTet0_8xNrKhnnuc/view?usp=drive_link',
        choices: [
          { key: 'A', text: '-an' },
          { key: 'B', text: '-da' },
          { key: 'C', text: 'ma-' },
          { key: 'D', text: 'mag-' }
        ],
        correctAnswer: 'A'
      },
      {
        id: 'flt-fil-10',
        text: 'Anong uri ng sanggunian ang ipinapakita sa larawan?',
        imageUrl: 'https://drive.google.com/file/d/1oCFTErgQtoJamaLq77IDlBSZ0zRpOOkz/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Atlas' },
          { key: 'B', text: 'Diksyunaryo' },
          { key: 'C', text: 'Ensayklopidya' },
          { key: 'D', text: 'Pahayagan' }
        ],
        correctAnswer: 'B'
      },
      {
        id: 'flt-fil-11',
        text: 'Ano ang pinaka-angkop na ilagay sa form para sa emergency contact ayon sa larawan?',
        imageUrl: 'https://drive.google.com/file/d/1TuWYKfyHbjMrWGOCX8NufDilw_OaC1dd/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Pangalan at numero ng kanyang supervisor sa trabaho' },
          { key: 'B', text: 'Pangalan at numero ng sinumang kakilala o kasamahan sa trabaho' },
          { key: 'C', text: 'Pangalan at numero ng kapamilya na dapat tawagan sa oras ng emergency' },
          { key: 'D', text: 'Pangalan at numero ng isang malapit na kaibigan na puwedeng tawagan sa oras ng emergency' }
        ],
        correctAnswer: 'C'
      },
      {
        id: 'flt-fil-12',
        text: 'Anong uri ng antas ng wika ang ginagamit sa pahayag?',
        imageUrl: 'https://drive.google.com/file/d/1kEpiFgtKCNOx3laAh3ORFGy652HIJGCU/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Akademiko' },
          { key: 'B', text: 'Di-pormal' },
          { key: 'C', text: 'Pormal' },
          { key: 'D', text: 'Teknikal' }
        ],
        correctAnswer: 'B'
      },
      {
        id: 'flt-fil-13',
        text: 'Suriin ang angkop na lokasyon batay sa binigay na teksto:',
        imageUrl: 'https://drive.google.com/file/d/1NG9tFwz6xKXtZ7kW6ghXIKIz3cUOhL5y/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Isang malawak na lugar sa loob ng paaralan' },
          { key: 'B', text: 'Isang malawak na lupain na angkop taniman' },
          { key: 'C', text: 'Isang masikip na bakuran sa loob ng paaralan' },
          { key: 'D', text: 'Isang maliit na espasyo sa ilalim ng puno ng mangga' }
        ],
        correctAnswer: 'B'
      },
      {
        id: 'flt-fil-14',
        text: 'Anong uri ng tayutay ang ipinapakita sa saknong?',
        imageUrl: 'https://drive.google.com/file/d/1qHEBeUHmIi6USL6UMd844qOHNVLRWc4I/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Pagtutulad (simili)' },
          { key: 'B', text: 'Pagwawangis (metapora)' },
          { key: 'C', text: 'Pagmamalabis (hyperbole)' },
          { key: 'D', text: 'Pagsasatao (personipikasyon)' }
        ],
        correctAnswer: 'D'
      }
    ],
    ls1FilWriting: [
      { id: 'flt-fil-w1', text: 'Pagsulat Prompt 1: Ilarawan ang iyong pangarap sa buhay.', imageUrl: 'https://drive.google.com/file/d/10l9BZJsJSVtUa4lXoiXVJPo2SfpANh2x/view?usp=drive_link' },
      { id: 'flt-fil-w2', text: 'Pagsulat Prompt 2: Sumulat ng maikling talata tungkol sa iyong pamilya.', imageUrl: 'https://drive.google.com/file/d/1HNqG90nqpcBEy7qSXriORuMk56pcm8qw/view?usp=drive_link' },
      { id: 'flt-fil-w3', text: 'Pagsulat Prompt 3: Sumulat ng liham-pangkaibigan.', imageUrl: 'https://drive.google.com/file/d/1cW0rdKC3YL-cMs-xT27K0W2N4FtkFnl3/view?usp=drive_link' }
    ],
    ls1Eng: [
      {
        id: 'flt-eng-1',
        text: 'Analyze the short passage about Sonia and Nico:',
        imageUrl: 'https://drive.google.com/file/d/1o5LgaZCWQ93RZOAzkG8y8mnURQ77JsB0/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Sonia and Nico stopped farming because of their neighbors.' },
          { key: 'B', text: 'Sonia and Nico chose to care only for their own crops and not help others.' },
          { key: 'C', text: 'Sonia and Nico moved to another village to avoid their responsibilities.' },
          { key: 'D', text: 'Sonia and Nico, together with their son Miguel, saved their crops and helped neighbors in need.' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-eng-2',
        text: 'What is the main topic depicted in the document symbols?',
        imageUrl: 'https://drive.google.com/file/d/18_kZwUc4qeGT_XN91f4kfeCtMc47Nfh1/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Design of symbols' },
          { key: 'B', text: 'Meaning of symbols' },
          { key: 'C', text: 'Number of symbols' },
          { key: 'D', text: 'Popularity of symbols' }
        ],
        correctAnswer: 'B'
      },
      {
        id: 'flt-eng-3',
        text: 'What cultural guideline is recommended in the leaflet regarding ethnic symbols?',
        imageUrl: 'https://drive.google.com/file/d/18_kZwUc4qeGT_XN91f4kfeCtMc47Nfh1/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'He can use any symbols that look nice, regardless of their meaning.' },
          { key: 'B', text: 'He should only use symbols from his own culture to maintain focus.' },
          { key: 'C', text: 'He needs to research and understand the significance of each symbol he includes.' },
          { key: 'D', text: 'He can add as many symbols as possible without considering their cultural backgrounds.' }
        ],
        correctAnswer: 'C'
      },
      {
        id: 'flt-eng-4',
        text: 'How should the designer handle sensitive tribal patterns safely?',
        imageUrl: 'https://drive.google.com/file/d/1eOtFh5Iq44VpAmsJgBpzmEMIDlnsVA3J/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'He can use any symbols that look nice, regardless of their meaning.' },
          { key: 'B', text: 'He should only use symbols from his own culture to maintain focus.' },
          { key: 'C', text: 'He needs to research and understand the significance of each symbol he includes.' },
          { key: 'D', text: 'He can add as many symbols as possible without considering their cultural backgrounds.' }
        ],
        correctAnswer: 'C'
      },
      {
        id: 'flt-eng-5',
        text: 'What is the main conflict faced by Miguel in the jungle story?',
        imageUrl: 'https://drive.google.com/file/d/1q0phkVXyAX-07N2a_RujQHtcfIW3YlX4/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Miguel’s decision whether to leave his village or stay' },
          { key: 'B', text: 'Miguel’s difficulty in finding food and water during his journey' },
          { key: 'C', text: 'Miguel’s fear of the jungle and the challenges he faced along the way' },
          { key: 'D', text: 'Miguel’s struggle to continue his journey while a forest spirit tried to mislead him' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-eng-6',
        text: 'What is the tone of the narrator in the paragraph above?',
        imageUrl: 'https://drive.google.com/file/d/1W5wpmtDMc_b6FqkGzvFYdoFxVTMW_ylY/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Calm and reflective' },
          { key: 'B', text: 'Frustrated and tense' },
          { key: 'C', text: 'Playful and humorous' },
          { key: 'D', text: 'Serious and panicked' }
        ],
        correctAnswer: 'A'
      },
      {
        id: 'flt-eng-7',
        text: 'Which statement is correct about daily exercise based on the graphics?',
        imageUrl: 'https://drive.google.com/file/d/1KGMekpm7-zgSZsL3XX8qw43CTI1qS-Hs/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Exercise is boring and should be avoided.' },
          { key: 'B', text: 'Regular physical activity strengthens muscles.' },
          { key: 'C', text: 'Exercising only once a week is harmful to your health.' },
          { key: 'D', text: 'You can lose weight immediately without following a balanced diet.' }
        ],
        correctAnswer: 'B'
      },
      {
        id: 'flt-eng-8',
        text: 'What was the effect of the applicant\'s handshake during the job interview?',
        imageUrl: 'https://drive.google.com/file/d/1gISW-k4Ds5gF4kY8CWTY1EAT1Y-c2mcr/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'It made him seem nervous.' },
          { key: 'B', text: 'It distracted the interviewer.' },
          { key: 'C', text: 'It helped him build a connection.' },
          { key: 'D', text: 'It caused him to forget his answer.' }
        ],
        correctAnswer: 'C'
      },
      {
        id: 'flt-eng-9',
        text: 'What details are shown in Aling Nene\'s income breakdown form?',
        imageUrl: 'https://drive.google.com/file/d/1rAW3ER75NH2fanWSCviFxIB2YEiBHSwV/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Her annual income' },
          { key: 'B', text: 'Her family\'s combined income' },
          { key: 'C', text: 'Her total weekly working hours' },
          { key: 'D', text: 'Her monthly income and occupation' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-eng-10',
        text: 'What was the primary reason Mang Juan researched new irrigation techniques?',
        imageUrl: 'https://drive.google.com/file/d/1lfDHkqL_6Hon-DD7hvvJFoRnLCNB4005/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'His neighbor recommended trying new techniques.' },
          { key: 'B', text: 'He wanted to test new methods for personal curiosity.' },
          { key: 'C', text: 'The drought caused his crops to struggle, so he wanted to help them survive.' },
          { key: 'D', text: 'He read about irrigation techniques in a magazine and decided to follow them.' }
        ],
        correctAnswer: 'C'
      },
      {
        id: 'flt-eng-11',
        text: 'What is the main purpose of this recipe text?',
        imageUrl: 'https://drive.google.com/file/d/1VqXAeh9M2Xfab5YbTPhfE7pajiW5xv7u/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'To entertain readers with a story.' },
          { key: 'B', text: 'To describe the ingredients in detail.' },
          { key: 'C', text: 'To inform readers about Filipino culture.' },
          { key: 'D', text: 'To teach readers how to make a Filipino dish.' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-eng-12',
        text: 'Which of the following describes the key takeaway from the article on clean water?',
        imageUrl: 'https://drive.google.com/file/d/1uJP2Vlljeu-5p60-GJsDFI56BSEFWFkC/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Water is important in our daily life.' },
          { key: 'B', text: 'Everyone has access to clean water.' },
          { key: 'C', text: 'Clean water is essential for health, prevents diseases, and requires protection.' },
          { key: 'D', text: 'Clean water is good for cooking and cleaning, and using more chemicals can help gardens grow better.' }
        ],
        correctAnswer: 'C'
      },
      {
        id: 'flt-eng-13',
        text: 'What feeling is primarily expressed in the lyrical poem about birds?',
        imageUrl: 'https://drive.google.com/file/d/1C6WXVDs0mDYaGHKLfEYFU1IA1fPlbNHU/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'To explain how the weather affects nature' },
          { key: 'B', text: 'To give a scientific account of birds and trees' },
          { key: 'C', text: 'To express feelings of joy and harmony in nature' },
          { key: 'D', text: 'To describe the movement and sound of leaves and birds' }
        ],
        correctAnswer: 'C'
      },
      {
        id: 'flt-eng-14',
        text: 'What needs to be supplied in the emergency field of the ID registration card?',
        imageUrl: 'https://drive.google.com/file/d/1fabtlg2m3Ywt3cl0vzpPhdraX99mImPk/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'Names' },
          { key: 'B', text: 'Phone numbers' },
          { key: 'C', text: 'Social security numbers' },
          { key: 'D', text: 'Emergency contact numbers' }
        ],
        correctAnswer: 'D'
      }
    ],
    ls1EngWriting: [
      { id: 'flt-eng-w1', text: 'Writing Prompt 1: Write a short paragraph explaining why education is important to you.', imageUrl: 'https://drive.google.com/file/d/1XLnLPYvzfgyN7XxJ1I1jYoLIU20-3v9g/view?usp=drive_link' },
      { id: 'flt-eng-w2', text: 'Writing Prompt 2: Write a letter of request to your local barangay captain.', imageUrl: 'https://drive.google.com/file/d/1fDpEcc0CXIB8dNuS--cwwKjv3A_VoJP2/view?usp=drive_link' }
    ],
    ls3Math: [
      {
        id: 'flt-math-1',
        text: 'The ALS Rizal District enrolled 1,268 new learners this year. Last year, they enrolled 1,783 learners. How many learners did the ALS Rizal District enroll in total over these two years?',
        choices: [
          { key: 'A', text: '2,941 learners' },
          { key: 'B', text: '2,951 learners' },
          { key: 'C', text: '3,041 learners' },
          { key: 'D', text: '3,051 learners' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-math-2',
        text: 'The Municipal LGU pledged to donate a Community Learning Center. It has a rectangular design that is 12 meters long and 10 meters wide. What is the floor area that needs to be tiled?',
        choices: [
          { key: 'A', text: '100 m²' },
          { key: 'B', text: '110 m²' },
          { key: 'C', text: '120 m²' },
          { key: 'D', text: '130 m²' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-math-3',
        text: 'During a market visit, Lilia bought the following fruits:\n- Mangoes: 1.25 kg\n- Rambutan: 2.35 kg\n- Bananas: 0.88 kg\n\nWhat is the total weight of the fruits Lilia bought?',
        choices: [
          { key: 'A', text: '3.48 kg' },
          { key: 'B', text: '3.58 kg' },
          { key: 'C', text: '4.48 kg' },
          { key: 'D', text: '4.58 kg' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-math-4',
        text: 'Study the chart regarding the number of books read by learners:',
        imageUrl: 'https://drive.google.com/file/d/1eMm3Xh9c72oVDhukCQntbslOxgoOLftE/view?usp=drive_link',
        choices: [
          { key: 'A', text: 'The total number of learners surveyed is 30.' },
          { key: 'B', text: 'More learners read 9 or more books than those who read 6-8 books.' },
          { key: 'C', text: 'The majority of learners read more than 6 books during the summer.' },
          { key: 'D', text: 'The number of learners who read 3-5 books is double the number of those who read 0-2 books.' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-math-5',
        text: 'During an outreach program, 77 raffle tickets were given out. If the tickets are to be evenly divided among 7 learning groups, is 77 divisible by 7?',
        choices: [
          { key: 'A', text: 'Yes, because 77÷7=11' },
          { key: 'B', text: 'Yes, because 77 ends in 7' },
          { key: 'C', text: 'No, because 77 is an odd number' },
          { key: 'D', text: 'No, because 77 is not divisible by 10' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-math-6',
        text: 'Determine the missing dimension based on the visual model:',
        imageUrl: 'https://drive.google.com/file/d/1p8oPHqL6WH1oY0_2KKmHwTRB35efrbSa/view?usp=drive_link',
        choices: [
          { key: 'A', text: '4' },
          { key: 'B', text: '6' },
          { key: 'C', text: '8' },
          { key: 'D', text: '12' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-math-7',
        text: 'One-third (1/3) of San Pedro Community Learning Center’s garden is planted with vegetables. Which of the following shows the correct percent of the garden used for vegetables?',
        choices: [
          { key: 'A', text: '25.33%' },
          { key: 'B', text: '33.33%' },
          { key: 'C', text: '50%' },
          { key: 'D', text: '75%' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-math-8',
        text: 'Alex has two part-time job offers. Job A pays ₱45.00 per hour for 5 hours a day, 6 days a week. Job B pays ₱55.00 per hour for 4 hours a day, 5 days a week. If Alex works at Job A for 3 weeks and at Job B for 2 weeks, how much total money will he earn from both jobs?',
        choices: [
          { key: 'A', text: '₱6,250.00' },
          { key: 'B', text: '₱7,200.00' },
          { key: 'C', text: '₱7,500.00' },
          { key: 'D', text: '₱8,000.00' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-math-9',
        text: 'Lisa\'s father is renovating their house. He plans to build a triangular roof where all three sides measure exactly 2 meters each. What type of triangle is the roof based on its sides?',
        choices: [
          { key: 'A', text: 'Equilateral triangle' },
          { key: 'B', text: 'Isosceles triangle' },
          { key: 'C', text: 'Scalene triangle' },
          { key: 'D', text: 'Right triangle' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-math-10',
        text: 'Aling Tita bought 1 1/2 kilos of fish. She wants to share it equally among her 3 children’s families. How many kilos of fish will each family get?',
        choices: [
          { key: 'A', text: '1/2 kilo' },
          { key: 'B', text: '1/3 kilo' },
          { key: 'C', text: '1/4 kilo' },
          { key: 'D', text: '1/6 kilo' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-math-11',
        text: 'A school has 150 learners in Grade 6 and 75 in Grade 5. What is the ratio of Grade 6 to Grade 5 learners?',
        choices: [
          { key: 'A', text: '1:2' },
          { key: 'B', text: '1:3' },
          { key: 'C', text: '2:1' },
          { key: 'D', text: '3:2' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-math-12',
        text: 'Sheila borrowed ₱200.00 from her friend and promised to pay it back after 30 days. She agreed to give an additional 5% as a token of appreciation. How much money will Sheila pay back in total?',
        choices: [
          { key: 'A', text: '₱205.00' },
          { key: 'B', text: '₱210.00' },
          { key: 'C', text: '₱215.00' },
          { key: 'D', text: '₱220.00' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-math-13',
        text: 'Mara has ₱1,000.00 and she wants to buy different types of street food that cost ₱135.50. If her fare is worth ₱25.00, how much money will be left?',
        choices: [
          { key: 'A', text: '₱839.50' },
          { key: 'B', text: '₱849.50' },
          { key: 'C', text: '₱869.50' },
          { key: 'D', text: '₱870.50' }
        ],
        correctAnswer: 'D'
      },
      {
        id: 'flt-math-14',
        text: 'A rectangular box measures 5 meters long, 3 meters wide, and 2 meters high. What is the total surface area of the box?',
        choices: [
          { key: 'A', text: '32 m²' },
          { key: 'B', text: '42 m²' },
          { key: 'C', text: '52 m²' },
          { key: 'D', text: '62 m²' }
        ],
        correctAnswer: 'D'
      }
    ]
  };

  const activeQuestions = useMemo(() => {
    if (questions && questions.length > 0) {
      const fil = questions.filter((q: any) => q.category && q.category.toLowerCase().includes("filipino") && q.category.toLowerCase().includes("pagbasa"));
      const filW = questions.filter((q: any) => q.category && q.category.toLowerCase().includes("filipino") && q.category.toLowerCase().includes("pagsulat"));
      const eng = questions.filter((q: any) => q.category && q.category.toLowerCase().includes("english") && q.category.toLowerCase().includes("read"));
      const engW = questions.filter((q: any) => q.category && q.category.toLowerCase().includes("english") && q.category.toLowerCase().includes("write"));
      const math = questions.filter((q: any) => q.category && (q.category.toLowerCase().includes("ls3") || q.category.toLowerCase().includes("math")));

      return {
        ls1Fil: fil.length > 0 ? fil : MOCK_FLT_QUESTIONS.ls1Fil,
        ls1FilWriting: filW.length > 0 ? filW : MOCK_FLT_QUESTIONS.ls1FilWriting,
        ls1Eng: eng.length > 0 ? eng : MOCK_FLT_QUESTIONS.ls1Eng,
        ls1EngWriting: engW.length > 0 ? engW : MOCK_FLT_QUESTIONS.ls1EngWriting,
        ls3Math: math.length > 0 ? math : MOCK_FLT_QUESTIONS.ls3Math
      };
    }

    return {
      ls1Fil: MOCK_FLT_QUESTIONS.ls1Fil,
      ls1FilWriting: MOCK_FLT_QUESTIONS.ls1FilWriting,
      ls1Eng: MOCK_FLT_QUESTIONS.ls1Eng,
      ls1EngWriting: MOCK_FLT_QUESTIONS.ls1EngWriting,
      ls3Math: MOCK_FLT_QUESTIONS.ls3Math
    };
  }, [questions]);

  // Helper to update MCQ scores based on interactive answers
  const updateFltScoresFromAnswers = (updatedAnswers: Record<string, string>) => {
    // 1. LS1 Filipino MCQ Score
    let filCorrect = 0;
    activeQuestions.ls1Fil.forEach((q: any) => {
      const selected = updatedAnswers[q.id];
      const correctKey = q.correctAnswer || 'B';
      if (selected && selected === correctKey) {
        filCorrect++;
      }
    });
    setFltLS1FilMcq(Math.min(10, filCorrect));

    // 2. LS1 English MCQ Score
    let engCorrect = 0;
    activeQuestions.ls1Eng.forEach((q: any) => {
      const selected = updatedAnswers[q.id];
      const correctKey = q.correctAnswer || 'C';
      if (selected && selected === correctKey) {
        engCorrect++;
      }
    });
    setFltLS1EngMcq(Math.min(10, engCorrect));

    // 3. LS3 Mathematics Score
    let mathCorrect = 0;
    activeQuestions.ls3Math.forEach((q: any) => {
      const selected = updatedAnswers[q.id];
      const correctKey = q.correctAnswer || 'A';
      if (selected && selected === correctKey) {
        mathCorrect++;
      }
    });
    setFltLS3Math(Math.min(15, mathCorrect));
  };

  const handleSelectOption = (qId: string, optKey: string) => {
    const updated = {
      ...fltAnswers,
      [qId]: optKey
    };
    setFltAnswers(updated);
    updateFltScoresFromAnswers(updated);
  };

  const renderQuestionCard = (q: any, idx: number, prefix: string, onClickOption: (key: string) => void, activeValue: string | null) => {
    const isDriveUrl = q.imageUrl && (q.imageUrl.includes('drive.google.com') || q.imageUrl.includes('lh3.googleusercontent.com'));
    
    return (
      <div key={`qcard-${prefix}-${q.id || idx}-${idx}`} className="p-4 border border-slate-200/80 rounded-xl bg-white shadow-3xs hover:border-slate-350 transition duration-150 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold text-slate-800 leading-relaxed">
            <span className="text-indigo-600 font-extrabold font-mono mr-1.5">{prefix}{idx + 1}.</span>
            {q.text}
          </p>
        </div>

        {q.imageUrl && (
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-[#002B6D] font-bold">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Reference Leaflet / Booklet
              </span>
              <a 
                href={q.imageUrl} 
                target="_blank" 
                referrerPolicy="no-referrer"
                rel="noopener noreferrer" 
                className="hover:underline flex items-center gap-0.5"
              >
                Open Document ↗
              </a>
            </div>
            
            {isDriveUrl ? (
              <div className="w-full relative rounded-lg border border-slate-200 overflow-hidden bg-white flex justify-center items-center h-48 sm:h-64 shadow-inner">
                <img 
                  src={getDriveThumbnailUrl(q.imageUrl)} 
                  alt={`Question ${idx + 1} reference`} 
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 truncate">{q.imageUrl}</p>
            )}
          </div>
        )}

        {q.choices && q.choices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {q.choices.map((opt: any) => {
              const optKey = opt.key || 'A';
              const isSelected = activeValue === optKey;

              return (
                <button
                  key={`choice-${optKey}-${q.id || idx}`}
                  type="button"
                  onClick={() => onClickOption(optKey)}
                  className={`p-2.5 border text-left rounded-xl transition flex items-start gap-2.5 text-[11px] font-semibold cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950 ring-2 ring-indigo-550' 
                      : 'bg-white hover:bg-slate-50 text-slate-650 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] shrink-0 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {optKey}
                  </span>
                  <span className="leading-tight pt-0.5">{opt.text}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };

  const renderWritingPromptCard = (q: any, idx: number, prefix: string) => {
    const isDriveUrl = q.imageUrl && (q.imageUrl.includes('drive.google.com') || q.imageUrl.includes('lh3.googleusercontent.com'));
    return (
      <div key={`wcard-${prefix}-${q.id || idx}-${idx}`} className="p-4 border border-rose-100 rounded-xl bg-rose-50/10 space-y-3">
        <div className="flex items-start justify-between">
          <p className="text-xs font-bold text-slate-800 leading-relaxed">
            <span className="text-rose-700 font-extrabold font-mono mr-1.5">{prefix}{idx + 1}.</span>
            {q.text || "Sumulat ng Pangungusap / Write a composition:"}
          </p>
        </div>
        
        {q.imageUrl && (
          <div className="bg-white rounded-xl p-3 border border-rose-100 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-rose-800 font-bold">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-rose-600" /> Writing Sheet Worksheet
              </span>
              <a 
                href={q.imageUrl} 
                target="_blank" 
                referrerPolicy="no-referrer"
                rel="noopener noreferrer" 
                className="text-rose-700 hover:underline flex items-center gap-0.5"
              >
                Open Worksheet ↗
              </a>
            </div>
            
            {isDriveUrl ? (
              <div className="w-full relative rounded-lg border border-slate-150 overflow-hidden bg-white flex justify-center items-center h-48 shadow-inner">
                <img 
                  src={getDriveThumbnailUrl(q.imageUrl)} 
                  alt="Writing sheet" 
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 truncate">{q.imageUrl}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full text-slate-800 font-sans" id="flt-view-root">
      
      {/* Printable Single Record Layout (Active exclusively during print mode) */}
      {printRecord && (
        <div className="hidden print:block absolute inset-0 bg-white p-8 text-black z-100 min-h-screen text-xs leading-relaxed font-sans">
          
          {/* Print Header */}
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <img src="https://lh3.googleusercontent.com/d/1cGaJXvEpivgZMUr9QTMO0rhB2MbJnPhz" alt="DEPED Logo" className="w-12 h-12 object-contain" />
            <div className="text-center">
              <p className="font-extrabold uppercase text-[10px] tracking-widest text-[#002B6D]">Kagawaran ng Edukasyon</p>
              <p className="text-[9px] uppercase font-bold text-slate-500">Department of Education • Alternative Learning System</p>
              <h2 className="text-sm font-black uppercase text-slate-900 tracking-tight mt-1">FUNCTIONAL LITERACY TEST (FLT) REPORT</h2>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-[#002B6D] text-white rounded-full font-black text-center text-[10px] leading-tight">
              ALS
            </div>
          </div>

          {/* Bio Info Grid */}
          <div className="grid grid-cols-2 gap-4 border p-4 rounded-xl bg-slate-50 mb-6 font-semibold">
            <div>
              <p><span className="text-slate-400">LEARNER&#39;S NAME:</span> <strong className="text-black font-extrabold text-sm">{printRecord.learnerName}</strong></p>
              <p className="mt-1"><span className="text-slate-400">GENDER/SEX:</span> <strong className="text-black">{getLearnerParts(printRecord).sex || 'Male'}</strong></p>
              <p className="mt-1"><span className="text-slate-400">AGE:</span> <strong className="text-black">{getLearnerParts(printRecord).age || 'N/A'}</strong></p>
              <p className="mt-1"><span className="text-slate-400">CLC CENTRE:</span> <strong className="text-black text-[#002B6D]">{printRecord.communityLearningCenter}</strong></p>
              {printRecord.lastGradeCompleted && (
                <p className="mt-1"><span className="text-slate-400">LAST GRADE COMPLETED:</span> <strong className="text-black">{printRecord.lastGradeCompleted}</strong></p>
              )}
            </div>
            <div>
              <p><span className="text-slate-400">ASSESSMENT DATE:</span> <strong className="text-black">{printRecord.dateAssessed}</strong></p>
              <p className="mt-1"><span className="text-slate-400">ALS SPECIALIST/TEACHER:</span> <strong className="text-black">{printRecord.teacherName}</strong></p>
              <p className="mt-1"><span className="text-slate-400">TIME STARTED:</span> <strong className="text-black font-mono">{getRecordTimes(printRecord).started}</strong></p>
              <p className="mt-1"><span className="text-slate-400">TIME FINISHED:</span> <strong className="text-black font-mono">{getRecordTimes(printRecord).finished}</strong></p>
            </div>
          </div>

          {/* Scores breakdown Table */}
          <h3 className="font-black text-slate-900 uppercase tracking-wider mb-2 text-[10px]">I. Performance Report by Learning Strand (LS)</h3>
          <table className="w-full text-left border-collapse border border-slate-300 mb-6">
            <thead>
              <tr className="bg-slate-100 text-[9.5px] uppercase font-black text-slate-600 border-b border-slate-300">
                <th className="p-2 border-r border-slate-300">Learning Strand Name</th>
                <th className="p-2 text-center border-r border-slate-300 w-32">Multiple Choice Score</th>
                <th className="p-2 text-center border-r border-slate-300 w-32">Writing Score</th>
                <th className="p-2 text-center border-r border-slate-300 w-32 bg-slate-200/50">Sub score</th>
                <th className="p-2 text-center w-32">Max Score Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-250 font-medium">
              <tr>
                <td className="p-2 border-r border-slate-300">LS 1: Communication Skills (Filipino)</td>
                <td className="p-2 text-center border-r border-slate-300 font-mono">{printRecord.ls1FilMcq}</td>
                <td className="p-2 text-center border-r border-slate-300 font-mono">{printRecord.ls1FilWriting}</td>
                <td className="p-2 text-center border-r border-slate-300 font-mono font-bold bg-slate-100/50">{printRecord.ls1FilMcq + printRecord.ls1FilWriting}</td>
                <td className="p-2 text-center font-mono text-slate-400">15</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-300">LS 1: Communication Skills (English)</td>
                <td className="p-2 text-center border-r border-slate-300 font-mono">{printRecord.ls1EngMcq}</td>
                <td className="p-2 text-center border-r border-slate-300 font-mono">{printRecord.ls1EngWriting}</td>
                <td className="p-2 text-center border-r border-slate-300 font-mono font-bold bg-slate-100/50">{printRecord.ls1EngMcq + printRecord.ls1EngWriting}</td>
                <td className="p-2 text-center font-mono text-slate-400">15</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-300" colSpan={3}>LS 2: Scientific Literacy and Critical Thinking Skills</td>
                <td className="p-2 text-center border-r border-slate-300 font-mono font-bold bg-slate-100/50">{printRecord.ls2Science}</td>
                <td className="p-2 text-center font-mono text-slate-400">10</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-300" colSpan={3}>LS 3: Mathematical and Problem Solving Skills</td>
                <td className="p-2 text-center border-r border-slate-300 font-mono font-bold bg-slate-100/50">{printRecord.ls3Math}</td>
                <td className="p-2 text-center font-mono text-slate-400">15</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-300" colSpan={3}>LS 4: Life and Career Skills</td>
                <td className="p-2 text-center border-r border-slate-300 font-mono font-bold bg-slate-100/50">{printRecord.ls4LifeCareer}</td>
                <td className="p-2 text-center font-mono text-slate-400">10</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-300" colSpan={3}>LS 5: Understanding Self and Society</td>
                <td className="p-2 text-center border-r border-slate-300 font-mono font-bold bg-slate-100/50">{printRecord.ls5SelfSociety}</td>
                <td className="p-2 text-center font-mono text-slate-400">10</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-300" colSpan={3}>LS 6: Digital Citizenship Skills</td>
                <td className="p-2 text-center border-r border-slate-300 font-mono font-bold bg-slate-100/50">{printRecord.ls6Digital}</td>
                <td className="p-2 text-center font-mono text-slate-400">10</td>
              </tr>
              <tr className="bg-slate-100 text-slate-900 border-t border-slate-300 font-black">
                <td className="p-2 border-r border-slate-300 font-black uppercase text-[10px]" colSpan={3}>OVERALL COMPREHENSIVE SCORE</td>
                <td className="p-2 text-center border-r border-slate-300 font-mono font-black text-lg bg-emerald-50 text-emerald-950">
                  {printRecord.ls1FilMcq + printRecord.ls1FilWriting + printRecord.ls1EngMcq + printRecord.ls1EngWriting + printRecord.ls2Science + printRecord.ls3Math + printRecord.ls4LifeCareer + printRecord.ls5SelfSociety + printRecord.ls6Digital}
                </td>
                <td className="p-2 text-center font-mono text-black">85</td>
              </tr>
            </tbody>
          </table>

          {/* Summary results */}
          <div className="border rounded-xl p-4 bg-slate-50 mb-6">
            <h4 className="font-extrabold text-slate-900 uppercase text-[9.5px] tracking-wider mb-2">II. Qualitative Evaluation & Diagnostics</h4>
            <p className="mb-1"><span className="text-slate-400 uppercase text-[8.5px] font-black">Learner Strengths:</span> <strong>{printRecord.strengths}</strong></p>
            <p className="mb-1"><span className="text-slate-400 uppercase text-[8.5px] font-black">Identified Challenges:</span> <strong>{printRecord.weaknesses}</strong></p>
            <p className="mb-1"><span className="text-slate-400 uppercase text-[8.5px] font-black">Curriculum Recommendation:</span> <strong className="text-indigo-800 text-sm font-extrabold">{printRecord.recommendations}</strong></p>
          </div>

          {/* Footer signatures */}
          <div className="grid grid-cols-2 gap-12 mt-12 text-center font-bold">
            <div>
              <div className="border-b border-black w-48 mx-auto pb-1 block">
                <span className="font-mono text-xs italic">{printRecord.learnerSignature}</span>
              </div>
              <p className="mt-1 uppercase text-[8.5px] text-slate-400 font-black">Learner Signature & Date</p>
            </div>
            <div>
              <div className="border-b border-black w-48 mx-auto pb-1 block">
                <span className="font-mono text-xs italic">{printRecord.teacherSignature}</span>
              </div>
              <p className="mt-1 uppercase text-[8.5px] text-slate-400 font-black">ALS Mobile Teacher Signature</p>
            </div>
          </div>

          <button 
            onClick={() => setPrintRecord(null)}
            className="print:hidden absolute top-4 right-4 bg-red-600 text-white font-extrabold px-3 py-1 rounded-lg"
          >
            ← Close Print Mode
          </button>
        </div>
      )}

      {/* Screen Header View card (Non print mode) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-slate-200/90 rounded-3xl shadow-3xs print:hidden mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50/70 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-black shadow-3xs shrink-0">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
              {mode === 'assessment'
                ? (selectedDistrict === 'Functional Literacy Test: Junior High School Level'
                    ? `Digital Functional Literacy Test (FLT) - Junior High School Level (${testType})`
                    : `Digital Functional Literacy Test (FLT) - Elementary Level (${testType})`)
                : `Learners’ Record on Functional Literacy Assessment (${testType})`}
            </h1>
            <p className="text-xs text-slate-500 font-medium font-semibold">
              {mode === 'assessment'
                ? `Assessing advanced communication, critical calculation and digital skills standards (${testType})`
                : `National registry baseline monitoring for ALS Strands 1 to 6 tests scores (${testType})`}
            </p>
          </div>
        </div>
      </div>

      {mode === 'assessment' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xs overflow-hidden print:hidden">
          
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={wizardTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* 1. Demographics tab */}
                {wizardTab === 'info' && (
                  <div className="space-y-6">
                    {/* Learner Information Form Block */}
                    {renderLearnerInfoForm()}

                    {/* Pre-Test Directions Sheet */}
                    {selectedDistrict === 'Functional Literacy Test: Elementary Level' && (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white font-sans print:hidden">
                        {/* Document Content */}
                        <div className="p-6 bg-slate-50/50">
                          <div className="max-w-2xl mx-auto bg-white border border-slate-200 shadow-3xs rounded-xl p-6 md:p-8 space-y-6">
                            
                            {/* DepEd-like Document Header Branding */}
                            <div className="text-center border-b border-slate-150 pb-5 space-y-1">
                              <h2 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                                FUNCTIONAL LITERACY TEST - ELEMENTARY LEVEL
                                <span className="block text-indigo-700 text-xs font-black tracking-widest mt-0.5 uppercase">
                                  {testType === 'Post-Test' ? 'POST-TEST' : 'PRE-TEST'}
                                </span>
                              </h2>
                            </div>

                            {/* General Directions */}
                            <div className="space-y-3">
                              <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest border-b border-indigo-100 pb-1.5">
                                GENERAL DIRECTIONS
                              </h3>
                              <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                                The Digital Functional Literacy Test (FLT) is an interactive computer-administered assessment measuring advanced communications, critical calculations, and digital citizenship standards. Answer each item carefully by interacting directly with the digital options and input fields on your screen.
                              </p>
                            </div>

                            {/* Response Guide Grid */}
                            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">DIGITAL INTERACTION GUIDE</h4>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                  <p className="font-bold text-emerald-800 mb-1 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    MULTIPLE-CHOICE ITEMS:
                                  </p>
                                  <p className="text-[11px] font-semibold text-slate-700 leading-snug">
                                    Click or tap your selected option directly. Your choice will be highlighted in primary indigo and saved onto the system.
                                  </p>
                                </div>
                                <div>
                                  <p className="font-bold text-indigo-800 mb-1 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    WRITTEN/TEXT INPUTS:
                                  </p>
                                  <p className="text-[11px] font-semibold text-slate-700 leading-snug">
                                    Compose your responses clearly within the designated digital text area provided under the writing prompts.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Instructions detailed text */}
                            <div className="space-y-3 text-xs text-slate-650 leading-relaxed font-semibold">
                              <p>
                                Your progress is automatically monitored and buffered. You may change your choice at any time prior to clicking the final submission button by selecting a different option.
                              </p>
                              <p>
                                Ensure that you read and comprehend all sections carefully, including LS1 Communication Skills (Filipino/English), LS3 Mathematical and Problem-Solving Skills, and LS6 Digital Citizenship standards.
                              </p>
                              <p className="font-bold text-slate-800">
                                This is a completely digital assessment. No physical papers or booklets are required.
                              </p>
                              <p>
                                The total recommended time allotted for completion is two (2) hours and thirty (30) minutes. Monitor your timing using the live indicators. Once you have finalized your answers, navigate to the final step and click the secure digital Submit button.
                              </p>
                            </div>

                            {/* LEARNING STRAND 1 FILIPINO Instruction Box */}
                            <div className="bg-[#FFF8F8] border border-rose-200 rounded-xl p-5 space-y-2.5">
                              <span className="inline-block text-[14px] bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider font-sans">
                                LEARNING STRAND 1 - COMMUNICATION SKILLS (FILIPINO)
                              </span>
                              <h4 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider border-b border-rose-100/50 pb-1.5 font-sans">
                                Bahagi I. Pagbasa
                              </h4>
                              <p className="text-[14px] text-slate-800 leading-relaxed font-normal font-sans">
                                <strong className="text-rose-950 font-bold">Panuto:</strong> Basahin at unawaing mabuti ang mga tanong sa bawat bilang. Piliin ang titik ng tamang sagot at itiman ito sa sagutang papel para sa LS 1 - Communication Skills (Filipino).
                              </p>
                            </div>

                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={() => setWizardTab('ls1_fil')}
                        className="bg-[#002B6D] hover:bg-[#001f52] shadow-xs text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition"
                      >
                        Next: LS1 Filipino
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. LS 1 Filipino Tab */}
                {wizardTab === 'ls1_fil' && (
                  <div className="space-y-6">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col gap-1 shadow-2xs font-sans">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h4 className="text-sm font-extrabold text-emerald-800 uppercase tracking-widest font-sans">START OF ASSESSMENT</h4>
                      </div>
                      <p className="text-xs text-emerald-950 font-normal leading-relaxed font-sans">
                        Ang pagsusulit ay opisyal nang nagsimula. Mangyaring sagutin ang bawat aytem sa ibaba.
                      </p>
                      <div className="mt-2 inline-flex items-center self-start text-[10px] font-black uppercase text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-full tracking-wider font-sans">
                        Assessment Active
                      </div>
                    </div>

                    <div className="border-b border-rose-100 pb-3">
                      <h3 className="font-black text-rose-800 text-sm uppercase tracking-wide">Learning Strand 1: Communication Skills (Filipino) • Max 15 Pts</h3>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="bg-rose-50/20 border border-rose-100 rounded-2xl p-4">
                          <h4 className="text-[14px] font-bold text-rose-900 uppercase tracking-wider mb-1 font-sans">Bahagi I. Pagbasa</h4>
                          <p className="text-[14px] text-slate-800 font-normal leading-relaxed font-sans">
                            Panuto: Basahin at unawaing mabuti ang mga tanong sa bawat bilang. Piliin ang titik ng tamang sagot at itiman ito sa sagutang papel para sa LS 1 - Communication Skills (Filipino).
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          {activeQuestions.ls1Fil.map((q, idx) => 
                            renderQuestionCard(q, idx, 'Q', (key) => handleSelectOption(q.id, key), fltAnswers[q.id])
                          )}
                        </div>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-slate-100">
                        <div className="bg-rose-50/20 border border-rose-100 rounded-2xl p-4">
                          <h4 className="text-[14px] font-bold text-rose-900 uppercase tracking-wider mb-1 font-sans">Bahagi II. Pagsulat (Writing Prompts)</h4>
                          <p className="text-[14px] text-slate-800 font-normal leading-relaxed font-sans">
                            Panuto: Basahin ang bawat paksa sa ibaba. Ipasulat ang sagot sa sagutang papel (Filipino Writing Sheets) at bigyan ng angkop na puntos (0-5) ayon sa rubrik.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {activeQuestions.ls1FilWriting.map((q, idx) => 
                            renderWritingPromptCard(q, idx, 'W')
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <button
                        onClick={() => setWizardTab('info')}
                        className="border border-slate-300 text-slate-650 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase flex items-center gap-1.5 hover:bg-slate-50"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button
                        onClick={() => setWizardTab('ls1_eng')}
                        className="bg-[#002B6D] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 hover:bg-[#001f52]"
                      >
                        Next: LS1 English <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. LS 1 English Tab */}
                {wizardTab === 'ls1_eng' && (
                  <div className="space-y-6">
                    <div className="border-b border-indigo-100 pb-3">
                      <h3 className="font-black text-indigo-800 text-sm uppercase tracking-wide">Learning Strand 1: Communication Skills (English) • Max 15 Pts</h3>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="bg-indigo-50/20 border border-indigo-100 rounded-2xl p-4 font-sans">
                          <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider mb-1 font-sans">Part I. Reading & Reading Comprehension</h4>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed font-sans">
                            Instructions: Read and analyze the questions carefully. Choose the correct option and mark the corresponding letter on the answer sheet.
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          {activeQuestions.ls1Eng.map((q, idx) => 
                            renderQuestionCard(q, idx, 'Q', (key) => handleSelectOption(q.id, key), fltAnswers[q.id])
                          )}
                        </div>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-slate-100">
                        <div className="bg-indigo-50/20 border border-indigo-100 rounded-2xl p-4 font-sans">
                          <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider mb-1 font-sans">Part II. Writing Worksheets</h4>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed font-sans">
                            Instructions: Ask the learner to write their composition or response on their English Writing test sheet and grade between 0 to 5 points.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 font-sans">
                          {activeQuestions.ls1EngWriting.map((q, idx) => 
                            renderWritingPromptCard(q, idx, 'W')
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setWizardTab('ls1_fil')}
                        className="border border-slate-300 text-slate-650 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardTab('ls3')}
                        className="bg-[#002B6D] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 hover:bg-[#001f52] cursor-pointer"
                      >
                        LS3: MATHEMATICAL AND PROBLEM SOLVING SKILLS <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. LS 2 Science Tab */}
                {wizardTab === 'ls2' && (
                  <div className="space-y-6">
                    <div className="border-b border-teal-100 pb-3">
                      <h3 className="font-black text-teal-850 text-sm uppercase tracking-wide">LS2: Scientific Literacy & Critical Thinking Skills • Max 10 Pts</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-4">
                        <div className="bg-slate-50 p-4 border rounded-xl text-xs leading-relaxed space-y-2">
                          <p className="font-bold text-slate-800">🔬 LS2 Evaluation Parameters Checklist:</p>
                          <p>• Can identify parts and components of basic skeletal frameworks.</p>
                          <p>• Recognizes ecological patterns, recycling habits and simple weather hazards.</p>
                          <p>• Understands basic physical and chemical changes in substances (boiling, freezing, melting).</p>
                        </div>
                      </div>

                      <div className="p-5 border rounded-2xl bg-teal-50/20 shadow-3xs space-y-4 self-start">
                        <h4 className="font-black text-teal-950 border-b border-teal-100 pb-2 text-xs uppercase tracking-wider">Score Field</h4>
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-teal-700 block tracking-wider">Scientific thinking SCORE (0-10)</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={fltLS2Science}
                            onChange={(e) => setFltLS2Science(Math.min(10, Math.max(0, Number(e.target.value))))}
                            className="w-full bg-white border border-teal-300 rounded-xl px-3 py-2 text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <button
                        onClick={() => setWizardTab('ls1_eng')}
                        className="border border-slate-300 text-slate-650 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase flex items-center gap-1.5 hover:bg-slate-50"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button
                        onClick={() => setWizardTab('ls3')}
                        className="bg-[#002B6D] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 hover:bg-[#001f52]"
                      >
                        Next: LS3 Math <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. LS 3 Math Tab */}
                {wizardTab === 'ls3' && (
                  <div className="space-y-6">
                    <div className="border-b border-amber-100 pb-3">
                      <h3 className="font-black text-amber-900 text-sm uppercase tracking-wide">LS 3: Mathematical and Problem Solving Skills (MPSS) • Max 15 Pts</h3>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="bg-amber-50/20 border border-amber-100 rounded-2xl p-4 mb-4 font-sans">
                          <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1 font-sans">Interactive Numeracy Drills</h4>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed font-sans">
                            Instructions: Solve the mathematical word problems and click on the best answer. Scores are updated automatically on selection.
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          {activeQuestions.ls3Math.map((q, idx) => 
                            renderQuestionCard(q, idx, 'Q', (key) => handleSelectOption(q.id, key), fltAnswers[q.id])
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <button
                        onClick={() => setWizardTab('ls2')}
                        className="border border-slate-300 text-slate-650 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase flex items-center gap-1.5 hover:bg-slate-50"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button
                        onClick={() => setWizardTab('ls4_5_6')}
                        className="bg-[#002B6D] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 hover:bg-[#001f52]"
                      >
                        Next: LS4-LS5-LS6 <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. LS 4, 5, 6 Life Skills Tab */}
                {wizardTab === 'ls4_5_6' && (
                  <div className="space-y-6">
                    <div className="border-b border-sky-100 pb-3">
                      <h3 className="font-black text-sky-900 text-sm uppercase tracking-wide">Strand 4, 5, and 6: Advanced Core Life Skills • Max 30 Pts</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-5">
                        <div className="p-4 border rounded-xl bg-sky-50/30 text-xs">
                          <span className="font-extrabold text-sky-950 uppercase tracking-widest block mb-2">💼 Life, Society & Digital citizenship Standards:</span>
                          <span className="block mb-1">• **LS 4 Life & Career**: Business budgeting, work ethics and local agricultural/trade skills.</span>
                          <span className="block mb-1">• **LS 5 Understanding Self & Society**: Community rights, historical identities, Philippine judicial structure.</span>
                          <span className="block">• **LS 6 Digital Literacy**: General computer configuration, word processors, search engines and emails.</span>
                        </div>
                      </div>

                      <div className="p-5 border rounded-2xl bg-sky-50/20 shadow-3xs space-y-4 self-start">
                        <h4 className="font-black text-sky-950 border-b border-sky-100 pb-2 text-xs uppercase tracking-wider">Core Parameters Inputs</h4>

                        <div className="space-y-1.5 overflow-hidden">
                          <label className="text-[10px] font-black uppercase text-sky-800 block tracking-wider">LS 4 - Life and Career Score (0-10)</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={formLearnerId === 'manual' ? fltLS4LifeCareer : fltLS4LifeCareer}
                            onChange={(e) => setFltLS4LifeCareer(Math.min(10, Math.max(0, Number(e.target.value))))}
                            className="w-full bg-white border border-sky-300 rounded-xl px-3 py-2 text-xs font-bold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-sky-800 block tracking-wider">LS 5 - Self and Society Score (0-10)</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={fltLS5SelfSociety}
                            onChange={(e) => setFltLS5SelfSociety(Math.min(10, Math.max(0, Number(e.target.value))))}
                            className="w-full bg-white border border-sky-300 rounded-xl px-3 py-2 text-xs font-bold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-sky-800 block tracking-wider">LS 6 - Digital Citizenship (0-10)</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={fltLS6Digital}
                            onChange={(e) => setFltLS6Digital(Math.min(10, Math.max(0, Number(e.target.value))))}
                            className="w-full bg-white border border-sky-300 rounded-xl px-3 py-2 text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <button
                        onClick={() => setWizardTab('ls3')}
                        className="border border-slate-300 text-slate-650 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase flex items-center gap-1.5 hover:bg-slate-50"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button
                        onClick={() => setWizardTab('summary')}
                        className="bg-[#002B6D] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 hover:bg-[#001f52]"
                      >
                        Next: Final Summary <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. Summary Tab with Recommendations inputs and Save */}
                {wizardTab === 'summary' && (
                  <div className="space-y-6">
                    <div className="border-b border-emerald-100 pb-3">
                      <h3 className="font-black text-emerald-800 text-sm uppercase tracking-wide">Functional Literacy Test Diagnostic Conclusion</h3>
                    </div>

                    {/* Overall Dynamic scores card */}
                    {(() => {
                      const totalScore = fltLS1FilMcq + fltLS1FilWriting + fltLS1EngMcq + fltLS1EngWriting + fltLS2Science + fltLS3Math + fltLS4LifeCareer + fltLS5SelfSociety + fltLS6Digital;
                      const level = calcFltClassification(totalScore);

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-1 border rounded-2xl p-5 bg-slate-50 flex flex-col justify-between self-start shadow-3xs min-h-[220px]">
                            <div>
                              <p className="text-[10px] uppercase font-black text-slate-400">Aggregated FLT Level</p>
                              <h4 className="text-xl font-extrabold text-[#002B6D] mt-1 pr-1">{level.text}</h4>
                            </div>
                            <div className="pt-4 border-t">
                              <p className="text-[10px] font-black text-slate-400 uppercase">Grand Literacy Score</p>
                              <div className="text-3xl font-black text-emerald-800 font-mono mt-1">{totalScore} <span className="text-sm font-semibold text-slate-400">/ 85 Max</span></div>
                            </div>
                          </div>

                          <div className="md:col-span-2 space-y-4">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Key Learner Strengths Identifiers</label>
                              <textarea
                                value={formStrengths}
                                onChange={(e) => setFormStrengths(e.target.value)}
                                placeholder="E.g. Expresses deep analytical vocabulary and displays sound core life skills."
                                className="w-full bg-white border rounded-xl px-4 py-2.5 text-xs font-bold"
                                rows={3}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Areas Needing Immediate Support</label>
                              <textarea
                                value={formWeaknesses}
                                onChange={(e) => setFormWeaknesses(e.target.value)}
                                placeholder="E.g. Division of algebraic patterns and scientific metrics table recall."
                                className="w-full bg-white border rounded-xl px-4 py-2.5 text-xs font-bold"
                                rows={3}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Custom Recommendation / Promotion Guidance</label>
                              <input
                                type="text"
                                value={formRecommendations}
                                onChange={(e) => setFormRecommendations(e.target.value)}
                                placeholder={`Promoted and endorsed for ALS - ${level.text}`}
                                className="w-full bg-white border rounded-xl px-4 py-2 text-xs font-extrabold"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-black text-slate-400">TEACHER SIGNATURE INITIALS</label>
                                <input
                                  type="text"
                                  value={formTeacherSig}
                                  onChange={(e) => setFormTeacherSig(e.target.value)}
                                  placeholder="E.g. M. Aquino"
                                  className="w-full bg-white border rounded-lg px-3 py-1.5 text-xs font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-black text-slate-400">LEARNER INITIALS SIGN-OFF</label>
                                <input
                                  type="text"
                                  value={formLearnerSig}
                                  onChange={(e) => setFormLearnerSig(e.target.value)}
                                  placeholder="E.g. C. Dalisay"
                                  className="w-full bg-white border rounded-lg px-3 py-1.5 text-xs font-bold"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                      <button
                        onClick={() => setWizardTab('ls4_5_6')}
                        className="border border-slate-300 text-slate-650 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase flex items-center gap-1.5 hover:bg-slate-50"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setMode('records')}
                          className="text-slate-500 hover:text-slate-800 text-xs font-black uppercase tracking-wider px-3"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmit}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 active:scale-98 transition cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Save Scorecard Record
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {mode === 'records' && (
        <div className="space-y-6 print:hidden">
          
          {/* Main search and filters card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-3xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Hanapin sa pangalan, CLC, o mobile teacher..."
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  className="w-full bg-white border border-slate-250/90 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-extrabold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002B6D] focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 font-sans">
                  <Filter className="w-3.5 h-3.5 text-[#002B6D]" />
                  <span>Teacher:</span>
                </div>
                <select
                  value={searchTeacher}
                  onChange={(e) => setSearchTeacher(e.target.value)}
                  className="border border-slate-250/80 rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold text-slate-705 focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition cursor-pointer"
                >
                  <option value="">-- All Teachers --</option>
                  <option value="Melody Anne B. Aquino">Melody Anne B. Aquino</option>
                  <option value="Mervin C. Caldoza">Mervin C. Caldoza</option>
                  <option value="Angelica G. Canlas">Angelica G. Canlas</option>
                  <option value="Ranielle Paolo D. Capiendo">Ranielle Paolo D. Capiendo</option>
                  <option value="Russel M. Dionisio">Russel M. Dionisio</option>
                  <option value="Reynaldo M. Domingo Jr.">Reynaldo M. Domingo Jr.</option>
                  <option value="Jenny I. Dueñas">Jenny I. Dueñas</option>
                  <option value="Celeste R. Espinosa">Celeste R. Espinosa</option>
                  <option value="Antonio B. Guban">Antonio B. Guban</option>
                  <option value="Arnold T. Lumba">Arnold T. Lumba</option>
                  <option value="Jennilyn D. Martinez">Jennilyn D. Martinez</option>
                  <option value="Jumar M. Mendoza">Jumar M. Mendoza</option>
                  <option value="Ricardo S. Morales">Ricardo S. Morales</option>
                  <option value="Julius C. Pangilinan">Julius C. Pangilinan</option>
                  <option value="Mariella A. Pornillosa">Mariella A. Pornillosa</option>
                  <option value="Heizel B. Pucate">Heizel B. Pucate</option>
                  <option value="Ramil H. Valentino">Ramil H. Valentino</option>
                </select>

                <button
                  type="button"
                  onClick={fetchSheetRecords}
                  disabled={isSheetLoading}
                  className="px-3 py-1.5 border border-[#002B6D]/20 text-[#002B6D] hover:bg-[#002B6D]/5 bg-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-4xs"
                  title="Synchronize records from FLT Google Sheet"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isSheetLoading ? 'animate-spin' : ''}`} />
                  {isSheetLoading ? 'Syncing...' : 'Sync Google Sheet'}
                </button>

                {sheetRecords.length > 0 && !isSheetLoading && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-2 py-1 rounded-lg">
                    Live Sheet Loaded ({sheetRecords.length} records)
                  </span>
                )}

                {sheetError && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-bold px-2 py-1 rounded-lg" title={sheetError}>
                    Offline Cache Mode
                  </span>
                )}

                <button
                  onClick={() => setMode('assessment')}
                  className="bg-[#002B6D] hover:bg-[#001f52] text-white py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition shadow-3xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Scorecard
                </button>
              </div>
            </div>

            {/* Comprehensive high-fidelity data table */}
            <div className="overflow-x-auto">
              {filteredRecords.length > 0 ? (
                <table className="w-full text-left text-[11px] border-collapse min-w-[2800px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100 font-black text-slate-500 uppercase tracking-wider">
                      <th className="p-3 text-center border-r border-slate-200 w-12 shrink-0">NO.</th>
                      <th className="p-3 border-r border-slate-200 font-extrabold">LAST NAME</th>
                      <th className="p-3 border-r border-slate-200 font-extrabold">FIRST NAME</th>
                      <th className="p-3 border-r border-slate-200 font-extrabold">MIDDLE NAME</th>
                      <th className="p-3 border-r border-slate-200 text-center w-16">SEX</th>
                      <th className="p-3 border-r border-slate-200 text-center w-16">AGE</th>
                      <th className="p-3 border-r border-slate-200 font-extrabold">COMMUNITY LEARNING CENTER</th>
                      <th className="p-3 border-r border-slate-200 font-extrabold">TEACHER</th>
                      <th className="p-3 border-r border-slate-200 text-center w-28">DATE</th>
                      <th className="p-3 border-r border-slate-200 text-center w-28 font-extrabold">CATEGORY</th>
                      <th className="p-3 border-r border-slate-200 text-center w-28">TIME STARTED</th>
                      <th className="p-3 border-r border-slate-200 text-center w-28">TIME FINISHED</th>
                      <th className="p-3 border-r border-slate-200 text-center w-48">LS 1 - FILIPINO_MULTIPLE CHOICE</th>
                      <th className="p-3 border-r border-slate-200 text-center w-40">LS 1 - FILIPINO_WRITING</th>
                      <th className="p-3 border-r border-slate-300 text-center w-36 bg-blue-50 text-[#002B6D] font-black">SUB SCORE_FILIPINO</th>
                      <th className="p-3 border-r border-slate-200 text-center w-48">LS 1 - ENGLISH_MULTIPLE CHOICE</th>
                      <th className="p-3 border-r border-slate-200 text-center w-40">LS 1 - ENGLISH_WRITING</th>
                      <th className="p-3 border-r border-slate-300 text-center w-36 bg-indigo-50 text-indigo-900 font-black">SUB SCORE_ENGLISH</th>
                      <th className="p-3 border-r border-slate-200 text-center w-48">LS 2 - SCIENTIFIC THINKING</th>
                      <th className="p-3 border-r border-slate-305 text-center w-56">LS 3 - MATHEMATICAL AND PROBLEM SOLVING SKILLS</th>
                      <th className="p-3 border-r border-slate-200 text-center w-40">LS 4 - LIFE AND CAREER</th>
                      <th className="p-3 border-r border-slate-200 text-center w-40">LS 5 - SELF AND SOCIETY</th>
                      <th className="p-3 border-r border-slate-300 text-center w-40">LS 6 - DIGITAL CITIZENSHIP</th>
                      <th className="p-3 border-r border-slate-300 text-center w-36 bg-amber-50 text-amber-950 font-black">OVERALL SCORE</th>
                      <th className="p-3 border-r border-slate-200 font-extrabold">RECOMMENDATION</th>
                      <th className="p-3 text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((rec, index) => {
                      const info = getLearnerParts(rec);
                      const times = getRecordTimes(rec);

                      const subFil = Number(rec.ls1FilMcq || 0) + Number(rec.ls1FilWriting || 0);
                      const subEng = Number(rec.ls1EngMcq || 0) + Number(rec.ls1EngWriting || 0);
                      const totalScore = subFil + subEng + Number(rec.ls2Science || 0) + Number(rec.ls3Math || 0) + Number(rec.ls4LifeCareer || 0) + Number(rec.ls5SelfSociety || 0) + Number(rec.ls6Digital || 0);

                      return (
                        <tr key={`${rec.id || 'rec'}-${index}`} className="hover:bg-slate-50/50 transition text-slate-700">
                          <td className="p-3 text-center border-r border-slate-100 font-mono font-bold text-slate-400">{index + 1}</td>
                          <td className="p-3 border-r border-slate-100 font-extrabold text-[#002B6D]">{info.lastName || '-'}</td>
                          <td className="p-3 border-r border-slate-100 font-bold text-slate-800">{info.firstName || '-'}</td>
                          <td className="p-3 border-r border-slate-100 text-slate-600">{info.middleName || '-'}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-bold text-slate-500">{info.sex || '-'}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono font-semibold text-slate-600">{info.age || '-'}</td>
                          <td className="p-3 border-r border-slate-100 text-slate-600 font-semibold">{rec.communityLearningCenter || 'Outreach'}</td>
                          <td className="p-3 border-r border-slate-100 text-slate-600 font-semibold">{rec.teacherName}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono font-semibold text-slate-500">{rec.dateAssessed}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-bold text-slate-500">{rec.category || 'Pre-Test'}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-500">{times.started}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-500">{times.finished}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-600">{rec.ls1FilMcq}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-600">{rec.ls1FilWriting}</td>
                          <td className="p-3 border-r border-slate-200 text-center font-mono font-black text-blue-800 bg-blue-50/15">{subFil}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-600">{rec.ls1EngMcq}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-600">{rec.ls1EngWriting}</td>
                          <td className="p-3 border-r border-slate-200 text-center font-mono font-black text-indigo-800 bg-indigo-50/15">{subEng}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-600">{rec.ls2Science}</td>
                          <td className="p-3 border-r border-slate-200 text-center font-mono text-slate-600 font-bold">{rec.ls3Math}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-600">{rec.ls4LifeCareer}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-600">{rec.ls5SelfSociety}</td>
                          <td className="p-3 border-r border-slate-300 text-center font-mono text-slate-600">{rec.ls6Digital}</td>
                          <td className="p-3 border-r border-slate-250 text-center font-mono font-black text-slate-900 bg-amber-50/15 text-xs">{totalScore}</td>
                          <td className="p-3 border-r border-slate-100 font-semibold text-slate-600 max-w-[200px] truncate" title={rec.recommendations}>{rec.recommendations || 'Eligible / Passed'}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => { setPrintRecord(rec); triggerPrint(); }}
                                className="p-1 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition shrink-0 cursor-pointer"
                                title="Print FLT Scorecard"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(rec)}
                                className="p-1 text-slate-400 hover:text-amber-700 hover:bg-slate-100 rounded-md transition shrink-0 cursor-pointer"
                                title="Edit Scores"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(rec.id, rec.learnerName)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition shrink-0 cursor-pointer"
                                title="Delete"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-slate-400 font-bold font-mono text-xs uppercase tracking-wider bg-slate-50/20">
                  Walang nahanap na record para sa Functional Literacy Test.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legacy popup Intake-form support as secondary fallback modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all print:hidden">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#002B6D]" />
                {editingId ? 'Edit FLT Scorecard Record' : 'Log New FLT Scorecard'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-slate-400">Learner Selection</label>
                  <select
                    value={formLearnerId}
                    onChange={(e) => setFormLearnerId(e.target.value)}
                    className="w-full bg-white border rounded-xl px-3 py-1.5 font-bold"
                  >
                    <option value="manual">Manual Input Profile</option>
                    {learners.map((l, index) => (
                      <option key={`${l.id || 'opt'}-${index}`} value={l.id}>{l.lastName}, {l.firstName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-slate-400">Teacher / Specialist</label>
                  <input
                    type="text"
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    className="w-full bg-white border rounded-xl px-3 py-1.5 font-bold"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px] mb-3">Strand Scores Breakdowns</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400">LS1 Fil MCQ (0-10)</label>
                    <input
                      type="number"
                      value={fltLS1FilMcq}
                      onChange={(e) => setFltLS1FilMcq(Number(e.target.value))}
                      className="w-full border rounded-lg px-2 py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400">LS1 Fil Write (0-5)</label>
                    <input
                      type="number"
                      value={fltLS1FilWriting}
                      onChange={(e) => setFltLS1FilWriting(Number(e.target.value))}
                      className="w-full border rounded-lg px-2 py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400">LS1 Eng MCQ (0-10)</label>
                    <input
                      type="number"
                      value={fltLS1EngMcq}
                      onChange={(e) => setFltLS1EngMcq(Number(e.target.value))}
                      className="w-full border rounded-lg px-2 py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400">LS1 Eng Write (0-5)</label>
                    <input
                      type="number"
                      value={fltLS1EngWriting}
                      onChange={(e) => setFltLS1EngWriting(Number(e.target.value))}
                      className="w-full border rounded-lg px-2 py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400">LS2 Science (0-10)</label>
                    <input
                      type="number"
                      value={fltLS2Science}
                      onChange={(e) => setFltLS2Science(Number(e.target.value))}
                      className="w-full border rounded-lg px-2 py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400">LS3 Math (0-15)</label>
                    <input
                      type="number"
                      value={fltLS3Math}
                      onChange={(e) => setFltLS3Math(Number(e.target.value))}
                      className="w-full border rounded-lg px-2 py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400">LS4 Career (0-10)</label>
                    <input
                      type="number"
                      value={fltLS4LifeCareer}
                      onChange={(e) => setFltLS4LifeCareer(Number(e.target.value))}
                      className="w-full border rounded-lg px-2 py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400">LS5 Society (0-10)</label>
                    <input
                      type="number"
                      value={fltLS5SelfSociety}
                      onChange={(e) => setFltLS5SelfSociety(Number(e.target.value))}
                      className="w-full border rounded-lg px-2 py-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400">LS6 Digital (0-10)</label>
                    <input
                      type="number"
                      value={fltLS6Digital}
                      onChange={(e) => setFltLS6Digital(Number(e.target.value))}
                      className="w-full border rounded-lg px-2 py-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-3">
                <label className="text-[9px] uppercase font-black text-slate-400">Recommendations</label>
                <input
                  type="text"
                  value={formRecommendations}
                  onChange={(e) => setFormRecommendations(e.target.value)}
                  className="w-full border rounded-lg px-3 py-1.5"
                />
              </div>

              <div className="p-4 border bg-slate-50 rounded-xl flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 text-white font-bold rounded-xl"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
