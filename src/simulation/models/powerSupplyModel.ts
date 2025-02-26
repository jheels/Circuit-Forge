import { PowerSupplyComponent } from "@/types/components/powerSupply";
import { CircuitEdge } from "../analysis/circuitDetection";
import { Matrix } from 'mathjs';

interface PowerSupplyModel {
    type: 'powerSupply';
    voltage: number;
    edge: CircuitEdge
}

export const createPowerSupplyModel = (component: PowerSupplyComponent, edge: CircuitEdge): PowerSupplyModel => {
    const voltage = component.properties.voltage as number;

    return {
        type: 'powerSupply',
        voltage,
        edge
    }
}

export const applyPowerSupplyStamp = (
    conductanceMatrix: Matrix,
    inputSourcesMatrix: Matrix,
    model: PowerSupplyModel,
    nodeMap: Record<string, number>
): void => {
    const { voltage, edge } = model;
    const { sourceId } = edge;
    // This is because of the circuit initialisation
    const powerNode = nodeMap[sourceId];

    // Add the voltage source to the conductance matrix with +1 at the col i and +1 at the row i
    conductanceMatrix.set([powerNode, conductanceMatrix.size()[1]-1], 1);
    conductanceMatrix.set([conductanceMatrix.size()[1]-1, powerNode], 1);

    // Add the voltage source to the input sources matrix with the voltage value at the end
    inputSourcesMatrix.set([inputSourcesMatrix.size()[0]-1, 0], voltage);
}