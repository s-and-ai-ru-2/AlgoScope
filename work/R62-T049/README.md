# R62-T049 — Rotate matrix 90°: complexity experiment (evidence)

**Student:** Aadarsh Bhardwaj (2601010001)
**Issue:** https://github.com/s-and-ai-ru-2/AlgoScope/issues/4
**Branch:** `student/2601010001/R62-T049`
**Base commit:** `973f3e6` (same commit the issue is pinned to)
**Run on:** 2026-11-28

> This folder is coursework evidence only. Per the task, remove `work/R62-T049/`
> from any later upstream branch.

## 1. What was changed

| File                                        | Purpose                                   |
| ------------------------------------------- | ----------------------------------------- |
| `src/algorithms/course/rotate-matrix-90.js` | New pure module: `rotateMatrix90(matrix)` |
| `src/algorithms/course/r62-t049.test.js`    | Focused Vitest regression (25 tests)      |

No existing files were modified. `src/App.jsx` was not changed: line 15 (the
pinned source) is a lazy page import and contains no algorithm logic.

### Existing-implementation check (issue step 2)

```
grep -rn -i "rotat" src | grep -i "matrix\|90\|rotate("
```

The only matches are CSS transforms (`rotate-45`, `rotate(45deg)`) in
`AlgoCard.jsx` and `GuidedTour.jsx`. No matrix rotation existed, so a new module
does not duplicate a registered visualization.

### Contract

- **Input:** an r × c matrix (an array of rows of equal, non-zero length).
  `[]` is allowed.
- **Output:** `{ rotated, rows, cols, moves }`. `rotated` is c × r, with
  `rotated[j][r-1-i] = matrix[i][j]` (clockwise). `moves` counts element moves.
- **Pure:** the input is not mutated, and the output shares no rows with it.
- **Invalid input:** throws `TypeError` (input or a row is not an array) or
  `RangeError` (an empty row, or ragged rows), with a message naming the row.

## 2. Inputs: expected vs. actual

| Input                              | Expected                             | Actual                                                       | Result |
| ---------------------------------- | ------------------------------------ | ------------------------------------------------------------ | ------ |
| `[[1,2],[3,4]]`                    | `[[3,1],[4,2]]`                      | `[[3,1],[4,2]]`                                              | ✅     |
| `[[1,2],[3,4]]` rotated 4×         | `[[1,2],[3,4]]`                      | `[[1,2],[3,4]]`                                              | ✅     |
| `[[1,2],[3,4]]` rotated 1×, 2×, 3× | not the input (2× = `[[4,3],[2,1]]`) | as expected                                                  | ✅     |
| `[[1,2,3],[4,5,6]]` (2 × 3)        | `[[4,1],[5,2],[6,3]]`                | `[[4,1],[5,2],[6,3]]`                                        | ✅     |
| `[[1,2,3],[4,5,6],[7,8,9]]`        | `[[7,4,1],[8,5,2],[9,6,3]]`          | `[[7,4,1],[8,5,2],[9,6,3]]`                                  | ✅     |
| `[[7]]`                            | `[[7]]`                              | `[[7]]`                                                      | ✅     |
| `[]`                               | `[]`                                 | `[]`                                                         | ✅     |
| `[[1,2],[3]]`                      | `RangeError`                         | `RangeError: rotateMatrix90: row 1 has length 1, expected 2` | ✅     |
| `[[]]`                             | `RangeError`                         | `RangeError: rotateMatrix90: row 0 is empty`                 | ✅     |
| `[[1], 5]`                         | `TypeError`                          | `TypeError: rotateMatrix90: row 1 is not an array`           | ✅     |
| `null`                             | `TypeError`                          | `TypeError: rotateMatrix90 expects an array of rows`         | ✅     |

Square sizes 1 to 5 and 7 were also checked against an independent reference
(transpose, then reverse each row), and each returns to its input after four
rotations.

## 3. Complexity experiment (operation counts, not timings)

Per the issue, step counts were recorded for bounded valid sizes. No
hardware-speed threshold is used: `moves` is a deterministic count of element
moves, so the result is the same on any machine.

| Size (n × n)        | Elements (n²) | Moves recorded | Moves / n² |
| ------------------- | ------------- | -------------- | ---------- |
| **2 × 2**           | 4             | **4**          | 1          |
| **3 × 3**           | 9             | **9**          | 1          |
| **4 × 4**           | 16            | **16**         | 1          |
| 8 × 8               | 64            | 64             | 1          |
| 16 × 16             | 256           | 256            | 1          |
| 3 × 5 (rectangular) | 15            | 15             | 1          |

The first three rows are the required sizes and are asserted in the tests. The
last three are extra checks.

**Conclusion:** each element is moved exactly once, so the work is
**Θ(n²)** for an n × n matrix (Θ(r·c) in general). Doubling n multiplies the
moves by 4 (4 → 16 → 64 → 256), which the tests assert. Extra memory is
Θ(n²) for the new matrix, because the function is pure and does not rotate in
place.

## 4. Required automated check

```
npm test -- src/algorithms/course/r62-t049.test.js && npm run build && npm run lint
```

| Step                    | Result                                       |
| ----------------------- | -------------------------------------------- |
| Focused test            | ✅ **25 passed (25)**                        |
| `npm run build`         | ✅ 4434 modules transformed                  |
| `npm run lint`          | ✅ exit 0 (`--max-warnings 0`)               |
| Full suite (`npm test`) | ✅ 4 files, 60 passed (35 existing + 25 new) |

## 5. The tests fail on an incorrect implementation

Each mutant was applied to `rotate-matrix-90.js`, tested, and then reverted.
The file was confirmed identical afterwards (`cmp`), and the tests were back
at 25/25.

| Mutant               | Change                                                 | Result         |
| -------------------- | ------------------------------------------------------ | -------------- |
| A: counter-clockwise | `rotated[cols - 1 - j][i] = matrix[i][j]`              | 11 failed / 25 |
| B: transpose only    | `rotated[j][i] = matrix[i][j]`                         | 11 failed / 25 |
| C: miscounted moves  | `moves += j === 0 ? 1 : 0` (counts rows, not elements) | 6 failed / 25  |

Mutants A and B still return to the input after four rotations (B even after
two), which is why the tests also check the exact one-step result and the
"not counter-clockwise" case.

## 6. UI

There is no UI change: this is a new pure module, and UI registration is an
optional follow-up per the issue. No browser smoke check or screenshot applies.

## 7. Tool versions

| Tool    | Version              |
| ------- | -------------------- |
| Node.js | v20.20.2             |
| npm     | 10.8.2               |
| Vitest  | 4.1.7                |
| Vite    | 7.1.11               |
| ESLint  | 9.38.0               |
| OS      | macOS 27.2.1 (arm64) |

Dependencies were installed from `package-lock.json` with `npm install`.
