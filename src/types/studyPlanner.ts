export type PreparationLevel = 'beginner' | 'intermediate' | 'advanced'
export type StudyMedium = 'english' | 'telugu' | 'bilingual'
export type TopicStatus = 'not-started' | 'in-progress' | 'completed' | 'needs-revision'
export type TopicDifficulty = 'easy' | 'moderate' | 'challenging'
export type TopicPriority = 'high' | 'medium' | 'low'
export type PlanSessionKind = 'learn' | 'revision' | 'practice'
export type PlanSessionStatus = 'planned' | 'in-progress' | 'completed' | 'rescheduled' | 'skipped'
export type TimerStatus = 'idle' | 'running' | 'paused' | 'interrupted'

export type SyllabusSource = {
  label: string
  url: string
  publishedAt: string
  scope: 'official-heading' | 'suggested-detail'
}

export type SyllabusTopic = {
  id: string
  title: string
  subtopics: string[]
  learningObjectives: string[]
  estimatedMinutes: number
  difficulty: TopicDifficulty
  priority: TopicPriority
  source: 'official-heading' | 'suggested-detail' | 'admin-reference'
}

export type SyllabusUnit = {
  id: string
  title: string
  source: 'official-heading' | 'suggested-detail' | 'admin-reference'
  marks?: number
  topics: SyllabusTopic[]
}

export type SyllabusSubject = {
  id: string
  title: string
  source: 'official-heading' | 'suggested-detail'
  marks?: number
  units: SyllabusUnit[]
}

export type OfficialPaperScheme = {
  questionCount: number
  durationMinutes: number
  maximumMarks: number
  negativeMarking: { numerator: number; denominator: number }
}

export type SyllabusPaper = {
  id: string
  title: string
  kind: 'screening' | 'mains'
  source: 'official-heading' | 'suggested-detail'
  scheme: OfficialPaperScheme
  subjects: SyllabusSubject[]
}

export type StudyPlanSettings = {
  level: PreparationLevel
  medium: StudyMedium
  dailyHours: number
  startDate: string
  targetDate: string | null
}

export type PlanSession = {
  id: string
  topicId: string
  date: string
  kind: PlanSessionKind
  plannedMinutes: number
  actualSeconds?: number
  status: PlanSessionStatus
  createdAt: string
  completedAt?: string
  rescheduledFrom?: string
}

export type TopicProgress = {
  topicId: string
  status: TopicStatus
  completionPercent: number
  actualSeconds: number
  difficulty: TopicDifficulty
  priority: TopicPriority
  notes: string
  bookmarked: boolean
  confidence: number | null
  revisionStage: number
  nextRevisionDate: string | null
  lastStudiedAt: string | null
}

export type ActiveStudyTimer = {
  sessionId: string
  topicId: string
  status: TimerStatus
  elapsedSeconds: number
  startedAt: string | null
  lastUpdatedAt: string
}

export type TopicQuizAttempt = {
  id: string
  topicId: string
  questionId: string
  selectedIndex: number
  correct: boolean
  attemptedAt: string
}

export type StudyPlanData = {
  settings: StudyPlanSettings
  sessions: PlanSession[]
  topicProgress: TopicProgress[]
  activeTimer: ActiveStudyTimer | null
  quizAttempts: TopicQuizAttempt[]
  updatedAt: string
}

export type StudyPlanPeriod = 'today' | 'week' | 'month' | 'all'