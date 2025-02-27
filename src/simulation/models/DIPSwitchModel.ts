import { Matrix } from "mathjs";
import { CircuitEdge } from "../analysis/circuitDetection";
import { applyResistorStamp } from "./resistorModel";


export interface DipSwitchModel {
    type: 'dip-switch';
    switchIndex: number;
    switchState: boolean;
    edge: CircuitEdge;
}

export const createDipSwitchModel = (switchIndex: number, switchState: boolean, edge: CircuitEdge): DipSwitchModel => {
    return {
        type: 'dip-switch',
        switchIndex,
        switchState,
        edge
    }
}

export const applyDipSwitchStamp = (
    conductanceMatrix: Matrix,
    model: DipSwitchModel,
    nodeMap: Record<string, number>
): void => {
    const CLOSED_SWITCH_CONDUCTANCE = 1e12;
    const OPEN_SWITCH_CONDUCTANCE = 1e-12;

    const { switchState, edge } = model;

    const conductance = switchState ? CLOSED_SWITCH_CONDUCTANCE : OPEN_SWITCH_CONDUCTANCE;

    applyResistorStamp(conductanceMatrix, {
        type: 'resistor',
        conductance,
        edge
    }, nodeMap)
}