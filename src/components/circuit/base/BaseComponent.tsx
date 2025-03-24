import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Group, Rect } from 'react-konva';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { useSnapManagement } from '@/hooks/ui/useSnapManagement';
import { useWireUpdates } from '@/hooks/ui/useWireUpdates';
import { useConnectorManagement } from '@/hooks/circuit/useConnectorManagement';
import { getInteractionRegion } from '@/types/connector';
import { ComponentTooltip } from '@/components/ComponentTooltip';

import Konva from 'konva';

const ORIGIN = { x: 0, y: 0 };

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
        componentElectricalValues,
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
        getConnectorConnection
    } = useSimulatorContext();

    const [isHovered, setIsHovered] = useState(false);

    const component = components[componentID];
    const { position, connectors, dimensions, rotation = 0 } = component;

    const updateWirePositions = useWireUpdates(
        connectors,
        dimensions,
        connections,
        wires,
        getConnectorConnection,
        updateWire
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
        getConnectorConnection
    );

    const handleSelection = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        setSelectedWire(null);
        setSelectedComponent((prevSelectedComponent: string | null) =>
            prevSelectedComponent === componentID ? null : componentID
        );
    }, [componentID, setSelectedComponent, setSelectedWire]);

    const handleWireEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && creatingWire) {
            removeWire(creatingWire.id);
            setCreatingWire(null);
            setClickedConnector(null);
        }
    }, [creatingWire, removeWire, setClickedConnector, setCreatingWire]);

    useEffect(() => {
        window.addEventListener('keydown', handleWireEscape);
        return () => window.removeEventListener('keydown', handleWireEscape);
    }, [handleWireEscape]);

    const updateConnectors = useCallback(() => {
        const newConnectionIDs = updateConnectionsOnDrop(snapState);

        setSnapState(prev => ({
            ...prev,
            connectionIDs: newConnectionIDs
        }));
    }, [snapState, updateConnectionsOnDrop, setSnapState]);

    const renderedConnectors = useMemo(() => {
        if (!hoveredConnectorID) return null;
        const hoveredConnector = connectors[hoveredConnectorID];
        if (!hoveredConnector) return null;

        const region = getInteractionRegion(hoveredConnector, ORIGIN, dimensions);

        return (
            <Rect
                key={hoveredConnectorID}
                x={region.x}
                y={region.y}
                width={region.width}
                height={region.height}
                fill="transparent"
                stroke={hoveredConnector.isConnected ? "red" : '#00c951'}
                strokeWidth={0.25}
                onClick={(e) => {
                    e.cancelBubble = true;
                    handleConnectorClick(hoveredConnectorID);
                }}
                onMouseEnter={() => document.body.style.cursor = 'pointer'}
                onMouseLeave={() => document.body.style.cursor = 'default'}
            />
        );
    }, [hoveredConnectorID, connectors, dimensions, handleConnectorClick]);

    return (
        <Group
            draggable={draggable && !creatingWire}
            onDragMove={handleDragMove}
            onDragEnd={updateConnectors}
            onClick={handleSelection}
            x={position.x}
            y={position.y}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Group rotation={rotation}>
                {children}
            </Group>
            {renderedConnectors}
            {(component.type !== 'breadboard' && component.type !== 'power-supply') && (
                <ComponentTooltip
                    componentId={componentID}
                    componentElectricalValues={componentElectricalValues}
                    component={component}
                    visible={isHovered}
                />
            )}
        </Group>
    );
};