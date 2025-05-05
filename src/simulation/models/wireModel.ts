import { Matrix } from "mathjs";
import { CircuitEdge } from "../circuit/circuitDetection";
import { applyResistorStamp, ResistorModel } from "./resistorModel";

type WireModel = ResistorModel;

// Since it is assumed to have resistance, we can use a very low value
const WIRE_RESISTANCE = 1; 

export const createWireModel = (edge: CircuitEdge): WireModel => {
    return {
        isLinear: true,
        type: 'resistor',
        conductance: 1 / WIRE_RESISTANCE,
        edge
    }
}

/**
 * Applies a wire stamp to the conductance matrix by delegating to the resistor stamp function.
 *
 * @param conductanceMatrix - The matrix representing the conductance of the circuit.
 * @param model - The wire model containing the properties of the wire to be stamped.
 * @param nodeMap - A mapping of node identifiers to their corresponding indices in the matrix.
 * @returns void
 * @see {@link applyResistorStamp}
 */
export const applyWireStamp = (
    conductanceMatrix: Matrix,
    model: WireModel,
    nodeMap: Record<string, number>
): void => {
    applyResistorStamp(conductanceMatrix, model, nodeMap);
}