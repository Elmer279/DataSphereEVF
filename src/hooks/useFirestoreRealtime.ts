/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  DocumentData,
  FirestoreError 
} from 'firebase/firestore';
import { db } from '../firebase';
import { LearnerRecord } from '../types';

export interface RealtimeLearnersState {
  learners: LearnerRecord[];
  loading: boolean;
  error: string | null;
  count: number;
}

export interface RealtimeAttendanceState {
  logs: any[];
  loading: boolean;
  error: string | null;
}

/**
 * Real-time listener hook for the 'learners' Firestore collection.
 * Automatically receives instant updates whenever Google Sheets data is synchronized
 * or any client creates, edits, or deletes a learner record.
 */
export function useRealtimeLearners(initialData: LearnerRecord[] = []): RealtimeLearnersState {
  const [learners, setLearners] = useState<LearnerRecord[]>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const learnersCol = collection(db, 'learners');
      
      // Attach real-time Firestore onSnapshot listener
      const unsubscribe = onSnapshot(
        learnersCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const records: LearnerRecord[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              records.push({
                id: docSnap.id,
                recordNumber: data.recordNumber || docSnap.id,
                lastName: data.lastName || '',
                firstName: data.firstName || '',
                middleName: data.middleName || '',
                name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'ALS Learner',
                gender: data.gender === 'Female' ? 'Female' : 'Male',
                dateOfBirth: data.dateOfBirth || '',
                age: data.age || 18,
                motherTongue: data.motherTongue || 'Kapampangan',
                indigenousPeople: data.indigenousPeople || 'No',
                religion: data.religion || 'Roman Catholic',
                houseNo: data.houseNo || '',
                street: data.street || '',
                barangay: data.barangay || 'Aguso',
                city: data.city || 'Tarlac City',
                province: data.province || 'Tarlac',
                district: data.district || 'District A',
                fatherName: data.fatherName || '',
                motherName: data.motherName || '',
                contactNumber: data.contactNumber || '',
                lastGradeLevelCompleted: data.lastGradeLevelCompleted || 'Elementary',
                dateMapped: data.dateMapped || '',
                interestedInALS: data.interestedInALS || 'Yes',
                preferredProgram: data.preferredProgram || 'A&E Secondary',
                program: data.program || data.preferredProgram || 'A&E Secondary',
                dateOfFirstAttendance: data.dateOfFirstAttendance || '',
                reasonsForNotAttending: data.reasonsForNotAttending || '',
                alsCertificationStatus: data.alsCertificationStatus || 'Developing',
                remarks: data.remarks || '',
                mappedBy: data.mappedBy || '',
                status: data.status || 'Enrolled',
                clcName: data.clc || data.clcName || '',
                teacher: data.teacher || ''
              } as LearnerRecord);
            });

            console.log(`[Firestore Realtime] 🔄 Received ${records.length} learner records via onSnapshot.`);
            setLearners(records);
          } else {
            // If Firestore is still empty, keep baseline initialData
            if (initialData.length > 0) {
              setLearners(initialData);
            }
          }
          setLoading(false);
          setError(null);
        },
        (err: FirestoreError) => {
          console.warn('[Firestore Realtime] ⚠️ onSnapshot listener warning:', err.message);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => {
        unsubscribe();
      };
    } catch (err: any) {
      console.error('[Firestore Realtime] Initialization error:', err);
      setError(err.message || 'Failed to initialize Firestore listener');
      setLoading(false);
    }
  }, []);

  return { learners, loading, error, count: learners.length };
}

/**
 * Real-time listener hook for digital attendance check-ins
 */
export function useRealtimeAttendanceLogs(maxLogs: number = 100): RealtimeAttendanceState {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const logsCol = collection(db, 'attendance_logs');
      const q = query(logsCol, limit(maxLogs));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedLogs: any[] = [];
          snapshot.forEach((docSnap) => {
            fetchedLogs.push({ id: docSnap.id, ...docSnap.data() });
          });

          // Sort in-memory by timestamp descending
          fetchedLogs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          setLogs(fetchedLogs);
          setLoading(false);
          setError(null);
        },
        (err: FirestoreError) => {
          console.warn('[Firestore Realtime] Attendance onSnapshot notice:', err.message);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('[Firestore Realtime] Attendance init error:', err);
      setError(err.message || 'Failed to initialize attendance listener');
      setLoading(false);
    }
  }, [maxLogs]);

  return { logs, loading, error };
}

/**
 * Real-time listener for synced Google Sheet cache metadata
 */
export function useRealtimeSheetCache() {
  const [cacheList, setCacheList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const cacheCol = collection(db, 'sheets_cache');
      const unsubscribe = onSnapshot(
        cacheCol,
        (snapshot) => {
          const items: any[] = [];
          snapshot.forEach(docSnap => items.push({ id: docSnap.id, ...docSnap.data() }));
          setCacheList(items);
          setLoading(false);
        },
        (err) => {
          console.warn('[Firestore Realtime] Sheet cache onSnapshot notice:', err.message);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      setLoading(false);
    }
  }, []);

  return { cacheList, loading };
}

/**
 * Real-time listener for Facilitator Class Program schedules
 */
export function useRealtimeClassPrograms() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const programsCol = collection(db, 'class_programs');
      const unsubscribe = onSnapshot(
        programsCol,
        (snapshot) => {
          const list: any[] = [];
          snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
          setPrograms(list);
          setLoading(false);
        },
        (err) => {
          console.warn('[Firestore Realtime] Class programs onSnapshot notice:', err.message);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      setLoading(false);
    }
  }, []);

  return { programs, loading };
}
