import React, { useMemo } from 'react';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { BaseComponent } from '../base/BaseComponent';
import { Rect, Text } from 'react-konva';
import { ComponentProps } from '@/definitions/general';
import {
    BreadboardComponent,
    PIN_SPACING,
    REGULAR_SECTION_WIDTH,
    BOARD_ROWS
} from '@/definitions/components/breadboard';


const CONNECTOR_COLORS = {
    positive: '#ff9999',
    negative: '#99ccff',
    bidirectional: '#e0e0e0'
};

const REGULAR_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

/**
 * 
 * @param x X-coordinate on breadboard
 * @param y Y-coordinate on breadboard
 * @param type Connectors it can connect to
 * @description Pinhole on the breadboard for connectors to snap to.
 * @see Connector
 * @returns {JSX.Element} Konva object of a pinhole
 */
export const PinHole: React.FC<{
    x: number;
    y: number;
    type: 'positive' | 'negative' | 'bidirectional';
}> = ({ x, y, type }) => (
    <Rect
        x={x - PIN_SPACING / 2}
        y={y - PIN_SPACING / 2}
        width={PIN_SPACING}
        height={PIN_SPACING}
        fill={CONNECTOR_COLORS[type]}
        stroke={'gray'}
        strokeWidth={0.25}
        listening={false}
    />
);

/**
 * 
 * @param x X position of pin label
 * @param y Y position of pin label
 * @param text Which label it is
 * @param colour Colour of label
 * @returns {JSX.Element} Konva Text object of label
 */
export const PinLabel: React.FC<{
    x: number;
    y: number;
    text: string;
    colour?: string;
}> = ({ x, y, text, colour = 'gray' }) => (
    <Text
        x={x}
        y={y}
        text={text}
        fontSize={2.5}
        fontFamily="monospace"
        fill={colour}
        align='center'
        width={PIN_SPACING}
    />
);

/**
 * @description Generates Plus (+) and Minus (-) for each power rail
 * @returns {JSX.Element[]}
 */
export const generatePowerLabels = () => {
    const labels: JSX.Element[] = [];
    for (let i = 0; i < 4; i++) {
        const x = PIN_SPACING * (16 * i) - 2.5;
        labels.push(
            <PinLabel key={`power-${i}-`} x={x} y={-PIN_SPACING} text="-" colour={CONNECTOR_COLORS.negative} />,
            <PinLabel key={`power-${i}+`} x={x + PIN_SPACING} y={-PIN_SPACING} text="+" colour={CONNECTOR_COLORS.positive} />
        );
    }
    return labels;
};

/**
 * @description Generates column letters for each terminal section on breadboard.
 * @returns {JSX.Element[]} generates pin label objects
 * @see PinLabel
 */
export const generateRegularLabels = () => {
    const labels: JSX.Element[] = [];
    for (let section = 0; section < 3; section++) {
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 5; j++) {
                const LETTER_OFFSET = (PIN_SPACING * 3 - 2.5);
                const x = ((7 * i + j) * PIN_SPACING) + LETTER_OFFSET + section * (REGULAR_SECTION_WIDTH + PIN_SPACING * 4);
                labels.push(
                    <PinLabel key={`regular-${section}-${i}-${j}`} x={x} y={-PIN_SPACING} text={REGULAR_LABELS[j + 5 * i]} />
                );
            }
        }
    }
    return labels;
};

/**
 * @description Generates row numbers for each breadboard section.
 * @returns {JSX.Element[]} PinLabel objects with Konva text
 * @see PinLabel
 */
const generateRowNumbers = () => {
    const labels: JSX.Element[] = [];
    for (let section = 0; section < 3; section++) {
        const x = section * (REGULAR_SECTION_WIDTH + PIN_SPACING * 4) + 1.5 * PIN_SPACING;
        for (let i = 0; i < BOARD_ROWS; i++) {
            const y = PIN_SPACING * i - 0.75;
            labels.push(
                <PinLabel key={`row-${section}-${i}`} x={x} y={y} text={String(i + 1)} />
            );
        }
    }
    return labels;
}

/**
 * 
 * @param componentID ID of the breadboard component
 * @description Breadboard component for the simulator.
 * @see BreadboardComponent
 * @see BaseComponent
 * @returns {JSX.Element} - The rendered breadboard component.
 */
export const Breadboard: React.FC<ComponentProps> = ({ componentID }) => {
    const { components, selectedComponent } = useSimulatorContext();
    const component = components[componentID] as BreadboardComponent;

    const connectorPins = useMemo(() => {
        const { connectors, dimensions } = component;

        // Generate pinholes for each connector
        return Object.values(connectors).map((connector) => {
            const x = connector.offset.x * dimensions.width;
            const y = connector.offset.y * dimensions.height;

            return (
                <PinHole
                    key={connector.id}
                    x={x}
                    y={y}
                    type={connector.type as 'positive' | 'negative' | 'bidirectional'}
                />
            );
        });
    }, [component]);

    const labels = useMemo(() => {
        return [
            ...generatePowerLabels(),
            ...generateRegularLabels(),
            ...generateRowNumbers()
        ];
    }, []);

    return (
        <BaseComponent componentID={componentID} draggable={false}>
            <Rect
                x={-2.5 * PIN_SPACING}
                y={-1.5 * PIN_SPACING}
                width={component.dimensions.width + 6 * PIN_SPACING}
                height={component.dimensions.height + 2 * PIN_SPACING}
                fill={'lightgrey'}
                cornerRadius={2.5}
                stroke={'rgba(143,217,251, 0.5)'}
                strokeEnabled={selectedComponent === componentID}
            />
            <Rect
                x={0}
                y={-0.5 * PIN_SPACING}
                width={component.dimensions.width}
                height={component.dimensions.height}
                fill={'rgba(200, 200, 200)'}
            />
            {labels}
            {connectorPins}
        </BaseComponent>
    );
};