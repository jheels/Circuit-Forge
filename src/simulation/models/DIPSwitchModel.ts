import { Matrix } from "mathjs";
import { CircuitEdge } from "../circuit/circuitDetection";
import { applyResistorStamp } from "./resistorModel";
import { ComponentModel } from "./componentModelFactory";


export interface DipSwitchModel extends ComponentModel {
    type: 'dip-switch';
    switchIndex: number;
    switchState: boolean;
}

export const createDipSwitchModel = (switchIndex: number, switchState: boolean, edge: CircuitEdge): DipSwitchModel => {
    return {
        isLinear: true,
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
    const CLOSED_SWITCH_CONDUCTANCE = 1e10;
    const OPEN_SWITCH_CONDUCTANCE = 1e-20;

    const { switchState, edge } = model;

    const conductance = switchState ? CLOSED_SWITCH_CONDUCTANCE : OPEN_SWITCH_CONDUCTANCE;

    applyResistorStamp(conductanceMatrix, {
        isLinear: true,
        type: 'resistor',
        conductance,
        edge
    }, nodeMap)
}