import React from 'react';
import { useSimulatorContext } from "@/context/SimulatorContext";
import { ICComponent } from "@/definitions/components/ic";
import { BaseComponent } from "../base/BaseComponent";
import { Rect, Group, Arc, Text, Circle, Star } from "react-konva";
import { ComponentProps } from '@/definitions/general';
import { DEFAULT_HIT_AREA } from '@/definitions/connector';

const MIN_VOLTAGE = -0.8;
const MAX_VOLTAGE = 5.5;

export const IC: React.FC<ComponentProps> = ({ componentID }) => {
    const { components, selectedComponent, componentElectricalValues } = useSimulatorContext();
    const component = components[componentID] as ICComponent;

    if (!component) {
        console.error(`Component with ID ${componentID} not found.`);
        return null;
    }

    const { dimensions, icType } = component;
    const allValues = componentElectricalValues[componentID] || {};
    const vccValue = allValues[0]?.voltage || 0;
    const hasFailed = vccValue > 0 && (vccValue < MIN_VOLTAGE || vccValue > MAX_VOLTAGE);
    
    const renderExplosionEffect = () => {
        if (!hasFailed) return null;
        
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        const outerRadius = Math.max(dimensions.width, dimensions.height) * 0.3;
        const innerRadius = outerRadius * 0.5;
        const numPoints = 10; 
        
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

    const renderPins = () => {
        const pins: JSX.Element[] = [];
        console.log(component.connectors);
        const pinSize  = DEFAULT_HIT_AREA;
        
        Object.values(component.connectors).forEach(connector => {
            const y = connector.offset.y * dimensions.height;
            
            // Determine if the pin is on the left or right side
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
                
                <Arc
                    x={dimensions.width / 2}
                    y={0}
                    innerRadius={0}
                    outerRadius={dimensions.width / 5}
                    angle={180}
                    fill={"gray"}
                />
                
                <Text
                    text={icType}
                    fontSize={4}
                    fill="white"
                    x={dimensions.width / 2 + 2}
                    y={dimensions.height / 3}
                    rotation={90}
                    opacity={hasFailed ? 0.7 : 1}
                />
                
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