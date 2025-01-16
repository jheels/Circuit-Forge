import React, { useCallback, useState, useEffect } from 'react';
import { Line, Circle } from 'react-konva';
import { useSimulatorContext } from '@/context/SimulatorContext';

export const Wire: React.FC<{ wireID: string }> = ({ wireID }) => {
    const { wires, removeWire, selectedWire, setSelectedWire, setSelectedComponent } = useSimulatorContext();
    const wire = wires[wireID];
    const [isHovered, setIsHovered] = useState(false);

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

    return (
        <>
            {(isHovered || selectedWire == wireID) && (
                <Line
                    key={`${wireID}-hover`}
                    points={wire.points.flatMap((point) => [point.x, point.y])}
                    stroke={"blue"}
                    strokeWidth={3}
                    lineCap="round"
                    opacity={0.5}
                />
            )}
            <Line
                key={wireID}
                points={wire.points.flatMap((point) => [point.x, point.y])}
                stroke={"black"}
                strokeWidth={2}
                lineCap="round"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
            />
        {selectedWire === wireID && wire.points.map((point, index) => (
            <Circle
                key={`${wireID}-point-${index}`}
                x={point.x}
                y={point.y}
                radius={1.5}
                stroke='black'
                strokeWidth={0.25}
                fill="red"
                onClick={(e) => {
                    e.cancelBubble = true;
                    console.log('clicked wire endpoint');

                }}
            />
        ))
        } 
        </>
    );
};