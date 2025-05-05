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

/**
 * Creates a logic gate model based on the provided circuit edge and node IDs.
 *
 * @param edge - The circuit edge that connects the logic gate. This contains
 *               information about the connection and its metadata.
 * @param inputNodeIds - An array of strings representing the IDs of the input nodes
 *                       connected to the logic gate.
 * @param outputNodeId - A string representing the ID of the output node connected
 *                       to the logic gate.
 * @returns A `LogicGateModel` object that represents the logic gate, including its
 *          type, gate type, input/output node IDs, last input/output voltages, and
 *          the associated circuit edge.
 */
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

/**
 * Evaluates the output voltage of a logic gate based on its type, input voltages, 
 * and the last output voltage (used for hysteresis in unsupported regions).
 *
 * @param gateType - The type of the logic gate. Supported types are:
 *   - 'AND': Logical AND gate
 *   - 'OR': Logical OR gate
 *   - 'NAND': Logical NAND gate
 *   - 'NOR': Logical NOR gate
 *   - 'XOR': Logical XOR gate
 *   - 'NOT': Logical NOT gate (inverter)
 *   - 'MYSTERY': A custom gate
 * @param inputVoltages - An array of input voltages to the logic gate.
 *   - Voltages below 0.8 are considered `false` (low).
 *   - Voltages above 2.0 are considered `true` (high).
 *   - Voltages in the range [0.8, 2.0] use hysteresis, retaining the last output state.
 * @param lastOutputVoltage - The last output voltage of the gate, used for hysteresis
 *   when input voltages are in the unsupported range.
 * @returns The output voltage of the logic gate:
 *   - `5.0` for `true` (high output state).
 *   - `0.0` for `false` (low output state).
 */
export const evaluateLogicGate = (
    gateType: string,
    inputVoltages: number[],
    lastOutputVoltage: number,
): number => {
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
        case 'MYSTERY':
            outputState = !!(inputStates.reduce((acc, state) => acc ^ + state, 0));
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