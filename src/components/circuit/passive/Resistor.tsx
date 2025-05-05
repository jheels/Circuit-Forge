import React from 'react';
import { Line, Rect, Group, Circle } from 'react-konva';
import { ResistorComponent } from '@/definitions/components/resistor';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { BaseComponent } from '../base/BaseComponent';
import { ComponentProps } from '@/definitions/general';

/**
 * 
 * @param value resistance value
 * @param unit resistance unit
 * @description Converts resistance value to base units (Ohms).
 * @returns resistance in base units
 */
export const convertToBaseUnits = (value: number, unit: string): number => {
    switch (unit) {
        case 'kΩ':
            return value * 1000;
        case 'MΩ':
            return value * 1000000;
        default:
            return value;
    }
};

/**
 * 
 * @param resistance resistance value in Ohms
 * @description Calculates the color bands for a resistor based on its resistance value.
 * The first three digits of the resistance value are used to determine the color bands,
 * and the multiplier is determined by the number of digits in the resistance value.
 * @returns {string[]} array of color codes for the resistor bands
 */
export const calculateColorBands = (resistance: number): string[] => {

    // Standard resistor color codes
    const RESISTOR_COLOURS: Record<number, string> = {
        0: '#000000', // Black
        1: '#964B00', // Brown
        2: '#FF0000', // Red
        3: '#FFA500', // Orange
        4: '#FFFF00', // Yellow
        5: '#00FF00', // Green
        6: '#0000FF', // Blue
        7: '#800080', // Violet
        8: '#808080', // Grey
        9: '#FFFFFF', // White
    };

    // Multiplier values and their corresponding colors
    const MULTIPLIER_COLOURS: Record<number, string> = {
        0: '#000000',  // ×1 (Black)
        1: '#964B00',  // ×10 (Brown)
        2: '#FF0000',  // ×100 (Red)
        3: '#FFA500',  // ×1K (Orange)
        4: '#FFFF00',  // ×10K (Yellow)
        5: '#00FF00',  // ×100K (Green)
        6: '#0000FF',  // ×1M (Blue)
    };

    // Convert to string and pad with leading zeros to ensure at least three digits
    const resistanceAsString = resistance.toFixed(0).padStart(3, '0');

    // Extract the first three digits
    const firstDigit = parseInt(resistanceAsString[0], 10);
    const secondDigit = parseInt(resistanceAsString[1], 10);
    const thirdDigit = parseInt(resistanceAsString[2], 10);

    // Calculate the multiplier as the length of the number minus 3
    const multiplier = Math.max(0, resistanceAsString.length - 3);
    return [
        RESISTOR_COLOURS[firstDigit],
        RESISTOR_COLOURS[secondDigit],
        RESISTOR_COLOURS[thirdDigit],
        MULTIPLIER_COLOURS[multiplier] || MULTIPLIER_COLOURS[0],
    ];
};

/**
 * 
 * @param componentID ID of the resistor component
 * @description Resistor component for the simulator.
 * @see ResistorComponent
 * @see BaseComponent
 * @returns {JSX.Element} - The rendered resistor component.
 */
export const Resistor: React.FC<ComponentProps> = ({ componentID }) => {
    const { components, selectedComponent, componentElectricalValues } = useSimulatorContext();
    const component = components[componentID] as ResistorComponent;

    if (!component) {
        console.error(`Component with ID ${componentID} not found.`);
        return null;
    }

    const { dimensions, properties } = component;

    // Retrieve the electrical values for the component if available
    const electricalValues = componentElectricalValues[componentID]?.[0] || { voltage: 0, current: 0 };
    const { current } = electricalValues;

    const resistance = properties.value as number;
    const unit = properties.unit as string;
    const standardisedResistance = convertToBaseUnits(resistance, unit);

    // Calculate power dissipation using P = I²R
    const power = current * current * standardisedResistance;
    const ratedPower = 0.25; // Default to 0.25W
    const powerRatio = power / ratedPower;

    // Determine resistor state based on power ratio
    const isHot = powerRatio >= 0.75 && powerRatio < 1.0;
    const isOverheating = powerRatio >= 1.0 && powerRatio < 1.5;
    const hasFailed = powerRatio >= 1.5;

    const bodyColour = '#E8C49C'; // beige

    // Calculate band dimensions and spacing
    const bandWidth = dimensions.width / 12;
    const bandSpacing = dimensions.width / 6;

    // Get color bands based on resistor value
    const colorBands = calculateColorBands(standardisedResistance);

    // Render thermal overlay based on power ratio
    const renderThermalOverlay = () => {
        if (powerRatio < 0.5) return null;

        let overlayColor;
        let opacity;

        if (hasFailed) {
            // Failure state - dark brown/black
            overlayColor = "rgb(40, 30, 20)";
            opacity = 0.7;
        } else if (isOverheating) {
            // Overheating - red
            overlayColor = "rgb(255, 50, 20)";
            opacity = 0.3 + (powerRatio - 1.0) * 0.4; // 0.3 to 0.5
        } else if (isHot) {
            // Hot - orange
            overlayColor = "rgb(255, 120, 20)";
            opacity = 0.2 + (powerRatio - 0.75) * 0.4; // 0.2 to 0.3
        } else {
            // Warm - yellow
            overlayColor = "rgb(255, 200, 20)";
            opacity = 0.1 + (powerRatio - 0.5) * 0.4; // 0.1 to 0.2
        }

        return (
            <Rect
                width={dimensions.width}
                height={dimensions.height}
                fill={overlayColor}
                opacity={opacity}
                cornerRadius={dimensions.height / 4}
            />
        );
    };

    // Render glow effect based on power ratio
    const renderGlowEffect = () => {
        if (powerRatio < 0.5) return null;
        if (hasFailed) return null;

        let glowColor;
        let intensity;

        if (isOverheating) {
            // Overheating - red glow
            glowColor = "rgba(255, 30, 0, ";
            intensity = 0.2 + (powerRatio - 1.0) * 0.1; // 0.2 to 0.25
        } else if (isHot) {
            // Hot - orange glow
            glowColor = "rgba(255, 100, 0, ";
            intensity = 0.15 + (powerRatio - 0.75) * 0.2; // 0.15 to 0.2
        } else {
            // Warm - yellow glow
            glowColor = "rgba(255, 180, 0, ";
            intensity = 0.1 + (powerRatio - 0.5) * 0.2; // 0.1 to 0.15
        }

        const glowRadius = dimensions.width * 0.75;

        // Similar to LED glow effect
        return (
            <Circle
                x={dimensions.width / 2}
                y={dimensions.height / 2}
                radius={glowRadius}
                fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                fillRadialGradientStartRadius={0}
                fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                fillRadialGradientEndRadius={glowRadius}
                fillRadialGradientColorStops={[
                    0, glowColor + (intensity * 0.8) + ")",
                    0.5, glowColor + (intensity * 0.4) + ")",
                    1, glowColor + "0)"
                ]}
                listening={false}
            />
        );
    };

    return (
        <BaseComponent componentID={componentID}>
            {renderGlowEffect()}
            {/* Resistor leads */}
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
                fill={bodyColour}
                cornerRadius={dimensions.height / 4}
                stroke={'rgba(143,217,251, 0.5)'}
                strokeEnabled={selectedComponent === componentID}
                strokeWidth={0.5}
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
            {renderThermalOverlay()}
        </BaseComponent>
    );
};