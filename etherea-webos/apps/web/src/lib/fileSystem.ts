const DB_NAME = 'etherea-notes-fs';
const STORE_NAME = 'files';
const DB_VERSION = 1;
const FALLBACK_KEY = 'etherea.notes.fs.v1';
const ALLOWED_EXTENSIONS = ['.md', '.txt', '.json'] as const;
export const STORAGE_ERROR_EVENT = 'etherea:storage-error';

let indexedDbReadyLogged = false;

export type OfflineFile = {
  filename: string;
  content: string;
  updatedAt: number;
};

function supportsIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function allowedExtension(filename: string) {
  const normalized = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.some((extension) => normalized.endsWith(extension));
}

function normalizeFilename(filename: string) {
  return filename.trim().replace(/^\/+/, '').replace(/\/+/g, '/');
}

function ensureWorkspace(filename: string, approvedWorkspaces: string[]) {
  const [workspace] = filename.split('/');
  const approved = approvedWorkspaces.map((item) => item.toLowerCase());
  if (!workspace || !approved.includes(workspace.toLowerCase())) {
    throw new Error('Access denied: filename must be scoped to an approved workspace root.');
  }
}

function validateFilename(filename: string, approvedWorkspaces: string[]) {
  const normalized = normalizeFilename(filename);

  if (!normalized || normalized.includes('..')) {
    throw new Error('Invalid filename.');
  }

  ensureWorkspace(normalized, approvedWorkspaces);

  if (!allowedExtension(normalized)) {
    throw new Error('Extension denied. Allowed extensions: .md, .txt, .json');
  }

  return normalized;
}

async function withDb<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'filename' });
      }
    };

    request.onsuccess = async () => {
      if (!indexedDbReadyLogged) {
        console.log('[Etherea DB] IndexedDB initialized successfully.');
        indexedDbReadyLogged = true;
      }
      try {
        resolve(await fn(request.result));
      } catch (error) {
        reject(error);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

function emitStorageError(context: string, error: unknown) {
  console.error(`[Etherea DB] ${context}`, error);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(STORAGE_ERROR_EVENT, {
        detail: {
          message: `${context} Falling back to local storage.`,
        },
      }),
    );
  }
}

function readFallback(): OfflineFile[] {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_KEY) ?? '[]') as OfflineFile[];
  } catch {
    return [];
  }
}

function writeFallback(files: OfflineFile[]) {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(files));
}

export async function create_file(filename: string, content: string, approvedWorkspaces: string[]): Promise<OfflineFile> {
  const validatedFilename = validateFilename(filename, approvedWorkspaces);
  const next: OfflineFile = { filename: validatedFilename, content, updatedAt: Date.now() };

  const existing = await get_file(validatedFilename, approvedWorkspaces);
  if (existing) {
    throw new Error(`File already exists: ${validatedFilename}`);
  }

  if (!supportsIndexedDb()) {
    const rows = readFallback();
    rows.push(next);
    writeFallback(rows);
    return next;
  }

  await withDb(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(next);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  ).catch((error) => {
    emitStorageError('IndexedDB write failed during create_file.', error);
    const rows = readFallback();
    rows.push(next);
    writeFallback(rows);
  });

  return next;
}

export async function edit_file(filename: string, content: string, approvedWorkspaces: string[]): Promise<OfflineFile> {
  const validatedFilename = validateFilename(filename, approvedWorkspaces);
  const existing = await get_file(validatedFilename, approvedWorkspaces);

  if (!existing) {
    throw new Error(`File not found: ${validatedFilename}`);
  }

  const next: OfflineFile = { ...existing, content, updatedAt: Date.now() };

  if (!supportsIndexedDb()) {
    const rows = readFallback().map((row) => (row.filename === validatedFilename ? next : row));
    writeFallback(rows);
    return next;
  }

  await withDb(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(next);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  ).catch((error) => {
    emitStorageError('IndexedDB write failed during edit_file.', error);
    const rows = readFallback().map((row) => (row.filename === validatedFilename ? next : row));
    writeFallback(rows);
  });

  return next;
}

export async function get_file(filename: string, approvedWorkspaces: string[]): Promise<OfflineFile | null> {
  const validatedFilename = validateFilename(filename, approvedWorkspaces);

  if (!supportsIndexedDb()) {
    return readFallback().find((row) => row.filename === validatedFilename) ?? null;
  }

  return withDb(
    (db) =>
      new Promise<OfflineFile | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).get(validatedFilename);
        request.onsuccess = () => resolve((request.result as OfflineFile | undefined) ?? null);
        request.onerror = () => reject(request.error);
      }),
  ).catch((error) => {
    emitStorageError('IndexedDB read failed during get_file.', error);
    return readFallback().find((row) => row.filename === validatedFilename) ?? null;
  });
}

export async function list_files(approvedWorkspaces: string[]): Promise<OfflineFile[]> {
  const workspaceSet = new Set(approvedWorkspaces.map((item) => item.toLowerCase()));

  const scoped = (files: OfflineFile[]) =>
    files
      .filter((file) => workspaceSet.has(file.filename.split('/')[0]?.toLowerCase() ?? ''))
      .sort((a, b) => b.updatedAt - a.updatedAt);

  if (!supportsIndexedDb()) {
    return scoped(readFallback());
  }

  const rows = await withDb(
    (db) =>
      new Promise<OfflineFile[]>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve((request.result as OfflineFile[]) ?? []);
        request.onerror = () => resolve([]);
      }),
  ).catch((error) => {
    emitStorageError('IndexedDB read failed during list_files.', error);
    return readFallback();
  });

  return scoped(rows);
}
