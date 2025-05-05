import { CircuitGraph } from "../circuit/circuitDetection";
import { CircuitValidator, ValidationIssue, ValidationResult } from "./types";
import { selfLoopValidator } from "./validators/selfLoopValidator";
import { wirePathValidator } from "./validators/wirePathValidator";

/**
 * Validates a circuit graph by running a series of validators and collecting any issues found.
 *
 * @param graph - The circuit graph to validate.
 * @returns An object containing the validation results:
 * - `issues`: An array of validation issues found in the circuit graph.
 * - `hasErrors`: A boolean indicating if any issues with severity 'error' were found.
 * - `hasWarnings`: A boolean indicating if any issues with severity 'warning' were found.
 */
export const validateCircuit = (graph: CircuitGraph): ValidationResult => {
    const issues: ValidationIssue[] = [];
    let hasErrors = false;
    let hasWarnings = false;

    const validators: CircuitValidator[] = [selfLoopValidator, wirePathValidator];

    validators.forEach((validator) => {
        const validatorIssues = validator.validate(graph);
        issues.push(...validatorIssues);
        hasErrors = hasErrors || validatorIssues.some(issue => issue.severity === 'error');
        hasWarnings = hasWarnings || validatorIssues.some(issue => issue.severity === 'warning');
    });
    
    return {
        issues,
        hasErrors,
        hasWarnings
    }
}