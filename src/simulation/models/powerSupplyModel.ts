import { PowerSupplyComponent } from "@/types/components/powerSupply";
import { CircuitEdge } from "../analysis/circuitDetection";
import { Matrix } from 'mathjs';
import { ComponentModel } from "./componentModelFactory";

export interface PowerSupplyModel extends ComponentModel {
    type: 'power-supply';
    voltage: number;
    edge: CircuitEdge
}

export const createPowerSupplyModel = (component: PowerSupplyComponent, edge: CircuitEdge): PowerSupplyModel => {
    const voltage = component.properties.voltage as number;

    return {
        type: 'power-supply',
        voltage,
        edge
    }
}

export const applyPowerSupplyStamp = (
    conductanceMatrix: Matrix,
    inputSourcesVector: Matrix,
    model: PowerSupplyModel,
    nodeMap: Record<string, number>
): void => {
    const { voltage, edge } = model;
    const { sourceId } = edge;

    // This is because of the circuit initialisation
    const powerNode = nodeMap[sourceId];
    const newSize = conductanceMatrix.size()[0] + 1;
    
    conductanceMatrix.resize([newSize, newSize]);
    inputSourcesVector.resize([newSize, 1]);

    // Add the voltage source to the conductance matrix with +1 at the col i and +1 at the row i
    conductanceMatrix.set([powerNode, conductanceMatrix.size()[1]-1], 1);
    conductanceMatrix.set([conductanceMatrix.size()[1]-1, powerNode], 1);

    // Add the voltage source to the input sources matrix with the voltage value at the end
    inputSourcesVector.set([inputSourcesVector.size()[0]-1, 0], voltage);
}