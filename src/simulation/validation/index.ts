import { CircuitGraph } from "../circuit/circuitDetection";
import { CircuitValidator, ValidationIssue, ValidationResult } from "./types";
import { selfLoopValidator } from "./validators/selfLoopValidator";
import { wirePathValidator } from "./validators/wirePathValidator";

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