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

export const hydrateSyllabusConfigFromSupabase = async (): Promise<SyllabusConfig> => {
  const fallback = getConfiguredSyllabusData()

  if (!supabase) {
    return fallback
  }

  try {
    const { data, error } = await supabase
      .from('app_content')
      .select('content')
      .eq('key', 'syllabus_config')
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      return fallback
    }

    const next = normalizeSyllabusConfig((data?.content as Partial<SyllabusConfig>) ?? null)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SYLLABUS_STORAGE_KEY, JSON.stringify(next))
    }

    return next
  } catch {
    return fallback
  }
}

export const saveSyllabusData = async (data: SyllabusConfig) => {
  const normalized = normalizeSyllabusConfig(data)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SYLLABUS_STORAGE_KEY, JSON.stringify(normalized))
  }

  if (!supabase) {
    return normalized
  }

  try {
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

    return normalized
  } catch {
    return normalized
  }
}

export const resetSyllabusData = async () => {
  const defaults = { prelimsSubjects: defaultPrelimsSubjects, mainsSubjects: defaultMainsSubjects }
  await saveSyllabusData(defaults)
  return defaults
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

export const practiceMetrics = [
  { label: 'Attempted', value: 248 },
  { label: 'Correct', value: 186 },
  { label: 'Wrong', value: 62 },
  { label: 'Skipped', value: 12 },
]
