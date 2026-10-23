/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LearningCenter {
  id: string;
  name: string;
  district: string;
  lat: number; // For rendering relative to map container dimensions
  lng: number; // For rendering relative to map container dimensions
  teacher: string;
  enrolled: number;
  status: 'active' | 'needs-resources' | 'under-construction';
  facilities: string[];
  established: string;
  
  // Google Sheets Profile & Directory fields
  no?: string;
  geolocation?: string;
  code?: string;
  address?: string;
  email?: string;
  phone?: string;
  teacherPicture?: string;
  type?: string;
  category?: string;
  passingRate2425?: string;
  passingRate2526?: string;
  partnerName?: string;
  partnerPosition?: string;
  partnerContact?: string;
  partnershipDoc?: string;
  isFromSheet?: boolean;
}

export interface LearnerRecord {
  id: string;
  recordNumber: string;
  lastName: string;
  firstName: string;
  middleName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  age: number;
  motherTongue: string;
  indigenousPeople: 'Yes' | 'No' | string;
  religion: string;
  houseNo: string;
  street: string;
  barangay: string;
  city?: string;
  province?: string;
  fatherName: string;
  motherName: string;
  contactNumber: string;
  lastGradeLevelCompleted: string;
  dateMapped: string;
  interestedInALS: 'Yes' | 'No' | string;
  preferredProgram: string;
  dateOfFirstAttendance: string;
  enrolledInAls?: 'Yes' | 'No' | string;
  latitude?: string | number;
  longitude?: string | number;
  staticGeoLocation?: string;
  reasonsForNotAttending: string;
  reasonsForNotAttending2?: string;
  alsCertificationStatus?: string;
  remarks?: string;
  mappedBy?: string;
  learnerSignature?: string;
  teacherSignature?: string;

  clcName?: string;
  clcCode?: string;
  teacher?: string;
  nameExtension?: string;
  isIP?: 'Yes' | 'No';
  ipCommunity?: string;
  is4Ps?: 'Yes' | 'No';
  householdId?: string;
  civilStatus?: string;
  country?: string;
  zipCode?: string;
  fatherLastName?: string;
  fatherFirstName?: string;
  fatherMiddleName?: string;
  fatherOccupation?: string;
  motherLastName?: string;
  motherFirstName?: string;
  motherMiddleName?: string;
  motherOccupation?: string;
  guardianLastName?: string;
  guardianFirstName?: string;
  guardianMiddleName?: string;
  guardianOccupation?: string;
  isPWD?: 'Yes' | 'No';
  pwdDisabilityType?: string[];
  pwdSpecialHealthType?: string;
  pwdVisualImpairmentType?: string;
  hasPWDID?: 'Yes' | 'No';
  pwdID?: string;
  whyNotAttend?: string;
  barangayTab?: string;
  originTab?: string;

  // Google Sheets sync fields support
  communityLearningCenter?: string;
  enrollmentDate?: string;
  programEnrolled?: string;
  typeOfProgram?: string;
  actualModality?: string;
  placeOfBirth?: string;
  birthplace?: string;
  lrn?: string;
  fourPsBeneficiary?: string;
  fourPs?: string;
  birthdate?: string;
  sex?: string;
  sitioStreet?: string;
  municipalityCity?: string;
  pwd?: string;
  disability?: string;
  lastGradeCompleted?: string;
  attendedALSBef?: string;
  attendedALSBefPrg?: string;
  completedALSBef?: string;
  clcDistanceKms?: string;
  clcDistanceHrs?: string;
  clcDistanceMins?: string;
  howGetToClc?: string;
  howGetToClcOthers?: string;
  clcDaysAvailability?: any;
  preferredModalities?: string[] | string;
  whyNotAttendSpecify?: string;
  completedALSBefNoReason?: string;
  birthCertificateLink?: string;

  // Synthesized/Derived helper attributes for dashboard charts & backward compatibility
  name: string;
  program: 'Basic Literacy' | 'A&E Elementary' | 'A&E Secondary';
  status: 'Enrolled' | 'In Processing' | 'Completed' | 'On Leave';
  district: string;
  contact: string;
  admissionDate: string;
}

export interface IntelAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  district: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface districtMetrics {
  id: string;
  name: string;
  totalCenters: number;
  totalEnrolled: number;
  activeTeachers: number;
  completionRate: number;
  retentionRate: number;
}

export function formatDistrictName(district: string): string {
  if (district === 'District B' || district === 'Tarlac District B') return 'Database on Partners and Linkages';
  return district;
}

export function formatDateOfBirth(dob: string | undefined | null): string {
  if (!dob) return "N/A";
  const cleanDob = dob.trim();
  if (!cleanDob || cleanDob === '-' || cleanDob.toLowerCase() === 'n/a') return "N/A";

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // If already matches "August 05, 1990", regularize spacing/padding
  const verbalRegex = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/;
  if (verbalRegex.test(cleanDob)) {
    const match = cleanDob.match(verbalRegex);
    if (match) {
      const mName = match[1];
      const mIndex = months.findIndex(m => m.toLowerCase().startsWith(mName.toLowerCase().slice(0, 3)));
      if (mIndex !== -1) {
        const dStr = match[2].padStart(2, '0');
        const yStr = match[3];
        return `${months[mIndex]} ${dStr}, ${yStr}`;
      }
    }
    return cleanDob;
  }

  // Check hyphen formats e.g. "1990-08-05"
  if (cleanDob.includes('-')) {
    const parts = cleanDob.split('-');
    if (parts.length === 3) {
      let year = "";
      let monthIndex = -1;
      let day = "";

      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);

      if (parts[0].length === 4 && !isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        // YYYY-MM-DD
        year = parts[0];
        monthIndex = p1 - 1;
        day = parts[2];
      } else if (parts[2].length === 4 && !isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        year = parts[2];
        if (p0 <= 12 && p1 <= 31) {
          monthIndex = p0 - 1;
          day = parts[1];
        } else if (p1 <= 12 && p0 <= 31) {
          monthIndex = p1 - 1;
          day = parts[0];
        } else {
          monthIndex = p0 - 1;
          day = parts[1];
        }
      }

      if (monthIndex >= 0 && monthIndex < 12 && year && day) {
        return `${months[monthIndex]} ${day.padStart(2, '0')}, ${year}`;
      }
    }
  }

  // Check slash formats e.g. "08/05/1990"
  if (cleanDob.includes('/')) {
    const parts = cleanDob.split('/');
    if (parts.length === 3) {
      let year = "";
      let monthIndex = -1;
      let day = "";

      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);

      if (parts[2].length === 4 && !isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        year = parts[2];
        if (p0 <= 12 && p1 <= 31) {
          monthIndex = p0 - 1;
          day = parts[1];
        } else if (p1 <= 12 && p0 <= 31) {
          monthIndex = p1 - 1;
          day = parts[0];
        } else {
          monthIndex = p0 - 1;
          day = parts[1];
        }
      } else if (parts[0].length === 4 && !isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        year = parts[0];
        monthIndex = p1 - 1;
        day = parts[2];
      }

      if (monthIndex >= 0 && monthIndex < 12 && year && day) {
        return `${months[monthIndex]} ${day.padStart(2, '0')}, ${year}`;
      }
    }
  }

  // Native Date fallback
  try {
    const d = new Date(cleanDob);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const day = d.getDate();
      return `${months[monthIndex]} ${String(day).padStart(2, '0')}, ${year}`;
    }
  } catch (_) {
    // Ignore and fallback
  }

  return cleanDob;
}

export function formatDateMapped(dateStr: string | undefined | null): string {
  if (!dateStr) return "-";
  const clean = dateStr.trim();
  if (!clean || clean === '-' || clean.toLowerCase() === 'n/a') return "-";

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // If already matches "Mar 28 2025" or similar
  const verbalRegex = /^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$/;
  if (verbalRegex.test(clean)) {
    const match = clean.match(verbalRegex);
    if (match) {
      const mName = match[1];
      const mIndex = months.findIndex(m => m.toLowerCase().startsWith(mName.toLowerCase().slice(0, 3)));
      if (mIndex !== -1) {
        const dStr = match[2];
        const yStr = match[3];
        return `${months[mIndex]} ${dStr} ${yStr}`;
      }
    }
  }

  // Try parsing by splitting spaces, slashes or hyphens
  let year = "";
  let monthIndex = -1;
  let day = "";

  const separator = clean.includes('/') ? '/' : (clean.includes('-') ? '-' : ' ');
  const parts = clean.split(separator).map(p => p.trim()).filter(Boolean);

  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);

    const alphabetMonthIdx = parts.findIndex(p => isNaN(Number(p)));
    if (alphabetMonthIdx !== -1) {
      const val = parts[alphabetMonthIdx].toLowerCase();
      monthIndex = months.findIndex(m => val.startsWith(m.toLowerCase().slice(0, 3)));
      if (monthIndex === -1) {
        const fullMonths = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
        monthIndex = fullMonths.findIndex(m => m.startsWith(val));
      }
      
      const otherParts = parts.filter((_, idx) => idx !== alphabetMonthIdx);
      if (otherParts.length === 2) {
        const op0 = parseInt(otherParts[0], 10);
        const op1 = parseInt(otherParts[1], 10);
        if (otherParts[0].length === 4) {
          year = otherParts[0];
          day = String(op1);
        } else if (otherParts[1].length === 4) {
          year = otherParts[1];
          day = String(op0);
        } else {
          if (op0 > 31) {
            year = String(op0);
            day = String(op1);
          } else {
            year = String(op1);
            day = String(op0);
          }
        }
      }
    } else {
      if (parts[0].length === 4 && !isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        year = parts[0];
        monthIndex = p1 - 1;
        day = String(p2);
      } else if (parts[2].length === 4 && !isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        year = parts[2];
        if (p0 <= 12 && p1 <= 31) {
          monthIndex = p0 - 1;
          day = String(p1);
        } else if (p1 <= 12 && p0 <= 31) {
          monthIndex = p1 - 1;
          day = String(p0);
        } else {
          monthIndex = p0 - 1;
          day = String(p1);
        }
      } else if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        let parsedYear = p2;
        if (parsedYear < 100) {
          parsedYear += 2000;
        }
        year = String(parsedYear);
        if (p0 <= 12 && p1 <= 31) {
          monthIndex = p0 - 1;
          day = String(p1);
        } else if (p1 <= 12 && p0 <= 31) {
          monthIndex = p1 - 1;
          day = String(p0);
        }
      }
    }
  }

  if (monthIndex >= 0 && monthIndex < 12 && year && day) {
    const cleanDay = String(parseInt(day, 10));
    return `${months[monthIndex]} ${cleanDay} ${year}`;
  }

  try {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      const yr = d.getFullYear();
      const mIdx = d.getMonth();
      const dy = d.getDate();
      return `${months[mIdx]} ${dy} ${yr}`;
    }
  } catch (_) {
    // Ignore error
  }

  return clean;
}

export interface Partner {
  id: number;
  logo: string;
  recordId: string;
  registrationDate: string;
  organizationName: string;
  partnerType: string;
  address: string;
  status: 'Active' | 'Pending Renewal' | 'Inactive';
  contactPerson: string;
  position: string;
  emailAddress: string;
  phoneNumber: string;
  typeOfSupport: string;
  learnersSupported: number;
  yearsOfPartnership: number;
  partnershipDocument: string;
  keyContactPerson: string;
  timestamp?: string;
  moaValidityDate?: string;
  moaRenewalStatus?: 'Valid' | 'Pending Renewal' | 'Under Review' | 'Expired';
  moaDaysRemaining?: number;
  lat?: number;
  lng?: number;
  clcCoverageAreas?: string[];
  resourceMobilizationSummary?: {
    equipment?: string;
    volunteerHours?: number;
    instructionalMaterials?: string;
    financialValuation?: string;
  };
}

export interface PersonnelRecord {
  id: string;
  employeeNo: string;
  teacherName: string; // Teacher Name
  imageUrl: string; // IMAGE 2 X 2 (Link/URL)
  schoolAssigned?: string; // School Assigned (Form 3)
  gender: 'Male' | 'Female'; // Sex
  birthDate: string; // Date of Birth
  age: number; // Age
  civilStatus: 'Single' | 'Married' | 'Widowed' | 'Separated'; // Civil Status
  email: string; // Email Address
  position: string; // Position
  careerStage: string; // Career Stage
  salaryGrade: string; // Salary Grade
  stepIncrement: string; // Step Increment
  contactNo: string; // Mobile Number (formerly contactNo)
  permanentAddress: string; // Permanent Address
  highestEducationalAttainment: string; // Highest Educational Attainment
  eligibility: string; // Eligibility
  eligibilityRating: string; // Eligibility Rating
  dateAppointed: string; // Original Date of Appointment
  yearsInService: number; // Years in Service
  dateAppointedALS: string; // Date of Appointment on ALS
  yearsInServiceALS: number; // Years in Service in ALS
  gsisNo: string; // GSIS Number
  pagIbigNo: string; // Pag-IBIG No.
  philHealthNo: string; // PhilHealth No.
  prcNo: string; // PRC No.
  tinNo: string; // TIN No.
  file201Link?: string; // 201 File Link
  
  // Performance Rating fields
  performanceRating: number; // Performance Rating (e.g. 4.85)
  adjectivalRating: 'Outstanding' | 'Very Satisfactory' | 'Satisfactory' | 'Unsatisfactory' | 'Poor'; // Adjectival Rating
  linkToPr: string; // Link to PR
  schoolYear?: string; // School Year (e.g. "2025-2026")
  historicalRatings?: {
    [year: string]: {
      rating: number;
      adjectival: string;
      link: string;
    };
  };
}

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


