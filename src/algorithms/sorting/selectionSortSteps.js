import { createStep } from '../../lib/utils'

export const selectionSortSources = {
  javascript: {
    code: `function selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
  }
}`,
    lineMap: {
      function: 1,
      setup: 2,
      outerLoop: 3,
      initMin: 4,
      innerLoop: 5,
      compare: 6,
      updateMin: 7,
      swap: 11,
      complete: 14,
    },
  },
  python: {
    code: `def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]`,
    lineMap: {
      function: 1,
      setup: 2,
      outerLoop: 3,
      initMin: 4,
      innerLoop: 5,
      compare: 6,
      updateMin: 7,
      swap: 9,
      complete: 9,
    },
  },
  java: {
    code: `public void selectionSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
}`,
    lineMap: {
      function: 1,
      setup: 2,
      outerLoop: 3,
      initMin: 4,
      innerLoop: 5,
      compare: 6,
      updateMin: 7,
      swap: 11,
      complete: 16,
    },
  },
  cpp: {
    code: `void selectionSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            swap(arr[i], arr[minIdx]);
        }
    }
}`,
    lineMap: {
      function: 1,
      setup: 2,
      outerLoop: 3,
      initMin: 4,
      innerLoop: 5,
      compare: 6,
      updateMin: 7,
      swap: 11,
      complete: 14,
    },
  },
  c: {
    code: `void selectionSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
}`,
    lineMap: {
      function: 1,
      setup: 1,
      outerLoop: 2,
      initMin: 3,
      innerLoop: 4,
      compare: 5,
      updateMin: 6,
      swap: 10,
      complete: 15,
    },
  },
  rust: {
    code: `fn selection_sort(arr: &mut [i32]) {
    let n = arr.len();
    for i in 0..n - 1 {
        let mut min_idx = i;
        for j in i + 1..n {
            if arr[j] < arr[min_idx] {
                min_idx = j;
            }
        }
        if min_idx != i {
            arr.swap(i, min_idx);
        }
    }
}`,
    lineMap: {
      function: 1,
      setup: 2,
      outerLoop: 3,
      initMin: 4,
      innerLoop: 5,
      compare: 6,
      updateMin: 7,
      swap: 11,
      complete: 14,
    },
  },
  go: {
    code: `func selectionSort(arr []int) {
    n := len(arr)
    for i := 0; i < n-1; i++ {
        minIdx := i
        for j := i + 1; j < n; j++ {
            if arr[j] < arr[minIdx] {
                minIdx = j
            }
        }
        if minIdx != i {
            arr[i], arr[minIdx] = arr[minIdx], arr[i]
        }
    }
}`,
    lineMap: {
      function: 1,
      setup: 2,
      outerLoop: 3,
      initMin: 4,
      innerLoop: 5,
      compare: 6,
      updateMin: 7,
      swap: 11,
      complete: 14,
    },
  },
}

export function getSelectionSortSource(language = 'javascript') {
  return selectionSortSources[language] ?? selectionSortSources.javascript
}

export function resolveSelectionSortLine(language, lineKey) {
  if (!lineKey) return undefined
  const source = getSelectionSortSource(language)
  return (
    source.lineMap[lineKey] ?? selectionSortSources.javascript.lineMap[lineKey]
  )
}

/**
 * Builds the replay steps for an ascending selection sort.
 *
 * This is a pure step generator: it copies `inputArray` (the caller's array is
 * never mutated) and returns an array of frames built with `createStep`. Each
 * frame carries a `lineKey` that `resolveSelectionSortLine` maps to a line in
 * the displayed source for the selected language, so every key used here must
 * exist in every `lineMap` above and point at the matching line.
 *
 * Only ascending order is supported; there is no direction parameter. Empty
 * and single-element arrays are valid and simply return their input.
 *
 * Worked fixture: [3, 1, 2] -> [1, 2, 3] in 21 steps (2 swaps).
 *
 *   pass i=0: assume min=3 (idx 0); compare 1 < 3 -> min idx 1;
 *             compare 2 < 1? no; swap idx 0 <-> 1       -> [1, 3, 2]
 *   pass i=1: assume min=3 (idx 1); compare 2 < 3 -> min idx 2;
 *             swap idx 1 <-> 2                          -> [1, 2, 3]
 *   pass i=2: last element; no comparisons, no swap     -> [1, 2, 3]
 *
 * Notes on the frames:
 * - A 'swap' frame shows the array *before* the swap, with `indices` naming
 *   the two positions; the following 'pass-complete' frame shows the result.
 * - The loop runs `i < n` (the displayed sources use `n - 1`), so the final
 *   element still gets an 'outer-loop'/'init-min'/'pass-complete' frame with
 *   no comparisons. The sorted result is identical.
 * - `sortedIndices` grows by one index per pass; the 'start' frame has none.
 *
 * Other fixtures: [2, 2, 1] -> [1, 2, 2] (1 swap; equal values are not
 * swapped with each other), [1, 2, 3] -> [1, 2, 3] (0 swaps),
 * [3, 2, 1] -> [1, 2, 3] (1 swap), [1] -> [1], [] -> [].
 *
 * @param {number[]} inputArray - values to sort (not mutated)
 * @returns {object[]} replay steps; the last step has type 'complete' and
 *   `array` equal to the sorted input
 */
export function generateSelectionSortSteps(inputArray) {
  const arr = [...inputArray]
  const steps = []
  const n = arr.length
  const sortedIndices = []

  steps.push(
    createStep({
      lineKey: 'function',
      type: 'start',
      array: arr,
      sortedIndices: [...sortedIndices],
      message: 'Selection Sort starts.',
      variables: { n },
      duration: 700,
    })
  )

  for (let i = 0; i < n; i++) {
    steps.push(
      createStep({
        lineKey: 'outerLoop',
        type: 'outer-loop',
        array: arr,
        indices: [i],
        sortedIndices: [...sortedIndices],
        message: `Finding the minimum element for index ${i}.`,
        variables: { i, n },
        duration: 600,
      })
    )

    let minIdx = i
    steps.push(
      createStep({
        lineKey: 'initMin',
        type: 'init-min',
        array: arr,
        indices: [i],
        sortedIndices: [...sortedIndices],
        message: `Assume index ${i} (value ${arr[i]}) is the current minimum.`,
        variables: { i, minIdx, n },
        duration: 500,
      })
    )

    for (let j = i + 1; j < n; j++) {
      steps.push(
        createStep({
          lineKey: 'innerLoop',
          type: 'inner-loop',
          array: arr,
          indices: [j, minIdx],
          sortedIndices: [...sortedIndices],
          message: `Check index ${j} against current minimum at index ${minIdx}.`,
          variables: { i, j, minIdx, n },
          duration: 400,
        })
      )

      steps.push(
        createStep({
          lineKey: 'compare',
          type: 'compare',
          array: arr,
          indices: [j, minIdx],
          sortedIndices: [...sortedIndices],
          message: `Compare ${arr[j]} and ${arr[minIdx]}.`,
          variables: { i, j, minIdx, n },
          duration: 600,
        })
      )

      if (arr[j] < arr[minIdx]) {
        minIdx = j
        steps.push(
          createStep({
            lineKey: 'updateMin',
            type: 'min',
            array: arr,
            indices: [minIdx],
            sortedIndices: [...sortedIndices],
            message: `Found a smaller element! New minimum is ${arr[minIdx]} at index ${minIdx}.`,
            variables: { i, j, minIdx, n },
            duration: 700,
          })
        )
      }
    }

    if (minIdx !== i) {
      steps.push(
        createStep({
          lineKey: 'swap',
          type: 'swap',
          array: arr,
          indices: [i, minIdx],
          sortedIndices: [...sortedIndices],
          message: `Swap the minimum element (${arr[minIdx]}) with the element at index ${i} (${arr[i]}).`,
          variables: { i, minIdx, n },
          duration: 850,
        })
      )
      ;[arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
    }

    sortedIndices.push(i)
    steps.push(
      createStep({
        lineKey: 'outerLoop',
        type: 'pass-complete',
        array: arr,
        sortedIndices: [...sortedIndices],
        message: `Pass ${i + 1} complete. Index ${i} is now sorted.`,
        variables: { i, n },
        duration: 550,
      })
    )
  }

  steps.push(
    createStep({
      lineKey: 'complete',
      type: 'complete',
      array: arr,
      sortedIndices: Array.from({ length: n }, (_, index) => index),
      message: 'Selection Sort is complete.',
      variables: { n },
      duration: 900,
    })
  )

  return steps
}
