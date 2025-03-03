import { EditorComponent } from "@/types/general";
import { CircuitGraph } from "../analysis/circuitDetection";
import { ComponentModel, createComponentModel } from "../models/componentModelFactory";
import { createWireModel } from "../models/wireModel";
import { solveCircuit } from "./MNASystem";
import { LEDModel, updateLEDModel } from "../models/LEDModel";

const MAX_ITERATIONS = 50;
const CONVERGENCE_THRESHOLD = 1e-6;

export interface AnalysisState {
    models: Record<string, ComponentModel>;
    nonLinearModels: Record<string, ComponentModel>;
    voltages: Record<string, number>;
    iteration: number;
    converged: boolean;
    error?: string;
}

export interface AnalysisResult {
    success: boolean;
    voltages: Record<string, number>;
    nonLinearModels: Record<string, ComponentModel>;
    iterations: number;
    error?: string;
}

const createComponentModels = (
    circuitGraph: CircuitGraph,
    components: Record<string, EditorComponent>
): {
    models: Record<string, ComponentModel>,
    nonLinearModels: Record<string, ComponentModel>
} => {
    const models: Record<string, ComponentModel> = {};
    const nonLinearModels: Record<string, ComponentModel> = {};

    Object.entries(circuitGraph.edges).forEach(([edgeId, edge]) => {
        if (edge.connection.type === 'wire') {
            const wireModel = createWireModel(edge);
            models[edgeId] = wireModel;
            return;
        }

        const component = components[edge.connection.id];

        if (!component) {
            console.warn(`Component ${edge.connection.id} not found`);
            return;
        }

        const model = createComponentModel(component, edge);
        if (!model) {
            console.warn(`Model for component ${component.type} not found`);
            return;
        }

        models[edgeId] = model;

        if (!model.isLinear) {
            nonLinearModels[edgeId] = model;
        }
    });

    return { models, nonLinearModels };
}

export const hasConverged = (
    prevVoltage: number,
    newVoltage: number
): boolean => {
    return Math.abs(prevVoltage - newVoltage) < CONVERGENCE_THRESHOLD;
}

export const checkConvergence = (
    prevVoltages: Record<string, number>,
    newVoltages: Record<string, number>
): boolean => {
    return Object.keys(prevVoltages).every(nodeId => {
        return hasConverged(prevVoltages[nodeId] || 0, newVoltages[nodeId]);
    });
}

const roundVoltages = (voltages: Record<string, number>): Record<string, number> => {
    const roundedVoltages: Record<string, number> = {};
    Object.entries(voltages).forEach(([nodeId, voltage]) => {
        roundedVoltages[nodeId] = Math.round(voltage * 1e3) / 1e3;
    });
    return roundedVoltages;
}

export const updateNonLinearModels = (
    state: AnalysisState,
    circuitGraph: CircuitGraph
): {
    updatedState: AnalysisState,
    allModelsConverged: boolean
} => {

    const { voltages, models, nonLinearModels } = state;
    let allModelsConverged = true;

    const updatedNonLinearModels = { ...nonLinearModels };
    const updatedModels = { ...models };

    Object.entries(nonLinearModels).forEach(([edgeId, model]) => {
        const edge = circuitGraph.edges[edgeId];

        const sourceVoltage = voltages[edge.sourceId] || 0;
        const targetVoltage = voltages[edge.targetId] || 0;
        const voltageDiff = sourceVoltage - targetVoltage;

        if (model.type === 'led') {
            const ledModel = model as LEDModel;

            const modelConverged = hasConverged(ledModel.lastVoltage, voltageDiff);
            if (!modelConverged) {
                allModelsConverged = false;
            }

            const updatedModel = updateLEDModel(ledModel, voltageDiff);
            updatedNonLinearModels[edgeId] = updatedModel;
            updatedModels[edgeId] = updatedModel;
        }
    });

    return {
        updatedState: {
            ...state,
            models: updatedModels,
            nonLinearModels: updatedNonLinearModels
        },
        allModelsConverged
    }
}

export const performIteration = (
    state: AnalysisState,
    circuitGraph: CircuitGraph
): AnalysisState => {
    try {
        const previousVoltages = { ...state.voltages };
        const { updatedState, allModelsConverged } = updateNonLinearModels(state, circuitGraph);
        const newVoltages = solveCircuit(circuitGraph, updatedState.models);
        const voltagesConverged = checkConvergence(previousVoltages, newVoltages);

        return {
            ...updatedState,
            voltages: newVoltages,
            iteration: state.iteration + 1,
            converged: voltagesConverged && allModelsConverged
        }
    } catch (error) {
        return {
            ...state,
            iteration: state.iteration + 1,
            converged: false,
            error: `Iteration error: ${error instanceof Error ? error.message : String(error)}`
        }
    }
}

export const performDCAnalysis = (
    circuitGraph: CircuitGraph,
    components: Record<string, EditorComponent>
): AnalysisResult => {
    try {
        const { models, nonLinearModels } = createComponentModels(circuitGraph, components);

        let state: AnalysisState = {
            models,
            nonLinearModels,
            voltages: {},
            iteration: 0,
            converged: false
        };

        state.voltages = solveCircuit(circuitGraph, state.models);

        if (Object.keys(state.nonLinearModels).length === 0) {
            return {
                success: true,
                voltages: roundVoltages(state.voltages),
                nonLinearModels: {},
                iterations: 1
            }
        }

        while (!state.converged && state.iteration < MAX_ITERATIONS) {
            state = performIteration(state, circuitGraph);
        }

        if (state.converged) {
            return {
                success: true,
                voltages: roundVoltages(state.voltages),
                nonLinearModels: state.nonLinearModels,
                iterations: state.iteration
            };
        } else {
            return {
                success: false,
                voltages: roundVoltages(state.voltages),
                nonLinearModels: state.nonLinearModels,
                iterations: state.iteration,
                error: state.error || `Failed to converge after ${MAX_ITERATIONS} iterations`
            };
        }
    } catch (error) {
        return {
            success: false,
            voltages: {},
            nonLinearModels: {},
            iterations: 0,
            error: `Analysis error: ${error instanceof Error ? error.message : String(error)}`
        }
    }
}