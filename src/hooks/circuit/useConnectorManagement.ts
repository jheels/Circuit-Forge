import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { EditorComponent, Point, Wire } from '@/definitions/general';
import { Connector, getConnectorPosition } from '@/definitions/connector';
import { Connection, createAppropriateConnection } from '@/definitions/connection';
import { ConnectorPair, SnapState } from '../ui/useSnapManagement';
import { sendErrorToast } from '@/lib/utils';

/**
 * A custom hook for managing connectors and wires in a circuit editor.
 *
 * @param position - The current position of the circuit editor canvas.
 * @param dimensions - The dimensions of the circuit editor canvas.
 * @param components - A record of all editor components, keyed by their IDs.
 * @param connectors - A record of all connectors, keyed by their IDs.
 * @param creatingWire - The wire currently being created, or `null` if no wire is being created.
 * @param setSelectedWire - A function to set the currently selected wire by its ID, or `null` to deselect.
 * @param updateWire - A function to update a wire's properties by its ID.
 * @param addConnection - A function to add a new connection between connectors.
 * @param removeConnection - A function to remove a connection by its ID.
 * @param setCreatingWire - A function to set the wire currently being created, or `null` to stop creating a wire.
 * @param setClickedConnector - A function to set the connector that was last clicked, or `null` to clear it.
 * @param addWire - A function to add a new wire to the circuit editor.
 * @param getConnectorConnection - A function to get the connection ID associated with a connector by its ID.
 *
 * @returns An object containing:
 * - `handleConnectorClick`: A function to handle click events on connectors.
 * - `updateConnectionsOnDrop`: A function to update connections when connectors are dropped.
 */
export const useConnectorManagement = (
    position: Point,
    dimensions: { width: number; height: number },
    components: Record<string, EditorComponent>,
    connectors: Record<string, Connector>,
    creatingWire: Wire | null,
    setSelectedWire: (id: string | null) => void,
    updateWire: (id: string, updates: Partial<Wire>) => void,
    addConnection: (connection: Connection) => void,
    removeConnection: (id: string) => void,
    setCreatingWire: (wire: Wire | null) => void,
    setClickedConnector: (connector: Connector | null) => void,
    addWire: (wire: Wire) => void,
    getConnectorConnection: (connectorID: string) => string | null
) => {
    const handleConnectorClick = useCallback((connectorID: string) => {
        const connectorConnection = getConnectorConnection(connectorID);
        if (connectorConnection) {
            sendErrorToast('Connector already connected', 'connector-connected-toast');
            return;
        }

        const connector = connectors[connectorID];
        const connectorPosition = getConnectorPosition(connector, position, dimensions);
        setSelectedWire(null);

        if (creatingWire) {
            if (creatingWire.startConnector.id === connectorID) {
                sendErrorToast('Cannot connect to same connector', 'same-connector-toast');
                return;
            }
            try {
                // Form a connection if we already have a wire
                const connection = createAppropriateConnection(creatingWire.startConnector, connector, components, creatingWire.id);
                addConnection(connection);
                updateWire(creatingWire.id, {
                    endConnector: connector,
                    points: [...creatingWire.points, connectorPosition]
                });    
                setCreatingWire(null);
                setClickedConnector(connector);
            } catch (e) {
                console.error(e);
            }
        } else {
            // Create a new wire with partial rendering.
            const newWire = {
                id: `wire-${uuidv4()}`,
                startConnector: connector,
                endConnector: null,
                points: [connectorPosition],
            };
            setCreatingWire(newWire);
            addWire(newWire);
            setClickedConnector(connector);
        }
    }, [getConnectorConnection, connectors, position, dimensions, setSelectedWire, creatingWire, updateWire, components, addConnection, setCreatingWire, setClickedConnector, addWire]);

    const updateConnectionsOnDrop = useCallback((snapState: SnapState) => {
        snapState.connectionIDs.forEach((connectionID: string) => {
            removeConnection(connectionID);
        });

        if (snapState.isSnapped) {
            const newConnectionIDs = snapState.connections.map(
                ({ connector, otherConnector }: ConnectorPair) => {
                    const connection = createAppropriateConnection(connector, otherConnector, components);
                    addConnection(connection);
                    return connection.id;
                }
            );
            return newConnectionIDs;
        }
        return [];
    }, [addConnection, components, removeConnection]);

    return {
        handleConnectorClick,
        updateConnectionsOnDrop
    };
};