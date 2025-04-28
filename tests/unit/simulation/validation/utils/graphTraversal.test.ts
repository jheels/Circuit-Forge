import { describe, it, expect } from "vitest";
import { hasWireOnlyPath } from "@/simulation/validation/utils/graphTraversal";
import { CircuitEdge, CircuitNode } from "@/simulation/circuit/circuitDetection";
// Minimal CircuitGraph type for testing

type CircuitGraph = {
    edges: Record<string, CircuitEdge>;
    nodes: Record<string, CircuitNode>;
};

describe("hasWireOnlyPath", () => {
    const makeGraph = (edges: CircuitEdge[]): CircuitGraph => {
        const nodes: Record<string, CircuitNode> = {};
        edges.forEach(edge => {
            if (!nodes[edge.sourceId]) {
                nodes[edge.sourceId] = { id: edge.sourceId, type: 'regular' };
            }
            if (!nodes[edge.targetId]) {
                nodes[edge.targetId] = { id: edge.targetId, type: 'regular' };
            }
        });
        return { edges: Object.fromEntries(edges.map(edge => [edge.id, edge])), nodes };
    };

    it("returns true for direct wire connection", () => {
        const graph = makeGraph([
            { id: "e1", sourceId: "A", targetId: "B", connection: { type: "wire", id: 'test-connection' } }
        ]);
        expect(hasWireOnlyPath(graph, "A", "B")).toBe(true);
        expect(hasWireOnlyPath(graph, "B", "A")).toBe(true);
    });

    it("returns false if no path exists", () => {
        const graph = makeGraph([
            { id: "e1", sourceId: "A", targetId: "B", connection: { type: "wire", id: 'test-connection' } }
        ]);
        expect(hasWireOnlyPath(graph, "A", "C")).toBe(false);
    });

    it("returns false if only non-wire edges connect nodes", () => {
        const graph = makeGraph([
            { id: "e1", sourceId: "A", targetId: "B", connection: { type: "component", id: 'test-connection' } }
        ]);
        expect(hasWireOnlyPath(graph, "A", "B")).toBe(false);
    });

    it("returns true for multi-step wire path", () => {
        const graph = makeGraph([
            { id: "e1", sourceId: "A", targetId: "B", connection: { type: "wire", id: 'test-connection1' } },
            { id: "e2", sourceId: "B", targetId: "C", connection: { type: "wire", id: 'test-connection2' } }
        ]);
        expect(hasWireOnlyPath(graph, "A", "C")).toBe(true);
    });

    it("returns false if path is blocked by excludeEdgeIds", () => {
        const graph = makeGraph([
            { id: "e1", sourceId: "A", targetId: "B", connection: { type: "wire", id: 'test-connection1' } },
            { id: "e2", sourceId: "B", targetId: "C", connection: { type: "wire", id: 'test-connection2' } }
        ]);
        expect(hasWireOnlyPath(graph, "A", "C", ["e2"])).toBe(false);
    });

    it("returns true if alternative wire path exists", () => {
        const graph = makeGraph([
            { id: "e1", sourceId: "A", targetId: "B", connection: { type: "wire", id: 'test-connection1' } },
            { id: "e2", sourceId: "B", targetId: "C", connection: { type: "wire", id: 'test-connection2' } },
            { id: "e3", sourceId: "A", targetId: "C", connection: { type: "wire", id: 'test-connection3' } }
        ]);
        expect(hasWireOnlyPath(graph, "A", "C", ["e2"])).toBe(true);
    });

    it("handles cycles without infinite loop", () => {
        const graph = makeGraph([
            { id: "e1", sourceId: "A", targetId: "B", connection: { type: "wire", id: 'test-connection1' } },
            { id: "e2", sourceId: "B", targetId: "C", connection: { type: "wire", id: 'test-connection2' } },
            { id: "e3", sourceId: "C", targetId: "A", connection: { type: "wire", id: 'test-connection3' } }
        ]);
        expect(hasWireOnlyPath(graph, "A", "C")).toBe(true);
    });

    it("returns false if only non-wire path exists", () => {
        const graph = makeGraph([
            { id: "e1", sourceId: "A", targetId: "B", connection: { type: "wire", id: 'test-connection1' } },
            { id: "e2", sourceId: "B", targetId: "C", connection: { type: "component", id: 'test-connection2' } }
        ]);
        expect(hasWireOnlyPath(graph, "A", "C")).toBe(false);
    });

    it("returns true if source and target are the same", () => {
        const graph = makeGraph([]);
        expect(hasWireOnlyPath(graph, "A", "A")).toBe(true);
    });
});