/**
 * Topological sort using Kahn's algorithm (BFS on in-degrees).
 *
 * Pure function: it does not touch React, animation or display state.
 * Same input always gives the same output.
 *
 * @param {string[]} nodes - every node in the graph, e.g. ['A', 'B', 'C']
 * @param {Array<[string, string]>} edges - directed edges [from, to],
 *   meaning `from` must come before `to`, e.g. [['A', 'C'], ['B', 'C']]
 * @returns {{ ok: true, order: string[] }
 *   | { ok: false, error: 'cycle', order: string[], remaining: string[] }}
 *   On success, `order` contains every node exactly once.
 *   On a cycle, `order` is only the part that could be placed and
 *   `remaining` lists the nodes that are stuck in (or behind) a cycle.
 * @throws {TypeError} if nodes/edges are not arrays or an edge is malformed
 * @throws {Error} if a node is duplicated or an edge uses an unknown node
 */
export function topologicalSortKahn(nodes, edges) {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    throw new TypeError('nodes and edges must be arrays')
  }

  // 1. Build in-degree counts and adjacency lists.
  const inDegree = new Map()
  const adjacency = new Map()
  for (const node of nodes) {
    if (inDegree.has(node)) {
      throw new Error(`Duplicate node: ${node}`)
    }
    inDegree.set(node, 0)
    adjacency.set(node, [])
  }

  for (const edge of edges) {
    if (!Array.isArray(edge) || edge.length !== 2) {
      throw new TypeError('Each edge must be a [from, to] pair')
    }
    const [from, to] = edge
    if (!inDegree.has(from) || !inDegree.has(to)) {
      throw new Error(`Edge uses unknown node: ${from} -> ${to}`)
    }
    adjacency.get(from).push(to)
    inDegree.set(to, inDegree.get(to) + 1)
  }

  // 2. Start with every node that has no incoming edges.
  const queue = nodes.filter((node) => inDegree.get(node) === 0)

  // 3. Repeatedly place a ready node and release its neighbours.
  const order = []
  let head = 0 // read pointer: avoids O(n) cost of queue.shift()
  while (head < queue.length) {
    const node = queue[head++]
    order.push(node)
    for (const next of adjacency.get(node)) {
      const remainingDeps = inDegree.get(next) - 1
      inDegree.set(next, remainingDeps)
      if (remainingDeps === 0) queue.push(next)
    }
  }

  // 4. If some nodes were never placed, the graph has a cycle.
  if (order.length !== nodes.length) {
    const placed = new Set(order)
    return {
      ok: false,
      error: 'cycle',
      order,
      remaining: nodes.filter((node) => !placed.has(node)),
    }
  }

  return { ok: true, order }
}
