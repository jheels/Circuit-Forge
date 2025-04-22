import { useState, useEffect } from 'react';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { useCircuitDetection } from '@/hooks/simulation/useCircuitDetection';
import { performDCAnalysis, AnalysisResult } from '@/simulation/core/DCAnalyser';
import { getSwitchIndex, isDIPSwitchConnection, isICComponentConnection } from '@/simulation/circuit/circuitDetection';
import { ComponentModel } from '@/simulation/models/componentModelFactory';
import { ResistorModel } from '@/simulation/models/resistorModel';
import { DipSwitchModel } from '@/simulation/models/DIPSwitchModel';
import { LEDModel } from '@/simulation/models/LEDModel';

/**
 * A simple hook to perform circuit analysis based on the detected circuit graph.
 * This hook focuses solely on getting analysis results for inspection and debugging.
 * 
 * @returns An object containing analysis results and a function to manually trigger analysis
 */
export const useSimulationExecution = () => {
    // Get components and circuit graph
    const { components, updateComponentElectricalValues } = useSimulatorContext();
    const { circuitGraph } = useCircuitDetection();
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Function to manually trigger analysis
    const runAnalysis = () => {
        // Don't run if already analyzing or if circuit graph is null
        if (!circuitGraph) {
            return null;
        }

        setError(null);

        try {
            // Perform DC analysis
            const result = performDCAnalysis(circuitGraph, components);

            // Store results
            setAnalysisResult(result);

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
            const result = runAnalysis();
            if (!result) return;
            updateComponentElectricalValues(getCircuitValues(result));
        } else {
            // Clear previous results if no circuit graph
            setAnalysisResult(null);
            setError("No valid circuit detected");
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