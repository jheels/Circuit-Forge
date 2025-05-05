import { PowerSupplyComponent } from "@/definitions/components/powerSupply";
import { CircuitEdge } from "../circuit/circuitDetection";
import { Matrix } from 'mathjs';
import { ComponentModel } from "./componentModelFactory";

export interface IndependentVoltageSource extends ComponentModel {
    type: 'independent-voltage-source';
    voltage: number;
}

export const createIndependentVoltageSourceModel = (component: PowerSupplyComponent, edge: CircuitEdge): IndependentVoltageSource => {
    const voltage = component.properties.voltage as number;

    return {
        isLinear: true,
        type: 'independent-voltage-source',
        voltage,
        edge
    }
}

export const applyVoltageSourceStamp = (
    conductanceMatrix: Matrix,
    inputSourcesVector: Matrix,
    voltage: number,
    nodeIndex: number
): void => {
    const newSize = conductanceMatrix.size()[0] + 1;
    conductanceMatrix.resize([newSize, newSize]);
    inputSourcesVector.resize([newSize, 1]);
    conductanceMatrix.set([nodeIndex, conductanceMatrix.size()[1]-1], 1);
    conductanceMatrix.set([conductanceMatrix.size()[1]-1, nodeIndex], 1);
    inputSourcesVector.set([inputSourcesVector.size()[0]-1, 0], voltage);
}


/**
 * Applies the stamp of an independent voltage source to the conductance matrix
 * and input sources vector in a circuit simulation.
 *
 * @param conductanceMatrix - The matrix representing the conductance of the circuit.
 * @param inputSourcesVector - The vector representing the input sources in the circuit.
 * @param model - The independent voltage source model containing the voltage value and associated edge.
 * @param nodeMap - A mapping of node identifiers to their corresponding indices in the matrix.
 *
 * @remarks
 * This function modifies the provided `conductanceMatrix` and `inputSourcesVector` in place
 * by applying the voltage source stamp based on the given model and node mapping.
 */
export const applyIndependentVoltageSourceStamp = (
    conductanceMatrix: Matrix,
    inputSourcesVector: Matrix,
    model: IndependentVoltageSource,
    nodeMap: Record<string, number>
): void => {
    const { voltage, edge } = model;
    const { sourceId } = edge;
    const sourceIndex = nodeMap[sourceId];

    applyVoltageSourceStamp(conductanceMatrix, inputSourcesVector, voltage, sourceIndex);
}