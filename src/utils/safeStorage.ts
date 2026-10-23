/**
 * Safe LocalStorage Utility with automatic QuotaExceededError recovery
 * Prevents application crashes when localStorage or sessionStorage exceeds browser storage limits.
 */

const EXPENDABLE_CACHE_KEYS = [
  'cached_passers_database_sheet',
  'cached_lrn_records',
  'tcsd_advocacy_materials',
  'tcsd_teacher_201_files',
  'tcsd_clc_sync_last_time',
  'tcsd_ppe_sync_last_time',
  'tcsd_lm_sync_last_time',
  'tcsd_synced_learning_centers',
  'als_biometric_db',
  'als_attendance_logs'
];

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (_) {
    // Primary setItem failed due to quota limit. Clear expendable cache items.
    for (const cacheKey of EXPENDABLE_CACHE_KEYS) {
      if (cacheKey !== key) {
        try {
          localStorage.removeItem(cacheKey);
        } catch (_) {}
      }
    }

    // Try setting item again in localStorage
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (_) {
      // Secondary fallback: Try sessionStorage
      try {
        sessionStorage.setItem(key, value);
        return true;
      } catch (_) {
        console.warn(`[safeStorage] Key "${key}" exceeds browser storage quota. Active data preserved in component state.`);
        return false;
      }
    }
  }
}

export function safeSetJSON<T>(key: string, data: T): boolean {
  try {
    const jsonString = JSON.stringify(data);
    const success = safeSetItem(key, jsonString);
    if (success) return true;

    // Progressive Array Truncation: If data is an array and exceeded quota, save trimmed subset
    if (Array.isArray(data) && data.length > 50) {
      const trimmed = data.slice(0, 100);
      try {
        const trimmedJson = JSON.stringify(trimmed);
        return safeSetItem(key, trimmedJson);
      } catch (_) {}
    }

    return false;
  } catch (_) {
    console.warn(`[safeStorage] Serialization warning for key "${key}".`);
    return false;
  }
}

export function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return parsed !== null && parsed !== undefined ? (parsed as T) : fallback;
  } catch (_) {
    return fallback;
  }
}
