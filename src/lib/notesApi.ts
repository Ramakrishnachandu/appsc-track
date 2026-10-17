import { supabase } from './supabase'
import type { MockPaperType } from '../data/dashboardData'

export type UserNote = {
  id: string
  userId: string
  subjectId: string
  subjectName: string
  paperType: MockPaperType
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export type NotePayload = {
  id?: string
  title: string
  content: string
  subjectId: string
  subjectName: string
  paperType: MockPaperType
}

const NOTES_STORAGE_KEY = 'appsc_user_notes'

const getLocalStorageKey = (userId: string) => `${NOTES_STORAGE_KEY}_${userId || 'demo-user'}`

const normalizeNote = (record: Record<string, any> | null | undefined): UserNote | null => {
  if (!record) return null

  return {
    id: String(record.id ?? `note-${Date.now()}`),
    userId: String(record.user_id ?? record.userId ?? 'demo-user'),
    subjectId: String(record.subject_id ?? record.subjectId ?? 'general-topic'),
    subjectName: String(record.subject_name ?? record.subjectName ?? 'General'),
    paperType: record.paper_type === 'Mains' || record.paperType === 'Mains' ? 'Mains' : 'Prelims',
    title: String(record.title ?? 'Untitled note'),
    content: String(record.content ?? ''),
    createdAt: String(record.created_at ?? record.createdAt ?? new Date().toISOString()),
    updatedAt: String(record.updated_at ?? record.updatedAt ?? new Date().toISOString()),
  }
}

export const getUserNotes = async (userId: string): Promise<UserNote[]> => {
  if (supabase && userId && userId !== 'demo-user') {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (!error && Array.isArray(data)) {
        const mapped = data.map((row) => normalizeNote(row)).filter(Boolean) as UserNote[]
        if (typeof window !== 'undefined') {
          localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(mapped))
        }
        return mapped
      }
    } catch {
      // fallback to local storage below
    }
  }

  if (typeof window === 'undefined') {
    return []
  }

  const key = getLocalStorageKey(userId)
  const raw = window.localStorage.getItem(key)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as Record<string, any>[]
    return parsed.map((item) => normalizeNote(item)).filter(Boolean) as UserNote[]
  } catch {
    return []
  }
}

export const saveUserNote = async (userId: string, payload: NotePayload): Promise<UserNote> => {
  const existingNotes = typeof window !== 'undefined'
    ? (JSON.parse(window.localStorage.getItem(getLocalStorageKey(userId)) ?? '[]') as Record<string, any>[])
    : []
  const existingNote = existingNotes.find((item) => item.id === payload.id)

  const nextNote: UserNote = {
    id: payload.id ?? `note-${Date.now()}`,
    userId,
    subjectId: payload.subjectId,
    subjectName: payload.subjectName,
    paperType: payload.paperType,
    title: payload.title.trim() || 'Untitled note',
    content: payload.content.trim(),
    createdAt: existingNote?.createdAt ?? existingNote?.created_at ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (supabase && userId && userId !== 'demo-user') {
    try {
      const { data, error } = await supabase
        .from('notes')
        .upsert(
          {
            id: nextNote.id,
            user_id: userId,
            title: nextNote.title,
            content: nextNote.content,
            subject_id: nextNote.subjectId,
            subject_name: nextNote.subjectName,
            paper_type: nextNote.paperType,
            created_at: nextNote.createdAt,
            updated_at: nextNote.updatedAt,
          },
          { onConflict: 'id' },
        )
        .select()
        .single()

      if (!error && data) {
        const mapped = normalizeNote(data)
        if (mapped) {
          const stored = await getUserNotes(userId)
          const merged = [mapped, ...stored.filter((item) => item.id !== mapped.id)].slice(0, 40)
          if (typeof window !== 'undefined') {
            localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(merged))
          }
          return mapped
        }
      }
    } catch {
      // fallback below
    }
  }

  if (typeof window !== 'undefined') {
    const key = getLocalStorageKey(userId)
    const current = JSON.parse(window.localStorage.getItem(key) ?? '[]') as Record<string, any>[]
    const existingIndex = current.findIndex((item) => item.id === nextNote.id)

    if (existingIndex >= 0) {
      current[existingIndex] = nextNote
    } else {
      current.unshift(nextNote)
    }

    window.localStorage.setItem(key, JSON.stringify(current.slice(0, 40)))
  }

  return nextNote
}

export const deleteUserNote = async (userId: string, noteId: string): Promise<boolean> => {
  if (supabase && userId && userId !== 'demo-user') {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', noteId).eq('user_id', userId)
      if (!error) {
        if (typeof window !== 'undefined') {
          const key = getLocalStorageKey(userId)
          const current = JSON.parse(localStorage.getItem(key) ?? '[]') as Record<string, any>[]
          const next = current.filter((note) => note.id !== noteId)
          localStorage.setItem(key, JSON.stringify(next))
        }
        return true
      }
    } catch {
      // fallback below
    }
  }

  if (typeof window !== 'undefined') {
    const key = getLocalStorageKey(userId)
    const current = JSON.parse(window.localStorage.getItem(key) ?? '[]') as Record<string, any>[]
    const next = current.filter((item) => item.id !== noteId)
    window.localStorage.setItem(key, JSON.stringify(next))
  }

  return true
}
