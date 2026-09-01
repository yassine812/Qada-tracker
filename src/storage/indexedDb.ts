import { BackupData, DailyRecord, IstighfarData, IstighfarRecord, PrayerCounters, UserSettings } from '../types';

const DB_NAME = 'QadaTrackerDB';
const DB_VERSION = 2;

const STORES = {
  SETTINGS: 'settings',
  COUNTERS: 'counters',
  RECORDS: 'dailyRecords',
  ISTIGHFAR: 'istighfarRecords',
  ISTIGHFAR_DATA: 'istighfarData',
};

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this device/browser'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS);
      }
      if (!db.objectStoreNames.contains(STORES.COUNTERS)) {
        db.createObjectStore(STORES.COUNTERS);
      }
      if (!db.objectStoreNames.contains(STORES.RECORDS)) {
        const recordStore = db.createObjectStore(STORES.RECORDS, { keyPath: 'id' });
        recordStore.createIndex('date', 'date', { unique: false });
        recordStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.ISTIGHFAR)) {
        const istighfarStore = db.createObjectStore(STORES.ISTIGHFAR, { keyPath: 'id' });
        istighfarStore.createIndex('date', 'date', { unique: false });
        istighfarStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.ISTIGHFAR_DATA)) {
        db.createObjectStore(STORES.ISTIGHFAR_DATA);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function getSettings(): Promise<UserSettings | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SETTINGS, 'readonly');
      const store = tx.objectStore(STORES.SETTINGS);
      const req = store.get('current');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Error fetching settings from IndexedDB:', error);
    // Fallback to localStorage
    const local = localStorage.getItem('qada_settings');
    return local ? JSON.parse(local) : null;
  }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    localStorage.setItem('qada_settings', JSON.stringify(settings));
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(STORES.SETTINGS, 'readwrite');
        const store = tx.objectStore(STORES.SETTINGS);
        const req = store.put(settings, 'current');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (txErr) {
        reject(txErr);
      }
    });
  } catch (error) {
    console.warn('Fallback: Saved settings in localStorage', error);
  }
}

export async function getCounters(): Promise<PrayerCounters | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.COUNTERS, 'readonly');
      const store = tx.objectStore(STORES.COUNTERS);
      const req = store.get('current');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Error fetching counters from IndexedDB:', error);
    const local = localStorage.getItem('qada_counters');
    return local ? JSON.parse(local) : null;
  }
}

export async function saveCounters(counters: PrayerCounters): Promise<void> {
  try {
    localStorage.setItem('qada_counters', JSON.stringify(counters));
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(STORES.COUNTERS, 'readwrite');
        const store = tx.objectStore(STORES.COUNTERS);
        const req = store.put(counters, 'current');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (txErr) {
        reject(txErr);
      }
    });
  } catch (error) {
    console.warn('Fallback: Saved counters in localStorage', error);
  }
}

export async function getDailyRecords(): Promise<DailyRecord[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.RECORDS, 'readonly');
      const store = tx.objectStore(STORES.RECORDS);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result || []) as DailyRecord[];
        list.sort((a, b) => b.timestamp - a.timestamp);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Error fetching daily records from IndexedDB:', error);
    const local = localStorage.getItem('qada_records');
    return local ? JSON.parse(local) : [];
  }
}

export async function saveDailyRecord(record: DailyRecord): Promise<void> {
  try {
    // Sync to localStorage
    const local = localStorage.getItem('qada_records');
    const existingList: DailyRecord[] = local ? JSON.parse(local) : [];
    const updatedList = [record, ...existingList.filter((r) => r.id !== record.id)];
    localStorage.setItem('qada_records', JSON.stringify(updatedList));

    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(STORES.RECORDS, 'readwrite');
        const store = tx.objectStore(STORES.RECORDS);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (txErr) {
        reject(txErr);
      }
    });
  } catch (error) {
    console.warn('Fallback: Saved record in localStorage', error);
  }
}

export async function deleteDailyRecord(id: string): Promise<void> {
  try {
    const local = localStorage.getItem('qada_records');
    if (local) {
      const existingList: DailyRecord[] = JSON.parse(local);
      const updatedList = existingList.filter((r) => r.id !== id);
      localStorage.setItem('qada_records', JSON.stringify(updatedList));
    }

    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(STORES.RECORDS, 'readwrite');
        const store = tx.objectStore(STORES.RECORDS);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (txErr) {
        reject(txErr);
      }
    });
  } catch (error) {
    console.warn('Fallback: Deleted record from localStorage', error);
  }
}

export async function getIstighfarRecords(): Promise<IstighfarRecord[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.ISTIGHFAR, 'readonly');
      const store = tx.objectStore(STORES.ISTIGHFAR);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result || []) as IstighfarRecord[];
        list.sort((a, b) => b.timestamp - a.timestamp);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Error fetching istighfar records from IndexedDB:', error);
    const local = localStorage.getItem('qada_istighfar');
    return local ? JSON.parse(local) : [];
  }
}

export async function saveIstighfarRecord(record: IstighfarRecord): Promise<void> {
  try {
    const local = localStorage.getItem('qada_istighfar');
    const existingList: IstighfarRecord[] = local ? JSON.parse(local) : [];
    const updatedList = [record, ...existingList.filter((r) => r.id !== record.id)];
    localStorage.setItem('qada_istighfar', JSON.stringify(updatedList));

    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(STORES.ISTIGHFAR, 'readwrite');
        const store = tx.objectStore(STORES.ISTIGHFAR);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (txErr) {
        reject(txErr);
      }
    });
  } catch (error) {
    console.warn('Fallback: Saved istighfar record in localStorage', error);
  }
}

export async function getIstighfarData(): Promise<IstighfarData | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.ISTIGHFAR_DATA, 'readonly');
      const store = tx.objectStore(STORES.ISTIGHFAR_DATA);
      const req = store.get('current');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Error fetching istighfar data from IndexedDB:', error);
    const local = localStorage.getItem('qada_istighfar_data');
    return local ? JSON.parse(local) : null;
  }
}

export async function saveIstighfarData(data: IstighfarData): Promise<void> {
  try {
    localStorage.setItem('qada_istighfar_data', JSON.stringify(data));
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(STORES.ISTIGHFAR_DATA, 'readwrite');
        const store = tx.objectStore(STORES.ISTIGHFAR_DATA);
        const req = store.put(data, 'current');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (txErr) {
        reject(txErr);
      }
    });
  } catch (error) {
    console.warn('Fallback: Saved istighfar data in localStorage', error);
  }
}

export async function exportAllData(): Promise<BackupData> {
  const settings = await getSettings();
  const counters = await getCounters();
  const records = await getDailyRecords();
  const istighfarRecords = await getIstighfarRecords();

  if (!settings || !counters) {
    throw new Error('لا توجد بيانات كافية للتصدير');
  }

  return {
    version: '1.1',
    exportedAt: new Date().toISOString(),
    settings,
    counters,
    records,
    istighfarRecords,
  };
}

export function validateBackupData(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, any>;

  // Validate settings
  if (!d.settings || typeof d.settings !== 'object') return false;
  if (typeof d.settings.pubertyAge !== 'number' || typeof d.settings.currentAge !== 'number') return false;
  if (d.settings.pubertyAge >= d.settings.currentAge || d.settings.pubertyAge < 0) return false;

  // Validate counters
  if (!d.counters || typeof d.counters !== 'object') return false;
  const prayerKeys: (keyof PrayerCounters)[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (const key of prayerKeys) {
    const item = d.counters[key];
    if (!item || typeof item !== 'object') return false;
    if (
      typeof item.remaining !== 'number' ||
      typeof item.completed !== 'number' ||
      typeof item.initial !== 'number' ||
      item.remaining < 0 ||
      item.completed < 0 ||
      item.initial < 0 ||
      !Number.isInteger(item.remaining) ||
      !Number.isInteger(item.completed) ||
      !Number.isInteger(item.initial)
    ) {
      return false;
    }
  }

  // Validate records if present
  if (d.records !== undefined) {
    if (!Array.isArray(d.records)) return false;
    for (const rec of d.records) {
      if (!rec || typeof rec !== 'object') return false;
      if (typeof rec.id !== 'string' || typeof rec.date !== 'string' || typeof rec.total !== 'number') return false;
      if (rec.total < 0 || !Number.isInteger(rec.total)) return false;
    }
  }

  // Validate istighfar records if present (optional, backward compatible)
  if (d.istighfarRecords !== undefined) {
    if (!Array.isArray(d.istighfarRecords)) return false;
    for (const rec of d.istighfarRecords) {
      if (!rec || typeof rec !== 'object') return false;
      if (typeof rec.id !== 'string' || typeof rec.date !== 'string' || typeof rec.count !== 'number') return false;
      if (rec.count < 0 || rec.count > 70 || !Number.isInteger(rec.count)) return false;
    }
  }

  return true;
}

export async function importAllData(data: unknown): Promise<void> {
  if (!validateBackupData(data)) {
    throw new Error('ملف النسخ الاحتياطي غير صالح أو يحتوي على بيانات غير متطابقة');
  }

  await saveSettings(data.settings);
  await saveCounters(data.counters);

  const db = await getDB();
  const tx = db.transaction(STORES.RECORDS, 'readwrite');
  const store = tx.objectStore(STORES.RECORDS);
  await new Promise<void>((resolve, reject) => {
    const clearReq = store.clear();
    clearReq.onsuccess = () => resolve();
    clearReq.onerror = () => reject(clearReq.error);
  });

  if (Array.isArray(data.records)) {
    for (const record of data.records) {
      await saveDailyRecord(record);
    }
  }

  // Import istighfar records (backward compatible - old backups have none)
  const istighfarRecords = (data as Record<string, any>).istighfarRecords as IstighfarRecord[] | undefined;
  if (Array.isArray(istighfarRecords) && istighfarRecords.length > 0) {
    const txI = db.transaction(STORES.ISTIGHFAR, 'readwrite');
    const storeI = txI.objectStore(STORES.ISTIGHFAR);
    await new Promise<void>((resolve, reject) => {
      const clearReq = storeI.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });
    for (const record of istighfarRecords) {
      await saveIstighfarRecord(record);
    }
  }

  // Import istighfar data (backward compatible)
  const istighfarData = (data as Record<string, any>).istighfarData as IstighfarData | undefined;
  if (istighfarData && typeof istighfarData === 'object') {
    await saveIstighfarData(istighfarData);
  }
}

export async function resetAllData(): Promise<void> {
  try {
    localStorage.removeItem('qada_settings');
    localStorage.removeItem('qada_counters');
    localStorage.removeItem('qada_records');
    localStorage.removeItem('qada_istighfar');
    localStorage.removeItem('qada_istighfar_data');

    const db = await getDB();
    const tx = db.transaction([STORES.SETTINGS, STORES.COUNTERS, STORES.RECORDS, STORES.ISTIGHFAR, STORES.ISTIGHFAR_DATA], 'readwrite');
    tx.objectStore(STORES.SETTINGS).clear();
    tx.objectStore(STORES.COUNTERS).clear();
    tx.objectStore(STORES.RECORDS).clear();
    tx.objectStore(STORES.ISTIGHFAR).clear();
    tx.objectStore(STORES.ISTIGHFAR_DATA).clear();

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Error resetting database:', error);
  }
}
