import { createInitialStudyPlan, normalizeStudyPlan, recoverInterruptedTimer } from './studyPlanner'
import { supabase } from './supabase'
import type { StudyPlanData } from '../types/studyPlanner'

const STORAGE_KEY = 'appsc_study_plan'

const getLocalStorageKey = (userId: string) => `${STORAGE_KEY}:${userId}`
const usesDemoStorage = (userId: string) => userId === 'demo-user' || userId.startsWith('demo-')

const readLocalStudyPlan = (userId: string): StudyPlanData => {
  const raw = window.localStorage.getItem(getLocalStorageKey(userId))
  if (!raw) return createInitialStudyPlan()

  try {
    return recoverInterruptedTimer(normalizeStudyPlan(JSON.parse(raw) as Partial<StudyPlanData>))
  } catch {
    return createInitialStudyPlan()
  }
}

export const loadUserStudyPlan = async (userId: string): Promise<StudyPlanData> => {
  if (!userId) throw new Error('A signed-in user is required to load a study plan.')

  if (supabase && !usesDemoStorage(userId)) {
    const { data, error } = await supabase
      .from('study_plans')
      .select('state')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    if (data?.state) return recoverInterruptedTimer(normalizeStudyPlan(data.state as Partial<StudyPlanData>))

    const initialPlan = createInitialStudyPlan()
    await saveUserStudyPlan(userId, initialPlan)
    return initialPlan
  }

  const localPlan = readLocalStudyPlan(userId)
  window.localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(localPlan))
  return localPlan
}

export const saveUserStudyPlan = async (userId: string, plan: StudyPlanData): Promise<StudyPlanData> => {
  if (!userId) throw new Error('A signed-in user is required to save a study plan.')

  const normalizedPlan = normalizeStudyPlan({ ...plan, updatedAt: new Date().toISOString() })

  if (supabase && !usesDemoStorage(userId)) {
    const { error } = await supabase
      .from('study_plans')
      .upsert({
        user_id: userId,
        state: normalizedPlan,
        updated_at: normalizedPlan.updatedAt,
      }, { onConflict: 'user_id' })

    if (error) throw error
    return normalizedPlan
  }

  window.localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(normalizedPlan))
  return normalizedPlan
}