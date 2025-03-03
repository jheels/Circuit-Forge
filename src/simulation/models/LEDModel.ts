import { Matrix } from "mathjs";
import { CircuitEdge } from "../analysis/circuitDetection";
import { ComponentModel } from "./componentModelFactory";
import { applyResistorStamp } from "./resistorModel";
import { applyCurrentSourceStamp } from "./currentSourceModel";

const THERMAL_VOLTAGE = 0.026; // V
const DEFAULT_IDEALITY = 3  // unitless
const DEFAULT_SATURATION_CURRENT = 1e-15; // A
const DEFAULT_FORWARD_VOLTAGE = 2.0; // V

export interface LEDModel extends ComponentModel {
    type: 'led';
    saturationCurrent: number;
    ideality: number;
    thermalVoltage: number;
    lastVoltage: number;
    equivalentConductance: number;
    equivalentCurrent: number;
}

export const createLEDModel = (
    edge: CircuitEdge,
    lastVoltage?: number
): LEDModel => {
    const saturationCurrent = DEFAULT_SATURATION_CURRENT;
    const ideality = DEFAULT_IDEALITY;
    const thermalVoltage = THERMAL_VOLTAGE * ideality;
    const initialVoltage = lastVoltage ?? DEFAULT_FORWARD_VOLTAGE;
    
    // Calculate initial linearized model parameters
    const { conductance, equivalentCurrent } = calculateLinearisedModel(
        initialVoltage, 
        saturationCurrent, 
        thermalVoltage
    );

    return {
        isLinear: false,
        type: 'led',
        edge,
        saturationCurrent,
        ideality,
        thermalVoltage,
        lastVoltage: initialVoltage,
        equivalentConductance: conductance,
        equivalentCurrent: equivalentCurrent
    };
}

const calculateLinearisedModel = (
    voltage: number,
    saturationCurrent: number,
    thermalVoltage: number
) => {    
    const expTerm = Math.exp(voltage / thermalVoltage);
    const current = saturationCurrent * (expTerm - 1);
    const conductance = (saturationCurrent / thermalVoltage) * expTerm;
    const equivalentCurrent = current - conductance * voltage;

    return { conductance, equivalentCurrent };
}

export const updateLEDModel = (
    model: LEDModel,
    newVoltage: number
): LEDModel => {
    const maxChange = model.thermalVoltage * 5;
    const limitedVoltage = model.lastVoltage + Math.max(-maxChange, Math.min(maxChange, newVoltage - model.lastVoltage));

    const { conductance, equivalentCurrent } = calculateLinearisedModel(
        limitedVoltage,
        model.saturationCurrent,
        model.thermalVoltage
    );

    return {
        ...model,
        lastVoltage: limitedVoltage,
        equivalentConductance: conductance,
        equivalentCurrent: equivalentCurrent
    }
}

export const applyLEDStamp = (
    conductanceMatrix: Matrix,
    inputSourcesVector: Matrix,
    model: LEDModel,
    nodeMap: Record<string, number>
): void => {

    const { equivalentConductance, equivalentCurrent, edge } = model;

    applyResistorStamp(
        conductanceMatrix, 
        {isLinear: true, type: 'resistor', conductance: equivalentConductance, edge },
        nodeMap
    )

    applyCurrentSourceStamp(
        inputSourcesVector,
        {isLinear: true, type: 'current-source', current: equivalentCurrent, edge },
        nodeMap
    )
}