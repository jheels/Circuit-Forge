import { ResistorComponent } from "@/types/components/resistor";
import { CircuitEdge } from "../analysis/circuitDetection";
import { Matrix } from 'mathjs';
import { ComponentModel } from "./componentModelFactory";

export interface ResistorModel extends ComponentModel {
    type: 'resistor';
    conductance: number;
    edge: CircuitEdge
}

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
        type: 'resistor',
        conductance,
        edge
    }
}

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