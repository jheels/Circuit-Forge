/**
 * To do
 * - Implement dynamic bands depending on resistance value
 * - Implement dynamic resistance value
 */

import React from 'react';
import { Rect, Line } from 'react-konva';
import { ResistorComponent } from '@/types/components/resistor';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { BaseComponent } from './BaseComponent';

interface ResistorProps {
    componentID: string;
}

export const Resistor: React.FC<ResistorProps> = ({
    componentID,
}) => {
    const { components } = useSimulatorContext();
    const component = components[componentID] as ResistorComponent;

    if (!component) {
        console.error(`Component with ID ${componentID} not found.`);
        return null;
    }

    const { dimensions } = component;

    return (
        <BaseComponent
            componentID={componentID}
        >
            {/* Resistor Body */}
            <Rect
                x={0}
                y={dimensions.height / 3}
                width={dimensions.width}
                height={dimensions.height / 3}
                fill="brown"
            />

            {/* Resistor Leads */}
            <Line
                points={[
                    0, dimensions.height / 2,
                    -10, dimensions.height / 2
                ]}
                stroke="gray"
                strokeWidth={2}
            />
            <Line
                points={[
                    dimensions.width, dimensions.height / 2,
                    dimensions.width + 10, dimensions.height / 2
                ]}
                stroke="gray"
                strokeWidth={2}
            />
        </BaseComponent>
    );
};