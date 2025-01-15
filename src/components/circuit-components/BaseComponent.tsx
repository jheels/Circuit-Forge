/**
 * To do:
 * - Implement wire creation and logic on clicking connectors
 * - Implement wire deletion
 * - Implement wire highlighting on hover
 * - Implement wire dragging
 * - Implement wire snapping to connectors
 * - Implement wire snapping to grid
 * - Implementing component snapping to grid (breadboard)
 * - Implement serialisation/deserialisation of components for copy/pasting saving/loading
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { Group, Rect } from 'react-konva';
import { EditorComponent } from '@/types/general';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { getConnectorPosition } from '@/types/connector';
import { v4 as uuidv4 } from 'uuid';
import { Connector } from '@/types/connector';
import Konva from 'konva';

interface BaseComponentProps {
    componentID: string,
    children: React.ReactNode,
}

export const BaseComponent: React.FC<BaseComponentProps> = ({
    componentID,
    children,
}) => {
    const {
        components,
        updateComponent,
        setSelectedComponent,
        creatingWire,
        setCreatingWire,
        addWire,
        updateWire,
        removeWire,
        hoveredConnectorID
    } = useSimulatorContext();
    const component = components[componentID] as EditorComponent;
    const { position, connectors, dimensions } = component;

    const updateComponentPosition = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        const newPosition = {
            x: e.target.x(),
            y: e.target.y()
        };
        updateComponent(componentID, { position: newPosition });
    }, [componentID, updateComponent]);


    const handleSelection = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        setSelectedComponent((prevSelectedComponent: string | null) =>
            prevSelectedComponent === componentID ? null : componentID
        );
    }, [setSelectedComponent, componentID]);

    const handleConnectorClick = useCallback((connectorID: string) => {
        const connector = connectors.find(connector => connector.id === connectorID) as Connector;
        const connectorPosition = getConnectorPosition(connector, position, dimensions);

        if (creatingWire) {
            updateWire(creatingWire.id, { endConnectorID: connectorID, points: [...creatingWire.points, connectorPosition] });
            setCreatingWire(null);
        } else {
            const newWire = {
                id: `wire-${uuidv4()}`,
                startConnectorID: connectorID,
                endConnectorID: null,
                points: [connectorPosition],
            };
            setCreatingWire(newWire);
            addWire(newWire);
        }
    }, [connectors, position, dimensions, creatingWire, updateWire, setCreatingWire, addWire]);

    const handleWireEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && creatingWire) {
            removeWire(creatingWire.id);
            setCreatingWire(null);
        }
    }, [creatingWire, removeWire, setCreatingWire]);

    useEffect(() => {
        window.addEventListener('keydown', handleWireEscape);
        return () => window.removeEventListener('keydown', handleWireEscape);
    }, [handleWireEscape]);

    const renderedConnectors = useMemo(() => {
        return connectors.map((connector) => {
            if (connector.id !== hoveredConnectorID) return null;

            const region = connector.getInteractionRegion({ x: 0, y: 0 }, dimensions);

            return (
                <Rect
                    key={connector.id}
                    x={region.x}
                    y={region.y}
                    width={region.width}
                    height={region.height}
                    fill="red"
                    stroke="black"
                    strokeWidth={0.5}
                    onClick={(e) => {
                        e.cancelBubble = true; // Prevent the event from propagating to the stage
                        handleConnectorClick(connector.id);
                    }}
                />
            );
        });
    }, [connectors, hoveredConnectorID, dimensions, handleConnectorClick]);

    return (
        <Group
            draggable
            onDragEnd={updateComponentPosition}
            onClick={handleSelection}
            x={position.x}
            y={position.y}
        >
            {children}
            {renderedConnectors}
        </Group>
    )
}