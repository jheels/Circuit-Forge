import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import { Stage, Layer, Text, Rect } from 'react-konva';
import { useUIContext } from '@/context/UIContext';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { SidebarComponent, Point, EditorComponent } from '@/types/general';
import Konva from 'konva';

interface CanvasProps {
    scale: number;
    position: { x: number; y: number };
    setPosition: (position: { x: number; y: number }) => void;
    handleZoom: (e: Konva.KonvaEventObject<WheelEvent>) => void;
    stageRef: React.RefObject<Konva.Stage>;
}

const Canvas: React.FC<CanvasProps> = ({ scale, position, setPosition, handleZoom, stageRef }) => {
    const { isSideBarOpen } = useUIContext();
    const {
        components,
        addComponent,
        updateComponent,
        selectedComponent,
        setSelectedComponent,
        removeComponent,
        createComponent
    } = useSimulatorContext();
    const [stageWidth, setStageWidth] = useState<number>(isSideBarOpen ? window.innerWidth * 0.8 : window.innerWidth - 12);
    const [stageHeight, setStageHeight] = useState<number>(window.innerHeight - 100);

    const positionRef = useRef<Point>(position);
    const scaleRef = useRef<number>(scale);

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
        // this section may just use switch cases to create the component
        const dropX = (point.x - stage.x()) / scaleRef.current;
        const dropY = (point.y - stage.y()) / scaleRef.current;

        const newComponent = createComponent(item.name, { x: dropX, y: dropY });
        addComponent(newComponent);
    }, [addComponent, createComponent, stageRef]);

    const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, componentId: string) => {
        const newX = e.target.x();
        const newY = e.target.y();
        updateComponent(componentId, { position: { x: newX, y: newY } });
    }, [updateComponent]);

    const handleSelectedComponentClick = useCallback((componentId: string) => {
        setSelectedComponent(prevSelected => prevSelected === componentId ? null : componentId);
    }, [setSelectedComponent]);

    const handleSelectedComponentDelete = useCallback((e: KeyboardEvent) => {
        if (selectedComponent && e.key === 'Backspace') {
            removeComponent(selectedComponent);
            setSelectedComponent(null);
        }
    }, [selectedComponent, removeComponent, setSelectedComponent]);

    useEffect(() => {
        window.addEventListener('keydown', handleSelectedComponentDelete);
        return () => window.removeEventListener('keydown', handleSelectedComponentDelete);
    }, [handleSelectedComponentDelete]);

    const [, drop] = useDrop(() => ({
        accept: 'COMPONENT',
        drop: handleDrop,
    }), [handleDrop]);

    const renderedComponents = useMemo(() => {
        return Object.values(components).map((component) => (
            <Rect
            key={component.editorID}
            x={component.position.x}
            y={component.position.y}
            width={50}
            height={50}
            fill="black"
            stroke={component.editorID === selectedComponent ? 'blue' : 'black'}
            strokeWidth={component.editorID === selectedComponent ? 2 : 0}
            draggable
            onDragEnd={(e) => handleDragEnd(e, component.editorID)}
            onClick={() => handleSelectedComponentClick(component.editorID)}
        />
    ));
    }, [components, handleDragEnd, handleSelectedComponentClick, selectedComponent]);

    return (
        <div className="flex-grow" ref={drop}>
            <Stage
                ref={stageRef}
                width={stageWidth}
                height={stageHeight}
                x={position.x}
                y={position.y}
                scale={{ x: scale, y: scale }}
                onWheel={handleZoom}
                draggable
                onDragEnd={(e) => setPosition(e.currentTarget.position())}
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
                <Layer>
                </Layer>
            </Stage>
        </div>
    );
};

export default Canvas;