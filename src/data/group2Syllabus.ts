import type { SyllabusPaper, SyllabusSource, SyllabusSubject, SyllabusTopic, SyllabusUnit } from '../types/studyPlanner'

export const APPSC_GROUP_II_SOURCES: SyllabusSource[] = [
  {
    label: 'APPSC Group-II syllabus, published 27 April 2023',
    url: 'https://psc.ap.gov.in/Documents/NotificationDocuments/Syllabus%20for%20GROUP%20II%20Services_01052023.pdf',
    publishedAt: '2023-04-27',
    scope: 'official-heading',
  },
  {
    label: 'APPSC Group-II Notification No. 37/2026, scheme and syllabus (13 October 2026)',
    url: 'https://psc.ap.gov.in/Documents/NotificationDocuments/Group_II_372026.pdf',
    publishedAt: '2026-10-13',
    scope: 'official-heading',
  },
]

export const GROUP_II_SCHEME_NOTICE =
  'Notification 37/2026 specifies Screening: 150 questions, 150 minutes, 150 marks; Mains Papers I and II: 150 questions, 150 minutes, 150 marks each. Each wrong answer is penalized by one-third of that question\'s marks. In-app tests are shorter practice sets and do not apply official negative marking.'

export const ADMIN_SYLLABUS_TARGETS: Record<string, { type: 'unit' | 'subject'; id: string }> = {
  'indian-history': { type: 'unit', id: 'screening-history' },
  geography: { type: 'unit', id: 'screening-geography' },
  'indian-society': { type: 'unit', id: 'screening-society' },
  'current-affairs': { type: 'unit', id: 'screening-current-affairs-unit' },
  'mental-ability': { type: 'unit', id: 'screening-mental-ability' },
  'ap-history-culture': { type: 'subject', id: 'ap-history-culture' },
  'indian-constitution': { type: 'subject', id: 'indian-constitution' },
  'indian-ap-economy': { type: 'subject', id: 'indian-ap-economy' },
  'science-technology': { type: 'subject', id: 'science-technology' },
}

const topic = (
  id: string,
  title: string,
  objective: string,
  estimatedMinutes: number,
  difficulty: SyllabusTopic['difficulty'],
  priority: SyllabusTopic['priority'],
): SyllabusTopic => ({
  id,
  title,
  subtopics: title.split(/,| and /i).map((item) => item.trim()).filter(Boolean),
  learningObjectives: [objective],
  estimatedMinutes,
  difficulty,
  priority,
  source: 'suggested-detail',
})

const subject = (id: string, title: string, units: SyllabusUnit[], marks?: number): SyllabusSubject => ({
  id,
  title,
  units,
  source: 'official-heading',
  marks,
})
const unit = (id: string, title: string, topics: SyllabusTopic[], marks?: number): SyllabusUnit => ({
  id,
  title,
  topics,
  source: marks === undefined ? 'suggested-detail' : 'official-heading',
  marks,
})

const screeningSubject = subject('screening-general-studies', 'General Studies and Mental Ability', [
  unit('screening-history', 'Indian History (30M)', [
    topic('screening-indian-history', 'Indian history and society', 'Build a period-wise outline of major political, social, and cultural developments in India.', 90, 'moderate', 'high'),
    topic('screening-national-movement', 'Indian national movement', 'Connect key events, organizations, leaders, and constitutional milestones in the freedom movement.', 90, 'challenging', 'high'),
  ], 30),
  unit('screening-geography', 'Geography (30M)', [
    topic('screening-physical-geography', 'Physical geography and climate', 'Explain landforms, climate systems, drainage, and natural hazards relevant to India.', 75, 'moderate', 'medium'),
    topic('screening-ap-geography', 'India and Andhra Pradesh: resources and development', 'Relate physiography, water, soils, agriculture, and settlement patterns to regional development.', 90, 'moderate', 'high'),
    topic('screening-disaster-management', 'Environment, hazards, and disaster response', 'Identify common hazards and connect preparedness, mitigation, and sustainable resource use.', 60, 'easy', 'medium'),
    topic('screening-indian-economy', 'Natural resources and economic geography', 'Map natural resources, agriculture, industries, transport, communication, tourism, and trade.', 90, 'challenging', 'high'),
    topic('screening-ap-economy', 'Andhra Pradesh economic geography', 'Review Andhra Pradesh resources, agriculture, industries, and regional economic geography.', 75, 'moderate', 'high'),
    topic('screening-economy-sectors', 'Human geography and settlement patterns', 'Relate human development, demographics, urbanization, migration, and social groups to place.', 75, 'moderate', 'medium'),
    topic('screening-ecology', 'Environment, biodiversity, and climate', 'Review environmental systems, biodiversity, climate patterns, and their geographic impacts.', 75, 'moderate', 'high'),
  ], 30),
  unit('screening-society', 'Indian Society (30M)', [
    topic('screening-constitution-basics', 'Structure of Indian society', 'Review family, marriage, kinship, caste, tribe, ethnicity, religion, and women in Indian society.', 90, 'moderate', 'high'),
    topic('screening-governance', 'Social issues and vulnerable groups', 'Study casteism, communalism, regionalization, crimes against women, child abuse, child labour, and youth unrest.', 75, 'moderate', 'high'),
    topic('screening-ap-governance', 'Public policy and welfare mechanisms', 'Review public policies and constitutional or statutory provisions for protected groups.', 75, 'moderate', 'high'),
  ], 30),
  unit('screening-current-affairs-unit', 'Current Affairs (30M)', [
    topic('screening-current-affairs', 'International, national, and Andhra Pradesh current affairs', 'Track major current events and issues across international, national, and Andhra Pradesh contexts.', 45, 'easy', 'high'),
    topic('screening-general-science', 'Science and environment in current affairs', 'Connect recent science, technology, and environmental developments to public issues.', 60, 'moderate', 'medium'),
    topic('screening-science-tech', 'Andhra Pradesh state developments', 'Review dated state initiatives, governance developments, and public programmes from official sources.', 60, 'moderate', 'high'),
  ], 30),
  unit('screening-mental-ability', 'Mental Ability (30M)', [
    topic('screening-arithmetic', 'Numerical aptitude and data interpretation', 'Solve percentage, ratio, average, and table or chart interpretation problems.', 75, 'moderate', 'high'),
    topic('screening-reasoning', 'Logical reasoning and analytical ability', 'Practice series, relations, coding, statements, and structured reasoning problems.', 75, 'moderate', 'high'),
  ], 30),
], 150)

const mainsPaperOne = [
  subject('ap-history-culture', 'Social and cultural history of Andhra Pradesh', [
    unit('ap-early-history', 'Early societies and regional dynasties', [
      topic('screening-ap-history', 'Andhra region: history and cultural context', 'Review major Andhra-region developments in the context of Andhra Pradesh social and cultural history.', 75, 'moderate', 'high'),
      topic('ap-prehistoric-satavahana', 'Prehistoric cultures and the Satavahanas', 'Outline early regional cultures and assess Satavahana-era society, economy, religion, and culture.', 90, 'moderate', 'high'),
      topic('ap-dynasties', 'Regional dynasties and cultural development', 'Compare selected Andhra dynasties through administration, language, literature, and architecture.', 90, 'challenging', 'high'),
    ]),
    unit('ap-colonial-and-reform', 'Colonial period and social change', [
      topic('ap-colonial-period', 'Colonial rule and social awakening in Andhra', 'Trace colonial expansion, social reform, and changing political organization in the Andhra region.', 90, 'challenging', 'high'),
      topic('ap-national-movement', 'National and peasant movements in Andhra', 'Relate regional participation, reform movements, and people’s organizations to the wider national movement.', 90, 'challenging', 'high'),
    ]),
    unit('ap-state-formation', 'Andhra movement and state formation', [
      topic('ap-movement', 'Andhra movement and formation of Andhra State', 'Explain the causes, milestones, leaders, and consequences of the Andhra movement.', 75, 'moderate', 'high'),
      topic('ap-formation', 'Formation and development of Andhra Pradesh', 'Review state formation milestones and major social and cultural changes after 1956.', 75, 'moderate', 'high'),
    ]),
  ], 75),
  subject('indian-constitution', 'Indian Constitution', [
    unit('constitution-foundations', 'Constitutional foundations', [
      topic('constitution-development', 'Constitutional development and basic features', 'Explain constitutional development, the Preamble, basic structure, and amendment process.', 75, 'moderate', 'high'),
      topic('constitution-rights', 'Fundamental rights, duties, and directive principles', 'Compare rights, duties, and directive principles and apply them to governance scenarios.', 75, 'moderate', 'high'),
    ]),
    unit('constitution-institutions', 'Union, state, and constitutional institutions', [
      topic('constitution-organs', 'Legislature, executive, and judiciary', 'Describe the composition, functions, and checks among the principal organs of government.', 90, 'challenging', 'high'),
      topic('constitution-federalism', 'Federalism and Union-State relations', 'Assess legislative, administrative, and financial relations between the Union and States.', 75, 'challenging', 'high'),
      topic('constitution-local-government', 'Local government and democratic decentralization', 'Explain local self-government and the role of decentralization in public administration.', 60, 'moderate', 'medium'),
    ]),
  ], 75),
] satisfies SyllabusSubject[]

const mainsPaperTwo = [
  subject('indian-ap-economy', 'Indian and Andhra Pradesh economy', [
    unit('economy-foundations', 'Growth, planning, and public finance', [
      topic('economy-growth', 'Economic growth, development, and planning', 'Interpret growth and development measures and summarize India’s planning approach.', 75, 'moderate', 'high'),
      topic('economy-public-finance', 'Money, banking, inflation, and public finance', 'Explain monetary policy, banking, inflation, taxation, budgets, and fiscal indicators.', 90, 'challenging', 'high'),
    ]),
    unit('economy-sectors', 'Agriculture, industry, and services', [
      topic('economy-agriculture', 'Agriculture, rural credit, and markets', 'Connect farm productivity, credit, markets, procurement, and rural development.', 75, 'moderate', 'high'),
      topic('economy-industry', 'Industry, infrastructure, and services', 'Assess industrial development, infrastructure, MSMEs, and services-sector trends.', 75, 'moderate', 'medium'),
    ]),
    unit('economy-andhra-pradesh', 'Andhra Pradesh economy', [
      topic('economy-ap-indicators', 'Andhra Pradesh economic indicators', 'Read state budget and statistical publications to summarize current economic indicators.', 75, 'challenging', 'high'),
      topic('economy-ap-sectors', 'Andhra Pradesh sectoral development', 'Review agriculture, industry, services, and state development programmes using official data.', 75, 'moderate', 'high'),
    ]),
  ], 75),
  subject('science-technology', 'Science and technology', [
    unit('science-policy', 'Science, technology, and innovation', [
      topic('science-innovation', 'Science policy, research, and emerging technologies', 'Summarize major science and technology policy areas and assess practical implications.', 75, 'moderate', 'medium'),
      topic('science-space-ict', 'Space, information technology, and cyber security', 'Explain public applications and governance concerns across space and digital technologies.', 75, 'moderate', 'medium'),
    ]),
    unit('science-energy-environment', 'Energy and environmental sustainability', [
      topic('science-energy', 'Energy security and renewable energy', 'Compare energy sources, efficiency approaches, and energy-security trade-offs.', 60, 'moderate', 'medium'),
      topic('science-environment', 'Biodiversity, pollution, and climate change', 'Connect ecological systems, conservation, pollution control, and climate action.', 75, 'moderate', 'high'),
    ]),
    unit('science-health', 'Health and public science', [
      topic('science-public-health', 'Public health and disease preparedness', 'Summarize public-health challenges and the role of preparedness and evidence-based response.', 60, 'easy', 'medium'),
    ]),
  ], 75),
] satisfies SyllabusSubject[]

export const APPSC_GROUP_II_SYLLABUS_VERSION = '2026-10-13'

const OFFICIAL_OBJECTIVE_SCHEME = {
  questionCount: 150,
  durationMinutes: 150,
  maximumMarks: 150,
  negativeMarking: { numerator: 1, denominator: 3 },
}

export const APPSC_GROUP_II_SYLLABUS: SyllabusPaper[] = [
  {
    id: 'screening',
    title: 'Screening Test: General Studies and Mental Ability',
    kind: 'screening',
    source: 'official-heading',
    scheme: OFFICIAL_OBJECTIVE_SCHEME,
    subjects: [screeningSubject],
  },
  {
    id: 'mains-paper-i',
    title: 'Mains Paper I',
    kind: 'mains',
    source: 'official-heading',
    scheme: OFFICIAL_OBJECTIVE_SCHEME,
    subjects: mainsPaperOne,
  },
  {
    id: 'mains-paper-ii',
    title: 'Mains Paper II',
    kind: 'mains',
    source: 'official-heading',
    scheme: OFFICIAL_OBJECTIVE_SCHEME,
    subjects: mainsPaperTwo,
  },
]

type AdminSubjectContent = {
  id: string
  name: string
  topics: string[]
}

let currentSyllabus = APPSC_GROUP_II_SYLLABUS

const PRACTICE_TOPIC_ALIASES: Record<string, Array<{ pattern: RegExp; topicId: string }>> = {
  'indian-history': [
    { pattern: /indus valley|vedic age|ancient history/i, topicId: 'screening-indian-history' },
    { pattern: /national movement/i, topicId: 'screening-national-movement' },
  ],
  geography: [{ pattern: /andhra pradesh|india and ap/i, topicId: 'screening-ap-geography' }],
  'mental-ability': [
    { pattern: /numerical aptitude|basic numeracy|percentage|ratio/i, topicId: 'screening-arithmetic' },
    { pattern: /logical reasoning|analytical ability/i, topicId: 'screening-reasoning' },
  ],
  'ap-history-culture': [{ pattern: /andhra movement/i, topicId: 'ap-movement' }],
  'indian-constitution': [{ pattern: /fundamental rights|directive principles/i, topicId: 'constitution-rights' }],
  'indian-ap-economy': [{ pattern: /money|banking|public finance/i, topicId: 'economy-public-finance' }],
  'science-technology': [{ pattern: /biodiversity|pollution|climate change/i, topicId: 'screening-ecology' }],
}

const toAdminTopics = (subject: AdminSubjectContent): SyllabusTopic[] => {
  const slugCounts = new Map<string, number>()
  return subject.topics.map((rawTitle) => {
    const title = rawTitle.trim()
    const slug = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'topic'
    const occurrence = slugCounts.get(slug) ?? 0
    slugCounts.set(slug, occurrence + 1)
    const practiceAlias = PRACTICE_TOPIC_ALIASES[subject.id]?.find((alias) => alias.pattern.test(title))?.topicId
    return {
      id: practiceAlias ?? `admin-${subject.id}-${slug}${occurrence ? `-${occurrence + 1}` : ''}`,
      title,
      subtopics: [],
      learningObjectives: [],
      estimatedMinutes: 60,
      difficulty: 'moderate' as const,
      priority: 'high' as const,
      source: 'admin-reference' as const,
    }
  }).filter((topic) => topic.title.length > 0)
}

export const setAdminSyllabusConfig = (config: { prelimsSubjects: AdminSubjectContent[]; mainsSubjects: AdminSubjectContent[] }) => {
  const adminSubjects = new Map([...config.prelimsSubjects, ...config.mainsSubjects].map((subject) => [subject.id, subject]))

  currentSyllabus = APPSC_GROUP_II_SYLLABUS.map((paper) => {
    if (paper.id === 'screening') {
      return {
        ...paper,
        subjects: paper.subjects.map((syllabusSubject) => ({
          ...syllabusSubject,
          units: syllabusSubject.units.map((syllabusUnit) => {
            const target = Object.entries(ADMIN_SYLLABUS_TARGETS).find(([, destination]) => destination.type === 'unit' && destination.id === syllabusUnit.id)?.[0]
            const adminSubject = target ? adminSubjects.get(target) : undefined
            return adminSubject?.topics.length
              ? { ...syllabusUnit, topics: toAdminTopics(adminSubject) }
              : syllabusUnit
          }),
        })),
      }
    }

    return {
      ...paper,
      subjects: paper.subjects.map((syllabusSubject) => {
        const adminSubject = adminSubjects.get(syllabusSubject.id)
        if (!adminSubject?.topics.length) return syllabusSubject
        return {
          ...syllabusSubject,
          units: [{
            id: `admin-${syllabusSubject.id}-ordered-topics`,
            title: `${adminSubject.name}: syllabus order`,
            source: 'admin-reference',
            topics: toAdminTopics(adminSubject),
          }],
        }
      }),
    }
  })
}

export const getCurrentGroup2Syllabus = () => currentSyllabus

export const getAllSyllabusTopics = () => currentSyllabus.flatMap((paper) =>
  paper.subjects.flatMap((syllabusSubject) => syllabusSubject.units.flatMap((syllabusUnit) => syllabusUnit.topics)),
)