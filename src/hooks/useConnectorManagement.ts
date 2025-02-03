import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { EditorComponent, Point, Wire } from '@/types/general';
import { Connector, getConnectorPosition, validateConnection } from '@/types/connector';
import { createWireConnection, createDirectConnection, Connection, createStripConnection } from '@/types/connection';
import { ConnectorPair, SnapState } from './useSnapManagement';
import { BreadboardComponent } from '@/types/components/breadboard';

const isBreadboard = (component: EditorComponent): boolean => {
    return component.type === 'breadboard';
}

const getStripID = (breadboard: BreadboardComponent, connector: Connector) => {
    if (!isBreadboard(breadboard)) return '';
    const stripID = breadboard.stripMapping.connectorToStrip[connector.id];

    return stripID || '';
}

const createAppropriateConnection = (
    sourceConnector: Connector,
    targetConnector: Connector,
    components: Record<string, EditorComponent>,
) => {
    const sourceComponent = components[sourceConnector.componentID];
    const targetComponent = components[targetConnector.componentID];
    console.log('sourceComponent', sourceComponent);
    console.log('targetComponent', targetComponent);
    const sourceStripID = getStripID(sourceComponent as BreadboardComponent, sourceConnector);
    const targetStripID = getStripID(targetComponent as BreadboardComponent, targetConnector);

    if (sourceStripID || targetStripID) {
        const stripID = sourceStripID || targetStripID;

        return createStripConnection(sourceConnector, targetConnector, stripID);
    }

    return createDirectConnection(sourceConnector, targetConnector);
}

export const useConnectorManagement = (
    position: Point,
    dimensions: { width: number; height: number },
    components: Record<string, EditorComponent>,
    connectors: Record<string, Connector>,
    creatingWire: Wire | null,
    clickedConnector: Connector | null,
    setSelectedWire: (id: string | null) => void,
    updateWire: (id: string, updates: Partial<Wire>) => void,
    addConnection: (connection: Connection) => void,
    removeConnection: (id: string) => void,
    setCreatingWire: (wire: Wire | null) => void,
    setClickedConnector: (connector: Connector | null) => void,
    addWire: (wire: Wire) => void
) => {
    const handleConnectorClick = useCallback((connectorID: string) => {
        const connector = connectors[connectorID];
        const connectorPosition = getConnectorPosition(connector, position, dimensions);
        setSelectedWire(null);

        if (creatingWire) {
            if (clickedConnector && validateConnection(clickedConnector, connector)) {
                updateWire(creatingWire.id, { 
                    endConnectorID: connectorID, 
                    points: [...creatingWire.points, connectorPosition] 
                });
                const connection = createWireConnection(clickedConnector, connector, creatingWire.id);
                addConnection(connection);
                setCreatingWire(null);
                setClickedConnector(connector);
            } else {
                console.log('Invalid connection attempted');
            }
        } else {
            const newWire = {
                id: `wire-${uuidv4()}`,
                startConnectorID: connectorID,
                endConnectorID: null,
                points: [connectorPosition],
            };
            setCreatingWire(newWire);
            addWire(newWire);
            setClickedConnector(connector);
        }
    }, [
        connectors,
        position,
        dimensions,
        creatingWire,
        clickedConnector,
        setSelectedWire,
        updateWire,
        addConnection,
        setCreatingWire,
        setClickedConnector,
        addWire
    ]);

    const updateConnectionsOnDrop = useCallback((snapState: SnapState) => {
        snapState.connectionIDs.forEach((connectionID: string) => {
            removeConnection(connectionID);
        });
        
        if (snapState.isSnapped) {
            const newConnectionIDs = snapState.connections.map(
                ({ connector, otherConnector } : ConnectorPair) => {
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