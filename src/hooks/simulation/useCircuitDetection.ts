import { useState, useEffect } from 'react';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { useFindPowerDistribution } from './useFindPowerDistribution';
import {
    CircuitGraph,
    initialisePowerDistribution,
    initialiseCircuitGraph,
    initialiseActiveRegularStrips,
    createEdgesFromConnections,
    findConnectedCircuit,
    removeDisconnectedPaths
} from '@/simulation/circuit/circuitDetection';
import { validateCircuit } from '@/simulation/validation';
import { sendErrorToast, sendSuccessToast, sendWarningToast } from '@/lib/utils';

export const useCircuitDetection = () => {
    const { components, connections, getConnectorConnection } = useSimulatorContext();
    const [circuitGraph, setCircuitGraph] = useState<CircuitGraph | null>(null);

    const { powerDistribution, powerSupply, breadboard } = useFindPowerDistribution(components, connections);

    useEffect(() => {
        if (!powerSupply || !breadboard) {
            return;
        }
        // TODO: refactor to central store for easy access
        if ((!powerSupply || !breadboard) && Object.entries(components).length !== 0) {
            sendErrorToast('Power supply and breadboard not found', 'ps-breadboard-not-found');
            return;
        }
        if (powerDistribution.sourceNode === '' || !powerDistribution.poweredRails.size || !powerDistribution.groundedRails.size) {
            return;
        };

        let graph = initialiseCircuitGraph();
        graph = initialisePowerDistribution(powerDistribution, powerSupply, graph);
        graph = initialiseActiveRegularStrips(graph, connections, breadboard);
        graph = createEdgesFromConnections(graph, connections, components, powerDistribution, getConnectorConnection);
        graph = findConnectedCircuit(graph);
        const validationResult = validateCircuit(graph);

        if (validationResult.issues.length) {
            validationResult.issues.forEach((issue) => {
                if (issue.severity === 'error') {
                    sendErrorToast(issue.message, issue.message);
                    if (issue.suggestedFix)  // Check if suggestedFix is not undefined
                    sendErrorToast(issue.suggestedFix, issue.suggestedFix);
                } else {
                    sendWarningToast(issue.message, issue.message);
                    if (issue.suggestedFix)  // Check if suggestedFix is not undefined
                    sendWarningToast(issue.suggestedFix, issue.suggestedFix);
                }
            })
        }

        if (!validationResult.hasErrors) {
            graph = removeDisconnectedPaths(graph, powerDistribution);
            setCircuitGraph(graph);
            sendSuccessToast('Detected circuit', 'detected-circuit-toast');
            return;
        }
        setCircuitGraph(null);
    }, [connections, components, powerDistribution, powerSupply, breadboard]);

    return {
        circuitGraph, powerDistribution
    }
}