/**
 * To do:
 * - Checking connector validations on snapping connectors directly
 * - Implement updating circuit series on connections, deletions etc.
 * - Fix bug where moving the connector that you connected to does not remove a connection (only 1 way)
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { Group, Rect } from 'react-konva';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { useSnapManagement } from '@/hooks/useSnapManagement';
import { useWireUpdates } from '@/hooks/useWireUpdates';
import { useConnectorManagement } from '@/hooks/useConnectorManagement';
import { getInteractionRegion } from '@/types/connector';
import Konva from 'konva';

interface BaseComponentProps {
    componentID: string;
    children: React.ReactNode;
    draggable?: boolean;
}

export const BaseComponent: React.FC<BaseComponentProps> = ({
    componentID,
    children,
    draggable = true,
}) => {
    const {
        components,
        connections,
        wires,
        hoveredConnectorID,
        creatingWire,
        updateComponent,
        setSelectedComponent,
        setHoveredConnectorID,
        setSelectedWire,
        setCreatingWire,
        addWire,
        updateWire,
        removeWire,
        addConnection,
        removeConnection,
        setClickedConnector,
        getConnectorConnections,
    } = useSimulatorContext();

    // Get component details
    const component = components[componentID];
    const { position, connectors, dimensions, rotation = 0 } = component;

    const updateWirePositions = useWireUpdates(
        connectors,
        dimensions,
        getConnectorConnections,
        connections,
        wires,
        updateWire,
    );

    const {
        snapState,
        setSnapState,
        handleDragMove,
    } = useSnapManagement(
        componentID,
        connectors,
        dimensions,
        components,
        updateComponent,
        setHoveredConnectorID,
        updateWirePositions
    );

    const {
        handleConnectorClick,
        updateConnectionsOnDrop
    } = useConnectorManagement(
        position,
        dimensions,
        components,
        connectors,
        creatingWire,
        setSelectedWire,
        updateWire,
        addConnection,
        removeConnection,
        setCreatingWire,
        setClickedConnector,
        addWire,
        getConnectorConnections
    );

    // Handle component selection
    const handleSelection = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        setSelectedWire(null);
        setSelectedComponent((prevSelectedComponent: string | null) =>
            prevSelectedComponent === componentID ? null : componentID
        );
    }, [componentID, setSelectedComponent, setSelectedWire]);

    // Handle wire escape key
    const handleWireEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && creatingWire) {
            removeWire(creatingWire.id);
            setCreatingWire(null);
            setClickedConnector(null);
        }
    }, [creatingWire, removeWire, setClickedConnector, setCreatingWire]);

    // Setup and cleanup escape key listener
    useEffect(() => {
        window.addEventListener('keydown', handleWireEscape);
        return () => window.removeEventListener('keydown', handleWireEscape);
    }, [handleWireEscape]);

    // Handle drag end and connection updates
    const updateConnectors = useCallback(() => {
        // Then update connections
        const newConnectionIDs = updateConnectionsOnDrop(snapState);
        
        // Update snap state with new connection IDs
        setSnapState(prev => ({
            ...prev,
            connectionIDs: newConnectionIDs
        }));
    }, [snapState, updateConnectionsOnDrop, setSnapState]);

    const renderedConnectors = useMemo(() => {
        if (!hoveredConnectorID) return null;
        const hoveredConnector = connectors[hoveredConnectorID];
        if (!hoveredConnector) return null;

        const region = getInteractionRegion(hoveredConnector, { x: 0, y: 0 }, dimensions);

        return (
            <Rect
                key={hoveredConnectorID}
                x={region.x}
                y={region.y}
                width={region.width}
                height={region.height}
                fill="transparent"
                stroke="black"
                strokeWidth={0.25}
                onClick={(e) => {
                    e.cancelBubble = true;
                    handleConnectorClick(hoveredConnectorID);
                }}
            />
        );
    }, [hoveredConnectorID, connectors, dimensions, handleConnectorClick]);

    return (
        <Group
            draggable={draggable}
            onDragMove={handleDragMove}
            onDragEnd={updateConnectors}
            onClick={handleSelection}
            x={position.x}
            y={position.y}
        >
            <Group rotation={rotation}>
                {children}
            </Group>
            {renderedConnectors}
        </Group>
    );
};