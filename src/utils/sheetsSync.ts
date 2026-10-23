/**
 * Utility functions for syncing Learner records with Google Sheets "Enrolment" tab.
 */

import { LearnerRecord } from '../types';

export const SHEET_ENROLMENT_ID = '1PeADwiI7RtOKmcthX7EM9vmMnn5hVMrgw1Ng_bfyBmA';
export const SHEET_TAB_NAME = 'BUROT CLC';

export const SHEET_COLUMNS = [
  'NO.',
  'COMMUNITY LEARNING CENTER',
  'COMMUNITY LEARNING CENTER CODE',
  'DISTRICT',
  'TEACHER',
  'DATE OF FIRST ATTENDANCE',
  'TYPE OF PROGRAM',
  'ACTUAL MODALITY',
  'LEARNER REFERENCE NUMBER',
  'NAME',
  'LAST NAME',
  'FIRST NAME',
  'MIDDLE NAME',
  'EXTENSION NAME',
  'CONTACT NUMBER',
  'BIRTHDATE',
  'AGE',
  'SEX',
  'PLACE OF BIRTH',
  'RELIGION',
  'IP',
  'MOTHER TONGUE',
  "4P's BENEFICIARY",
  '4PS HOUSEHOLD ID',
  'CIVIL STATUS',
  'HOUSE NO.',
  'SITIO/STREET NAME',
  'BARANGAY',
  'MUNICIPALITY/CITY',
  'PROVINCE',
  'COUNTRY',
  'ZIP CODE',
  'LAST NAME (FATHER)',
  'FIRST NAME (FATHER)',
  'MIDDLE NAME (FATHER)',
  'OCCUPATION (FATHER)',
  'LAST NAME (MOTHER)',
  'FIRST NAME (MOTHER)',
  'MIDDLE NAME (MOTHER)',
  'OCCUPATION (MOTHER)',
  'LAST NAME (GUARDIAN)',
  'FIRST NAME (GUARDIAN)',
  'MIDDLE NAME (GUARDIAN)',
  'OCCUPATION (GUARDIAN)',
  'PWD',
  'TYPE OF DISABILITY',
  'PWD ID',
  'LAST GRADE LEVEL COMPLETED',
  'WHY DID YOU NOT ATTEND/COMPLETE SCHOOLING',
  'HAVE YOU ATTENDED ALS LEARNING SESSIONS BEFORE?',
  'IF YES, CHECK THE APPROPRIATE PROGRAM',
  'HAVE YOU COMPLETED THE PROGRAM?',
  '1. HOW FAR IS YOUR HOME TO YOUR LEARNING CENTER?',
  '2. HOW DO YOU GET FROM YOUR HOME TO YOUR LEARNING CENTER?',
  '3. PLEASE PROVIDE THE SPECIFIC DAY AND TIME YOU CAN BE AT YOUR LEARNING CENTER: (DAYS)',
  '3. PLEASE PROVIDE THE SPECIFIC DAY AND TIME YOU CAN BE AT YOUR LEARNING CENTER: (TIME)',
  'IF THE SCHOOL WILL IMPLEMENT OTHER DISTANCE LEARNING MODALITIES ASIDE FROM FACE-TO-FACE INSTRUCTION, WHAT WOULD YOU PREFER FOR THE LEARNER:',
  'BIRTH CERTIFICATE LINK (PDF, IMAGE)'
];

/**
 * Split father name into parts
 */
export const splitFatherName = (fullName: string | undefined): { last: string; first: string; middle: string } => {
  if (!fullName || fullName === 'Unknown Father' || fullName === 'N/A' || fullName === '—') return { last: '', first: '', middle: '' };
  const clean = fullName.includes(',') ? fullName.split(',') : [fullName];
  if (clean.length === 2) {
    return { last: clean[0].trim(), first: clean[1].trim(), middle: '' };
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { last: parts[0], first: '', middle: '' };
  const last = parts[parts.length - 1] || '';
  const first = parts[0] || '';
  const middle = parts.slice(1, -1).join(' ') || '';
  return { last, first, middle };
};

/**
 * Split mother name into parts
 */
export const splitMotherName = (fullName: string | undefined): { last: string; first: string; middle: string } => {
  if (!fullName || fullName === 'Unknown Mother' || fullName === 'N/A' || fullName === '—') return { last: '', first: '', middle: '' };
  const clean = fullName.includes(',') ? fullName.split(',') : [fullName];
  if (clean.length === 2) {
    return { last: clean[0].trim(), first: clean[1].trim(), middle: '' };
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { last: parts[0], first: '', middle: '' };
  const last = parts[parts.length - 1] || '';
  const first = parts[0] || '';
  const middle = parts.slice(1, -1).join(' ') || '';
  return { last, first, middle };
};

/**
 * Helper to calculate dynamic Remarks based on grade level completed
 */
export const getRemarksForGrade = (grade: string | undefined): string => {
  if (!grade) return '—';
  const trimmed = grade.trim();
  if (trimmed === 'Kinder' || trimmed === 'Grade 1') {
    return 'The Learners is enrolled in Basic Literacy Program: Developing';
  }
  if (trimmed === 'Grade 2' || trimmed === 'Grade 3') {
    return 'The Learner is enrolled in Basic Literacy Program: Beginning';
  }
  if (trimmed === 'Grade 4' || trimmed === 'Grade 5') {
    return 'The Learner is enrolled in A&E Elementary: Intermediate';
  }
  if (trimmed === 'Grade 6' || trimmed === 'Grade 7') {
    return 'The Learner is enrolled in A&E Junior High School: Upper Intermediate';
  }
  if (trimmed === 'Grade 8' || trimmed === 'Grade 9') {
    return 'The Learner is enrolled in A&E Elementary: Proficient';
  }
  if (trimmed === 'Grade 10') {
    return 'The Learner is enrolled in ALS Senior High school: Grade 11';
  }
  if (trimmed === 'Grade 11') {
    return 'The Learner is enrolled in ALS Senior High school: Grade 12';
  }
  return '—';
};

/**
 * Helper to format days availability object to string
 */
export const formatDaysAvail = (days: any): string => {
  if (!days) return '—';
  if (typeof days === 'string') return days;
  const active = Object.entries(days)
    .filter(([_, val]) => !!val)
    .map(([day, val]) => `${day}: ${val}`);
  return active.length > 0 ? active.join(', ') : '—';
};

/**
 * Map a LearnerRecord into a 57-column array matching the specified Enrollment_AF2 columns.
 */
export function mapLearnerToSheetRow(l: LearnerRecord, index: number): any[] {
  const father = splitFatherName(l.fatherLastName || l.fatherName);
  const mother = splitMotherName(l.motherLastName || l.motherName);

  const finalFatherLast = l.fatherLastName || father.last || '—';
  const finalFatherFirst = l.fatherFirstName || father.first || '—';
  const finalFatherMiddle = l.fatherMiddleName || father.middle || '—';

  const finalMotherLast = l.motherLastName || mother.last || '—';
  const finalMotherFirst = l.motherFirstName || mother.first || '—';
  const finalMotherMiddle = l.motherMiddleName || mother.middle || '—';

  const daysList = l.clcDaysAvailability ? Object.entries(l.clcDaysAvailability).filter(([_, val]) => !!val) : [];
  const daysVal = daysList.map(([day, _]) => day).join(', ') || '—';
  const timesVal = daysList.map(([day, val]) => `${day}: ${val}`).join(', ') || '—';

  const fullName = `${l.lastName || ''}, ${l.firstName || ''} ${l.middleName ? l.middleName[0] + '.' : ''}`.trim();
  const firstAtt = l.dateOfFirstAttendance || l.enrollmentDate || '2025-06-02';
  const program = l.programEnrolled || l.typeOfProgram || 'Basic Literacy Program';
  const modality = l.actualModality || (Array.isArray(l.preferredModalities) && l.preferredModalities.length > 0 ? l.preferredModalities.join(', ') : 'Face-to-Face');
  const placeOfBirth = l.placeOfBirth || l.birthplace || 'Tarlac City';

  return [
    index > 0 ? index : `=ROW()-1`, // 0: NO.
    l.clcName || l.communityLearningCenter || 'BUROT CLC', // 1: COMMUNITY LEARNING CENTER
    l.clcCode || '12501476', // 2: COMMUNITY LEARNING CENTER CODE
    l.district || 'CENTRAL DISTRICT', // 3: DISTRICT
    l.teacher || 'Mrs. Maria Elena Santos', // 4: TEACHER
    firstAtt, // 5: DATE OF FIRST ATTENDANCE
    program, // 6: TYPE OF PROGRAM
    modality, // 7: ACTUAL MODALITY
    l.recordNumber || l.lrn || l.id || '', // 8: LEARNER REFERENCE NUMBER
    fullName, // 9: NAME
    l.lastName || '', // 10: LAST NAME
    l.firstName || '', // 11: FIRST NAME
    l.middleName || '—', // 12: MIDDLE NAME
    l.nameExtension || '—', // 13: EXTENSION NAME
    l.contactNumber || l.contact || '—', // 14: CONTACT NUMBER
    l.dateOfBirth || l.birthdate || '', // 15: BIRTHDATE
    l.age || '', // 16: AGE
    l.gender || l.sex || 'Male', // 17: SEX
    placeOfBirth, // 18: PLACE OF BIRTH
    l.religion || 'Roman Catholic', // 19: RELIGION
    l.indigenousPeople === 'Yes' || l.isIP === 'Yes' ? 'Yes' : 'No', // 20: IP
    l.motherTongue || 'Tagalog', // 21: MOTHER TONGUE
    l.is4Ps === 'Yes' || l.fourPsBeneficiary === 'Yes' ? 'Yes' : 'No', // 22: 4P's BENEFICIARY
    l.householdId || '—', // 23: 4PS HOUSEHOLD ID
    l.civilStatus || 'Single', // 24: CIVIL STATUS
    l.houseNo || '—', // 25: HOUSE NO.
    l.street || l.sitioStreet || '—', // 26: SITIO/STREET NAME
    l.barangay || '', // 27: BARANGAY
    l.city || l.municipalityCity || 'Tarlac City', // 28: MUNICIPALITY/CITY
    l.province || 'Tarlac', // 29: PROVINCE
    l.country || 'Philippines', // 30: COUNTRY
    l.zipCode || '2300', // 31: ZIP CODE
    finalFatherLast, // 32: LAST NAME (FATHER)
    finalFatherFirst, // 33: FIRST NAME (FATHER)
    finalFatherMiddle, // 34: MIDDLE NAME (FATHER)
    l.fatherOccupation || 'N/A', // 35: OCCUPATION (FATHER)
    finalMotherLast, // 36: LAST NAME (MOTHER)
    finalMotherFirst, // 37: FIRST NAME (MOTHER)
    finalMotherMiddle, // 38: MIDDLE NAME (MOTHER)
    l.motherOccupation || 'N/A', // 39: OCCUPATION (MOTHER)
    l.guardianLastName || '—', // 40: LAST NAME (GUARDIAN)
    l.guardianFirstName || '—', // 41: FIRST NAME (GUARDIAN)
    l.guardianMiddleName || '—', // 42: MIDDLE NAME (GUARDIAN)
    l.guardianOccupation || '—', // 43: OCCUPATION (GUARDIAN)
    l.isPWD || l.pwd || 'No', // 44: PWD
    Array.isArray(l.pwdDisabilityType) ? l.pwdDisabilityType.join(', ') : (l.pwdDisabilityType || l.disability || '—'), // 45: TYPE OF DISABILITY
    l.pwdID || '—', // 46: PWD ID
    l.lastGradeLevelCompleted || l.lastGradeCompleted || 'Grade 6', // 47: LAST GRADE LEVEL COMPLETED
    l.whyNotAttend || l.reasonsForNotAttending || 'N/A', // 48: WHY DID YOU NOT ATTEND/COMPLETE SCHOOLING
    l.attendedALSBef || 'No', // 49: HAVE YOU ATTENDED ALS LEARNING SESSIONS BEFORE?
    (l as any).attendedALSBefPrg || l.preferredProgram || '—', // 50: IF YES, CHECK THE APPROPRIATE PROGRAM
    l.completedALSBef || 'No', // 51: HAVE YOU COMPLETED THE PROGRAM?
    l.clcDistanceKms ? `${l.clcDistanceKms} kms` : '—', // 52: 1. HOW FAR IS YOUR HOME TO YOUR LEARNING CENTER?
    l.howGetToClc || 'Walking', // 53: 2. HOW DO YOU GET FROM YOUR HOME TO YOUR LEARNING CENTER?
    daysVal, // 54: 3. PLEASE PROVIDE THE SPECIFIC DAY AND TIME YOU CAN BE AT YOUR LEARNING CENTER: (DAYS)
    timesVal, // 55: 3. PLEASE PROVIDE THE SPECIFIC DAY AND TIME YOU CAN BE AT YOUR LEARNING CENTER: (TIME)
    Array.isArray(l.preferredModalities) ? l.preferredModalities.join(', ') : (l.preferredModalities || '—'), // 56: IF THE SCHOOL WILL IMPLEMENT OTHER DISTANCE LEARNING MODALITIES...
    l.birthCertificateLink || '—' // 57: BIRTH CERTIFICATE LINK (PDF, IMAGE)
  ];
}

/**
 * Reverse-map a 58-row array from Google Sheet: Enrollment_AF2 back into a LearnerRecord
 */
export function mapSheetRowToLearner(row: any[], index: number): LearnerRecord {
  const getVal = (colIndex: number, fallback: string = '') => {
    return row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]).trim() : fallback;
  };

  const clcName = getVal(1, 'BUROT CLC');
  const clcCode = getVal(2, '12501476');
  const district = getVal(3, 'CENTRAL DISTRICT');
  const teacher = getVal(4);
  const dateOfFirstAttendance = getVal(5, '2025-06-02');
  const typeOfProgram = getVal(6, 'Basic Literacy Program');
  const actualModality = getVal(7, 'Face-to-Face');
  const recordNumber = getVal(8, String(index));
  const fullNameField = getVal(9); // NAME
  const lastName = getVal(10);
  const firstName = getVal(11);
  const middleName = getVal(12);
  const nameExtension = getVal(13);
  const contactNumber = getVal(14);
  const dateOfBirth = getVal(15);
  const age = parseInt(getVal(16)) || 18;
  const gender = getVal(17, 'Male') as 'Male' | 'Female';
  const placeOfBirth = getVal(18, 'Tarlac City');
  const religion = getVal(19, 'Roman Catholic');
  const indigenousPeople = getVal(20, 'No');
  const motherTongue = getVal(21, 'Tagalog');
  const is4Ps = (getVal(22, 'No') === 'Yes' ? 'Yes' : 'No') as 'Yes' | 'No';
  const householdId = getVal(23);
  const civilStatus = getVal(24, 'Single');
  const houseNo = getVal(25);
  const street = getVal(26);
  const barangay = getVal(27);
  const city = getVal(28, 'Tarlac City');
  const province = getVal(29, 'Tarlac');
  const country = getVal(30, 'Philippines');
  const zipCode = getVal(31, '2300');

  const fatherLastName = getVal(32);
  const fatherFirstName = getVal(33);
  const fatherMiddleName = getVal(34);
  const fatherOccupation = getVal(35, 'N/A');

  const motherLastName = getVal(36);
  const motherFirstName = getVal(37);
  const motherMiddleName = getVal(38);
  const motherOccupation = getVal(39, 'N/A');

  const guardianLastName = getVal(40);
  const guardianFirstName = getVal(41);
  const guardianMiddleName = getVal(42);
  const guardianOccupation = getVal(43, 'N/A');

  const isPWD = getVal(44, 'No') as 'Yes' | 'No';
  const disability = getVal(45);
  const pwdID = getVal(46);
  const lastGradeLevelCompleted = getVal(47, 'Grade 6');
  const whyNotAttend = getVal(48, 'N/A');

  const attendedALSBef = getVal(49, 'No');
  const attendedALSBefPrg = getVal(50, '');
  const completedALSBef = getVal(51, 'No');

  const distanceStr = getVal(52);
  const clcDistanceKms = distanceStr.replace(/[^\d.]/g, '') || '';
  const howGetToClc = getVal(53, 'Walking');
  
  // Parse days and times from columns 54 & 55
  const daysStr = getVal(54);
  const timesStr = getVal(55);
  const clcDaysAvailability: any = {};
  if (daysStr && daysStr !== '—') {
    const daysArr = daysStr.split(',').map(d => d.trim());
    daysArr.forEach(day => {
      clcDaysAvailability[day] = '8:00 AM TO 12:00 PM';
    });
  }
  if (timesStr && timesStr !== '—') {
    timesStr.split(',').forEach(item => {
      const parts = item.split(':');
      if (parts.length >= 2) {
        const dName = parts[0].trim();
        const tVal = parts.slice(1).join(':').trim();
        clcDaysAvailability[dName] = tVal;
      }
    });
  }

  const modsStr = getVal(56);
  const preferredModalities = modsStr && modsStr !== '—' ? modsStr.split(',').map(m => m.trim()) : [];
  const birthCertificateLink = getVal(57);

  const fatherName = fatherLastName ? `${fatherFirstName} ${fatherMiddleName} ${fatherLastName}`.trim() : 'Unknown Father';
  const motherName = motherLastName ? `${motherFirstName} ${motherMiddleName} ${motherLastName}`.trim() : 'Unknown Mother';
  const name = fullNameField || `${lastName}, ${firstName} ${middleName && middleName !== '—' ? middleName[0] + '. ' : ''}`.trim();

  return {
    id: `lrn-gs-${recordNumber ? `${recordNumber}-${index}` : index}`,
    recordNumber,
    lrn: recordNumber,
    lastName,
    firstName,
    middleName,
    nameExtension,
    gender,
    sex: gender,
    dateOfBirth,
    birthdate: dateOfBirth,
    age,
    placeOfBirth,
    motherTongue,
    indigenousPeople,
    isIP: indigenousPeople === 'Yes' ? 'Yes' : 'No',
    religion,
    houseNo,
    street,
    barangay,
    city,
    municipalityCity: city,
    province,
    country,
    zipCode,
    contactNumber: contactNumber || 'N/A',
    contact: contactNumber || 'N/A',
    fatherName,
    motherName,
    fatherLastName,
    fatherFirstName,
    fatherMiddleName,
    fatherOccupation,
    motherLastName,
    motherFirstName,
    motherMiddleName,
    motherOccupation,
    guardianLastName,
    guardianFirstName,
    guardianMiddleName,
    guardianOccupation,
    isPWD,
    pwd: isPWD,
    pwdDisabilityType: disability && disability !== '—' ? disability.split(',').map(d => d.trim()) : [],
    pwdID,
    lastGradeLevelCompleted,
    whyNotAttend,
    reasonsForNotAttending: whyNotAttend,
    attendedALSBef,
    attendedALSBefPrg,
    completedALSBef,
    alsCertificationStatus: completedALSBef === 'Yes'
      ? (attendedALSBefPrg ? `${attendedALSBefPrg} Completer` : 'ALS Completer')
      : (attendedALSBef === 'Yes' ? 'ALS Non-Completer' : (getVal(57) && !getVal(57).startsWith('http') && !getVal(57).toLowerCase().includes('pdf') && !getVal(57).toLowerCase().includes('attach') ? getVal(57) : '')),
    clcDistanceKms,
    howGetToClc,
    clcDaysAvailability,
    preferredModalities,
    birthCertificateLink,
    name,
    clcName,
    communityLearningCenter: clcName,
    clcCode,
    teacher,
    district,
    dateOfFirstAttendance,
    typeOfProgram,
    programEnrolled: typeOfProgram,
    actualModality,
    is4Ps,
    householdId,
    civilStatus,
    program: lastGradeLevelCompleted.includes('Secondary') ? 'A&E Secondary' : 'A&E Elementary',
    status: attendedALSBef === 'Yes' ? 'Enrolled' : 'In Processing',
    dateMapped: new Date().toISOString().split('T')[0],
    interestedInALS: 'Yes',
    preferredProgram: lastGradeLevelCompleted.includes('Secondary') ? 'A&E Secondary' : 'A&E Elementary',
    admissionDate: dateOfFirstAttendance
  };
}

