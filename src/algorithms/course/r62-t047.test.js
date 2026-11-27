import { describe, it, expect } from 'vitest'
import {
  generateSelectionSortSteps,
  selectionSortSources,
  resolveSelectionSortLine,
} from '../sorting/selectionSortSteps.js'

const finalArray = (steps) => steps.at(-1).array
const countType = (steps, type) => steps.filter((s) => s.type === type).length

describe('selectionSortSteps (R62-T047)', () => {
  describe('pure results: ascending sort', () => {
    it.each([
      ['[3, 1, 2]', [3, 1, 2], [1, 2, 3]],
      ['[2, 2, 1] with duplicates', [2, 2, 1], [1, 2, 2]],
      ['already ordered [1, 2, 3]', [1, 2, 3], [1, 2, 3]],
      ['reversed [3, 2, 1]', [3, 2, 1], [1, 2, 3]],
      ['single element [1]', [1], [1]],
      ['empty []', [], []],
    ])('%s', (_label, input, expected) => {
      const steps = generateSelectionSortSteps(input)

      expect(finalArray(steps)).toEqual(expected)
      expect(steps.at(-1).type).toBe('complete')
      expect(steps.at(-1).sortedIndices).toEqual(expected.map((_, i) => i))
    })

    it('does not mutate the input array', () => {
      const input = [3, 1, 2]
      generateSelectionSortSteps(input)
      expect(input).toEqual([3, 1, 2])
    })
  })

  describe('replay steps for the documented fixture [3, 1, 2]', () => {
    const steps = generateSelectionSortSteps([3, 1, 2])

    it('produces 21 frames with 2 swaps and 3 passes', () => {
      expect(steps).toHaveLength(21)
      expect(countType(steps, 'swap')).toBe(2)
      expect(countType(steps, 'pass-complete')).toBe(3)
      expect(steps[0].type).toBe('start')
    })

    it('swaps the documented positions and shows the result next frame', () => {
      const swaps = steps
        .map((s, k) => [s, k])
        .filter(([s]) => s.type === 'swap')

      expect(swaps.map(([s]) => s.indices)).toEqual([
        [0, 1],
        [1, 2],
      ])
      // A swap frame shows the array before swapping ...
      expect(swaps[0][0].array).toEqual([3, 1, 2])
      // ... and the next frame shows the result.
      expect(steps[swaps[0][1] + 1].array).toEqual([1, 3, 2])
      expect(steps[swaps[1][1] + 1].array).toEqual([1, 2, 3])
    })

    it('grows sortedIndices by one per pass, starting from none', () => {
      expect(steps[0].sortedIndices).toEqual([])
      expect(
        steps
          .filter((s) => s.type === 'pass-complete')
          .map((s) => s.sortedIndices)
      ).toEqual([[0], [0, 1], [0, 1, 2]])
    })

    it('stores independent array snapshots in every frame', () => {
      expect(steps[0].array).not.toBe(steps.at(-1).array)
      expect(steps[0].array).toEqual([3, 1, 2])
    })
  })

  describe('swap counts on the other fixtures', () => {
    it.each([
      [[2, 2, 1], 1],
      [[1, 2, 3], 0],
      [[3, 2, 1], 1],
      [[1], 0],
      [[], 0],
    ])('%j makes %i swap(s)', (input, swaps) => {
      expect(countType(generateSelectionSortSteps(input), 'swap')).toBe(swaps)
    })
  })

  describe('displayed source and line maps stay aligned', () => {
    // What each highlighted line must contain, in every language.
    const expectedLine = {
      function: /selection_?sort/i,
      outerLoop: /for\b.*\bi\b/,
      initMin: /min_?idx\s*:?=\s*i\b/i,
      innerLoop: /for\b.*\bj\b/,
      compare: /\bif\b.*arr\[j\]\s*<\s*arr\[min_?idx\]/i,
      updateMin: /min_?idx\s*=\s*j\b/i,
      swap: /swap\(|temp\s*=|arr\[i\],\s*arr\[min_?idx\]/i,
    }
    const usedKeys = [
      ...new Set(generateSelectionSortSteps([3, 1, 2]).map((s) => s.lineKey)),
    ]
    const languages = Object.entries(selectionSortSources)

    it('covers all seven languages', () => {
      expect(Object.keys(selectionSortSources).sort()).toEqual(
        ['c', 'cpp', 'go', 'java', 'javascript', 'python', 'rust'].sort()
      )
    })

    it.each(languages)(
      '%s: every line number is inside the code',
      (_lang, src) => {
        const lineCount = src.code.split('\n').length
        for (const [key, line] of Object.entries(src.lineMap)) {
          expect(line, key).toBeGreaterThanOrEqual(1)
          expect(line, key).toBeLessThanOrEqual(lineCount)
        }
      }
    )

    it.each(languages)('%s: every step lineKey has a mapping', (_lang, src) => {
      for (const key of usedKeys) {
        expect(src.lineMap, key).toHaveProperty(key)
      }
    })

    it.each(languages)(
      '%s: highlighted lines show the right code',
      (_lang, src) => {
        const lines = src.code.split('\n')
        for (const [key, pattern] of Object.entries(expectedLine)) {
          expect(lines[src.lineMap[key] - 1], key).toMatch(pattern)
        }
      }
    )

    it.each(languages)('%s: complete points at the last line', (_lang, src) => {
      expect(src.lineMap.complete).toBe(src.code.split('\n').length)
    })

    it('resolveSelectionSortLine uses the language map with a JS fallback', () => {
      expect(resolveSelectionSortLine('cpp', 'swap')).toBe(11)
      expect(resolveSelectionSortLine('go', 'swap')).toBe(11)
      expect(resolveSelectionSortLine('javascript', 'complete')).toBe(14)
      expect(resolveSelectionSortLine('unknown-lang', 'compare')).toBe(
        selectionSortSources.javascript.lineMap.compare
      )
      expect(resolveSelectionSortLine('python', undefined)).toBeUndefined()
    })
  })
})
