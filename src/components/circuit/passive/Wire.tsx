/**
 * To do:
 * - Implement connection validation when modifying wire endpoints.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { Line, Circle, Group } from 'react-konva';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { isPointInConnector, getConnectorPosition, validateConnection } from '@/types/connector';
import { Connection, createAppropriateConnection, isWireConnection } from '@/types/connection';
import { Point } from '@/types/general';
import { findConnectorIDAtPoint } from '@/lib/utils';
import Konva from 'konva';
import toast from 'react-hot-toast';


export const Wire: React.FC<{ wireID: string }> = ({ wireID }) => {
    const {
        wires,
        components,
        updateWire,
        selectedWire,
        setSelectedWire,
        setSelectedComponent,
        removeWire,
        setHoveredConnectorID,
        connections,
        removeConnection,
        addConnection,
        getConnectorConnection
    } = useSimulatorContext();
    const wire = wires[wireID];
    const [isHovered, setIsHovered] = useState(false);
    const [draggingEnd, setDraggingEnd] = useState<null | { index: 0 | 1; oldPoint: Point }>(null);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        setSelectedWire((prevSelectedWire: string | null) =>
            prevSelectedWire === wireID ? null : wireID
        );
        setSelectedComponent(null);
    }, [setSelectedComponent, setSelectedWire, wireID]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Backspace' && selectedWire === wireID) {
            removeWire(wireID);
            setSelectedWire(null);
        }
    }, [removeWire, wireID, selectedWire, setSelectedWire]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handlePointDragStart = useCallback((index: 0 | 1) => {
        setDraggingEnd({ index, oldPoint: wire.points[index] });
    }, [wire.points]);

    const handlePointDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>, index: 0 | 1) => {
        const newPoints = [...wire.points];
        newPoints[index] = { x: e.target.x(), y: e.target.y() };
        updateWire(wireID, { points: newPoints });

        const connectorID = findConnectorIDAtPoint(newPoints[index], components);
        setHoveredConnectorID(connectorID);
    }, [components, wire.points, updateWire, wireID, setHoveredConnectorID]);

    const handlePointDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, index: 0 | 1) => {
        if (!draggingEnd) return;
        const stage = e.target.getStage();
        if (!stage) return;

        const dropPoint = { x: e.target.x(), y: e.target.y() };
        let foundConnector = false;

        const wireConnection = (Object.values(connections) as Connection[]).find(
            (connection) => isWireConnection(connection) && connection.metadata.wireID === wireID
        );

        Object.values(components).forEach((component) => {
            if (foundConnector) return;
            const { connectors, position, dimensions } = component;
            
            Object.values(connectors).forEach((connector) => {
                if (!isPointInConnector(dropPoint, connector, position, dimensions)) return;
                const connectorConnection = getConnectorConnection(connector.id);
                if (connectorConnection) {
                    toast.error('Max 1 connection per connector.', {
                        id: 'max-connection-toast'
                    })
                    return;
                }

                const newPosition = getConnectorPosition(connector, position, dimensions);
                const newPoints = [...wire.points];
                newPoints[index] = newPosition;

                const startConnector = index === 0 ? connector : wire.startConnector;
                const endConnector = index === 1 ? connector : wire.endConnector;

                if (endConnector && !validateConnection(startConnector, endConnector, components)) {
                    toast.error('Invalid connection attempted.');
                    return;
                }

                if (index === 0) {
                    updateWire(wireID, { startConnector: connector, points: newPoints });
                    if (wireConnection) {
                        const newConnection = createAppropriateConnection(connector, wireConnection.targetConnector, components, wireID);
                        removeConnection(wireConnection.id);
                        addConnection(newConnection);
                        toast.success('Updated connection.');
                    }
                } else {
                    updateWire(wireID, { endConnector: connector, points: newPoints });
                    if (wireConnection) {
                        const newConnection = createAppropriateConnection(wireConnection.sourceConnector, connector, components, wireID);
                        removeConnection(wireConnection.id);
                        addConnection(newConnection);
                        toast.success('Updated connection.');
                    }
                }
                foundConnector = true;
                return;
            });
        });

        if (!foundConnector) {
            const newPoints = [...wire.points];
            newPoints[index] = draggingEnd.oldPoint;
            updateWire(wireID, { points: newPoints });
        }
        setDraggingEnd(null);
    }, [draggingEnd, connections, wireID, components, wire, updateWire, removeConnection, addConnection]);

    return (
        <>
            <Group
                key={wireID}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
            >
                {(isHovered || selectedWire == wireID) && (
                    <Line
                        key={`${wireID}-hover`}
                        points={wire.points.flatMap((point) => [point.x, point.y])}
                        stroke={"blue"}
                        strokeWidth={1.5}
                        lineCap="round"
                        opacity={0.5}
                    />
                )}
                <Line
                    points={wire.points.flatMap((point) => [point.x, point.y])}
                    stroke={"black"}
                    strokeWidth={1}
                    lineCap="round"
                />
                <Line
                    points={wire.points.flatMap((point) => [point.x, point.y])}
                    stroke={"gray"}
                    strokeWidth={0.75}
                    lineCap="round"
                />
            </Group>
            {selectedWire === wireID && wire.points.map((point, index) => (
                <Circle
                    key={`${wireID}-point-${index}`}
                    x={point.x}
                    y={point.y}
                    radius={0.75}
                    stroke='black'
                    strokeWidth={0.15}
                    fill="red"
                    draggable
                    onDragStart={() => handlePointDragStart(index as 0 | 1)}
                    onDragMove={(e) => handlePointDragMove(e, index as 0 | 1)}
                    onDragEnd={(e) => handlePointDragEnd(e, index as 0 | 1)}
                />
            ))}
        </>
    );
};