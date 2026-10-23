/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { safeSetJSON, safeSetItem } from '../utils/safeStorage';
import {
  FileText,
  Search,
  Plus,
  Edit,
  Trash,
  Printer,
  ChevronRight,
  TrendingUp,
  Award,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  X,
  BookOpen,
  Filter,
  BarChart4,
  Calendar,
  Check,
  Book,
  PenTool,
  Hash,
  HelpCircle,
  Sparkles,
  Brain,
  Save,
  Clock,
  RotateCcw
} from 'lucide-react';
import { LearnerRecord, LearningCenter } from '../types';

// Helper to convert Google Drive viewer links to direct displayable image links
function getGoogleDriveDirectLink(url: string): string {
  if (!url) return "";
  if (url.includes("lh3.googleusercontent.com")) return url;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

export interface AssessmentBasicLiteracy {
  id: string;
  learnerId: string;
  learnerName: string;
  dateAssessed: string;
  teacherName: string;
  communityLearningCenter: string;
  // Part 1: Reading Skills (0-25)
  readingLetterRecogn: number; // 0-10
  readingWordReading: number;   // 0-10
  readingComprehension: number; // 0-5
  // Part 2: Writing Skills (0-20)
  writingCopying: number;      // 0-5
  writingSpelling: number;     // 0-10
  writingSentence: number;     // 0-5
  // Part 3: Numeracy Skills (0-25)
  numeracyRecogn: number;      // 0-10
  numeracyArithmetic: number;  // 0-10
  numeracyPractical: number;   // 0-5
  // Recommendations and Diagnostics
  strengths: string;
  weaknesses: string;
  recommendations: string;
  teacherSignature: string;
  learnerSignature: string;
  // Extra detailed profile & time logs
  lastName?: string;
  firstName?: string;
  middleName?: string;
  sex?: string;
  age?: number | string;
  lastGradeCompleted?: string;
  timeStarted?: string;
  timeFinished?: string;
  ls1FilPc?: number;
  ls1FilWrite?: number;
  ls1FilRec?: string;
  subScoreFilipino?: number;
  ls1EngPc?: number;
  ls1EngWrite?: number;
  ls1EngRec?: string;
  subScoreEnglish?: number;
  ls3MathScore?: number;
  ls3MathRec?: string;
  overallScore?: number;
  overallRec?: string;
  category?: string;
}

interface AssessmentBasicLiteracyViewProps {
  learners: LearnerRecord[];
  learningCenters: LearningCenter[];
  mode?: 'assessment' | 'records';
  testType?: 'Pre-Test' | 'Post-Test';
}

// Preseed sample ABL assessment records matching default learners
const DEFAULT_ABL_ASSESSMENTS: AssessmentBasicLiteracy[] = [
  {
    id: 'abl-001',
    learnerId: '1',
    learnerName: 'Cardo D. Dalisay',
    dateAssessed: '2026-05-15',
    teacherName: 'Melody Anne B. Aquino',
    communityLearningCenter: 'San Miguel Community Learning Center',
    readingLetterRecogn: 10,
    readingWordReading: 9,
    readingComprehension: 4,
    writingCopying: 5,
    writingSpelling: 8,
    writingSentence: 4,
    numeracyRecogn: 10,
    numeracyArithmetic: 9,
    numeracyPractical: 5,
    strengths: 'Excellent letter and digit recall. Expresses thoughts confidently.',
    weaknesses: 'Needs minor guidance in complex silent letter spelling in English.',
    recommendations: 'Promote to ALS Elementary Curriculum Level - Advanced Level.',
    teacherSignature: 'M. Aquino',
    learnerSignature: 'C. Dalisay'
  },
  {
    id: 'abl-002',
    learnerId: '2',
    learnerName: 'Maria Clara L. Santos',
    dateAssessed: '2026-05-18',
    teacherName: 'Mervin C. Caldoza',
    communityLearningCenter: 'Balete Community Learning Center',
    readingLetterRecogn: 9,
    readingWordReading: 8,
    readingComprehension: 3,
    writingCopying: 4,
    writingSpelling: 7,
    writingSentence: 3,
    numeracyRecogn: 9,
    numeracyArithmetic: 8,
    numeracyPractical: 4,
    strengths: 'Good phonics decoding. Can perform single-digit arithmetic operations.',
    weaknesses: 'Struggles with word spacing and spelling multi-syllable terms.',
    recommendations: 'Conduct targeted remedial drills in basic word construction.',
    teacherSignature: 'M. Caldoza',
    learnerSignature: 'M.Santos'
  },
  {
    id: 'abl-003',
    learnerId: '3',
    learnerName: 'Juan Dela Cruz Jr.',
    dateAssessed: '2026-05-20',
    teacherName: 'Angelica G. Canlas',
    communityLearningCenter: 'Mapalacsiao Community Learning Center',
    readingLetterRecogn: 4,
    readingWordReading: 2,
    readingComprehension: 1,
    writingCopying: 2,
    writingSpelling: 1,
    writingSentence: 0,
    numeracyRecogn: 5,
    numeracyArithmetic: 2,
    numeracyPractical: 1,
    strengths: 'Highly determined. Can recognize capital letters & single digit numbers.',
    weaknesses: 'Unable to read simple full sentences. Struggles with writing coordination.',
    recommendations: 'Intensive Basic Literacy Program (Level 1) focus.',
    teacherSignature: 'A. Canlas',
    learnerSignature: 'J. Dela Cruz'
  },
  {
    id: 'abl-004',
    learnerId: '4',
    learnerName: 'Grace Poe S. Llamanzares',
    dateAssessed: '2026-05-22',
    teacherName: 'Joel D. Baquing',
    communityLearningCenter: 'Sitio Dam Community Learning Center',
    readingLetterRecogn: 10,
    readingWordReading: 10,
    readingComprehension: 5,
    writingCopying: 5,
    writingSpelling: 10,
    writingSentence: 5,
    numeracyRecogn: 10,
    numeracyArithmetic: 10,
    numeracyPractical: 5,
    strengths: 'Outstanding literacy and mathematical aptitude across all components.',
    weaknesses: 'None observed. Working speed is fast and precise.',
    recommendations: 'Recommend immediate formal promotion to Junior High School (JHS) level.',
    teacherSignature: 'J. Baquing',
    learnerSignature: 'G. Llamanzares'
  },
  {
    id: 'abl-005',
    learnerId: '5',
    learnerName: 'Vicente S. Sotto',
    dateAssessed: '2026-05-25',
    teacherName: 'Reynaldo M. Domingo Jr.',
    communityLearningCenter: 'San Miguel Community Learning Center',
    readingLetterRecogn: 7,
    readingWordReading: 6,
    readingComprehension: 2,
    writingCopying: 3,
    writingSpelling: 5,
    writingSentence: 2,
    numeracyRecogn: 8,
    numeracyArithmetic: 5,
    numeracyPractical: 3,
    strengths: 'Good verbal vocabulary. Understands context clues easily.',
    weaknesses: 'Incomplete mastery of basic subtraction carrying operations.',
    recommendations: 'Enroll in Neo-Literate support level with mathematics workbook focus.',
    teacherSignature: 'R. Domingo',
    learnerSignature: 'V. Sotto'
  }
];

const MOCK_ABL_QUESTIONS = [
  {
    id: "q-mock-1",
    no: "1",
    text: "Nais mong sabihin na naghanda si Aiko para sa pagsusulit. Alin ang angkop na salita para mabuo ang pangungusap?\n\nSi Aiko ay ________________nang mabuti kaya siya ay nakapasa.",
    imageUrl: "",
    choices: [
      { key: "A", text: "dahil" },
      { key: "B", text: "nag-aral" },
      { key: "C", text: "matalino" },
      { key: "D", text: "mag-aaral" }
    ],
    correctAnswer: "B"
  },
  {
    id: "q-mock-2",
    no: "2",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1oolgVgfFtgZtEbcV6N_rEhaFlQulBQJV/view?usp=drive_link",
    choices: [
      { key: "A", text: "Maglaro sa kalsada." },
      { key: "B", text: "Magsuot ng reflector." },
      { key: "C", text: "Tumingin muna sa kaliwa at kanan." },
      { key: "D", text: "Tumingin at tumawid kahit walang pedestrian lane." }
    ],
    correctAnswer: "C"
  },
  {
    id: "q-mock-3",
    no: "3",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1o3amcCL0_Kgtw28iX0g-iVz76YcR_QYn/view?usp=drive_link",
    choices: [
      { key: "A", text: "mainit" },
      { key: "B", text: "mabango" },
      { key: "C", text: "malamya" },
      { key: "D", text: "mahangin" }
    ],
    correctAnswer: "A"
  },
  {
    id: "q-mock-4",
    no: "4",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1tTxRQpSnGI9SX7L5iBZlZe0X_umpwFoK/view?usp=drive_link",
    choices: [
      { key: "A", text: "Sige, tulungan mo ako" },
      { key: "B", text: "Hindi na, kaya ko na ito." },
      { key: "C", text: "Huwag na, mapapagod at madudumihan ka lang." },
      { key: "D", text: "Sige, maraming salamat. Maaari mo na kaming tulungan." }
    ],
    correctAnswer: "D"
  },
  {
    id: "q-mock-5",
    no: "5",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1rDSISyJhfylX4sRzzDlF_MQI-EckomOs/view?usp=drive_link",
    choices: [
      { key: "A", text: "Gusto niyang magpahinga mula sa trabaho." },
      { key: "B", text: "Wala siyang ibang magawa kundi maghintay" },
      { key: "C", text: "Natatakot siyang mawalan ng mga pananim agad." },
      { key: "D", text: "Naniniwala siya na may paraan para malutas ang problema." }
    ],
    correctAnswer: "D"
  },
  {
    id: "q-mock-6",
    no: "6",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1L26qvjnT6rJxrP4N-uy3Ke2nNO5AG1u2/view?usp=drive_link",
    choices: [
      { key: "A", text: "Ang masipag na tao ay nakahahanap ng paraan." },
      { key: "B", text: "Kapag may tagtuyot, dapat itigil na ang pagtatanim." },
      { key: "C", text: "Huwag pansinin ang problema hanggang mawala ito." },
      { key: "D", text: "Laging kailangan ang tulong ng iba upang magtagumpay." }
    ],
    correctAnswer: "A"
  },
  {
    id: "q-mock-7",
    no: "7",
    text: "Suriin ang larawan sa ibaba. Isulat ang angkop na pangungusap o parirala tungkol dito:",
    imageUrl: "https://drive.google.com/file/d/1HJ2BVcSYFuabbeqUVIi6TGGP4nsxxuMD/view?usp=drive_link",
    choices: [],
    correctAnswer: "WRITTEN"
  },
  {
    id: "q-mock-8",
    no: "8",
    text: "Suriin ang larawan sa ibaba. Isulat ang angkop na pangungusap o parirala tungkol dito:",
    imageUrl: "https://drive.google.com/file/d/1kcp_h73UgjdsFsvv3liXtbGpomYC6m8s/view?usp=drive_link",
    choices: [],
    correctAnswer: "WRITTEN"
  },
  {
    id: "q-mock-9",
    no: "9",
    text: "The workers clean the street every day.\n\nWhat do the workers do?",
    imageUrl: "",
    choices: [
      { key: "A", text: "every day" },
      { key: "B", text: "the street" },
      { key: "C", text: "the workers" },
      { key: "D", text: "clean the street" }
    ],
    correctAnswer: "D"
  },
  {
    id: "q-mock-10",
    no: "10",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1IagqXYeyZ4NeUwmt5Yj7hqpODCW3PtIt/view?usp=drive_link",
    choices: [
      { key: "A", text: "Amlodipine, Cetirizine, Salbutamol" },
      { key: "B", text: "Cetirizine, Loperamide, Paracetamol" },
      { key: "C", text: "Probiotic, Paracetamol, Salbutamol" },
      { key: "D", text: "Paracetamol, Loperamide, Probiotic" }
    ],
    correctAnswer: "D"
  },
  {
    id: "q-mock-11",
    no: "11",
    text: "Almirah works as a saleslady in a clothing store. She sells cheap clothes.\n\nWhich word is an antonym for cheap?",
    imageUrl: "",
    choices: [
      { key: "A", text: "new" },
      { key: "B", text: "light" },
      { key: "C", text: "hard" },
      { key: "D", text: "expensive" }
    ],
    correctAnswer: "D"
  },
  {
    id: "q-mock-12",
    no: "12",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1IUfQNBHxZanB4AU603JaA_vrQMB9VBDc/view?usp=drive_link",
    choices: [
      { key: "A", text: "Hey, what's up?" },
      { key: "B", text: "Good morning!" },
      { key: "C", text: "Hello, good afternoon." },
      { key: "D", text: "Yo, how are you? How’s it going?" }
    ],
    correctAnswer: "B"
  },
  {
    id: "q-mock-13",
    no: "13",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1g32LF0phNJKre8w2_M8l2kMHS43PzTwR/view?usp=drive_link",
    choices: [
      { key: "A", text: "bag, new, woman" },
      { key: "B", text: "bought, woman, new" },
      { key: "C", text: "woman, bought, new" },
      { key: "D", text: "woman, new, bought" }
    ],
    correctAnswer: "C"
  },
  {
    id: "q-mock-14",
    no: "14",
    text: "Which of the following group of words makes up a complete sentence?",
    imageUrl: "",
    choices: [
      { key: "A", text: "In the park" },
      { key: "B", text: "Running fast" },
      { key: "C", text: "The cat is sleeping" },
      { key: "D", text: "Jumped over the fence" }
    ],
    correctAnswer: "C"
  },
  {
    id: "q-mock-15",
    no: "15",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1IXC3X8Nz8ZrTGGwGgn10sbBFJcxvTzgp/view?usp=drive_link",
    choices: [
      { key: "A", text: "Plants would grow faster." },
      { key: "B", text: "There would be more rain." },
      { key: "C", text: "The Earth would be very hot." },
      { key: "D", text: "The Earth would be very cold." }
    ],
    correctAnswer: "D"
  },
  {
    id: "q-mock-16",
    no: "16",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1yaQM-d4-bFi1IVnmos0x-7QmFlMh1xsV/view?usp=drive_link",
    choices: [
      { key: "A", text: "friend" },
      { key: "B", text: "friends" },
      { key: "C", text: "friendlier" },
      { key: "D", text: "friendship" }
    ],
    correctAnswer: "A"
  },
  {
    id: "q-mock-17",
    no: "17",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/14c92i5g4cvQz_E9YBFn2ac408cmi7kd7/view?usp=drive_link",
    choices: [
      { key: "A", text: "eating cookies" },
      { key: "B", text: "adding sprinkles" },
      { key: "C", text: "sitting by the lake" },
      { key: "D", text: "watching the ducks" }
    ],
    correctAnswer: "B"
  },
  {
    id: "q-mock-18",
    no: "18",
    text: "Choose the correct compound sentence.",
    imageUrl: "",
    choices: [
      { key: "A", text: "Karla is reading a book." },
      { key: "B", text: "Karla reads and writes every day." },
      { key: "C", text: "Karla and her sister are reading a book." },
      { key: "D", text: "Karla is reading a book, and her sister is watching TV." }
    ],
    correctAnswer: "D"
  },
  {
    id: "q-mock-19",
    no: "19",
    text: "Identify the word that does NOT show the correct pattern.",
    imageUrl: "",
    choices: [
      { key: "A", text: "dog – CVC" },
      { key: "B", text: "fork – CVCC" },
      { key: "C", text: "basin – CVVCC" },
      { key: "D", text: "glass – CCVCC" }
    ],
    correctAnswer: "C"
  },
  {
    id: "q-mock-20",
    no: "20",
    text: "Write a short paragraph with two to three sentences about a memorable experience with your family. (2 points)",
    imageUrl: "",
    choices: [],
    correctAnswer: "WRITTEN"
  },
  {
    id: "q-mock-21",
    no: "21",
    text: "Suriin ang larawan sa ibaba. Isulat ang angkop na pangungusap o parirala tungkol dito:",
    imageUrl: "https://drive.google.com/file/d/1tAyCIQlAaZ8cnBgN0bsTsg4_JifTDXyM/view?usp=drive_link",
    choices: [],
    correctAnswer: "WRITTEN"
  },
  {
    id: "q-mock-22",
    no: "22",
    text: "Which of the following correctly expresses the number 3,512 in words?",
    imageUrl: "",
    choices: [
      { key: "A", text: "Thirty-five thousand twelve" },
      { key: "B", text: "Three million five hundred twelve" },
      { key: "C", text: "Three thousand five hundred twelve" },
      { key: "D", text: "Thirty-five thousand one hundred two" }
    ],
    correctAnswer: "C"
  },
  {
    id: "q-mock-23",
    no: "23",
    text: "Which of the following shapes does the dotted line represent a line of symmetry?",
    imageUrl: "",
    choices: [
      { key: "A", text: "https://drive.google.com/file/d/1kIieK_JWKfcAlhqtzOtmjrQEz5s2pGWq/view?usp=sharing" },
      { key: "B", text: "https://drive.google.com/file/d/1SVWniRSr5qZS2SuodEsX_X-JjZwGzb9v/view?usp=drive_link" },
      { key: "C", text: "https://drive.google.com/file/d/1HnhQtrPPRidpSyt1NptuEDP_EcKusKX0/view?usp=drive_link" },
      { key: "D", text: "https://drive.google.com/file/d/1d3R6hCL97J4ukdXaZJeI4AhvcgS39neG/view?usp=drive_link" }
    ],
    correctAnswer: "A"
  },
  {
    id: "q-mock-24",
    no: "24",
    text: "Bagong Pag-asa Bakery sells pandesal at ₱5.00 per piece. Tonyo has ₱45.00. How many pieces of pandesal can he buy?",
    imageUrl: "",
    choices: [
      { key: "A", text: "6 pieces" },
      { key: "B", text: "7 pieces" },
      { key: "C", text: "8 pieces" },
      { key: "D", text: "9 pieces" }
    ],
    correctAnswer: "D"
  },
  {
    id: "q-mock-25",
    no: "25",
    text: "Mary Ann wanted to buy snacks for her 12 learners. She bought biscuits worth ₱10.00 per pack. How much will she spend in total?",
    imageUrl: "",
    choices: [
      { key: "A", text: "₱100.00" },
      { key: "B", text: "₱110.00" },
      { key: "C", text: "₱120.00" },
      { key: "D", text: "₱130.00" }
    ],
    correctAnswer: "C"
  },
  {
    id: "q-mock-26",
    no: "26",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1nGZsrj3gFpsw-R0AloyCIn2-Ghz_1d-r/view?usp=drive_link",
    choices: [
      { key: "A", text: "I, II, IV, III" },
      { key: "B", text: "II, IV, I, III" },
      { key: "C", text: "III, I, IV, II" },
      { key: "D", text: "IV, I, III, II" }
    ],
    correctAnswer: "B"
  },
  {
    id: "q-mock-27",
    no: "27",
    text: "Which of the following figures illustrates parallel lines?",
    imageUrl: "",
    choices: [
      { key: "A", text: "https://drive.google.com/file/d/12tYxUw1UPoa4R4g1drhkXd3la1Z9mSkr/view?usp=drive_link" },
      { key: "B", text: "https://drive.google.com/file/d/1EBXGrny5Qz2895aj1F4wHsdjJK7c6B0g/view?usp=drive_link" },
      { key: "C", text: "https://drive.google.com/file/d/1Ko5K48_xn_N3TVjRe-nkDboP0PlAuzEt/view?usp=drive_link" },
      { key: "D", text: "https://drive.google.com/file/d/11PlSCzUnIIynme0oJGST0yBFF6qwJB9F/view?usp=drive_link" }
    ],
    correctAnswer: "B"
  },
  {
    id: "q-mock-28",
    no: "28",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1DvX_00SXGixmrVgYhJekOS3vBykZUAUL/view?usp=drive_link",
    choices: [
      { key: "A", text: "Cruz, Manny" },
      { key: "B", text: "Go, Jenny" },
      { key: "C", text: "Ramos, Edwin" },
      { key: "D", text: "Vargas, Marie" }
    ],
    correctAnswer: "C"
  },
  {
    id: "q-mock-29",
    no: "29",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/15KDSejyq_hY-IzbBdy2PTdKtU4_-5Xfi/view?usp=drive_link",
    choices: [
      { key: "A", text: "Cruz, Manny" },
      { key: "B", text: "Go, Jenny" },
      { key: "C", text: "Ramos, Edwin" },
      { key: "D", text: "Vargas, Marie" }
    ],
    correctAnswer: "D"
  },
  {
    id: "q-mock-30",
    no: "30",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1a0on6g3iCfW_Aq8YconZU1_R30XgD1qi/view?usp=drive_link",
    choices: [
      { key: "A", text: "Vehicles A and B" },
      { key: "B", text: "Vehicles B and C" },
      { key: "C", text: "Vehicles B and D" },
      { key: "D", text: "Vehicles C and D" }
    ],
    correctAnswer: "D"
  },
  {
    id: "q-mock-31",
    no: "31",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1KL4eaCKZC-sx1a8Pj1eZUsetzrlKUgWQ/view?usp=drive_link",
    choices: [
      { key: "A", text: "6 hours" },
      { key: "B", text: "7 hours" },
      { key: "C", text: "8 hours" },
      { key: "D", text: "9 hours" }
    ],
    correctAnswer: "B"
  },
  {
    id: "q-mock-32",
    no: "32",
    text: "There are 141 youths and 150 adults enrolled learners in the ALS program at Makabayan Elementary School ALS Community Learning Center. If 166 of the learners are males, how many are females?",
    imageUrl: "",
    choices: [
      { key: "A", text: "307" },
      { key: "B", text: "291" },
      { key: "C", text: "175" },
      { key: "D", text: "125" }
    ],
    correctAnswer: "D"
  },
  {
    id: "q-mock-33",
    no: "33",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/14tDuNyHhQaIk_y_tJkbvj5KJdBAPOKlY/view?usp=drive_link",
    choices: [
      { key: "A", text: "50 sacks" },
      { key: "B", text: "60 sacks" },
      { key: "C", text: "70 sacks" },
      { key: "D", text: "80 sacks" }
    ],
    correctAnswer: "D"
  },
  {
    id: "q-mock-34",
    no: "34",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1GSQNZe3H8KGyCXkkFTXPABXi4L_rGO8i/view?usp=drive_link",
    choices: [
      { key: "A", text: "64 cm²" },
      { key: "B", text: "48 cm²" },
      { key: "C", text: "24 cm²" },
      { key: "D", text: "8 cm²" }
    ],
    correctAnswer: "A"
  },
  {
    id: "q-mock-35",
    no: "35",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1qa2FAOb0o0Wm6_OSq8E6tTe5OL-F8kdM/view?usp=drive_link",
    choices: [
      { key: "A", text: "64 cm" },
      { key: "B", text: "32 cm" },
      { key: "C", text: "16 cm" },
      { key: "D", text: "8 cm" }
    ],
    correctAnswer: "B"
  },
  {
    id: "q-mock-36",
    no: "36",
    text: "Suriin ang larawan sa ibaba at sagutin ang tanong:",
    imageUrl: "https://drive.google.com/file/d/1pCBk6jZWZiFFh681XElRSR2_fRDwTM7F/view?usp=drive_link",
    choices: [
      { key: "A", text: "3/4, 1/2, 1/4" },
      { key: "B", text: "1/2, 3/4, 1/4" },
      { key: "C", text: "1/4, 1/2, 3/4" },
      { key: "D", text: "1/2, 1/4, 3/4" }
    ],
    correctAnswer: "A"
  }
];

export function AssessmentBasicLiteracyView({ learners, learningCenters, mode = 'assessment', testType = 'Pre-Test' }: AssessmentBasicLiteracyViewProps) {
  const localStorageKey = testType === 'Post-Test' ? 'tcsd_abl_assessments_matrix_post' : 'tcsd_abl_assessments_matrix';

  // Database for ABL Assessments
  const [assessments, setAssessments] = useState<AssessmentBasicLiteracy[]>(() => {
    const saved = localStorage.getItem(localStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse ABL data, resetting to seed.", e);
      }
    }
    return DEFAULT_ABL_ASSESSMENTS;
  });

  const [burotRecords, setBurotRecords] = useState<any[]>([]);
  const [isBurotLoading, setIsBurotLoading] = useState<boolean>(true);
  const [burotError, setBurotError] = useState<string | null>(null);

  const fetchBurotRecords = async () => {
    setIsBurotLoading(true);
    setBurotError(null);
    try {
      const response = await fetch('/api/abl/burot-records');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setBurotRecords(data.records);
      } else {
        throw new Error(data.error || "Failed to load records from sheet");
      }
    } catch (err: any) {
      console.error("Error fetching Burot CLC records:", err);
      setBurotError(err.message || "Failed to load Google Sheet data.");
    } finally {
      setIsBurotLoading(false);
    }
  };

  useEffect(() => {
    fetchBurotRecords();
  }, []);

  // Sync state to local storage
  useEffect(() => {
    safeSetJSON(localStorageKey, assessments);
  }, [assessments, localStorageKey]);


  // Multiple Choice Online Assessment Tool State & Logic
  const [questions, setQuestions] = useState<any[]>(MOCK_ABL_QUESTIONS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const [mcSelectedOption, setMcSelectedOption] = useState<string | null>(null);
  const [mcSubmitted, setMcSubmitted] = useState<boolean>(false);
  const [mcQuestion7Answer, setMcQuestion7Answer] = useState<string>(() => {
    return localStorage.getItem('tcsd_abl_mc_q7_answer') || '';
  });

  useEffect(() => {
    safeSetItem('tcsd_abl_mc_q7_answer', mcQuestion7Answer);
  }, [mcQuestion7Answer]);

  const [mcQuestion8Answer, setMcQuestion8Answer] = useState<string>(() => {
    return localStorage.getItem('tcsd_abl_mc_q8_answer') || '';
  });

  useEffect(() => {
    safeSetItem('tcsd_abl_mc_q8_answer', mcQuestion8Answer);
  }, [mcQuestion8Answer]);

  const [mcQuestion20Answer, setMcQuestion20Answer] = useState<string>(() => {
    return localStorage.getItem('tcsd_abl_mc_q20_answer') || '';
  });

  useEffect(() => {
    safeSetItem('tcsd_abl_mc_q20_answer', mcQuestion20Answer);
  }, [mcQuestion20Answer]);

  const [mcQuestion21Answer, setMcQuestion21Answer] = useState<string>(() => {
    return localStorage.getItem('tcsd_abl_mc_q21_answer') || '';
  });

  useEffect(() => {
    safeSetItem('tcsd_abl_mc_q21_answer', mcQuestion21Answer);
  }, [mcQuestion21Answer]);

  const [mcAnswers, setMcAnswers] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('tcsd_abl_saved_mc_answers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse ABL mc answers", e);
      }
    }
    return {};
  });

  useEffect(() => {
    safeSetJSON('tcsd_abl_saved_mc_answers', mcAnswers);
  }, [mcAnswers]);

  const [mcSubmittedQuestions, setMcSubmittedQuestions] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('tcsd_abl_submitted_questions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse ABL mc submitted questions", e);
      }
    }
    return {};
  });

  useEffect(() => {
    safeSetJSON('tcsd_abl_submitted_questions', mcSubmittedQuestions);
  }, [mcSubmittedQuestions]);

  // Automated grading states
  const [isGradingLoading, setIsGradingLoading] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);
  const [gradingResult, setGradingResult] = useState<any | null>(null);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [mcStudentName, setMcStudentName] = useState<string>('');
  const [mcLastName, setMcLastName] = useState<string>('');
  const [mcFirstName, setMcFirstName] = useState<string>('');
  const [mcMiddleName, setMcMiddleName] = useState<string>('');
  const [mcCommunityLearningCenter, setMcCommunityLearningCenter] = useState<string>('');
  const [mcTeacher, setMcTeacher] = useState<string>('');
  const [mcSex, setMcSex] = useState<string>('');
  const [mcAge, setMcAge] = useState<string>('');
  const [mcLastGradeCompleted, setMcLastGradeCompleted] = useState<string>('');
  const [recordSearch, setRecordSearch] = useState<string>('');
  const [searchTeacher, setSearchTeacher] = useState<string>('');
  const [mcDate, setMcDate] = useState<string>('');
  const [mcTimeStarted, setMcTimeStarted] = useState<string>('');
  const [mcTimeFinished, setMcTimeFinished] = useState<string>('');
  const [mcCategory, setMcCategory] = useState<string>('Pre-Test');

  // Countdown Timer state: 3 Minutes per item = 180 seconds
  const [timeLeft, setTimeLeft] = useState<number>(180);

  // States for custom beautiful Reset / Start New Student dialog & Toast
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Synchronize active question state with stored answers safely on mount & navigation
  useEffect(() => {
    if (isLoadingQuestions) return;
    const qKey = `Q${currentQuestionIndex + 1}`;
    setMcSelectedOption(mcAnswers[qKey] || null);
    setMcSubmitted(!!mcSubmittedQuestions[qKey]);
  }, [currentQuestionIndex, mcAnswers, mcSubmittedQuestions, isLoadingQuestions]);

  // Keep a ref of all fields needed by the callback to prevent closing over stale values
  const timerCallbackRef = React.useRef<() => void>();

  useEffect(() => {
    timerCallbackRef.current = () => {
      const isWritten = isQuestion7 || isQuestion8 || isQuestion20 || isQuestion21;
      let hasAnswer = false;
      if (isQuestion7) {
        hasAnswer = !!mcQuestion7Answer.trim();
      } else if (isQuestion8) {
        hasAnswer = !!mcQuestion8Answer.trim();
      } else if (isQuestion20) {
        hasAnswer = !!mcQuestion20Answer.trim();
      } else if (isQuestion21) {
        hasAnswer = !!mcQuestion21Answer.trim();
      } else {
        hasAnswer = !!mcSelectedOption;
      }

      if (hasAnswer && !mcSubmitted) {
        handleMcSubmit();
      }

      alert(`Lumipas na ang 3 minuto para sa Tanong ${currentQuestionIndex + 1}.`);

      if (currentQuestionIndex < questions.length - 1) {
        handleNextQuestion();
      } else {
        alert("Tapos na ang oras para sa huling tanong. Maaari mo nang i-click ang 'GRADE / DRAFT RECORD' para makita ang resulta.");
      }
    };
  });

  // Reset the countdown timer when switching questions
  useEffect(() => {
    if (isLoadingQuestions || gradingResult) return;
    setTimeLeft(180);
  }, [currentQuestionIndex, isLoadingQuestions, gradingResult]);

  // Handle the active countdown interval
  useEffect(() => {
    if (isLoadingQuestions || gradingResult) return;
    // Pause the timer if the user has already submitted the answer to this item
    if (mcSubmitted) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (timerCallbackRef.current) {
            timerCallbackRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestionIndex, isLoadingQuestions, gradingResult, mcSubmitted]);

  const recordStats = useMemo(() => {
    let postLiterate = 0;
    let neoLiterate = 0;
    let nonLiterate = 0;
    let totalScore = 0;

    assessments.forEach(rec => {
      const score = (rec.readingLetterRecogn || 0) + (rec.readingWordReading || 0) + (rec.readingComprehension || 0) +
                    (rec.writingCopying || 0) + (rec.writingSpelling || 0) + (rec.writingSentence || 0) +
                    (rec.numeracyRecogn || 0) + (rec.numeracyArithmetic || 0) + (rec.numeracyPractical || 0);
      totalScore += score;
      if (score >= 50) {
        postLiterate++;
      } else if (score >= 21) {
        neoLiterate++;
      } else {
        nonLiterate++;
      }
    });

    const averageScore = assessments.length > 0 ? (totalScore / assessments.length).toFixed(1) : "0.0";

    return {
      postLiterate,
      neoLiterate,
      nonLiterate,
      averageScore
    };
  }, [assessments]);

  const filteredRecords = useMemo(() => {
    const dataSource = burotRecords.length > 0 ? burotRecords : assessments;
    return dataSource.filter(rec => {
      const s = recordSearch.trim().toLowerCase();
      
      const lastName = rec['LAST NAME'] || rec.lastName || '';
      const firstName = rec['FIRST NAME'] || rec.firstName || '';
      const middleName = rec['MIDDLE NAME'] || rec.middleName || '';
      const fullName = rec.learnerName || `${firstName} ${lastName}` || '';
      
      const clc = rec['COMMUNITY LEARNING CENTER'] || rec.communityLearningCenter || '';
      const teacher = rec['ALS TEACHER'] || rec.teacherName || '';

      const nameMatch = fullName.toLowerCase().includes(s);
      const clcMatch = clc.toLowerCase().includes(s);
      const teacherMatch = teacher.toLowerCase().includes(s);
      const matchesSearch = !s || nameMatch || clcMatch || teacherMatch;

      const matchesTeacherDropdown = !searchTeacher || teacher.toLowerCase() === searchTeacher.toLowerCase();

      return matchesSearch && matchesTeacherDropdown;
    });
  }, [assessments, burotRecords, recordSearch, searchTeacher]);

  useEffect(() => {
    const parts = [mcFirstName, mcMiddleName, mcLastName].filter(p => p.trim() !== '');
    setMcStudentName(parts.join(' '));
  }, [mcFirstName, mcMiddleName, mcLastName]);

  useEffect(() => {
    if (mcFirstName.trim() !== '') {
      const now = new Date();
      if (!mcDate) {
        setMcDate(now.toISOString().split('T')[0]);
      }
      if (!mcTimeStarted) {
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setMcTimeStarted(`${hours}:${minutes}`);
      }
    }
  }, [mcFirstName]);

  const [mcStats, setMcStats] = useState(() => {
    const saved = localStorage.getItem('tcsd_abl_mc_stats_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse ABL mc stats", e);
      }
    }
    return { correct: 0, total: 0 };
  });

  // Fetch Questions on Load
  useEffect(() => {
    setIsLoadingQuestions(true);
    fetch('/api/abl/questions')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP Error Status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setQuestionsError(null);
        } else {
          setQuestions(MOCK_ABL_QUESTIONS);
          setQuestionsError("Walang nakitang katanungan sa spreadsheet.");
        }
      })
      .catch(err => {
        console.error("Failed to fetch Google Sheet questions:", err);
        setQuestionsError("Hindi ma-load ang mga tanong mula sa Google Sheet. Gagamit muna ng built-in questions.");
        setQuestions(MOCK_ABL_QUESTIONS);
      })
      .finally(() => {
        setIsLoadingQuestions(false);
      });
  }, []);

  const mcQuestion = questions[currentQuestionIndex] || MOCK_ABL_QUESTIONS[0];
  const isQuestion7 = (currentQuestionIndex + 1) === 7 || mcQuestion?.no === "7" || mcQuestion?.no === 7 || String(mcQuestion?.no || '').trim() === '7';
  const isQuestion8 = (currentQuestionIndex + 1) === 8 || mcQuestion?.no === "8" || mcQuestion?.no === 8 || String(mcQuestion?.no || '').trim() === '8';
  const isQuestion9 = (currentQuestionIndex + 1) === 9 || mcQuestion?.no === "9" || mcQuestion?.no === 9 || String(mcQuestion?.no || '').trim() === '9';
  const isQuestion20 = (currentQuestionIndex + 1) === 20 || mcQuestion?.no === "20" || mcQuestion?.no === 20 || String(mcQuestion?.no || '').trim() === '20';
  const isQuestion21 = (currentQuestionIndex + 1) === 21 || mcQuestion?.no === "21" || mcQuestion?.no === 21 || String(mcQuestion?.no || '').trim() === '21';
  const isQuestion22 = (currentQuestionIndex + 1) === 22 || mcQuestion?.no === "22" || mcQuestion?.no === 22 || String(mcQuestion?.no || '').trim() === '22';
  const isQuestion36 = (currentQuestionIndex + 1) === 36 || mcQuestion?.no === "36" || mcQuestion?.no === 36 || String(mcQuestion?.no || '').trim() === '36';

  const getQuestionNo = (): number => {
    if (!mcQuestion) return currentQuestionIndex + 1;
    const numStr = String(mcQuestion.no || '').replace(/\D/g, '');
    const val = parseInt(numStr, 10);
    return isNaN(val) ? (currentQuestionIndex + 1) : val;
  };
  const qNum = getQuestionNo();
  const isEnglishSection = (qNum >= 9 && qNum <= 21) || (currentQuestionIndex + 1 >= 9 && currentQuestionIndex + 1 <= 21);
  const isLS3Section = qNum >= 22 || (currentQuestionIndex + 1) >= 22;

  const displayQuestionText = useMemo(() => {
    let text = mcQuestion?.text || "";
    
    // 1. Remove "BASAHIN AT UNAWAIN ANG KATANUNGAN" and its variations / punctuation / colons from all questions
    text = text.replace(/BASAHIN\s+AT\s+UNAWAIN\s+G?\s*(?:MABUTI)?\s+ANG\s+(?:MGA\s+)?(?:KATANUNGAN|TANONG)[\s\:\;\-\.\,«»"'\r\n]*/gi, '');
    
    // 2. Remove "Suriin ang larawan sa ibaba at sagutin ang tanong" and all its variations globally
    text = text.replace(/Suriin\s+ang\s+larawan\s+sa\s+ibaba(?:\s+at\s+sagutin\s+(?:ang|ang\s+mga|ang\s+sumusunod\s+na|an?[gd])\s+tanong)?[\s\:\;\-\.\,«»"'\r\n]*/gi, '');
    
    // Clean up any leftover leading colons, punctuation or blank characters globally
    text = text.replace(/^[\s\:\;\-\.\,«»"'\r\n]+/, '');
    
    return text.trim();
  }, [mcQuestion?.text, qNum, currentQuestionIndex]);

  const handleMcSubmit = () => {
    const isWritten = isQuestion7 || isQuestion8 || isQuestion20 || isQuestion21;
    let hasWrittenAnswer = false;
    if (isQuestion7) {
      hasWrittenAnswer = !!mcQuestion7Answer.trim();
    } else if (isQuestion8) {
      hasWrittenAnswer = !!mcQuestion8Answer.trim();
    } else if (isQuestion20) {
      hasWrittenAnswer = !!mcQuestion20Answer.trim();
    } else if (isQuestion21) {
      hasWrittenAnswer = !!mcQuestion21Answer.trim();
    }

    if (!mcSelectedOption && !(isWritten && hasWrittenAnswer)) return;
    if (mcSubmitted) return;

    const currentQKey = `Q${currentQuestionIndex + 1}`;
    
    // Save chosen MCQ option to persistent collection
    if (!isWritten && mcSelectedOption) {
      setMcAnswers(prev => ({
        ...prev,
        [currentQKey]: mcSelectedOption
      }));
    }

    // Set submitted status for this item
    setMcSubmittedQuestions(prev => ({
      ...prev,
      [currentQKey]: true
    }));

    const isCorrect = isWritten ? true : (mcSelectedOption === mcQuestion.correctAnswer);
    setMcSubmitted(true);
    setMcStats((prev: { correct: number; total: number }) => {
      const next = {
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        total: prev.total + 1
      };
      safeSetJSON('tcsd_abl_mc_stats_v3', next);
      return next;
    });

    const isLastQuestion = currentQuestionIndex === questions.length - 1 || mcQuestion?.no === "18" || (currentQuestionIndex + 1) === 18;
    if (isLastQuestion || !mcTimeFinished) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setMcTimeFinished(`${hours}:${minutes}`);
    }
  };

  const handleMcReset = () => {
    setMcSelectedOption(null);
    setMcSubmitted(false);
    const qKey = `Q${currentQuestionIndex + 1}`;
    setMcAnswers(prev => {
      const copy = { ...prev };
      delete copy[qKey];
      return copy;
    });
    setMcSubmittedQuestions(prev => {
      const copy = { ...prev };
      delete copy[qKey];
      return copy;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      const nextQKey = `Q${nextIdx + 1}`;
      setMcSelectedOption(mcAnswers[nextQKey] || null);
      setMcSubmitted(!!mcSubmittedQuestions[nextQKey]);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIdx);
      const prevQKey = `Q${prevIdx + 1}`;
      setMcSelectedOption(mcAnswers[prevQKey] || null);
      setMcSubmitted(!!mcSubmittedQuestions[prevQKey]);
    }
  };

  const handleRunGradingEngine = async () => {
    setIsGradingLoading(true);
    setGradingError(null);
    setGradingResult(null);

    const allAnswers = {
      ...mcAnswers,
      Q7: mcQuestion7Answer,
      Q8: mcQuestion8Answer,
      Q20: mcQuestion20Answer,
      Q21: mcQuestion21Answer
    };

    try {
      const response = await fetch('/api/abl/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lastName: mcLastName,
          firstName: mcFirstName,
          middleName: mcMiddleName,
          sex: mcSex,
          age: mcAge,
          clc: mcCommunityLearningCenter,
          date: mcDate,
          timeStarted: mcTimeStarted,
          timeFinished: mcTimeFinished,
          answers: allAnswers
        })
      });

      if (!response.ok) {
        throw new Error(`Grading server returned error code ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.result) {
        setGradingResult(data.result);
        setIsGradingModalOpen(true);
      } else {
        throw new Error(data.error || "Failed to formulate structured score metric outputs.");
      }
    } catch (err: any) {
      console.error("Grading failed:", err);
      setGradingError(err.message || 'Call Timeout');
      alert(`Grading failed: ${err.message || 'Server connection timed out'}`);
    } finally {
      setIsGradingLoading(false);
    }
  };

  const resetEntireTestSuite = () => {
    setCurrentQuestionIndex(0);
    setMcSelectedOption(null);
    setMcSubmitted(false);
    setTimeLeft(180);
    
    setMcQuestion7Answer('');
    setMcQuestion8Answer('');
    setMcQuestion20Answer('');
    setMcQuestion21Answer('');
    
    setMcAnswers({});
    setMcSubmittedQuestions({});
    setMcStats({ correct: 0, total: 0 });
    
    setMcStudentName('');
    setMcLastName('');
    setMcFirstName('');
    setMcMiddleName('');
    setMcCommunityLearningCenter('');
    setMcTeacher('');
    setMcSex('');
    setMcAge('');
    setMcLastGradeCompleted('');
    setMcDate('');
    setMcTimeStarted('');
    setMcTimeFinished('');
    setMcCategory('Pre-Test');
    setGradingResult(null);

    // Clear from localStorage
    localStorage.removeItem('tcsd_abl_saved_mc_answers');
    localStorage.removeItem('tcsd_abl_submitted_questions');
    localStorage.removeItem('tcsd_abl_mc_q7_answer');
    localStorage.removeItem('tcsd_abl_mc_q8_answer');
    localStorage.removeItem('tcsd_abl_mc_q20_answer');
    localStorage.removeItem('tcsd_abl_mc_q21_answer');
    localStorage.removeItem('tcsd_abl_mc_stats_v3');
  };

  const handleCloseGradingModal = () => {
    setIsGradingModalOpen(false);
    resetEntireTestSuite();
  };

  const handleSaveScoredRecord = () => {
    if (!gradingResult) return;

    // Try to find a matching learner if firstName/lastName is matched
    const matchedLearner = learners.find(l => {
      const dbLName = (l.lastName || "").trim().toLowerCase();
      const dbFName = (l.firstName || "").trim().toLowerCase();
      const stLName = (gradingResult.LAST_NAME || mcLastName || "").trim().toLowerCase();
      const stFName = (gradingResult.FIRST_NAME || mcFirstName || "").trim().toLowerCase();
      return dbLName === stLName && dbFName === stFName;
    });

    const lId = matchedLearner ? matchedLearner.id : (formLearnerId || `learner-${Date.now()}`);
    const lName = gradingResult.FIRST_NAME && gradingResult.LAST_NAME 
      ? `${gradingResult.FIRST_NAME} ${gradingResult.LAST_NAME}`
      : `${mcFirstName || "Unknown"} ${mcLastName || "Learner"}`;

    const nextNo = String((burotRecords.length || assessments.length) + 1);
    const scoreRecord: AssessmentBasicLiteracy = {
      id: `abl-graded-${Date.now()}`,
      learnerId: lId,
      learnerName: lName,
      dateAssessed: gradingResult.DATE || mcDate || new Date().toISOString().split('T')[0],
      teacherName: mcTeacher || "LogicHuB Automated Assessor",
      communityLearningCenter: gradingResult.COMMUNITY_LEARNING_CENTER || mcCommunityLearningCenter || "LogicHuB Center",
      
      readingLetterRecogn: Math.min(10, Math.round(((gradingResult.LS_1_FILIPINO_MULTIPLE_CHOICE || 0) / 6) * 10)),
      readingWordReading: Math.min(10, Math.round(((gradingResult.LS_1_ENGLISH_MULTIPLE_CHOICE || 0) / 11) * 10)),
      readingComprehension: Math.min(5, Math.round((((gradingResult.LS_1_FILIPINO_WRITING || 0) + (gradingResult.LS_1_ENGLISH_WRITING || 0)) / 12) * 5)),

      writingCopying: Math.min(5, Math.round(((gradingResult.LS_1_FILIPINO_WRITING || 0) / 6) * 5)),
      writingSpelling: Math.min(10, Math.round(((gradingResult.LS_1_ENGLISH_WRITING || 0) / 6) * 10)),
      writingSentence: Math.min(5, Math.round((((gradingResult.LS_1_FILIPINO_WRITING || 0) + (gradingResult.LS_1_ENGLISH_WRITING || 0)) / 12) * 5)),

      numeracyRecogn: Math.min(10, Math.round(((gradingResult.LS_3_MATHEMATICAL_AND_PROBLEM_SOLVING_SKILLS || 0) / 15) * 10)),
      numeracyArithmetic: Math.min(10, Math.round(((gradingResult.LS_3_MATHEMATICAL_AND_PROBLEM_SOLVING_SKILLS || 0) / 15) * 10)),
      numeracyPractical: Math.min(5, Math.round(((gradingResult.LS_3_MATHEMATICAL_AND_PROBLEM_SOLVING_SKILLS || 0) / 15) * 5)),

      strengths: `Demonstrates competence in multiple elements. Filipino score: ${gradingResult.SUB_SCORE_FILIPINO}/12. English score: ${gradingResult.SUB_SCORE_ENGLISH}/17. Mathematics score: ${gradingResult.LS_3_MATHEMATICAL_AND_PROBLEM_SOLVING_SKILLS}/15.`,
      weaknesses: `Targeted learning tracks defined for areas where full points were not met.`,
      recommendations: `Filipino Recommendation: ${gradingResult.LS1_FILIPINO_RECOMMENDATION || 'N/A'}\nEnglish Recommendation: ${gradingResult.LS1_ENGLISH_RECOMMENDATION || 'N/A'}\nMathematics Recommendation: ${gradingResult.LS3_RECOMMENDATION || 'N/A'}\nOverall Assignment: ${gradingResult.OVERALL_RECOMMENDATION || 'N/A'}`,
      
      teacherSignature: mcTeacher || 'Automated Assessor',
      learnerSignature: 'Electronically Verified',
      
      lastName: gradingResult.LAST_NAME || mcLastName,
      firstName: gradingResult.FIRST_NAME || mcFirstName,
      middleName: gradingResult.MIDDLE_NAME || mcMiddleName,
      category: mcCategory,
      sex: gradingResult.SEX || mcSex,
      age: gradingResult.AGE || mcAge,
      lastGradeCompleted: mcLastGradeCompleted,
      timeStarted: gradingResult.TIME_STARTED || mcTimeStarted,
      timeFinished: gradingResult.TIME_FINISHED || mcTimeFinished,
      ls1FilPc: gradingResult.LS_1_FILIPINO_MULTIPLE_CHOICE,
      ls1FilWrite: gradingResult.LS_1_FILIPINO_WRITING,
      ls1FilRec: gradingResult.LS1_FILIPINO_RECOMMENDATION,
      subScoreFilipino: gradingResult.SUB_SCORE_FILIPINO,
      ls1EngPc: gradingResult.LS_1_ENGLISH_MULTIPLE_CHOICE,
      ls1EngWrite: gradingResult.LS_1_ENGLISH_WRITING,
      ls1EngRec: gradingResult.LS1_ENGLISH_RECOMMENDATION,
      subScoreEnglish: gradingResult.SUB_SCORE_ENGLISH,
      ls3MathScore: gradingResult.LS_3_MATHEMATICAL_AND_PROBLEM_SOLVING_SKILLS,
      ls3MathRec: gradingResult.LS3_RECOMMENDATION,
      overallScore: gradingResult.OVERALL_SCORE,
      overallRec: gradingResult.OVERALL_RECOMMENDATION,

      // Format Sheet Keys
      'NO.': nextNo,
      'LAST NAME': gradingResult.LAST_NAME || mcLastName || '',
      'FIRST NAME': gradingResult.FIRST_NAME || mcFirstName || '',
      'MIDDLE NAME': gradingResult.MIDDLE_NAME || mcMiddleName || '',
      'BIRTHDATE': matchedLearner?.dateOfBirth || '—',
      'AGE': String(gradingResult.AGE || mcAge || ''),
      'CATEGORY': mcCategory || 'Pre-Test',
      'TIME STARTED': gradingResult.TIME_STARTED || mcTimeStarted || '',
      'Column 9': '—',
      'LS 1 - FILIPINO MULTIPLE CHOICE_SCORE': String(gradingResult.LS_1_FILIPINO_MULTIPLE_CHOICE || 0),
      'LS 1-FILIPINO WRITING_SCORE': String(gradingResult.LS_1_FILIPINO_WRITING || 0),
      'SUB SCORE_FILIPINO': String(gradingResult.SUB_SCORE_FILIPINO || 0),
      'RECOMMENDATION_FILIPINO': gradingResult.LS1_FILIPINO_RECOMMENDATION || 'N/A',
      'LS 2- ENGLISH MULTIPLE CHOICE _SCORE': String(gradingResult.LS_1_ENGLISH_MULTIPLE_CHOICE || 0),
      'LS 1-ENGLISH WRITING_SCORE': String(gradingResult.LS_1_ENGLISH_WRITING || 0),
      'SUB SCORE_ENGLISH': String(gradingResult.SUB_SCORE_ENGLISH || 0),
      'RECOMMENDATION_ENGLISH': gradingResult.LS1_ENGLISH_RECOMMENDATION || 'N/A',
      'LS 3-MATHEMATICAL AND PROBLEM SOLVING SKILLS SCORE': String(gradingResult.LS_3_MATHEMATICAL_AND_PROBLEM_SOLVING_SKILLS || 0),
      'RECOMMENDATION_MATHEMATICAL AND PROBLEM SOLVING SKILLS': gradingResult.LS3_RECOMMENDATION || 'N/A',
      'ALS TEACHER': mcTeacher || "LogicHuB Automated Assessor"
    } as any;

    setAssessments(prev => [scoreRecord, ...prev]);
    setBurotRecords(prev => [scoreRecord, ...prev]);

    // Send payload to backend to sync directly to Google Sheets
    fetch('/api/abl/burot-records/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scoreRecord),
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          console.log("[Google Sheets API] Successfully synchronized graded record to Google Sheets:", resData);
          if (resData.simulated) {
            setBurotError(resData.error);
          } else {
            fetchBurotRecords();
          }
        } else {
          setBurotError(resData.error);
        }
      })
      .catch(err => {
        console.error("Failed to sync graded record to Google Sheets:", err);
        setBurotError(err.message || "Network error syncing Google Sheet.");
      });

    setIsGradingModalOpen(false);
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
    }, 6000);
    resetEntireTestSuite();
  };

  // Intake Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Print Form View State
  const [printRecord, setPrintRecord] = useState<AssessmentBasicLiteracy | null>(null);

  // Form State
  const [formLearnerId, setFormLearnerId] = useState('');
  const [formDateAssessed, setFormDateAssessed] = useState(new Date().toISOString().split('T')[0]);
  const [formTeacherName, setFormTeacherName] = useState('');
  const [formClc, setFormClc] = useState('');

  // Part 1: Reading
  const [rLetter, setRLetter] = useState(0);
  const [rWord, setRWord] = useState(0);
  const [rComp, setRComp] = useState(0);

  // Part 2: Writing
  const [wCopy, setWCopy] = useState(0);
  const [wSpell, setWSpell] = useState(0);
  const [wSent, setWSent] = useState(0);

  // Part 3: Numeracy
  const [nRecogn, setNRecogn] = useState(0);
  const [nArith, setNArith] = useState(0);
  const [nPrac, setNPrac] = useState(0);

  // Recommendations and Diagnostics
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [teacherSignature, setTeacherSignature] = useState('');
  const [learnerSignature, setLearnerSignature] = useState('');

  // Auto-fill teacher and CLC when learner is selected in the form
  useEffect(() => {
    if (formLearnerId) {
      const selectedLearner = learners.find(l => l.id === formLearnerId);
      if (selectedLearner) {
        setFormClc(selectedLearner.communityLearningCenter || selectedLearner.clcName || '');
        setFormTeacherName(selectedLearner.teacher || '');
      }
    }
  }, [formLearnerId, learners]);

  // Helper to extract detailed learner names/profile info safely
  const getLearnerParts = (rec: AssessmentBasicLiteracy) => {
    // If the record itself has extra profile values set, use them
    if (rec.lastName || rec.firstName) {
      return {
        lastName: rec.lastName || '',
        firstName: rec.firstName || '',
        middleName: rec.middleName || '',
        sex: rec.sex || 'Male',
        age: rec.age || 'N/A'
      };
    }

    const learner = learners.find(l => l.id === rec.learnerId);
    if (learner) {
      return {
        lastName: learner.lastName || '',
        firstName: learner.firstName || '',
        middleName: learner.middleName || '',
        sex: learner.gender || 'Male',
        age: learner.age || 'N/A'
      };
    }

    const name = rec.learnerName || '';
    let lastName = '';
    let firstName = '';
    let middleName = '';
    let sex = 'Male';
    let age: number | string = 'N/A';

    // Hardcode matches for initial database seed to ensure absolute precision
    if (name.includes('Cardo D. Dalisay')) {
      lastName = 'Dalisay';
      firstName = 'Cardo';
      middleName = 'D.';
      sex = 'Male';
      age = 24;
    } else if (name.includes('Maria Clara L. Santos')) {
      lastName = 'Santos';
      firstName = 'Maria Clara';
      middleName = 'L.';
      sex = 'Female';
      age = 21;
    } else if (name.includes('Juan Dela Cruz Jr.')) {
      lastName = 'Cruz';
      firstName = 'Juan';
      middleName = 'Dela';
      sex = 'Male';
      age = 42;
    } else if (name.includes('Grace Poe S. Llamanzares')) {
      lastName = 'Llamanzares';
      firstName = 'Grace Poe';
      middleName = 'S.';
      sex = 'Female';
      age = 29;
    } else if (name.includes('Vicente S. Sotto')) {
      lastName = 'Sotto';
      firstName = 'Vicente';
      middleName = 'S.';
      sex = 'Male';
      age = 55;
    } else {
      // Basic splitting algorithm as secondary fallback
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
    }

    return { lastName, firstName, middleName, sex, age };
  };

  // Helper to extract exam timing start/finishes cleanly
  const getRecordTimes = (rec: AssessmentBasicLiteracy) => {
    if (rec.timeStarted && rec.timeFinished) {
      return {
        started: rec.timeStarted,
        finished: rec.timeFinished
      };
    }

    const name = rec.learnerName || '';
    let started = '08:00 AM';
    let finished = '09:30 AM';

    if (name.includes('Cardo D. Dalisay')) {
      started = '08:15 AM';
      finished = '09:45 AM';
    } else if (name.includes('Maria Clara L. Santos')) {
      started = '09:00 AM';
      finished = '10:30 AM';
    } else if (name.includes('Juan Dela Cruz Jr.')) {
      started = '01:30 PM';
      finished = '02:45 PM';
    } else if (name.includes('Grace Poe S. Llamanzares')) {
      started = '10:00 AM';
      finished = '11:15 AM';
    } else if (name.includes('Vicente S. Sotto')) {
      started = '03:00 PM';
      finished = '04:30 PM';
    }

    return { started, finished };
  };

  // Compute stats helper
  const calcScoreAndClass = (record: Partial<AssessmentBasicLiteracy>) => {
    const rTot = (record.readingLetterRecogn || 0) + (record.readingWordReading || 0) + (record.readingComprehension || 0);
    const wTot = (record.writingCopying || 0) + (record.writingSpelling || 0) + (record.writingSentence || 0);
    const nTot = (record.numeracyRecogn || 0) + (record.numeracyArithmetic || 0) + (record.numeracyPractical || 0);
    const grand = rTot + wTot + nTot;

    let classification: 'Non-Literate' | 'Neo-Literate' | 'Post-Literate' = 'Non-Literate';
    if (grand >= 50) {
      classification = 'Post-Literate';
    } else if (grand >= 21) {
      classification = 'Neo-Literate';
    }
    return { rTot, wTot, nTot, grand, classification };
  };


  // Open intake form for adding
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormLearnerId('');
    setFormDateAssessed(new Date().toISOString().split('T')[0]);
    setFormTeacherName('');
    setFormClc('');
    
    // reset scores
    setRLetter(0);
    setRWord(0);
    setRComp(0);

    setWCopy(0);
    setWSpell(0);
    setWSent(0);

    setNRecogn(0);
    setNArith(0);
    setNPrac(0);

    setStrengths('');
    setWeaknesses('');
    setRecommendations('');
    setTeacherSignature('');
    setLearnerSignature('');

    setIsModalOpen(true);
  };

  // Open intake form for editing
  const handleOpenEdit = (rec: AssessmentBasicLiteracy) => {
    setEditingId(rec.id);
    setFormLearnerId(rec.learnerId);
    setFormDateAssessed(rec.dateAssessed);
    setFormTeacherName(rec.teacherName);
    setFormClc(rec.communityLearningCenter);

    setRLetter(rec.readingLetterRecogn);
    setRWord(rec.readingWordReading);
    setRComp(rec.readingComprehension);

    setWCopy(rec.writingCopying);
    setWSpell(rec.writingSpelling);
    setWSent(rec.writingSentence);

    setNRecogn(rec.numeracyRecogn);
    setNArith(rec.numeracyArithmetic);
    setNPrac(rec.numeracyPractical);

    setStrengths(rec.strengths);
    setWeaknesses(rec.weaknesses);
    setRecommendations(rec.recommendations);
    setTeacherSignature(rec.teacherSignature);
    setLearnerSignature(rec.learnerSignature);

    setIsModalOpen(true);
  };

  // Delete handler
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove the basic literacy assessment record for ${name}?`)) {
      setAssessments(prev => prev.filter(a => a.id !== id));
      if (printRecord?.id === id) setPrintRecord(null);
    }
  };

  // Save/Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLearnerId) {
      alert("Please select a learner to assess.");
      return;
    }

    const matchedLearner = learners.find(l => l.id === formLearnerId);
    const learnerName = matchedLearner ? `${matchedLearner.firstName} ${matchedLearner.lastName}` : "Unknown Learner";

    const nextNo = String((burotRecords.length || assessments.length) + 1);
    const calculatedFilPc = Math.round((Number(rLetter) / 10) * 6);
    const calculatedFilWrite = Math.round(((Number(wCopy) + Number(wSent)) / 10) * 6);
    const calculatedFilSub = calculatedFilPc + calculatedFilWrite;
    const calculatedFilRec = calculatedFilSub >= 9 ? "Excellent - Ready for Advanced Functional Literacy Modules" : calculatedFilSub >= 5 ? "Satisfactory - Eligible for Regular ALS Modules" : "Needs Intensive Remediation";

    const calculatedEngPc = Math.round((Number(rWord) / 10) * 11);
    const calculatedEngWrite = Math.round((Number(wSpell) / 10) * 6);
    const calculatedEngSub = calculatedEngPc + calculatedEngWrite;
    const calculatedEngRec = calculatedEngSub >= 13 ? "Excellent - Ready for Advanced Functional Literacy Modules" : calculatedEngSub >= 7 ? "Satisfactory - Eligible for Regular ALS Modules" : "Needs Intensive Remediation";

    const calculatedMathScore = Math.round(((Number(nRecogn) + Number(nArith) + Number(nPrac)) / 25) * 15);
    const calculatedMathRec = calculatedMathScore >= 12 ? "Excellent - Ready for Advanced Analytical Skills" : calculatedMathScore >= 6 ? "Satisfactory - Capable of Basic Problem Solving" : "Needs Foundational Numeracy Interventions";

    const formattedTimeStarted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const data: AssessmentBasicLiteracy = {
      id: editingId || `abl-custom-${Date.now()}`,
      learnerId: formLearnerId,
      learnerName,
      dateAssessed: formDateAssessed,
      teacherName: formTeacherName || 'Unassigned Teacher',
      communityLearningCenter: formClc || 'Unspecified Center',
      
      readingLetterRecogn: Number(rLetter),
      readingWordReading: Number(rWord),
      readingComprehension: Number(rComp),

      writingCopying: Number(wCopy),
      writingSpelling: Number(wSpell),
      writingSentence: Number(wSent),

      numeracyRecogn: Number(nRecogn),
      numeracyArithmetic: Number(nArith),
      numeracyPractical: Number(nPrac),

      strengths,
      weaknesses,
      recommendations,
      teacherSignature,
      learnerSignature,

      // Format Sheet Keys
      'NO.': nextNo,
      'LAST NAME': matchedLearner?.lastName || '',
      'FIRST NAME': matchedLearner?.firstName || '',
      'MIDDLE NAME': matchedLearner?.middleName || '',
      'BIRTHDATE': matchedLearner?.dateOfBirth || '—',
      'AGE': String(matchedLearner?.age || ''),
      'CATEGORY': 'Pre-Test',
      'TIME STARTED': formattedTimeStarted,
      'Column 9': '—',
      'LS 1 - FILIPINO MULTIPLE CHOICE_SCORE': String(calculatedFilPc),
      'LS 1-FILIPINO WRITING_SCORE': String(calculatedFilWrite),
      'SUB SCORE_FILIPINO': String(calculatedFilSub),
      'RECOMMENDATION_FILIPINO': calculatedFilRec,
      'LS 2- ENGLISH MULTIPLE CHOICE _SCORE': String(calculatedEngPc),
      'LS 1-ENGLISH WRITING_SCORE': String(calculatedEngWrite),
      'SUB SCORE_ENGLISH': String(calculatedEngSub),
      'RECOMMENDATION_ENGLISH': calculatedEngRec,
      'LS 3-MATHEMATICAL AND PROBLEM SOLVING SKILLS SCORE': String(calculatedMathScore),
      'RECOMMENDATION_MATHEMATICAL AND PROBLEM SOLVING SKILLS': calculatedMathRec,
      'ALS TEACHER': formTeacherName || 'Unassigned Teacher'
    } as any;

    if (editingId) {
      setAssessments(prev => prev.map(a => a.id === editingId ? data : a));
      setBurotRecords(prev => prev.map(a => a.id === editingId || (a['LAST NAME'] === data['LAST NAME'] && a['FIRST NAME'] === data['FIRST NAME']) ? data : a));
    } else {
      setAssessments(prev => [data, ...prev]);
      setBurotRecords(prev => [data, ...prev]);
    }

    // Send payload to backend to sync directly to Google Sheets
    fetch('/api/abl/burot-records/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          console.log("[Google Sheets API] Successfully synchronized manual record to Google Sheets:", resData);
          if (resData.simulated) {
            setBurotError(resData.error);
          } else {
            fetchBurotRecords();
          }
        } else {
          setBurotError(resData.error);
        }
      })
      .catch(err => {
        console.error("Failed to sync manual record to Google Sheets:", err);
        setBurotError(err.message || "Network error syncing Google Sheet.");
      });

    setIsModalOpen(false);
  };

  // Trigger browser print of the active printable form card
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div id="assessment-basic-literacy-tab-container" className="space-y-6">
      
      {/* Printable Sheet Area (Hidden by default in desktop UI, visible only in @media print) */}
      {printRecord && (
        <div id="abl-print-sheet" className="hidden print:block fixed inset-0 bg-white z-50 p-8 font-sans text-slate-900 leading-normal">
          <div className="max-w-[8.5in] mx-auto border-2 border-slate-900 p-8 space-y-6 bg-white min-h-[11in] flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="text-center border-b-2 border-slate-800 pb-4 relative">
                <div className="absolute left-2 top-0 w-16 h-16 opacity-90">
                  <img src="https://lh3.googleusercontent.com/d/1cGaJXvEpivgZMUr9QTMO0rhB2MbJnPhz" alt="DEPED Logo" className="w-14 h-14 object-contain rounded-full" />
                </div>
                <p className="font-extrabold text-[12px] uppercase tracking-wide">Republic of the Philippines</p>
                <p className="font-black text-[14px] text-blue-900 uppercase">Department of Education</p>
                <p className="font-medium text-[11px] text-slate-600">SCHOOLS DIVISION OF TARLAC CITY</p>
                <p className="font-bold text-[12px] text-slate-700 tracking-widest mt-0.5">ALTERNATIVE LEARNING SYSTEM (ALS)</p>
                <h1 className="text-[18px] font-black tracking-tight text-slate-900 mt-3 border-t border-slate-300 pt-3">
                  ASSESSMENT OF BASIC LITERACY (ABL)
                </h1>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Individual Diagnostic &amp; Achievement Log Sheet</p>
              </div>

              {/* Profile Table Grid */}
              <div className="grid grid-cols-2 gap-4 mt-6 text-xs border border-slate-400 p-4 bg-slate-50/50 rounded-lg">
                <div>
                  <p className="leading-6"><span className="font-black text-slate-500 uppercase tracking-wider text-[9px]">Learner's Name:</span> <span className="font-extrabold text-[#002B6D] text-sm block">{printRecord.learnerName}</span></p>
                  <p className="leading-6 mt-1"><span className="font-black text-slate-500 uppercase tracking-wider text-[9px]">Community Learning Center:</span> <span className="font-bold block text-slate-800">{printRecord.communityLearningCenter}</span></p>
                </div>
                <div>
                  <p className="leading-6"><span className="font-black text-slate-500 uppercase tracking-wider text-[9px]">Date Evaluated:</span> <span className="font-bold block text-slate-800">{printRecord.dateAssessed}</span></p>
                  <p className="leading-6 mt-1"><span className="font-black text-slate-500 uppercase tracking-wider text-[9px]">Als Mobile Teacher:</span> <span className="font-bold block text-slate-800">{printRecord.teacherName}</span></p>
                  {printRecord.lastGradeCompleted && (
                    <p className="leading-6 mt-1"><span className="font-black text-slate-500 uppercase tracking-wider text-[9px]">Last Grade Completed:</span> <span className="font-bold block text-slate-800">{printRecord.lastGradeCompleted}</span></p>
                  )}
                </div>
              </div>

              {/* High-Fidelity Scoring Grid */}
              <div className="mt-6 border border-slate-400 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-extrabold text-[10px] tracking-wider uppercase">
                      <th className="p-2.5 pl-4 border-b border-slate-700">Assessment Components</th>
                      <th className="p-2.5 text-center border-b border-slate-700 w-24">Max Score</th>
                      <th className="p-2.5 text-center border-b border-slate-700 w-28">Obtained Score</th>
                      <th className="p-2.5 text-center border-b border-slate-700 w-36">Component Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {/* Part I */}
                    <tr className="bg-slate-50">
                      <td colSpan={4} className="p-2 font-black text-[#002B6D] text-[10px] pl-4 uppercase tracking-wider">PART I: READING SKILLS</td>
                    </tr>
                    <tr>
                      <td className="p-2 pl-6">1. Letter Recognition (Identify Letters of Alphabet)</td>
                      <td className="p-2 text-center font-mono">10</td>
                      <td className="p-2 text-center font-bold font-mono">{printRecord.readingLetterRecogn}</td>
                      <td rowSpan={3} className="p-2 text-center border-l border-slate-300 align-middle">
                        <span className="font-black font-mono text-[11px]">
                          {printRecord.readingLetterRecogn + printRecord.readingWordReading + printRecord.readingComprehension} / 25
                        </span>
                        <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5">
                          ({Math.round(((printRecord.readingLetterRecogn + printRecord.readingWordReading + printRecord.readingComprehension) / 25) * 100)}%)
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 pl-6">2. Word Pronunciation &amp; Basic Reading</td>
                      <td className="p-2 text-center font-mono">10</td>
                      <td className="p-2 text-center font-bold font-mono">{printRecord.readingWordReading}</td>
                    </tr>
                    <tr>
                      <td className="p-2 pl-6">3. Simple Comprehension (Read &amp; Explain)</td>
                      <td className="p-2 text-center font-mono">5</td>
                      <td className="p-2 text-center font-bold font-mono">{printRecord.readingComprehension}</td>
                    </tr>

                    {/* Part II */}
                    <tr className="bg-slate-50">
                      <td colSpan={4} className="p-2 font-black text-[#002B6D] text-[10px] pl-4 uppercase tracking-wider">PART II: WRITING SKILLS</td>
                    </tr>
                    <tr>
                      <td className="p-2 pl-6">1. Copying Letters and Simple Words</td>
                      <td className="p-2 text-center font-mono">5</td>
                      <td className="p-2 text-center font-bold font-mono">{printRecord.writingCopying}</td>
                      <td rowSpan={3} className="p-2 text-center border-l border-slate-300 align-middle">
                        <span className="font-black font-mono text-[11px]">
                          {printRecord.writingCopying + printRecord.writingSpelling + printRecord.writingSentence} / 20
                        </span>
                        <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5">
                          ({Math.round(((printRecord.writingCopying + printRecord.writingSpelling + printRecord.writingSentence) / 20) * 100)}%)
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 pl-6">2. Dictated Spelling Drill</td>
                      <td className="p-2 text-center font-mono">10</td>
                      <td className="p-2 text-center font-bold font-mono">{printRecord.writingSpelling}</td>
                    </tr>
                    <tr>
                      <td className="p-2 pl-6">3. Simple Phrase/Sentence Construction</td>
                      <td className="p-2 text-center font-mono">5</td>
                      <td className="p-2 text-center font-bold font-mono">{printRecord.writingSentence}</td>
                    </tr>

                    {/* Part III */}
                    <tr className="bg-slate-50">
                      <td colSpan={4} className="p-2 font-black text-[#002B6D] text-[10px] pl-4 uppercase tracking-wider">PART III: NUMERACY SKILLS</td>
                    </tr>
                    <tr>
                      <td className="p-2 pl-6">1. Number Identification (1 - 100)</td>
                      <td className="p-2 text-center font-mono">10</td>
                      <td className="p-2 text-center font-bold font-mono">{printRecord.numeracyRecogn}</td>
                      <td rowSpan={3} className="p-2 text-center border-l border-slate-300 align-middle">
                        <span className="font-black font-mono text-[11px]">
                          {printRecord.numeracyRecogn + printRecord.numeracyArithmetic + printRecord.numeracyPractical} / 25
                        </span>
                        <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5">
                          ({Math.round(((printRecord.numeracyRecogn + printRecord.numeracyArithmetic + printRecord.numeracyPractical) / 25) * 100)}%)
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 pl-6">2. Simple Arithmetic (Addition &amp; Subtraction)</td>
                      <td className="p-2 text-center font-mono">10</td>
                      <td className="p-2 text-center font-bold font-mono">{printRecord.numeracyArithmetic}</td>
                    </tr>
                    <tr>
                      <td className="p-2 pl-6">3. Practical Application (Counting Philippine Currency/Change)</td>
                      <td className="p-2 text-center font-mono">5</td>
                      <td className="p-2 text-center font-bold font-mono">{printRecord.numeracyPractical}</td>
                    </tr>

                    {/* Grand Total Row */}
                    <tr className="bg-slate-900 text-white font-extrabold">
                      <td className="p-3 pl-4 uppercase tracking-wide">GRAND TOTAL SCORE MATRIX</td>
                      <td className="p-3 text-center font-mono">70</td>
                      <td className="p-3 text-center font-bold font-mono text-amber-300 text-sm">{
                        (printRecord.readingLetterRecogn + printRecord.readingWordReading + printRecord.readingComprehension +
                         printRecord.writingCopying + printRecord.writingSpelling + printRecord.writingSentence +
                         printRecord.numeracyRecogn + printRecord.numeracyArithmetic + printRecord.numeracyPractical)
                      }</td>
                      <td className="p-3 text-center border-l border-slate-700 bg-slate-850">
                        <span className="text-[11px] uppercase block tracking-wider font-extrabold text-teal-300">
                          {calcScoreAndClass(printRecord).classification}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Assessment Guidelines Legend */}
              <div className="mt-4 p-2 text-[8.5px] border border-dashed border-slate-300 rounded grid grid-cols-3 gap-3 text-slate-500 font-medium">
                <div>
                  <span className="font-bold text-rose-700 block uppercase">Non-Literate Level (0 - 20)</span>
                  Lacks alphabetic recognition, unable to read basic terms or represent digits accurately.
                </div>
                <div>
                  <span className="font-bold text-amber-700 block uppercase">Neo-Literate Level (21 - 49)</span>
                  Phonemes visible. Basic spelling and number tracking. Struggles inside continuous contexts or problem solving.
                </div>
                <div>
                  <span className="font-bold text-emerald-700 block uppercase">Post-Literate Level (50 - 70)</span>
                  Mastered letters, basic sentences, spellings & operations. Eligible for higher module classifications.
                </div>
              </div>

              {/* Notes, Strong & Weak Areas */}
              <div className="grid grid-cols-2 gap-4 mt-6 text-xs">
                <div className="border border-slate-350 p-3 rounded-lg min-h-[90px]">
                  <p className="font-black text-slate-600 text-[9px] uppercase tracking-wider mb-1">Strong Mastery Areas:</p>
                  <p className="italic text-slate-800">{printRecord.strengths || 'None recorded.'}</p>
                </div>
                <div className="border border-slate-350 p-3 rounded-lg min-h-[90px]">
                  <p className="font-black text-slate-600 text-[9px] uppercase tracking-wider mb-1">Observed Learning Needs:</p>
                  <p className="italic text-slate-800">{printRecord.weaknesses || 'None recorded.'}</p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="mt-4 border border-slate-350 p-3 rounded-lg min-h-[60px] text-xs">
                <p className="font-black text-slate-600 text-[9px] uppercase tracking-wider mb-1">Action-Oriented Program Recommendation:</p>
                <p className="font-extrabold text-[#002B6D]">{printRecord.recommendations || 'Enroll in targeted basic literacy exercises.'}</p>
              </div>
            </div>

            {/* Bottom Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 mt-12 text-center text-xs border-t border-slate-200">
              <div className="space-y-6">
                <p className="font-medium underline font-mono text-slate-800">{printRecord.learnerSignature || 'No Signature File'}</p>
                <div>
                  <div className="w-48 mx-auto border-b border-slate-900" />
                  <p className="font-black text-[9px] uppercase tracking-wider text-slate-400 mt-1">Evaluated Learner Signature</p>
                </div>
              </div>
              <div className="space-y-6">
                <p className="font-medium underline font-mono text-slate-800">{printRecord.teacherSignature || 'No Signature File'}</p>
                <div>
                  <div className="w-48 mx-auto border-b border-slate-900" />
                  <p className="font-black text-[9px] uppercase tracking-wider text-slate-400 mt-1">Mobile Teacher Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Title Banner (HIDDEN ON PRINT) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white shrink-0 shadow-xs border border-slate-200 flex items-center justify-center">
            <img src="https://lh3.googleusercontent.com/d/1cGaJXvEpivgZMUr9QTMO0rhB2MbJnPhz" alt="DEPED Logo" className="w-10 h-10 object-contain rounded-full" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
              {mode === 'assessment' ? `Assessment for Basic Literacy (ABL): ${testType}` : `Learners’ Record on Basic Literacy Assessment (${testType})`}
            </h1>
            <p className="text-xs text-slate-500 font-medium font-semibold">
              {mode === 'assessment'
                ? `Standard baseline diagnostic records of basic reading, writing, and calculations (${testType}).`
                : `Individual baseline diagnostic achievement logs, scorecards and performance level trackers (${testType}).`}
            </p>
          </div>
        </div>


      </div>

      {showSaveSuccess && (
        <div id="save-success-toast" className="bg-emerald-600 text-white rounded-xl p-4 shadow-md text-xs font-bold leading-normal flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200 mt-4 mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-100 shrink-0" />
            <div>
              <p className="font-black text-white">Matagumpay na Naka-save sa Records! (Successfully recorded metric achievements!)</p>
              <p className="text-[10px] text-emerald-100 mt-0.5">Ang mga marka ng examinee ay naitala na sa records matrix listahan.</p>
            </div>
          </div>
          <button type="button" onClick={() => setShowSaveSuccess(false)} className="text-white hover:text-emerald-100 font-extrabold text-[10px] uppercase cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Learner Information top-level container */}
      {mode === 'assessment' && (
        <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-205 shadow-3xs print:hidden mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2 mb-4">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block font-montserrat">
              LEARNER INFORMATION
            </span>
            <div className="relative">
              {!showResetConfirm ? (
                <button
                  id="clear-cached-responses-btn"
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-4xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Start New Student Test (Clear Answers)
                </button>
              ) : (
                <div id="reset-confirm-box" className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-3xs animate-in fade-in duration-200 max-w-md">
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Sigurado ka ba? (Are you sure?)</p>
                    <p className="text-[9px] text-rose-650 font-semibold font-sans leading-relaxed">
                      Lilinisan nito ang lahat ng sagot, pangalan at timers para sa bagong examinee standardly.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <button
                      id="reset-cancel-btn"
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-650 border border-slate-200 rounded-md text-[9px] font-black uppercase transition cursor-pointer"
                    >
                      Bumalik
                    </button>
                    <button
                      id="reset-confirm-btn"
                      type="button"
                      onClick={() => {
                        resetEntireTestSuite();
                        setShowResetConfirm(false);
                        setShowResetSuccess(true);
                        setTimeout(() => setShowResetSuccess(false), 4000);
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[9px] font-black tracking-wider uppercase transition cursor-pointer shadow-4xs"
                    >
                      Oo, Linisin
                    </button>
                  </div>
                </div>
              )}

              {/* Success Toast / Notification popup */}
              {showResetSuccess && (
                <div id="reset-success-alert" className="absolute right-0 top-10 mt-1 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-md text-xs font-black flex items-center gap-2 border border-emerald-500 animate-in slide-in-from-top-2 duration-250">
                  <Check className="w-4 h-4 text-emerald-100 inline-block shrink-0" />
                  <span>Matagumpay na nalinisan ang lahat ng sagot! Ready na para sa bagong mag-aaral.</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* LAST NAME */}
            <div className="space-y-1">
              <label htmlFor="last-name-input" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="last-name-input"
                type="text"
                placeholder="E.g. dela Cruz"
                value={mcLastName}
                onChange={(e) => setMcLastName(e.target.value)}
                className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition font-sans"
              />
            </div>

            {/* FIRST NAME */}
            <div className="space-y-1">
              <label htmlFor="first-name-input" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="first-name-input"
                type="text"
                placeholder="E.g. Juan"
                value={mcFirstName}
                onChange={(e) => setMcFirstName(e.target.value)}
                className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition font-sans"
              />
            </div>

            {/* MIDDLE NAME */}
            <div className="space-y-1">
              <label htmlFor="middle-name-input" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                Middle Name
              </label>
              <input
                id="middle-name-input"
                type="text"
                placeholder="E.g. Santos"
                value={mcMiddleName}
                onChange={(e) => setMcMiddleName(e.target.value)}
                className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* SEX */}
            <div className="space-y-1">
              <label htmlFor="sex-input" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                Sex <span className="text-rose-500">*</span>
              </label>
              <select
                id="sex-input"
                value={mcSex}
                onChange={(e) => setMcSex(e.target.value)}
                className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition text-slate-755 hover:border-slate-350 cursor-pointer font-sans"
              >
                <option value="">-- Select Sex --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* AGE */}
            <div className="space-y-1">
              <label htmlFor="age-input" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                Age <span className="text-rose-500">*</span>
              </label>
              <input
                id="age-input"
                type="number"
                min="1"
                max="120"
                placeholder="E.g. 18"
                value={mcAge}
                onChange={(e) => setMcAge(e.target.value)}
                className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition text-slate-755 font-sans"
              />
            </div>

            {/* LAST GRADE LEVEL COMPLETED */}
            <div className="space-y-1">
              <label htmlFor="last-grade-input" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                Last Grade Level Completed <span className="text-rose-500">*</span>
              </label>
              <select
                id="last-grade-input"
                value={mcLastGradeCompleted}
                onChange={(e) => setMcLastGradeCompleted(e.target.value)}
                className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition text-slate-755 hover:border-slate-350 cursor-pointer font-sans"
              >
                <option value="">-- Select Grade --</option>
                <option value="Kinder">Kinder</option>
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* COMMUNITY LEARNING CENTER */}
            <div className="space-y-1">
              <label htmlFor="clc-input" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                Community Learning Center <span className="text-rose-500">*</span>
              </label>
              <input
                id="clc-input"
                type="text"
                placeholder="E.g. Tarlac City CLC"
                value={mcCommunityLearningCenter}
                onChange={(e) => setMcCommunityLearningCenter(e.target.value)}
                className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition font-sans"
              />
            </div>

            {/* TEACHER */}
            <div className="space-y-1">
              <label htmlFor="teacher-input" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                Teacher <span className="text-rose-500">*</span>
              </label>
              <input
                id="teacher-input"
                type="text"
                placeholder="E.g. Mrs. Maria Gomez"
                value={mcTeacher}
                onChange={(e) => setMcTeacher(e.target.value)}
                className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
            {/* CATEGORY */}
            <div className="space-y-1">
              <label htmlFor="mc-category" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="mc-category"
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
              <label htmlFor="mc-assessment-date" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="mc-assessment-date"
                type="date"
                value={mcDate}
                onChange={(e) => setMcDate(e.target.value)}
                className="w-full bg-white border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition text-slate-700 hover:border-slate-350 cursor-pointer font-sans"
              />
            </div>

            {/* TIME STARTED */}
            <div className="space-y-1">
              <label htmlFor="mc-time-started" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                Time Started <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="mc-time-started"
                  type="time"
                  value={mcTimeStarted}
                  onChange={(e) => setMcTimeStarted(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition text-slate-700 hover:border-slate-350 cursor-pointer font-sans"
                />
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    setMcTimeStarted(`${hours}:${minutes}`);
                  }}
                  className="absolute right-2 px-1.5 py-0.5 text-[8px] bg-slate-100 hover:bg-slate-200 text-[#002B6D] font-extrabold rounded-md cursor-pointer uppercase tracking-tight"
                  title="Set started time to now font-sans"
                >
                  Now
                </button>
              </div>
            </div>

            {/* TIME FINISHED */}
            <div className="space-y-1">
              <label htmlFor="mc-time-finished" className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                Time Finished
              </label>
              <div className="relative flex items-center">
                <input
                  id="mc-time-finished"
                  type="time"
                  value={mcTimeFinished}
                  onChange={(e) => setMcTimeFinished(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition text-slate-700 hover:border-slate-350 cursor-pointer font-sans"
                />
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    setMcTimeFinished(`${hours}:${minutes}`);
                  }}
                  className="absolute right-2 px-1.5 py-0.5 text-[8px] bg-slate-100 hover:bg-slate-200 text-[#002B6D] font-extrabold rounded-md cursor-pointer uppercase tracking-tight"
                  title="Set finished time to now font-sans"
                >
                  Now
                </button>
              </div>
            </div>
          </div>

          <p className="text-[8.5px] text-slate-400 font-semibold font-sans">
            * Ang iyong pangalan ay awtomatikong ilalagay sa sertipiko ng karangalan kapag nasagot mo ito nang tama.
          </p>
        </div>
      )}

      {mode === 'assessment' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-6 print:hidden">
          <div>
            <h3 className="text-sm font-black text-[#002B6D] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#002B6D]" />
              General Instructions
            </h3>
            <div className="space-y-3.5 pl-4 text-xs text-slate-650 leading-relaxed font-semibold">
              <p>1. Ang pagsusulit na ito ay binubuo ng tatlong pangunahing bahagi upang masukat ang iyong kasanayan sa:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-705">
                <li><strong className="text-slate-800">LS1 Communication Skills in Filipino (Pagbasa at Pagsulat)</strong> – Mga aytem 1 hanggang 8 para sa pagbabasa at pagsusulat sa wikang Filipino.</li>
                <li><strong className="text-slate-800">LS1 Communication Skills in English (Reading and Writing)</strong> – Mga aytem 9 hanggang 21 para sa pagbabasa at pagsusulat sa wikang Ingles.</li>
                <li><strong className="text-slate-800">LS3 Mathematical and Problem Solving Skills</strong> – Mga aytem 22 hanggang 36 para sa batayang pagkalkula, pagkilala sa hugis, simetri, at paglutas ng problema.</li>
              </ul>
              <p>2. Para sa mga aytem na <span className="text-[#002B6D] font-extrabold">Multiple Choice</span> (Pagbasa at Pagkalkula), piliin ang titik ng tamang sagot mula sa apat na pagpipilian sa screen.</p>
              <p>3. Para sa mga aytem na may <span className="text-[#002B6D] font-extrabold">Pagsulat / Writing</span> (Mga aytem 7, 8, 20, at 21), i-type nang maayos at malinaw ang iyong sagot o talata sa inilaang digital text box batay sa gabay na larawan o panuto.</p>
              <p>4. Mayroong inilaang takdang oras na <span className="text-rose-700 font-bold">tatlong (3) minuto</span> bawat aytem upang masubaybayan ang iyong tempo at bilis sa pagsagot.</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-black text-rose-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              Important Guidelines
            </h3>
            <ul className="space-y-3 pl-4 text-xs text-slate-650 leading-relaxed font-semibold list-none">
              <li className="flex items-start gap-2.5">
                <span className="text-[#002B6D] font-extrabold select-none">•</span>
                <span><span className="font-bold text-slate-800">Ensure Accuracy:</span> Make sure each answer is placed corresponding to the correct item number.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#002B6D] font-extrabold select-none">•</span>
                <span><span className="font-bold text-slate-800">One Answer Only:</span> Provide only one answer for each item.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#002B6D] font-extrabold select-none">•</span>
                <span><span className="font-bold text-slate-800">Changing Answers:</span> If you wish to change your answer, simply select the new option before proceeding.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#002B6D] font-extrabold select-none">•</span>
                <span><span className="font-bold text-slate-800">Do Not Write on Test Booklet:</span> This is a digital assessment; please do not attempt to write on any physical test booklets.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#002B6D] font-extrabold select-none">•</span>
                <span><span className="font-bold text-slate-800">Time Management:</span> Once you finish a section, proceed to the next until you complete the entire assessment. The total time allotted for this test is two (2) hours.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#002B6D] font-extrabold select-none">•</span>
                <span><span className="font-bold text-slate-800">Review:</span> If you finish early, go back and review your answers before submitting.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#002B6D] font-extrabold select-none">•</span>
                <span><span className="font-bold text-slate-800">Submission:</span> Once you have completed all sections and reviewed your work, click the Submit button and wait for further instructions.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {mode === 'assessment' && (
        <div id="start-of-assessment-pulse-banner" className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs animate-pulse print:hidden">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
            </span>
            <div>
              <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest font-sans">
                START OF ASSESSMENT
              </h4>
              <p className="text-[10px] text-emerald-700/90 font-bold font-sans mt-0.5">
                Ang pagsusulit ay opisyal nang nagsimula. Mangyaring sagutin ang bawat aytem sa ibaba.
              </p>
            </div>
          </div>
          <span className="text-[9px] bg-emerald-600 text-white font-black px-2.5 py-1 rounded-full uppercase tracking-wider font-sans shrink-0 hidden sm:inline-block">
            Assessment Active
          </span>
        </div>
      )}

      {mode === 'assessment' && (
        /* Multiple Choice Online Assessment Tool Section */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden print:hidden">
          <div className="p-6 space-y-6">
            {/* Loading / Error Banners for Sheet Questions */}
            {isLoadingQuestions ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-[#002B6D] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500 font-mono">Nilalapat ang mga tanong mula sa Google Sheet...</p>
              </div>
            ) : questionsError ? (
              <div className="p-3 bg-amber-50 border border-amber-205 rounded-xl text-amber-900 text-[11px] font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{questionsError}</span>
              </div>
            ) : null}

             {/* Learning Strand Instructions Header */}
            {!isLoadingQuestions && !(currentQuestionIndex >= 1 && currentQuestionIndex <= 5) && (
              <div className="bg-[#F4F8FD] border border-blue-100 rounded-xl p-5 space-y-2.5">
                <span className={`inline-block bg-[#002B6D]/10 text-[#002B6D] px-2.5 py-1 rounded-full font-black uppercase tracking-wider font-sans ${
                  (currentQuestionIndex === 0 || isQuestion7 || isQuestion8)
                    ? "text-[14pt]"
                    : "text-[10px]"
                }`}>
                  {isLS3Section
                    ? "LEARNING STRAND 3 - MATHEMATICAL AND PROBLEM-SOLVING SKILLS"
                    : (isEnglishSection 
                        ? "LEARNING STRAND 1 - COMMUNICATION SKILLS (ENGLISH)" 
                        : "LEARNING STRAND 1 - COMMUNICATION SKILLS (FILIPINO)")}
                </span>
                {!isLS3Section && (
                  <h4 className={`font-black text-slate-800 uppercase tracking-wider border-b border-blue-105/50 pb-1.5 font-sans ${
                    (currentQuestionIndex === 0 || isQuestion7 || isQuestion8)
                      ? "text-[14pt]"
                      : "text-xs"
                  }`}>
                    {isEnglishSection 
                      ? "PART I. READING" 
                      : ((isQuestion7 || isQuestion8) ? "Bahagi II. Pagsulat" : "Bahagi I. Pagbasa")}
                  </h4>
                )}
                <p className={`leading-relaxed font-semibold font-sans ${
                  (currentQuestionIndex === 0 || isQuestion7 || isQuestion8)
                    ? "text-[14pt] text-slate-800 font-normal"
                    : "text-xs text-slate-600"
                }`}>
                  {isLS3Section ? (
                    <>
                      <strong className="text-slate-800 font-bold">Directions:</strong> Read and understand each item carefully. Choose the letter of the correct answer.
                    </>
                  ) : isEnglishSection ? (
                    <>
                      <strong className="text-slate-800 font-bold">Directions:</strong> Read and understand each item carefully. Choose the letter of the correct answer and shade the corresponding circle on the answer sheet for LS 1 - Communication Skills (English).
                    </>
                  ) : (isQuestion7 || isQuestion8) ? (
                    <>
                      <strong className="text-[#002B6D] font-black">Panuto:</strong> Basahin at unawaing mabuti ang mga gawain sa bawat bilang.
                    </>
                  ) : (
                    <>
                      <strong className="text-[#002B6D] font-black">Panuto:</strong> Basahin at unawaing mabuti ang mga tanong sa bawat bilang. Piliin ang titik ng tamang sagot at itiman ito sa sagutang papel para sa LS 1 - Communication Skills (Filipino).
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Question Display Card */}
            {!isLoadingQuestions && (
              <div className="border border-slate-250/80 rounded-xl overflow-hidden shadow-2xs font-sans">
                <div className="bg-[#E3EDFA] px-4 py-2 border-b border-slate-200/80 flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`font-black text-[#002B6D] uppercase tracking-wider font-sans ${
                      currentQuestionIndex === 0
                        ? "text-[14pt]"
                        : "text-[10px]"
                    }`}>
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    
                    {/* Countdown Timer of 3 Minutes per Item */}
                    {!mcSubmitted ? (
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-mono transition duration-200 shadow-3xs ${
                        timeLeft <= 30
                          ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse font-black'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      } ${
                        currentQuestionIndex === 0
                          ? 'text-[14pt] font-sans'
                          : 'text-[10px] font-bold'
                      }`}>
                        <Clock className={`w-3.5 h-3.5 ${timeLeft <= 30 ? 'text-rose-500 animate-pulse' : 'text-amber-600'}`} />
                        <span>
                          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono shadow-3xs">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Tapos Na</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] bg-[#002B6D] text-white px-2 py-0.5 rounded-full font-extrabold uppercase">
                    {(() => {
                      const rawNo = mcQuestion.no || String(currentQuestionIndex + 1);
                      const cleanedNo = String(rawNo).replace(/^(no\s*\.\s*|no\s+|no\.?)/gi, '').trim();
                      const isNumeric = /^\d+$/.test(cleanedNo);
                      return isNumeric ? `No. ${cleanedNo}` : cleanedNo;
                    })()}
                  </span>
                </div>
                <div className="p-5 bg-white space-y-4">
                  {displayQuestionText && (
                    <p className={`leading-relaxed font-sans ${
                      currentQuestionIndex === 0
                        ? "text-[14pt] font-normal text-slate-800"
                        : "text-sm font-black text-slate-900"
                    }`}>
                      {displayQuestionText}
                    </p>
                  )}
                  {mcQuestion.imageUrl && (
                    <div className="w-full max-w-xl mx-auto border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs bg-slate-50/50 flex items-center justify-center p-3 relative hover:shadow-xs transition duration-200">
                      <img 
                        src={getGoogleDriveDirectLink(mcQuestion.imageUrl)} 
                        alt={`Question ${currentQuestionIndex + 1} Illustration`}
                        className="max-h-[320px] max-w-full w-full h-auto object-contain rounded-lg shadow-3xs"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Choices Options Grid */}
            {!isLoadingQuestions && !isQuestion7 && !isQuestion8 && !isQuestion20 && !isQuestion21 && (
              <div className="space-y-3">
                {mcQuestion.choices.map((choice: any) => {
                  if (!choice.text) return null;
                  const isSelected = mcSelectedOption === choice.key;

                  let btnStyles = "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-350";
                  if (isSelected) {
                    btnStyles = "border-[#002B6D] bg-[#E3EDFA] text-[#002B6D] ring-1 ring-[#002B6D] shadow-2xs";
                  }

                  return (
                    <button
                      id={`mc-option-${choice.key}`}
                      key={choice.key}
                      onClick={() => {
                        const optKey = choice.key;
                        setMcSelectedOption(optKey);
                        const questionNumberText = `Q${currentQuestionIndex + 1}`;
                        setMcAnswers(prev => ({
                          ...prev,
                          [questionNumberText]: optKey
                        }));
                        // Fluid answer correction: allow resubmitting
                        setMcSubmitted(false);
                        setMcSubmittedQuestions(prev => {
                          const copy = { ...prev };
                          delete copy[questionNumberText];
                          return copy;
                        });
                      }}
                      className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-150 relative cursor-pointer active:scale-[0.99] ${
                        currentQuestionIndex === 0
                          ? "text-[14pt] font-sans font-normal"
                          : "text-xs font-bold"
                      } ${btnStyles}`}
                    >
                      {/* Badge container */}
                      <div className={`rounded-full shrink-0 flex items-center justify-center font-mono font-black border transition-all ${
                        currentQuestionIndex === 0
                          ? 'w-7 h-7 text-[12px]'
                          : 'w-6 h-6 text-[11px]'
                      } ${
                        isSelected
                          ? 'bg-[#002B6D] border-[#002B6D] text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-650'
                      }`}>
                        {choice.key}
                      </div>

                      {/* text content */}
                      <div className="flex-1 pt-0.5 leading-relaxed">
                        {typeof choice.text === 'string' && (choice.text.trim().startsWith("http") || choice.text.includes("drive.google.com") || choice.text.includes("lh3.googleusercontent.com")) ? (
                          <div className="mt-1 max-w-[280px] border border-slate-200/60 rounded-xl overflow-hidden bg-slate-50/40 p-2 shadow-3xs flex items-center justify-center">
                            <img 
                              src={getGoogleDriveDirectLink(choice.text.trim())} 
                              alt={`Option ${choice.key}`}
                              className="max-h-[180px] w-auto max-w-full h-auto object-contain rounded-lg shadow-4xs"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          choice.text
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* End of Learning Strand 3 Indicator */}
            {!isLoadingQuestions && isQuestion36 && (
              <div className="mt-5 p-4 rounded-2xl bg-[#002B6D]/5 border-2 border-dashed border-[#002B6D]/20 text-center flex flex-col items-center justify-center gap-2 py-6" id="end-of-ls3-container">
                <Award className="w-7 h-7 text-[#002B6D]/80" />
                <span className="text-xs font-black uppercase tracking-widest text-[#002B6D] font-sans">
                  End of Learning Strand 3
                </span>
              </div>
            )}

            {/* Written Answer & Input Container for Question 7 only */}
            {!isLoadingQuestions && isQuestion7 && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-3xs mt-4" id="mc-q7-answer-input-container">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 text-[#002B6D] p-1.5 rounded-lg">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="text-[14pt] font-bold uppercase text-[#002B6D] tracking-wider font-sans">Isulat ang iyong Sagot (Write Your Answer)</h5>
                    <p className="text-[14pt] text-slate-500 font-normal font-sans mt-0.5">I-type sa kahon sa ibaba ang iyong buong sagot para sa gawaing ito.</p>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    id="mc-q7-written-input"
                    value={mcQuestion7Answer}
                    onChange={(e) => {
                      setMcQuestion7Answer(e.target.value);
                      // Clear submission flag so they can resubmit their corrected answer
                      setMcSubmitted(false);
                      setMcSubmittedQuestions(prev => {
                        const copy = { ...prev };
                        delete copy[`Q${currentQuestionIndex + 1}`];
                        return copy;
                      });
                    }}
                    rows={4}
                    placeholder="I-type rito ang iyong sagot / Type your answer here..."
                    className="w-full bg-white border border-slate-250/80 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002B6D] shadow-3xs transition text-slate-700 placeholder-slate-400"
                  />
                  {mcSubmitted && (
                    <div className="absolute top-3 right-3 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-[10px] font-black flex items-center gap-1.5 shadow-3xs">
                      <Check className="w-3.5 h-3.5" />
                      Naisumite na
                    </div>
                  )}
                </div>

                {mcSubmitted && (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-emerald-950">Napadala na ang Sagot</p>
                      <p className="text-[10px] text-emerald-800 leading-normal font-sans font-medium">Ang iyong nakasulat na sagot ay matagumpay na nai-save at susuriin ng iyong nakatalagang ALS Teacher para sa pinal na grado.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Written Answer & Input Container for Question 8 only */}
            {!isLoadingQuestions && isQuestion8 && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-3xs mt-4" id="mc-q8-answer-input-container">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 text-[#002B6D] p-1.5 rounded-lg">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="text-[14pt] font-bold uppercase text-[#002B6D] tracking-wider font-sans">Isulat ang iyong Sagot (Write Your Answer)</h5>
                    <p className="text-[14pt] text-slate-500 font-normal font-sans mt-0.5">I-type sa kahon sa ibaba ang iyong buong sagot para sa gawaing ito.</p>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    id="mc-q8-written-input"
                    value={mcQuestion8Answer}
                    onChange={(e) => {
                      setMcQuestion8Answer(e.target.value);
                      // Clear submission flag so they can resubmit their corrected answer
                      setMcSubmitted(false);
                      setMcSubmittedQuestions(prev => {
                        const copy = { ...prev };
                        delete copy[`Q${currentQuestionIndex + 1}`];
                        return copy;
                      });
                    }}
                    rows={4}
                    placeholder="I-type rito ang iyong sagot / Type your answer here..."
                    className="w-full bg-white border border-slate-250/80 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002B6D] shadow-3xs transition text-slate-700 placeholder-slate-400"
                  />
                  {mcSubmitted && (
                    <div className="absolute top-3 right-3 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-[10px] font-black flex items-center gap-1.5 shadow-3xs">
                      <Check className="w-3.5 h-3.5" />
                      Naisumite na
                    </div>
                  )}
                </div>

                {mcSubmitted && (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-emerald-950">Napadala na ang Sagot</p>
                      <p className="text-[10px] text-emerald-800 leading-normal font-sans font-medium">Ang iyong nakasulat na sagot ay matagumpay na nai-save at susuriin ng iyong nakatalagang ALS Teacher para sa pinal na grado.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Written Answer & Input Container for Question 20 only */}
            {!isLoadingQuestions && isQuestion20 && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-3xs mt-4" id="mc-q20-answer-input-container">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 text-[#002B6D] p-1.5 rounded-lg">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="text-[14pt] font-bold uppercase text-[#002B6D] tracking-wider font-sans">Isulat ang iyong Sagot (Write Your Answer)</h5>
                    <p className="text-[14pt] text-slate-500 font-normal font-sans mt-0.5">I-type sa kahon sa ibaba ang iyong buong sagot para sa gawaing ito.</p>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    id="mc-q20-written-input"
                    value={mcQuestion20Answer}
                    onChange={(e) => {
                      setMcQuestion20Answer(e.target.value);
                      // Clear submission flag so they can resubmit their corrected answer
                      setMcSubmitted(false);
                      setMcSubmittedQuestions(prev => {
                        const copy = { ...prev };
                        delete copy[`Q${currentQuestionIndex + 1}`];
                        return copy;
                      });
                    }}
                    rows={4}
                    placeholder="I-type rito ang iyong sagot / Type your answer here..."
                    className="w-full bg-white border border-slate-250/80 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002B6D] shadow-3xs transition text-slate-700 placeholder-slate-400"
                  />
                  {mcSubmitted && (
                    <div className="absolute top-3 right-3 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-[10px] font-black flex items-center gap-1.5 shadow-3xs">
                      <Check className="w-3.5 h-3.5" />
                      Naisumite na
                    </div>
                  )}
                </div>

                {mcSubmitted && (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-emerald-950">Napadala na ang Sagot</p>
                      <p className="text-[10px] text-emerald-800 leading-normal font-sans font-medium">Ang iyong nakasulat na sagot ay matagumpay na nai-save at susuriin ng iyong nakatalagang ALS Teacher para sa pinal na grado.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Written Answer & Input Container for Question 21 only */}
            {!isLoadingQuestions && isQuestion21 && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-3xs mt-4" id="mc-q21-answer-input-container">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 text-[#002B6D] p-1.5 rounded-lg">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="text-[14pt] font-bold uppercase text-[#002B6D] tracking-wider font-sans">Isulat ang iyong Sagot (Write Your Answer)</h5>
                    <p className="text-[14pt] text-slate-500 font-normal font-sans mt-0.5">I-type sa kahon sa ibaba ang iyong buong sagot para sa gawaing ito.</p>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    id="mc-q21-written-input"
                    value={mcQuestion21Answer}
                    onChange={(e) => {
                      setMcQuestion21Answer(e.target.value);
                      // Clear submission flag so they can resubmit their corrected answer
                      setMcSubmitted(false);
                      setMcSubmittedQuestions(prev => {
                        const copy = { ...prev };
                        delete copy[`Q${currentQuestionIndex + 1}`];
                        return copy;
                      });
                    }}
                    rows={4}
                    placeholder="I-type rito ang iyong sagot / Type your answer here..."
                    className="w-full bg-white border border-slate-250/80 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002B6D] shadow-3xs transition text-slate-700 placeholder-slate-400"
                  />
                  {mcSubmitted && (
                    <div className="absolute top-3 right-3 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-[10px] font-black flex items-center gap-1.5 shadow-3xs">
                      <Check className="w-3.5 h-3.5" />
                      Naisumite na
                    </div>
                  )}
                </div>

                {mcSubmitted && (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-emerald-950">Napadala na ang Sagot</p>
                      <p className="text-[10px] text-emerald-800 leading-normal font-sans font-medium">Ang iyong nakasulat na sagot ay matagumpay na nai-save at susuriin ng iyong nakatalagang ALS Teacher para sa pinal na grado.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation & Submission Controls Block */}
            {!isLoadingQuestions && (
              <div className="pt-4 border-t border-slate-100 space-y-4">
                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <button
                    id="mc-prev-btn"
                    type="button"
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="px-3 py-1.5 border border-slate-250 bg-white rounded-lg text-[11px] font-extrabold text-slate-650 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                  >
                    &larr; Prev
                  </button>

                  <span className="text-[10px] text-slate-500 font-extrabold font-mono tracking-wider">
                    TANONG {currentQuestionIndex + 1} NG {questions.length}
                  </span>

                  <button
                    id="mc-next-btn"
                    type="button"
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="px-3 py-1.5 border border-slate-250 bg-white rounded-lg text-[11px] font-extrabold text-slate-650 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                  >
                    Next &rarr;
                  </button>
                </div>

                {/* Submit & Result Buttons */}
                <div className="flex items-center justify-end gap-3 flex-wrap">
                  <button
                    id="mc-submit-btn"
                    type="button"
                    onClick={handleMcSubmit}
                    disabled={
                      ((isQuestion7 || isQuestion8 || isQuestion20 || isQuestion21)
                        ? (isQuestion7 
                            ? !mcQuestion7Answer.trim() 
                            : (isQuestion8 
                                ? !mcQuestion8Answer.trim() 
                                : (isQuestion20 
                                    ? !mcQuestion20Answer.trim() 
                                    : !mcQuestion21Answer.trim())))
                        : !mcSelectedOption
                      ) || mcSubmitted
                    }
                    className="bg-[#002B6D] text-white py-2.5 px-6 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#001f52] active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    SUBMIT
                  </button>

                  {(currentQuestionIndex + 1) === 36 && (
                    <button
                      id="mc-result-btn"
                      type="button"
                      onClick={handleRunGradingEngine}
                      disabled={isGradingLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-6 rounded-xl text-xs font-black uppercase tracking-wider active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 w-full sm:w-auto justify-center shadow-3xs"
                    >
                      {isGradingLoading ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                          GRADING...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          RESULT
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}



      {mode === 'records' && (
        <div className="space-y-6 print:hidden">
          {/* Search Table Section Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex-1 max-w-md relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search learner name, center, or teacher..."
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  className="w-full bg-white border border-slate-250/80 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition text-slate-700 placeholder-slate-400"
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
                  className="border border-slate-250/80 rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#002B6D] transition cursor-pointer"
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
                  onClick={fetchBurotRecords}
                  disabled={isBurotLoading}
                  className="px-3 py-1.5 border border-[#002B6D]/20 text-[#002B6D] hover:bg-[#002B6D]/5 bg-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-4xs"
                  title="Synchronize records from ABL Google Sheet"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isBurotLoading ? 'animate-spin' : ''}`} />
                  {isBurotLoading ? 'Syncing Sheet...' : 'Sync Google Sheet'}
                </button>

                {burotRecords.length > 0 && !isBurotLoading && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-2 py-1 rounded-lg">
                    Live Sheet Loaded ({burotRecords.length} records)
                  </span>
                )}

                {burotError && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-bold px-2 py-1 rounded-lg" title={burotError}>
                    Offline Cache Mode
                  </span>
                )}
              </div>
            </div>

            {/* Records list table */}
            <div className="overflow-x-auto">
              {filteredRecords.length > 0 ? (
                <table className="w-full text-left text-[11px] border-collapse min-w-[5000px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100 font-black text-slate-500 uppercase tracking-wider">
                      <th className="p-3 text-center border-r border-slate-200 w-16 shrink-0">NO.</th>
                      <th className="p-3 border-r border-slate-200 font-extrabold w-44">LAST NAME</th>
                      <th className="p-3 border-r border-slate-200 font-extrabold w-44">FIRST NAME</th>
                      <th className="p-3 border-r border-slate-200 font-extrabold w-44">MIDDLE NAME</th>
                      <th className="p-3 border-r border-slate-200 text-center w-36">BIRTHDATE</th>
                      <th className="p-3 border-r border-slate-200 text-center w-20">AGE</th>
                      <th className="p-3 border-r border-slate-200 text-center w-32 font-extrabold">CATEGORY</th>
                      <th className="p-3 border-r border-slate-200 text-center w-36">TIME STARTED</th>
                      <th className="p-3 border-r border-slate-200 text-center w-32 font-extrabold">Column 9</th>
                      <th className="p-3 border-r border-slate-200 text-center w-64 bg-blue-50/20 text-blue-900 font-black">LS 1 - FILIPINO MULTIPLE CHOICE_SCORE</th>
                      <th className="p-3 border-r border-slate-200 text-center w-48 bg-blue-50/20 text-blue-900 font-black">LS 1-FILIPINO WRITING_SCORE</th>
                      <th className="p-3 border-r border-slate-300 text-center w-40 bg-blue-100/50 text-blue-950 font-black">SUB SCORE_FILIPINO</th>
                      <th className="p-3 border-r border-slate-200 w-80 bg-blue-50/10 text-blue-900">RECOMMENDATION_FILIPINO</th>
                      <th className="p-3 border-r border-slate-200 text-center w-64 bg-indigo-50/20 text-indigo-900 font-black">LS 2- ENGLISH MULTIPLE CHOICE _SCORE</th>
                      <th className="p-3 border-r border-slate-200 text-center w-48 bg-indigo-50/20 text-indigo-900 font-black">LS 1-ENGLISH WRITING_SCORE</th>
                      <th className="p-3 border-r border-slate-300 text-center w-40 bg-indigo-100/50 text-indigo-950 font-black">SUB SCORE_ENGLISH</th>
                      <th className="p-3 border-r border-slate-200 w-80 bg-indigo-50/10 text-indigo-900">RECOMMENDATION_ENGLISH</th>
                      <th className="p-3 border-r border-slate-300 text-center w-64 bg-amber-50/30 text-amber-950 font-black">LS 3-MATHEMATICAL AND PROBLEM SOLVING SKILLS SCORE</th>
                      <th className="p-3 border-r border-slate-200 w-80 bg-amber-50/10 text-amber-900">RECOMMENDATION_MATHEMATICAL AND PROBLEM SOLVING SKILLS</th>
                      <th className="p-3 border-r border-slate-200 font-extrabold w-60">ALS TEACHER</th>
                      <th className="p-3 text-center w-28">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((rec, index) => {
                      const info = getLearnerParts(rec);
                      const times = getRecordTimes(rec);

                      // Detailed local score calculations for fallback cases
                      const defaultFilPc = rec.ls1FilPc !== undefined ? rec.ls1FilPc : Math.round(((rec.readingLetterRecogn || 0) / 10) * 6);
                      const defaultFilWrite = rec.ls1FilWrite !== undefined ? rec.ls1FilWrite : Math.round((((rec.writingCopying || 0) + (rec.writingSentence || 0)) / 10) * 6);
                      const defaultFilSub = rec.subScoreFilipino !== undefined ? rec.subScoreFilipino : (defaultFilPc + defaultFilWrite);
                      const defaultFilRec = rec.ls1FilRec || (
                        defaultFilSub >= 9 ? "Excellent - Ready for Advanced Functional Literacy Modules" :
                        defaultFilSub >= 5 ? "Satisfactory - Eligible for Regular ALS Modules" :
                        "Needs Intensive Remediation"
                      );

                      const defaultEngPc = rec.ls1EngPc !== undefined ? rec.ls1EngPc : Math.round(((rec.readingWordReading || 0) / 10) * 11);
                      const defaultEngWrite = rec.ls1EngWrite !== undefined ? rec.ls1EngWrite : Math.round(((rec.writingSpelling || 0) / 10) * 6);
                      const defaultEngSub = rec.subScoreEnglish !== undefined ? rec.subScoreEnglish : (defaultEngPc + defaultEngWrite);
                      const defaultEngRec = rec.ls1EngRec || (
                        defaultEngSub >= 13 ? "Excellent - Ready for Advanced Functional Literacy Modules" :
                        defaultEngSub >= 7 ? "Satisfactory - Eligible for Regular ALS Modules" :
                        "Needs Intensive Remediation"
                      );

                      const defaultMathScore = rec.ls3MathScore !== undefined ? rec.ls3MathScore : Math.round((((rec.numeracyRecogn || 0) + (rec.numeracyArithmetic || 0) + (rec.numeracyPractical || 0)) / 25) * 15);
                      const defaultMathRec = rec.ls3MathRec || (
                        defaultMathScore >= 12 ? "Excellent - Ready for Advanced Analytical Skills" :
                        defaultMathScore >= 6 ? "Satisfactory - Capable of Basic Problem Solving" :
                        "Needs Foundational Numeracy Interventions"
                      );

                      // Extract exact keys as defined in requested headers / Google Sheets columns
                      const valNo = rec['NO.'] !== undefined ? String(rec['NO.']) : String(index + 1);
                      const valLastName = rec['LAST NAME'] !== undefined ? String(rec['LAST NAME']) : (info.lastName || '-');
                      const valFirstName = rec['FIRST NAME'] !== undefined ? String(rec['FIRST NAME']) : (info.firstName || '-');
                      const valMiddleName = rec['MIDDLE NAME'] !== undefined ? String(rec['MIDDLE NAME']) : (info.middleName || '-');
                      const valBirthdate = rec['BIRTHDATE'] !== undefined ? String(rec['BIRTHDATE']) : (rec.birthdate || '—');
                      const valAge = rec['AGE'] !== undefined ? String(rec['AGE']) : String(info.age || '-');
                      const valCategory = rec['CATEGORY'] !== undefined ? String(rec['CATEGORY']) : (rec.category || 'Pre-Test');
                      const valTimeStarted = rec['TIME STARTED'] !== undefined ? String(rec['TIME STARTED']) : (rec.timeStarted || times.started || '-');
                      const valColumn9 = rec['Column 9'] !== undefined ? String(rec['Column 9']) : (rec.column9 || '—');

                      const valFilPc = rec['LS 1 - FILIPINO MULTIPLE CHOICE_SCORE'] !== undefined ? String(rec['LS 1 - FILIPINO MULTIPLE CHOICE_SCORE']) : String(defaultFilPc);
                      const valFilWrite = rec['LS 1-FILIPINO WRITING_SCORE'] !== undefined ? String(rec['LS 1-FILIPINO WRITING_SCORE']) : String(defaultFilWrite);
                      const valFilSub = rec['SUB SCORE_FILIPINO'] !== undefined ? String(rec['SUB SCORE_FILIPINO']) : String(defaultFilSub);
                      const valFilRec = rec['RECOMMENDATION_FILIPINO'] !== undefined ? String(rec['RECOMMENDATION_FILIPINO']) : defaultFilRec;

                      const valEngPc = rec['LS 2- ENGLISH MULTIPLE CHOICE _SCORE'] !== undefined ? String(rec['LS 2- ENGLISH MULTIPLE CHOICE _SCORE']) : String(defaultEngPc);
                      const valEngWrite = rec['LS 1-ENGLISH WRITING_SCORE'] !== undefined ? String(rec['LS 1-ENGLISH WRITING_SCORE']) : String(defaultEngWrite);
                      const valEngSub = rec['SUB SCORE_ENGLISH'] !== undefined ? String(rec['SUB SCORE_ENGLISH']) : String(defaultEngSub);
                      const valEngRec = rec['RECOMMENDATION_ENGLISH'] !== undefined ? String(rec['RECOMMENDATION_ENGLISH']) : defaultEngRec;

                      const valMathScore = rec['LS 3-MATHEMATICAL AND PROBLEM SOLVING SKILLS SCORE'] !== undefined ? String(rec['LS 3-MATHEMATICAL AND PROBLEM SOLVING SKILLS SCORE']) : String(defaultMathScore);
                      const valMathRec = rec['RECOMMENDATION_MATHEMATICAL AND PROBLEM SOLVING SKILLS'] !== undefined ? String(rec['RECOMMENDATION_MATHEMATICAL AND PROBLEM SOLVING SKILLS']) : defaultMathRec;

                      const valTeacher = rec['ALS TEACHER'] !== undefined ? String(rec['ALS TEACHER']) : (rec.teacherName || '-');

                      return (
                        <tr key={`${rec.id || 'rec'}-${index}`} className="hover:bg-slate-50/50 transition text-slate-700">
                          <td className="p-3 text-center border-r border-slate-100 font-mono font-bold text-slate-400">{valNo}</td>
                          <td className="p-3 border-r border-slate-100 font-extrabold text-[#002B6D]">{valLastName}</td>
                          <td className="p-3 border-r border-slate-100 font-bold text-slate-800">{valFirstName}</td>
                          <td className="p-3 border-r border-slate-100 text-slate-650">{valMiddleName}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono font-semibold text-slate-500">{valBirthdate}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono font-bold text-slate-650">{valAge}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-semibold text-slate-600">{valCategory}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-500">{valTimeStarted}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-500">{valColumn9}</td>
                          
                          <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-600 bg-blue-50/5">{valFilPc}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-600 bg-blue-50/5">{valFilWrite}</td>
                          <td className="p-3 border-r border-slate-200 text-center font-mono font-black text-blue-800 bg-blue-100/10">{valFilSub}</td>
                          <td className="p-3 border-r border-slate-100 font-semibold text-slate-700 text-[10px]" title={valFilRec}>
                            <span className="inline-block px-2.5 py-1 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-100">
                              {valFilRec}
                            </span>
                          </td>

                          <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-600 bg-indigo-50/5">{valEngPc}</td>
                          <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-600 bg-indigo-50/5">{valEngWrite}</td>
                          <td className="p-3 border-r border-slate-200 text-center font-mono font-black text-indigo-800 bg-indigo-100/10">{valEngSub}</td>
                          <td className="p-3 border-r border-slate-100 font-semibold text-slate-700 text-[10px]" title={valEngRec}>
                            <span className="inline-block px-2.5 py-1 rounded-full border text-indigo-700 bg-indigo-50 border-indigo-100">
                              {valEngRec}
                            </span>
                          </td>

                          <td className="p-3 border-r border-slate-200 text-center font-mono text-slate-600 font-bold bg-amber-50/5">{valMathScore}</td>
                          <td className="p-3 border-r border-slate-100 font-semibold text-slate-700 text-[10px]" title={valMathRec}>
                            <span className="inline-block px-2.5 py-1 rounded-full border text-amber-700 bg-amber-50 border-amber-100">
                              {valMathRec}
                            </span>
                          </td>

                          <td className="p-3 border-r border-slate-100 text-slate-650 font-bold">{valTeacher}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => { setPrintRecord(rec); triggerPrint(); }}
                                className="p-1 text-slate-400 hover:text-[#002B6D] hover:bg-slate-100 rounded-md transition shrink-0 cursor-pointer"
                                title="Print ABL Certificate & Log Sheet"
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
                  Walang nahanap na record para sa Basic Literacy Assessment.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Intake / Edit Dialog Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4.5 px-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#002B6D]" />
                  {editingId ? 'Edit ABL Assessment Scorecard' : 'Initiate Basic Literacy Assessment (ABL)'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">Standard 70-Point evaluation system covering spelling, digits, arithmetic, and word structures.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Profile Selection details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 block">Select Enrolled Learner</label>
                  {editingId ? (
                    <div className="px-3 py-2 bg-slate-100 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200">
                      {learners.find(l => l.id === formLearnerId)?.lastName ? `${learners.find(l => l.id === formLearnerId)?.firstName} ${learners.find(l => l.id === formLearnerId)?.lastName}` : 'Assigned Learner'}
                    </div>
                  ) : (
                    <select
                      value={formLearnerId}
                      onChange={(e) => setFormLearnerId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-250/80 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-[#002B6D]"
                    >
                      <option value="">-- Choose Candidate --</option>
                      {learners.map((l, index) => (
                        <option key={`${l.id || 'opt'}-${index}`} value={l.id}>
                          {l.firstName} {l.lastName} ({l.communityLearningCenter || 'CLC Outreach'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 block">CLC Learning Center</label>
                  <input
                    type="text"
                    disabled
                    value={formClc}
                    placeholder="Auto-filled CLC Name"
                    className="w-full px-3 py-2 border border-slate-250/70 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 block">ALS Mobile Teacher</label>
                  <input
                    type="text"
                    disabled
                    value={formTeacherName}
                    placeholder="Auto-filled Teacher Name"
                    className="w-full px-3 py-2 border border-slate-250/70 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                  />
                </div>
              </div>

              {/* Assessment Date block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 block">Assessment Drills Date</label>
                  <input
                    type="date"
                    required
                    value={formDateAssessed}
                    onChange={(e) => setFormDateAssessed(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-250/80 rounded-xl text-xs font-bold focus:outline-none focus:border-[#002B6D]"
                  />
                </div>
              </div>

              {/* Step Drills Section Panels split into grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                
                {/* Part 1: Reading Scores */}
                <div className="border border-slate-200 rounded-xl p-4.5 space-y-4 shadow-3xs bg-white">
                  <div className="border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Book className="w-4 h-4 text-indigo-700" />
                    <h4 className="text-[11px] font-black uppercase text-indigo-900 tracking-wider">Part 1: Reading Skills (0-25)</h4>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-500">Letter Recognition (0-10)</label>
                        <span className="font-extrabold font-mono text-xs text-indigo-800">{rLetter} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={rLetter}
                        onChange={(e) => setRLetter(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-500">Word Reading Drill (0-10)</label>
                        <span className="font-extrabold font-mono text-xs text-indigo-800">{rWord} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={rWord}
                        onChange={(e) => setRWord(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-500">Passage Comprehension (0-5)</label>
                        <span className="font-extrabold font-mono text-xs text-indigo-800">{rComp} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        value={rComp}
                        onChange={(e) => setRComp(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Part 2: Writing Scores */}
                <div className="border border-slate-200 rounded-xl p-4.5 space-y-4 shadow-3xs bg-white">
                  <div className="border-b border-slate-100 pb-2 flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-cyan-700" />
                    <h4 className="text-[11px] font-black uppercase text-cyan-900 tracking-wider">Part 2: Writing Skills (0-20)</h4>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-500">Copying Skills (0-5)</label>
                        <span className="font-extrabold font-mono text-xs text-cyan-800">{wCopy} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        value={wCopy}
                        onChange={(e) => setWCopy(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-500">Dictated Spelling Drill (0-10)</label>
                        <span className="font-extrabold font-mono text-xs text-cyan-800">{wSpell} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={wSpell}
                        onChange={(e) => setWSpell(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-500">Sentence Formulation (0-5)</label>
                        <span className="font-extrabold font-mono text-xs text-cyan-800">{wSent} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        value={wSent}
                        onChange={(e) => setWSent(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Part 3: Numeracy Scores */}
                <div className="border border-slate-200 rounded-xl p-4.5 space-y-4 shadow-3xs bg-white">
                  <div className="border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-teal-700" />
                    <h4 className="text-[11px] font-black uppercase text-teal-900 tracking-wider">Part 3: Numeracy Skills (0-25)</h4>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-500">Number recognition (0-10)</label>
                        <span className="font-extrabold font-mono text-xs text-teal-800">{nRecogn} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={nRecogn}
                        onChange={(e) => setNRecogn(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-500">Basic Arithmetic (0-10)</label>
                        <span className="font-extrabold font-mono text-xs text-teal-800">{nArith} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={nArith}
                        onChange={(e) => setNArith(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-500">Currency Application (0-5)</label>
                        <span className="font-extrabold font-mono text-xs text-teal-800">{nPrac} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        value={nPrac}
                        onChange={(e) => setNPrac(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Overall dynamic classification preview badge */}
              <div className="p-4 rounded-xl border border-dashed bg-slate-50 border-slate-300 flex flex-col sm:flex-row items-center sm:justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-[11px] font-black uppercase text-slate-505 tracking-wider">Estimated Grand Assessment Score</p>
                  <p className="text-2xl font-black text-[#002B6D] mt-0.5">{
                    Number(rLetter) + Number(rWord) + Number(rComp) +
                    Number(wCopy) + Number(wSpell) + Number(wSent) +
                    Number(nRecogn) + Number(nArith) + Number(nPrac)
                  } / 70</p>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-xs font-bold text-slate-550">Dynamic Classification:</p>
                  <div>
                    {(() => {
                      const score = Number(rLetter) + Number(rWord) + Number(rComp) +
                                    Number(wCopy) + Number(wSpell) + Number(wSent) +
                                    Number(nRecogn) + Number(nArith) + Number(nPrac);
                      if (score >= 50) {
                        return <span className="px-3.5 py-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-250/20 uppercase tracking-wider">Post-Literate Level</span>;
                      } else if (score >= 21) {
                        return <span className="px-3.5 py-1.5 text-xs font-extrabold text-amber-800 bg-amber-50 rounded-full border border-amber-250/20 uppercase tracking-wider">Neo-Literate Level</span>;
                      } else {
                        return <span className="px-3.5 py-1.5 text-xs font-extrabold text-rose-800 bg-rose-50 rounded-full border border-rose-250/20 uppercase tracking-wider">Non-Literate Level</span>;
                      }
                    })()}
                  </div>
                </div>
              </div>

              {/* Diagnostics & Diagnostic Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 block">Proven Mastery Strengths</label>
                  <textarea
                    rows={2}
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="e.g. Can fluently read simple words and write personal details."
                    className="w-full px-3.5 py-2 border border-slate-250/70 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D]"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 block">Observed Challenges / Learning Weaknesses</label>
                  <textarea
                    rows={2}
                    value={weaknesses}
                    onChange={(e) => setWeaknesses(e.target.value)}
                    placeholder="e.g. Struggles with division operations and double-digit math carrying."
                    className="w-full px-3.5 py-2 border border-slate-250/70 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D]"
                  />
                </div>
              </div>

              {/* Recommendations and sign and submit */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 block">Actionable Recommendation</label>
                  <input
                    type="text"
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="e.g. Assign basic math subtraction workbooks and flashcards for phoneme reading."
                    className="w-full px-3.5 py-2 border border-slate-250/70 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 block">Teacher Signature Registry/Name</label>
                    <input
                      type="text"
                      required
                      value={teacherSignature}
                      onChange={(e) => setTeacherSignature(e.target.value)}
                      placeholder="e.g. M. Aquino"
                      className="w-full px-3.5 py-2 border border-slate-250/70 rounded-xl text-xs font-bold focus:outline-none focus:border-[#002B6D]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 block">Learner Signature Registry/Name</label>
                    <input
                      type="text"
                      required
                      value={learnerSignature}
                      onChange={(e) => setLearnerSignature(e.target.value)}
                      placeholder="e.g. C. Dalisay"
                      className="w-full px-3.5 py-2 border border-slate-250/70 rounded-xl text-xs font-bold focus:outline-none focus:border-[#002B6D]"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#002B6D] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#001c4a] shadow-xs cursor-pointer"
                >
                  {editingId ? 'Update Record' : 'Record Assessment'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Automated AI Grading Results Report Modal */}
      {isGradingModalOpen && gradingResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in print:hidden">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            
            {/* Header branding */}
            <div className="bg-[#002B6D] text-white p-6 relative">
              <button 
                type="button" 
                onClick={handleCloseGradingModal}
                className="absolute top-4 right-4 text-white/50 hover:text-white p-1 hover:bg-white/10 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl text-[#002B6D] shadow-3xs">
                  <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#E3EDFA]">AUTOMATED GRADING REPORT</span>
                  <h3 className="text-base font-black tracking-tight mt-0.5">ABL Evaluation Scorecard</h3>
                </div>
              </div>
            </div>

            {/* Scorecard body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto font-sans leading-relaxed">
              
              {/* Student Profile Block */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs text-slate-700">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Learner Name</p>
                  <p className="font-extrabold text-slate-900">
                    {gradingResult.FIRST_NAME || mcFirstName} {gradingResult.LAST_NAME || mcLastName}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CLC / Center</p>
                  <p className="font-extrabold text-slate-900">{gradingResult.COMMUNITY_LEARNING_CENTER || mcCommunityLearningCenter || "N/A"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sex / Age</p>
                  <p className="font-extrabold text-slate-900">{gradingResult.SEX || mcSex || "N/A"} / {gradingResult.AGE || mcAge || "N/A"} y/o</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Assessed</p>
                  <p className="font-extrabold text-slate-900">{gradingResult.DATE || mcDate || new Date().toISOString().split('T')[0]}</p>
                </div>
                <div className="space-y-0.5 col-span-2 sm:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Logs (Start &rarr; Finish)</p>
                  <p className="font-extrabold text-slate-900">{gradingResult.TIME_STARTED || mcTimeStarted || "N/A"} &rarr; {gradingResult.TIME_FINISHED || mcTimeFinished || "N/A"}</p>
                </div>
              </div>

              {/* Score Breakdown Elements */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-100 pb-1.5">Learning Strand Scorecard</h4>
                
                {/* Filipino (LS1) */}
                <div className="border border-slate-150 rounded-2xl p-4 hover:shadow-2xs transition bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <p className="text-xs font-black text-slate-900 uppercase">LS1 Communication Skills: Filipino</p>
                    </div>
                    <span className="font-mono text-xs font-black text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-105">
                      {gradingResult.SUB_SCORE_FILIPINO} / 12
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
                    <div className="bg-slate-50 p-2 rounded-xl text-center">
                      <p className="text-[9px] uppercase text-slate-400 tracking-wider">Multiple Choice</p>
                      <p className="text-sm font-extrabold text-slate-800">{gradingResult.LS_1_FILIPINO_MULTIPLE_CHOICE} / 6</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl text-center">
                      <p className="text-[9px] uppercase text-slate-400 tracking-wider">Writing Rubric</p>
                      <p className="text-sm font-extrabold text-slate-800">{gradingResult.LS_1_FILIPINO_WRITING} / 6</p>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Recommendation</span>
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-normal">
                      <span className={`w-2 h-2 rounded-full ${
                        (gradingResult.SUB_SCORE_FILIPINO >= 9) ? 'bg-emerald-500' : (gradingResult.SUB_SCORE_FILIPINO >= 5) ? 'bg-amber-500' : 'bg-rose-500'
                      }`}></span>
                      {gradingResult.LS1_FILIPINO_RECOMMENDATION}
                    </p>
                  </div>
                </div>

                {/* English (LS1) */}
                <div className="border border-slate-150 rounded-2xl p-4 hover:shadow-2xs transition bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                      <p className="text-xs font-black text-slate-900 uppercase">LS1 Communication Skills: English</p>
                    </div>
                    <span className="font-mono text-xs font-black text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-150">
                      {gradingResult.SUB_SCORE_ENGLISH} / 17
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
                    <div className="bg-slate-50 p-2 rounded-xl text-center">
                      <p className="text-[9px] uppercase text-slate-400 tracking-wider">Multiple Choice</p>
                      <p className="text-sm font-extrabold text-slate-800">{gradingResult.LS_1_ENGLISH_MULTIPLE_CHOICE} / 11</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl text-center">
                      <p className="text-[9px] uppercase text-slate-400 tracking-wider">Writing Rubric</p>
                      <p className="text-sm font-extrabold text-slate-800">{gradingResult.LS_1_ENGLISH_WRITING} / 6</p>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Recommendation</span>
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-normal">
                      <span className={`w-2 h-2 rounded-full ${
                        (gradingResult.SUB_SCORE_ENGLISH >= 13) ? 'bg-emerald-500' : (gradingResult.SUB_SCORE_ENGLISH >= 7) ? 'bg-amber-500' : 'bg-rose-500'
                      }`}></span>
                      {gradingResult.LS1_ENGLISH_RECOMMENDATION}
                    </p>
                  </div>
                </div>

                {/* Math (LS3) */}
                <div className="border border-slate-150 rounded-2xl p-4 hover:shadow-2xs transition bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                      <p className="text-xs font-black text-slate-900 uppercase">LS3 Mathematical & Solving Skills</p>
                    </div>
                    <span className="font-mono text-xs font-black text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-150">
                      {gradingResult.LS_3_MATHEMATICAL_AND_PROBLEM_SOLVING_SKILLS} / 15
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Recommendation</span>
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-normal">
                      <span className={`w-2 h-2 rounded-full ${
                        (gradingResult.LS_3_MATHEMATICAL_AND_PROBLEM_SOLVING_SKILLS >= 12) ? 'bg-emerald-500' : (gradingResult.LS_3_MATHEMATICAL_AND_PROBLEM_SOLVING_SKILLS >= 6) ? 'bg-amber-500' : 'bg-rose-500'
                      }`}></span>
                      {gradingResult.LS3_RECOMMENDATION}
                    </p>
                  </div>
                </div>
              </div>

              {/* Overall scorecard statistics card summary status */}
              <div className="bg-[#E3EDFA]/40 border border-[#002B6D]/15 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase font-black text-[#002B6D]/70 tracking-widest">OVERALL METRICS & CLASS</p>
                  <p className="text-3xl font-black font-mono text-[#002B6D] mt-0.5">{gradingResult.OVERALL_SCORE} <span className="text-sm font-bold text-slate-400">/ 44</span></p>
                </div>
                <div className="flex-grow">
                  <span className="text-[9px] uppercase font-black text-slate-400 block tracking-widest">Strategic Recommendation</span>
                  <p className="text-xs font-extrabold text-slate-900 leading-normal mt-0.5">{gradingResult.OVERALL_RECOMMENDATION}</p>
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer transition shadow-3xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseGradingModal}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveScoredRecord}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:shadow-xs cursor-pointer transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save to Records
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
