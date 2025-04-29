import { describe, it, expect, vi, beforeEach } from "vitest";
import {

    hasConverged,
    checkConvergence,
    updateNonLinearModels,
    performIteration,
    performDCAnalysis,
    AnalysisState,
    AnalysisResult,
} from "@/simulation/core/DCAnalyser";

// Mocks for dependencies
vi.mock("@/simulation/core/MNASystem", () => ({
    solveCircuit: vi.fn(() => ({ n1: 5, n2: 0 })),
}));
vi.mock("@/simulation/models/componentModelFactory", () => ({
    createComponentModel: vi.fn(() => ({
        type: "resistor",
        isLinear: true,
        edge: { id: "e1", sourceId: "n1", targetId: "n2", connection: { type: "component", id: "r1" } },
    })),
}));
vi.mock("@/simulation/models/wireModel", () => ({
    createWireModel: vi.fn(() => ({
        type: "wire",
        isLinear: true,
        edge: { id: "w1", sourceId: "n1", targetId: "n2", connection: { type: "wire", id: "w1" } },
    })),
}));
vi.mock("@/simulation/models/LEDModel", () => ({
    updateLEDModel: vi.fn((model, voltage) => ({
        ...model,
        lastVoltage: voltage,
    })),
}));
vi.mock("@/simulation/models/logicGateModel", () => ({
    createLogicGateModel: vi.fn(() => ({
        type: "logic-gate",
        isLinear: false,
        edge: { id: "g1", sourceId: "n1", targetId: "n2", connection: { type: "component", id: "ic1", metadata: {} } },
        lastOutputVoltage: 0,
        lastInputVoltages: [0],
    })),
    updateLogicGateModel: vi.fn((model, voltages) => ({
        ...model,
        lastOutputVoltage: (voltages["n1"] ?? 0) > 2.5 ? 5 : 0,
    })),
}));

describe("DCAnalyser", () => {
    describe("hasConverged", () => {
        it("returns true if voltages are within threshold", () => {
            expect(hasConverged(1.0001, 1.00009)).toBe(true);
        });
        it("returns false if voltages are outside threshold", () => {
            expect(hasConverged(1, 1.1)).toBe(false);
        });
    });

    describe("checkConvergence", () => {
        it("returns true if all nodes have converged", () => {
            expect(checkConvergence({ n1: 1, n2: 2 }, { n1: 1.00001, n2: 2.00001 })).toBe(true);
        });
        it("returns false if any node has not converged", () => {
            expect(checkConvergence({ n1: 1, n2: 2 }, { n1: 1.1, n2: 2 })).toBe(false);
        });
    });

    describe("updateNonLinearModels", () => {
        it("updates LED and logic-gate models and checks convergence", () => {
            const state: AnalysisState = {
                models: {
                    led1: { type: "led", isLinear: false, edge: { id: "led1", sourceId: "n1", targetId: "n2", connection: { type: "component", id: "led1" } }, lastVoltage: 0 },
                    gate1: { type: "logic-gate", isLinear: false, edge: { id: "g1", sourceId: "n1", targetId: "n2", connection: { type: "component", id: "ic1", metadata: {} } }, lastOutputVoltage: 0, lastInputVoltages: [0] }
                },
                nonLinearModels: {
                    led1: { type: "led", isLinear: false, edge: { id: "led1", sourceId: "n1", targetId: "n2", connection: { type: "component", id: "led1" } }, lastVoltage: 0 },
                    gate1: { type: "logic-gate", isLinear: false, edge: { id: "g1", sourceId: "n1", targetId: "n2", connection: { type: "component", id: "ic1", metadata: {} } }, lastOutputVoltage: 0, lastInputVoltages: [0] }
                },
                voltages: { n1: 5, n2: 0 },
                iteration: 0,
                converged: false,
            };
            const circuitGraph = {
                edges: {
                    led1: { id: "led1", sourceId: "n1", targetId: "n2", connection: { type: "component", id: "led1" } },
                    g1: { id: "g1", sourceId: "n1", targetId: "n2", connection: { type: "component", id: "ic1", metadata: {} } }
                }
            };
            const { updatedState, allModelsConverged } = updateNonLinearModels(state, circuitGraph as any);
            expect(updatedState.models.led1.lastVoltage).toBe(5);
            expect(updatedState.models.gate1.lastOutputVoltage).toBe(5);
            expect(typeof allModelsConverged).toBe("boolean");
        });
    });

    describe("performIteration", () => {
        it("returns updated state with incremented iteration", () => {
            const state: AnalysisState = {
                models: {},
                nonLinearModels: {},
                voltages: { n1: 1, n2: 0 },
                iteration: 0,
                converged: false,
            };
            const circuitGraph = { edges: {} };
            const result = performIteration(state, circuitGraph as any);
            expect(result.iteration).toBe(1);
            expect(result.voltages.n1).toBe(5);
            expect(result.voltages.n2).toBe(0);
        });
        it("handles errors gracefully", () => {
            const state: AnalysisState = {
                models: {},
                nonLinearModels: {},
                voltages: { n1: 1, n2: 0 },
                iteration: 0,
                converged: false,
            };
            const circuitGraph = null as any;
            const result = performIteration(state, circuitGraph);
            expect(result.converged).toBe(false);
        });
    });

    describe("performDCAnalysis", () => {
        let circuitGraph: any;
        let components: any;
        beforeEach(() => {
            circuitGraph = {
                edges: {
                    e1: { id: "e1", sourceId: "n1", targetId: "n2", connection: { type: "component", id: "r1" } },
                    w1: { id: "w1", sourceId: "n1", targetId: "n2", connection: { type: "wire", id: "w1" } }
                }
            };
            components = {
                r1: { id: "r1", type: "resistor" }
            };
        });

        it("returns success for linear circuit", () => {
            const result = performDCAnalysis(circuitGraph, components);
            expect(result.success).toBe(true);
            expect(result.voltages.n1).toBe(5);
            expect(result.voltages.n2).toBe(0);
            expect(result.iterations).toBe(1);
        });

        it("returns failure and error on thrown error", () => {
            const badGraph = null as any;
            const result = performDCAnalysis(badGraph, components);
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/Analysis error/);
        });

        it("uses previousAnalysis for warm start", () => {
            const previous: AnalysisResult = {
                success: true,
                voltages: { n1: 2, n2: 0 },
                models: {},
                iterations: 1,
            };
            const result = performDCAnalysis(circuitGraph, components, previous);
            expect(result.success).toBe(true);
            expect(result.voltages.n1).toBe(2);
        });
    });
});