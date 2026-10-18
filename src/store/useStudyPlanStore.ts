import { create } from 'zustand'
import { hydrateSyllabusConfigFromSupabase } from '../data/dashboardData'
import { setAdminSyllabusConfig } from '../data/group2Syllabus'
import { loadUserStudyPlan, saveUserStudyPlan } from '../lib/studyPlanApi'
import type { StudyPlanData } from '../types/studyPlanner'

type StudyPlanState = {
  userId: string | null
  plan: StudyPlanData | null
  loading: boolean
  saving: boolean
  error: string | null
  loadForUser: (userId: string) => Promise<void>
  updatePlan: (update: (current: StudyPlanData) => StudyPlanData) => Promise<void>
  reset: () => void
}

let saveQueue: Promise<void> = Promise.resolve()

export const useStudyPlanStore = create<StudyPlanState>((set, get) => ({
  userId: null,
  plan: null,
  loading: false,
  saving: false,
  error: null,

  loadForUser: async (userId) => {
    if (get().userId === userId && (get().loading || get().plan)) return

    set({ userId, plan: null, loading: true, saving: false, error: null })
    try {
      const syllabusConfig = await hydrateSyllabusConfigFromSupabase()
      if (get().userId !== userId) return
      setAdminSyllabusConfig(syllabusConfig)

      const loaded = await loadUserStudyPlan(userId)
      if (get().userId !== userId) return

      set({ plan: loaded, loading: false })
    } catch (error) {
      if (get().userId === userId) {
        set({
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to load your study plan.',
        })
      }
    }
  },

  updatePlan: async (update) => {
    const { userId, plan } = get()
    if (!userId || !plan) return

    const next = update(plan)
    set({ plan: next, saving: true, error: null })

    const pendingSave = saveQueue.catch(() => undefined).then(async () => {
      try {
        const saved = await saveUserStudyPlan(userId, next)
        if (get().userId === userId && get().plan === next) {
          set({ plan: saved, saving: false, error: null })
        }
      } catch (error) {
        if (get().userId === userId && get().plan === next) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Unable to save your study plan.',
          })
        }
      }
    })

    saveQueue = pendingSave
    await pendingSave
  },

  reset: () => set({ userId: null, plan: null, loading: false, saving: false, error: null }),
}))