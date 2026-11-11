import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AddFoodPanel from '../src/components/AddFoodPanel'
import PersonSelector from '../src/components/PersonSelector'
import FoodsPage from '../src/pages/FoodsPage'
import WeekPlanPage from '../src/pages/WeekPlanPage'
import { getFoods, getPersons, getWeekPlans, upsertFood, upsertWeekPlanBatch } from '../src/api/db'
import { BUILTIN_FOODS } from '../src/api/foodDatabase'
import type { FoodItem } from '../src/api/types'

vi.mock('../src/api/gemini', () => ({ analyzeFood: vi.fn() }))
vi.mock('../src/api/db', () => ({
  getFoods: vi.fn(), getPersons: vi.fn(), getWeekPlans: vi.fn(),
  upsertFood: vi.fn(), upsertWeekPlanBatch: vi.fn(), deleteFood: vi.fn(),
}))

const customFood: FoodItem = {
  name: 'Greek Yogurt', amount: 200, unit: 'g', calories: 120,
  protein_g: 20, carbs_g: 10, fat_g: 0, category: 'custom',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getPersons).mockResolvedValue({ data: [{ name: 'Alice', weight_kg: 60 }, { name: '小明', weight_kg: 70 }], error: null })
  vi.mocked(getFoods).mockResolvedValue({ data: [customFood], error: null })
  vi.mocked(getWeekPlans).mockResolvedValue({ data: [], error: null })
  vi.mocked(upsertFood).mockResolvedValue({ error: null })
  vi.mocked(upsertWeekPlanBatch).mockResolvedValue({ error: null })
})

function renderPanel() {
  const onAdd = vi.fn()
  render(<AddFoodPanel customFoods={[customFood]} historyMealSources={[]} familyDayMeals={[]}
    currentPersonName="Alice" mealType="breakfast" onAdd={onAdd} />)
  return onAdd
}

async function searchAndChoose(label: string, query: string) {
  const input = screen.getByRole('combobox', { name: label })
  await userEvent.clear(input)
  await userEvent.type(input, `${query}{Enter}`)
  return input as HTMLInputElement
}

describe('searchable menu integrations', () => {
  it('selects a person by name and does not offer a selectable empty person', async () => {
    const onSelect = vi.fn()
    render(<PersonSelector persons={[{ name: 'Alice', weight_kg: 60 }, { name: '小明', weight_kg: 70 }]}
      selected={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Person' }))
    expect(screen.getAllByRole('option')).toHaveLength(2)
    await searchAndChoose('Person', '小明')
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('小明')
  })

  it('loads builtin quantities, scales additions and clears the food after adding', async () => {
    const onAdd = renderPanel()
    const input = await searchAndChoose('食材', '雞蛋')
    const quantity = screen.getByRole('spinbutton') as HTMLInputElement
    expect(quantity.value).toBe('60')
    fireEvent.change(quantity, { target: { value: '120' } })
    await userEvent.click(screen.getByRole('button', { name: '新增', exact: true }))
    expect(onAdd).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ name: '雞蛋', amount: 120, calories: 172, protein_g: 15.2 }))
    expect(input.value).toBe('')
    expect(screen.queryByRole('spinbutton')).toBeNull()
  })

  it('resets food selection on category changes and searches only that category', async () => {
    renderPanel()
    await searchAndChoose('食材', '雞蛋')
    await searchAndChoose('分類', 'starch')
    expect((screen.getByRole('combobox', { name: '食材' }) as HTMLInputElement).value).toBe('')
    expect(screen.queryByRole('spinbutton')).toBeNull()
    await userEvent.type(screen.getByRole('combobox', { name: '食材' }), '雞蛋')
    expect(screen.queryByRole('option')).toBeNull()
    await searchAndChoose('食材', '白飯')
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe(String(BUILTIN_FOODS.find(food => food.name === '白飯（熟）')!.amount))
  })

  it('preserves custom food baseline quantities and resets after adding', async () => {
    const onAdd = renderPanel()
    await userEvent.click(screen.getByRole('button', { name: '自訂食材' }))
    const input = await searchAndChoose('自訂食材', 'YOGURT')
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('200')
    await userEvent.click(screen.getByRole('button', { name: '新增', exact: true }))
    expect(onAdd).toHaveBeenCalledExactlyOnceWith(customFood)
    expect(input.value).toBe('')
  })

  it('saves the selected category and restores the default category after save', async () => {
    render(<FoodsPage />)
    await screen.findByText('Greek Yogurt')
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Test food' } })
    const category = await searchAndChoose('Category', 'VEGETABLE')
    await userEvent.click(screen.getByRole('button', { name: 'Save Food' }))
    await waitFor(() => expect(upsertFood).toHaveBeenCalledWith('Test food', expect.objectContaining({ category: 'vegetable' })))
    expect(category.value).toBe('custom')
  })

  it('keeps the week-plan food label, amount, day, meal and saved payload', async () => {
    render(<WeekPlanPage />)
    await waitFor(() => expect(getPersons).toHaveBeenCalled())
    await searchAndChoose('Person', 'alice')
    await waitFor(() => expect(getWeekPlans).toHaveBeenCalled())
    const food = await searchAndChoose('Food', 'YOGURT')
    expect(food.value).toBe('Greek Yogurt (120 cal / 200g)')
    const [day, meal] = screen.getAllByRole('combobox').filter(element => element.tagName === 'SELECT')
    await userEvent.selectOptions(day, '2')
    await userEvent.selectOptions(meal, 'lunch')
    await userEvent.click(screen.getByRole('button', { name: 'Add', exact: true }))
    await userEvent.click(screen.getByRole('button', { name: 'Save Week Plan' }))
    const rows = vi.mocked(upsertWeekPlanBatch).mock.calls[0][0]
    expect(rows[2].data.meals.lunch.items).toEqual([{ ...customFood, amount: 100, calories: 60, protein_g: 10, carbs_g: 5 }])
    expect(rows[0].data.meals.breakfast.items).toEqual([])
  })
})
