# R62-T048 — Comb sort: failure-path coverage (evidence)

**Student:** Aadarsh Bhardwaj (2601010001)
**Issue:** https://github.com/s-and-ai-ru-2/AlgoScope/issues/3
**Branch:** `student/2601010001/R62-T048`
**Base commit:** `973f3e6` (same commit the issue is pinned to)
**Run on:** 2026-11-28

> This folder is coursework evidence only. Per the task, remove `work/R62-T048/`
> from any later upstream branch.

## 1. What was changed

| File                                     | Purpose                                                 |
| ---------------------------------------- | ------------------------------------------------------- |
| `src/algorithms/course/comb-sort.js`     | New pure module: `combSort(values)` and `SHRINK_FACTOR` |
| `src/algorithms/course/r62-t048.test.js` | Focused Vitest regression (43 tests)                    |

No existing files were modified. `src/App.jsx` was not changed: line 15 (the
pinned source) is a lazy page import and contains no algorithm logic.

### Existing-implementation check (issue step 2)

```
grep -rni "comb.\?sort" src   # 0 matches
```

No comb sort implementation or visualization existed, so a new module does not
duplicate a registered visualization.

### Contract

- **Input:** an array of finite numbers.
- **Success:** `{ sorted, gaps, passes, comparisons, swaps }`. `sorted` is
  ascending, and `gaps` lists the gap used by each pass. Each gap is
  `max(1, floor(previous / 1.3))`, starting from `n`. The last pass is always
  gap 1 with 0 swaps; this clean pass is what establishes the ordering.
- **Smallest inputs:** `[]` and `[x]` are valid and returned with no passes.
- **Error / unsupported-input state:** throws `TypeError` with a message naming
  the problem:
  - not an array (`null`, `undefined`, string, number, array-like object):
    `combSort expects an array of numbers, received <type>`
  - any element that is not a finite number (string, numeric string, `NaN`,
    `±Infinity`, `null`, `undefined`):
    `combSort expects finite numbers; index <i> is <value>`
- **Recovery:** the function is pure and keeps no state between calls, so a
  valid run after a rejected one returns exactly the same result as a run
  without the failure. The input is never mutated, including when rejected.
- Error style follows the existing code: `largestRectangleSteps.js` throws on
  invalid input, and the sorting UI already rejects non-numbers.

## 2. Inputs: expected vs. actual

### Issue fixture `[3, 1, 2, 2]`

| Pass | Gap | Compared                   | Swaps | Array after                 |
| ---- | --- | -------------------------- | ----- | --------------------------- |
| 1    | 3   | (0,3): 3 > 2               | 1     | `[2, 1, 2, 3]`              |
| 2    | 2   | (0,2), (1,3)               | 0     | `[2, 1, 2, 3]`              |
| 3    | 1   | (0,1): 2 > 1; (1,2); (2,3) | 1     | `[1, 2, 2, 3]`              |
| 4    | 1   | (0,1), (1,2), (2,3)        | 0     | `[1, 2, 2, 3]` ← clean pass |

Actual:
`{"sorted":[1,2,2,3],"gaps":[3,2,1,1],"passes":[{"gap":3,"swaps":1},{"gap":2,"swaps":0},{"gap":1,"swaps":1},{"gap":1,"swaps":0}],"comparisons":9,"swaps":2}` ✅

### Other valid inputs

| Input                 | Expected              | Actual `sorted`       | Gaps           |
| --------------------- | --------------------- | --------------------- | -------------- |
| `[]`                  | `[]`                  | `[]`                  | `[]`           |
| `[5]`                 | `[5]`                 | `[5]`                 | `[]`           |
| `[2, 1]`              | `[1, 2]`              | `[1, 2]`              | `[1, 1]`       |
| `[5, 4, 3, 2, 1]`     | `[1, 2, 3, 4, 5]`     | `[1, 2, 3, 4, 5]`     | `[3, 2, 1, 1]` |
| `[1, 2, 3, 4, 5]`     | unchanged, 0 swaps    | `[1, 2, 3, 4, 5]`     | `[3, 2, 1]`    |
| `[3, -1, 2.5, 0, -1]` | `[-1, -1, 0, 2.5, 3]` | `[-1, -1, 0, 2.5, 3]` | `[3, 2, 1, 1]` |

Agreement with `Array.prototype.sort((a, b) => a - b)`:

- 200 deterministic arrays in the test suite: all match.
- 2000 random arrays checked during development: all match.

### Unsupported inputs (actual messages)

| Input            | Result                                                             |
| ---------------- | ------------------------------------------------------------------ |
| `null`           | `TypeError: combSort expects an array of numbers, received null`   |
| `'3,1,2'`        | `TypeError: combSort expects an array of numbers, received string` |
| `42`             | `TypeError: combSort expects an array of numbers, received number` |
| `[3, 'a', 1]`    | `TypeError: combSort expects finite numbers; index 1 is "a"`       |
| `[1, NaN]`       | `TypeError: combSort expects finite numbers; index 1 is NaN`       |
| `[1, Infinity]`  | `TypeError: combSort expects finite numbers; index 1 is Infinity`  |
| `[1, undefined]` | `TypeError: combSort expects finite numbers; index 1 is undefined` |
| `[1, null]`      | `TypeError: combSort expects finite numbers; index 1 is null`      |

Recovery: `combSort([3, NaN, 1])` throws, and the next call,
`combSort([3, 1, 2, 2])`, returns `[1, 2, 2, 3]` with gaps `[3, 2, 1, 1]` ✅

## 3. Required automated check

```
npm test -- src/algorithms/course/r62-t048.test.js && npm run build && npm run lint
```

| Step                    | Result                                       |
| ----------------------- | -------------------------------------------- |
| Focused test            | ✅ **43 passed (43)**                        |
| `npm run build`         | ✅ 4434 modules transformed                  |
| `npm run lint`          | ✅ exit 0 (`--max-warnings 0`)               |
| Full suite (`npm test`) | ✅ 4 files, 78 passed (35 existing + 43 new) |

Test groups:

- **Issue fixture (2):** the sorted result, plus the exact gaps, passes, swaps and comparisons.
- **Gap schedule (16):** across 5 inputs, gaps never grow, follow `floor(prev / 1.3)`, and end with a clean gap-1 pass; plus the shrink factor itself.
- **Valid inputs (10):** reversed, sorted, all-equal, negatives and decimals, two elements, empty, single element, 200 arrays checked against the built-in sort, and no mutation.
- **Failure path (13):** 5 non-array inputs, 7 bad elements (each check asserts both `TypeError` and the message), and no mutation on rejection.
- **Recovery (2):** a valid run after a failure succeeds and matches a run with no failure.

## 4. The tests fail on an incorrect implementation

**Mutant A: stop as soon as the gap reaches 1, without the final clean pass.**

```diff
- while (gap > 1 || swappedLastPass) {
+ while (gap > 1) {
```

Result: `Tests  7 failed | 36 passed (43)`. The failures include "matches the
built-in numeric sort on many arrays": without the clean gap-1 pass, some
arrays are left unsorted.

**Mutant B: input validation removed.**

```diff
- assertSortableNumbers(values)
+ // assertSortableNumbers(values)
```

Result: `Tests  15 failed | 28 passed (43)`. Every failure-path and recovery
test fails.

After each mutant the original file was restored and confirmed identical
(`cmp`), and the tests were back at `43 passed (43)`. No mutant was committed.

To reproduce:

```
F=src/algorithms/course/comb-sort.js
cp $F /tmp/comb.bak
# A:
sed -i '' 's/while (gap > 1 || swappedLastPass) {/while (gap > 1) {/' $F
npm test -- src/algorithms/course/r62-t048.test.js   # expect 7 failures
cp /tmp/comb.bak $F
# B:
sed -i '' 's/^  assertSortableNumbers(values)$/  \/\/ assertSortableNumbers(values)/' $F
npm test -- src/algorithms/course/r62-t048.test.js   # expect 15 failures
cp /tmp/comb.bak $F
```

(`sed -i ''` is the macOS form; on Linux use `sed -i`.)

## 5. UI

There is no UI change: this is a new pure module, and full UI registration is
an optional follow-up per the issue. No browser smoke check or screenshot
applies.

## 6. Tool versions

| Tool    | Version              |
| ------- | -------------------- |
| Node.js | v20.20.2             |
| npm     | 10.8.2               |
| Vitest  | 4.1.7                |
| Vite    | 7.1.11               |
| ESLint  | 9.38.0               |
| OS      | macOS 27.2.1 (arm64) |

Dependencies were installed from `package-lock.json` with `npm install`.
