import React from 'react';
import { Rect, Line } from 'react-konva';
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
                    20, dimensions.height,
                    20, dimensions.height+10
                ]}
                stroke="red"
                strokeWidth={2}
            />
            <Line
                points={[
                    40, dimensions.height,
                    40, dimensions.height+10
                ]}
                stroke="black"
                strokeWidth={2}
            />
        </BaseComponent>
    );
};