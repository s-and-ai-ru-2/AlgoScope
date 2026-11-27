import { describe, it, expect } from 'vitest'
import { topologicalSortKahn } from './topological-sort-kahn.js'

// Returns true when every edge [from, to] has `from` placed before `to`.
const respectsEdges = (order, edges) =>
  edges.every(([from, to]) => order.indexOf(from) < order.indexOf(to))

describe('topologicalSortKahn (R62-T046)', () => {
  describe('valid DAGs', () => {
    it('places A and B before C for edges A→C, B→C', () => {
      const nodes = ['A', 'B', 'C']
      const edges = [
        ['A', 'C'],
        ['B', 'C'],
      ]
      const result = topologicalSortKahn(nodes, edges)

      expect(result.ok).toBe(true)
      expect(result.order).toHaveLength(3)
      expect([...result.order].sort()).toEqual(['A', 'B', 'C'])
      expect(result.order.indexOf('A')).toBeLessThan(result.order.indexOf('C'))
      expect(result.order.indexOf('B')).toBeLessThan(result.order.indexOf('C'))
      expect(result.order[2]).toBe('C')
    })

    it('returns the only valid order for a chain A→B→C→D', () => {
      const result = topologicalSortKahn(
        ['D', 'C', 'B', 'A'],
        [
          ['A', 'B'],
          ['B', 'C'],
          ['C', 'D'],
        ]
      )

      expect(result).toEqual({ ok: true, order: ['A', 'B', 'C', 'D'] })
    })

    it('respects every edge in a diamond A→B, A→C, B→D, C→D', () => {
      const edges = [
        ['A', 'B'],
        ['A', 'C'],
        ['B', 'D'],
        ['C', 'D'],
      ]
      const result = topologicalSortKahn(['A', 'B', 'C', 'D'], edges)

      expect(result.ok).toBe(true)
      expect(result.order[0]).toBe('A')
      expect(result.order[3]).toBe('D')
      expect(respectsEdges(result.order, edges)).toBe(true)
    })

    it('keeps isolated nodes that have no edges', () => {
      const result = topologicalSortKahn(['X', 'A', 'B'], [['A', 'B']])

      expect(result.ok).toBe(true)
      expect([...result.order].sort()).toEqual(['A', 'B', 'X'])
      expect(respectsEdges(result.order, [['A', 'B']])).toBe(true)
    })

    it('handles an empty graph and a single node', () => {
      expect(topologicalSortKahn([], [])).toEqual({ ok: true, order: [] })
      expect(topologicalSortKahn(['A'], [])).toEqual({ ok: true, order: ['A'] })
    })

    it('counts duplicate edges correctly', () => {
      const result = topologicalSortKahn(
        ['A', 'B'],
        [
          ['A', 'B'],
          ['A', 'B'],
        ]
      )

      expect(result).toEqual({ ok: true, order: ['A', 'B'] })
    })

    it('does not mutate its inputs', () => {
      const nodes = ['A', 'B', 'C']
      const edges = [
        ['A', 'C'],
        ['B', 'C'],
      ]
      const nodesCopy = structuredClone(nodes)
      const edgesCopy = structuredClone(edges)

      topologicalSortKahn(nodes, edges)

      expect(nodes).toEqual(nodesCopy)
      expect(edges).toEqual(edgesCopy)
    })
  })

  describe('cycles fail clearly', () => {
    it('reports a two-node cycle A→B→A', () => {
      const result = topologicalSortKahn(
        ['A', 'B'],
        [
          ['A', 'B'],
          ['B', 'A'],
        ]
      )

      expect(result.ok).toBe(false)
      expect(result.error).toBe('cycle')
      expect(result.order).toEqual([])
      expect([...result.remaining].sort()).toEqual(['A', 'B'])
    })

    it('reports a self-loop A→A', () => {
      const result = topologicalSortKahn(['A'], [['A', 'A']])

      expect(result.ok).toBe(false)
      expect(result.error).toBe('cycle')
      expect(result.remaining).toEqual(['A'])
    })

    it('never claims a partial order is complete', () => {
      // A is placeable; B↔C is a cycle; D depends on the cycle.
      const result = topologicalSortKahn(
        ['A', 'B', 'C', 'D'],
        [
          ['A', 'B'],
          ['B', 'C'],
          ['C', 'B'],
          ['C', 'D'],
        ]
      )

      expect(result.ok).toBe(false)
      expect(result.error).toBe('cycle')
      expect(result.order).toEqual(['A'])
      expect([...result.remaining].sort()).toEqual(['B', 'C', 'D'])
      expect(result.order.length + result.remaining.length).toBe(4)
    })
  })

  describe('invalid input', () => {
    it('throws when nodes or edges are not arrays', () => {
      expect(() => topologicalSortKahn(null, [])).toThrow(TypeError)
      expect(() => topologicalSortKahn(['A'], 'A->B')).toThrow(TypeError)
    })

    it('throws on a malformed edge', () => {
      expect(() => topologicalSortKahn(['A', 'B'], [['A']])).toThrow(TypeError)
    })

    it('throws when an edge uses an unknown node', () => {
      expect(() => topologicalSortKahn(['A'], [['A', 'Z']])).toThrow(
        /unknown node/
      )
    })

    it('throws on duplicate nodes', () => {
      expect(() => topologicalSortKahn(['A', 'A'], [])).toThrow(/Duplicate/)
    })
  })
})
