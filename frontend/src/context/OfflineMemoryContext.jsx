import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const DB_NAME = 'etherea_offline_memory'
const DB_VERSION = 1
const MESSAGE_STORE = 'messages'
const AID_STORE = 'teachingAids'

const OFFLINE_PLACEHOLDER_AID = {
  id: 'offline-placeholder',
  title: 'Offline Co-Pilot Placeholder',
  markdown: '# Offline Ready\n- Memory cache is unavailable right now\n- Keep working; I will keep your panel interactive\n- Ask for hints to continue learning momentum',
  chart: [
    { label: 'Resilience', value: 100 },
    { label: 'Continuity', value: 92 },
    { label: 'Focus', value: 88 }
  ],
  surprise: 'Memory fallback active. I can still scaffold your next step.',
  createdAt: 0,
  placeholder: true
}

const OfflineMemoryContext = createContext(null)

const isRecoverableIDBError = (error) => {
  const name = error?.name || ''
  return name === 'ConstraintError' || name === 'NotReadableError'
}

const openMemoryDB = () =>
  new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB unavailable'))
        return
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        try {
          const db = request.result
          if (!db.objectStoreNames.contains(MESSAGE_STORE)) {
            db.createObjectStore(MESSAGE_STORE, { keyPath: 'id', autoIncrement: true })
          }
          if (!db.objectStoreNames.contains(AID_STORE)) {
            db.createObjectStore(AID_STORE, { keyPath: 'id', autoIncrement: true })
          }
        } catch (error) {
          reject(error)
        }
      }

      request.onblocked = () => reject(new Error('IndexedDB open blocked by another tab/session'))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    } catch (error) {
      reject(error)
    }
  })

const runTx = (db, storeName, mode, action) =>
  new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, mode)
      const store = tx.objectStore(storeName)
      const req = action(store)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
      tx.onerror = () => reject(tx.error)
    } catch (error) {
      reject(error)
    }
  })

export function OfflineMemoryProvider({ children }) {
  const [db, setDb] = useState(null)
  const [fallbackAid, setFallbackAid] = useState(OFFLINE_PLACEHOLDER_AID)

  useEffect(() => {
    let mounted = true
    openMemoryDB()
      .then((database) => {
        if (mounted) setDb(database)
      })
      .catch((error) => {
        console.warn('[OfflineMemory] Falling back to placeholder cache.', error)
        if (mounted) {
          setDb(null)
          setFallbackAid((prev) => ({ ...prev, createdAt: Date.now(), reason: error?.name || 'open_failed' }))
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const saveMessage = useCallback(
    async (entry) => {
      if (!db) return null
      try {
        return await runTx(db, MESSAGE_STORE, 'readwrite', (store) => store.add({ ...entry, createdAt: Date.now() }))
      } catch (error) {
        if (isRecoverableIDBError(error)) return null
        throw error
      }
    },
    [db]
  )

  const saveTeachingAid = useCallback(
    async (aid) => {
      if (!db) return null
      try {
        return await runTx(db, AID_STORE, 'readwrite', (store) => store.add({ ...aid, createdAt: Date.now() }))
      } catch (error) {
        if (isRecoverableIDBError(error)) {
          setFallbackAid({ ...aid, createdAt: Date.now(), placeholder: true })
          return null
        }
        throw error
      }
    },
    [db]
  )

  const getLatestTeachingAid = useCallback(async () => {
    if (!db) return fallbackAid

    try {
      const all = await runTx(db, AID_STORE, 'readonly', (store) => store.getAll())
      if (!all?.length) return fallbackAid
      return all.sort((a, b) => b.createdAt - a.createdAt)[0]
    } catch (error) {
      if (isRecoverableIDBError(error)) return fallbackAid
      return fallbackAid
    }
  }, [db, fallbackAid])

  const getLatestMessages = useCallback(async (limit = 20) => {
    if (!db) return []
    try {
      const all = await runTx(db, MESSAGE_STORE, 'readonly', (store) => store.getAll())
      return all.sort((a, b) => a.createdAt - b.createdAt).slice(-limit)
    } catch (error) {
      if (isRecoverableIDBError(error)) return []
      return []
    }
  }, [db])

  const value = useMemo(
    () => ({ saveMessage, saveTeachingAid, getLatestTeachingAid, getLatestMessages }),
    [getLatestMessages, getLatestTeachingAid, saveMessage, saveTeachingAid]
  )

  return <OfflineMemoryContext.Provider value={value}>{children}</OfflineMemoryContext.Provider>
}

export const useOfflineMemory = () => {
  const context = useContext(OfflineMemoryContext)
  if (!context) {
    throw new Error('useOfflineMemory must be used within OfflineMemoryProvider')
  }
  return context
}
