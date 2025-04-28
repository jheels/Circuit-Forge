import { it, expect, vi } from "vitest";
import { validateCircuit } from "@/simulation/validation/index";
import { CircuitGraph } from "@/simulation/circuit/circuitDetection";
import { selfLoopValidator } from "@/simulation/validation/validators/selfLoopValidator";
import { ValidationIssue } from "@/simulation/validation/types";
import { wirePathValidator } from "@/simulation/validation/validators/wirePathValidator";
// Mock the validators
vi.mock("@/simulation/validation/validators/selfLoopValidator", () => ({
    selfLoopValidator: {
        validate: vi.fn()
    }
}));
vi.mock("@/simulation/validation/validators/wirePathValidator", () => ({
    wirePathValidator: {
        validate: vi.fn()
    }
}));

it("calls each validator exactly once with the graph", () => {
    (selfLoopValidator.validate as any).mockReturnValue([]);
    (wirePathValidator.validate as any).mockReturnValue([]);

    const graph = { foo: "bar" } as unknown as CircuitGraph;
    validateCircuit(graph);

    expect(selfLoopValidator.validate).toHaveBeenCalledTimes(1);
    expect(wirePathValidator.validate).toHaveBeenCalledTimes(1);
    expect(selfLoopValidator.validate).toHaveBeenCalledWith(graph);
    expect(wirePathValidator.validate).toHaveBeenCalledWith(graph);
});

it("handles validators returning multiple issues of different severities", () => {
    const errorIssue: ValidationIssue = {
        message: "Critical error",
        severity: "error"
    } as ValidationIssue;
    const warningIssue: ValidationIssue = {
        message: "Minor warning",
        severity: "warning"
    } as ValidationIssue;

    (selfLoopValidator.validate as any).mockReturnValue([errorIssue]);
    (wirePathValidator.validate as any).mockReturnValue([warningIssue]);

    const result = validateCircuit({} as CircuitGraph);

    expect(result.issues).toEqual([errorIssue, warningIssue]);
    expect(result.hasErrors).toBe(true);
    expect(result.hasWarnings).toBe(true);
});

it("returns empty issues if all validators return empty lists", () => {
    (selfLoopValidator.validate as any).mockReturnValue([]);
    (wirePathValidator.validate as any).mockReturnValue([]);

    const result = validateCircuit({} as CircuitGraph);

    expect(result.issues).toEqual([]);
    expect(result.hasErrors).toBe(false);
    expect(result.hasWarnings).toBe(false);
});
