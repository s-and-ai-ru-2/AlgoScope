/**
 * Rotate a matrix 90° clockwise.
 *
 * Pure function: no React, animation or display state. The input matrix is
 * never mutated; a new matrix is returned.
 *
 * Mapping: for an r × c input, the output is c × r and
 *   rotated[j][r - 1 - i] = matrix[i][j]
 * i.e. the first column read bottom-to-top becomes the first row.
 *
 * Worked fixture:
 *   [[1, 2],        [[3, 1],
 *    [3, 4]]   ->    [4, 2]]
 *   Four clockwise rotations return the original matrix.
 *
 * Operation count: every element is moved exactly once, so `moves` equals
 * r × c (n² for an n × n matrix). This is a deterministic step count, not a
 * timing measurement, so it does not depend on hardware speed.
 */

/**
 * Validates the input. Throws TypeError / RangeError naming the problem.
 *
 * @param {unknown} matrix
 */
function assertRectangularMatrix(matrix) {
  if (!Array.isArray(matrix)) {
    throw new TypeError('rotateMatrix90 expects an array of rows')
  }
  if (matrix.length === 0) return

  const width = Array.isArray(matrix[0]) ? matrix[0].length : -1
  matrix.forEach((row, i) => {
    if (!Array.isArray(row)) {
      throw new TypeError(`rotateMatrix90: row ${i} is not an array`)
    }
    if (row.length === 0) {
      throw new RangeError(`rotateMatrix90: row ${i} is empty`)
    }
    if (row.length !== width) {
      throw new RangeError(
        `rotateMatrix90: row ${i} has length ${row.length}, expected ${width}`
      )
    }
  })
}

/**
 * Rotates a rectangular matrix 90° clockwise.
 *
 * @template T
 * @param {T[][]} matrix - r × c matrix (rows of equal, non-zero length); `[]`
 *   is allowed and rotates to `[]`
 * @returns {{ rotated: T[][], rows: number, cols: number, moves: number }}
 *   `rows`/`cols` describe the input; `rotated` is cols × rows; `moves` is the
 *   number of element moves performed (always rows × cols)
 * @throws {TypeError} if `matrix` or one of its rows is not an array
 * @throws {RangeError} if a row is empty or rows have different lengths
 */
export function rotateMatrix90(matrix) {
  assertRectangularMatrix(matrix)

  const rows = matrix.length
  const cols = rows === 0 ? 0 : matrix[0].length
  const rotated = Array.from({ length: cols }, () => new Array(rows))
  let moves = 0

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      rotated[j][rows - 1 - i] = matrix[i][j]
      moves++
    }
  }

  return { rotated, rows, cols, moves }
}
