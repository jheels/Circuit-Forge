import { useCallback } from 'react';
import { Point, Wire } from '@/definitions/general';
import { Connector, getConnectorPosition } from '@/definitions/connector';
import { Connection, isWireConnection } from '@/definitions/connection';

/**
 * Custom hook to handle wire updates in a circuit design application.
 *
 * @param connectors - A record of connector objects, keyed by their IDs.
 * @param dimensions - The dimensions of the canvas or workspace, including width and height.
 * @param connections - A record of connection objects, keyed by their IDs.
 * @param wires - A record of wire objects, keyed by their IDs.
 * @param getConnectorConnection - A function that retrieves the connection ID associated with a given connector ID.
 * @param updateWire - A function to update a wire's properties, identified by its ID, with the provided partial updates.
 * 
 * @returns A callback function that updates wire positions based on the given position.
 */
export const useWireUpdates = (
    connectors: Record<string, Connector>,
    dimensions: { width: number; height: number },
    connections: Record<string, Connection>,
    wires: Record<string, Wire>,
    getConnectorConnection: (id: string) => string | null,
    updateWire: (id: string, updates: Partial<Wire>) => void
) => {
    return useCallback((position: Point) => {
        updateWirePositions(connectors, dimensions, getConnectorConnection, connections, wires, updateWire, position);
    }, [connectors, dimensions, getConnectorConnection, connections, wires, updateWire]);
};

/**
 * Updates the positions of wires based on the positions of their connected connectors.
 *
 * @param connectors - A record of connector objects, keyed by their IDs.
 * @param dimensions - The dimensions of the container, including width and height.
 * @param getConnectorConnection - A function that retrieves the connection ID for a given connector ID.
 * @param connections - A record of connection objects, keyed by their IDs.
 * @param wires - A record of wire objects, keyed by their IDs.
 * @param updateWire - A function to update a wire's properties, given its ID and partial updates.
 * @param position - The current position of the container.
 */
export const updateWirePositions = (
    connectors: Record<string, Connector>,
    dimensions: { width: number; height: number },
    getConnectorConnection: (id: string) => string | null,
    connections: Record<string, Connection>,
    wires: Record<string, Wire>,
    updateWire: (id: string, updates: Partial<Wire>) => void,
    position: Point
) => {
    const wireUpdates: Record<string, { points: Point[] }> = {};

    Object.values(connectors).forEach((connector) => {
        const connectorPosition = getConnectorPosition(connector, position, dimensions);
        const connectionID = getConnectorConnection(connector.id);
        if (!connectionID) return;
        const connection = connections[connectionID];
        if (connection && isWireConnection(connection) && connection.metadata.wireID) {
            const wire = wires[connection.metadata.wireID];
            if (!wire) return;
            if (!wireUpdates[wire.id]) {
                wireUpdates[wire.id] = { points: [...wire.points] };
            }
            if (connection.sourceConnector.id === connector.id) {
                // snap to the source connector
                wireUpdates[wire.id].points[0] = connectorPosition;
            } else if (connection.targetConnector.id === connector.id) {
                wireUpdates[wire.id].points[1] = connectorPosition;
            }
        }
    });

    Object.entries(wireUpdates).forEach(([wireID, { points }]) => {
        updateWire(wireID, { points });
    });
};