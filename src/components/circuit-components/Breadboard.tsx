import { BreadboardComponent, PIN_SPACING, REGULAR_SECTION_WIDTH } from '@/types/components/breadboard';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { BaseComponent } from './BaseComponent';
import { Rect, Text } from 'react-konva';
import React, { useMemo } from 'react';

const CONNECTOR_COLORS = {
    positive: {
        outer: '#ff9999',
        inner: '#dd7777'
    },
    negative: {
        outer: '#99ccff',
        inner: '#77aadd'
    },
    bidirectional: {
        outer: '#e0e0e0',
        inner: '#c0c0c0'
    }
};

const REGULAR_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

interface BreadboardProps {
    componentID: string;
}

const PinHole: React.FC<{
    x: number;
    y: number;
    type: 'positive' | 'negative' | 'bidirectional';
}> = ({ x, y, type }) => (
    <>
        <Rect
            x={x - PIN_SPACING / 2}
            y={y - PIN_SPACING / 2}
            width={PIN_SPACING}
            height={PIN_SPACING}
            fill={CONNECTOR_COLORS[type].outer}
        />
        <Rect
            x={x - (PIN_SPACING / 2 - 1)}
            y={y - (PIN_SPACING / 2 - 1)}
            width={PIN_SPACING - 2}
            height={PIN_SPACING - 2}
            fill={CONNECTOR_COLORS[type].inner}
        />
    </>
);

const PinLabel: React.FC<{
    x: number;
    y: number;
    text: string;
    colour?: string;
}> = ({ x, y, text, colour = 'black' }) => (
    <Text
        x={x}
        y={y}
        text={text}
        fontSize={3}
        fontFamily="monospace"
        fill={colour}
    />
);

const generatePowerLabels = () => {
    const labels: JSX.Element[] = [];
    for (let i = 0; i < 4; i++) {
        const x = i * PIN_SPACING * 2;
        labels.push(
            <PinLabel key={`power-${i}-`} x={x - 1 + 60 * i + (PIN_SPACING * 2) * i} y={-5} text="-" colour={CONNECTOR_COLORS.negative.outer} />,
            <PinLabel key={`power-${i}+`} x={x + PIN_SPACING - 1 + 60 * i + (PIN_SPACING * 2) * i} y={-5} text="+" colour={CONNECTOR_COLORS.positive.outer} />
        );
    }
    return labels;
};

const generateRegularLabels = () => {
    const labels: JSX.Element[] = [];
    for (let section = 0; section < 3; section++) {
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 5; j++) {
                const LETTER_OFFSET = (PIN_SPACING * 3 - 1);
                const x = ((7 * i + j) * PIN_SPACING) + LETTER_OFFSET + section * (REGULAR_SECTION_WIDTH + PIN_SPACING * 4);
                labels.push(
                    <PinLabel key={`regular-${section}-${i}-${j}`} x={x} y={-5} text={REGULAR_LABELS[j + 5 * i]} colour='gray' />
                );
            }
        }
    }
    return labels;
};

export const Breadboard: React.FC<BreadboardProps> = ({ componentID }) => {
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
            ...generateRegularLabels()
        ];
    }, []);

    return (
        <BaseComponent componentID={componentID}>
            <Rect
                x={-12.5}
                y={-7.5}
                width={component.dimensions.width + 30}
                height={component.dimensions.height + 10}
                fill={'lightgrey'}
                cornerRadius={2}
                stroke={'rgba(143,217,251, 0.5)'}
                strokeEnabled={selectedComponent === componentID}
            />
            <Rect
                x={0}
                y={-2.5}
                width={component.dimensions.width}
                height={component.dimensions.height}
                fill={'rgba(200, 200, 200)'}
            />
            {labels}
            {connectorPins}
        </BaseComponent>
    );
};

export default Breadboard;