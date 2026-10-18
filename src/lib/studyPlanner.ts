import { getAllSyllabusTopics } from '../data/group2Syllabus'
import type {
  ActiveStudyTimer,
  PlanSession,
  PlanSessionKind,
  PreparationLevel,
  StudyPlanData,
  StudyPlanSettings,
  StudyPlanPeriod,
  SyllabusTopic,
  TopicProgress,
} from '../types/studyPlanner'

export const REVISION_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const
export const DEFAULT_DAILY_HOURS = 4

export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const addDaysToDateKey = (dateKey: string, days: number) => {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return getLocalDateKey(date)
}

export const getPlanPeriodRange = (period: StudyPlanPeriod, anchorDate = getLocalDateKey()) => {
  const start = new Date(`${anchorDate}T12:00:00`)
  const startDay = period === 'week' ? (start.getDay() + 6) % 7 : 0

  if (period === 'all') return { start: '0000-01-01', end: '9999-12-31' }
  if (period === 'today') return { start: anchorDate, end: anchorDate }

  if (period === 'week') {
    start.setDate(start.getDate() - startDay)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return { start: getLocalDateKey(start), end: getLocalDateKey(end) }
  }

  const monthStart = new Date(start.getFullYear(), start.getMonth(), 1)
  const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0)
  return { start: getLocalDateKey(monthStart), end: getLocalDateKey(monthEnd) }
}

const createId = (prefix: string) => {
  const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${value}`
}

export const createDefaultStudyPlanSettings = (date = new Date()): StudyPlanSettings => ({
  level: 'beginner',
  medium: 'bilingual',
  dailyHours: DEFAULT_DAILY_HOURS,
  startDate: getLocalDateKey(date),
  targetDate: null,
})

export const createTopicProgress = (topic: SyllabusTopic): TopicProgress => ({
  topicId: topic.id,
  status: 'not-started',
  completionPercent: 0,
  actualSeconds: 0,
  difficulty: topic.difficulty,
  priority: topic.priority,
  notes: '',
  bookmarked: false,
  confidence: null,
  revisionStage: 0,
  nextRevisionDate: null,
  lastStudiedAt: null,
})

const getLevelDurationFactor = (level: PreparationLevel) => {
  if (level === 'beginner') return 1.2
  if (level === 'advanced') return 0.9
  return 1
}

const createSessionsForTopics = (
  topics: SyllabusTopic[],
  settings: StudyPlanSettings,
  firstDate: string,
): PlanSession[] => {
  const capacity = Math.max(30, Math.round(settings.dailyHours * 60))
  const durationFactor = getLevelDurationFactor(settings.level)
  const dailyLoad = new Map<string, number>()
  const sessions: PlanSession[] = []
  let currentDate = firstDate

  for (const topic of topics) {
    let remainingMinutes = Math.max(15, Math.round(topic.estimatedMinutes * durationFactor))

    while (remainingMinutes > 0) {
      const usedToday = dailyLoad.get(currentDate) ?? 0
      if (usedToday >= capacity) {
        currentDate = addDaysToDateKey(currentDate, 1)
        continue
      }

      const plannedMinutes = Math.min(remainingMinutes, capacity - usedToday)
      sessions.push({
        id: createId('plan'),
        topicId: topic.id,
        date: currentDate,
        kind: 'learn',
        plannedMinutes,
        status: 'planned',
        createdAt: new Date().toISOString(),
      })
      dailyLoad.set(currentDate, usedToday + plannedMinutes)
      remainingMinutes -= plannedMinutes

      if (remainingMinutes > 0) {
        currentDate = addDaysToDateKey(currentDate, 1)
      }
    }
  }

  return sessions
}

export const createInitialStudyPlan = (
  settings = createDefaultStudyPlanSettings(),
  topics = getAllSyllabusTopics(),
): StudyPlanData => ({
  settings,
  sessions: createSessionsForTopics(topics, settings, settings.startDate),
  topicProgress: topics.map(createTopicProgress),
  activeTimer: null,
  quizAttempts: [],
  updatedAt: new Date().toISOString(),
})

export const normalizeStudyPlan = (value: Partial<StudyPlanData> | null | undefined): StudyPlanData => {
  const defaults = createInitialStudyPlan()
  const settings = { ...defaults.settings, ...(value?.settings ?? {}) }
  const topics = getAllSyllabusTopics()
  const savedProgress = new Map((value?.topicProgress ?? []).map((entry) => [entry.topicId, entry]))
  const currentTopicIds = new Set(topics.map((topic) => topic.id))

  return {
    settings,
    sessions: Array.isArray(value?.sessions) ? value.sessions : defaults.sessions,
    topicProgress: [
      ...topics.map((topic) => ({
        ...createTopicProgress(topic),
        ...(savedProgress.get(topic.id) ?? {}),
        topicId: topic.id,
      })),
      ...(value?.topicProgress ?? []).filter((progress) => !currentTopicIds.has(progress.topicId)),
    ],
    activeTimer: value?.activeTimer ?? null,
    quizAttempts: Array.isArray(value?.quizAttempts) ? value.quizAttempts : [],
    updatedAt: value?.updatedAt ?? new Date().toISOString(),
  }
}

export const recoverInterruptedTimer = (data: StudyPlanData): StudyPlanData => {
  const timer = data.activeTimer
  if (!timer || timer.status !== 'running') return data

  return {
    ...data,
    activeTimer: {
      ...timer,
      status: 'interrupted',
      startedAt: null,
      lastUpdatedAt: new Date().toISOString(),
    },
  }
}

export const createPlanWithSettings = (
  current: StudyPlanData,
  settings: StudyPlanSettings,
  today = getLocalDateKey(),
): StudyPlanData => {
  const history = current.sessions.map((session) => {
    if (session.date >= today && session.status === 'planned' && session.kind !== 'revision') {
      return { ...session, status: 'rescheduled' as const }
    }
    return session
  })
  const remainingTopics = getAllSyllabusTopics().filter((topic) => {
    const status = current.topicProgress.find((progress) => progress.topicId === topic.id)?.status
    return status !== 'completed' && status !== 'needs-revision'
  })

  return {
    ...current,
    settings: { ...settings, startDate: today },
    sessions: [...history, ...createSessionsForTopics(remainingTopics, settings, today)],
    updatedAt: new Date().toISOString(),
  }
}

export const rebalanceOverdueSessions = (data: StudyPlanData, today = getLocalDateKey()): StudyPlanData => {
  const overdue = data.sessions.filter((session) => session.status === 'planned' && session.date < today)
  if (!overdue.length) return data

  const futureLoad = new Map<string, number>()
  data.sessions
    .filter((session) => session.status === 'planned' && session.date >= today)
    .forEach((session) => futureLoad.set(session.date, (futureLoad.get(session.date) ?? 0) + session.plannedMinutes))

  const capacity = Math.max(30, Math.round(data.settings.dailyHours * 60))
  const replacements = overdue.flatMap((session) => {
    let date = today
    let remainingMinutes = session.plannedMinutes
    const replacementsForSession: PlanSession[] = []

    while (remainingMinutes > 0) {
      const plannedMinutes = Math.min(remainingMinutes, capacity)
      while ((futureLoad.get(date) ?? 0) + plannedMinutes > capacity) {
        date = addDaysToDateKey(date, 1)
      }
      futureLoad.set(date, (futureLoad.get(date) ?? 0) + plannedMinutes)
      replacementsForSession.push({
        ...session,
        id: createId('rescheduled'),
        date,
        plannedMinutes,
        status: 'planned',
        createdAt: new Date().toISOString(),
        rescheduledFrom: session.date,
        completedAt: undefined,
      })
      remainingMinutes -= plannedMinutes
      if (remainingMinutes > 0) date = addDaysToDateKey(date, 1)
    }

    return replacementsForSession
  })

  const overdueIds = new Set(overdue.map((session) => session.id))
  return {
    ...data,
    sessions: [
      ...data.sessions.map((session) => overdueIds.has(session.id) ? { ...session, status: 'rescheduled' as const } : session),
      ...replacements,
    ],
    updatedAt: new Date().toISOString(),
  }
}

export const getTopicProgress = (data: StudyPlanData, topicId: string) =>
  data.topicProgress.find((progress) => progress.topicId === topicId)

export const updateTopicProgress = (
  data: StudyPlanData,
  topicId: string,
  changes: Partial<Omit<TopicProgress, 'topicId'>>,
): StudyPlanData => ({
  ...data,
  topicProgress: data.topicProgress.map((progress) => progress.topicId === topicId
    ? { ...progress, ...changes }
    : progress),
  updatedAt: new Date().toISOString(),
})

export const setTopicCompleted = (data: StudyPlanData, topicId: string, today = getLocalDateKey()): StudyPlanData => {
  const nextRevisionDate = addDaysToDateKey(today, REVISION_INTERVALS_DAYS[0])
  let next = updateTopicProgress(data, topicId, {
    status: 'completed',
    completionPercent: 100,
    revisionStage: 0,
    nextRevisionDate,
    lastStudiedAt: new Date().toISOString(),
  })
  next = {
    ...next,
    sessions: next.sessions.map((session) => session.topicId === topicId && session.kind === 'learn' && session.status === 'planned'
      ? { ...session, status: 'skipped' as const }
      : session),
  }
  const hasDueRevision = next.sessions.some((session) => session.topicId === topicId && session.kind === 'revision' && session.status === 'planned')

  if (!hasDueRevision) {
    next = {
      ...next,
      sessions: [...next.sessions, {
        id: createId('revision'),
        topicId,
        date: nextRevisionDate,
        kind: 'revision',
        plannedMinutes: 20,
        status: 'planned',
        createdAt: new Date().toISOString(),
      }],
    }
  }

  return next
}

export const completePlanSession = (data: StudyPlanData, sessionId: string): StudyPlanData => {
  const target = data.sessions.find((session) => session.id === sessionId)
  if (!target || target.status === 'completed') return data

  let next: StudyPlanData = {
    ...data,
    sessions: data.sessions.map((session) => session.id === sessionId
      ? { ...session, status: 'completed', completedAt: new Date().toISOString() }
      : session),
    updatedAt: new Date().toISOString(),
  }

  if (target.kind === 'revision') {
    const progress = getTopicProgress(next, target.topicId)
    const nextStage = Math.min(REVISION_INTERVALS_DAYS.length, (progress?.revisionStage ?? 0) + 1)
    const baseInterval = REVISION_INTERVALS_DAYS[nextStage]
    const recentAttempts = next.quizAttempts.filter((attempt) => attempt.topicId === target.topicId).slice(-3)
    const repeatedMistakes = recentAttempts.some((attempt) => !attempt.correct)
    const lowConfidence = progress?.confidence !== null && progress?.confidence !== undefined && progress.confidence <= 2
    const strongRecall = recentAttempts.length >= 3
      && recentAttempts.every((attempt) => attempt.correct)
      && (progress?.confidence ?? 0) >= 4
    const interval = baseInterval === undefined
      ? undefined
      : repeatedMistakes || lowConfidence
        ? Math.max(1, Math.ceil(baseInterval / 2))
        : strongRecall
          ? Math.min(45, Math.round(baseInterval * 1.25))
          : baseInterval
    const nextRevisionDate = interval === undefined ? null : addDaysToDateKey(getLocalDateKey(), interval)
    next = updateTopicProgress(next, target.topicId, {
      revisionStage: nextStage,
      nextRevisionDate,
      status: nextRevisionDate ? 'needs-revision' : 'completed',
      lastStudiedAt: new Date().toISOString(),
    })

    if (nextRevisionDate) {
      next = {
        ...next,
        sessions: [...next.sessions, {
          id: createId('revision'),
          topicId: target.topicId,
          date: nextRevisionDate,
          kind: 'revision',
          plannedMinutes: 20,
          status: 'planned',
          createdAt: new Date().toISOString(),
        }],
      }
    }
  } else {
    next = updateTopicProgress(next, target.topicId, {
      status: 'in-progress',
      lastStudiedAt: new Date().toISOString(),
    })
  }

  return next
}

export const recordTopicQuizAnswer = (data: StudyPlanData, attempt: StudyPlanData['quizAttempts'][number]): StudyPlanData => {
  let next: StudyPlanData = {
    ...data,
    quizAttempts: [...data.quizAttempts, attempt],
    updatedAt: new Date().toISOString(),
  }

  if (attempt.correct) return next

  const dueDate = addDaysToDateKey(getLocalDateKey(), 1)
  const currentRevision = next.sessions.find((session) => session.topicId === attempt.topicId
    && session.kind === 'revision' && session.status === 'planned')
  const nextRevisionDate = currentRevision && currentRevision.date < dueDate ? currentRevision.date : dueDate

  next = updateTopicProgress(next, attempt.topicId, {
    status: 'needs-revision',
    nextRevisionDate,
  })

  if (currentRevision) {
    next = {
      ...next,
      sessions: next.sessions.map((session) => session.id === currentRevision.id
        ? { ...session, date: nextRevisionDate }
        : session),
    }
  } else {
    next = {
      ...next,
      sessions: [...next.sessions, {
        id: createId('revision'),
        topicId: attempt.topicId,
        date: nextRevisionDate,
        kind: 'revision',
        plannedMinutes: 20,
        status: 'planned',
        createdAt: new Date().toISOString(),
      }],
    }
  }

  return next
}

export const reschedulePlanSession = (data: StudyPlanData, sessionId: string, date: string): StudyPlanData => {
  const target = data.sessions.find((session) => session.id === sessionId)
  const parsedDate = new Date(`${date}T12:00:00`)
  if (!target || target.status !== 'planned' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || getLocalDateKey(parsedDate) !== date) return data

  return {
    ...data,
    sessions: [
      ...data.sessions.map((session) => session.id === sessionId ? { ...session, status: 'rescheduled' as const } : session),
      { ...target, id: createId('rescheduled'), date, createdAt: new Date().toISOString(), rescheduledFrom: target.date },
    ],
    updatedAt: new Date().toISOString(),
  }
}

export const createStudyTimer = (sessionId: string, topicId: string): ActiveStudyTimer => ({
  sessionId,
  topicId,
  status: 'running',
  elapsedSeconds: 0,
  startedAt: new Date().toISOString(),
  lastUpdatedAt: new Date().toISOString(),
})

export const getElapsedTimerSeconds = (timer: ActiveStudyTimer, now = Date.now()) => {
  const openSegment = timer.status === 'running' && timer.startedAt
    ? Math.max(0, Math.floor((now - new Date(timer.startedAt).getTime()) / 1000))
    : 0
  return timer.elapsedSeconds + openSegment
}

export const checkpointStudyTimer = (timer: ActiveStudyTimer, now = Date.now()): ActiveStudyTimer => {
  if (timer.status !== 'running') return timer
  const checkpointAt = new Date(now).toISOString()
  return {
    ...timer,
    elapsedSeconds: getElapsedTimerSeconds(timer, now),
    startedAt: checkpointAt,
    lastUpdatedAt: checkpointAt,
  }
}

export const pauseStudyTimer = (timer: ActiveStudyTimer): ActiveStudyTimer => ({
  ...timer,
  status: 'paused',
  elapsedSeconds: getElapsedTimerSeconds(timer),
  startedAt: null,
  lastUpdatedAt: new Date().toISOString(),
})

export const resumeStudyTimer = (timer: ActiveStudyTimer): ActiveStudyTimer => ({
  ...timer,
  status: 'running',
  startedAt: new Date().toISOString(),
  lastUpdatedAt: new Date().toISOString(),
})

export const commitTimerToPlan = (data: StudyPlanData, timer: ActiveStudyTimer): StudyPlanData => {
  const elapsedSeconds = getElapsedTimerSeconds(timer)
  const activeSession = data.sessions.find((session) => session.id === timer.sessionId)
  if (!activeSession || elapsedSeconds < 1) return { ...data, activeTimer: null }

  let next = updateTopicProgress(data, timer.topicId, {
    actualSeconds: (getTopicProgress(data, timer.topicId)?.actualSeconds ?? 0) + elapsedSeconds,
    status: 'in-progress',
    lastStudiedAt: new Date().toISOString(),
  })
  next = {
    ...next,
    sessions: next.sessions.map((session) => session.id === timer.sessionId
      ? { ...session, actualSeconds: elapsedSeconds }
      : session),
  }
  next = completePlanSession(next, timer.sessionId)

  return {
    ...next,
    activeTimer: null,
    updatedAt: new Date().toISOString(),
  }
}

export const getSessionsInPeriod = (
  sessions: PlanSession[],
  period: StudyPlanPeriod,
  anchorDate = getLocalDateKey(),
) => {
  const { start, end } = getPlanPeriodRange(period, anchorDate)
  return sessions
    .filter((session) => session.date >= start && session.date <= end && (period === 'all' || session.status !== 'rescheduled'))
    .sort((first, second) => first.date.localeCompare(second.date) || first.kind.localeCompare(second.kind))
}

export const getDailyStudyTotals = (data: StudyPlanData, date = getLocalDateKey()) => {
  const sessions = data.sessions.filter((session) => session.date === date && session.status !== 'rescheduled')
  const plannedMinutes = sessions.filter((session) => session.status !== 'skipped').reduce((sum, session) => sum + session.plannedMinutes, 0)
  const completedSessions = sessions.filter((session) => session.status === 'completed')
  const actualSeconds = completedSessions.reduce((sum, session) => sum + (session.actualSeconds ?? 0), 0)

  return { sessions, plannedMinutes, completedCount: completedSessions.length, actualSeconds }
}

export type StudyRecommendation = {
  session: PlanSession
  reason: string
}

export const getStudyRecommendation = (data: StudyPlanData, fromDate = getLocalDateKey()): StudyRecommendation | null => {
  const pending = data.sessions.filter((session) => session.date >= fromDate && session.status === 'planned')
  const dueRevision = pending
    .filter((session) => session.kind === 'revision' && session.date <= fromDate)
    .sort((first, second) => first.date.localeCompare(second.date))[0]

  if (dueRevision) {
    return { session: dueRevision, reason: 'A spaced revision is due before new material.' }
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const next = pending.sort((first, second) => {
    const dateOrder = first.date.localeCompare(second.date)
    if (dateOrder) return dateOrder
    const kindOrder = Number(second.kind === 'revision') - Number(first.kind === 'revision')
    if (kindOrder) return kindOrder
    const firstPriority = priorityOrder[getTopicProgress(data, first.topicId)?.priority ?? 'medium']
    const secondPriority = priorityOrder[getTopicProgress(data, second.topicId)?.priority ?? 'medium']
    return firstPriority - secondPriority
  })[0]

  if (!next) return null
  if (next.kind === 'revision') return { session: next, reason: `Next spaced revision is scheduled for ${next.date}.` }

  const recentAttempts = data.quizAttempts
    .filter((attempt) => attempt.topicId === next.topicId)
    .slice(-3)
  if (recentAttempts.some((attempt) => !attempt.correct)) {
    return { session: next, reason: 'A recent practice answer showed this topic needs reinforcement.' }
  }

  if (getTopicProgress(data, next.topicId)?.priority === 'high') {
    return { session: next, reason: 'This is a high-priority syllabus topic in your current schedule.' }
  }

  return {
    session: next,
    reason: next.date === fromDate ? 'This is the next topic scheduled for today.' : `This is the next scheduled topic for ${next.date}.`,
  }
}

export const getPendingSession = (data: StudyPlanData, fromDate = getLocalDateKey()) =>
  getStudyRecommendation(data, fromDate)?.session ?? null

export const getTopicById = (topicId: string) => getAllSyllabusTopics().find((topic) => topic.id === topicId)

export const getRevisionSessions = (data: StudyPlanData, today = getLocalDateKey()) =>
  data.sessions
    .filter((session) => session.kind === 'revision' && session.status === 'planned')
    .map((session) => ({ ...session, overdue: session.date < today, dueToday: session.date === today }))
    .sort((first, second) => first.date.localeCompare(second.date))

export const addPlanSession = (data: StudyPlanData, topicId: string, date: string, kind: PlanSessionKind, plannedMinutes: number) => ({
  ...data,
  sessions: [...data.sessions, {
    id: createId(kind),
    topicId,
    date,
    kind,
    plannedMinutes: Math.min(480, Math.max(5, Math.round(plannedMinutes))),
    status: 'planned' as const,
    createdAt: new Date().toISOString(),
  }],
  updatedAt: new Date().toISOString(),
})