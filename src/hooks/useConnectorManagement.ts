import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { EditorComponent, Point, Wire } from '@/types/general';
import { Connector, getConnectorPosition } from '@/types/connector';
import { Connection, createAppropriateConnection } from '@/types/connection';
import { ConnectorPair, SnapState } from './useSnapManagement';
import toast from 'react-hot-toast';

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
    getConnectorConnections: (connectorID: string) => Set<string>
) => {
    const handleConnectorClick = useCallback((connectorID: string) => {
        const connectorConnections = getConnectorConnections(connectorID);
        if (connectorConnections.size > 0) {
            toast.error('Max 1 connection per connector.');
            return;
        }

        const connector = connectors[connectorID];
        const connectorPosition = getConnectorPosition(connector, position, dimensions);
        setSelectedWire(null);

        if (creatingWire) {
            if (creatingWire.startConnector.id === connectorID) {
                toast.error('Cannot connect a connector to itself.');
                return;
            }
            try {
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
    }, [getConnectorConnections, connectors, position, dimensions, setSelectedWire, creatingWire, updateWire, components, addConnection, setCreatingWire, setClickedConnector, addWire]);

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