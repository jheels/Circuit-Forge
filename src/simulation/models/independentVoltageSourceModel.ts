import { PowerSupplyComponent } from "@/types/components/powerSupply";
import { CircuitEdge } from "../analysis/circuitDetection";
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


export const applyIndependentVoltageSourceStamp = (
    conductanceMatrix: Matrix,
    inputSourcesVector: Matrix,
    model: IndependentVoltageSource,
    nodeMap: Record<string, number>
): void => {
    const { voltage, edge } = model;
    const { sourceId } = edge;
    // Generalise for any source node
    const sourceIndex = nodeMap[sourceId];

    applyVoltageSourceStamp(conductanceMatrix, inputSourcesVector, voltage, sourceIndex);
}