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

// Hash only the circuit topology (not component state)
const hashCircuitTopology = (circuitGraph: CircuitGraph, components: Record<string, EditorComponent>) => {
    return JSON.stringify({
        nodes: Object.keys(circuitGraph.nodes).sort(),
        edges: Object.values(circuitGraph.edges)
            .map(e => ({
                source: e.sourceId,
                target: e.targetId,
                type: e.connection.type,
                id: e.connection.id,
                meta: e.connection.metadata?.pinFunction || null
            }))
            .sort((a, b) => a.id.localeCompare(b.id)),
        componentTypes: Object.entries(components)
            .map(([id, c]) => ({ id, type: c.type }))
            .sort((a, b) => a.id.localeCompare(b.id))
    });
};

export const useSimulationExecution = () => {
    // Get components and circuit graph
    const { components, updateComponentElectricalValues } = useSimulatorContext();
    const { circuitGraph } = useCircuitDetection();
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const prevTopologyHash = useRef<string | null>(null);

    // Function to manually trigger analysis
    const runAnalysis = () => {
        // Don't run if already analyzing or if circuit graph is null
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
            // Store results
            setAnalysisResult(result);
            prevTopologyHash.current = currentTopologyHash;

            // Set error if analysis failed
            if (!result.success && result.error) {
                setError(result.error);
            }

            return result;
        } catch (error) {
            // Handle unexpected errors
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
            // Clear previous results if no circuit graph
            setAnalysisResult(undefined);
            setError("No valid circuit detected");
            prevTopologyHash.current = null;
        }
    }, [circuitGraph]);

    // Helper function to get node voltages
    const getNodeVoltages = () => {
        if (!analysisResult || !analysisResult.success) {
            return {};
        }
        return analysisResult.voltages;
    };

    // Helper function to get component voltages
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
                const componentModel = analysisResult.models[edge.id];
                if (componentModel && componentModel.type === 'dip-switch') {
                    const current = calculateModelCurrent(componentModel, voltageDiff);
                    componentElectricalValues[componentId][switchIndex] = { voltage: voltageDiff, current: current };
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
                        componentElectricalValues[componentId][0] = { voltage: voltageDiff, current: current};
                    }
                } else {
                    componentElectricalValues[componentId][0] = { voltage: voltageDiff, current: analysisResult.voltages['unified_power_current'] || 0 };
                }
            }
        });

        return componentElectricalValues;
    };

    // Helper function to calculate current based on component model
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
        // Analysis state
        analysisResult,
        error,
        hasValidCircuit: !!circuitGraph,

        // Analysis actions
        runAnalysis,

        // Helper functions
        getNodeVoltages,
        getCircuitValues,
    };
};