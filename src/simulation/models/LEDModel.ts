import { Matrix } from "mathjs";
import { CircuitEdge } from "../circuit/circuitDetection";
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
    
    // Calculate initial linearised model parameters
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

/**
 * Calculates the linearised model parameters for a diode using the Shockley diode equation.
 *
 * @param voltage - The voltage across the diode (in volts).
 * @param saturationCurrent - The saturation current of the diode (in amperes).
 * @param thermalVoltage - The thermal voltage of the diode (in volts).
 * @returns An object containing:
 *   - `conductance`: The small-signal conductance of the diode (in siemens).
 *   - `equivalentCurrent`: The equivalent current source for the linearised model (in amperes).
 * @see https://en.wikipedia.org/wiki/Shockley_diode_equation
 */
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
    // Clamp the voltage change to prevent excessive changes
    // This is a simple way to limit the voltage change to a reasonable range
    // to avoid numerical instability in the simulation
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

/**
 * Applies the LED linear companion model stamp to the circuit simulation matrices.
 * 
 * This function modifies the conductance matrix and input sources vector
 * to account for the behavior of an LED in the circuit. It uses the 
 * equivalent conductance and current of the LED model to apply the 
 * necessary stamps for simulation.
 * 
 * @param conductanceMatrix - The matrix representing the conductance of the circuit.
 * @param inputSourcesVector - The vector representing the input sources in the circuit.
 * @param model - The LED model containing the equivalent conductance, current, and edge information.
 * @param nodeMap - A mapping of node identifiers to their corresponding indices in the matrices.
 * 
 * @returns void
 */
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