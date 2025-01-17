/**
 * To do:
 * - Implement different colours depending on input
 */

import React from 'react';
import { Line, Shape } from 'react-konva';
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
            {/* LED Body */}
            <Shape
                sceneFunc={(context, shape) => {
                    context.beginPath();
                    context.arc(
                        dimensions.width / 2, // x-coordinate of the semicircle center
                        dimensions.height / 3, // y-coordinate of the semicircle center
                        dimensions.width / 4, // radius of the semicircle
                        Math.PI, // start angle (half-circle starts at Math.PI)
                        0, // end angle (ends at 0)
                        false // counterclockwise drawing
                    );
                    // make a rect
                    context.rect(
                        dimensions.width / 4, // x-coordinate of the rectangle
                        dimensions.height / 3, // y-coordinate of the rectangle
                        dimensions.width / 2, // width of the rectangle
                        dimensions.height / 3 // height of the rectangle
                    );
                    context.closePath();
                    context.fillStrokeShape(shape);
                }}
                fill={properties.isIlluminated ? properties.color : '#cd5c5c'}
                opacity={properties.isIlluminated ? 1 : 0.5}
            />
            {/* Cathode (straight leg) */}
            <Line
                points={[
                    dimensions.width / 2.5,
                    dimensions.height / 1.5,
                    dimensions.width / 2 - 3,
                    dimensions.height - 5
                ]}
                stroke="gray"
                strokeWidth={2}
                lineJoin='round'
            />

            {/* Anode (bent leg) */}
            <Line
                points={[
                    dimensions.width - dimensions.width / 2.5,
                    dimensions.height / 1.5, // initial point
                    dimensions.width - dimensions.width / 2.5,
                    dimensions.height - 15,
                    dimensions.width - dimensions.width / 2.5 + 2,
                    dimensions.height - 12, // crooked part
                    dimensions.width - dimensions.width / 2.5 + 2,
                    dimensions.height - 5 // straight down
                ]}
                stroke="gray"
                strokeWidth={2}
            />
        </BaseComponent>
    )
}