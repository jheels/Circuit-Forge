
import React, { useCallback, useState, useEffect } from 'react';
import { Line, Circle, Group } from 'react-konva';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { isPointInConnector, getConnectorPosition, validateConnection } from '@/definitions/connector';
import { Connection, createAppropriateConnection, isWireConnection } from '@/definitions/connection';
import { Point } from '@/definitions/general';
import { findConnectorIDAtPoint, sendErrorToast, sendSuccessToast } from '@/lib/utils';
import Konva from 'konva';

/**
 * 
 * @param wireID wireID of the wire to be rendered
 * @description Renders a wire on the canvas. The wire is represented by a line with two draggable points at each end.
 * The wire can be selected, and its points can be dragged to connect to connectors on components.
 * The wire can also be deleted by pressing the backspace key when it is selected.
 * @returns {JSX.Element} - The rendered wire component.
 */
export const Wire: React.FC<{ wireID: string }> = ({ wireID }) => {
    const {
        wires,
        components,
        connections,
        selectedWire,
        setSelectedWire,
        setSelectedComponent,
        updateWire,
        removeWire,
        setHoveredConnectorID,
        removeConnection,
        addConnection,
        getConnectorConnection
    } = useSimulatorContext();
    const wire = wires[wireID];
    const [isHovered, setIsHovered] = useState(false);
    const [draggingEnd, setDraggingEnd] = useState<null | { index: 0 | 1; oldPoint: Point }>(null);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
        if (selectedWire !== wireID) {
            document.body.style.cursor = 'pointer';
        }
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        document.body.style.cursor = 'default';
    }, []);

    // Flip the wire selection state
    const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        const newSelectedWireID = selectedWire === wireID ? null : wireID;
        setSelectedWire(newSelectedWireID);
        setSelectedComponent(null);
    }, [selectedWire, setSelectedComponent, setSelectedWire, wireID]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Backspace' && selectedWire === wireID) {
            removeWire(wireID);
            setSelectedWire(null);
        }
    }, [removeWire, wireID, selectedWire, setSelectedWire]);

    // Add event listener for keydown events for deleting wires
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Index is used for the start and end points of the wire
    const handlePointDragStart = useCallback((index: 0 | 1) => {
        setDraggingEnd({ index, oldPoint: wire.points[index] });
        document.body.style.cursor = 'grabbing';
    }, [wire.points]);

    // During dragging, we want to update the wire point, which updates the preview
    const handlePointDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>, index: 0 | 1) => {
        const newPoints = [...wire.points];
        newPoints[index] = { x: e.target.x(), y: e.target.y() };
        updateWire(wireID, { points: newPoints });

        const connectorID = findConnectorIDAtPoint(newPoints[index], components);
        setHoveredConnectorID(connectorID);
    }, [components, wire.points, updateWire, wireID, setHoveredConnectorID]);

    const handlePointDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, index: 0 | 1) => {
        document.body.style.cursor = 'default';
        if (!draggingEnd) return;
        const stage = e.target.getStage();
        if (!stage) return;

        const dropPoint = { x: e.target.x(), y: e.target.y() };
        let foundConnector = false;

        // Check if it is an existing connection that is being modified
        const wireConnection = (Object.values(connections) as Connection[]).find(
            (connection) => isWireConnection(connection) && connection.metadata.wireID === wireID
        );

        Object.values(components).forEach((component) => {
            if (foundConnector) return;
            const { connectors, position, dimensions } = component;

            Object.values(connectors).forEach((connector) => {
                // early returns
                if (!isPointInConnector(dropPoint, connector, position, dimensions)) return;
                const connectorConnection = getConnectorConnection(connector.id);
                if (connectorConnection) {
                    sendErrorToast('Max 1 connection per connector', 'max-connection-toast');
                    return;
                }

                const newPosition = getConnectorPosition(connector, position, dimensions);
                const newPoints = [...wire.points];
                newPoints[index] = newPosition;

                const startConnector = index === 0 ? connector : wire.startConnector;
                const endConnector = index === 1 ? connector : wire.endConnector;

                if (endConnector && !validateConnection(startConnector, endConnector, components)) {
                    sendErrorToast('Invalid connection attempted');
                    return;
                }
                // update appropriate endpoint of the wire
                if (index === 0) {
                    updateWire(wireID, { startConnector: connector, points: newPoints });
                    if (wireConnection) {
                        const newConnection = createAppropriateConnection(connector, wireConnection.targetConnector, components, wireID);
                        removeConnection(wireConnection.id);
                        addConnection(newConnection);
                        sendSuccessToast('Updated connection');
                    }
                } else {
                    updateWire(wireID, { endConnector: connector, points: newPoints });
                    if (wireConnection) {
                        const newConnection = createAppropriateConnection(wireConnection.sourceConnector, connector, components, wireID);
                        removeConnection(wireConnection.id);
                        addConnection(newConnection);
                        sendSuccessToast('Updated connection');
                    }
                }
                foundConnector = true;
                return;
            });
        });
        // Reset to the old point if no connector was found and no connection was made
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
                {/* Highlight the wire when hovered or selected */}
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
                {/* wire outline */}
                <Line
                    points={wire.points.flatMap((point) => [point.x, point.y])}
                    stroke={"black"}
                    strokeWidth={1}
                    lineCap="round"
                />
                {/* wire body */}
                <Line
                    points={wire.points.flatMap((point) => [point.x, point.y])}
                    stroke={"gray"}
                    strokeWidth={0.75}
                    lineCap="round"
                />
            </Group>
            {/* Render the points at the ends of the wire */}
            {selectedWire === wireID && wire.points.map((point, index) => (
                <Circle
                    key={`${wireID}-point-${index}`}
                    x={point.x}
                    y={point.y}
                    radius={1}
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