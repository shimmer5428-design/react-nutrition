import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SearchableSelect from '../src/components/SearchableSelect'

const options = [
  { value: 'chicken', label: '雞胸肉' },
  { value: 'egg', label: '雞蛋' },
  { value: 'yogurt', label: 'Greek Yogurt (57 cal / 100g)' },
]

function setup(initial = '', choices = options) {
  const onChange = vi.fn()
  function Form() {
    const [value, setValue] = useState(initial)
    return <>
      <SearchableSelect label="Food" value={value} options={choices} placeholder="選擇食材..."
        onChange={next => { onChange(next); setValue(next) }} />
      <button onClick={() => setValue('')}>Reset</button>
    </>
  }
  render(<Form />)
  return { user: userEvent.setup(), input: screen.getByRole('combobox') as HTMLInputElement, onChange }
}

describe('SearchableSelect', () => {
  it('filters Chinese text without committing and selects by keyboard', async () => {
    const { user, input, onChange } = setup()
    await user.type(input, '雞')
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual(['雞胸肉', '雞蛋'])
    expect(onChange).not.toHaveBeenCalled()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalledExactlyOnceWith('egg')
    expect(input.value).toBe('雞蛋')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('matches labels and stored values case-insensitively with surrounding whitespace', async () => {
    const { user, input, onChange } = setup()
    await user.type(input, '  YOGURT  ')
    await user.click(screen.getByRole('option', { name: 'Greek Yogurt (57 cal / 100g)' }))
    expect(onChange).toHaveBeenLastCalledWith('yogurt')
    expect(document.activeElement).toBe(input)
    await user.clear(input)
    await user.type(input, 'CHICKEN')
    await user.keyboard('{Enter}')
    expect(input.value).toBe('雞胸肉')
  })

  it('wraps arrow navigation and exposes the active and selected options', async () => {
    const { user, input } = setup('chicken')
    await user.click(input)
    expect(screen.getByRole('option', { name: '雞胸肉' }).getAttribute('aria-selected')).toBe('true')
    await user.keyboard('{ArrowUp}')
    expect(document.getElementById(input.getAttribute('aria-activedescendant')!)?.textContent).toContain('Greek Yogurt')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(input.value).toBe('雞胸肉')
  })

  it('restores the selection on Escape, Tab, and outside click without committing a draft', async () => {
    const { user, input, onChange } = setup('egg')
    await user.click(input)
    await user.clear(input)
    await user.type(input, 'Greek')
    await user.keyboard('{Escape}')
    expect(input.value).toBe('雞蛋')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    await user.clear(input)
    await user.type(input, 'unknown')
    await user.tab()
    expect(input.value).toBe('雞蛋')
    await user.click(input)
    await user.clear(input)
    await user.type(input, 'Greek')
    await user.click(document.body)
    expect(input.value).toBe('雞蛋')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows no matches and never commits arbitrary text', async () => {
    const { user, input, onChange } = setup()
    await user.type(input, '不存在')
    expect(screen.getByText('找不到符合的選項')).toBeTruthy()
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
    await user.keyboard('{ArrowDown}{ArrowUp}{Enter}')
    expect(onChange).not.toHaveBeenCalled()
    await user.tab()
    expect(input.value).toBe('')
  })

  it('handles an empty options list', async () => {
    const { user, input, onChange } = setup('', [])
    await user.click(input)
    await user.keyboard('{ArrowDown}{Enter}')
    expect(screen.queryByRole('option')).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not select while Chinese IME is composing, including Safari keyCode 229', async () => {
    const { user, input, onChange } = setup()
    await user.type(input, '雞')
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Enter', isComposing: false })
    expect(onChange).toHaveBeenCalledExactlyOnceWith('chicken')
  })

  it('keeps optional empty choices and reflects parent resets', async () => {
    const { user, input, onChange } = setup('egg', [{ value: '', label: '清空' }, ...options])
    await user.click(input)
    await user.click(screen.getByRole('option', { name: '清空' }))
    expect(onChange).toHaveBeenLastCalledWith('')
    expect(input.value).toBe('')
    await user.type(input, '雞蛋')
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(input.value).toBe('')
  })

  it('updates labels and filtered results when options change', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<SearchableSelect label="Food" value="egg" options={[]} onChange={onChange} />)
    const input = screen.getByRole('combobox') as HTMLInputElement
    rerender(<SearchableSelect label="Food" value="egg" options={options} onChange={onChange} />)
    expect(input.value).toBe('雞蛋')
    await userEvent.click(input)
    rerender(<SearchableSelect label="Food" value="egg" options={[options[1]]} onChange={onChange} />)
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(document.getElementById(input.getAttribute('aria-activedescendant')!)?.textContent).toBe('雞蛋')
  })

  it('does not submit the surrounding form when confirming a search result', async () => {
    const onSubmit = vi.fn(event => event.preventDefault())
    render(<form onSubmit={onSubmit}>
      <SearchableSelect label="Food" value="" options={options} onChange={() => {}} />
      <button type="submit">Submit</button>
    </form>)
    await userEvent.type(screen.getByRole('combobox'), '雞蛋{Enter}')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
