import { useSimulatorContext } from "@/context/SimulatorContext";
import { ICComponent } from "@/definitions/components/ic";
import { BaseComponent } from "../base/BaseComponent";
import { Rect, Group, Arc, Text, Circle, Star } from "react-konva";
import { ComponentProps } from '@/definitions/general';
import { DEFAULT_HIT_AREA } from '@/definitions/connector';
import React from 'react';

const MAX_VOLTAGE = 5.5;

/**
 * 
 * @param componentID The ID of the component to be rendered. Used to fetch the component from the simulator context.
 * @returns {JSX.Element} Konva component representing the IC.
 * @description This component renders an integrated circuit (IC) with pins and an explosion effect if the voltage is out of range.
 * @see BaseComponent
 * @see SimulatorContext
 */
export const IC: React.FC<ComponentProps> = ({ componentID }) => {
    const { components, selectedComponent, componentElectricalValues } = useSimulatorContext();
    // Type cast it to get access to its specific properties
    const component = components[componentID] as ICComponent;

    if (!component) {
        console.error(`Component with ID ${componentID} not found.`);
        return null;
    }

    const { dimensions, icType } = component;
    const allValues = componentElectricalValues[componentID] || {};
    // Get voltage supplied to IC
    const vccValue = allValues[0]?.voltage || 0;
    const hasFailed = vccValue > MAX_VOLTAGE;

    /**
     * 
     * @returns {JSX.Element} Explosion effect rendered as a star shape.
     * @description Renders an explosion effect when IC fails using star shapes.
     */
    const renderExplosionEffect = () => {
        if (!hasFailed) return null;

        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        const outerRadius = Math.max(dimensions.width, dimensions.height) * 0.3;
        const innerRadius = outerRadius * 0.5;
        // Number of points for the star shape
        const numPoints = 10;

        // Colours give a 'fire' expression
        return (
            <Group opacity={0.8}>
                <Star
                    x={centerX}
                    y={centerY}
                    numPoints={numPoints}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    fill="yellow"
                    stroke="orange"
                    strokeWidth={1.5}
                    opacity={0.9}
                />
                <Star
                    x={centerX}
                    y={centerY}
                    numPoints={numPoints}
                    innerRadius={innerRadius * 0.6}
                    outerRadius={outerRadius * 0.7}
                    fill="red"
                    stroke="darkred"
                    strokeWidth={1}
                    opacity={0.9}
                />
            </Group>
        );
    };

    /**
     * 
     * @returns {JSX.Element[]} Array of pin elements rendered as rectangles.
     * @description Renders the pins according to the connector definitions.
     * @see ICComponent
     */
    const renderPins = () => {
        const pins: JSX.Element[] = [];
        const pinSize = DEFAULT_HIT_AREA;

        Object.values(component.connectors).forEach(connector => {
            const y = connector.offset.y * dimensions.height;
            const isLeftSide = connector.offset.x < 0.5;

            pins.push(
                <Rect
                    key={`pin-${connector.id}`}
                    width={pinSize}
                    height={pinSize}
                    fill={connector.type === 'positive' ? '#ff9999' : connector.type === 'negative' ? '#99ccff' : '#888888'}
                    x={isLeftSide ? - pinSize * 0.5 : dimensions.width - pinSize * 0.5}
                    y={y - pinSize / 2}
                    cornerRadius={0.25}
                />
            );
        });

        return pins;
    };

    return (
        <BaseComponent componentID={componentID}>
            <Group>
                <Group>
                    {renderPins()}
                </Group>

                {/* Main IC body */}
                <Rect
                    width={dimensions.width}
                    height={dimensions.height}
                    fill={"#222222"}
                    stroke={hasFailed ? 'rgba(255,100,100, 0.7)' : 'rgba(143,217,251, 0.5)'}
                    strokeEnabled={hasFailed || selectedComponent === componentID}
                    strokeWidth={0.75}
                    cornerRadius={1}
                />
                {/* IC notch */}
                <Arc
                    x={dimensions.width / 2}
                    y={0}
                    innerRadius={0}
                    outerRadius={dimensions.width / 5}
                    angle={180}
                    fill={"gray"}
                />
                {/* IC label */}
                <Text
                    text={icType}
                    fontSize={4}
                    fill="white"
                    x={dimensions.width / 2 + 2}
                    y={dimensions.height / 3}
                    rotation={90}
                    opacity={hasFailed ? 0.7 : 1}
                />
                {/* IC first pin indicator */}
                <Circle
                    x={dimensions.width / 8}
                    y={dimensions.height / 14}
                    radius={0.5}
                    fill="white"
                    opacity={hasFailed ? 0.7 : 1}
                />
            </Group>
            {renderExplosionEffect()}
        </BaseComponent>
    );
};