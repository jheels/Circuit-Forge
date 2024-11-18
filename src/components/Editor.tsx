import { useState, useEffect, useRef, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { Stage, Layer, Rect } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import { useSidebar } from '@/context/SidebarContext';

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const SCALE_BY = 1.05;

const Editor = () => {
    const { isOpen } = useSidebar();
    const [stageWidth, setStageWidth] = useState(isOpen ? window.innerWidth * 0.8 : window.innerWidth - 12);
    const [stageHeight, setStageHeight] = useState(window.innerHeight - 100);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [components, setComponents] = useState([]);
    
    const stageRef = useRef(null);
    const positionRef = useRef(position);
    const scaleRef = useRef(scale);

    // Update refs when state changes
    useEffect(() => {
        positionRef.current = position;
        scaleRef.current = scale;
    }, [position, scale]);


    const handleResize = useCallback(() => {
        setStageWidth(isOpen ? window.innerWidth * 0.8 : window.innerWidth - 12);
        setStageHeight(window.innerHeight - 100);
    }, [isOpen]);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    const wheelTimeoutRef = useRef(null);
    const handleWheel = useCallback((e) => {
        e.evt.preventDefault();

        if (wheelTimeoutRef.current) {
            cancelAnimationFrame(wheelTimeoutRef.current);
        }

        wheelTimeoutRef.current = requestAnimationFrame(() => {
            const stage = e.target.getStage();
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();

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

    const handleDrop = useCallback((item, monitor) => {
        const point = monitor.getSourceClientOffset();
        const stage = stageRef.current;

        if (point && stage) {
            const dropX = (point.x - stage.x()) / scaleRef.current;
            const dropY = (point.y - stage.y()) / scaleRef.current;
            
            setComponents(prev => [
                ...prev,
                {
                    id: `${item.name}-${uuidv4()}`,
                    name: item.name,
                    x: dropX,
                    y: dropY
                }
            ]);
        }
    }, []);

    const handleDragEnd = useCallback((e) => {
        setPosition(e.currentTarget.position());
    }, []);

    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'COMPONENT',
        drop: handleDrop,
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
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
                    {components.map((component) => (
                        <Rect
                            key={component.id}
                            x={component.x}
                            y={component.y}
                            width={100}
                            height={100}
                            fill="black"
                            draggable
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
};

export default Editor;