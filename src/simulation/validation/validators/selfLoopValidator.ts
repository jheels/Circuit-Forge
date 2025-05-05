import { CircuitGraph } from "@/simulation/circuit/circuitDetection";
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

/**
 * Validates a circuit graph for direct loops (self-loops) where a component is connected
 * to the same strip on both ends. This situation can cause a short circuit and is flagged
 * as a warning.
 *
 * @param graph - The circuit graph to validate, containing nodes and edges representing
 *                the circuit's structure.
 * @returns An array of `ValidationIssue` objects representing detected self-loops.
 *          Each issue includes details about the problematic component and suggestions
 *          for resolution.
 */
const validateDirectLoops = (graph: CircuitGraph): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    Object.values(graph.edges).forEach((edge) => {
        if (edge.connection.type !== 'component') return;

        if (edge.sourceId === edge.targetId) {
            issues.push(
                createValidationIssue(
                    'warning',
                    'Shorted component detected',
                    [edge.connection.id],
                    [edge.sourceId],
                    'Connect the component to different strips to create a PD.'
                )
            )
        }
    })

    return issues;  
}

/**
 * Validates a circuit graph for indirect loops that could cause short circuits.
 * An indirect loop is detected when there exists a path consisting only of wires
 * between the source and target of an edge, excluding the edge itself.
 *
 * @param graph - The circuit graph to validate.
 * @returns An array of validation issues, each representing an indirect short circuit detected.
 *
 * @remarks
 * - Edges with a connection type other than 'component' are ignored.
 * - Edges connecting 'unified-power' to 'unified-ground' or vice versa are ignored.
 * - Self-loops (edges where the source and target are the same) are ignored.
 * - If an indirect loop is detected, a warning issue is created with a message
 *   suggesting the removal of the loop of wires to prevent a short circuit.
 */
const validateIndirectLoops = (graph: CircuitGraph): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    Object.values(graph.edges).forEach((edge) => {
        if (edge.connection.type !== 'component') return;

        if (['unified-power', 'unified-ground'].includes(edge.sourceId) && ['unified-power', 'unified-ground'].includes(edge.targetId)) return;
        if (edge.sourceId === edge.targetId) return;
        
        if (hasWireOnlyPath(graph, edge.sourceId, edge.targetId, [edge.id])) {
            issues.push(
                createValidationIssue(
                    'warning',
                    'Indirect short circuit detected!',
                    [edge.connection.id],
                    [edge.sourceId, edge.targetId],
                    'Remove the loop of wires to prevent a short circuit.'
                )
            )
        }
    });

    return issues;
}