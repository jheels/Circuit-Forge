/**
 * To do:
 * - Implement different colours depending on input
 */

import React from 'react';
import { Line, Rect, Shape } from 'react-konva';
import { LEDComponent } from '@/types/components/led';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { BaseComponent } from '../base/BaseComponent';

interface LEDProps {
    componentID: string;
}

export const LED: React.FC<LEDProps> = ({
    componentID,
}) => {
    const { selectedComponent, components } = useSimulatorContext()
    const { properties, dimensions } = components[componentID] as LEDComponent;
    return (
        <BaseComponent
            componentID={componentID}
        >
            <Line
                points={[
                    -dimensions.width / 9,
                    0.3 * dimensions.height,
                    -dimensions.width / 9,
                    0.45 * dimensions.height,
                ]}
                stroke="gray"
                strokeWidth={1}
                lineCap='round'
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
                lineCap='round'
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
                stroke={'rgba(143,217,251, 0.5)'}
                strokeEnabled={selectedComponent === componentID}
                strokeWidth={0.75}
                fill={properties.colour}
                opacity={properties.isIlluminated ? 1 : 0.5}
            />
            <Rect
                x={-dimensions.width / 4}
                y={dimensions.height / 4 - 0.1}
                width={dimensions.width / 2 + 1}
                height={dimensions.height / 12 + 0.25}
                fill={properties.colour}
            />
        </BaseComponent>
    )
}