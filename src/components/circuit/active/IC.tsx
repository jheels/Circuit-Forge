import React from 'react';
import { useSimulatorContext } from "@/context/SimulatorContext";
import { ICComponent } from "@/types/components/ic";
import { BaseComponent } from "../base/BaseComponent";
import { Rect, Group, Arc, Text, Circle, Star } from "react-konva";

interface ICProps {
    componentID: string;
}

export const IC: React.FC<ICProps> = ({ componentID }) => {
    const { components, selectedComponent, componentElectricalValues } = useSimulatorContext();
    const component = components[componentID] as ICComponent;

    if (!component) {
        console.error(`Component with ID ${componentID} not found.`);
        return null;
    }

    const { dimensions, icType } = component;
    
    // Get electrical values from context
    const allValues = componentElectricalValues[componentID] || {};
    
    // Get VCC voltage (we'll use the first voltage value as a simplification)
    const vccValue = allValues[0]?.voltage || 0;
    
    // Fixed voltage range for all ICs
    const MIN_VOLTAGE = -0.8;
    const MAX_VOLTAGE = 5.5;
    
    // Determine if IC has failed (voltage outside acceptable range)
    const hasFailed = vccValue > 0 && (vccValue < MIN_VOLTAGE || vccValue > MAX_VOLTAGE);
    
    // Function to render the exploding effect
    const renderExplosionEffect = () => {
        if (!hasFailed) return null;
        
        // Create a star burst effect for explosion
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        // Make the starburst smaller as requested - around 60% of the IC's max dimension
        const outerRadius = Math.max(dimensions.width, dimensions.height) * 0.3;
        const innerRadius = outerRadius * 0.5;
        const numPoints = 10; // Number of points in the starburst
        
        return (
            <Group opacity={0.8}>
                {/* Yellow starburst */}
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
                
                {/* Red center */}
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

    // Function to render pins aligned with connector positions
    const renderPins = () => {
        const pins: JSX.Element[] = [];
        const pinWidth = 2;
        const pinHeight = 2;
        
        // Render a pin for each connector
        Object.values(component.connectors).forEach(connector => {
            const y = connector.offset.y * dimensions.height;
            
            // Determine if the pin is on the left or right side
            const isLeftSide = connector.offset.x < 0.5;
            pins.push(
                <Rect
                    key={`pin-${connector.id}`}
                    width={pinWidth}
                    height={pinHeight}
                    fill={connector.type === 'positive' ? '#ff9999' : connector.type === 'negative' ? '#99ccff' : '#888888'}
                    x={isLeftSide ? -pinWidth * 0.5 : dimensions.width - pinWidth * 0.5}
                    y={y - pinHeight / 2}
                    cornerRadius={0.25}
                />
            );
        });

        return pins;
    };

    return (
        <BaseComponent componentID={componentID}>
            {/* Always show the IC, even if failed */}
            <Group>
                {/* Render all pins */}
                <Group>
                    {renderPins()}
                </Group>
                
                {/* IC Body */}
                <Rect
                    width={dimensions.width}
                    height={dimensions.height}
                    fill={"#222222"} 
                    stroke={hasFailed ? 'rgba(255,100,100, 0.7)' : 'rgba(143,217,251, 0.5)'}
                    strokeEnabled={hasFailed || selectedComponent === componentID}
                    strokeWidth={0.75}
                    cornerRadius={1}
                />
                
                {/* Notch at the top to indicate pin 1 (typical on real ICs) */}
                <Arc
                    x={dimensions.width / 2}
                    y={0}
                    innerRadius={0}
                    outerRadius={dimensions.width / 5}
                    angle={180}
                    fill={"gray"}
                />
                
                {/* IC Type Label */}
                <Text
                    text={icType}
                    fontSize={4}
                    fill="white"
                    x={dimensions.width / 2 + 2}
                    y={dimensions.height / 3}
                    rotation={90}
                    opacity={hasFailed ? 0.7 : 1}
                />
                
                {/* Pin 1 indicator (small dot near pin 1) */}
                <Circle
                    x={dimensions.width / 8}
                    y={dimensions.height / 14}
                    radius={0.5}
                    fill="white"
                    opacity={hasFailed ? 0.7 : 1}
                />
            </Group>
            
            {/* Explosion effect as an overlay */}
            {renderExplosionEffect()}
        </BaseComponent>
    );
};