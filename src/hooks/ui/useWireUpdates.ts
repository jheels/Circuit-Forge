import { useCallback } from 'react';
import { Point, Wire } from '@/types/general';
import { Connector, getConnectorPosition } from '@/types/connector';
import { Connection, isWireConnection } from '@/types/connection';

export const useWireUpdates = (
    connectors: Record<string, Connector>,
    dimensions: { width: number; height: number },
    getConnectorConnections: (id: string) => Set<string>,
    connections: Record<string, Connection>,
    wires: Record<string, Wire>,
    updateWire: (id: string, updates: Partial<Wire>) => void
) => {
    return useCallback((position: Point) => {
        updateWirePositions(connectors, dimensions, getConnectorConnections, connections, wires, updateWire, position);
    }, [connectors, dimensions, getConnectorConnections, connections, wires, updateWire]);
};

export const updateWirePositions = (
    connectors: Record<string, Connector>,
    dimensions: { width: number; height: number },
    getConnectorConnections: (id: string) => Set<string>,
    connections: Record<string, Connection>,
    wires: Record<string, Wire>,
    updateWire: (id: string, updates: Partial<Wire>) => void,
    position: Point
) => {
    const wireUpdates: Record<string, { points: Point[] }> = {};

    Object.values(connectors).forEach((connector) => {
        const connectorPosition = getConnectorPosition(connector, position, dimensions);
        const connectorConnections = getConnectorConnections(connector.id);

        connectorConnections.forEach(connectionID => {
            const connection = connections[connectionID];
            if (connection && isWireConnection(connection) && connection.metadata.wireID) {
                const wire = wires[connection.metadata.wireID];
                if (!wire) return;
                if (!wireUpdates[wire.id]) {
                    wireUpdates[wire.id] = { points: [...wire.points] };
                }
                if (connection.sourceConnector.id === connector.id) {
                    wireUpdates[wire.id].points[0] = connectorPosition;
                } else if (connection.targetConnector.id === connector.id) {
                    wireUpdates[wire.id].points[1] = connectorPosition;
                }
            }
        });
    });

    Object.entries(wireUpdates).forEach(([wireID, { points }]) => {
        updateWire(wireID, { points });
    });
};