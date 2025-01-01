import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import { Stage, Layer, Text } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import { useUIContext } from '@/context/UIContext';
import { ComponentTile, Component } from '@/types';
import Konva from 'konva';

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const SCALE_BY = 1.1;

const Editor: React.FC = () => {
    const { isSideBarOpen } = useUIContext();
    const [stageWidth, setStageWidth] = useState<number>(isSideBarOpen ? window.innerWidth * 0.8 : window.innerWidth - 12);
    const [stageHeight, setStageHeight] = useState<number>(window.innerHeight - 100);
    const [scale, setScale] = useState<number>(1);
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [components, setComponents] = useState<Component[]>([]);

    const stageRef = useRef<Konva.Stage>(null);
    const positionRef = useRef<{ x: number; y: number }>(position);
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

    const wheelTimeoutRef = useRef<number | null>(null);

    const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();

        if (wheelTimeoutRef.current) {
            cancelAnimationFrame(wheelTimeoutRef.current);
        }

        wheelTimeoutRef.current = requestAnimationFrame(() => {
            const stage = e.target.getStage();
            if (!stage) return;
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();
            if (!pointer) return;
            const mousePointTo = {
                x: pointer.x / oldScale - stage.x() / oldScale,
                y: pointer.y / oldScale - stage.y() / oldScale,
            };

            const newScale = Math.min(
                MAX_SCALE,
                Math.max(
                    MIN_SCALE,
                    e.evt.deltaY > 0 ? oldScale / SCALE_BY : oldScale * SCALE_BY
                )
            );

            const newPos = {
                x: -(mousePointTo.x - pointer.x / newScale) * newScale,
                y: -(mousePointTo.y - pointer.y / newScale) * newScale,
            };

            setScale(newScale);
            setPosition(newPos);
        });
    }, []);

    const handleDrop = useCallback((item: ComponentTile, monitor: DropTargetMonitor) => {
        const point = monitor.getSourceClientOffset();
        const stage = stageRef.current;

        if (!point || !stage) return;

        const dropX = (point.x - stage.x()) / scaleRef.current;
        const dropY = (point.y - stage.y()) / scaleRef.current;
        const newComponent = {
            editorId: `${item.name}-${uuidv4()}`,
            info: item,
            x: dropX,
            y: dropY,
        };

        setComponents(prev => [...prev, newComponent]);
    }, []);

    const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        setPosition(e.currentTarget.position());
    }, []);

    const [, drop] = useDrop(() => ({
        accept: 'COMPONENT',
        drop: handleDrop,
    }), [handleDrop]);

    return (
        <div className="flex-grow" ref={drop}>
            <Stage
                ref={stageRef}
                width={stageWidth}
                height={stageHeight}
                x={position.x}
                y={position.y}
                scale={{ x: scale, y: scale }}
                onWheel={handleWheel}
                draggable
                onDragEnd={handleDragEnd}
            >
                <Layer>
                    {components.length === 0 && (
                        <Text
                            text="Drop Components Here "
                            fontSize={24}
                            fill="gray"
                            x={stageWidth / 2 - 100}
                            y={stageHeight / 2 - 12}
                        />
                    )}
                    {components.map((component) => {
                        return React.cloneElement(component.info.component, { x: component.x, y: component.y });
                    })}
                </Layer>
            </Stage>
        </div>
    );
};

export default Editor;