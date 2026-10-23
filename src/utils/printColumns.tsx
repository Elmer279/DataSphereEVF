/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LearnerRecord } from '../types';
import { formatDateOfBirth, formatDateMapped, getLearnerPreferredProgram, getOrderNumberFromRecordNumber } from '../types';

/**
 * Robust age calculation that always computes the live age up to the present date
 */
export function calculateCurrentAge(birthdateStr: string | undefined | null, fallbackAge?: any): number | string {
  if (!birthdateStr || typeof birthdateStr !== 'string' || birthdateStr.trim() === '' || birthdateStr.trim() === '—' || birthdateStr.trim() === '-') {
    if (fallbackAge !== undefined && fallbackAge !== null && fallbackAge !== '' && fallbackAge !== '—') {
      const num = Number(fallbackAge);
      if (!isNaN(num) && num > 0 && num < 120) return num;
    }
    return '—';
  }

  const clean = birthdateStr.trim();
  let bDate: Date | null = null;

  // Case 1: ISO or YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(clean)) {
    const parts = clean.split('T')[0].split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      bDate = new Date(y, m, d);
    }
  } 
  // Case 2: MM/DD/YYYY or M/D/YYYY
  else if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(clean)) {
    const parts = clean.split('/');
    let m = parseInt(parts[0], 10) - 1;
    let d = parseInt(parts[1], 10);
    let y = parseInt(parts[2], 10);
    if (y < 100) y += y > 30 ? 1900 : 2000;
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      bDate = new Date(y, m, d);
    }
  } 
  // Case 3: Standard Date string parse (e.g., "October 14, 2006", "14 Oct 2006")
  else {
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      bDate = parsed;
    }
  }

  if (bDate && !isNaN(bDate.getTime())) {
    const today = new Date();
    let age = today.getFullYear() - bDate.getFullYear();
    const monthDiff = today.getMonth() - bDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bDate.getDate())) {
      age--;
    }
    if (age >= 0 && age <= 125) {
      return age;
    }
  }

  if (fallbackAge !== undefined && fallbackAge !== null && fallbackAge !== '' && fallbackAge !== '—') {
    const num = Number(fallbackAge);
    if (!isNaN(num) && num > 0 && num < 120) return num;
  }
  return '—';
}

export interface MasterlistPrintColumnConfig {
  id: string;
  label: string;
  defaultChecked: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  renderValue: (l: LearnerRecord, idx: number, isEnrolled: boolean) => React.ReactNode;
  renderHtml: (l: LearnerRecord, idx: number, isEnrolled: boolean) => string;
}

export const MASTERLIST_PRINT_COLUMNS: MasterlistPrintColumnConfig[] = [
  {
    id: 'order',
    label: 'Order',
    defaultChecked: true,
    align: 'center',
    width: '28px',
    renderValue: (l, idx) => (
      <span className="font-mono text-slate-650">{getOrderNumberFromRecordNumber(l.recordNumber, idx)}</span>
    ),
    renderHtml: (l, idx) => `<td style="text-align: center; font-family: monospace;">${getOrderNumberFromRecordNumber(l.recordNumber, idx)}</td>`
  },
  {
    id: 'recordNumber',
    label: 'Record #',
    defaultChecked: true,
    align: 'center',
    width: '45px',
    renderValue: (l) => (
      <span className="font-mono font-bold text-slate-700">{l.recordNumber || '—'}</span>
    ),
    renderHtml: (l) => `<td style="font-family: monospace; text-align: center; font-weight: bold;">${l.recordNumber || '—'}</td>`
  },
  {
    id: 'lastName',
    label: 'Last Name',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => (
      <span className="font-bold text-slate-900">{l.lastName || '—'}</span>
    ),
    renderHtml: (l) => `<td style="font-weight: bold;">${l.lastName || '—'}</td>`
  },
  {
    id: 'firstName',
    label: 'First Name',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => (
      <span className="font-semibold text-slate-800">{l.firstName || '—'}</span>
    ),
    renderHtml: (l) => `<td>${l.firstName || '—'}</td>`
  },
  {
    id: 'middleName',
    label: 'Middle Name',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => (
      <span className="text-slate-700">{l.middleName || '—'}</span>
    ),
    renderHtml: (l) => `<td>${l.middleName || '—'}</td>`
  },
  {
    id: 'gender',
    label: 'Gender',
    defaultChecked: true,
    align: 'center',
    renderValue: (l) => (
      <span>{l.gender || l.sex || '—'}</span>
    ),
    renderHtml: (l) => `<td style="text-align: center;">${l.gender || l.sex || '—'}</td>`
  },
  {
    id: 'dateOfBirth',
    label: 'Date of Birth',
    defaultChecked: true,
    align: 'left', // Aligned to the left as requested
    renderValue: (l) => {
      const bdate = l.dateOfBirth || l.birthdate || '';
      return (
        <span className="font-mono text-left whitespace-nowrap text-slate-700 block">
          {bdate ? formatDateOfBirth(bdate) : '—'}
        </span>
      );
    },
    renderHtml: (l) => {
      const bdate = l.dateOfBirth || l.birthdate || '';
      return `<td style="text-align: left; white-space: nowrap; font-family: monospace;">${bdate ? formatDateOfBirth(bdate) : '—'}</td>`;
    }
  },
  {
    id: 'age',
    label: 'Age',
    defaultChecked: true,
    align: 'center', // Dynamically computed to present date
    renderValue: (l) => {
      const bdate = l.dateOfBirth || l.birthdate || '';
      return (
        <span className="font-bold text-slate-900">
          {calculateCurrentAge(bdate, l.age)}
        </span>
      );
    },
    renderHtml: (l) => {
      const bdate = l.dateOfBirth || l.birthdate || '';
      return `<td style="text-align: center; font-weight: bold;">${calculateCurrentAge(bdate, l.age)}</td>`;
    }
  },
  {
    id: 'motherTongue',
    label: 'Mother Tongue',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => <span>{l.motherTongue || '—'}</span>,
    renderHtml: (l) => `<td>${l.motherTongue || '—'}</td>`
  },
  {
    id: 'indigenousPeople',
    label: 'IP',
    defaultChecked: true,
    align: 'center',
    renderValue: (l) => <span>{l.indigenousPeople || l.isIP || 'No'}</span>,
    renderHtml: (l) => `<td style="text-align: center;">${l.indigenousPeople || l.isIP || 'No'}</td>`
  },
  {
    id: 'religion',
    label: 'Religion',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => <span>{l.religion || '—'}</span>,
    renderHtml: (l) => `<td>${l.religion || '—'}</td>`
  },
  {
    id: 'houseNo',
    label: 'House No.',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => <span>{l.houseNo || '—'}</span>,
    renderHtml: (l) => `<td>${l.houseNo || '—'}</td>`
  },
  {
    id: 'street',
    label: 'Street',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => <span>{l.street || l.sitioStreet || '—'}</span>,
    renderHtml: (l) => `<td>${l.street || l.sitioStreet || '—'}</td>`
  },
  {
    id: 'barangay',
    label: 'Barangay',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => <span className="font-semibold text-slate-900">{l.barangay || '—'}</span>,
    renderHtml: (l) => `<td style="font-weight: bold;">${l.barangay || '—'}</td>`
  },
  {
    id: 'city',
    label: 'City',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => <span>{l.city || l.municipalityCity || 'Tarlac City'}</span>,
    renderHtml: (l) => `<td>${l.city || l.municipalityCity || 'Tarlac City'}</td>`
  },
  {
    id: 'province',
    label: 'Province',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => <span>{l.province || 'Tarlac'}</span>,
    renderHtml: (l) => `<td>${l.province || 'Tarlac'}</td>`
  },
  {
    id: 'fatherName',
    label: 'Name of Father',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => <span>{l.fatherName || '—'}</span>,
    renderHtml: (l) => `<td>${l.fatherName || '—'}</td>`
  },
  {
    id: 'motherName',
    label: 'Name of Mother',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => <span>{l.motherName || '—'}</span>,
    renderHtml: (l) => `<td>${l.motherName || '—'}</td>`
  },
  {
    id: 'contactNumber',
    label: 'Contact Number',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => <span className="font-mono text-slate-700">{l.contactNumber || l.contact || '—'}</span>,
    renderHtml: (l) => `<td style="font-family: monospace;">${l.contactNumber || l.contact || '—'}</td>`
  },
  {
    id: 'lastGradeLevelCompleted',
    label: 'Last Grade Completed',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => <span>{l.lastGradeLevelCompleted || l.lastGradeCompleted || '—'}</span>,
    renderHtml: (l) => `<td>${l.lastGradeLevelCompleted || l.lastGradeCompleted || '—'}</td>`
  },
  {
    id: 'dateMapped',
    label: 'Date Mapped',
    defaultChecked: true,
    align: 'center',
    renderValue: (l) => {
      const d = l.dateMapped || '';
      return <span className="whitespace-nowrap font-mono">{d ? formatDateMapped(d) : '—'}</span>;
    },
    renderHtml: (l) => {
      const d = l.dateMapped || '';
      return `<td style="text-align: center; white-space: nowrap; font-family: monospace;">${d ? formatDateMapped(d) : '—'}</td>`;
    }
  },
  {
    id: 'interestedInALS',
    label: 'Interested in ALS',
    defaultChecked: true,
    align: 'center',
    renderValue: (l) => <span>{l.interestedInALS || '—'}</span>,
    renderHtml: (l) => `<td style="text-align: center;">${l.interestedInALS || '—'}</td>`
  },
  {
    id: 'preferredProgram',
    label: 'Preferred Program',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => <span className="font-semibold text-slate-800">{l.preferredProgram || l.program || '—'}</span>,
    renderHtml: (l) => `<td>${l.preferredProgram || l.program || '—'}</td>`
  },
  {
    id: 'enrolledInAls',
    label: 'Enrolled in ALS',
    defaultChecked: true,
    align: 'center',
    renderValue: (_l, _idx, isEnrolled) => (
      <span className={`font-bold ${isEnrolled ? 'text-emerald-700' : 'text-slate-500'}`}>
        {isEnrolled ? 'Yes' : 'No'}
      </span>
    ),
    renderHtml: (_l, _idx, isEnrolled) => `<td style="text-align: center; font-weight: bold;">${isEnrolled ? 'Yes' : 'No'}</td>`
  },
  {
    id: 'dateOfFirstAttendance',
    label: 'Date of First Attendance',
    defaultChecked: true,
    align: 'center',
    renderValue: (l) => {
      return <span className="font-mono whitespace-nowrap">{l.dateOfFirstAttendance ? formatDateMapped(l.dateOfFirstAttendance) : '—'}</span>;
    },
    renderHtml: (l) => `<td style="text-align: center; font-family: monospace; white-space: nowrap;">${l.dateOfFirstAttendance ? formatDateMapped(l.dateOfFirstAttendance) : '—'}</td>`
  },
  {
    id: 'reasonsForNotAttending',
    label: 'Reasons for Not Attending',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => (
      <span className="max-w-[200px] truncate block" title={l.reasonsForNotAttending || l.whyNotAttend}>
        {l.reasonsForNotAttending || l.whyNotAttend || '—'}
      </span>
    ),
    renderHtml: (l) => `<td>${l.reasonsForNotAttending || l.whyNotAttend || '—'}</td>`
  },
  {
    id: 'alsCertificationStatus',
    label: 'ALS Certification & Completion Status',
    defaultChecked: true,
    align: 'left',
    renderValue: (l) => (
      <span className="max-w-[180px] truncate block" title={l.alsCertificationStatus || l.remarks}>
        {l.alsCertificationStatus || (l.remarks && (l.remarks.toLowerCase().includes('completer') || l.remarks.toLowerCase().includes('graduate') || l.remarks.toLowerCase().includes('passer')) ? l.remarks : '—')}
      </span>
    ),
    renderHtml: (l) => `<td>${l.alsCertificationStatus || l.remarks || '—'}</td>`
  }
];

export function getDefaultPrintColumnSelection(): Record<string, boolean> {
  const selection: Record<string, boolean> = {};
  MASTERLIST_PRINT_COLUMNS.forEach(col => {
    selection[col.id] = col.defaultChecked;
  });
  return selection;
}
