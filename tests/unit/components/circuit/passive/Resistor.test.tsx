import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Resistor, calculateColorBands, convertToBaseUnits } from '@/components/circuit/passive/Resistor';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { ResistorComponent } from '@/definitions/components/resistor';

// tests/unit/components/circuit/passive/Resistor.test.tsx

// mock SimulatorContext
vi.mock('@/context/SimulatorContext', () => ({
    useSimulatorContext: vi.fn()
}));
// mock BaseComponent
vi.mock('@/components/circuit/base/BaseComponent', () => ({
    BaseComponent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="base">{children}</div>
    )
}));
// mock react-konva shapes
vi.mock('react-konva', () => ({
    Line: (props: any) => <div data-testid="line" {...props} />,
    Rect: (props: any) => <div data-testid="rect" {...props} />,
    Group: (props: any) => <div data-testid="group" {...props} />,
    Circle: (props: any) => <div data-testid="circle" {...props} />
}));

const WIDTH = 15;
const HEIGHT = 2.5;
const BASE_PROPS = {
    editorID: 'R-1',
    type: 'resistor' as const,
    dimensions: { width: WIDTH, height: HEIGHT },
    rotation: 0,
    position: { x: 0, y: 0 },
    properties: { value: 1000, unit: 'Ω', label: 'R1' },
    connectors: {}
} satisfies ResistorComponent;

const makeCtx = (current: number) => ({
    components: { 'R-1': BASE_PROPS },
    selectedComponent: null as string | null,
    componentElectricalValues: { 'R-1': [{ voltage: current * BASE_PROPS.properties.value, current }] }
});

describe('convertToBaseUnits extra cases', () => {
    it('returns same for unknown unit', () => {
        expect(convertToBaseUnits(47, 'Ω')).toBe(47);
        expect(convertToBaseUnits(47, 'X')).toBe(47);
    });
    it('works with fractional kΩ and MΩ', () => {
        expect(convertToBaseUnits(2.5, 'kΩ')).toBe(2500);
        expect(convertToBaseUnits(0.001, 'MΩ')).toBe(1000);
    });
});

describe('calculateColorBands extra cases', () => {
    it('maps 47 Ω to Yellow, Violet, Black, Black', () => {
        const bands = calculateColorBands(47);
        expect(bands).toEqual(['#000000', '#FFFF00', '#800080', '#000000']);
    });
    it('pads single digit correctly', () => {
        // 5 -> "005"
        expect(calculateColorBands(5)).toEqual(['#000000', '#000000', '#00FF00', '#000000']);
    });
    it('handles very large numbers beyond multiplier map', () => {
        // multiplierIndex > 6 should fallback to black
        const bands = calculateColorBands(1e10);
        expect(bands[3]).toBe('#000000');
    });
});

describe('Resistor component extra rendering tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders leads, body, bands inside BaseComponent', () => {
        (useSimulatorContext as any).mockReturnValue(makeCtx(0));
        const { getAllByTestId, getByTestId } = render(<Resistor componentID="R-1" />);
        expect(getByTestId('base')).toBeTruthy();
        expect(getAllByTestId('line')).toHaveLength(2);
        // body + 4 bands + group + no overlay/glow
        const rects = getAllByTestId('rect');
        expect(rects.length).toBe(5);
        // group x should equal width/5 = 3
        const group = getByTestId('group');
        expect(group).toHaveAttribute('x', String(WIDTH / 5));
    });


    it('renders warm overlay for powerRatio between .5 and .75', () => {
        // choose current so that powerRatio = 0.6 => current = sqrt(0.6*0.25/1000)
        const current = Math.sqrt((0.6 * 0.25) / BASE_PROPS.properties.value);
        (useSimulatorContext as any).mockReturnValue(makeCtx(current));
        const { getAllByTestId } = render(<Resistor componentID="R-1" />);
        const overlays = getAllByTestId('rect').filter(r => r !== undefined && !r.hasAttribute('strokeEnabled') && r.getAttribute('fill')?.includes('255, 200, 20'));
        expect(overlays.length).toBe(1);
        const opacity = parseFloat(overlays[0].getAttribute('opacity') || '0');
        expect(opacity).toBeGreaterThanOrEqual(0.1);
        expect(opacity).toBeLessThanOrEqual(0.2);
    });

    it('renders overheating glow and overlay', () => {
        // powerRatio = 1.2
        const current = Math.sqrt((1.2 * 0.25) / BASE_PROPS.properties.value);
        (useSimulatorContext as any).mockReturnValue(makeCtx(current));
        const { getAllByTestId } = render(<Resistor componentID="R-1" />);
        // one circle glow
        expect(getAllByTestId('circle').length).toBe(1);
        // one overlay rect with red fill
        const redOverlay = getAllByTestId('rect').find(r => r.getAttribute('fill')?.includes('255, 50, 20'));
        expect(redOverlay).toBeTruthy();
    });

    it('renders no glow when failed but still overlay dark', () => {
        // powerRatio = 1.6
        const current = Math.sqrt((1.6 * 0.25) / BASE_PROPS.properties.value);
        (useSimulatorContext as any).mockReturnValue(makeCtx(current));
        const { queryByTestId, getAllByTestId } = render(<Resistor componentID="R-1" />);
        expect(queryByTestId('circle')).toBeNull();
        const darkOverlay = getAllByTestId('rect').find(r => r.getAttribute('fill') === 'rgb(40, 30, 20)');
        expect(darkOverlay).toBeTruthy();
    });
});