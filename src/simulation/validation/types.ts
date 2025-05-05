import { CircuitGraph } from "../circuit/circuitDetection";
import { v4 as uuidv4 } from 'uuid';

export type Severity = 'error' | 'warning';

export interface ValidationIssue {
    id: string;
    severity: Severity;
    message: string;
    componentIDs?: string[];
    affectedNodes: string[];
    suggestedFix?: string;
}

export interface ValidationResult {
    issues: ValidationIssue[];
    hasErrors: boolean;
    hasWarnings: boolean;
}

export interface CircuitValidator {
    validate(graph: CircuitGraph): ValidationIssue[];
}

/**
 * Creates a new validation issue object.
 *
 * @param severity - The severity level of the validation issue.
 * @param message - A descriptive message explaining the validation issue.
 * @param componentIDs - An optional array of component IDs related to the issue. Defaults to an empty array.
 * @param affectedNodes - An optional array of affected node IDs related to the issue. Defaults to an empty array.
 * @param suggestedFix - An optional string suggesting a fix for the validation issue.
 * @returns A `ValidationIssue` object containing the details of the validation issue.
 */
export const createValidationIssue = (
    severity: Severity,
    message: string,
    componentIDs: string[] = [],
    affectedNodes: string[] = [],
    suggestedFix?: string
): ValidationIssue => {
    return {
        id: uuidv4(),
        severity,
        message,
        componentIDs,
        affectedNodes,
        suggestedFix
    }
}