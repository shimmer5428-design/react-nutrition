import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Option {
  value: string
  label: string
}

interface Props {
  label: string
  value: string
  options: Option[]
  placeholder?: string
  onChange: (value: string) => void
}

export default function SearchableSelect({ label, value, options, placeholder, onChange }: Props) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState<string | null>(null)
  const [activeValue, setActiveValue] = useState<string | null>(null)
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 240 })
  const selected = options.find(option => option.value === value)
  const search = (query ?? '').trim().toLocaleLowerCase()
  const filtered = options.filter(option =>
    `${option.label} ${option.value}`.toLocaleLowerCase().includes(search)
  )
  const activeIndex = Math.max(0, filtered.findIndex(option => option.value === activeValue))
  const active = filtered[activeIndex]

  useEffect(() => {
    setQuery(null)
    setOpen(false)
  }, [value])

  // Portal escapes the meal panels' overflow clipping; follow the field while scrolling.
  useLayoutEffect(() => {
    if (!open) return
    function updatePosition() {
      const rect = inputRef.current!.getBoundingClientRect()
      const below = window.innerHeight - rect.bottom - 8
      const above = rect.top - 8
      const upward = below < 240 && above > below
      const maxHeight = Math.max(0, Math.min(240, upward ? above : below))
      setPosition({
        left: rect.left,
        top: upward ? rect.top - 4 : rect.bottom + 4,
        width: rect.width,
        maxHeight,
      })
      listRef.current!.style.transform = upward ? 'translateY(-100%)' : ''
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (open) listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex, query])

  function showOptions() {
    if (open) return
    setQuery(null)
    setActiveValue(value)
    setOpen(true)
  }

  function close() {
    setOpen(false)
    setQuery(null)
  }

  function choose(option: Option) {
    onChange(option.value)
    close()
  }

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div className="searchable-select">
        <input
          id={id}
          ref={inputRef}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? `${id}-list` : undefined}
          aria-activedescendant={open && active ? `${id}-option-${activeIndex}` : undefined}
          autoComplete="off"
          placeholder={placeholder}
          value={query ?? (value === '' ? '' : selected?.label ?? '')}
          onFocus={event => {
            showOptions()
            event.currentTarget.select()
          }}
          onClick={showOptions}
          onBlur={close}
          onChange={event => {
            setQuery(event.target.value)
            setActiveValue(null)
            setOpen(true)
          }}
          onKeyDown={event => {
            // Enter confirms Chinese IME composition before it can select an option.
            if (event.nativeEvent.isComposing || event.keyCode === 229) return
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              if (!open) {
                showOptions()
              } else if (filtered.length) {
                const step = event.key === 'ArrowDown' ? 1 : -1
                setActiveValue(filtered[(activeIndex + step + filtered.length) % filtered.length].value)
              }
            } else if (event.key === 'Enter' && open) {
              event.preventDefault()
              if (active) choose(active)
            } else if (event.key === 'Escape' && open) {
              event.preventDefault()
              event.stopPropagation()
              close()
            }
          }}
        />
        <span className="searchable-select-arrow" aria-hidden="true">▾</span>
      </div>
      {open && createPortal(
        <ul
          id={`${id}-list`}
          ref={listRef}
          role="listbox"
          aria-label={label}
          className="searchable-select-options"
          style={position}
          onMouseDown={event => event.preventDefault()}
        >
          {filtered.length ? filtered.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={index === activeIndex ? 'active' : ''}
              onMouseMove={() => setActiveValue(option.value)}
              onClick={() => choose(option)}
            >
              {option.label}
            </li>
          )) : <li role="presentation" className="searchable-select-empty">找不到符合的選項</li>}
        </ul>,
        document.body
      )}
    </div>
  )
}
