import { CircuitGraph } from "@/simulation/circuit/circuitDetection";
import { CircuitValidator, createValidationIssue, ValidationIssue } from "../types";
import { hasWireOnlyPath } from "../utils/graphTraversal";


export const wirePathValidator: CircuitValidator = {
    validate: (graph: CircuitGraph): ValidationIssue[] => {
        const issues: ValidationIssue[] = [];
        issues.push(...validateWirePaths(graph));

        return issues;
    }
}

const validateWirePaths = (graph: CircuitGraph): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    

    if (hasWireOnlyPath(graph, 'unified-power', 'unified-ground')) {
        issues.push(
            createValidationIssue(
                'error',
                '+V → GND short circuit detected!',
                [],
                ['unified-power', 'unified-ground'],
                'Remove the loop of wires to prevent a short circuit.'
            )
        );
    }

    return issues;
}