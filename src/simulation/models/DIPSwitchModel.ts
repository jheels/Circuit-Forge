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

/**
 * Applies a conductance stamp for a DIP switch model to the conductance matrix.
 *
 * This function determines the conductance of the DIP switch based on its state
 * (open or closed) and applies the corresponding resistor stamp to the conductance matrix.
 *
 * @param conductanceMatrix - The matrix representing the circuit's conductance.
 * @param model - The DIP switch model containing the switch state and edge information.
 * @param nodeMap - A mapping of node identifiers to their corresponding indices in the matrix.
 *
 * @remarks
 * - A closed switch is represented by a very high conductance (`1e10`).
 * - An open switch is represented by a very low conductance (`1e-20`).
 * - The `applyResistorStamp` function is used to apply the calculated conductance to the matrix.
 */
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