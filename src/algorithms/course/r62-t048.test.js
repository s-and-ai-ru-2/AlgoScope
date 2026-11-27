import { describe, it, expect } from 'vitest'
import { combSort, SHRINK_FACTOR } from './comb-sort.js'

const ascending = (values) => [...values].sort((a, b) => a - b)

describe('combSort (R62-T048)', () => {
  describe('issue fixture [3, 1, 2, 2]', () => {
    const result = combSort([3, 1, 2, 2])

    it('sorts to [1, 2, 2, 3]', () => {
      expect(result.sorted).toEqual([1, 2, 2, 3])
    })

    it('shrinks the gap 3 → 2 → 1 and finishes with a clean gap-1 pass', () => {
      expect(result.gaps).toEqual([3, 2, 1, 1])
      expect(result.passes).toEqual([
        { gap: 3, swaps: 1 },
        { gap: 2, swaps: 0 },
        { gap: 1, swaps: 1 },
        { gap: 1, swaps: 0 },
      ])
      expect(result.swaps).toBe(2)
      expect(result.comparisons).toBe(9)
    })
  })

  describe('gap schedule invariants', () => {
    const inputs = [
      [5, 4, 3, 2, 1],
      [1, 2, 3, 4, 5],
      [9, 7, 5, 3, 1, 8, 6, 4, 2, 0],
      [2, 1],
      Array.from({ length: 50 }, (_, i) => (i * 37) % 50),
    ].map((input) => [input])

    it.each(inputs)('gaps never grow and end at 1 for %j', (input) => {
      const { gaps } = combSort(input)
      expect(gaps.at(-1)).toBe(1)
      for (let k = 1; k < gaps.length; k++) {
        expect(gaps[k]).toBeLessThanOrEqual(gaps[k - 1])
      }
    })

    it.each(inputs)(
      'each gap is floor(previous / 1.3), min 1, for %j',
      (input) => {
        const { gaps } = combSort(input)
        let expected = input.length
        for (const gap of gaps) {
          expected = Math.max(1, Math.floor(expected / SHRINK_FACTOR))
          expect(gap).toBe(expected)
        }
      }
    )

    it.each(inputs)('the last pass is gap 1 with no swaps for %j', (input) => {
      const { passes } = combSort(input)
      expect(passes.at(-1)).toEqual({ gap: 1, swaps: 0 })
    })

    it('uses the standard shrink factor 1.3', () => {
      expect(SHRINK_FACTOR).toBe(1.3)
    })
  })

  describe('valid inputs', () => {
    it.each([
      ['reversed', [5, 4, 3, 2, 1], [1, 2, 3, 4, 5]],
      ['already sorted', [1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
      ['all equal', [7, 7, 7], [7, 7, 7]],
      ['negatives and decimals', [3, -1, 2.5, 0, -1], [-1, -1, 0, 2.5, 3]],
      ['two elements', [2, 1], [1, 2]],
    ])('%s', (_label, input, expected) => {
      expect(combSort(input).sorted).toEqual(expected)
    })

    it('makes no swaps on already sorted input', () => {
      expect(combSort([1, 2, 3, 4, 5]).swaps).toBe(0)
    })

    it.each([
      ['empty', []],
      ['single element', [5]],
    ])('returns %s input with no passes', (_label, input) => {
      expect(combSort(input)).toEqual({
        sorted: input,
        gaps: [],
        passes: [],
        comparisons: 0,
        swaps: 0,
      })
    })

    it('matches the built-in numeric sort on many arrays', () => {
      // Deterministic pseudo-random arrays (no flaky tests).
      let seed = 42
      const next = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31)
      for (let t = 0; t < 200; t++) {
        const input = Array.from(
          { length: next() % 30 },
          () => (next() % 41) - 20
        )
        expect(combSort(input).sorted).toEqual(ascending(input))
      }
    })

    it('does not mutate the input and returns a new array', () => {
      const input = [3, 1, 2, 2]
      const { sorted } = combSort(input)
      expect(input).toEqual([3, 1, 2, 2])
      expect(sorted).not.toBe(input)
    })
  })

  describe('failure path: unsupported input', () => {
    it.each([
      ['null', null, /array of numbers, received null/],
      ['undefined', undefined, /array of numbers, received undefined/],
      ['a string', '3,1,2', /array of numbers, received string/],
      ['a number', 42, /array of numbers, received number/],
      ['an object', { 0: 3, length: 1 }, /array of numbers, received object/],
    ])('rejects %s with a TypeError', (_label, input, message) => {
      expect(() => combSort(input)).toThrow(TypeError)
      expect(() => combSort(input)).toThrow(message)
    })

    it.each([
      ['a string element', [3, 'a', 1], /index 1 is "a"/],
      ['a numeric string', [3, '2', 1], /index 1 is "2"/],
      ['NaN', [1, NaN], /index 1 is NaN/],
      ['Infinity', [1, Infinity], /index 1 is Infinity/],
      ['-Infinity', [-Infinity, 1], /index 0 is -Infinity/],
      ['null', [1, null], /index 1 is null/],
      ['undefined', [1, undefined], /index 1 is undefined/],
    ])('rejects %s and names the bad index', (_label, input, message) => {
      expect(() => combSort(input)).toThrow(TypeError)
      expect(() => combSort(input)).toThrow(message)
    })

    it('does not mutate the input when it rejects it', () => {
      const input = [3, 'a', 1]
      expect(() => combSort(input)).toThrow(TypeError)
      expect(input).toEqual([3, 'a', 1])
    })
  })

  describe('recovery: a valid run after a failure succeeds', () => {
    it('sorts correctly right after rejecting bad input', () => {
      expect(() => combSort([3, NaN, 1])).toThrow(TypeError)
      expect(() => combSort(null)).toThrow(TypeError)

      const result = combSort([3, 1, 2, 2])
      expect(result.sorted).toEqual([1, 2, 2, 3])
      expect(result.gaps).toEqual([3, 2, 1, 1])
    })

    it('gives the same result before and after a failure', () => {
      const before = combSort([5, 4, 3, 2, 1])
      expect(() => combSort([5, 'x'])).toThrow(TypeError)
      const after = combSort([5, 4, 3, 2, 1])
      expect(after).toEqual(before)
    })
  })
})
