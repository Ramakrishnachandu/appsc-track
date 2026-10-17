import { useEffect, useRef, useState } from 'react'
import { Box, Card, CardContent, LinearProgress } from '@mui/material'
import { getConfiguredSyllabusData } from '../data/dashboardData'
import { getUserSubjectProgress } from '../lib/userProgress'
import { useAppStore } from '../store/useAppStore'

export function SubjectsPage() {
  const { user } = useAppStore()
  const { prelimsSubjects: configuredPrelims, mainsSubjects: configuredMains } = getConfiguredSyllabusData()
  const allSubjects = [...configuredPrelims, ...configuredMains]
  const liveProgress = getUserSubjectProgress(user?.id ?? 'demo-user', allSubjects)
  const subjectGroups = [
    { title: 'Prelims', items: configuredPrelims },
    { title: 'Mains', items: configuredMains },
  ]

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(allSubjects[0]?.id ?? null)
  const [activeFilter, setActiveFilter] = useState<'All' | 'Prelims' | 'Mains'>('All')
  const detailRef = useRef<HTMLDivElement | null>(null)

  const visibleGroups = subjectGroups.filter((group) => activeFilter === 'All' || group.title === activeFilter)
  const visibleSubjects = visibleGroups.flatMap((group) => group.items)
  const selectedSubject = allSubjects.find((subject) => subject.id === selectedSubjectId) || visibleSubjects[0] || null

  useEffect(() => {
    if (visibleSubjects.length === 0) return

    if (!selectedSubjectId || !visibleSubjects.some((subject) => subject.id === selectedSubjectId)) {
      setSelectedSubjectId(visibleSubjects[0].id)
    }
  }, [selectedSubjectId, visibleSubjects])

  useEffect(() => {
    if (detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedSubjectId, activeFilter])

  return (
    <Box className="page-shell">
      <Card className="panel-card exam-pattern-card">
        <CardContent>
          <div className="exam-pattern-header">
            <h2>APPSC Group II Exam Pattern</h2>
          </div>

          <div className="exam-pattern-grid">
            <div className="pattern-pill">
              <span>Prelims</span>
              <strong>4 sections</strong>
            </div>
            <div className="pattern-pill">
              <span>Mains</span>
              <strong>2 papers</strong>
            </div>
            <div className="pattern-pill">
              <span>Weightage</span>
              <strong>150 + 150 marks</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="subject-filter-row">
        {(['All', 'Prelims', 'Mains'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            className={activeFilter === filter ? 'subject-filter active' : 'subject-filter'}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="subject-group-grid">
        {visibleGroups.map((group) => (
          <Card key={group.title} className="panel-card compact-card subject-group-card">
            <CardContent>
              <div className="subject-group-header">
                <h2>{group.title}</h2>
                <span>{group.items.length} subjects</span>
              </div>

              <div className="subject-list subject-card-list">
                {group.items.map((subject) => {
                  const progress = liveProgress.find((item) => item.subjectId === subject.id)?.percent ?? subject.percent

                  return (
                    <button
                      key={subject.id}
                      type="button"
                      className={selectedSubjectId === subject.id ? 'subject-card active' : 'subject-card'}
                      onClick={() => setSelectedSubjectId(subject.id)}
                    >
                      <div className="subject-card-top">
                        <span className="subject-tag">{subject.marks}</span>
                        <strong>{progress}%</strong>
                      </div>
                      <h3>{subject.name}</h3>
                      <p>{subject.summary}</p>
                      <div className="subject-progress-wrap">
                        <LinearProgress variant="determinate" value={progress} className="subject-progress-bar" />
                      </div>
                      <div className="subject-progress-row">
                        <span>Readiness</span>
                        <strong>{progress}%</strong>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedSubject && (
        <div ref={detailRef}>
          <Card className="panel-card subject-detail-panel">
            <CardContent>
              <div className="subject-detail-header">
                <div>
                  <span className="subject-detail-badge">Study focus</span>
                  <h2>{selectedSubject.name}</h2>
                </div>
                <span className="subject-detail-mark">{selectedSubject.marks}</span>
              </div>

              <p className="subject-detail-summary">{selectedSubject.summary}</p>

              <div className="subject-topic-list">
                {selectedSubject.topics.map((topic) => (
                  <div key={topic} className="subject-topic-item">
                    <span className="topic-dot" />
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Box>
  )
}
