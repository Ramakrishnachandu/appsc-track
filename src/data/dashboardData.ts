import { supabase } from '../lib/supabase'

export const APPSC_GROUP_II_EXAM_DATE = '2027-03-06T09:00:00+05:30'

export const getExamCountdown = (targetDate = APPSC_GROUP_II_EXAM_DATE) => {
  const target = new Date(targetDate).getTime()
  const diff = target - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export const examCountdown = getExamCountdown()

const SYLLABUS_STORAGE_KEY = 'appsc_syllabus_config'

export const dashboardStats = [
  { label: 'Overall progress', value: '42%', detail: 'Target: 70%' },
  { label: 'Study streak', value: '12 days', detail: 'Best: 18 days' },
  { label: 'MCQ accuracy', value: '76%', detail: '+8% this week' },
  { label: 'Avg. study hours', value: '4.2h', detail: 'Daily target: 4h' },
]

export const todayTasks = [
  { title: 'Indian Polity', subtitle: 'Fundamental Rights', duration: '60 min' },
  { title: 'AP History', subtitle: 'Satavahanas and dynasties', duration: '45 min' },
  { title: 'Current Affairs', subtitle: 'October weekly review', duration: '30 min' },
  { title: 'MCQs', subtitle: '50 questions practice', duration: '45 min' },
]

export type SubjectItem = {
  id: string
  name: string
  percent: number
  marks: string
  summary: string
  topics: string[]
}

export type SyllabusConfig = {
  prelimsSubjects: SubjectItem[]
  mainsSubjects: SubjectItem[]
}

export type MockPaperType = 'Prelims' | 'Mains'

export type MockQuestion = {
  id: string
  subjectId?: string
  subjectName?: string
  paperType?: MockPaperType
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
  sourceTitle?: string
  sourceUrl?: string
  sourcePublishedAt?: string
}

export type MockTest = {
  id: string
  title: string
  schedule: 'Daily' | 'Weekly'
  durationMinutes: number
  createdAt: string
  paperType: MockPaperType
  subjectId?: string
  subjectName?: string
  source?: 'local' | 'api'
  assessmentMode?: 'practice' | 'official-pattern'
  questions: MockQuestion[]
}

export type MockAttempt = {
  id: string
  testId: string
  testTitle: string
  score: number
  total: number
  correct?: number
  wrong?: number
  skipped?: number
  accuracy?: number
  paperType?: MockPaperType
  subjectName?: string
  assessmentMode?: 'practice' | 'official-pattern'
  marksPerQuestion?: number
  negativeMarksPerWrong?: number
  submittedAt: string
}

export const defaultPrelimsSubjects: SubjectItem[] = [
  {
    id: 'indian-history',
    name: 'Indian History',
    percent: 66,
    marks: '30M',
    summary: 'Ancient, medieval, and modern Indian history with emphasis on societies, empires, reform movements, and independence.',
    topics: [
      'Indus Valley Civilization and Vedic Age',
      'Mauryan and Gupta administrations, art, literature, religion',
      'Delhi Sultanate, Mughal Empire, Bhakti and Sufi movements',
      'Shivaji, Maratha rise, advent of Europeans',
      '1857 Revolt, British expansion, reform movements',
      'Indian National Movement and post-independence consolidation',
    ],
  },
  {
    id: 'geography',
    name: 'Geography',
    percent: 45,
    marks: '30M',
    summary: 'Physical geography, climate, resources, and human development with India & Andhra Pradesh focus.',
    topics: [
      'Earth, atmosphere, landforms, oceans, climate and natural hazards',
      'India & AP physiography, drainage, soils, vegetation',
      'Natural resources, agriculture, industry, transport and trade',
      'Demographics, urbanization, migration and human development',
    ],
  },
  {
    id: 'current-affairs',
    name: 'Current Affairs',
    percent: 53,
    marks: '30M',
    summary: 'High-priority current national, international, and Andhra Pradesh developments.',
    topics: [
      'International developments and geopolitics',
      'National government schemes and policy changes',
      'State-specific AP developments and welfare initiatives',
      'Current events analysis and issue-based revision',
    ],
  },
  {
    id: 'indian-society',
    name: 'Indian Society',
    percent: 58,
    marks: '30M',
    summary: 'Structure of Indian society, social issues, welfare mechanisms, and constitutional provisions for vulnerable groups.',
    topics: [
      'Family, marriage, kinship, caste, tribe, ethnicity, religion and women',
      'Casteism, communalism, regionalisation, crime against women and child labour',
      'Youth unrest, agitation and social challenges',
      'Public policies and welfare programmes',
      'Constitutional and statutory provisions for SCs, STs, minorities, BCs, women, disabled and children',
    ],
  },
  {
    id: 'mental-ability',
    name: 'Mental Ability',
    percent: 70,
    marks: '30M',
    summary: 'Reasoning, numerical aptitude, data interpretation, and problem-solving skills.',
    topics: [
      'Logical reasoning: statement, assumption, conclusion, argument',
      'Number and letter series, odd one out, coding-decoding',
      'Relations, shapes, pattern recognition',
      'Basic numeracy, ratio-proportion, averages, percentage, SI/CI, time-work, time-distance',
      'Data analysis using tables, bar charts, line graphs and pie charts',
    ],
  },
]

export const defaultMainsSubjects: SubjectItem[] = [
  {
    id: 'indian-constitution',
    name: 'Paper I: Indian Constitution',
    percent: 72,
    marks: '75M',
    summary: 'Constitutional development, governance, federalism, rights, decentralization, and structure of Indian democracy.',
    topics: [
      'Nature of Indian Constitution and constitutional development',
      'Preamble, Fundamental Rights, Directive Principles of State Policy, Fundamental Duties, amendment process and basic structure',
      'Structure and functions of Parliament, Executive and Judiciary',
      'Legislatures: unicameral and bicameral systems, judicial review and judicial activism',
      'Distribution of legislative and executive powers between Union and States',
      'Administrative, financial and legislative relations, constitutional bodies, RTI, Lokpal and Lok Ayukta',
      'Centre-state relations, need for reforms, federal and unitary features, party system and elections',
      'Elections, electoral reforms, anti-defection law, decentralization and 73rd & 74th constitutional amendments',
    ],
  },
  {
    id: 'ap-history-culture',
    name: 'Paper I: Andhra Pradesh History',
    percent: 65,
    marks: '75M',
    summary: 'Social and cultural history of Andhra Pradesh from prehistoric cultures to state formation and post-1956 cultural developments.',
    topics: [
      'Pre-historic cultures and Satavahanas: socio-economic and religious conditions, literature, art and architecture',
      'Ikshvakus, Vishnukundins, Eastern Chalukyas of Vengi, Andhra Cholas: society, religion, Telugu language, art and architecture',
      'Major and minor dynasties between the 11th and 16th centuries: socio-religious and economic conditions, Telugu language, literature, art and architecture',
      'Advent of Europeans, trade centres, Andhra under the Company, 1857 Revolt impact, British rule, socio-cultural awakening, Justice Party/Self Respect Movement',
      'Growth of nationalist movement in Andhra between 1885 and 1947: socialists, communists, anti-zamindari and kisan movements, national poetry, revolutionary literature, nataka samasthalu and women participation',
      'Origin and growth of Andhra Movement, Andhra Mahasabhas, prominent leaders, formation of Andhra State in 1953, press, library movement and folk and tribal culture',
      'Events leading to formation of Andhra Pradesh: Visalandhra Mahasabha, States Reorganization Commission, Gentlemen Agreement, social and cultural events from 1956 to 2014',
    ],
  },
  {
    id: 'indian-ap-economy',
    name: 'Paper II: Indian & AP Economy',
    percent: 61,
    marks: '75M',
    summary: 'Structure of the Indian and Andhra Pradesh economy, planning, public finance, agriculture, industry, services, and growth policies.',
    topics: [
      'National income, occupational pattern, sectoral distribution, economic growth and development',
      'Strategy of planning in India, New Economic Reforms 1991, decentralization of financial resources and NITI Aayog',
      'Money supply, RBI functions, monetary policy, credit control, inflation and fiscal policy',
      'Indian banking reforms, tax structure, GST, budget, balance of payments and FDI',
      'Agriculture: cropping pattern, productivity, agriculture finance, marketing, MSP, procurement and distribution',
      'Industrial development, disinvestment, ease of doing business, industrial sickness and services sector growth',
      'Andhra Pradesh economy: GSDP, sectoral contribution, PCI, state revenue, expenditure, debt and central assistance',
      'Agriculture, horticulture, fisheries, rural credit, cooperatives, industrial policy, MSMEs and AP IT policy',
    ],
  },
  {
    id: 'science-technology',
    name: 'Paper II: Science & Technology',
    percent: 58,
    marks: '75M',
    summary: 'Technology missions, energy security, biodiversity, climate, waste management, health preparedness, and sustainable development.',
    topics: [
      'National S&T policy, innovation policy, technology missions and emerging technologies',
      'Space technology: launches, satellites and applications; defence technology and DRDO missions',
      'ICT, Digital India, e-governance, cyber security and nuclear technology',
      'Energy policy, installed capacity, renewable energy, biofuels, Bharat Stage norms and energy efficiency',
      'Ecology, ecosystem, biodiversity hotspots, conservation, wildlife and biosphere reserves',
      'Waste management, pollution control, environmental regulation, eco-friendly technologies and bioremediation',
      'Global warming, climate change, acid rain, ozone depletion, sustainable development and environmental initiatives',
      'Health issues, disease burden, epidemic and pandemic preparedness, public health initiatives and outcomes',
    ],
  },
]

export const prelimsSubjects = defaultPrelimsSubjects
export const mainsSubjects = defaultMainsSubjects

const normalizeSyllabusConfig = (value: Partial<SyllabusConfig> | null | undefined): SyllabusConfig => {
  const fallback = {
    prelimsSubjects: defaultPrelimsSubjects,
    mainsSubjects: defaultMainsSubjects,
  }

  if (!value) {
    return fallback
  }

  const prelims = Array.isArray(value.prelimsSubjects) && value.prelimsSubjects.length ? value.prelimsSubjects : fallback.prelimsSubjects
  const mains = Array.isArray(value.mainsSubjects) && value.mainsSubjects.length ? value.mainsSubjects : fallback.mainsSubjects

  return {
    prelimsSubjects: prelims,
    mainsSubjects: mains,
  }
}

export const getConfiguredSyllabusData = (): SyllabusConfig => {
  if (typeof window === 'undefined') {
    return { prelimsSubjects: defaultPrelimsSubjects, mainsSubjects: defaultMainsSubjects }
  }

  try {
    const raw = window.localStorage.getItem(SYLLABUS_STORAGE_KEY)
    if (!raw) {
      return { prelimsSubjects: defaultPrelimsSubjects, mainsSubjects: defaultMainsSubjects }
    }

    return normalizeSyllabusConfig(JSON.parse(raw) as Partial<SyllabusConfig>)
  } catch {
    return { prelimsSubjects: defaultPrelimsSubjects, mainsSubjects: defaultMainsSubjects }
  }
}

export const fetchRealAppContentSyllabus = async (): Promise<SyllabusConfig | null> => {
  if (!supabase) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('app_content')
      .select('content')
      .eq('key', 'syllabus_config')
      .maybeSingle()

    if (error) {
      console.warn('Real API app_content syllabus fetch error:', error)
      return null
    }

    if (data?.content) {
      const content = data.content as Partial<SyllabusConfig>
      const realPrelims = Array.isArray(content.prelimsSubjects) ? content.prelimsSubjects : []
      const realMains = Array.isArray(content.mainsSubjects) ? content.mainsSubjects : []

      if (realPrelims.length > 0 || realMains.length > 0) {
        const realConfig: SyllabusConfig = {
          prelimsSubjects: realPrelims,
          mainsSubjects: realMains,
        }
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(SYLLABUS_STORAGE_KEY, JSON.stringify(realConfig))
        }
        return realConfig
      }
    }

    return null
  } catch (err) {
    console.error('Exception fetching real app_content from Supabase:', err)
    return null
  }
}

export const hydrateSyllabusConfigFromSupabase = async (): Promise<SyllabusConfig> => {
  const realApiData = await fetchRealAppContentSyllabus()
  if (realApiData) {
    return realApiData
  }

  return getConfiguredSyllabusData()
}

export const saveSyllabusData = async (data: SyllabusConfig) => {
  const normalized = normalizeSyllabusConfig(data)

  if (!supabase) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SYLLABUS_STORAGE_KEY, JSON.stringify(normalized))
    }
    return normalized
  }

  const { error } = await supabase.from('app_content').upsert(
    {
      key: 'syllabus_config',
      content: normalized,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  )

  if (error) {
    throw error
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SYLLABUS_STORAGE_KEY, JSON.stringify(normalized))
  }

  return normalized
}

export const resetSyllabusData = async () => {
  const defaults = { prelimsSubjects: defaultPrelimsSubjects, mainsSubjects: defaultMainsSubjects }
  await saveSyllabusData(defaults)
  return defaults
}

const MOCK_TESTS_KEY = 'appsc_mock_tests'
const MOCK_ATTEMPTS_KEY = 'appsc_mock_attempts'

export const defaultMockTests: MockTest[] = [
  {
    id: 'mock-polity-prelims-1',
    title: 'Indian Polity Daily Test',
    schedule: 'Daily',
    durationMinutes: 25,
    createdAt: new Date().toISOString(),
    paperType: 'Prelims',
    subjectId: 'indian-society',
    subjectName: 'Indian Society',
    source: 'api',
    questions: [
      {
        id: 'polity-q-1',
        subjectId: 'indian-society',
        subjectName: 'Indian Society',
        paperType: 'Prelims',
        prompt: 'Which Article of the Indian Constitution guarantees the right to equality before the law?',
        options: ['Article 14', 'Article 19', 'Article 21', 'Article 32'],
        correctIndex: 0,
        explanation: 'Article 14 enshrines equality before the law and equal protection of the laws.',
      },
      {
        id: 'polity-q-2',
        subjectId: 'indian-society',
        subjectName: 'Indian Society',
        paperType: 'Prelims',
        prompt: 'Who is the final interpreter of the Constitution?',
        options: ['Parliament', 'President', 'Supreme Court', 'Election Commission'],
        correctIndex: 2,
        explanation: 'The Supreme Court of India is the final interpreter and guardian of the Constitution.',
      },
      {
        id: 'polity-q-3',
        subjectId: 'indian-society',
        subjectName: 'Indian Society',
        paperType: 'Prelims',
        prompt: 'Which constitutional amendment introduced Panchayati Raj institutions?',
        options: ['42nd Amendment', '44th Amendment', '73rd Amendment', '86th Amendment'],
        correctIndex: 2,
        explanation: 'The 73rd Constitutional Amendment gave constitutional status to Panchayati Raj institutions.',
      },
    ],
  },
  {
    id: 'mock-economy-prelims-1',
    title: 'Economy Weekly Test',
    schedule: 'Weekly',
    durationMinutes: 35,
    createdAt: new Date().toISOString(),
    paperType: 'Prelims',
    subjectId: 'geography',
    subjectName: 'Geography',
    source: 'api',
    questions: [
      {
        id: 'eco-q-1',
        subjectId: 'geography',
        subjectName: 'Geography',
        paperType: 'Prelims',
        prompt: 'What does GDP measure?',
        options: ['Only final goods and services produced in the economy', 'Only exports', 'Only government spending', 'Only agricultural output'],
        correctIndex: 0,
        explanation: 'GDP measures the market value of all final goods and services produced within a country in a given period.',
      },
      {
        id: 'eco-q-2',
        subjectId: 'geography',
        subjectName: 'Geography',
        paperType: 'Prelims',
        prompt: 'Which institution is primarily responsible for monetary policy in India?',
        options: ['SEBI', 'RBI', 'NITI Aayog', 'Finance Ministry'],
        correctIndex: 1,
        explanation: 'The Reserve Bank of India formulates and implements the country’s monetary policy.',
      },
      {
        id: 'eco-q-3',
        subjectId: 'geography',
        subjectName: 'Geography',
        paperType: 'Prelims',
        prompt: 'Which sector is the largest contributor to India’s GDP?',
        options: ['Agriculture', 'Services', 'Manufacturing', 'Mining'],
        correctIndex: 1,
        explanation: 'The services sector is the dominant contributor to India’s GDP.',
      },
    ],
  },
  {
    id: 'mock-constitution-mains-1',
    title: 'Constitution Mains Test',
    schedule: 'Weekly',
    durationMinutes: 40,
    createdAt: new Date().toISOString(),
    paperType: 'Mains',
    subjectId: 'indian-constitution',
    subjectName: 'Paper I: Indian Constitution',
    source: 'api',
    questions: [
      {
        id: 'const-q-1',
        subjectId: 'indian-constitution',
        subjectName: 'Paper I: Indian Constitution',
        paperType: 'Mains',
        prompt: 'The basic structure doctrine was established in which case?',
        options: ['Golaknath v. State of Punjab', 'Kesavananda Bharati v. State of Kerala', 'Minerva Mills v. Union of India', 'S.R. Bommai v. Union of India'],
        correctIndex: 1,
        explanation: 'Kesavananda Bharati is the landmark judgment that articulated the basic structure doctrine.',
      },
      {
        id: 'const-q-2',
        subjectId: 'indian-constitution',
        subjectName: 'Paper I: Indian Constitution',
        paperType: 'Mains',
        prompt: 'Which Article provides for a Uniform Civil Code as a directive principle?',
        options: ['Article 39', 'Article 44', 'Article 51A', 'Article 17'],
        correctIndex: 1,
        explanation: 'Article 44 directs the State to secure a Uniform Civil Code for the citizens.',
      },
      {
        id: 'const-q-3',
        subjectId: 'indian-constitution',
        subjectName: 'Paper I: Indian Constitution',
        paperType: 'Mains',
        prompt: 'The concept of judicial review in India is rooted in:',
        options: ['Directive Principles', 'Federalism', 'Rule of law', 'Parliamentary supremacy'],
        correctIndex: 2,
        explanation: 'Judicial review is a key feature of the rule of law and constitutional supremacy in India.',
      },
    ],
  },
]

const normalizeMockTest = (test: Partial<MockTest> | null | undefined): MockTest | null => {
  if (!test) return null

  const fallbackPaperType = test.paperType === 'Mains' ? 'Mains' : 'Prelims'

  return {
    id: test.id ?? `mock-${Date.now()}`,
    title: test.title ?? 'Mock test',
    schedule: test.schedule === 'Weekly' ? 'Weekly' : 'Daily',
    durationMinutes: Number(test.durationMinutes ?? 30),
    createdAt: test.createdAt ?? new Date().toISOString(),
    paperType: fallbackPaperType,
    subjectId: test.subjectId ?? undefined,
    subjectName: test.subjectName ?? undefined,
    source: test.source ?? 'local',
    assessmentMode: test.assessmentMode === 'official-pattern' ? 'official-pattern' : 'practice',
    questions: Array.isArray(test.questions) ? test.questions.map((question) => ({
      id: question.id ?? `${test.id}-q-${Math.random()}`,
      subjectId: question.subjectId ?? test.subjectId,
      subjectName: question.subjectName ?? test.subjectName,
      paperType: question.paperType ?? fallbackPaperType,
      prompt: question.prompt ?? 'Sample question',
      options: Array.isArray(question.options) && question.options.length ? question.options : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: Number(question.correctIndex ?? 0),
      explanation: question.explanation ?? 'Answer explanation',
      sourceTitle: question.sourceTitle,
      sourceUrl: question.sourceUrl,
      sourcePublishedAt: question.sourcePublishedAt,
    })) : [],
  }
}

export const getStoredMockTests = (): MockTest[] => {
  if (typeof window === 'undefined') {
    return defaultMockTests
  }

  try {
    const raw = window.localStorage.getItem(MOCK_TESTS_KEY)
    if (!raw) {
      window.localStorage.setItem(MOCK_TESTS_KEY, JSON.stringify(defaultMockTests))
      return defaultMockTests
    }

    const parsed = JSON.parse(raw) as Partial<MockTest>[]
    const normalized = parsed.map(normalizeMockTest).filter((item): item is MockTest => Boolean(item))
    return normalized.length ? normalized : defaultMockTests
  } catch {
    return defaultMockTests
  }
}

export const saveStoredMockTests = (tests: MockTest[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MOCK_TESTS_KEY, JSON.stringify(tests))
  }
}

export const getStoredUserMockAttempts = (userId: string): MockAttempt[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(`${MOCK_ATTEMPTS_KEY}:${userId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MockAttempt[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const saveStoredUserMockAttempts = (userId: string, attempts: MockAttempt[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(`${MOCK_ATTEMPTS_KEY}:${userId}`, JSON.stringify(attempts))
  }
}

export const subjectProgress = [...defaultPrelimsSubjects, ...defaultMainsSubjects]

export const weeklyHours = [
  { day: 'Mon', value: 3.5 },
  { day: 'Tue', value: 4.2 },
  { day: 'Wed', value: 2.1 },
  { day: 'Thu', value: 4.8 },
  { day: 'Fri', value: 3.9 },
  { day: 'Sat', value: 5.1 },
  { day: 'Sun', value: 3.4 },
]

export const monthlyProgress = [
  { month: 'Jan', percent: 26 },
  { month: 'Feb', percent: 34 },
  { month: 'Mar', percent: 49 },
  { month: 'Apr', percent: 62 },
  { month: 'May', percent: 71 },
  { month: 'Jun', percent: 81 },
]

export type MonthlyTrendPoint = {
  month: string
  percent: number
  attempts: number
}

export type WeakArea = {
  subject: string
  accuracy: number
  priority: 'High' | 'Medium' | 'Low'
  action: string
}

export const getMonthlyPerformanceTrend = (userId: string): MonthlyTrendPoint[] => {
  const attempts = getStoredUserMockAttempts(userId)

  if (!attempts.length) {
    return monthlyProgress.map((point) => ({ ...point, attempts: 0 }))
  }

  const monthMap = new Map<string, { total: number; count: number }>()

  attempts.forEach((attempt) => {
    const submittedDate = new Date(attempt.submittedAt)
    const key = submittedDate.toLocaleString('en-US', { month: 'short' })
    const total = Number(attempt.total ?? 0)
    const score = Number(attempt.score ?? 0)

    if (!monthMap.has(key)) {
      monthMap.set(key, { total: 0, count: 0 })
    }

    const bucket = monthMap.get(key)!
    bucket.total += total > 0 ? Math.round((score / total) * 100) : 0
    bucket.count += 1
  })

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - index))
    return date.toLocaleString('en-US', { month: 'short' })
  })

  return months.map((month) => {
    const bucket = monthMap.get(month)
    const attemptsForMonth = bucket?.count ?? 0
    const percent = bucket ? Math.round(bucket.total / Math.max(bucket.count, 1)) : 0

    return {
      month,
      percent: Math.max(0, Math.min(100, percent || (attemptsForMonth ? 50 : 0))),
      attempts: attemptsForMonth,
    }
  })
}

export const getWeakAreas = (userId: string): WeakArea[] => {
  const attempts = getStoredUserMockAttempts(userId)

  if (!attempts.length) {
    return [
      { subject: 'Economy', accuracy: 52, priority: 'High', action: 'Revise fiscal policy and GDP indicators' },
      { subject: 'Science & Tech', accuracy: 58, priority: 'Medium', action: 'Practice recent scientific developments and applications' },
      { subject: 'Current Affairs', accuracy: 61, priority: 'Medium', action: 'Revisit monthly government schemes and app updates' },
    ]
  }

  const subjectMap = new Map<string, { total: number; score: number }>()

  attempts.forEach((attempt) => {
    const subjectKey = attempt.subjectName || 'General'
    if (!subjectMap.has(subjectKey)) {
      subjectMap.set(subjectKey, { total: 0, score: 0 })
    }

    const bucket = subjectMap.get(subjectKey)!
    const total = Number(attempt.total ?? 0)
    const score = Number(attempt.score ?? 0)
    bucket.total += total
    bucket.score += score
  })

  return Array.from(subjectMap.entries())
    .map(([subject, metrics]): WeakArea => {
      const accuracy = metrics.total ? Math.round((metrics.score / metrics.total) * 100) : 0
      const priority: WeakArea['priority'] = accuracy < 60 ? 'High' : accuracy < 75 ? 'Medium' : 'Low'

      return {
        subject,
        accuracy,
        priority,
        action: subject.toLowerCase().includes('economy')
          ? 'Revise GDP, inflation and fiscal indicators'
          : subject.toLowerCase().includes('science')
            ? 'Focus on environment, space and innovation updates'
            : 'Prioritise current affairs and revision cycles',
      }
    })
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)
}

export const revisionQueue = [
  'Fundamental Rights',
  'Land Reforms in AP',
  'Constitutional Bodies',
  'Modern Indian History',
  'Rural Development',
]

export const studyPlan = [
  { day: 'Day 1', topic: 'Polity basics + MCQ practice', duration: '4 hrs' },
  { day: 'Day 2', topic: 'AP History timeline study', duration: '3.5 hrs' },
  { day: 'Day 3', topic: 'Current affairs review + revision', duration: '3 hrs' },
  { day: 'Day 4', topic: 'Economy key concepts + notes', duration: '4 hrs' },
  { day: 'Day 5', topic: 'Mock test + analysis', duration: '5 hrs' },
]

export type PracticeMetric = {
  label: 'Attempted' | 'Correct' | 'Wrong' | 'Skipped'
  value: number
  detail: string
  source: 'api' | 'local'
  updatedAt: string
}

export const getPracticeMetrics = (userId: string): PracticeMetric[] => {
  const attempts = getStoredUserMockAttempts(userId)

  const totalAttempted = attempts.reduce((sum, attempt) => sum + (attempt.total || 0), 0)
  const totalCorrect = attempts.reduce((sum, attempt) => sum + (attempt.correct ?? attempt.score ?? 0), 0)
  const totalWrong = attempts.reduce((sum, attempt) => sum + (attempt.wrong ?? Math.max((attempt.total || 0) - (attempt.correct ?? attempt.score ?? 0) - (attempt.skipped ?? 0), 0)), 0)
  const totalSkipped = attempts.reduce((sum, attempt) => sum + (attempt.skipped ?? 0), 0)

  const updatedAt = attempts[0]?.submittedAt ?? new Date().toISOString()

  return [
    {
      label: 'Attempted',
      value: totalAttempted,
      detail: `${attempts.length} test attempts recorded`,
      source: attempts.length ? 'api' : 'local',
      updatedAt,
    },
    {
      label: 'Correct',
      value: totalCorrect,
      detail: `${totalAttempted ? Math.round((totalCorrect / totalAttempted) * 100) : 0}% accuracy`,
      source: attempts.length ? 'api' : 'local',
      updatedAt,
    },
    {
      label: 'Wrong',
      value: totalWrong,
      detail: `${totalAttempted ? Math.round((totalWrong / totalAttempted) * 100) : 0}% error rate`,
      source: attempts.length ? 'api' : 'local',
      updatedAt,
    },
    {
      label: 'Skipped',
      value: totalSkipped,
      detail: `${totalAttempted ? Math.round((totalSkipped / totalAttempted) * 100) : 0}% left blank`,
      source: attempts.length ? 'api' : 'local',
      updatedAt,
    },
  ]
}

export const practiceMetrics = getPracticeMetrics('demo-user')
