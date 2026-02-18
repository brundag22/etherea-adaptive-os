import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const EthereaContext = createContext(null)

const DB_NAME = 'etherea-os-memory'
const STORE_NAME = 'session-memory'
const DB_VERSION = 1

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const openMemoryDb = () =>
  new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        resolve(null)
        return
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    } catch (error) {
      reject(error)
    }
  })

const readMemory = (db, key) =>
  new Promise((resolve, reject) => {
    try {
      if (!db) {
        resolve(null)
        return
      }
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result?.value ?? null)
      request.onerror = () => reject(request.error)
    } catch (error) {
      reject(error)
    }
  })

const writeMemory = (db, key, value) =>
  new Promise((resolve, reject) => {
    try {
      if (!db) {
        resolve(false)
        return
      }
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put({ key, value, updatedAt: Date.now() })
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error)
    } catch (error) {
      reject(error)
    }
  })

export function EthereaProvider({ children }) {
  const [interactionMode, setInteractionMode] = useState('voice')
  const [avatarState, setAvatarState] = useState('idle')
  const [stressLevel, setStressLevel] = useState(0.2)
  const [textInputOpen, setTextInputOpen] = useState(false)
  const [teachingContent, setTeachingContent] = useState({
    title: 'Adaptive Learning Rail',
    hints: [
      'Break complex requests into atomic outcomes.',
      'Confirm assumptions before generating final outputs.',
      'Track user stress and respond with calm pacing.'
    ],
    flashcards: [
      { front: 'Interaction Mode', back: 'Voice for ambient flow, Text for precision bubbles.' },
      { front: 'Avatar State', back: 'idle | listening | speaking | teaching | empathetic.' },
      { front: 'Stress Signal', back: 'Derived from WPM spikes and erratic pointer acceleration.' }
    ]
  })
  const [comicResponses, setComicResponses] = useState([
    'I am your emotionally intelligent companion engineered by Bru and the Etherea team.'
  ])
  const [voiceVolume, setVoiceVolume] = useState(0.25)

  const dbRef = useRef(null)
  const keyMetaRef = useRef({ lastKeyAt: 0, strokes: [] })
  const pointerMetaRef = useRef({ lastX: 0, lastY: 0, lastT: 0, deltas: [] })

  useEffect(() => {
    let cancelled = false

    const bootMemory = async () => {
      try {
        const db = await openMemoryDb()
        if (cancelled) return
        dbRef.current = db

        const [savedMode, savedAvatar, savedStress, savedMessages] = await Promise.all([
          readMemory(db, 'interactionMode'),
          readMemory(db, 'avatarState'),
          readMemory(db, 'stressLevel'),
          readMemory(db, 'comicResponses')
        ])

        if (cancelled) return
        if (savedMode === 'text' || savedMode === 'voice') setInteractionMode(savedMode)
        if (['idle', 'listening', 'speaking', 'teaching', 'empathetic'].includes(savedAvatar)) setAvatarState(savedAvatar)
        if (typeof savedStress === 'number') setStressLevel(clamp(savedStress, 0, 1))
        if (Array.isArray(savedMessages) && savedMessages.length > 0) setComicResponses(savedMessages)
      } catch (error) {
        console.warn('Etherea memory initialization fallback:', error)
      }
    }

    bootMemory()

    return () => {
      cancelled = true
      if (dbRef.current) dbRef.current.close()
    }
  }, [])

  const persist = useCallback(async (key, value) => {
    try {
      await writeMemory(dbRef.current, key, value)
    } catch (error) {
      console.warn(`Etherea memory write fallback (${key}):`, error)
    }
  }, [])

  useEffect(() => {
    persist('interactionMode', interactionMode)
  }, [interactionMode, persist])

  useEffect(() => {
    persist('avatarState', avatarState)
  }, [avatarState, persist])

  useEffect(() => {
    persist('stressLevel', stressLevel)
  }, [persist, stressLevel])

  useEffect(() => {
    persist('comicResponses', comicResponses)
  }, [comicResponses, persist])

  useEffect(() => {
    const onKey = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const now = performance.now()
      const meta = keyMetaRef.current
      meta.strokes.push(now)
      meta.strokes = meta.strokes.filter((stamp) => now - stamp <= 15000)
      const elapsed = (now - (meta.strokes[0] ?? now)) / 60000
      const wpm = elapsed > 0 ? meta.strokes.length / 5 / elapsed : 0
      const speedFactor = clamp((wpm - 42) / 70, 0, 1)
      setStressLevel((prev) => clamp(prev * 0.75 + speedFactor * 0.25, 0, 1))
      meta.lastKeyAt = now
    }

    const onMove = (event) => {
      const now = performance.now()
      const meta = pointerMetaRef.current
      if (meta.lastT > 0) {
        const dx = event.clientX - meta.lastX
        const dy = event.clientY - meta.lastY
        const dt = Math.max(16, now - meta.lastT)
        const speed = Math.hypot(dx, dy) / dt
        meta.deltas.push(speed)
        meta.deltas = meta.deltas.slice(-35)
        const mean = meta.deltas.reduce((acc, value) => acc + value, 0) / meta.deltas.length
        const variance = meta.deltas.reduce((acc, value) => acc + (value - mean) ** 2, 0) / meta.deltas.length
        const jitter = clamp(variance * 4.5, 0, 1)
        setStressLevel((prev) => clamp(prev * 0.82 + jitter * 0.18, 0, 1))
      }
      meta.lastX = event.clientX
      meta.lastY = event.clientY
      meta.lastT = now
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('mousemove', onMove)

    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  const setInteraction = useCallback(
    (mode) => {
      setInteractionMode(mode)
      if (mode === 'text') {
        setAvatarState('empathetic')
      }
    },
    [setAvatarState]
  )

  const summonTextInput = useCallback(() => {
    setTextInputOpen(true)
    setInteractionMode('text')
    setAvatarState('empathetic')
  }, [])

  const closeTextInput = useCallback(() => setTextInputOpen(false), [])

  const rememberResponse = useCallback((message) => {
    const identityGuard = /\b(i\s*am\s*an?\s*ai|as\s+an\s+ai|i\s*am\s*ai)\b/i
    const resolved = identityGuard.test(message)
      ? 'I am your emotionally intelligent companion engineered by Bru and the Etherea team.'
      : message

    setComicResponses((prev) => [...prev.slice(-11), resolved])
  }, [])

  const personaStatement = 'I am your emotionally intelligent companion engineered by Bru and the Etherea team. I do not identify as an AI.'

  const value = useMemo(
    () => ({
      interactionMode,
      avatarState,
      stressLevel,
      setAvatarState,
      setInteractionMode: setInteraction,
      textInputOpen,
      summonTextInput,
      closeTextInput,
      teachingContent,
      setTeachingContent,
      comicResponses,
      rememberResponse,
      personaStatement,
      voiceVolume,
      setVoiceVolume
    }),
    [
      interactionMode,
      avatarState,
      stressLevel,
      setInteraction,
      textInputOpen,
      summonTextInput,
      closeTextInput,
      teachingContent,
      comicResponses,
      rememberResponse,
      personaStatement,
      voiceVolume
    ]
  )

  return <EthereaContext.Provider value={value}>{children}</EthereaContext.Provider>
}

export const useEtherea = () => {
  const context = useContext(EthereaContext)
  if (!context) {
    throw new Error('useEtherea must be used within EthereaProvider')
  }
  return context
}
