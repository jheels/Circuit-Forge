import { useState, useEffect, useRef } from 'react';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { useCircuitDetection } from '@/hooks/simulation/useCircuitDetection';
import { performDCAnalysis, AnalysisResult } from '@/simulation/core/DCAnalyser';
import { CircuitGraph, getSwitchIndex, isDIPSwitchConnection, isICComponentConnection } from '@/simulation/circuit/circuitDetection';
import { ComponentModel } from '@/simulation/models/componentModelFactory';
import { ResistorModel } from '@/simulation/models/resistorModel';
import { DipSwitchModel } from '@/simulation/models/DIPSwitchModel';
import { LEDModel } from '@/simulation/models/LEDModel';
import { EditorComponent } from '@/definitions/general';
import assert from 'assert';

/**
 * Generates a representation of a circuit's topology based on its graph structure
 * and associated components. The hash is created by serialising the sorted nodes, edges, and
 * component types of the circuit.
 *
 * @param circuitGraph - The graph representation of the circuit, containing nodes and edges.
 * @param components - A record of component IDs mapped to their corresponding editor components.
 * @returns A JSON string that uniquely represents the circuit's topology.
 */
const hashCircuitTopology = (circuitGraph: CircuitGraph, components: Record<string, EditorComponent>) => {
    return JSON.stringify({
        nodes: Object.keys(circuitGraph.nodes).sort(),
        edges: Object.values(circuitGraph.edges)
            .map(e => ({
                source: e.sourceId,
                target: e.targetId,
                type: e.connection.type,
                id: e.connection.id,
                meta: isICComponentConnection(e.connection) ? e.connection.metadata.pinFunction : null
            }))
            .sort((a, b) => a.id.localeCompare(b.id)),
        componentTypes: Object.entries(components)
            .map(([id, c]) => ({ id, type: c.type }))
            .sort((a, b) => a.id.localeCompare(b.id))
    });
};

/**
 * Custom hook for executing circuit simulation and managing its state.
 *
 * This hook provides functionality to perform DC analysis on a circuit graph,
 * retrieve node voltages, and compute electrical values for components in the circuit.
 * It also handles errors and maintains state for warm-starting simulations.
 * Warm-starting allows the simulation to reuse the previous state for faster convergence.
 *
 * @returns {Object} An object containing:
 * - `analysisResult`: The result of the most recent circuit analysis, or `undefined` if no analysis has been performed.
 * - `error`: A string describing the most recent error, or `null` if no error occurred.
 * - `hasValidCircuit`: A boolean indicating whether a valid circuit graph is available.
 * - `runAnalysis`: A function to manually trigger a DC analysis of the circuit.
 * - `getNodeVoltages`: A function to retrieve the node voltages from the most recent analysis.
 * - `getCircuitValues`: A function to compute electrical values (voltage and current) for components in the circuit.
 * - `useWarmStart`: A boolean indicating whether the simulation is using warm-starting with the previous state.
 */
export const useSimulationExecution = () => {
    const { components, updateComponentElectricalValues } = useSimulatorContext();
    const { circuitGraph } = useCircuitDetection();
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const prevTopologyHash = useRef<string | null>(null);

    const runAnalysis = () => {
        if (!circuitGraph) {
            return null;
        }

        setError(null);

        const currentTopologyHash = hashCircuitTopology(circuitGraph, components);
        const useWarmStart = prevTopologyHash.current === currentTopologyHash;

        try {
            const result = performDCAnalysis(
                circuitGraph,
                components,
                useWarmStart ? analysisResult : undefined
            );
            setAnalysisResult(result);
            prevTopologyHash.current = currentTopologyHash;
            if (!result.success && result.error) {
                setError(result.error);
            }

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setError(`Unexpected error: ${errorMessage}`);
            return null;
        }
    };

    // Run analysis when circuit graph changes
    useEffect(() => {
        if (circuitGraph) {
            console.log('Running analysis...');
            const currentTopologyHash = hashCircuitTopology(circuitGraph, components);
            const useWarmStart = prevTopologyHash.current === currentTopologyHash;

            // Pass previous analysis result for stateful simulation
            const result = performDCAnalysis(
                circuitGraph,
                components,
                useWarmStart ? analysisResult : undefined
            );
            console.log('Analysis result:', result);
            setAnalysisResult(result);
            prevTopologyHash.current = currentTopologyHash;

            if (!result) return;
            updateComponentElectricalValues(getCircuitValues(result));
        } else {
            setAnalysisResult(undefined);
            setError("No valid circuit detected");
            prevTopologyHash.current = null;
        }
    }, [circuitGraph]);

    const getNodeVoltages = () => {
        if (!analysisResult || !analysisResult.success) {
            return {};
        }
        return analysisResult.voltages;
    };

    /**
     * Computes the electrical values (voltage and current) for each component in the circuit
     * based on the analysis results and the circuit graph.
     *
     * @param analysisResult - The result of the circuit analysis, containing voltage values
     *                         for nodes and models for components.
     * @returns A record where each key is a component ID, and the value is another record
     *          mapping indices (e.g., switch index, gate index, or default index) to an object
     *          containing `voltage` and `current` values for that component.
     *
     * The function processes the circuit graph's edges to determine the voltage difference
     * across components and calculates the current based on the component model. It handles
     * different types of connections:
     * - DIP switches: Uses the switch index and calculates current using the model.
     * - IC components: Uses the gate index and assigns voltage with zero current.
     * - Other components: Calculates current unless the component is an independent voltage source.
     *
     * If the analysis result indicates failure or the circuit graph is undefined, an empty
     * object is returned.
     */
    const getCircuitValues = (analysisResult: AnalysisResult) => {
        if (!analysisResult.success || !circuitGraph) {
            return {};
        }

        const componentElectricalValues: Record<string, Record<number, { voltage: number, current: number }>> = {};

        Object.values(circuitGraph.edges).forEach(edge => {
            if (edge.connection.type !== 'component') return;

            const componentId = edge.connection.id;
            const sourceVoltage = analysisResult.voltages[edge.sourceId] || 0;
            const targetVoltage = analysisResult.voltages[edge.targetId] || 0;
            const voltageDiff = sourceVoltage - targetVoltage

            if (!componentElectricalValues[componentId]) {
                componentElectricalValues[componentId] = {};
            }
            if (isDIPSwitchConnection(edge.connection)) {
                const switchIndex = getSwitchIndex(edge.connection);
                assert(switchIndex !== undefined, 'Switch index should be defined for DIP switch connection');
                const componentModel = analysisResult.models[edge.id];
                if (componentModel && componentModel.type === 'dip-switch') {
                    const current = calculateModelCurrent(componentModel, voltageDiff);
                    componentElectricalValues[componentId][switchIndex] = { voltage: voltageDiff, current: current ?? 0 };
                }
            } else if (isICComponentConnection(edge.connection)) {
                const gateIndex = edge.connection.metadata?.gateIndex;
                if (gateIndex !== undefined) {
                    componentElectricalValues[componentId][gateIndex] = { voltage: voltageDiff, current: 0 };
                }
            } else {
                const componentModel = analysisResult.models[edge.id];
                if (componentModel && componentModel.type !== 'independent-voltage-source') {
                    const current = calculateModelCurrent(componentModel, voltageDiff);

                    if (current !== null) {
                        componentElectricalValues[componentId][0] = { voltage: voltageDiff, current: current };
                    }
                } else {
                    componentElectricalValues[componentId][0] = { voltage: voltageDiff, current: analysisResult.voltages['unified_power_current'] || 0 };
                }
            }
        });
        return componentElectricalValues;
    };

    const calculateModelCurrent = (model: ComponentModel, voltage: number) => {
        switch (model.type) {
            case 'resistor':
                return voltage * (model as ResistorModel).conductance;
            case 'dip-switch':
                return voltage * ((model as DipSwitchModel).switchState ? 1e10 : 1e-20);
            case 'led': {
                const ledModel = model as LEDModel;
                return ledModel.saturationCurrent * (Math.exp(voltage / ledModel.thermalVoltage) - 1);
            }
            default:
                return null;
        }
    }

    return {
        analysisResult,
        error,
        hasValidCircuit: !!circuitGraph,
        runAnalysis,
        getNodeVoltages,
        getCircuitValues,
    };
};