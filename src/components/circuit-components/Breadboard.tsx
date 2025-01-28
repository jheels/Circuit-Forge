/**
 * TODO:
 * - Add pin labels
 * - Add strip highlighting
 * - replace magic number
 */

import { BreadboardComponent } from '@/types/components/breadboard';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { BaseComponent } from './BaseComponent';
import { Rect } from 'react-konva';
import React, { useMemo } from 'react';


const PIN_SIZE = 5;

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

interface BreadboardProps {
    componentID: string;
}

const PinHole: React.FC<{
    x: number;
    y: number;
    type: 'positive' | 'negative' | 'bidirectional';
}> = ({ x, y, type }) => {
    return (
        <>
            <Rect
                x={x - PIN_SIZE / 2}
                y={y - PIN_SIZE / 2}
                width={PIN_SIZE}
                height={PIN_SIZE}
                fill={CONNECTOR_COLORS[type].outer}
            />
            <Rect
                x={x - (PIN_SIZE / 2 - 1)}
                y={y - (PIN_SIZE / 2 - 1)}
                width={PIN_SIZE - 2}
                height={PIN_SIZE - 2}
                fill={CONNECTOR_COLORS[type].inner}
            />
        </>
    )
}

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
            {connectorPins}
        </BaseComponent>
    )
};