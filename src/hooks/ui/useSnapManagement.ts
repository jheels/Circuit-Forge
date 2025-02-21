/**
 * TODO:
 * - Add occupied connector check before snapping onto it.
 * - Need to check connectors before snapping and rejecting if one of them is rejected?
 * - optimise loops since we already know only breadboards can be snappped to (keep central id store?)
 * 
 */
import { useState, useCallback } from 'react';
import { Point, EditorComponent } from '@/types/general';
import { Connector, getConnectorPosition, SNAPPING_THRESHOLD, BREAKAWAY_THRESHOLD, validateConnection } from '@/types/connector';
import { calculateDistance } from '@/lib/utils';
import Konva from 'konva';
import toast from 'react-hot-toast';

export interface SnapState {
    isSnapped: boolean;
    position: Point | null;
    connections: { connector: Connector; otherConnector: Connector; }[];
    connectionIDs: string[];
}

export interface ConnectorPair {
    connector: Connector;
    otherConnector: Connector;
}

export const useSnapManagement = (
    componentID: string,
    connectors: Record<string, Connector>,
    dimensions: { width: number; height: number },
    components: Record<string, EditorComponent>,
    updateComponent: (id: string, updates: Partial<EditorComponent>) => void,
    setHoveredConnectorID: (id: string | null) => void,
    updateWirePositions: (position: Point) => void
) => {
    const [snapState, setSnapState] = useState<SnapState>({
        isSnapped: false,
        position: null,
        connections: [],
        connectionIDs: []
    });

    const checkBreakaway = useCallback((newPosition: Point): boolean => {
        if (!snapState.isSnapped || !snapState.position) return false;

        const distance = calculateDistance(newPosition, snapState.position);
        return distance > BREAKAWAY_THRESHOLD;
    }, [snapState.isSnapped, snapState.position]);

    const findPotentialConnections = useCallback((newPosition: Point) => {
        interface FirstSnap {
            position: Point;
            connection: ConnectorPair
        }
    
        let firstSnap: FirstSnap | null = null;
        const potentialConnections: ConnectorPair[] = [];
        const unconnectedConnectors = Object.values(connectors).filter(
            connector => !connector.isConnected
        );
    
        // If all connectors are connected, no need to proceed
        if (unconnectedConnectors.length === 0) return { firstSnap, potentialConnections };
    
        Object.values(components).forEach((otherComponent) => {
            if (otherComponent.editorID === componentID) return;
    
            unconnectedConnectors.forEach(connector => {
                Object.values(otherComponent.connectors).forEach((otherConnector) => {
                    const connectorPosition = getConnectorPosition(connector, newPosition, dimensions);
                    const otherConnectorPosition = getConnectorPosition(
                        otherConnector,
                        otherComponent.position,
                        otherComponent.dimensions
                    );
    
                    const distance = calculateDistance(connectorPosition, otherConnectorPosition);
    
                    if (distance < SNAPPING_THRESHOLD) {
                        // Check if the target connector is occupied
                        if (otherConnector.isConnected) {
                            toast.error('Pinhole is occupied.', { id: 'pinhole-occupied' });
                            return;
                        }
    
                        if (!validateConnection(connector, otherConnector, components)) {
                            return;
                        }
    
                        if (!firstSnap) {
                            firstSnap = {
                                position: {
                                    x: otherConnectorPosition.x - (connectorPosition.x - newPosition.x),
                                    y: otherConnectorPosition.y - (connectorPosition.y - newPosition.y)
                                },
                                connection: { connector, otherConnector }
                            };
                        }
                        potentialConnections.push({ connector, otherConnector });
                        setHoveredConnectorID(otherConnector.id);
                    }
                });
            });
        });
    
        // If we found any valid connections but not for all unconnected connectors,
        // we should reject the entire snap attempt
        if (potentialConnections.length > 0 && 
            potentialConnections.length !== unconnectedConnectors.length) {
            toast.error('Please connect all terminals.', { id: 'hanging-component' });
            return { firstSnap: null, potentialConnections: [] };
        }
    
        return { firstSnap, potentialConnections };
    }, [componentID, components, connectors, dimensions, setHoveredConnectorID]);
    
    const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        const newPosition = {
            x: e.target.x(),
            y: e.target.y()
        };

        setHoveredConnectorID(null);

        if (checkBreakaway(newPosition)) {
            const relevantConnections = snapState.connections;
            relevantConnections.forEach(({ connector, otherConnector }) => {
                connector.isConnected = false;
                otherConnector.isConnected = false;
            });
            setSnapState(prev => ({
                ...prev,
                isSnapped: false,
                position: null,
                connections: [],
            }));
            updateComponent(componentID, { position: newPosition });
            updateWirePositions(newPosition);
            return;
        }

        if (snapState.isSnapped && snapState.position) {
            e.target.position(snapState.position);
            updateWirePositions(snapState.position);
            return;
        }

        const { firstSnap, potentialConnections } = findPotentialConnections(newPosition);

        if (firstSnap) {
            setSnapState(prev => ({
                ...prev,
                isSnapped: true,
                position: firstSnap.position,
                connections: potentialConnections,
            }));
            e.target.position(firstSnap.position);
            updateComponent(componentID, { position: firstSnap.position });
            updateWirePositions(firstSnap.position);
        } else {
            updateComponent(componentID, { position: newPosition });
            updateWirePositions(newPosition);
        }
    }, [setHoveredConnectorID, checkBreakaway, snapState.isSnapped, snapState.position, findPotentialConnections, connectors, updateComponent, componentID, updateWirePositions]);

    return {
        snapState,
        setSnapState,
        handleDragMove
    };
};


