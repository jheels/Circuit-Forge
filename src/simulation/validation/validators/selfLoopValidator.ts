import { CircuitGraph } from "@/simulation/analysis/circuitDetection";
import { CircuitValidator, createValidationIssue, ValidationIssue } from "../types";
import { hasWireOnlyPath } from "../utils/graphTraversal";


export const selfLoopValidator: CircuitValidator = {
    validate: (graph: CircuitGraph): ValidationIssue[] => {
        const issues: ValidationIssue[] = [];
        issues.push(...validateDirectLoops(graph));
        issues.push(...validateIndirectLoops(graph));

        return issues;
    }
}

const validateDirectLoops = (graph: CircuitGraph): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    Object.values(graph.edges).forEach((edge) => {
        if (edge.connections[0].type !== 'component') return;

        if (edge.sourceId === edge.targetId) {
            issues.push(
                createValidationIssue(
                    'warning',
                    'Shorted component detected',
                    [edge.connections[0].id],
                    [edge.sourceId],
                    'Connect the component to different strips to create a PD.'
                )
            )
        }
    })

    return issues;  
}

const validateIndirectLoops = (graph: CircuitGraph): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    Object.values(graph.edges).forEach((edge) => {
        if (edge.connections[0].type !== 'component') return;

        if (['unified-power', 'unified-ground'].includes(edge.sourceId) && ['unified-power', 'unified-ground'].includes(edge.targetId)) return;
        if (edge.sourceId === edge.targetId) return;
        
        if (hasWireOnlyPath(graph, edge.sourceId, edge.targetId, [edge.id])) {
            issues.push(
                createValidationIssue(
                    'warning',
                    'Indirect short circuit detected!',
                    [edge.connections[0].id],
                    [edge.sourceId, edge.targetId],
                    'Remove the loop of wires to prevent a short circuit.'
                )
            )
        }
    });

    return issues;
}