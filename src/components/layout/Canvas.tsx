import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import { Stage, Layer, Line } from 'react-konva';
import { useUIContext } from '@/context/UIContext';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { SidebarComponent, Point } from '@/types/general';
import { PropertiesPanel } from '../ui/panels/PropertiesPanel';
import { LED } from '../circuit/active/LED';
import { Resistor } from '../circuit/passive/Resistor';
import { PowerSupply } from '../circuit/active/PowerSupply';
import { Wire } from '../circuit/passive/Wire';
import { findConnectorIDAtPoint } from '@/lib/utils';
import Konva from 'konva';
import toast from 'react-hot-toast';
import { Breadboard } from '../circuit/board/Breadboard';
import { useSimulationExecution } from '@/hooks/simulation/useSimulationExecution';
import { DipSwitch } from '../circuit/passive/DIPSwitch';
import { IC } from '../circuit/active/IC';

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
        componentCounts,
        wires,
        creatingWire,
        removeWire,
        updateWire,
        setHoveredConnectorID,
        selectedWire,
        setCreatingWire,
        setClickedConnector,
        setSelectedWire,
    } = useSimulatorContext();
    const [stageWidth, setStageWidth] = useState<number>(isSideBarOpen ? window.innerWidth * 0.8 : window.innerWidth - 12);
    const [stageHeight, setStageHeight] = useState<number>(window.innerHeight - 100);

    const positionRef = useRef<Point>(position);
    const scaleRef = useRef<number>(scale);

    useSimulationExecution();

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

        if ((item.sidebarID == 'breadboard' || item.sidebarID == 'power-supply') && componentCounts[item.sidebarID] > 0) {
            toast.error('Only one breadboard or power supply is allowed.');
            return;
        }
        const newComponent = createComponent(item.sidebarID, { x: dropX, y: dropY });

        addComponent(newComponent);
    }, [addComponent, componentCounts, createComponent, stageRef]);

    const handleComponentDeletion = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Backspace' && selectedComponent) {
            removeComponent(selectedComponent);
            setSelectedComponent(null);
            if (creatingWire) {
                removeWire(creatingWire.id);
                setCreatingWire(null);
                setClickedConnector(null);
            }
            toast.success('Component deleted.');
        }
    }, [creatingWire, removeComponent, removeWire, selectedComponent, setClickedConnector, setCreatingWire, setSelectedComponent]);

    useEffect(() => {
        window.addEventListener('keydown', handleComponentDeletion);
        return () => window.removeEventListener('keydown', handleComponentDeletion);
    }, [handleComponentDeletion]);

    const [, drop] = useDrop(() => ({
        accept: 'COMPONENT',
        drop: handleDrop,
    }), [handleDrop]);

    const renderedComponents = useMemo(() => {
        let breadboard = null;
        const otherComponents = [];

        Object.values(components).forEach((component) => {
            switch (component.type) {
                case 'led':
                    otherComponents.push(
                        <LED key={component.editorID} componentID={component.editorID} />
                    );
                    break;
                case 'resistor':
                    otherComponents.push(
                        <Resistor key={component.editorID} componentID={component.editorID} />
                    );
                    break;
                case 'power-supply':
                    otherComponents.push(
                        <PowerSupply key={component.editorID} componentID={component.editorID} />
                    );
                    break;
                case 'dip-switch':
                    otherComponents.push(
                        <DipSwitch key={component.editorID} componentID={component.editorID} />
                    );
                    break;
                case 'ic':
                    otherComponents.push(
                        <IC key={component.editorID} componentID={component.editorID} />
                    )
                    break;
                case 'breadboard':
                    breadboard = <Breadboard key={component.editorID} componentID={component.editorID} />;
                    break;
                default:
                    console.error(`Component type ${component.type} not found.`);
                    break;
            }
        });

        return {
            breadboard,
            otherComponents,
        };
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
                    {renderedComponents.breadboard}
                </Layer>
                <Layer listening={!creatingWire}>
                    {wirePreview}
                    {renderedWires}
                </Layer>
                <Layer>
                    {renderedComponents.otherComponents}
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