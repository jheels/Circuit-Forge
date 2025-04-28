import { describe, it, expect, vi, beforeEach } from "vitest";
import { wirePathValidator } from "@/simulation/validation/validators/wirePathValidator";
import { CircuitGraph, CircuitEdge, CircuitConnection } from "@/simulation/circuit/circuitDetection";
import { ValidationIssue } from "@/simulation/validation/types";

vi.mock("@/simulation/validation/types", async (importOriginal) => {
    const mod = await importOriginal<ValidationIssue>();
    return {
        ...mod,
        createValidationIssue: (
            severity: string,
            message: string,
            componentIds: string[],
            nodeIds: string[],
            suggestedFix: string
        ) => ({
            severity,
            message,
            componentIds,
            nodeIds,
            suggestedFix,
        }),
    };
});

// Mock hasWireOnlyPath
const hasWireOnlyPathMock = vi.fn();
vi.mock("@/simulation/validation/utils/graphTraversal", () => ({
    hasWireOnlyPath: (...args: unknown[]) => hasWireOnlyPathMock(...args),
}));

// Helper to create edges
const makeEdge = (
    id: string,
    sourceId: string,
    targetId: string,
    connection: CircuitConnection
): CircuitEdge => ({
    id,
    sourceId,
    targetId,
    connection,
});

// Helper to create a graph
const makeGraph = (edges: CircuitEdge[]): CircuitGraph => ({
    nodes: Object.fromEntries(
        edges.flatMap((e) => [
            [e.sourceId, { id: e.sourceId, type: "regular" }],
            [e.targetId, { id: e.targetId, type: "regular" }],
        ])
    ),
    edges: Object.fromEntries(edges.map((e) => [e.id, e])),
});

describe("wirePathValidator", () => {
    beforeEach(() => {
        hasWireOnlyPathMock.mockReset();
    });

    it("detects a +V → GND short circuit when hasWireOnlyPath returns true", () => {
        const graph = makeGraph([]);
        hasWireOnlyPathMock.mockReturnValueOnce(true);

        const issues = wirePathValidator.validate(graph);

        expect(issues).toHaveLength(1);
        expect(issues[0]).toMatchObject({
            severity: "error",
            message: "+V → GND short circuit detected!",
            nodeIds: ["unified-power", "unified-ground"],
        });
        expect(hasWireOnlyPathMock).toHaveBeenCalledWith(graph, "unified-power", "unified-ground");
    });

    it("does not report an issue when hasWireOnlyPath returns false", () => {
        const graph = makeGraph([]);
        hasWireOnlyPathMock.mockReturnValueOnce(false);

        const issues = wirePathValidator.validate(graph);

        expect(issues).toHaveLength(0);
        expect(hasWireOnlyPathMock).toHaveBeenCalledWith(graph, "unified-power", "unified-ground");
    });

    it("works with a non-empty graph (edges present)", () => {
        const edge1 = makeEdge("e1", "unified-power", "n1", { id: "w1", type: "wire" });
        const edge2 = makeEdge("e2", "n1", "unified-ground", { id: "w2", type: "wire" });
        const graph = makeGraph([edge1, edge2]);
        hasWireOnlyPathMock.mockReturnValueOnce(true);

        const issues = wirePathValidator.validate(graph);

        expect(issues).toHaveLength(1);
        expect(issues[0].message).toBe("+V → GND short circuit detected!");
    });

    it("does not report unrelated issues (no +V/GND path)", () => {
        const edge = makeEdge("e1", "n1", "n2", { id: "w1", type: "wire" });
        const graph = makeGraph([edge]);
        hasWireOnlyPathMock.mockReturnValueOnce(false);

        const issues = wirePathValidator.validate(graph);

        expect(issues).toHaveLength(0);
    });

    it("suggestion message is correct", () => {
        const graph = makeGraph([]);
        hasWireOnlyPathMock.mockReturnValueOnce(true);

        const issues = wirePathValidator.validate(graph);
        expect(issues[0].suggestedFix).toBe("Remove the loop of wires to prevent a short circuit.");
    });
});