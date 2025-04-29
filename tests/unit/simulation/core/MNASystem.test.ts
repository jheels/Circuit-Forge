import { describe, it, expect, vi, beforeEach } from "vitest";
import { solveCircuit } from "@/simulation/core/MNASystem";
import { Matrix } from "mathjs";
import type { CircuitGraph, CircuitNode } from "@/simulation/circuit/circuitDetection";
import type { ComponentModel } from "@/simulation/models/componentModelFactory";

// Mock applyComponentStamp for controlled matrix setup
vi.mock("@/simulation/models/componentModelFactory", async () => {
    return {
        applyComponentStamp: vi.fn()
    };
});

const { applyComponentStamp } = await import("@/simulation/models/componentModelFactory");

describe("solveCircuit", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns correct voltages for a single node with a voltage source", () => {
        // Graph: n1 and ground
        const graph: CircuitGraph = {
            nodes: {
                "n1": { id: "n1" } as CircuitNode,
                "unified-ground": { id: "unified-ground" } as CircuitNode
            },
            edges: {}
        };

        // Model: voltage source between n1 and ground, 10V
        const models: Record<string, ComponentModel> = {
            "V1": {
                type: "voltageSource",
                nodes: ["n1", "unified-ground"],
                value: 10
            } as unknown as ComponentModel
        };

        // Patch applyComponentStamp to set up a trivial system
        (applyComponentStamp as unknown as ReturnType<typeof vi.fn>).mockImplementation(
            (model: ComponentModel, G: Matrix, nodeMap: Record<string, number>, I: Matrix) => {
                G.set([0, 0], 1);
                I.set([0, 0], 10);
            }
        );

        const result = solveCircuit(graph, models);
        expect(result["n1"]).toBeCloseTo(10);
        expect(result["unified-ground"]).toBe(0);
        expect(typeof result["unified_power_current"]).toBe("number");
    });

    it("maps multiple node IDs correctly", () => {
        const graph: CircuitGraph = {
            nodes: {
                "n1": { id: "n1" } as CircuitNode,
                "n2": { id: "n2" } as CircuitNode,
                "unified-ground": { id: "unified-ground" } as CircuitNode
            },
            edges: {}
        };
        const models: Record<string, ComponentModel> = {};

        // Patch applyComponentStamp to do nothing
        (applyComponentStamp as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {});

        const result = solveCircuit(graph, models);
        expect(result).toHaveProperty("n1");
        expect(result).toHaveProperty("n2");
        expect(result).toHaveProperty("unified-ground");
        expect(result).toHaveProperty("unified_power_current");
    });

    it("handles multiple components by calling applyComponentStamp for each", () => {
        const graph: CircuitGraph = {
            nodes: {
                "n1": { id: "n1" } as CircuitNode,
                "n2": { id: "n2" } as CircuitNode,
                "unified-ground": { id: "unified-ground" } as CircuitNode
            },
            edges: {}
        };
        const models: Record<string, ComponentModel> = {
            "R1": { type: "resistor", nodes: ["n1", "n2"], value: 100 } as unknown as ComponentModel,
            "V1": { type: "voltageSource", nodes: ["n1", "unified-ground"], value: 5 } as unknown as ComponentModel
        };

        (applyComponentStamp as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {});

        solveCircuit(graph, models);
        expect(applyComponentStamp).toHaveBeenCalledTimes(2);
        expect(applyComponentStamp).toHaveBeenCalledWith(
            expect.objectContaining({ type: "resistor" }),
            expect.anything(),
            expect.anything(),
            expect.anything()
        );
        expect(applyComponentStamp).toHaveBeenCalledWith(
            expect.objectContaining({ type: "voltageSource" }),
            expect.anything(),
            expect.anything(),
            expect.anything()
        );
    });

    it("returns correct voltages for a two-node system with custom matrix", () => {
        const graph: CircuitGraph = {
            nodes: {
                "n1": { id: "n1" } as CircuitNode,
                "n2": { id: "n2" } as CircuitNode,
                "unified-ground": { id: "unified-ground" } as CircuitNode
            },
            edges: {}
        };
        const models: Record<string, ComponentModel> = {
            "V1": { type: "voltageSource", nodes: ["n1", "unified-ground"], value: 3 } as unknown as ComponentModel,
            "R1": { type: "resistor", nodes: ["n1", "n2"], value: 1 } as unknown as ComponentModel
        };

        // Set up a 2x2 system: n1 = 3, n2 = 0
        (applyComponentStamp as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
            (model: ComponentModel, G: Matrix, nodeMap: Record<string, number>, I: Matrix) => {
                G.set([0, 0], 1);
                I.set([0, 0], 3);
            }
        ).mockImplementationOnce(
            (model: ComponentModel, G: Matrix, nodeMap: Record<string, number>, I: Matrix) => {
                G.set([1, 1], 1);
                I.set([1, 0], 0);
            }
        );

        const result = solveCircuit(graph, models);
        expect(result["n1"]).toBeCloseTo(3);
        expect(result["n2"]).toBeCloseTo(0);
        expect(result["unified-ground"]).toBe(0);
        expect(typeof result["unified_power_current"]).toBe("number");
    });
});