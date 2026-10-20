import { supabase } from './supabase'

export type AdminContentKind = 'question' | 'notice' | 'resource'
export type AdminContentStatus = 'draft' | 'review' | 'published' | 'archived'
export type SupportStatus = 'open' | 'in_progress' | 'resolved'
export type SupportCategory = 'account' | 'study-data' | 'content' | 'technical' | 'other'

export type AdminContentItem = {
  id: string
  kind: AdminContentKind
  title: string
  content: Record<string, string | string[] | number>
  status: AdminContentStatus
  sourceTitle: string
  sourceUrl: string
  sourcePublishedAt: string
  replacesId: string
  createdAt: string
  updatedAt: string
}

export type SupportRequest = {
  id: string
  userId: string
  category: SupportCategory
  subject: string
  message: string
  status: SupportStatus
  adminResponse: string
  createdAt: string
  updatedAt: string
}

export type AdminContentRevision = {
  id: string
  version: number
  snapshot: {
    title?: string
    status?: AdminContentStatus
    content?: Record<string, string | string[] | number>
    source_title?: string | null
    source_url?: string | null
    source_published_at?: string | null
  }
  createdAt: string
}

export type AdminMetrics = {
  candidate_count: number | null
  mock_attempt_count: number | null
  published_question_count: number
  published_notice_count: number
  published_resource_count: number
  pending_review_count: number
  open_support_count: number
}

export type AdminContentInput = Omit<AdminContentItem, 'createdAt' | 'updatedAt'> & {
  createdBy: string
}

const contentStorageKey = 'appsc_admin_content_items'
const supportStorageKey = 'appsc_support_requests'
const revisionStorageKey = 'appsc_admin_content_revisions'

type ContentRow = {
  id: string
  kind: AdminContentKind
  title: string
  content: Record<string, string | string[] | number>
  status: AdminContentStatus
  source_title: string | null
  source_url: string | null
  source_published_at: string | null
  replaces_id: string | null
  created_at: string
  updated_at: string
}

type SupportRow = {
  id: string
  user_id: string
  category: SupportCategory
  subject: string
  message: string
  status: SupportStatus
  admin_response: string | null
  created_at: string
  updated_at: string
}

const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

const readStoredItems = <T,>(key: string): T[] => {
  const stored = window.localStorage.getItem(key)
  if (!stored) return []
  try {
    const value: unknown = JSON.parse(stored)
    if (!Array.isArray(value)) throw new Error('Expected a list of saved records.')
    return value as T[]
  } catch (error) {
    throw new Error(`Unable to read saved admin data (${key}): ${error instanceof Error ? error.message : 'invalid stored JSON'}`, { cause: error })
  }
}

const toContentItem = (row: ContentRow): AdminContentItem => ({
  id: row.id,
  kind: row.kind,
  title: row.title,
  content: row.content,
  status: row.status,
  sourceTitle: row.source_title ?? '',
  sourceUrl: row.source_url ?? '',
  sourcePublishedAt: row.source_published_at ?? '',
  replacesId: row.replaces_id ?? '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toSupportRequest = (row: SupportRow): SupportRequest => ({
  id: row.id,
  userId: row.user_id,
  category: row.category,
  subject: row.subject,
  message: row.message,
  status: row.status,
  adminResponse: row.admin_response ?? '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message)
}

export async function getAdminContent(options: { kind?: AdminContentKind; includeUnpublished?: boolean } = {}) {
  if (!supabase) {
    return readStoredItems<AdminContentItem>(contentStorageKey)
      .filter((item) => (!options.kind || item.kind === options.kind)
        && (options.includeUnpublished || item.status === 'published'))
      .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
  }

  let query = supabase.from('admin_content_items').select('*').order('updated_at', { ascending: false })
  if (options.kind) query = query.eq('kind', options.kind)
  if (!options.includeUnpublished) query = query.eq('status', 'published')
  const { data, error } = await query
  throwIfError(error)
  return ((data ?? []) as ContentRow[]).map(toContentItem)
}

export async function saveAdminContent(item: AdminContentInput) {
  const now = new Date().toISOString()
  if (!supabase) {
    const stored = readStoredItems<AdminContentItem>(contentStorageKey)
    const existing = stored.find((entry) => entry.id === item.id)
    const saved: AdminContentItem = {
      id: item.id || makeId(),
      kind: item.kind,
      title: item.title,
      content: item.content,
      status: item.status,
      sourceTitle: item.sourceTitle,
      sourceUrl: item.sourceUrl,
      sourcePublishedAt: item.sourcePublishedAt,
      replacesId: item.replacesId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    const archivedItems: AdminContentItem[] = []
    const nextItems = stored
      .filter((entry) => entry.id !== saved.id)
      .map((entry) => {
        if (saved.status !== 'published' || saved.replacesId !== entry.id || entry.status !== 'published') return entry
        const archived = { ...entry, status: 'archived' as const, updatedAt: now }
        archivedItems.push(archived)
        return archived
      })
    window.localStorage.setItem(contentStorageKey, JSON.stringify([saved, ...nextItems]))
    const revisions = readStoredItems<{ id: string; itemId: string; version: number; snapshot: AdminContentRevision['snapshot']; createdAt: string }>(revisionStorageKey)
    archivedItems.forEach((archived) => {
      revisions.unshift({
        id: makeId(),
        itemId: archived.id,
        version: revisions.filter((revision) => revision.itemId === archived.id).reduce((highest, revision) => Math.max(highest, revision.version), 0) + 1,
        snapshot: {
          title: archived.title,
          status: archived.status,
          content: archived.content,
          source_title: archived.sourceTitle,
          source_url: archived.sourceUrl,
          source_published_at: archived.sourcePublishedAt,
        },
        createdAt: now,
      })
    })
    revisions.unshift({
      id: makeId(),
      itemId: saved.id,
      version: revisions.filter((revision) => revision.itemId === saved.id).reduce((highest, revision) => Math.max(highest, revision.version), 0) + 1,
      snapshot: {
        title: saved.title,
        status: saved.status,
        content: saved.content,
        source_title: saved.sourceTitle,
        source_url: saved.sourceUrl,
        source_published_at: saved.sourcePublishedAt,
      },
      createdAt: now,
    })
    window.localStorage.setItem(revisionStorageKey, JSON.stringify(revisions))
    return saved
  }

  const { createdBy, ...content } = item
  const payload = {
    kind: content.kind,
    title: content.title,
    content: content.content,
    status: content.status,
    source_title: content.sourceTitle || null,
    source_url: content.sourceUrl || null,
    source_published_at: content.sourcePublishedAt || null,
    replaces_id: content.replacesId || null,
    updated_at: now,
    ...(content.status === 'published' ? { published_at: now, reviewed_by: createdBy } : {}),
  }
  const query = item.id
    ? supabase.from('admin_content_items').update(payload).eq('id', item.id)
    : supabase.from('admin_content_items').insert({ ...payload, kind: content.kind, created_by: createdBy })
  const { data, error } = await query.select('*').single()
  throwIfError(error)
  return toContentItem(data as ContentRow)
}

export async function getAdminContentRevisions(itemId: string): Promise<AdminContentRevision[]> {
  if (!supabase) {
    return readStoredItems<{ id: string; itemId: string; version: number; snapshot: AdminContentRevision['snapshot']; createdAt: string }>(revisionStorageKey)
      .filter((revision) => revision.itemId === itemId)
      .sort((first, second) => second.version - first.version)
  }
  const { data, error } = await supabase
    .from('admin_content_revisions')
    .select('id, version, snapshot, created_at')
    .eq('item_id', itemId)
    .order('version', { ascending: false })
  throwIfError(error)
  return (data ?? []).map((row) => ({
    id: row.id,
    version: row.version,
    snapshot: row.snapshot as AdminContentRevision['snapshot'],
    createdAt: row.created_at,
  }))
}

export async function deleteAdminContent(id: string) {
  if (!supabase) {
    const stored = readStoredItems<AdminContentItem>(contentStorageKey)
    window.localStorage.setItem(contentStorageKey, JSON.stringify(stored.filter((item) => item.id !== id)))
    const revisions = readStoredItems<{ itemId: string }>(revisionStorageKey)
    window.localStorage.setItem(revisionStorageKey, JSON.stringify(revisions.filter((revision) => revision.itemId !== id)))
    return
  }
  const { error } = await supabase.from('admin_content_items').delete().eq('id', id)
  throwIfError(error)
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const emptyMetrics: AdminMetrics = {
    candidate_count: null,
    mock_attempt_count: null,
    published_question_count: 0,
    published_notice_count: 0,
    published_resource_count: 0,
    pending_review_count: 0,
    open_support_count: 0,
  }
  if (!supabase) {
    const items = readStoredItems<AdminContentItem>(contentStorageKey)
    const requests = readStoredItems<SupportRequest>(supportStorageKey)
    return {
      ...emptyMetrics,
      published_question_count: items.filter((item) => item.kind === 'question' && item.status === 'published').length,
      published_notice_count: items.filter((item) => item.kind === 'notice' && item.status === 'published').length,
      published_resource_count: items.filter((item) => item.kind === 'resource' && item.status === 'published').length,
      pending_review_count: items.filter((item) => item.status === 'review').length,
      open_support_count: requests.filter((request) => request.status !== 'resolved').length,
    }
  }
  const { data, error } = await supabase.rpc('get_admin_dashboard_metrics')
  throwIfError(error)
  return { ...emptyMetrics, ...(data as Partial<AdminMetrics>) }
}

export async function submitSupportRequest(input: {
  userId: string
  category: SupportCategory
  subject: string
  message: string
}) {
  const now = new Date().toISOString()
  if (!supabase) {
    const requests = readStoredItems<SupportRequest>(supportStorageKey)
    const request: SupportRequest = {
      id: makeId(),
      userId: input.userId,
      category: input.category,
      subject: input.subject,
      message: input.message,
      status: 'open',
      adminResponse: '',
      createdAt: now,
      updatedAt: now,
    }
    window.localStorage.setItem(supportStorageKey, JSON.stringify([request, ...requests]))
    return request
  }
  const { data, error } = await supabase.from('support_requests').insert({
    user_id: input.userId,
    category: input.category,
    subject: input.subject,
    message: input.message,
  }).select('*').single()
  throwIfError(error)
  return toSupportRequest(data as SupportRow)
}

export async function getSupportRequests(userId: string, isAdmin: boolean) {
  if (!supabase) {
    return readStoredItems<SupportRequest>(supportStorageKey)
      .filter((request) => isAdmin || request.userId === userId)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
  }
  let query = supabase.from('support_requests').select('*').order('created_at', { ascending: false })
  if (!isAdmin) query = query.eq('user_id', userId)
  const { data, error } = await query
  throwIfError(error)
  return ((data ?? []) as SupportRow[]).map(toSupportRequest)
}

export async function updateSupportRequest(request: SupportRequest) {
  const now = new Date().toISOString()
  if (!supabase) {
    const requests = readStoredItems<SupportRequest>(supportStorageKey)
    const updated = { ...request, updatedAt: now }
    window.localStorage.setItem(supportStorageKey, JSON.stringify(requests.map((item) => item.id === request.id ? updated : item)))
    return updated
  }
  const { data, error } = await supabase.from('support_requests').update({
    status: request.status,
    admin_response: request.adminResponse,
    updated_at: now,
  }).eq('id', request.id).select('*').single()
  throwIfError(error)
  return toSupportRequest(data as SupportRow)
}
