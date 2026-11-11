import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(cleanup)

// jsdom has no layout engine; browser QA covers actual scrolling and placement.
Element.prototype.scrollIntoView = vi.fn()
