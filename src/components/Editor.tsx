import { ToolBar } from '@/components/topbars/ToolBar';
import { SimSideBar } from '@/components/sidebars/SimSideBar';
import { Canvas } from '@/components/Canvas';
import { useState, useCallback, useRef } from 'react';
import Konva from 'konva';

const MIN_SCALE = 1;
const MAX_SCALE = 10;
const SCALE_BY = 1.05;

export const Editor: React.FC = () => {
    const [scale, setScale] = useState<number>(5);
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const stageRef = useRef<Konva.Stage>(null);

    const handleZoom = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();

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
    }, []);

    const handleZoomIn = useCallback(() => {
        setScale((prevScale) => Math.min(MAX_SCALE, prevScale * SCALE_BY));
    }, []);

    const handleZoomOut = useCallback(() => {
        setScale((prevScale) => Math.max(MIN_SCALE, prevScale / SCALE_BY));
    }, []);

    const handleZoomReset = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    return (
        <div className="flex flex-col flex-grow overflow-hidden">
            <ToolBar onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onZoomReset={handleZoomReset} />
            <div className="flex flex-grow overflow-hidden">
                <Canvas scale={scale} position={position} setPosition={setPosition} handleZoom={handleZoom} stageRef={stageRef} />
                <SimSideBar />
            </div>
        </div>
    );
};