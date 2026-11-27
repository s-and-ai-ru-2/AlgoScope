import { describe, it, expect } from 'vitest'
import { generateLCSSteps } from '../dp/dpStepGenerators.js'

// ─── helpers ────────────────────────────────────────────────────────────────

const lcsLength = (a, b) => generateLCSSteps(a, b).dp[a.length][b.length]

// The subsequence recovered from the generator's traceback steps.
const tracedSubsequence = (a, b) => {
  const traceback = generateLCSSteps(a, b).steps.filter(
    (s) => s.phase === 'traceback'
  )
  const path = traceback.length ? traceback.at(-1).pathSoFar : []
  return [...path]
    .reverse()
    .map(([i]) => a[i - 1])
    .join('')
}

const isSubsequence = (sub, str) => {
  let k = 0
  for (const ch of str) if (k < sub.length && ch === sub[k]) k++
  return k === sub.length
}

// Independent oracle: try every subsequence of `a` (only for short strings).
const bruteForceLcsLength = (a, b) => {
  let best = 0
  for (let mask = 0; mask < 1 << a.length; mask++) {
    let sub = ''
    for (let i = 0; i < a.length; i++) if (mask & (1 << i)) sub += a[i]
    if (sub.length > best && isSubsequence(sub, b)) best = sub.length
  }
  return best
}

// Deterministic pseudo-random strings (no flaky tests).
const makeRng = (seed) => () => (seed = (seed * 1103515245 + 12345) % 2 ** 31)
const randomString = (rng, maxLen, alphabet) =>
  Array.from(
    { length: rng() % (maxLen + 1) },
    () => alphabet[rng() % alphabet.length]
  ).join('')

// ─── tests ──────────────────────────────────────────────────────────────────

describe('generateLCSSteps (R62-T050)', () => {
  describe('issue fixture ABCBDAB / BDCABA', () => {
    it('has LCS length 4', () => {
      expect(lcsLength('ABCBDAB', 'BDCABA')).toBe(4)
    })

    it('traces back some valid common subsequence of length 4', () => {
      const sub = tracedSubsequence('ABCBDAB', 'BDCABA')
      expect(sub).toHaveLength(4)
      expect(isSubsequence(sub, 'ABCBDAB')).toBe(true)
      expect(isSubsequence(sub, 'BDCABA')).toBe(true)
      // Ties are allowed: do not require one particular answer.
      expect(['BCBA', 'BCAB', 'BDAB']).toContain(sub)
    })

    it('is symmetric in length (LCS(a, b) = LCS(b, a))', () => {
      expect(lcsLength('BDCABA', 'ABCBDAB')).toBe(4)
    })
  })

  describe('the decisive operation: match vs. no match', () => {
    // Each case pins down one branch of the recurrence:
    //   match:    dp[i][j] = dp[i-1][j-1] + 1
    //   mismatch: dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    it.each([
      ['identical strings', 'ABC', 'ABC', 3],
      ['no common characters', 'ABC', 'DEF', 0],
      ['one shared character', 'XAY', 'ZAW', 1],
      ['repeated characters are not double-counted', 'AAAA', 'AA', 2],
      ['order matters (not just shared letters)', 'ABC', 'CBA', 1],
      ['prefix', 'ABCDEF', 'ABC', 3],
      ['interleaved', 'AXBYCZ', 'ABC', 3],
      ['empty first string', '', 'ABC', 0],
      ['empty second string', 'ABC', '', 0],
      ['both empty', '', '', 0],
      ['case-sensitive', 'abc', 'ABC', 0],
    ])('%s: LCS(%j, %j) = %i', (_label, a, b, expected) => {
      expect(lcsLength(a, b)).toBe(expected)
    })

    it('fills each cell from the correct neighbours', () => {
      const { dp } = generateLCSSteps('ABCBDAB', 'BDCABA')
      for (let i = 1; i <= 7; i++) {
        for (let j = 1; j <= 6; j++) {
          const match = 'ABCBDAB'[i - 1] === 'BDCABA'[j - 1]
          const expected = match
            ? dp[i - 1][j - 1] + 1
            : Math.max(dp[i - 1][j], dp[i][j - 1])
          expect(dp[i][j], `cell [${i}][${j}]`).toBe(expected)
        }
      }
      expect(dp[0].every((v) => v === 0)).toBe(true)
      expect(dp.every((row) => row[0] === 0)).toBe(true)
    })
  })

  describe('agrees with an independent brute-force oracle', () => {
    it('on 300 deterministic random pairs (alphabet ABC, length ≤ 8)', () => {
      const rng = makeRng(7)
      for (let t = 0; t < 300; t++) {
        const a = randomString(rng, 8, 'ABC')
        const b = randomString(rng, 8, 'ABC')
        const expected = bruteForceLcsLength(a, b)
        expect(lcsLength(a, b), `${a} / ${b}`).toBe(expected)

        const sub = tracedSubsequence(a, b)
        expect(sub.length, `traceback ${a} / ${b}`).toBe(expected)
        expect(isSubsequence(sub, a) && isSubsequence(sub, b)).toBe(true)
      }
    })
  })

  describe('replay steps', () => {
    const result = generateLCSSteps('ABCBDAB', 'BDCABA')
    const fill = result.steps.filter((s) => s.phase === 'fill')
    const traceback = result.steps.filter((s) => s.phase === 'traceback')

    it('has one fill step per cell, in row-major order', () => {
      expect(fill).toHaveLength(7 * 6)
      expect(fill[0].activeCell).toEqual([1, 1])
      expect(fill.at(-1).activeCell).toEqual([7, 6])
    })

    it('flags matches correctly on fill steps', () => {
      for (const step of fill) {
        expect(step.match).toBe('ABCBDAB'[step.i - 1] === 'BDCABA'[step.j - 1])
      }
    })

    it('has one traceback step per matched character', () => {
      expect(traceback).toHaveLength(4)
      expect(traceback.at(-1).pathSoFar).toHaveLength(4)
    })

    it('stores independent table snapshots', () => {
      expect(fill[0].table).not.toBe(result.dp)
      expect(fill[0].table[7][6]).toBe(0)
      expect(result.dp[7][6]).toBe(4)
    })

    it('returns the input strings unchanged', () => {
      expect(result.strA).toBe('ABCBDAB')
      expect(result.strB).toBe('BDCABA')
    })
  })
})
