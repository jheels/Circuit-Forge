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

/**
 * Custom hook for detecting and validating circuits in a simulation context.
 *
 * This hook processes the components and connections in the simulator context to
 * detect circuits, validate them, and manage the circuit graph state. It also
 * handles power distribution and provides feedback through toast notifications
 * for errors, warnings, and successes.
 *
 * @returns {Object} An object containing:
 * - `circuitGraph`: The detected and validated circuit graph, or `null` if no valid circuit is found.
 * - `powerDistribution`: The power distribution details, including source node, powered rails, and grounded rails.
 *
 * @remarks
 * - This hook relies on the `useSimulatorContext` to access components, connections, and connector connection logic.
 * - It uses `useFindPowerDistribution` to determine the power distribution in the circuit.
 * - The hook performs multiple steps to initialise and validate the circuit graph:
 *   1. Initialises the circuit graph.
 *   2. Sets up power distribution and active regular strips.
 *   3. Creates edges from connections and finds connected circuits.
 *   4. Validates the circuit and provides feedback for issues.
 *   5. Removes disconnected paths if the circuit is valid.
 * - Toast notifications are used to provide feedback for errors, warnings, and successes.
 */
export const useCircuitDetection = () => {
    const { components, connections, getConnectorConnection } = useSimulatorContext();
    const [circuitGraph, setCircuitGraph] = useState<CircuitGraph | null>(null);

    const { powerDistribution, powerSupply, breadboard } = useFindPowerDistribution(components, connections);

    useEffect(() => {
        if ((!powerSupply || !breadboard) && Object.entries(components).length !== 0) {
            sendErrorToast('Power supply and breadboard not found', 'ps-breadboard-not-found');
            return;
        }
        if (!powerSupply || !breadboard) {
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
                    if (issue.suggestedFix)
                        sendErrorToast(issue.suggestedFix, issue.suggestedFix);
                } else {
                    sendWarningToast(issue.message, issue.message);
                    if (issue.suggestedFix)
                        sendWarningToast(issue.suggestedFix, issue.suggestedFix);
                }
            })
        } 

        if (!validationResult.hasErrors) {
            const isOnlyPowerDistribution = Object.keys(graph.nodes).length === 2 && Object.keys(graph.edges).length === 1;
            if (isOnlyPowerDistribution) return;
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