import { describe, it, expect } from 'vitest'
import { rotateMatrix90 } from './rotate-matrix-90.js'

const square = (n) =>
  Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => i * n + j)
  )

const rotateTimes = (matrix, times) => {
  let current = matrix
  for (let k = 0; k < times; k++) current = rotateMatrix90(current).rotated
  return current
}

// Independent reference: clockwise = transpose, then reverse each row.
const reference = (matrix) =>
  matrix[0].map((_, j) => matrix.map((row) => row[j]).reverse())

describe('rotateMatrix90 (R62-T049)', () => {
  describe('issue fixture [[1, 2], [3, 4]]', () => {
    it('rotates clockwise to [[3, 1], [4, 2]]', () => {
      expect(
        rotateMatrix90([
          [1, 2],
          [3, 4],
        ]).rotated
      ).toEqual([
        [3, 1],
        [4, 2],
      ])
    })

    it('is not the counter-clockwise result [[2, 4], [1, 3]]', () => {
      expect(
        rotateMatrix90([
          [1, 2],
          [3, 4],
        ]).rotated
      ).not.toEqual([
        [2, 4],
        [1, 3],
      ])
    })

    it('returns to the input after four rotations, and not before', () => {
      const input = [
        [1, 2],
        [3, 4],
      ]
      expect(rotateTimes(input, 1)).not.toEqual(input)
      expect(rotateTimes(input, 2)).toEqual([
        [4, 3],
        [2, 1],
      ])
      expect(rotateTimes(input, 3)).not.toEqual(input)
      expect(rotateTimes(input, 4)).toEqual(input)
    })
  })

  describe('correctness on other shapes', () => {
    it('rotates a 3 × 3 matrix', () => {
      expect(rotateMatrix90(square(3)).rotated).toEqual([
        [6, 3, 0],
        [7, 4, 1],
        [8, 5, 2],
      ])
    })

    it('rotates a rectangular 2 × 3 matrix into 3 × 2', () => {
      const result = rotateMatrix90([
        [1, 2, 3],
        [4, 5, 6],
      ])
      expect(result.rotated).toEqual([
        [4, 1],
        [5, 2],
        [6, 3],
      ])
      expect(result).toMatchObject({ rows: 2, cols: 3, moves: 6 })
    })

    it('rotates a single row and a single column', () => {
      expect(rotateMatrix90([[1, 2, 3]]).rotated).toEqual([[1], [2], [3]])
      expect(rotateMatrix90([[1], [2], [3]]).rotated).toEqual([[3, 2, 1]])
    })

    it('handles 1 × 1 and empty matrices', () => {
      expect(rotateMatrix90([[7]])).toEqual({
        rotated: [[7]],
        rows: 1,
        cols: 1,
        moves: 1,
      })
      expect(rotateMatrix90([])).toEqual({
        rotated: [],
        rows: 0,
        cols: 0,
        moves: 0,
      })
    })

    it.each([1, 2, 3, 4, 5, 7])(
      'matches transpose-then-reverse for %i × %i and cycles in 4',
      (n) => {
        const input = square(n)
        expect(rotateMatrix90(input).rotated).toEqual(reference(input))
        expect(rotateTimes(input, 4)).toEqual(input)
      }
    )

    it('works for non-number values', () => {
      expect(
        rotateMatrix90([
          ['a', 'b'],
          ['c', 'd'],
        ]).rotated
      ).toEqual([
        ['c', 'a'],
        ['d', 'b'],
      ])
    })

    it('does not mutate the input or share rows with it', () => {
      const input = [
        [1, 2],
        [3, 4],
      ]
      const { rotated } = rotateMatrix90(input)
      expect(input).toEqual([
        [1, 2],
        [3, 4],
      ])
      rotated[0][0] = 99
      expect(input[1][0]).toBe(3)
    })
  })

  describe('complexity experiment: operation counts, not timings', () => {
    // Three bounded valid sizes, as required by the issue.
    it.each([
      [2, 4],
      [3, 9],
      [4, 16],
    ])('a %i × %i matrix takes exactly %i moves (n²)', (n, expectedMoves) => {
      expect(rotateMatrix90(square(n)).moves).toBe(expectedMoves)
    })

    it('moves grow 4× when n doubles (quadratic, Θ(n²))', () => {
      const moves = [2, 4, 8, 16].map((n) => rotateMatrix90(square(n)).moves)
      expect(moves).toEqual([4, 16, 64, 256])
      for (let k = 1; k < moves.length; k++) {
        expect(moves[k] / moves[k - 1]).toBe(4)
      }
    })

    it('moves equal rows × cols for rectangular input', () => {
      const m = Array.from({ length: 3 }, () => [0, 0, 0, 0, 0])
      expect(rotateMatrix90(m).moves).toBe(15)
    })
  })

  describe('invalid input', () => {
    it.each([
      ['null', null, TypeError, /array of rows/],
      ['a string', '1,2', TypeError, /array of rows/],
      [
        'a row that is not an array',
        [[1], 5],
        TypeError,
        /row 1 is not an array/,
      ],
      ['an empty row', [[]], RangeError, /row 0 is empty/],
      [
        'ragged rows',
        [[1, 2], [3]],
        RangeError,
        /row 1 has length 1, expected 2/,
      ],
    ])('rejects %s', (_label, input, ErrorType, message) => {
      expect(() => rotateMatrix90(input)).toThrow(ErrorType)
      expect(() => rotateMatrix90(input)).toThrow(message)
    })
  })
})
