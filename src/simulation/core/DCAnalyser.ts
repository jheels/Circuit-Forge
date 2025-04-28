import { EditorComponent } from "@/definitions/general";
import { CircuitEdge, CircuitGraph, isICComponentConnection } from "../circuit/circuitDetection";
import { ComponentModel, createComponentModel } from "../models/componentModelFactory";
import { createWireModel } from "../models/wireModel";
import { solveCircuit } from "./MNASystem";
import { LEDModel, updateLEDModel } from "../models/LEDModel";
import { createLogicGateModel, LogicGateModel, updateLogicGateModel } from "../models/logicGateModel";

const MAX_ITERATIONS = 50;
const CONVERGENCE_THRESHOLD = 1e-4;

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
    models: Record<string, ComponentModel>;
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

    // Find all IC gate edges and group them by target node (output node)
    const gateGroups: Record<string, {
        outputNodeId: string,
        gateType: string,
        edges: CircuitEdge[],
        componentId: string
    }> = {};

    Object.values(circuitGraph.edges).forEach(edge => {
        if (edge.connection.type === 'component' &&
            isICComponentConnection(edge.connection) &&
            edge.connection.metadata.pinFunction === 'input') {

            const outputNodeId = edge.targetId;
            const { gateType, gateIndex, icType } = edge.connection.metadata;

            // Create a unique key for this gate
            const gateKey = `${edge.connection.id}-${icType}-${gateIndex}-${outputNodeId}`;

            if (!gateGroups[gateKey]) {
                gateGroups[gateKey] = {
                    outputNodeId: outputNodeId,
                    gateType: gateType,
                    edges: [],
                    componentId: edge.connection.id
                };
            }

            gateGroups[gateKey].edges.push(edge);
        }
    });


    Object.entries(gateGroups).forEach(([gateKey, gateInfo]) => {
        if (gateInfo.edges.length === 0) return;
        
        // Get a representative edge for the gate
        const representativeEdge = gateInfo.edges[0];
        
        // Get all input node IDs
        const inputNodeIds = gateInfo.edges.map(edge => edge.sourceId);
        
        // Create a logic gate model
        const gateModel = createLogicGateModel(
            representativeEdge,
            inputNodeIds,
            gateInfo.outputNodeId
        );
        // Use the gate key as the model ID to avoid conflicts
        models[gateKey] = gateModel;
        nonLinearModels[gateKey] = gateModel;
    });


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

        if (component.type === 'ic') return;

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
    circuitGraph: CircuitGraph,
    previousAnalysis?: AnalysisResult
): {
    updatedState: AnalysisState,
    allModelsConverged: boolean
} => {
    const { voltages, models, nonLinearModels } = state;
    let allModelsConverged = true;

    const updatedNonLinearModels = { ...nonLinearModels };
    const updatedModels = { ...models };

    Object.entries(nonLinearModels).forEach(([modelId, model]) => {
        const edge = circuitGraph.edges[model.edge.id];

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
            updatedNonLinearModels[modelId] = updatedModel;
            updatedModels[modelId] = updatedModel;
        } else if (model.type === 'logic-gate') {
            const logicModel = model as LogicGateModel;
            // Use previous model if available
            const prevModel = previousAnalysis?.models[modelId] as LogicGateModel | undefined;
            const updatedModel = updateLogicGateModel(logicModel, voltages, prevModel);
            const modelConverged = hasConverged(logicModel.lastOutputVoltage, updatedModel.lastOutputVoltage);
            if (!modelConverged) {
                allModelsConverged = false;
            }
            
            updatedNonLinearModels[modelId] = updatedModel;
            updatedModels[modelId] = updatedModel;
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
    circuitGraph: CircuitGraph,
    previousAnalysis?: AnalysisResult
): AnalysisState => {
    try {
        const previousVoltages = { ...state.voltages };
        const { updatedState, allModelsConverged } = updateNonLinearModels(state, circuitGraph, previousAnalysis);
        const newVoltages = solveCircuit(circuitGraph, updatedState.models);
        const voltagesConverged = checkConvergence(previousVoltages, newVoltages);

        return {
            ...updatedState,
            voltages: newVoltages,
            iteration: state.iteration + 1,
            converged: voltagesConverged && allModelsConverged
        }
    } catch (error) {
        console.log('Error during iteration:', error);
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
    components: Record<string, EditorComponent>,
    previousAnalysis?: AnalysisResult
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

        // Warm start: use previous voltages and model states if available and compatible
        if (previousAnalysis && previousAnalysis.success) {
            state.voltages = { ...previousAnalysis.voltages };
            // Optionally, copy over lastOutputVoltage/lastInputVoltages for non-linear models
            Object.entries(state.nonLinearModels).forEach(([id, model]) => {
                const prevModel = previousAnalysis.models[id];
                if (prevModel) {
                    // Only copy relevant state fields
                    if ('lastOutputVoltage' in model && 'lastOutputVoltage' in prevModel) {
                        (model as LogicGateModel).lastOutputVoltage = (prevModel as LogicGateModel).lastOutputVoltage;
                    }
                    if ('lastInputVoltages' in model && 'lastInputVoltages' in prevModel) {
                        (model as LogicGateModel).lastInputVoltages = [...(prevModel as LogicGateModel).lastInputVoltages];
                    }
                }
            });
        } else {
            console.log('No previous analysis found, starting from scratch.');
            // Cold start: solve from scratch
            state.voltages = solveCircuit(circuitGraph, state.models);
        }

        if (Object.keys(state.nonLinearModels).length === 0) {
            return {
                success: true,
                voltages: roundVoltages(state.voltages),
                models: state.models,
                iterations: 1
            }
        }

        let lastStableVoltages = { ...state.voltages };
        let stableIterations = 0;

        while (!state.converged && state.iteration < MAX_ITERATIONS) {
            const prevVoltages = { ...state.voltages };
            state = performIteration(state, circuitGraph, previousAnalysis);

            if (checkConvergence(prevVoltages, state.voltages)) {
                lastStableVoltages = { ...state.voltages };
                stableIterations = state.iteration;
            }
        }

        if (state.converged) {
            return {
                success: true,
                voltages: roundVoltages(state.voltages),
                models: state.models,
                iterations: state.iteration
            };
        } else {
            return {
                success: false,
                voltages: roundVoltages(lastStableVoltages),
                models: state.models,
                iterations: stableIterations,
                error: state.error || `Failed to converge after ${MAX_ITERATIONS} iterations (returned last stable state)`
            };
        }
    } catch (error) {
        console.log('Analysis error:', error);
        return {
            success: false,
            voltages: {},
            models: {},
            iterations: 0,
            error: `Analysis error: ${error instanceof Error ? error.message : String(error)}`
        }
    }
}