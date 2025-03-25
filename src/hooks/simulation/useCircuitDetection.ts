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
} from '@/simulation/analysis/circuitDetection';
import { validateCircuit } from '@/simulation/validation';
import toast from 'react-hot-toast';

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
            toast.error('Please add a power supply/breadboard', {
                id: 'power-supply-breadboard',
                style: {
                    background: '#FEE2E2', // Soft red, not too aggressive
                    color: '#991B1B', // Dark red for strong contrast
                },
            });

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
            toast.dismiss();
            validationResult.issues.forEach((issue) => {
                if (issue.severity === 'error') {
                    toast.error(issue.message, {
                        id: issue.message,
                        style: {
                            background: '#FEE2E2', // Soft red, not too aggressive
                            color: '#991B1B', // Dark red for strong contrast
                        },
                    });

                } else {
                    toast(issue.message, {
                        icon: '⚠️',
                        style: {
                            background: '#FEF3C7', // Light warm yellow (not too harsh)
                            color: '#92400E', // Darker amber for text contrast
                        },
                        id: issue.message,
                    });
                }
            })
        }

        if (!validationResult.hasErrors) {
            graph = removeDisconnectedPaths(graph, powerDistribution);
            setCircuitGraph(graph);
            toast.success('Circuit detected', {
                id: 'circuit-detected',
                style: {
                    background: '#D1FAE5', // Soft green, not too aggressive
                    color: '#065F46', // Dark green for strong contrast
                },
            });
            return;
        }
        setCircuitGraph(null);
    }, [connections, components, powerDistribution, powerSupply, breadboard]);

    return {
        circuitGraph, powerDistribution
    }
}