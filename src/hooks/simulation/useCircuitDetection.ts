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

export const useCircuitDetection = () => {
    const { components, connections, getConnectorConnections } = useSimulatorContext();
    const [circuitGraph, setCircuitGraph] = useState<CircuitGraph | null>(null);

    const { powerDistribution, powerSupply, breadboard } = useFindPowerDistribution(components, connections);

    useEffect(() => {
        // TODO: refactor to central store for easy access
        if (powerDistribution.sourceNode === '' || !powerDistribution.poweredRails.size || !powerDistribution.groundedRails.size) {
            return;
        };

        let graph = initialiseCircuitGraph();
        graph = initialisePowerDistribution(powerDistribution, powerSupply, graph);
        graph = initialiseActiveRegularStrips(graph, connections, breadboard);
        graph = createEdgesFromConnections(graph, connections, components, powerDistribution, getConnectorConnections);
        graph = findConnectedCircuit(graph);
        graph = removeDisconnectedPaths(graph, powerDistribution);
        setCircuitGraph(graph);
    }, [connections, components, powerDistribution, powerSupply, breadboard]);

    return {
        circuitGraph, powerDistribution
    }
}