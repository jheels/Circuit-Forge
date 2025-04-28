import { Matrix } from "mathjs";
import { CircuitEdge, isICComponentConnection } from "../circuit/circuitDetection";
import { ComponentModel } from "./componentModelFactory";
import { applyVoltageSourceStamp } from "./independentVoltageSourceModel";

export interface LogicGateModel extends ComponentModel {
    type: 'logic-gate';
    gateType: string;
    inputNodeIds: string[];
    outputNodeId: string;
    lastInputVoltages: number[];
    lastOutputVoltage: number;
    edge: CircuitEdge;
}

export const createLogicGateModel =  (
    edge: CircuitEdge,
    inputNodeIds: string[],
    outputNodeId: string,
): LogicGateModel => {
    return {
        isLinear: false,
        type: 'logic-gate',
        gateType: isICComponentConnection(edge.connection) ? edge.connection.metadata.gateType : 'unknown', 
        inputNodeIds,
        outputNodeId,
        lastInputVoltages: Array(inputNodeIds.length).fill(0),
        lastOutputVoltage: 0,
        edge,
    }
}

export const evaluateLogicGate = (
    gateType: string,
    inputVoltages: number[],
    lastOutputVoltage: number,
): number => {
    // convert voltages into digital states with support for hysteresis on the unsupported region to keep the last output
    const inputStates = inputVoltages.map(voltage => {
        if (voltage < 0.8) return false;
        if (voltage > 2.0) return true;

        return lastOutputVoltage > 2.5; // Hysteresis: if in the unsupported region, keep the last output
    })

    let outputState: boolean;
    switch (gateType) {
        case 'AND':
            outputState = inputStates.every(state => state);
            break;
        case 'OR':
            outputState = inputStates.some(state => state);
            break;
        case 'NAND':
            outputState = !inputStates.every(state => state);
            break;
        case 'NOR':
            outputState = !inputStates.some(state => state);
            break;
        case 'XOR':
            outputState = inputStates.filter(state => state).length % 2 === 1;
            break;
        case 'NOT':
            outputState = !inputStates[0];
            break;
        default:
            outputState = false;
    }
    
    return outputState ? 5.0 : 0.0;
}

export const updateLogicGateModel = (
    model: LogicGateModel,
    voltages: Record<string, number>,
): LogicGateModel => {
    const currentInputVoltages = model.inputNodeIds.map(nodeId => 
        voltages[nodeId] || 0  // Default to 0V if node voltage not found
    );

    const newOutputVoltage = evaluateLogicGate(
        model.gateType,
        currentInputVoltages,
        model.lastOutputVoltage,
    );
        
    
    return {
        ...model,
        lastInputVoltages: currentInputVoltages,
        lastOutputVoltage: newOutputVoltage
    }
}

export const applyLogicGateStamp = (
    conductanceMatrix: Matrix,
    inputSourcesVector: Matrix,
    model: LogicGateModel,
    nodeMap: Record<string, number>
): void => {
    if (!nodeMap) return;
    const outputNodeIndex = nodeMap[model.outputNodeId];
    if (outputNodeIndex === undefined) return;

    applyVoltageSourceStamp(conductanceMatrix, inputSourcesVector, model.lastOutputVoltage, outputNodeIndex);
}