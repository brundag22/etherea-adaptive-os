import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const DB_NAME = 'etherea_offline_memory'
const DB_VERSION = 1
const MESSAGE_STORE = 'messages'
const AID_STORE = 'teachingAids'

const OfflineMemoryContext = createContext(null)

const openMemoryDB = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(MESSAGE_STORE)) {
        db.createObjectStore(MESSAGE_STORE, { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains(AID_STORE)) {
        db.createObjectStore(AID_STORE, { keyPath: 'id', autoIncrement: true })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const runTx = (db, storeName, mode, action) =>
  new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const req = action(store)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

export function OfflineMemoryProvider({ children }) {
  const [db, setDb] = useState(null)

  useEffect(() => {
    let mounted = true
    openMemoryDB()
      .then((database) => {
        if (mounted) setDb(database)
      })
      .catch(() => {
        if (mounted) setDb(null)
      })

    return () => {
      mounted = false
    }
  }, [])

  const saveMessage = useCallback(
    async (entry) => {
      if (!db) return null
      return runTx(db, MESSAGE_STORE, 'readwrite', (store) => store.add({ ...entry, createdAt: Date.now() }))
    },
    [db]
  )

  const saveTeachingAid = useCallback(
    async (aid) => {
      if (!db) return null
      return runTx(db, AID_STORE, 'readwrite', (store) => store.add({ ...aid, createdAt: Date.now() }))
    },
    [db]
  )

  const getLatestTeachingAid = useCallback(async () => {
    if (!db) return null
    const all = await runTx(db, AID_STORE, 'readonly', (store) => store.getAll())
    if (!all?.length) return null
    return all.sort((a, b) => b.createdAt - a.createdAt)[0]
  }, [db])

  const getLatestMessages = useCallback(async (limit = 20) => {
    if (!db) return []
    const all = await runTx(db, MESSAGE_STORE, 'readonly', (store) => store.getAll())
    return all.sort((a, b) => a.createdAt - b.createdAt).slice(-limit)
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
