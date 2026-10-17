import type { SubjectItem } from '../data/dashboardData'
import { getStoredUserMockAttempts } from '../data/dashboardData'

export type StudySessionType = 'reading' | 'revision' | 'quiz' | 'notes'

export type UserStudySession = {
  id: string
  userId: string
  subjectId: string
  subjectName: string
  minutes: number
  sessionType: StudySessionType
  createdAt: string
}

export type UserTopicProgress = {
  userId: string
  subjectId: string
  topic: string
  completed: boolean
  revisionCount: number
  lastReviewedAt: string | null
}

export type SubjectProgressSnapshot = {
  subjectId: string
  subjectName: string
  percent: number
  studyMinutes: number
  completedTopics: number
  totalTopics: number
  quizAccuracy: number
  revisionCount: number
}

const USER_PROGRESS_KEY = 'appsc_user_progress'

const buildSeedSessions = (userId: string, subjectList: SubjectItem[]): UserStudySession[] => {
  const today = Date.now()

  return subjectList.flatMap((subject, index) => {
    const baseMinutes = 35 + (index % 5) * 18
    const readingMinutes = baseMinutes + (index % 3) * 10
    const revisionMinutes = Math.max(15, Math.round(readingMinutes * 0.6))

    return [
      {
        id: `${userId}-${subject.id}-reading-${index}`,
        userId,
        subjectId: subject.id,
        subjectName: subject.name,
        minutes: readingMinutes,
        sessionType: 'reading',
        createdAt: new Date(today - (index + 1) * 86400000).toISOString(),
      },
      {
        id: `${userId}-${subject.id}-revision-${index}`,
        userId,
        subjectId: subject.id,
        subjectName: subject.name,
        minutes: revisionMinutes,
        sessionType: 'revision',
        createdAt: new Date(today - (index + 2) * 86400000).toISOString(),
      },
    ]
  })
}

const buildSeedTopics = (userId: string, subjectList: SubjectItem[]): UserTopicProgress[] => {
  return subjectList.flatMap((subject, subjectIndex) => {
    const completedCount = Math.max(1, Math.ceil(subject.topics.length * (0.45 + (subjectIndex % 4) * 0.08)))

    return subject.topics.map((topic, topicIndex) => ({
      userId,
      subjectId: subject.id,
      topic,
      completed: topicIndex < completedCount,
      revisionCount: topicIndex < completedCount ? 2 + (topicIndex % 3) : 0,
      lastReviewedAt: topicIndex < completedCount
        ? new Date(Date.now() - (topicIndex + 1) * 86400000).toISOString()
        : null,
    }))
  })
}

const getActiveStorageKey = (userId: string) => `${USER_PROGRESS_KEY}_${userId || 'guest'}`

export const getStoredUserProgress = (userId: string, subjectList: SubjectItem[]) => {
  if (typeof window === 'undefined') {
    return {
      sessions: buildSeedSessions(userId, subjectList),
      topics: buildSeedTopics(userId, subjectList),
    }
  }

  const key = getActiveStorageKey(userId)
  const raw = window.localStorage.getItem(key)

  if (!raw) {
    const seeded = {
      sessions: buildSeedSessions(userId, subjectList),
      topics: buildSeedTopics(userId, subjectList),
    }
    window.localStorage.setItem(key, JSON.stringify(seeded))
    return seeded
  }

  try {
    const parsed = JSON.parse(raw) as { sessions?: UserStudySession[]; topics?: UserTopicProgress[] }
    return {
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : buildSeedSessions(userId, subjectList),
      topics: Array.isArray(parsed.topics) ? parsed.topics : buildSeedTopics(userId, subjectList),
    }
  } catch {
    return {
      sessions: buildSeedSessions(userId, subjectList),
      topics: buildSeedTopics(userId, subjectList),
    }
  }
}

export const saveUserProgress = (userId: string, _subjectList: SubjectItem[], payload: { sessions: UserStudySession[]; topics: UserTopicProgress[] }) => {
  if (typeof window === 'undefined') {
    return payload
  }

  const key = getActiveStorageKey(userId)
  window.localStorage.setItem(key, JSON.stringify(payload))
  return payload
}

export const recordStudySession = (
  userId: string,
  subjectList: SubjectItem[],
  input: {
    subjectId: string
    subjectName: string
    minutes: number
    sessionType: StudySessionType
  },
) => {
  const current = getStoredUserProgress(userId, subjectList)
  const session: UserStudySession = {
    id: `session-${Date.now()}`,
    userId,
    subjectId: input.subjectId,
    subjectName: input.subjectName,
    minutes: Math.max(10, Number(input.minutes) || 20),
    sessionType: input.sessionType,
    createdAt: new Date().toISOString(),
  }

  const next = {
    sessions: [session, ...current.sessions],
    topics: current.topics,
  }

  return saveUserProgress(userId, subjectList, next)
}

export const markTopicCompleted = (userId: string, subjectList: SubjectItem[], payload: { subjectId: string; topic: string; completed?: boolean; revisionCount?: number }) => {
  const current = getStoredUserProgress(userId, subjectList)
  const nextTopics = current.topics.some((entry) => entry.subjectId === payload.subjectId && entry.topic === payload.topic)
    ? current.topics.map((entry) =>
        entry.subjectId === payload.subjectId && entry.topic === payload.topic
          ? {
              ...entry,
              completed: payload.completed ?? true,
              revisionCount: payload.revisionCount ?? entry.revisionCount + 1,
              lastReviewedAt: new Date().toISOString(),
            }
          : entry,
      )
    : [
        ...current.topics,
        {
          userId,
          subjectId: payload.subjectId,
          topic: payload.topic,
          completed: payload.completed ?? true,
          revisionCount: payload.revisionCount ?? 1,
          lastReviewedAt: new Date().toISOString(),
        },
      ]

  const next = { sessions: current.sessions, topics: nextTopics }
  return saveUserProgress(userId, subjectList, next)
}

export const getUserSubjectProgress = (userId: string, subjectList: SubjectItem[]): SubjectProgressSnapshot[] => {
  const subjectListSafe = subjectList.length ? subjectList : []
  const progressState = getStoredUserProgress(userId, subjectListSafe)
  const attempts = getStoredUserMockAttempts(userId)

  return subjectListSafe.map((subject) => {
    const subjectSessions = progressState.sessions.filter((session) => session.subjectId === subject.id)
    const subjectTopics = progressState.topics.filter((entry) => entry.subjectId === subject.id)
    const completedTopics = subjectTopics.filter((entry) => entry.completed).length
    const totalTopics = Math.max(subject.topics.length, 1)
    const topicCompletion = (completedTopics / totalTopics) * 100

    const studyMinutes = subjectSessions.reduce((sum, session) => sum + session.minutes, 0)
    const studyProgress = Math.min(100, (studyMinutes / 180) * 100)

    const subjectAttempts = attempts.filter((attempt) => attempt.subjectName === subject.name)
    const quizAccuracy = subjectAttempts.length
      ? Math.round(subjectAttempts.reduce((sum, attempt) => sum + (attempt.accuracy ?? 0), 0) / subjectAttempts.length)
      : 48

    const revisionCount = subjectTopics.reduce((sum, entry) => sum + entry.revisionCount, 0)
    const revisionProgress = Math.min(100, (revisionCount / Math.max(4, totalTopics * 2)) * 100)

    const percent = Math.max(
      5,
      Math.min(
        100,
        Math.round((topicCompletion * 0.45) + (studyProgress * 0.25) + (quizAccuracy * 0.2) + (revisionProgress * 0.1)),
      ),
    )

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      percent,
      studyMinutes,
      completedTopics,
      totalTopics,
      quizAccuracy,
      revisionCount,
    }
  })
}

export const getOverallSubjectProgress = (userId: string, subjectList: SubjectItem[]) => {
  const snapshots = getUserSubjectProgress(userId, subjectList)
  if (!snapshots.length) return 0

  const total = snapshots.reduce((sum, snapshot) => sum + snapshot.percent, 0)
  return Math.round(total / snapshots.length)
}
