export type TopicPracticeQuestion = {
  id: string
  topicId: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
}

export const TOPIC_PRACTICE_QUESTIONS: TopicPracticeQuestion[] = [
  {
    id: 'practice-constitution-equality',
    topicId: 'constitution-rights',
    prompt: 'Which constitutional article guarantees equality before the law and equal protection of the laws?',
    options: ['Article 14', 'Article 19', 'Article 21', 'Article 32'],
    correctIndex: 0,
    explanation: 'Article 14 provides equality before the law and equal protection of the laws.',
  },
  {
    id: 'practice-constitution-directive',
    topicId: 'constitution-rights',
    prompt: 'Directive Principles of State Policy are primarily intended to guide:',
    options: ['State policy and governance', 'Private contracts', 'Judicial appointments only', 'Election schedules'],
    correctIndex: 0,
    explanation: 'Directive Principles guide the State in making laws and shaping policy.',
  },
  {
    id: 'practice-ap-movement',
    topicId: 'ap-movement',
    prompt: 'Which outcome is most directly associated with the Andhra movement?',
    options: ['Formation of Andhra State in 1953', 'Creation of the Planning Commission', 'Adoption of the 73rd Amendment', 'Formation of the RBI'],
    correctIndex: 0,
    explanation: 'The Andhra movement led to the formation of Andhra State in 1953.',
  },
  {
    id: 'practice-economy-deficit',
    topicId: 'economy-public-finance',
    prompt: 'Fiscal deficit is broadly the gap between total expenditure and:',
    options: ['Receipts excluding borrowings', 'Tax revenue alone', 'Capital expenditure alone', 'Exports and imports'],
    correctIndex: 0,
    explanation: 'Fiscal deficit is total expenditure minus total receipts excluding borrowings.',
  },
  {
    id: 'practice-screening-godavari',
    topicId: 'screening-ap-geography',
    prompt: 'Which river is commonly identified as the longest river in Peninsular India?',
    options: ['Godavari', 'Krishna', 'Kaveri', 'Mahanadi'],
    correctIndex: 0,
    explanation: 'The Godavari is the longest river in Peninsular India.',
  },
  {
    id: 'practice-screening-data',
    topicId: 'screening-arithmetic',
    prompt: 'A value rises from 80 to 100. What is the percentage increase?',
    options: ['20%', '25%', '80%', '125%'],
    correctIndex: 1,
    explanation: 'The increase is 20; 20 divided by the original 80 is 25%.',
  },
  {
    id: 'practice-screening-reasoning',
    topicId: 'screening-reasoning',
    prompt: 'What number comes next in the sequence 3, 6, 12, 24?',
    options: ['30', '36', '42', '48'],
    correctIndex: 3,
    explanation: 'Each term is doubled, so the next term is 48.',
  },
  {
    id: 'practice-screening-ecology',
    topicId: 'screening-ecology',
    prompt: 'Biodiversity refers most directly to the variety of:',
    options: ['Life forms and their ecosystems', 'Only cultivated crops', 'Only climatic zones', 'Mineral resources'],
    correctIndex: 0,
    explanation: 'Biodiversity covers variety within species, between species, and across ecosystems.',
  },
]

export const getTopicPracticeQuestions = (topicId: string) =>
  TOPIC_PRACTICE_QUESTIONS.filter((question) => question.topicId === topicId)