import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import { Stage, Layer, Text, Line } from 'react-konva';
import { useUIContext } from '@/context/UIContext';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { SidebarComponent, Point } from '@/types/general';
import { PropertiesPanel } from './PropertiesPanel';
import { LED } from './circuit-components/LED';
import { Resistor } from './circuit-components/Resistor';
import { PowerSupply } from './circuit-components/PowerSupply';
import { Wire } from './circuit-components/Wire';
import { findConnectorIDAtPoint } from '@/lib/utils';
import Konva from 'konva';

interface CanvasProps {
    scale: number;
    position: { x: number; y: number };
    setPosition: (position: { x: number; y: number }) => void;
    handleZoom: (e: Konva.KonvaEventObject<WheelEvent>) => void;
    stageRef: React.RefObject<Konva.Stage>;
}

export const Canvas: React.FC<CanvasProps> = ({ scale, position, setPosition, handleZoom, stageRef }) => {
    const { isSideBarOpen } = useUIContext();
    const {
        components,
        addComponent,
        createComponent,
        removeComponent,
        selectedComponent,
        setSelectedComponent,
        wires,
        creatingWire,
        updateWire,
        setHoveredConnectorID,
        selectedWire,
        setSelectedWire,
    } = useSimulatorContext();
    const [stageWidth, setStageWidth] = useState<number>(isSideBarOpen ? window.innerWidth * 0.8 : window.innerWidth - 12);
    const [stageHeight, setStageHeight] = useState<number>(window.innerHeight - 100);

    const positionRef = useRef<Point>(position);
    const scaleRef = useRef<number>(scale);

    const deSelectItems = useCallback(() => {
        setSelectedComponent(null);
        setSelectedWire(null);
    }, [setSelectedComponent, setSelectedWire]);

    const handleConnectionPreview = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const point = stage.getPointerPosition();
        if (!point) return;

        const transform = stage.getAbsoluteTransform().copy().invert();
        const transformedPoint = transform.point(point);
        
        const connectorID = findConnectorIDAtPoint(transformedPoint, components);
        setHoveredConnectorID(connectorID);

        if (creatingWire) {
            updateWire(creatingWire.id, { points: [...creatingWire.points, transformedPoint] });
        }
    }, [components, creatingWire, setHoveredConnectorID, updateWire]);


    useEffect(() => {
        positionRef.current = position;
        scaleRef.current = scale;
    }, [position, scale]);

    const handleResize = useCallback(() => {
        setStageWidth(isSideBarOpen ? window.innerWidth * 0.8 : window.innerWidth - 12);
        setStageHeight(window.innerHeight - 100);
    }, [isSideBarOpen]);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    const handleDrop = useCallback((item: SidebarComponent, monitor: DropTargetMonitor) => {
        const point = monitor.getSourceClientOffset();
        const stage = stageRef.current;

        if (!point || !stage) return;
        const dropX = (point.x - stage.x()) / scaleRef.current;
        const dropY = (point.y - stage.y()) / scaleRef.current;

        const newComponent = createComponent(item.name, { x: dropX, y: dropY });
        addComponent(newComponent);
    }, [addComponent, createComponent, stageRef]);

    const handleComponentDeletion = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Backspace' && selectedComponent) {
            removeComponent(selectedComponent);
            setSelectedComponent(null);
        }
    }, [removeComponent, selectedComponent, setSelectedComponent]);

    useEffect(() => {
        window.addEventListener('keydown', handleComponentDeletion);
        return () => window.removeEventListener('keydown', handleComponentDeletion);
    }, [handleComponentDeletion]);

    const [, drop] = useDrop(() => ({
        accept: 'COMPONENT',
        drop: handleDrop,
    }), [handleDrop]);

    const renderedComponents = useMemo(() => {
        return Object.values(components).map((component) => {
            switch (component.type) {
                case 'LED':
                    return (
                        <LED key={component.editorID} componentID={component.editorID} />
                    );
                case 'RESISTOR':
                    return (
                        <Resistor key={component.editorID} componentID={component.editorID} />
                    );
                case 'POWER SUPPLY':
                    return (
                        <PowerSupply key={component.editorID} componentID={component.editorID} />
                    );
                default:
                    console.error(`Component type ${component.type} not found.`);
                    return null;
            }
        }
        );
    }, [components]);

    const renderedWires = useMemo(() => {
        return Object.values(wires).map((wire) => {
            if (wire.id === selectedWire) return null;
            return (
                <Wire key={wire.id} wireID={wire.id} />
            )
        });
    }, [wires, selectedWire]);

    const selectedWireComponent = useMemo(() => {
        if (!selectedWire) return null;
        return <Wire key={selectedWire} wireID={selectedWire} />;
    }, [selectedWire]);

    const wirePreview = creatingWire && (
        <Line
            points={creatingWire.points.flatMap((point) => [point.x, point.y])}
            stroke="blue"
            strokeWidth={2}
        />
    );

    return (
        <div className="relative flex-grow" ref={drop}>
            <Stage
                ref={stageRef}
                width={stageWidth}
                height={stageHeight}
                x={position.x}
                y={position.y}
                scale={{ x: scale, y: scale }}
                onWheel={handleZoom}
                onDragEnd={(e) => setPosition(e.currentTarget.position())}
                onMouseMove={handleConnectionPreview}
                onClick={deSelectItems}
                draggable
            >
                <Layer>
                    {renderedComponents.length === 0 && (
                        <Text
                            text="Drop Components Here "
                            fontSize={24}
                            fill="gray"
                            x={stageWidth / 2 - 100}
                            y={stageHeight / 2 - 12}
                        />
                    )}
                    {renderedComponents}
                </Layer>
                <Layer listening={!creatingWire}>
                    {wirePreview}
                    {renderedWires}
                </Layer>
                <Layer>
                    {selectedWireComponent}
                </Layer>
            </Stage>
            <div>
                <PropertiesPanel />
            </div>
        </div>
    );
};