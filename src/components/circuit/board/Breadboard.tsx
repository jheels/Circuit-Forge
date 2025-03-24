import React, { useMemo } from 'react';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { BaseComponent } from '../base/BaseComponent';
import { Rect, Text } from 'react-konva';
import {
    BreadboardComponent,
    PIN_SPACING,
    REGULAR_SECTION_WIDTH,
    BOARD_ROWS
} from '@/types/components/breadboard';
import { ComponentProps } from '@/types/general';


const CONNECTOR_COLORS = {
    positive: {
        outer: '#ff9999',
    },
    negative: {
        outer: '#99ccff',
    },
    bidirectional: {
        outer: '#e0e0e0',
    }
};

const REGULAR_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

const PinHole: React.FC<{
    x: number;
    y: number;
    type: 'positive' | 'negative' | 'bidirectional';
}> = ({ x, y, type }) => (
        <Rect
            x={x - PIN_SPACING / 2}
            y={y - PIN_SPACING / 2}
            width={PIN_SPACING}
            height={PIN_SPACING}
            fill={CONNECTOR_COLORS[type].outer}
            stroke={'gray'}
            strokeWidth={0.25}
            listening={false}
        />
);

const PinLabel: React.FC<{
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

const generatePowerLabels = () => {
    const labels: JSX.Element[] = [];
    for (let i = 0; i < 4; i++) {
        const x = PIN_SPACING * (16 * i) - 2.5;
        labels.push(
            <PinLabel key={`power-${i}-`} x={x} y={-PIN_SPACING} text="-" colour={CONNECTOR_COLORS.negative.outer} />,
            <PinLabel key={`power-${i}+`} x={x + PIN_SPACING} y={-PIN_SPACING} text="+" colour={CONNECTOR_COLORS.positive.outer} />
        );
    }
    return labels;
};

const generateRegularLabels = () => {
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

export const Breadboard: React.FC<ComponentProps> = ({ componentID }) => {
    const { components, selectedComponent } = useSimulatorContext();
    const component = components[componentID] as BreadboardComponent;

    const connectorPins = useMemo(() => {
        const { connectors, dimensions } = component;

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