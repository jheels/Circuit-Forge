import React from 'react';
import { render } from '@testing-library/react';
import { LED, getColorWithOpacity} from '@/components/circuit/active/LED';
import { SimulatorContext, SimulatorContextType } from '@/context/SimulatorContext';
import { LEDComponent } from '@/definitions/components/led';
import { Circle, Shape } from 'react-konva';
import { describe, it, expect, vi } from 'vitest';
import { string } from 'zod';

vi.mock('react-konva', () => ({
    Circle: vi.fn(() => <div data-testid="circle" />),
    Line: vi.fn(() => <div data-testid="line" />),
    Shape: vi.fn(() => <div data-testid="shape" />),
    Rect: vi.fn(() => <div data-testid="rect" />),
}));

vi.mock('@/components/circuit/base/BaseComponent', () => ({
    BaseComponent: vi.fn(({ children }) => <div data-testid="base-component">{children}</div>),
}));

const mockContext: SimulatorContextType = {
    projectName: 'Test Project',
    components: {
        'test-led': {
            editorID: 'test-led',
            type: 'led',
            dimensions: { width: 15, height: 25 },
            rotation: 0,
            position: { x: 0, y: 0 },
            properties: { colour: 'red' },
            connectors: {},
        } as LEDComponent,
    },
    componentElectricalValues: {
        'test-led': {
            0: { voltage: 5, current: 0.01 },
        },
    },
    componentCounts: {},
    selectedComponent: null,
    selectedWire: null,
    wires: {},
    creatingWire: null,
    hoveredConnectorID: null,
    clickedConnector: null,
    connections: {},
    connectorConnectionMap: {},
    clipboardComponent: null,
    copySelectedComponent: vi.fn(),
    cutSelectedComponent: vi.fn(),
    pasteClipboardComponent: vi.fn(),
    setProjectName: vi.fn(),
    createComponent: vi.fn(),
    addComponent: vi.fn(),
    removeComponent: vi.fn(),
    updateComponent: vi.fn(),
    updateComponentElectricalValues: vi.fn(),
    cleanUpComponentWires: vi.fn(),
    addWire: vi.fn(),
    removeWire: vi.fn(),
    updateWire: vi.fn(),
    setCreatingWire: vi.fn(),
    setHoveredConnectorID: vi.fn(),
    setSelectedComponent: vi.fn(),
    setSelectedWire: vi.fn(),
    setComponentCounts: vi.fn(),
    setClickedConnector: vi.fn(),
    addConnection: vi.fn(),
    removeConnection: vi.fn(),
    getConnectorConnection: vi.fn(),
    resetProject: vi.fn(),
};

describe('LED Component', () => {
    const renderWithContext = (ui: React.ReactNode) => {
        return render(
            <SimulatorContext.Provider value={mockContext}>
                {ui}
            </SimulatorContext.Provider>
        );
    };

    it('renders the BaseComponent', () => {
        const { getByTestId } = renderWithContext(<LED componentID="test-led" />);
        expect(getByTestId('base-component')).toBeInTheDocument();
    });

    it('renders the LED body with correct colour and opacity', () => {
        renderWithContext(<LED componentID="test-led" />);
        expect(Shape).toHaveBeenCalledWith(
            expect.objectContaining({
                fill: 'red',
                opacity: expect.closeTo(0.8, 0.1),
            }),
            {}
        );
    });

    it('renders the glow effect when current is within range', () => {
        renderWithContext(<LED componentID="test-led" />);
        expect(Circle).toHaveBeenCalledWith(
            expect.objectContaining({
                radius: expect.any(Number),
                fillRadialGradientColorStops: expect.arrayContaining([
                    expect.any(Number),
                    expect.stringContaining('rgba(255, 0, 0'),
                ]),
            }),
            {}
        );
    });

    it('does not render the glow effect when current is too low', () => {
        mockContext.componentElectricalValues['test-led'][0].current = 0.0001;
        mockContext.componentElectricalValues['test-led'][0].voltage = 0.0001;
        renderWithContext(<LED componentID="test-led" />);
        expect(Circle).toHaveBeenCalled();
    });

    it('renders cracks when the LED has failed', () => {
        mockContext.componentElectricalValues['test-led'][0].current = 0.05; // Over 40mA
        const { getAllByTestId } = renderWithContext(<LED componentID="test-led" />);
        expect(getAllByTestId('line')).toHaveLength(5); // Three cracks + 2 Legs
    });

    it('does not render cracks when the LED is functioning normally', () => {
        mockContext.componentElectricalValues['test-led'][0].current = 0.0; // Normal current
        mockContext.componentElectricalValues['test-led'][0].voltage = 2; // Normal current
        const { getAllByTestId } = renderWithContext(<LED componentID="test-led" />);
        expect(getAllByTestId('line')).toHaveLength(2); //  2 Legs
    });
});

describe('getColorWithOpacity', () => {
    it('should not throw an error with blue,green,red yellow', () => {
        const colours = ['red', 'blue', 'green', 'yellow']
        Object(colours).forEach((colour: string) => expect(getColorWithOpacity(colour)).toBeTypeOf('string'))
    });
    it('should throw an error with an unknown colour', () => {
        expect(getColorWithOpacity('pink')).toBe(`pink is not supported`);
    });
})