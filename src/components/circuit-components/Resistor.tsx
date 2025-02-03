/**
 * Resistor.tsx
 * TODO:
 * - Validate band calculation algorithm.
 */

import React, { useMemo } from 'react';
import { Group, Rect, Line } from 'react-konva';
import { ResistorComponent } from '@/types/components/resistor';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { BaseComponent } from './BaseComponent';

// Standard resistor color codes
const RESISTOR_COLORS = {
    0: '#000000', // Black
    1: '#964B00', // Brown
    2: '#FF0000', // Red
    3: '#FFA500', // Orange
    4: '#FFFF00', // Yellow
    5: '#00FF00', // Green
    6: '#0000FF', // Blue
    7: '#800080', // Violet
    8: '#808080', // Gray
    9: '#FFFFFF', // White
} as const;

// Multiplier values and their corresponding colors
const MULTIPLIER_COLORS = {
    0: '#000000',  // ×1 (Black)
    1: '#964B00',  // ×10 (Brown)
    2: '#FF0000',  // ×100 (Red)
    3: '#FFA500',  // ×1K (Orange)
    4: '#FFFF00',  // ×10K (Yellow)
    5: '#00FF00',  // ×100K (Green)
    6: '#0000FF',  // ×1M (Blue)
} as const;

interface ResistorProps {
    componentID: string;
}

const calculateColorBands = (value: number, unit: string): [string, string, string, string] => {
    // Convert to base ohms
    let ohms = value;
    switch (unit) {
        case 'kΩ':
            ohms *= 1000;
            break;
        case 'MΩ':
            ohms *= 1000000;
            break;
    }

    // Convert to string and pad with leading zeros to ensure at least three digits
    const ohmsString = ohms.toFixed(0).padStart(3, '0');

    // Extract the first three digits
    const firstDigit = parseInt(ohmsString[0], 10);
    const secondDigit = parseInt(ohmsString[1], 10);
    const thirdDigit = parseInt(ohmsString[2], 10);

    // Calculate the multiplier as the length of the number minus 3
    const multiplier = ohmsString.length - 3;

    return [
        RESISTOR_COLORS[firstDigit],
        RESISTOR_COLORS[secondDigit],
        RESISTOR_COLORS[thirdDigit],
        MULTIPLIER_COLORS[multiplier] || MULTIPLIER_COLORS[0],
    ];
};

export const Resistor: React.FC<ResistorProps> = ({ componentID }) => {
    const { components } = useSimulatorContext();
    const component = components[componentID] as ResistorComponent;

    if (!component) {
        console.error(`Component with ID ${componentID} not found.`);
        return null;
    }

    const { dimensions, properties } = component;
    const resistance = properties.value as number;
    const unit = properties.unit as string;

    const colorBands = useMemo(() =>
        calculateColorBands(resistance, unit),
        [resistance, unit]
    );

    // Calculate band dimensions and spacing
    const bandWidth = dimensions.width / 12;
    const bandSpacing = dimensions.width / 6;
    const bodyColor = '#E8C49C';

    return (
        <BaseComponent componentID={componentID}>
            {/* Leads */}
            <Line
                points={[
                    0, dimensions.height / 2,
                    -dimensions.width / 6, dimensions.height / 2
                ]}
                stroke="gray"
                strokeWidth={1}
                lineCap="round"
            />
            <Line
                points={[
                    dimensions.width, dimensions.height / 2,
                    dimensions.width + dimensions.width / 6, dimensions.height / 2
                ]}
                stroke="gray"
                strokeWidth={1}
                lineCap="round"
            />
            {/* Resistor body */}
            <Rect
                width={dimensions.width}
                height={dimensions.height}
                fill={bodyColor}
                cornerRadius={dimensions.height / 4}
            />

            {/* Color bands */}
            <Group x={dimensions.width / 5}>
                {colorBands.map((color, index) => (
                    <Rect
                        key={index}
                        x={index * bandSpacing}
                        y={0}
                        width={bandWidth}
                        height={dimensions.height}
                        fill={color}
                    />
                ))}
            </Group>
        </BaseComponent>
    );
};