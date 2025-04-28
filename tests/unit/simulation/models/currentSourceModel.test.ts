import { describe, it, expect } from "vitest";
import { createCurrentSourceModel, applyCurrentSourceStamp } from "@/simulation/models/currentSourceModel";
import { createCircuitEdge, createWireConnection } from "@/simulation/circuit/circuitDetection";
import { matrix } from "mathjs";

describe("CurrentSourceModel", () => {
    const sourceId = "n1";
    const targetId = "n2";
    const connection = createWireConnection("wire-1");
    const edge = createCircuitEdge(sourceId, targetId, connection);

    it("createCurrentSourceModel returns correct model", () => {
        const model = createCurrentSourceModel(2.5, edge);
        expect(model).toMatchObject({
            isLinear: true,
            type: "current-source",
            current: 2.5,
            edge,
        });
    });

    it("applyCurrentSourceStamp updates vector when both nodes are mapped", () => {
        const input = matrix([[0], [0]]);
        const nodeMap = { [sourceId]: 0, [targetId]: 1 };
        const model = createCurrentSourceModel(3, edge);

        applyCurrentSourceStamp(input, model, nodeMap);

        expect(input.get([0, 0])).toBe(-3);
        expect(input.get([1, 0])).toBe(3);
    });

    it("applyCurrentSourceStamp updates vector when only one node is mapped", () => {
        const input = matrix([[5]]);
        const nodeMap = { [targetId]: 0 }; // sourceId is undefined
        const model = createCurrentSourceModel(1.5, edge);

        applyCurrentSourceStamp(input, model, nodeMap);

        expect(input.get([0, 0])).toBe(6.5);
    });

    it("applyCurrentSourceStamp does nothing if neither node is mapped", () => {
        const input = matrix([[7]]);
        const nodeMap = {};
        const model = createCurrentSourceModel(4, edge);

        // Should not throw, but also not update anything
        expect(() => applyCurrentSourceStamp(input, model, nodeMap)).not.toThrow();
        expect(input.get([0, 0])).toBe(7);
    });

    it("applyCurrentSourceStamp handles negative current correctly", () => {
        const input = matrix([[2], [2]]);
        const nodeMap = { [sourceId]: 0, [targetId]: 1 };
        const model = createCurrentSourceModel(-2, edge);

        applyCurrentSourceStamp(input, model, nodeMap);

        expect(input.get([0, 0])).toBe(4);
        expect(input.get([1, 0])).toBe(0);
    });

    it("applyCurrentSourceStamp with zero current does not change vector", () => {
        const input = matrix([[10], [20]]);
        const nodeMap = { [sourceId]: 0, [targetId]: 1 };
        const model = createCurrentSourceModel(0, edge);

        applyCurrentSourceStamp(input, model, nodeMap);

        expect(input.get([0, 0])).toBe(10);
        expect(input.get([1, 0])).toBe(20);
    });

    it("applyCurrentSourceStamp with large current updates vector correctly", () => {
        const input = matrix([[100], [200]]);
        const nodeMap = { [sourceId]: 0, [targetId]: 1 };
        const model = createCurrentSourceModel(1e6, edge);

        applyCurrentSourceStamp(input, model, nodeMap);

        expect(input.get([0, 0])).toBe(100 - 1e6);
        expect(input.get([1, 0])).toBe(200 + 1e6);
    });

    it("applyCurrentSourceStamp when only source node is mapped", () => {
        const input = matrix([[3]]);
        const nodeMap = { [sourceId]: 0 }; // targetId is undefined
        const model = createCurrentSourceModel(2, edge);

        applyCurrentSourceStamp(input, model, nodeMap);

        expect(input.get([0, 0])).toBe(5);
    });
});