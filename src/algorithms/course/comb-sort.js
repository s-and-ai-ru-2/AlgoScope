/**
 * Comb sort: a bubble sort that first compares elements far apart and shrinks
 * the gap by SHRINK_FACTOR each pass until it reaches 1. Once the gap is 1 it
 * keeps making passes until one pass makes no swaps, which proves the array is
 * in ascending order.
 *
 * Pure function: no React, animation or display state. The caller's array is
 * never mutated, and no state is kept between calls, so a failed call has no
 * effect on the next one.
 *
 * Worked fixture: [3, 1, 2, 2] (n = 4)
 *   gap 3: (0,3) 3 > 2 swap                    -> [2, 1, 2, 3]
 *   gap 2: (0,2) 2 = 2, (1,3) 1 < 3, no swaps  -> [2, 1, 2, 3]
 *   gap 1: (0,1) 2 > 1 swap, others in order   -> [1, 2, 2, 3]
 *   gap 1: no swaps, so the order is final     -> [1, 2, 2, 3]
 *   gaps = [3, 2, 1, 1]
 */

export const SHRINK_FACTOR = 1.3

/**
 * Validates the input. Throws TypeError with a message naming the problem.
 *
 * @param {unknown} values
 */
function assertSortableNumbers(values) {
  if (!Array.isArray(values)) {
    throw new TypeError(
      `combSort expects an array of numbers, received ${
        values === null ? 'null' : typeof values
      }`
    )
  }
  values.forEach((value, index) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError(
        `combSort expects finite numbers; index ${index} is ${
          typeof value === 'string' ? `"${value}"` : String(value)
        }`
      )
    }
  })
}

/**
 * Sorts numbers in ascending order using comb sort.
 *
 * @param {number[]} values - finite numbers to sort (not mutated)
 * @returns {{
 *   sorted: number[],
 *   gaps: number[],
 *   passes: { gap: number, swaps: number }[],
 *   comparisons: number,
 *   swaps: number
 * }}
 *   `gaps` lists the gap used by each pass in order, and `passes` gives the
 *   swaps made in each one. For arrays of length 0 or 1 no pass is needed, so
 *   `gaps` and `passes` are empty.
 * @throws {TypeError} if `values` is not an array, or an element is not a
 *   finite number (strings, NaN, Infinity, null, undefined, ...)
 */
export function combSort(values) {
  assertSortableNumbers(values)

  const sorted = [...values]
  const n = sorted.length
  const passes = []
  let comparisons = 0
  let swaps = 0

  if (n < 2) {
    return { sorted, gaps: [], passes, comparisons, swaps }
  }

  let gap = n
  let swappedLastPass = true

  // Keep going while the gap is still shrinking, or the last gap-1 pass
  // swapped something (so the order is not yet proven).
  while (gap > 1 || swappedLastPass) {
    gap = Math.max(1, Math.floor(gap / SHRINK_FACTOR))
    let passSwaps = 0

    for (let i = 0; i + gap < n; i++) {
      comparisons++
      if (sorted[i] > sorted[i + gap]) {
        ;[sorted[i], sorted[i + gap]] = [sorted[i + gap], sorted[i]]
        passSwaps++
      }
    }

    passes.push({ gap, swaps: passSwaps })
    swaps += passSwaps
    swappedLastPass = passSwaps > 0
  }

  return {
    sorted,
    gaps: passes.map((pass) => pass.gap),
    passes,
    comparisons,
    swaps,
  }
}
