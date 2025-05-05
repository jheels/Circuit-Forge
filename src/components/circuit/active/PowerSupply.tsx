import React from 'react';
import { Rect, Text, Circle } from 'react-konva';
import { PowerSupplyComponent } from '@/definitions/components/powerSupply';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { BaseComponent } from '../base/BaseComponent';
import { ComponentProps } from '@/definitions/general';

/**
 * 
 * @param componentID component ID to retrieve properties from SimulatorContext.
 * @returns {JSX.Element} Konva component representing the Power Supply.
 * @description Power Supply graphic displaying current and voltage.
 * @see BaseComponent
 * @see SimulatorContext
 */
export const PowerSupply: React.FC<ComponentProps> = ({
    componentID,
}) => {
    const { components, componentElectricalValues } = useSimulatorContext();
    const component = components[componentID] as PowerSupplyComponent;

    if (!component) {
        console.error(`Component with ID ${componentID} not found.`);
        return null;
    }

    const { dimensions } = component;
    const electricalValues = componentElectricalValues[componentID]?.[0] || { voltage: 0, current: 0 };

    // Format values for display (prevent overflow)
    const voltage = component.properties.voltage as number || 0;
    const currentValue = Math.abs(electricalValues.current || 0);
    const currentDisplay = currentValue < 1
        ? `${(currentValue * 1000).toFixed(2)}mA`
        : `${currentValue.toFixed(2)}A`;

    const width = dimensions.width;
    const height = dimensions.height;
    const displayWidth = width * 0.85;
    const displayHeight = height * 0.3;
    const displayMarginTop = height * 0.1;
    const displayMarginLeft = width * 0.075;

    return (
        <BaseComponent
            componentID={componentID}
        >
            {/* Main Power Supply Body */}
            <Rect
                width={width}
                height={height}
                fill="#e0e0e0"
                stroke="#999999"
                strokeWidth={0.3}
                cornerRadius={1}
            />
            {/* Voltage Display */}
            <Rect
                x={displayMarginLeft}
                y={displayMarginTop}
                width={displayWidth}
                height={displayHeight}
                fill="#d3d9de"
                stroke="#444444"
                strokeWidth={0.3}
            />
            {/* Current Display */}
            <Rect
                x={displayMarginLeft}
                y={displayMarginTop + displayHeight + height * 0.08}
                width={displayWidth}
                height={displayHeight}
                fill="#d3d9de"
                stroke="#444444"
                strokeWidth={0.3}
            />
            <Text
                x={displayMarginLeft + displayWidth * 0.05}
                y={displayMarginTop + displayHeight * 0.3}
                text={`${voltage.toFixed(2)}V`}
                fontSize={5}
                fontStyle="bold"
                fontFamily="Arial"
                fill="#333333"
            />
            <Text
                x={displayMarginLeft + displayWidth * 0.05}
                y={displayMarginTop + displayHeight + height * 0.08 + displayHeight * 0.3}
                text={currentDisplay}
                fontSize={5}
                fontStyle="bold"
                fontFamily="Arial"
                fill="#333333"
            />
            {/* Power and Ground connector displays (no legs) */}
            <Circle
                x={5 / 12 * width}
                y={height - 2}
                radius={1.25}
                fill="#99ccff"
                stroke="gray"
                strokeWidth={0.25}
            />
            <Circle
                x={width * 7 / 12}
                y={height - 2}
                radius={1.25}
                fill="#ff9999"
                stroke="gray"
                strokeWidth={0.25}
            />
        </BaseComponent>
    );
};