/**
 * To do:
 * - Implement different colours depending on input
 */

import React from 'react';
import { Circle, Line, Rect, Shape } from 'react-konva';
import { LEDComponent } from '@/types/components/led';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { BaseComponent } from '../base/BaseComponent';

interface LEDProps {
    componentID: string;
}

const getColorWithOpacity = (baseColor: string, opacity: number = 1): string => {
    // For standard color names, convert to RGB with opacity
    if (baseColor === 'red') return `rgba(255, 0, 0, ${opacity})`;
    if (baseColor === 'green') return `rgba(0, 255, 0, ${opacity})`;
    if (baseColor === 'blue') return `rgba(0, 0, 255, ${opacity})`;
    if (baseColor === 'yellow') return `rgba(255, 255, 0, ${opacity})`;
    

    return baseColor;
};

export const LED: React.FC<LEDProps> = ({
    componentID,
}) => {
    const { components, componentElectricalValues } = useSimulatorContext()
    const { properties, dimensions } = components[componentID] as LEDComponent;
    const { current } = componentElectricalValues[componentID]?.[0] || { voltage: 0, current: 0 };

    // Determine the LED state based on current
    const isUnconnected = current < 0.0005; // Less than 0.5mA
    const isBarelyLit = current >= 0.0005 && current < 0.005; // 0.5mA to 5mA
    const isNormal = current >= 0.005 && current <= 0.02; // 5mA to 20mA
    const isBright = current > 0.02 && current <= 0.025; // 20mA to 25mA
    const isWarning = current > 0.025 && current <= 0.04; // 25mA to 40mA
    const hasFailed = current > 0.04; // Over 40mA

    let bodyOpacity = 0.4; // Base opacity for unconnected state
    if (isBarelyLit) {
        bodyOpacity = 0.5 + (current - 0.0005) * (0.2 / 0.0045); // 50% to 70%
    } else if (isNormal) {
        bodyOpacity = 0.7 + (current - 0.005) * (0.3 / 0.015); // 70% to 100%
    } else if (isBright || isWarning) {
        bodyOpacity = 1.0; // Full opacity
    } else if (hasFailed) {
        bodyOpacity = 0.6; // Darkened for failure
    }

    const bodyColour = hasFailed ? 'black' : properties.colour;

    const renderGlowEffect = () => {
        if (hasFailed || isUnconnected) return null;

        const intensityFactor = Math.min(1, (current - 0.0005) / 0.025);
        const glowRadius = dimensions.width / 2 + (dimensions.width / 4) * intensityFactor;
        const glowOpacity = 0.05 + intensityFactor; // More subtle glow

        return (
            <Circle
                x={dimensions.width / 2 - 6}
                y={dimensions.height / 6 - 3}
                radius={glowRadius}
                fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                fillRadialGradientStartRadius={0}
                fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                fillRadialGradientEndRadius={glowRadius}
                fillRadialGradientColorStops={[
                    0, getColorWithOpacity(properties.colour as string, 0.6 * glowOpacity),
                    0.3, getColorWithOpacity(properties.colour as string, 0.3 * glowOpacity),
                    1, getColorWithOpacity(properties.colour as string, 0)
                ]}
            />
        );
    }

    const renderCrackedEffect = () => {
        if (!hasFailed) return null;

        const crackPaths = [
            // Main crack from top to bottom
            [
                dimensions.width / 2, 0,
                dimensions.width / 2 - dimensions.width / 8, dimensions.height / 10,
                dimensions.width / 2 + dimensions.width / 12, dimensions.height / 5,
                dimensions.width / 2 - dimensions.width / 10, dimensions.height / 3
            ],
            // Branching crack to the left
            [
                dimensions.width / 2 - dimensions.width / 8, dimensions.height / 10,
                dimensions.width / 4, dimensions.height / 8,
                dimensions.width / 8, dimensions.height / 6
            ],
            // Small branching crack to the right
            [
                dimensions.width / 2 + dimensions.width / 12, dimensions.height / 5,
                dimensions.width / 2 + dimensions.width / 6, dimensions.height / 5 + dimensions.height / 12
            ]
        ];
        
        return crackPaths.map((points, i) => (
            <Line
                x={-5.5}
                y={-2.5}
                key={`crack-${i}`}
                points={points}
                stroke="black"
                strokeWidth={0.75}
                lineCap="round"
                lineJoin="round"
            />
        ));
    }


    return (
        <BaseComponent
            componentID={componentID}
        >
            {/* Glow effect (behind everything) */}
            {renderGlowEffect()}
            
            {/* LED Leads */}
            <Line
                points={[
                    -dimensions.width / 9,
                    0.3 * dimensions.height,
                    -dimensions.width / 9,
                    0.45 * dimensions.height,
                ]}
                stroke="gray"
                strokeWidth={1}
                lineCap="round"
            />

            {/* Anode (bent leg) */}
            <Line
                points={[
                    dimensions.width / 9 + 1,
                    0.3 * dimensions.height,
                    dimensions.width / 9 + 1,
                    0.35 * dimensions.height,
                    dimensions.width / 6 + 1,
                    0.4 * dimensions.height,
                    dimensions.width / 6 + 1,
                    0.45 * dimensions.height,
                ]}
                stroke="gray"
                strokeWidth={1}
                lineCap="round"
            />
            
            {/* LED Body */}
            <Shape
                sceneFunc={(context, shape) => {
                    context.beginPath();
                    // Draw the arc
                    context.arc(
                        0.5,
                        0,
                        dimensions.width / 4 + 0.5, // radius of the semicircle
                        Math.PI, // start angle (half-circle starts at Math.PI)
                        0, // end angle (ends at 0)
                        false // counterclockwise drawing
                    );
                    // Draw the rectangle
                    context.lineTo(dimensions.width / 4 + 1, 0);
                    context.lineTo(dimensions.width / 4 + 1, dimensions.height / 3);
                    context.lineTo(-dimensions.width / 4, dimensions.height / 3);
                    context.lineTo(-dimensions.width / 4, 0);
                    context.closePath();
                    context.fillStrokeShape(shape);
                }}
                fill={bodyColour}
                opacity={bodyOpacity}
            />

            <Rect
                x={-dimensions.width / 4}
                y={dimensions.height / 4 - 0.1}
                width={dimensions.width / 2 + 1}
                height={dimensions.height / 12 + 0.25}
                fill={bodyColour}
                opacity={bodyOpacity}
            />
            
            {/* Cracks (for failed state) */}
            {renderCrackedEffect()}
        </BaseComponent>
    );
}