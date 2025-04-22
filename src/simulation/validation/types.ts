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