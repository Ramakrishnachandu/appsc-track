import {
  defaultMockTests,
  getStoredUserMockAttempts,
  getStoredMockTests,
  saveStoredMockTests,
  saveStoredUserMockAttempts,
  type MockAttempt,
  type MockPaperType,
  type MockQuestion,
  type MockTest,
} from '../data/dashboardData'
import { supabase } from './supabase'

const MOCK_DRAFTS_KEY = 'appsc_mock_test_drafts'

export type MockApiSubmission = {
  testId: string
  answers: Record<string, number>
  userId?: string
}

export type MockApiResult = {
  id: string
  testId: string
  testTitle: string
  score: number
  total: number
  correct: number
  wrong: number
  skipped: number
  accuracy: number
  submittedAt: string
  paperType: MockPaperType
  message: string
}

const prelimsTemplates: Omit<MockQuestion, 'id' | 'subjectId' | 'subjectName' | 'paperType'>[] = [
  {
    prompt: 'Which of the following is the primary source of the Indian Constitution?',
    options: ['Government of India Act, 1935', 'Constituent Assembly debates', 'Preamble', 'Montague-Chelmsford Report'],
    correctIndex: 0,
    explanation: 'The Government of India Act, 1935 was a major constitutional precursor, though the Constitution itself was framed by the Constituent Assembly.',
  },
  {
    prompt: 'The concept of judicial review in India is based on which principle?',
    options: ['Separation of powers', 'Rule of law', 'Federalism', 'Parliamentary supremacy'],
    correctIndex: 1,
    explanation: 'The rule of law and constitutional supremacy empower the judiciary to review laws against the Constitution.',
  },
  {
    prompt: 'Which of the following rivers is the longest in Peninsular India?',
    options: ['Godavari', 'Krishna', 'Cauvery', 'Mahanadi'],
    correctIndex: 0,
    explanation: 'The Godavari is the longest river in Peninsular India.',
  },
  {
    prompt: 'Which sector contributes most to India’s GDP in the service-dominant economy?',
    options: ['Agriculture', 'Manufacturing', 'Services', 'Mining'],
    correctIndex: 2,
    explanation: 'The services sector is the largest contributor to India’s GDP.',
  },
  {
    prompt: 'The right to education in India is guaranteed under which article?',
    options: ['Article 19', 'Article 21A', 'Article 32', 'Article 44'],
    correctIndex: 1,
    explanation: 'Article 21A provides the right to education for children aged 6 to 14 years.',
  },
]

const mainsTemplates: Omit<MockQuestion, 'id' | 'subjectId' | 'subjectName' | 'paperType'>[] = [
  {
    prompt: 'The basic structure doctrine was developed by the Supreme Court in which case?',
    options: ['Kesavananda Bharati v. State of Kerala', 'S.R. Bommai v. Union of India', 'Minerva Mills v. Union of India', 'I.C. Golaknath v. State of Punjab'],
    correctIndex: 0,
    explanation: 'Kesavananda Bharati is the landmark case that established the basic structure doctrine.',
  },
  {
    prompt: 'The concept of decentralised planning in India is associated with which constitutional amendment?',
    options: ['73rd Amendment', '74th Amendment', '42nd Amendment', '86th Amendment'],
    correctIndex: 0,
    explanation: 'The 73rd Amendment strengthened local self-government and decentralised planning through Panchayati Raj.',
  },
  {
    prompt: 'The Green Revolution in India primarily focused on increasing output in which sector?',
    options: ['Industry', 'Agriculture', 'Mining', 'Defence'],
    correctIndex: 1,
    explanation: 'The Green Revolution drastically increased agricultural productivity through high-yield varieties and irrigation.',
  },
  {
    prompt: 'Which of the following is a statutory body under the Constitution of India?',
    options: ['NITI Aayog', 'Election Commission', 'National Human Rights Commission', 'Finance Commission'],
    correctIndex: 1,
    explanation: 'The Election Commission is a constitutional body established under Article 324.',
  },
  {
    prompt: 'The fiscal deficit is calculated as the difference between:',
    options: ['Total revenue and capital expenditure', 'Total expenditure and total receipts excluding borrowing', 'Imports and exports', 'Capital receipts and revenue expenditure'],
    correctIndex: 1,
    explanation: 'Fiscal deficit is the gap between government expenditure and receipts excluding borrowings.',
  },
]

export const buildMockQuestionSet = ({
  paperType,
  subjectId,
  subjectName,
  count = 5,
}: {
  paperType: MockPaperType
  subjectId?: string
  subjectName?: string
  count?: number
}): MockQuestion[] => {
  const templates = paperType === 'Mains' ? mainsTemplates : prelimsTemplates

  return templates.slice(0, Math.max(1, Math.min(count, templates.length))).map((template, index) => ({
    id: `${subjectId ?? paperType.toLowerCase()}-${paperType.toLowerCase()}-${index + 1}`,
    subjectId: subjectId ?? `${paperType.toLowerCase()}-subject-${index + 1}`,
    subjectName: subjectName ?? `${paperType} subject ${index + 1}`,
    paperType,
    prompt: template.prompt,
    options: template.options,
    correctIndex: template.correctIndex,
    explanation: template.explanation,
  }))
}

const mapDbTest = (row: Record<string, any>): MockTest | null => {
  if (!row) return null

  const questions = Array.isArray(row.questions) ? row.questions.map((question: any, index: number) => ({
    id: String(question.id ?? `${row.id}-q-${index + 1}`),
    subjectId: question.subjectId ?? row.subject_id ?? row.id,
    subjectName: question.subjectName ?? row.subject_name ?? 'General subject',
    paperType: question.paperType ?? row.paper_type ?? 'Prelims',
    prompt: String(question.prompt ?? 'Sample question'),
    options: Array.isArray(question.options) && question.options.length ? question.options.map(String) : ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: Number(question.correctIndex ?? 0),
    explanation: String(question.explanation ?? 'Answer explanation'),
  })) : []

  return {
    id: String(row.id ?? `mock-${Date.now()}`),
    title: String(row.title ?? 'Mock test'),
    schedule: row.schedule === 'Weekly' ? 'Weekly' : 'Daily',
    durationMinutes: Number(row.duration_minutes ?? row.durationMinutes ?? 30),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    paperType: row.paper_type === 'Mains' ? 'Mains' : 'Prelims',
    subjectId: row.subject_id ?? row.subjectId ?? undefined,
    subjectName: row.subject_name ?? row.subjectName ?? 'General assessment',
    source: 'api',
    questions,
  }
}

export const getMockTestsFromApi = async (): Promise<MockTest[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('mock_tests')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapDbTest).filter(Boolean) as MockTest[]
        if (mapped.length) {
          saveStoredMockTests(mapped)
          return mapped
        }
      }
    } catch {
      // fallback to local storage below
    }
  }

  const stored = getStoredMockTests()
  return stored.length ? stored : defaultMockTests
}

export const getUserMockAttemptsFromApi = async (userId: string): Promise<MockAttempt[]> => {
  if (!userId) return []
  const cached = getStoredUserMockAttempts(userId)
  if (!supabase || userId.startsWith('demo-')) return cached

  const { data, error } = await supabase
    .from('mock_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(30)

  if (error) throw error

  const tests = await getMockTestsFromApi()
  const testsById = new Map(tests.map((test) => [test.id, test]))
  const remote = (data ?? []).map((row): MockAttempt => {
    const test = testsById.get(String(row.test_id))
    return {
      id: String(row.id),
      testId: String(row.test_id),
      testTitle: test?.title ?? 'Mock test',
      score: Number(row.score ?? 0),
      total: Number(row.total ?? 0),
      correct: Number(row.correct ?? 0),
      wrong: Number(row.wrong ?? 0),
      skipped: Number(row.skipped ?? 0),
      accuracy: Number(row.accuracy ?? 0),
      paperType: test?.paperType ?? 'Prelims',
      subjectName: test?.subjectName ?? 'General',
      submittedAt: String(row.submitted_at ?? new Date().toISOString()),
    }
  })

  const remoteKeys = new Set(remote.map((attempt) => `${attempt.testId}:${Date.parse(attempt.submittedAt)}`))
  const merged = [...remote, ...cached.filter((attempt) => !remoteKeys.has(`${attempt.testId}:${Date.parse(attempt.submittedAt)}`))]
    .sort((first, second) => second.submittedAt.localeCompare(first.submittedAt))
    .slice(0, 30)
  saveStoredUserMockAttempts(userId, merged)
  return merged
}

export const getStoredMockDrafts = (): MockTest[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(MOCK_DRAFTS_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as Partial<MockTest>[]
    return parsed.map((item) => mapDbTest(item as Record<string, any>) ?? normalizeMockTest(item)).filter(Boolean) as MockTest[]
  } catch {
    return []
  }
}

export const saveStoredMockDrafts = (tests: MockTest[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MOCK_DRAFTS_KEY, JSON.stringify(tests))
  }
}

const normalizeMockTest = (test: Partial<MockTest> | null | undefined): MockTest | null => {
  if (!test) return null

  return {
    id: String(test.id ?? `draft-${Date.now()}`),
    title: String(test.title ?? 'Draft mock test'),
    schedule: test.schedule === 'Weekly' ? 'Weekly' : 'Daily',
    durationMinutes: Number(test.durationMinutes ?? 30),
    createdAt: String(test.createdAt ?? new Date().toISOString()),
    paperType: test.paperType === 'Mains' ? 'Mains' : 'Prelims',
    subjectId: test.subjectId ?? undefined,
    subjectName: test.subjectName ?? undefined,
    source: 'local',
    questions: Array.isArray(test.questions) ? test.questions.map((question, index) => ({
      id: String(question.id ?? `${test.id ?? 'draft'}-q-${index + 1}`),
      subjectId: question.subjectId ?? test.subjectId,
      subjectName: question.subjectName ?? test.subjectName,
      paperType: question.paperType ?? (test.paperType === 'Mains' ? 'Mains' : 'Prelims'),
      prompt: String(question.prompt ?? 'Sample question'),
      options: Array.isArray(question.options) && question.options.length ? question.options.map(String) : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: Number(question.correctIndex ?? 0),
      explanation: String(question.explanation ?? 'Answer explanation'),
    })) : [],
  }
}

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

export const publishMockTestToApi = async (test: MockTest): Promise<MockTest> => {
  const targetId = isValidUuid(test.id) ? test.id : generateUuid()
  const normalizedTest: MockTest = {
    ...test,
    id: targetId,
  }

  if (supabase) {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user?.id

      const payload = {
        id: targetId,
        title: normalizedTest.title,
        schedule: normalizedTest.schedule,
        paper_type: normalizedTest.paperType,
        subject_id: normalizedTest.subjectId ?? null,
        subject_name: normalizedTest.subjectName ?? null,
        duration_minutes: normalizedTest.durationMinutes,
        questions: normalizedTest.questions,
        created_by: userId ?? null,
        created_at: normalizedTest.createdAt,
      }

      const { data, error } = await supabase.from('mock_tests').upsert(payload, { onConflict: 'id' }).select().single()

      if (!error && data) {
        const mapped = mapDbTest(data)
        if (mapped) {
          const current = getStoredMockTests()
          const next = [mapped, ...current.filter((item) => item.id !== mapped.id && item.id !== test.id)].slice(0, 20)
          saveStoredMockTests(next)
          return mapped
        }
      }
    } catch {
      // fallback to local storage below
    }
  }

  const current = getStoredMockTests()
  const next = [normalizedTest, ...current.filter((item) => item.id !== normalizedTest.id && item.id !== test.id)]
  saveStoredMockTests(next)
  return normalizedTest
}

export const updateMockTestToApi = async (test: MockTest): Promise<MockTest> => publishMockTestToApi(test)

export const deleteMockTestFromApi = async (testId: string): Promise<boolean> => {
  if (supabase) {
    try {
      if (isValidUuid(testId)) {
        const { error } = await supabase.from('mock_tests').delete().eq('id', testId)
        if (error) {
          console.error('Failed to delete mock test from Supabase:', error)
        } else {
          const current = getStoredMockTests()
          saveStoredMockTests(current.filter((item) => item.id !== testId))
          return true
        }
      }
    } catch {
      // fallback below
    }
  }

  const current = getStoredMockTests()
  const next = current.filter((item) => item.id !== testId)
  saveStoredMockTests(next)
  return true
}

export const submitMockTestToApi = async ({ testId, answers, userId }: MockApiSubmission): Promise<MockApiResult> => {
  const tests = getStoredMockTests()
  const test = tests.find((item) => item.id === testId) ?? defaultMockTests[0]

  const total = test.questions.length
  let correct = 0
  let skipped = 0

  test.questions.forEach((question) => {
    const selectedOption = answers[question.id]
    if (typeof selectedOption === 'number') {
      if (selectedOption === question.correctIndex) {
        correct += 1
      }
    } else {
      skipped += 1
    }
  })

  const wrong = total - correct - skipped
  const score = correct
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const submittedAt = new Date().toISOString()

  if (supabase && isValidUuid(test.id)) {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const payloadUserId = userId ?? sessionData.session?.user?.id ?? null

      const { data, error } = await supabase
        .from('mock_attempts')
        .insert({
          test_id: test.id,
          user_id: payloadUserId,
          score,
          total,
          correct,
          wrong,
          skipped,
          accuracy,
          submitted_at: submittedAt,
        })
        .select()
        .single()

      if (!error && data) {
        return {
          id: String(data.id),
          testId: String(data.test_id ?? test.id),
          testTitle: test.title,
          score: Number(data.score ?? score),
          total: Number(data.total ?? total),
          correct: Number(data.correct ?? correct),
          wrong: Number(data.wrong ?? wrong),
          skipped: Number(data.skipped ?? skipped),
          accuracy: Number(data.accuracy ?? accuracy),
          submittedAt: String(data.submitted_at ?? submittedAt),
          paperType: test.paperType,
          message: userId ? `Result recorded for ${userId}` : 'Result processed successfully',
        }
      }
    } catch {
      // fallback below
    }
  }

  return {
    id: `result-${Date.now()}`,
    testId: test.id,
    testTitle: test.title,
    score,
    total,
    correct,
    wrong,
    skipped,
    accuracy,
    submittedAt,
    paperType: test.paperType,
    message: userId ? `Result recorded for ${userId}` : 'Result processed successfully',
  }
}
