import React from 'react';
import { Rect, Line, Text } from 'react-konva';
import { PowerSupplyComponent } from '@/types/components/powerSupply';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { BaseComponent } from './BaseComponent';

interface PowerSupplyProps {
    componentID: string;
}

export const PowerSupply: React.FC<PowerSupplyProps> = ({
    componentID,
}) => {
    const { components } = useSimulatorContext();
    const component = components[componentID] as PowerSupplyComponent;

    if (!component) {
        console.error(`Component with ID ${componentID} not found.`);
        return null;
    }

    const { dimensions } = component;

    return (
        <BaseComponent
            componentID={componentID}
        >
            {/* Power Supply Body */}
            <Rect
                width={dimensions.width}
                height={dimensions.height}
                fill="gray"
            />

            {/* Power Supply Leads */}
            <Line
                points={[
                    5, dimensions.height,
                    5, dimensions.height + 5
                ]}
                stroke="#99ccff"
                strokeWidth={1}
            />
            <Line
                points={[
                    10, dimensions.height,
                    10, dimensions.height + 5
                ]}
                stroke="#ff9999"
                strokeWidth={1}
            />

            {/* Labels */}
            <Text
                x={3.5}
                y={10}
                text="GND"
                fontSize={1.5}
                fill='#99ccff'
            />
            <Text
                x={9}
                y={10}
                text="+V"
                fontSize={1.5}
                fill="#ff9999"
            />
        </BaseComponent>
    );
};