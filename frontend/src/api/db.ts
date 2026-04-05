import { supabase } from './supabase'
import type { Person, PersonRow, FoodItem, FoodRow, DayPlan, WeekPlanRow } from './types'

// ---------------------------------------------------------------------------
// Persons
// ---------------------------------------------------------------------------

export async function getPersons(): Promise<{ data: Person[]; error: string | null }> {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .order('name')
  if (error) return { data: [], error: error.message }
  return { data: (data as PersonRow[]).map((r) => r.data), error: null }
}

export async function upsertPerson(name: string, person: Person): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('persons')
    .upsert({ name, data: person }, { onConflict: 'name' })
  return { error: error?.message ?? null }
}

export async function deletePerson(name: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('persons')
    .delete()
    .eq('name', name)
  return { error: error?.message ?? null }
}

// ---------------------------------------------------------------------------
// Custom Foods
// ---------------------------------------------------------------------------

export async function getFoods(): Promise<{ data: FoodItem[]; error: string | null }> {
  const { data, error } = await supabase
    .from('custom_foods')
    .select('*')
    .order('name')
  if (error) return { data: [], error: error.message }
  return { data: (data as FoodRow[]).map((r) => r.data), error: null }
}

export async function upsertFood(name: string, food: FoodItem): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('custom_foods')
    .upsert({ name, data: food }, { onConflict: 'name' })
  return { error: error?.message ?? null }
}

export async function deleteFood(name: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('custom_foods')
    .delete()
    .eq('name', name)
  return { error: error?.message ?? null }
}

// ---------------------------------------------------------------------------
// Week Plans
// ---------------------------------------------------------------------------

export async function getWeekPlans(
  personName: string,
  weekId: string,
): Promise<{ data: WeekPlanRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('week_plans')
    .select('*')
    .eq('week_id', weekId)
    .eq('person_name', personName)
    .order('day_of_week')
  if (error) return { data: [], error: error.message }
  return { data: data as WeekPlanRow[], error: null }
}

export async function upsertWeekPlan(
  weekId: string,
  personName: string,
  dayOfWeek: number,
  dayPlan: DayPlan,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('week_plans')
    .upsert(
      { week_id: weekId, person_name: personName, day_of_week: dayOfWeek, data: dayPlan },
      { onConflict: 'week_id,person_name,day_of_week' },
    )
  return { error: error?.message ?? null }
}

export async function upsertWeekPlanBatch(
  rows: { week_id: string; person_name: string; day_of_week: number; data: DayPlan }[],
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('week_plans')
    .upsert(rows, { onConflict: 'week_id,person_name,day_of_week' })
  return { error: error?.message ?? null }
}

export async function deleteWeekPlan(
  weekId: string,
  personName: string,
  dayOfWeek: number,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('week_plans')
    .delete()
    .match({ week_id: weekId, person_name: personName, day_of_week: dayOfWeek })
  return { error: error?.message ?? null }
}
