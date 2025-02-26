import { Matrix } from "mathjs";
import { CircuitEdge } from "../analysis/circuitDetection";
import { applyResistorStamp, ResistorModel } from "./resistorModel";

type WireModel = ResistorModel;

const WIRE_RESISTANCE = 1; // 1Ω TEMPORARY FIX TO AVOID DIVISION BY ZERO

export const createWireModel = (edge: CircuitEdge): WireModel => {
    return {
        type: 'resistor',
        conductance: 1 / WIRE_RESISTANCE,
        edge
    }
}

export const applyWireStamp = (
    conductanceMatrix: Matrix,
    model: WireModel,
    nodeMap: Record<string, number>
): void => {
    applyResistorStamp(conductanceMatrix, model, nodeMap);
}