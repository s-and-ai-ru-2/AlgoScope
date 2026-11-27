# R62-T046 — Topological sort (Kahn): evidence

**Student:** Aadarsh Bhardwaj (2601010001)
**Issue:** https://github.com/s-and-ai-ru-2/AlgoScope/issues/1
**Branch:** `student/2601010001/R62-T046`
**Base commit:** `973f3e6` (same commit the issue is pinned to)
**Run on:** 2026-11-27

> This folder is coursework evidence only. Per the task, remove `work/R62-T046/`
> from any later upstream branch.

## 1. What was changed

| File                                             | Purpose                                              |
| ------------------------------------------------ | ---------------------------------------------------- |
| `src/algorithms/course/topological-sort-kahn.js` | New pure module: `topologicalSortKahn(nodes, edges)` |
| `src/algorithms/course/r62-t046.test.js`         | Focused Vitest regression (14 tests)                 |

No existing files were modified. `src/App.jsx` was not changed: line 15 (the
pinned source) is only a lazy page import, and the file contains no algorithm
logic.

### Existing-implementation check (issue step 2)

```
grep -rnil "topolog\|kahn" src
src/components/searchAlgo/ComparisonMode.jsx   # prose mention only
src/data/challengeQuestions.js                 # quiz questions only
```

No topological sort implementation or visualization existed, so a new module
does not duplicate a registered visualization.

### Contract

- **Input:** `nodes` (array of ids), `edges` (array of `[from, to]` pairs;
  `from` must come before `to`).
- **Success:** `{ ok: true, order }`, where `order` contains every node exactly
  once and respects every edge.
- **Cycle:** `{ ok: false, error: 'cycle', order, remaining }`, where `order` is
  only the placeable prefix and `remaining` lists the nodes in or behind a
  cycle. A partial order is never reported as `ok: true`.
- **Invalid input:** throws `TypeError` (non-array input, malformed edge) or
  `Error` (duplicate node, edge with an unknown node).
- **Pure:** no React, animation or display state, and the inputs are not
  mutated. Source strings, replay steps and UI registration are out of scope
  (optional follow-up).

## 2. Inputs: expected vs. actual

| Input (edges)        | Expected                      | Actual                                                                 | Result |
| -------------------- | ----------------------------- | ---------------------------------------------------------------------- | ------ |
| `A→C, B→C`           | `ok: true`, A and B before C  | `{"ok":true,"order":["A","B","C"]}`                                    | ✅     |
| `A→B, B→A`           | `ok: false`, cycle on A, B    | `{"ok":false,"error":"cycle","order":[],"remaining":["A","B"]}`        | ✅     |
| `A→A` (self-loop)    | `ok: false`, cycle on A       | `{"ok":false,"error":"cycle","order":[],"remaining":["A"]}`            | ✅     |
| `A→B, B→C, C→B, C→D` | `ok: false`; only A placeable | `{"ok":false,"error":"cycle","order":["A"],"remaining":["B","C","D"]}` | ✅     |
| empty graph          | `ok: true`, empty order       | `{"ok":true,"order":[]}`                                               | ✅     |
| `A→Z` (Z not a node) | throws                        | `Error: Edge uses unknown node: A -> Z`                                | ✅     |

## 3. Required automated check

```
npm test -- src/algorithms/course/r62-t046.test.js && npm run build && npm run lint
```

| Step                    | Result                                       |
| ----------------------- | -------------------------------------------- |
| Focused test            | ✅ 1 file, **14 passed (14)**                |
| `npm run build`         | ✅ 4434 modules transformed, built in 5.50s  |
| `npm run lint`          | ✅ exit 0 (`--max-warnings 0`)               |
| Full suite (`npm test`) | ✅ 4 files, 49 passed (35 existing + 14 new) |

Focused test output (verbose):

```
✓ valid DAGs > places A and B before C for edges A→C, B→C
✓ valid DAGs > returns the only valid order for a chain A→B→C→D
✓ valid DAGs > respects every edge in a diamond A→B, A→C, B→D, C→D
✓ valid DAGs > keeps isolated nodes that have no edges
✓ valid DAGs > handles an empty graph and a single node
✓ valid DAGs > counts duplicate edges correctly
✓ valid DAGs > does not mutate its inputs
✓ cycles fail clearly > reports a two-node cycle A→B→A
✓ cycles fail clearly > reports a self-loop A→A
✓ cycles fail clearly > never claims a partial order is complete
✓ invalid input > throws when nodes or edges are not arrays
✓ invalid input > throws on a malformed edge
✓ invalid input > throws when an edge uses an unknown node
✓ invalid input > throws on duplicate nodes

Test Files  1 passed (1)
     Tests  14 passed (14)
```

Baseline before any change (same commit, clean tree): `npm test` 35/35 passed,
build passed, lint passed.

## 4. The tests fail on an incorrect implementation

A temporary mutant disabled the cycle check in `topological-sort-kahn.js`:

```diff
- if (order.length !== nodes.length) {
+ if (false) {
```

Result with the mutant (Vitest exits non-zero):

```
× cycles fail clearly > reports a two-node cycle A→B→A
× cycles fail clearly > reports a self-loop A→A
× cycles fail clearly > never claims a partial order is complete
Tests  3 failed | 11 passed (14)
```

After restoring the original file: `Tests  14 passed (14)`. The mutant was not
committed.

To reproduce:

```
cp src/algorithms/course/topological-sort-kahn.js /tmp/kahn.bak
sed -i '' 's/if (order.length !== nodes.length) {/if (false) {/' src/algorithms/course/topological-sort-kahn.js
npm test -- src/algorithms/course/r62-t046.test.js   # expect 3 failures, non-zero exit
cp /tmp/kahn.bak src/algorithms/course/topological-sort-kahn.js
```

(`sed -i ''` is the macOS form; on Linux use `sed -i`.)

## 5. Tool versions

| Tool    | Version              |
| ------- | -------------------- |
| Node.js | v20.20.2             |
| npm     | 10.8.2               |
| Vitest  | 4.1.7                |
| Vite    | 7.1.11               |
| ESLint  | 9.38.0               |
| OS      | macOS 27.2.1 (arm64) |

Dependencies were installed from `package-lock.json` with `npm install`.
