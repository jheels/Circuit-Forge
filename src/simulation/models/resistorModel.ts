import { ResistorComponent } from "@/definitions/components/resistor";
import { CircuitEdge } from "../circuit/circuitDetection";
import { Matrix } from 'mathjs';
import { ComponentModel } from "./componentModelFactory";

export interface ResistorModel extends ComponentModel {
    type: 'resistor';
    conductance: number;
}

/**
 * Converts a resistance value to its equivalent in base units (ohms).
 *
 * @param value - The numerical value of the resistance.
 * @param unit - The unit of the resistance value. Supported units are:
 *   - 'kΩ' for kilo-ohms (multiplies the value by 1,000).
 *   - 'MΩ' for mega-ohms (multiplies the value by 1,000,000).
 *   - Any other unit will be treated as ohms (no conversion applied).
 * @returns The resistance value converted to ohms.
 */
const convertToBaseUnits = (value: number, unit: string): number => {
    switch (unit) {
        case 'kΩ':
            return value * 1e3;
        case 'MΩ':
            return value * 1e6;
        default:
            return value;
    }
}

export const createResistorModel = (component: ResistorComponent, edge: CircuitEdge): ResistorModel => {
    const value = component.properties.value as number;
    const unit = component.properties.unit as string;

    const resistance = convertToBaseUnits(value, unit);
    const conductance = 1 / resistance;

    return {
        isLinear: true,
        type: 'resistor',
        conductance,
        edge
    }
}

/**
 * Applies the resistor stamp to the conductance matrix for circuit simulation.
 *
 * This function modifies the conductance matrix to account for the presence
 * of a resistor in the circuit. It uses the resistor's conductance value and
 * updates the matrix based on the nodes connected by the resistor.
 *
 * @param conductanceMatrix - The matrix representing the conductance of the circuit.
 * @param model - The resistor model containing the conductance value and the edge
 *                (connection between two nodes) information.
 * @param nodeMap - A mapping of node IDs to their corresponding indices in the conductance matrix.
 *
 * @remarks
 * If one of the nodes connected by the resistor is a ground node (undefined in the node map),
 * the function only updates the conductance matrix for the non-ground node.
 *
 * The conductance matrix is updated as follows:
 * - The diagonal elements corresponding to the source and target nodes are incremented
 *   by the conductance value.
 * - The off-diagonal elements corresponding to the source-target and target-source pairs
 *   are decremented by the conductance value.
 */
export const applyResistorStamp = (
    conductanceMatrix: Matrix,
    model: ResistorModel,
    nodeMap: Record<string, number>
): void => {
    const { conductance, edge } = model;
    const { sourceId, targetId } = edge;

    const sourceIndex = nodeMap[sourceId];
    const targetIndex = nodeMap[targetId];

    // check if one of them is a groundNode
    if (sourceIndex === undefined || targetIndex === undefined) {
        const nonGroundNode = sourceIndex === undefined ? targetIndex : sourceIndex;
        conductanceMatrix.set([nonGroundNode, nonGroundNode], conductanceMatrix.get([nonGroundNode, nonGroundNode]) + conductance);
        return;
    }

    conductanceMatrix.set([sourceIndex, sourceIndex], conductanceMatrix.get([sourceIndex, sourceIndex]) + conductance);
    conductanceMatrix.set([targetIndex, targetIndex], conductanceMatrix.get([targetIndex, targetIndex]) + conductance);
    conductanceMatrix.set([sourceIndex, targetIndex], conductanceMatrix.get([sourceIndex, targetIndex]) - conductance);
    conductanceMatrix.set([targetIndex, sourceIndex], conductanceMatrix.get([targetIndex, sourceIndex]) - conductance);
}