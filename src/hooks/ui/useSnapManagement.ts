import { useState, useCallback } from 'react';
import { Point, EditorComponent } from '@/definitions/general';
import { Connector, getConnectorPosition, SNAPPING_THRESHOLD, BREAKAWAY_THRESHOLD, validateConnection } from '@/definitions/connector';
import { calculateDistance, sendErrorToast } from '@/lib/utils';
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

/**
 * A custom hook that manages snapping behavior for draggable components in a UI editor.
 * It handles snapping to nearby connectors, breaking away from snaps, and updating component positions.
 *
 * @param componentID - The unique identifier of the component being managed.
 * @param connectors - A record of connectors associated with the component.
 * @param dimensions - The dimensions (width and height) of the component.
 * @param components - A record of all components in the editor.
 * @param updateComponent - A function to update the properties of a component.
 * @param setHoveredConnectorID - A function to set the ID of the currently hovered connector.
 * @param updateWirePositions - A function to update the positions of wires connected to the component.
 *
 * @returns An object containing:
 * - `snapState`: The current state of snapping, including whether the component is snapped, its snapped position, and connections.
 * - `setSnapState`: A function to update the snapping state.
 * - `handleDragMove`: A callback to handle drag events and manage snapping behavior.
 */
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

    /**
     * Finds potential connections for a given connector based on its new position.
     * This function evaluates unconnected connectors and determines if they can 
     * snap to other connectors within a specified snapping threshold. It also 
     * validates the connections and ensures all terminals are connected before 
     * proceeding with a snap attempt.
     *
     * @param newPosition - The new position of the connector being moved.
     * @returns An object containing:
     * - `firstSnap`: The first valid snap position and connection pair, or `null` if no valid snap is found.
     * - `potentialConnections`: An array of valid connector pairs that can be snapped together.
     *
     * @remarks
     * - If all connectors are already connected, the function returns early with no potential connections.
     * - If a valid connection is found but not for all unconnected connectors, the snap attempt is rejected.
     * - Displays error toasts for invalid scenarios such as occupied connectors or incomplete connections.
     * @internal
     */
    const findPotentialConnections = useCallback((newPosition: Point) => {
        interface FirstSnap {
            position: Point;
            connection: ConnectorPair
        }

        let firstSnap: FirstSnap | null = null as FirstSnap | null;
        const potentialConnections: ConnectorPair[] = [];
        const unconnectedConnectors = Object.values(connectors).filter(
            connector => !connector.isConnected
        );
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
                            sendErrorToast('Pinhole already occupied', 'occupied-connector');
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
            sendErrorToast('Connect all terminals', 'hanging-component');
            return { firstSnap: null, potentialConnections: [] };
        }

        return { firstSnap, potentialConnections };
    }, [componentID, components, connectors, dimensions, setHoveredConnectorID]);

    /**
     * Handles the drag move event for a draggable element in a Konva stage.
     * 
     * This function manages the snapping behavior of the draggable element, ensuring
     * it either snaps to a valid position or moves freely. It also updates the state
     * of connections and the positions of related components and wires.
     * 
     * @param e - The Konva event object for the drag move event.
     * Behavior:
     * - If the element breaks away from a snap position, it resets the snapping state and
     *   updates the component and wire positions.
     * - If the element is snapped, it enforces the snap position and updates the component
     *   and wire positions accordingly.
     * - If a new snap position is found, it updates the snapping state and positions the
     *   element at the snap position.
     * - If no snap position is found, it allows free movement and updates the component
     *   and wire positions to the new position.
     * 
     * @remarks
     * This function uses `useCallback` to memoize the handler and optimize performance.
     */
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


