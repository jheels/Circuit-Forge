import { describe, it, expect, vi, beforeEach } from "vitest";
import { selfLoopValidator } from "@/simulation/validation/validators/selfLoopValidator";
import { CircuitConnection, CircuitEdge, CircuitGraph } from "@/simulation/circuit/circuitDetection";
import { ValidationIssue } from "@/simulation/validation/types";

// Mock createValidationIssue to make assertions easier
vi.mock("@/simulation/validation/types", async (importOriginal) => {
    const mod = await importOriginal<ValidationIssue>();
    return {
        ...mod,
        createValidationIssue: (
            severity: string,
            message: string,
            componentIds: string[],
            nodeIds: string[],
            suggestion: string
        ) => ({
            severity,
            message,
            componentIds,
            nodeIds,
            suggestion,
        }),
    };
});

// Mock hasWireOnlyPath
const hasWireOnlyPathMock = vi.fn();
vi.mock("@/simulation/validation/utils/graphTraversal", () => ({
    hasWireOnlyPath: (...args: unknown[]) => hasWireOnlyPathMock(...args),
}));

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

// Use the actual CircuitGraph interface for type safety
const makeGraph = (edges: CircuitEdge[]): CircuitGraph => ({
    nodes: Object.fromEntries(
        edges.flatMap((e) => [
            [e.sourceId, { id: e.sourceId, type: "regular" }],
            [e.targetId, { id: e.targetId, type: "regular" }],
        ])
    ),
    edges: Object.fromEntries(edges.map((e) => [e.id, e])),
});

describe("selfLoopValidator", () => {
    beforeEach(() => {
        hasWireOnlyPathMock.mockReset();
    });

    it("detects direct self-loop on a component", () => {
        const edge = makeEdge("e1", "n1", "n1", { id: "c1", type: "component" });
        const graph = makeGraph([edge]);
        const issues = selfLoopValidator.validate(graph);

        expect(issues).toHaveLength(1);
        expect(issues[0]).toMatchObject({
            severity: "warning",
            message: "Shorted component detected",
            componentIds: ["c1"],
            nodeIds: ["n1"],
        });
    });

    it("does not detect direct self-loop on a wire", () => {
        const edge = makeEdge("e1", "n1", "n1", { id: "w1", type: "wire" });
        const graph = makeGraph([edge]);
        const issues = selfLoopValidator.validate(graph);

        expect(issues).toHaveLength(0);
    });

    it("does not detect direct self-loop if source and target are different", () => {
        const edge = makeEdge("e1", "n1", "n2", { id: "c1", type: "component" });
        const graph = makeGraph([edge]);
        const issues = selfLoopValidator.validate(graph);

        expect(issues).toHaveLength(0);
    });

    it("detects indirect loop for a component", () => {
        const edge = makeEdge("e1", "n1", "n2", { id: "c1", type: "component" });
        const graph = makeGraph([edge]);
        hasWireOnlyPathMock.mockReturnValueOnce(true);

        const issues = selfLoopValidator.validate(graph);

        expect(issues).toHaveLength(1);
        expect(issues[0]).toMatchObject({
            severity: "warning",
            message: "Indirect short circuit detected!",
            componentIds: ["c1"],
            nodeIds: ["n1", "n2"],
        });
        expect(hasWireOnlyPathMock).toHaveBeenCalledWith(graph, "n1", "n2", ["e1"]);
    });

    it("does not detect indirect loop if hasWireOnlyPath returns false", () => {
        const edge = makeEdge("e1", "n1", "n2", { id: "c1", type: "component" });
        const graph = makeGraph([edge]);
        hasWireOnlyPathMock.mockReturnValueOnce(false);

        const issues = selfLoopValidator.validate(graph);

        expect(issues).toHaveLength(0);
    });

    it("does not detect indirect loop for unified-power/ground", () => {
        const edge = makeEdge("e1", "unified-power", "unified-ground", {
            id: "c1",
            type: "component",
        });
        const graph = makeGraph([edge]);
        // Should not call hasWireOnlyPath at all
        const issues = selfLoopValidator.validate(graph);

        expect(issues).toHaveLength(0);
        expect(hasWireOnlyPathMock).not.toHaveBeenCalled();
    });

    it("does not detect indirect loop if source and target are the same", () => {
        const edge = makeEdge("e1", "n1", "n1", { id: "c1", type: "component" });
        const graph = makeGraph([edge]);
        const issues = selfLoopValidator.validate(graph);

        expect(issues).toHaveLength(1); // Only direct loop, not indirect
        expect(hasWireOnlyPathMock).not.toHaveBeenCalled();
    });

    it("handles multiple edges and accumulates issues", () => {
        const edge1 = makeEdge("e1", "n1", "n1", { id: "c1", type: "component" }); // direct
        const edge2 = makeEdge("e2", "n2", "n3", { id: "c2", type: "component" }); // indirect
        const edge3 = makeEdge("e3", "n4", "n5", { id: "w1", type: "wire" }); // ignored
        const graph = makeGraph([edge1, edge2, edge3]);
        hasWireOnlyPathMock.mockReturnValueOnce(true);

        const issues = selfLoopValidator.validate(graph);

        expect(issues).toHaveLength(2);
        expect(issues[0].message).toBe("Shorted component detected");
        expect(issues[1].message).toBe("Indirect short circuit detected!");
    });

    it("ignores edges with non-component type", () => {
        const edge = makeEdge("e1", "n1", "n2", { id: "w1", type: "wire" });
        const graph = makeGraph([edge]);
        const issues = selfLoopValidator.validate(graph);

        expect(issues).toHaveLength(0);
    });
});