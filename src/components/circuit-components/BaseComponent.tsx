import React, { useCallback, useState } from 'react';
import { Group, Rect } from 'react-konva';
import { EditorComponent } from '@/types/general';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { isPointInConnector } from '@/types/connector';


interface BaseComponentProps {
    componentID: string,
    children: React.ReactNode,
    onConnectorClick?: (connectorID: string) => void;
}

const BaseComponent: React.FC<BaseComponentProps> = ({
    componentID,
    children,
    onConnectorClick
}) => {
    const { components, updateComponent, setSelectedComponent } = useSimulatorContext();
    const component = components[componentID] as EditorComponent;
    const [hoveredConnector, setHoveredConnector] = useState<string | null>(null);
    const { position, connectors, dimensions } = component;

    const updateComponentPosition = useCallback((e: KonvaEventObject<DragEvent>) => {
        const newPosition = {
            x: e.target.x(),
            y: e.target.y()
        };
        updateComponent(componentID, { position: newPosition });
    }, [componentID, updateComponent]);

    const displayNearestConnector = useCallback((e: KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const point = stage.getPointerPosition();
        if (!point) return;

        const transform = stage.getAbsoluteTransform().copy().invert();
        const transformedPoint = transform.point(point);

        const nearConnector = connectors.some(connector => {
            const region = connector.getInteractionRegion(position, dimensions);
            const padding = 10;
            return transformedPoint.x >= region.x - padding &&
                   transformedPoint.x <= region.x + region.width + padding &&
                   transformedPoint.y >= region.y - padding &&
                   transformedPoint.y <= region.y + region.height + padding;
        });

        if (!nearConnector) {
            setHoveredConnector(null);
            return;
        }

        for (const connector of connectors) {
            if (isPointInConnector(transformedPoint, connector, position, dimensions)) {
                setHoveredConnector(connector.id);
                return;
            }
        }
        
        setHoveredConnector(null);
    }, [connectors, position, dimensions]);

    const handleSelection = useCallback(() => {
        setSelectedComponent(prevSelectedComponent => 
            prevSelectedComponent === componentID ? null : componentID
        );
    }, [setSelectedComponent, componentID]);

    return (
        <Group
            draggable
            onDragStart={() => setHoveredConnector(null)}
            onDragEnd={updateComponentPosition}
            onMouseMove={displayNearestConnector}
            onMouseLeave={() => setHoveredConnector(null)}
            onClick={handleSelection}
            x={position.x}
            y={position.y}
        >
            {children}
            {hoveredConnector && connectors.map((connector) => {
                if (connector.id !== hoveredConnector) return null;

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
                        strokeWidth={1}
                        onClick={(e) => {
                            e.stopPropagation();
                            onConnectorClick?.(connector.id);
                        }}
                    />
                );
            })}
        </Group>
    )
}

export default BaseComponent;