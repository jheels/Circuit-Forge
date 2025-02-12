/**
 * TODO:
 * - Add occupied connector check before snapping onto it.
 * - Need to check connectors before snapping and rejecting if one of them is rejected?
 * 
 */
import { useState, useCallback } from 'react';
import { Point, EditorComponent } from '@/types/general';
import { Connector, getConnectorPosition, SNAPPING_THRESHOLD, BREAKAWAY_THRESHOLD } from '@/types/connector';
import { calculateDistance } from '@/lib/utils';
import { isBreadboard } from './useConnectorManagement';
import Konva from 'konva';

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

        let firstSnap: FirstSnap | null = null as FirstSnap | null;
        const potentialConnections: ConnectorPair[] = [];

        Object.values(components).forEach((otherComponent) => {
            if (otherComponent.editorID === componentID) return;

            Object.values(otherComponent.connectors).forEach((otherConnector) => {
                Object.values(connectors).forEach((connector) => {
                    const connectorPosition = getConnectorPosition(connector, newPosition, dimensions);
                    const otherConnectorPosition = getConnectorPosition(
                        otherConnector,
                        otherComponent.position,
                        otherComponent.dimensions
                    );

                    const distance = calculateDistance(connectorPosition, otherConnectorPosition);

                    if (distance < SNAPPING_THRESHOLD) {
                        if (!isBreadboard(otherComponent) && !isBreadboard(components[componentID])) {
                            console.log('direct snapping between components not allowed unless one is a breadboard');
                            return;
                        };
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

        return { firstSnap, potentialConnections };
    }, [componentID, components, connectors, dimensions, setHoveredConnectorID]);

    const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        const newPosition = {
            x: e.target.x(),
            y: e.target.y()
        };

        setHoveredConnectorID(null);

        if (checkBreakaway(newPosition)) {
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

        // Look for new connections
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
    }, [
        componentID,
        snapState.isSnapped,
        snapState.position,
        checkBreakaway,
        findPotentialConnections,
        setHoveredConnectorID,
        updateComponent,
        updateWirePositions
    ]);

    return {
        snapState,
        setSnapState,
        handleDragMove
    };
};