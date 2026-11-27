# R62-T050 — Longest common subsequence: mutation-resistant tests (evidence)

**Student:** Aadarsh Bhardwaj (2601010001)
**Issue:** https://github.com/s-and-ai-ru-2/AlgoScope/issues/5
**Branch:** `student/2601010001/R62-T050`
**Base commit:** `973f3e6` (same commit the issue is pinned to)
**Run on:** 2026-11-28

> This folder is coursework evidence only. Per the task, remove `work/R62-T050/`
> from any later upstream branch.

## 1. What was changed

| File                                     | Purpose                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/algorithms/course/r62-t050.test.js` | Focused, mutation-resistant Vitest regression (21 tests) for the existing LCS generator |

**No implementation was added or changed.**

### Existing-implementation check (issue step 2): reused, not duplicated

```
grep -rn -i "lcs\|longest common subseq" src
src/algorithms/dp/dpStepGenerators.js:2: export function generateLCSSteps(a, b)
src/components/dynamicProgramming/DPVisualizer.jsx:5: generateLCSSteps (registered as 'LCS')
```

LCS already exists and is registered in the DP visualizer
(`/dynamic-programming?problem=lcs`). The issue says to reuse an existing
implementation and that a proposed module "must not duplicate an already
registered visualization". For that reason
`src/algorithms/course/longest-common-subsequence.js` was **not** created, and
the tests target `generateLCSSteps` directly. The existing implementation
passed every test, so no fix was needed.

### What the tests cover

- **Result:** `dp[m][n]`, the LCS length.
- **Traceback:** the subsequence recovered from the `traceback` steps must be a
  common subsequence of both strings, with length equal to `dp[m][n]`.
- **No tied answer required:** for the issue fixture, any valid length-4 answer
  is accepted (`BCBA`, `BCAB` or `BDAB`); this implementation returns `BDAB`.
- **Replay steps:** a fill step for every cell in row-major order, correct
  `match` flags, one traceback step per matched character, and independent
  table snapshots.
- **Independent oracle:** a brute-force LCS (it tries every subsequence)
  checked on 300 deterministic pseudo-random pairs.

## 2. Inputs: expected vs. actual

| a         | b         | Expected length    | Actual   | Traced subsequence                              |
| --------- | --------- | ------------------ | -------- | ----------------------------------------------- |
| `ABCBDAB` | `BDCABA`  | **4**              | **4** ✅ | `BDAB` (valid; `BCBA` and `BCAB` also accepted) |
| `BDCABA`  | `ABCBDAB` | 4                  | 4 ✅     | n/a                                             |
| `ABC`     | `ABC`     | 3                  | 3 ✅     | `ABC`                                           |
| `ABC`     | `DEF`     | 0                  | 0 ✅     | `""`                                            |
| `AAAA`    | `AA`      | 2                  | 2 ✅     | `AA`                                            |
| `ABC`     | `CBA`     | 1                  | 1 ✅     | n/a                                             |
| `AXBYCZ`  | `ABC`     | 3                  | 3 ✅     | n/a                                             |
| `""`      | `""`      | 0                  | 0 ✅     | `""`                                            |
| `abc`     | `ABC`     | 0 (case-sensitive) | 0 ✅     | n/a                                             |

Brute-force oracle: lengths and traceback validity agree on all 300 random
pairs (alphabet `ABC`, length ≤ 8).

## 3. Required automated check

```
npm test -- src/algorithms/course/r62-t050.test.js && npm run build && npm run lint
```

| Step                    | Result                                       |
| ----------------------- | -------------------------------------------- |
| Focused test            | ✅ **21 passed (21)**                        |
| `npm run build`         | ✅ 4434 modules transformed                  |
| `npm run lint`          | ✅ exit 0 (`--max-warnings 0`)               |
| Full suite (`npm test`) | ✅ 4 files, 56 passed (35 existing + 21 new) |

## 4. Mutation testing: one-condition mutants are rejected

Each mutant changes one condition or expression in
`src/algorithms/dp/dpStepGenerators.js` (inside `generateLCSSteps`). Each was
applied, tested, and reverted. The file was confirmed identical to the original
afterwards (`cmp`), and `git status` shows it unmodified.

| #      | Mutant (decisive operation) | Change                                      | Result                |
| ------ | --------------------------- | ------------------------------------------- | --------------------- |
| **M1** | **match condition**         | `a[i - 1] === b[j - 1]` → `!==` (fill)      | ❌ **13 failed** / 21 |
| M2     | match value                 | `dp[i - 1][j - 1] + 1` → `dp[i - 1][j - 1]` | ❌ 11 failed          |
| M3     | wrong neighbour on match    | `dp[i - 1][j - 1] + 1` → `dp[i - 1][j] + 1` | ❌ 5 failed           |
| M4     | mismatch rule               | `Math.max(...)` → `Math.min(...)`           | ❌ 8 failed           |
| M5     | fill boundary               | `i <= m` → `i < m`                          | ❌ 12 failed          |
| M6     | traceback direction         | `dp[i - 1][j] > dp[i][j - 1]` → `<`         | ❌ 1 failed           |
| M7     | traceback match condition   | `a[i - 1] === b[j - 1]` → `!==` (traceback) | ❌ 3 failed           |

**All 7 mutants are killed.** M1 is the one-condition mutant of the decisive
operation that the issue asks for. M6 is caught only by the oracle test, which
checks that the traced subsequence has length `dp[m][n]`: the wrong direction
skips matches on some inputs but not on the fixture. That is why the
randomised oracle is included.

M3 is subtle: it over-counts repeated characters (`AAAA` / `AA` would give
more than 2). The test "repeated characters are not double-counted" and the
oracle catch it.

To reproduce M1 (line 10 at `973f3e6`):

```
F=src/algorithms/dp/dpStepGenerators.js
cp $F /tmp/dp.bak
sed -i '' '10s/a\[i - 1\] === b\[j - 1\]/a[i - 1] !== b[j - 1]/' $F
npm test -- src/algorithms/course/r62-t050.test.js   # expect 13 failures, non-zero exit
cp /tmp/dp.bak $F
```

(`sed -i ''` is the macOS form; on Linux use `sed -i`.)

## 5. UI

There is no UI change: no source file was modified, so no browser smoke check
or screenshot applies.

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
