/**
 * To do:
 * - Implement different colours depending on input
 */

import React from 'react';
import { Line, Rect, Shape } from 'react-konva';
import { LEDComponent } from '@/types/components/led';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { BaseComponent } from './BaseComponent';

interface LEDProps {
    componentID: string;
}

export const LED: React.FC<LEDProps> = ({
    componentID,
}) => {
    const component = useSimulatorContext().components[componentID] as LEDComponent;
    const { properties, dimensions } = component;
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
                    context.arc(
                        0.5,
                        0,
                        dimensions.width / 4 + 0.5, // radius of the semicircle
                        Math.PI, // start angle (half-circle starts at Math.PI)
                        0, // end angle (ends at 0)
                        false // counterclockwise drawing
                    );
                    // make a rect
                    context.rect(
                        -dimensions.width / 4,
                        0,
                        dimensions.width / 2 + 1, // width of the rectangle
                        dimensions.height / 3 // height of the rectangle
                    );
                    context.closePath();
                    context.fillStrokeShape(shape);
                }}
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
            {/* Cathode (straight leg) */}
        </BaseComponent>
    )
}