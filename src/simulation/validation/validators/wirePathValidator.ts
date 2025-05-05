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

/**
 * Validates the wire paths in a given circuit graph to ensure there are no
 * short circuits between unified power and ground.
 *
 * @param graph - The circuit graph to validate.
 * @returns An array of validation issues found in the circuit graph. If a 
 *          short circuit is detected between 'unified-power' and 
 *          'unified-ground', an error issue is included in the result.
 */
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