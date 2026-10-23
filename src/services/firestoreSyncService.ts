/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { LearnerRecord } from '../types';

export interface SheetSyncOptions {
  spreadsheetId?: string;
  tabName?: string;
  gid?: string;
  accessToken?: string | null;
  onProgress?: (msg: string) => void;
}

export interface SheetSyncResult {
  success: boolean;
  spreadsheetId: string;
  tabName: string;
  rowCount: number;
  message: string;
  timestamp: string;
}

/**
 * Normalizes an arbitrary string into a safe Firestore Document ID
 */
export function sanitizeDocId(id: string): string {
  if (!id) return `doc_${Date.now()}`;
  return id.replace(/[^a-zA-Z0-9_\-\.:]/g, '_').slice(0, 120);
}

/**
 * Fetches Google Sheet data using Google Workspace credentials and synchronizes
 * the records directly into Cloud Firestore collections with automatic schema mapping.
 */
export async function syncGoogleSheetToFirestore(
  options: SheetSyncOptions
): Promise<SheetSyncResult> {
  const {
    spreadsheetId = '1_XHlGABuB2u2NROx2vWQ31WirPUKBs1KsNBgNIwIC2M',
    tabName = 'Aguso',
    gid = '1177420101',
    accessToken = null,
    onProgress
  } = options;

  onProgress?.(`Connecting to Google Sheets [${tabName}]...`);

  // Build request headers with Google Workspace credentials if available
  const headers: Record<string, string> = {
    'Accept': 'application/json'
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Fetch rows from Google Sheets proxy
  const queryUrl = `/api/sheets/fetch?spreadsheetId=${encodeURIComponent(spreadsheetId)}&gid=${encodeURIComponent(gid)}&tab=${encodeURIComponent(tabName)}&_=${Date.now()}`;
  const response = await fetch(queryUrl, { headers });

  if (!response.ok) {
    throw new Error(`Google Sheets transfer failed with status ${response.status} (${response.statusText})`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(result.error);
  }

  const rawRecords: any[] = result.records || result.data || [];
  const timestamp = new Date().toISOString();
  const cacheKey = sanitizeDocId(`${spreadsheetId}_${tabName}`);

  onProgress?.(`Saving ${rawRecords.length} records to Cloud Firestore cache...`);

  // 1. Cache the raw sheet payload into 'sheets_cache' collection
  const cacheRef = doc(db, 'sheets_cache', cacheKey);
  await setDoc(cacheRef, {
    id: cacheKey,
    spreadsheetId,
    tabName,
    rowCount: rawRecords.length,
    syncedAt: timestamp,
    updatedAt: timestamp
  }, { merge: true });

  // 2. If records are Class Program / Schedule Matrix, cache into 'class_programs'
  const isClassProgramTab = tabName.toLowerCase().includes('program') || 
    tabName.toLowerCase().includes('schedule') || 
    tabName.toUpperCase() === tabName && tabName.includes(' ') || // e.g. "MELODY ANNE B. AQUINO"
    spreadsheetId === '1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc';

  if (isClassProgramTab && rawRecords.length > 0) {
    const programDocId = sanitizeDocId(`prog_${tabName}`);
    const progRef = doc(db, 'class_programs', programDocId);
    await setDoc(progRef, {
      id: programDocId,
      teacherName: tabName.trim(),
      spreadsheetId,
      tabName,
      rowCount: rawRecords.length,
      syncedAt: timestamp,
      updatedAt: timestamp
    }, { merge: true });
  }

  // 3. If records are Learner mapping records, save each into the 'learners' Firestore collection
  if (rawRecords.length > 0 && !isClassProgramTab) {
    onProgress?.(`Synchronizing learner entities into Firestore...`);

    const is2DArray = Array.isArray(rawRecords[0]);
    // If 2D array with header row at index 0
    const recordsToProcess = is2DArray ? rawRecords.slice(1) : rawRecords;

    // Use Firestore batch writes (up to 350 per batch to respect 500 limit)
    const BATCH_SIZE = 350;
    for (let i = 0; i < recordsToProcess.length; i += BATCH_SIZE) {
      const chunk = recordsToProcess.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      chunk.forEach((r: any, idx: number) => {
        let rawId: string;
        let lastName = '';
        let firstName = '';
        let middleName = '';
        let recordNumber = '';
        let gender = 'Male';
        let dateOfBirth = '';
        let age = 18;
        let motherTongue = 'Kapampangan';
        let religion = 'Roman Catholic';
        let barangay = tabName;
        let contactNumber = '';
        let lastGradeLevel = 'Elementary';
        let prog = 'A&E Secondary';
        let status = 'Enrolled';
        let remarks = '';
        let mappedBy = 'ALS Facilitator';

        if (Array.isArray(r)) {
          // Positional array row fallback
          recordNumber = String(r[0] || `L-${tabName}-${i + idx + 1}`);
          lastName = String(r[1] || '').trim();
          firstName = String(r[2] || '').trim();
          middleName = String(r[3] || '').trim();
          gender = String(r[4] || '').toLowerCase().startsWith('f') ? 'Female' : 'Male';
          dateOfBirth = String(r[5] || '');
          age = Number(r[6]) || 18;
          barangay = String(r[12] || tabName);
          contactNumber = String(r[17] || '');
          rawId = recordNumber || `L-${tabName}-${i + idx + 1}`;
        } else {
          // Structured object record from /api/sheets/fetch
          rawId = r.id || r.lrn || r.recordNumber || `L-${tabName}-${i + idx + 1}`;
          recordNumber = String(r.recordNumber || '');
          lastName = String(r.lastName || '').trim();
          firstName = String(r.firstName || '').trim();
          middleName = String(r.middleName || '').trim();
          gender = r.gender === 'Female' ? 'Female' : 'Male';
          dateOfBirth = String(r.dateOfBirth || '');
          age = Number(r.age) || 18;
          motherTongue = String(r.motherTongue || 'Kapampangan');
          religion = String(r.religion || 'Roman Catholic');
          barangay = String(r.barangay || tabName);
          contactNumber = String(r.contactNumber || '');
          lastGradeLevel = String(r.lastGradeLevelCompleted || 'Elementary');
          prog = String(r.program || r.preferredProgram || 'A&E Secondary');
          status = String(r.status || 'Enrolled');
          remarks = String(r.remarks || '');
          mappedBy = String(r.mappedBy || 'ALS Facilitator');
        }

        const docId = sanitizeDocId(String(rawId));
        const learnerRef = doc(db, 'learners', docId);
        const fullName = `${firstName} ${lastName}`.trim() || String(r.name || 'ALS Learner');

        // Sanitize and normalize properties for Firestore schema
        const learnerDoc = {
          id: docId,
          recordNumber: recordNumber || docId,
          lastName,
          firstName,
          middleName,
          name: fullName,
          gender: gender as 'Male' | 'Female',
          dateOfBirth,
          age,
          motherTongue,
          indigenousPeople: String(r.indigenousPeople || 'No'),
          religion,
          houseNo: String(r.houseNo || ''),
          street: String(r.street || ''),
          barangay,
          city: String(r.city || 'Tarlac City'),
          province: String(r.province || 'Tarlac'),
          district: String(r.district || 'District A'),
          fatherName: String(r.fatherName || ''),
          motherName: String(r.motherName || ''),
          contactNumber,
          lastGradeLevelCompleted: lastGradeLevel,
          dateMapped: String(r.dateMapped || new Date().toISOString().split('T')[0]),
          interestedInALS: String(r.interestedInALS || 'Yes'),
          preferredProgram: prog,
          program: prog,
          dateOfFirstAttendance: String(r.dateOfFirstAttendance || ''),
          reasonsForNotAttending: String(r.reasonsForNotAttending || ''),
          alsCertificationStatus: String(r.alsCertificationStatus || 'Developing'),
          remarks,
          mappedBy,
          status,
          source: 'google_sheets_live',
          syncedAt: timestamp,
          updatedAt: timestamp
        };

        batch.set(learnerRef, learnerDoc, { merge: true });
      });

      await batch.commit();
    }
  }

  onProgress?.(`✓ Synchronized ${rawRecords.length} records into Firestore.`);

  return {
    success: true,
    spreadsheetId,
    tabName,
    rowCount: rawRecords.length,
    message: `Successfully synchronized ${rawRecords.length} records from Google Sheet tab "${tabName}" to Cloud Firestore.`,
    timestamp
  };
}

/**
 * Saves a single Learner entity into Cloud Firestore
 */
export async function saveLearnerToFirestore(learner: Partial<LearnerRecord>): Promise<void> {
  const docId = sanitizeDocId(String(learner.id || learner.recordNumber || Date.now()));
  const learnerRef = doc(db, 'learners', docId);
  const data = {
    ...learner,
    id: docId,
    updatedAt: new Date().toISOString()
  };
  await setDoc(learnerRef, data, { merge: true });
}

/**
 * Deletes a learner from Cloud Firestore
 */
export async function deleteLearnerFromFirestore(learnerId: string): Promise<void> {
  const docId = sanitizeDocId(learnerId);
  const learnerRef = doc(db, 'learners', docId);
  await deleteDoc(learnerRef);
}

/**
 * Saves a digital attendance log entry into Cloud Firestore
 */
export async function saveAttendanceLogToFirestore(log: {
  id: string;
  learnerId?: string;
  name: string;
  lrn: string;
  action: 'TIME IN' | 'TIME OUT';
  session: 'Morning Session' | 'Afternoon Session';
  clc: string;
  method?: string;
  timestamp: string;
  status?: string;
}): Promise<void> {
  const docId = sanitizeDocId(log.id || `LOG-${Date.now()}`);
  const logRef = doc(db, 'attendance_logs', docId);
  await setDoc(logRef, {
    ...log,
    id: docId,
    syncedAt: new Date().toISOString()
  }, { merge: true });
}
