import { supabase } from './supabase'
import type { MockPaperType } from '../data/dashboardData'

export type UserNote = {
  id: string
  userId: string
  subjectId: string
  subjectName: string
  paperType: MockPaperType
  kind: 'revision' | 'current-affairs'
  title: string
  content: string
  topicId: string | null
  sourceTitle: string | null
  sourceUrl: string | null
  sourcePublishedAt: string | null
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
  kind: 'revision' | 'current-affairs'
  topicId?: string | null
  sourceTitle?: string | null
  sourceUrl?: string | null
  sourcePublishedAt?: string | null
}

const NOTES_STORAGE_KEY = 'appsc_user_notes'

const getLocalStorageKey = (userId: string) => `${NOTES_STORAGE_KEY}_${userId || 'demo-user'}`

const isValidUuid = (value?: string | null): boolean => {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const normalizeNote = (record: Record<string, unknown> | null | undefined): UserNote | null => {
  if (!record) return null

  return {
    id: String(record.id ?? generateUuid()),
    userId: String(record.user_id ?? record.userId ?? 'demo-user'),
    subjectId: String(record.subject_id ?? record.subjectId ?? 'general-topic'),
    subjectName: String(record.subject_name ?? record.subjectName ?? 'General'),
    paperType: record.paper_type === 'Mains' || record.paperType === 'Mains' ? 'Mains' : 'Prelims',
    kind: record.kind === 'current-affairs' ? 'current-affairs' : 'revision',
    title: String(record.title ?? 'Untitled note'),
    content: String(record.content ?? ''),
    topicId: record.topic_id == null && record.topicId == null ? null : String(record.topic_id ?? record.topicId),
    sourceTitle: record.source_title == null && record.sourceTitle == null ? null : String(record.source_title ?? record.sourceTitle),
    sourceUrl: record.source_url == null && record.sourceUrl == null ? null : String(record.source_url ?? record.sourceUrl),
    sourcePublishedAt: record.source_published_at == null && record.sourcePublishedAt == null
      ? null
      : String(record.source_published_at ?? record.sourcePublishedAt),
    createdAt: String(record.created_at ?? record.createdAt ?? new Date().toISOString()),
    updatedAt: String(record.updated_at ?? record.updatedAt ?? new Date().toISOString()),
  }
}

export const getUserNotes = async (userId: string): Promise<UserNote[]> => {
  if (supabase && userId && userId !== 'demo-user') {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    if (!Array.isArray(data)) throw new Error('The notes service returned an invalid response.')
    const mapped = data.map((row) => normalizeNote(row)).filter((note): note is UserNote => note !== null)
    if (typeof window !== 'undefined') {
      localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(mapped))
    }
    return mapped
  }

  if (typeof window === 'undefined') {
    return []
  }

  const key = getLocalStorageKey(userId)
  const raw = window.localStorage.getItem(key)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>[]
    if (!Array.isArray(parsed)) throw new Error('The saved notes cache has an invalid format.')
    return parsed.map((item) => normalizeNote(item)).filter((note): note is UserNote => note !== null)
  } catch (error) {
    throw new Error(`Unable to read saved notes: ${error instanceof Error ? error.message : 'invalid data'}`, { cause: error })
  }
}

export const saveUserNote = async (userId: string, payload: NotePayload): Promise<UserNote> => {
  const parsedNotes: unknown = typeof window !== 'undefined'
    ? JSON.parse(window.localStorage.getItem(getLocalStorageKey(userId)) ?? '[]')
    : []
  if (!Array.isArray(parsedNotes)) throw new Error('The saved notes cache has an invalid format.')
  const existingNotes = parsedNotes.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
  const existingNote = existingNotes.find((item) => item.id === payload.id)
  const noteId = payload.id && isValidUuid(payload.id) ? payload.id : generateUuid()

  const nextNote: UserNote = {
    id: noteId,
    userId,
    subjectId: payload.subjectId,
    subjectName: payload.subjectName,
    paperType: payload.paperType,
    kind: payload.kind,
    title: payload.title.trim() || 'Untitled note',
    content: payload.content.trim(),
    topicId: payload.topicId ?? null,
    sourceTitle: payload.sourceTitle?.trim() || null,
    sourceUrl: payload.sourceUrl?.trim() || null,
    sourcePublishedAt: payload.sourcePublishedAt || null,
    createdAt: typeof existingNote?.createdAt === 'string'
      ? existingNote.createdAt
      : typeof existingNote?.created_at === 'string'
        ? existingNote.created_at
        : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (supabase && userId && userId !== 'demo-user') {
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
          kind: nextNote.kind,
          topic_id: nextNote.topicId,
          source_title: nextNote.sourceTitle,
          source_url: nextNote.sourceUrl,
          source_published_at: nextNote.sourcePublishedAt,
          created_at: nextNote.createdAt,
          updated_at: nextNote.updatedAt,
        },
        { onConflict: 'id' },
      )
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('The notes service did not confirm the saved note.')
    const mapped = normalizeNote(data)
    if (!mapped) throw new Error('The saved note could not be read back from the notes service.')
    const stored = await getUserNotes(userId)
    const merged = [mapped, ...stored.filter((item) => item.id !== mapped.id)].slice(0, 40)
    if (typeof window !== 'undefined') {
      localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(merged))
    }
    return mapped
  }

  if (typeof window !== 'undefined') {
    const key = getLocalStorageKey(userId)
    const current = JSON.parse(window.localStorage.getItem(key) ?? '[]') as Record<string, unknown>[]
    if (!Array.isArray(current)) throw new Error('The saved notes cache has an invalid format.')
    // Replace by either old ID or new note ID
    const existingIndex = current.findIndex((item) => item.id === payload.id || item.id === nextNote.id)

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
    if (isValidUuid(noteId)) {
      const { error } = await supabase.from('notes').delete().eq('id', noteId).eq('user_id', userId)
      if (error) throw error
    }
  }

  if (typeof window !== 'undefined') {
    const key = getLocalStorageKey(userId)
    const current = JSON.parse(window.localStorage.getItem(key) ?? '[]') as Record<string, unknown>[]
    if (!Array.isArray(current)) throw new Error('The saved notes cache has an invalid format.')
    const next = current.filter((item) => item.id !== noteId)
    window.localStorage.setItem(key, JSON.stringify(next))
  }

  return true
}
