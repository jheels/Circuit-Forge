/**
 * To do:
 * - Implementing component snapping to grid - PARTIALLY DONE 
 * - Checking connector validations on snapping connectors directly
 * - Implement updating circuit series on connections, deletions etc.
 * - Implement serialisation/deserialisation of components for copy/pasting saving/loading
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { Group, Rect } from 'react-konva';
import { EditorComponent } from '@/types/general';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { getConnectorPosition } from '@/types/connector';
import { v4 as uuidv4 } from 'uuid';
import { Connector, SNAPPING_THRESHOLD, BREAKAWAY_THRESHOLD, validateConnection } from '@/types/connector';
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
        wires,
        connectorWireMap,
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
        addWireToConnector,
        clickedConnector,
        setClickedConnector
    } = useSimulatorContext();
    const component = components[componentID] as EditorComponent;
    const { position, connectors, dimensions } = component;

    const updateComponentPosition = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        const newPosition = {
            x: e.target.x(),
            y: e.target.y()
        };

        let snappedPosition = { ...newPosition };
        let snapped = false;
        setHoveredConnectorID(null);

        Object.values(components).forEach((otherComponent) => {
            if (otherComponent.editorID === componentID) return;

            Object.values(otherComponent.connectors).forEach((otherConnector) => {
                Object.values(connectors).forEach((connector) => {
                    const connectorPosition = getConnectorPosition(connector, newPosition, dimensions);
                    const otherConnectorPosition = getConnectorPosition(otherConnector, otherComponent.position, otherComponent.dimensions);

                    const distance = Math.sqrt(
                        Math.pow(connectorPosition.x - otherConnectorPosition.x, 2) +
                        Math.pow(connectorPosition.y - otherConnectorPosition.y, 2)
                    );

                    if (distance < SNAPPING_THRESHOLD) {
                        snappedPosition = {
                            x: otherConnectorPosition.x - (connectorPosition.x - newPosition.x),
                            y: otherConnectorPosition.y - (connectorPosition.y - newPosition.y)
                        };
                        snapped = true;
                        setHoveredConnectorID(otherConnector.id)
                    }
                });
            });
        });

        if (snapped) {
            const distance = Math.sqrt(
                Math.pow(newPosition.x - snappedPosition.x, 2) +
                Math.pow(newPosition.y - snappedPosition.y, 2)
            );
            if (distance > BREAKAWAY_THRESHOLD) {
                snapped = false;
            } else {
                e.target.x(snappedPosition.x);
                e.target.y(snappedPosition.y);
            }
        }
        updateComponent(componentID, { position: snappedPosition });

        const wireUpdates: Record<string, { points: { x: number, y: number }[] }> = {};

        Object.values(connectors).forEach((connector) => {
            const connectorPosition = getConnectorPosition(connector, snappedPosition, dimensions);
            const wireConnections = connectorWireMap[connector.id] || [];
            wireConnections.forEach(({ wireID, isStart }) => {
                if (!wireUpdates[wireID]) {
                    wireUpdates[wireID] = { points: [...wires[wireID].points] };
                }
                if (isStart) {
                    wireUpdates[wireID].points[0] = connectorPosition;
                } else {
                    wireUpdates[wireID].points[1] = connectorPosition; // Only supports 2 point wires for now
                }
            });
        });

        Object.entries(wireUpdates).forEach(([wireID, { points }]) => {
            updateWire(wireID, { points });
        });
    }, [componentID, components, connectorWireMap, connectors, dimensions, setHoveredConnectorID, updateComponent, updateWire, wires]);


    const handleSelection = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        setSelectedWire(null);
        setSelectedComponent((prevSelectedComponent: string | null) =>
            prevSelectedComponent === componentID ? null : componentID
        );
    }, [setSelectedComponent, componentID, setSelectedWire]);

    const handleConnectorClick = useCallback((connectorID: string) => {
        const connector = connectors[connectorID] as Connector;
        const connectorPosition = getConnectorPosition(connector, position, dimensions);
        setSelectedWire(null);
        if (creatingWire) {
            if (validateConnection(clickedConnector, connector)) {
                updateWire(creatingWire.id, { endConnectorID: connectorID, points: [...creatingWire.points, connectorPosition] });
                addWireToConnector(connectorID, creatingWire.id, false);
                setCreatingWire(null);
                setClickedConnector(connector);
            } else {
                // switch to a toast setting
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
            addWireToConnector(connectorID, newWire.id, true);
            setClickedConnector(connector);
        }
    }, [connectors, position, dimensions, setSelectedWire, creatingWire, clickedConnector, updateWire, addWireToConnector, setCreatingWire, setClickedConnector, addWire]);

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

    const renderedConnectors = useMemo(() => {
        if (!hoveredConnectorID) return null;
        const hoveredConnector = connectors[hoveredConnectorID];
        if (!hoveredConnector) return null;

        const region = hoveredConnector.getInteractionRegion({ x: 0, y: 0 }, dimensions);

        return (
            <Rect
                key={hoveredConnectorID}
                x={region.x}
                y={region.y}
                width={region.width}
                height={region.height}
                fill="transparent"
                stroke="black"
                strokeWidth={0.5}
                onClick={(e) => {
                    e.cancelBubble = true;
                    handleConnectorClick(hoveredConnectorID);
                }}
            />
        );
    }, [hoveredConnectorID, connectors, dimensions, handleConnectorClick]);

    return (
        <Group
            draggable
            onDragMove={updateComponentPosition}
            onClick={handleSelection}
            x={position.x}
            y={position.y}
        >
            {children}
            {renderedConnectors}
        </Group>
    );
};