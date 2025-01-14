/**
 * To do:
 * - Implement different colours depending on input
 */

import React from 'react';
import { Circle, Line } from 'react-konva';
import { LEDComponent } from '@/types/components/led';
import { useSimulatorContext } from '@/context/SimulatorContext';
import BaseComponent from './BaseComponent';

interface LEDProps {
    componentID: string;
    onConnectorClick?: (connectorId: string) => void;
}

const LED: React.FC<LEDProps> = ({
    componentID,
    onConnectorClick
}) => {
    const component = useSimulatorContext().components[componentID] as LEDComponent;
    const { properties, isSelected, dimensions } = component;

    return (
        <BaseComponent
            componentID={componentID}
            onConnectorClick={onConnectorClick}
        >
            {/* LED Body */}
            <Circle
                x={dimensions.width / 2}
                y={dimensions.height / 3}
                radius={dimensions.width / 2}
                fill={properties.isIlluminated ? properties.color : '#cd5c5c'}
                opacity={properties.isIlluminated ? 1 : 0.5}
                stroke={isSelected ? 'blue' : 'black'}
                strokeWidth={isSelected ? 2 : 1}
            />

            {/* Cathode (straight leg) */}
            <Line
                points={[
                    dimensions.width / 4,
                    dimensions.height / 3 + dimensions.width / 2,
                    dimensions.width / 4,
                    dimensions.height
                ]}
                stroke="gray"
                strokeWidth={2}
            />

            {/* Anode (bent leg) */}
            <Line
                points={[
                    3 * dimensions.width / 4,
                    dimensions.height / 3 + dimensions.width / 2,
                    3 * dimensions.width / 4,
                    dimensions.height - 15,
                    dimensions.width,
                    dimensions.height
                ]}
                stroke="gray"
                strokeWidth={2}
            />
        </BaseComponent>
    )
}

export default LED;