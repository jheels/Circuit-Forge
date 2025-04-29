import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PowerSupply } from '@/components/circuit/active/PowerSupply';
import { SimulatorContextType, SimulatorContext } from '@/context/SimulatorContext';
import { PowerSupplyComponent } from '@/definitions/components/powerSupply';

// Mock Konva components
vi.mock('react-konva', () => ({
    Rect: ({ children, ...props }: any) => <div data-testid="Rect" {...props}>{children}</div>,
    Text: ({ children, ...props }: any) => <div data-testid="Text" {...props}>{children}</div>,
    Circle: ({ children, ...props }: any) => <div data-testid="Circle" {...props}>{children}</div>,
    Group: ({ children, ...props }: any) => <div data-testid="Group" {...props}>{children}</div>,
}));

describe('PowerSupply Component', () => {
    const mockContext: SimulatorContextType = {
        projectName: 'Test Project',
        components: {
            'power-supply-1': {
                editorID: 'power-supply-1',
                type: 'power-supply',
                properties: { voltage: 5 },
                dimensions: { width: 100, height: 50 },
                connectors: {},
                position: { x: 0, y: 0 },
                rotation: 0
            } as PowerSupplyComponent,
        },
        componentElectricalValues: {
            'power-supply-1': {
                0: { voltage: 5, current: 0.5 },
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

    const renderWithContext = (componentID: string) => {
        return render(
            <SimulatorContext.Provider value={mockContext}>
                <PowerSupply componentID={componentID} />
            </SimulatorContext.Provider>
        );
    };

    it('renders the PowerSupply component with correct attributes', () => {
        const { getAllByTestId } = renderWithContext('power-supply-1');

        const bodies = getAllByTestId('Rect');
        expect(bodies.some(body => 
            body.getAttribute('width') === '100' &&
            body.getAttribute('height') === '50' &&
            body.getAttribute('fill') === '#e0e0e0' &&
            body.getAttribute('stroke') === '#999999'
        )).toBe(true);

        // Check voltage display
        const voltageDisplays = getAllByTestId('Text');
        expect(voltageDisplays.some(voltageDisplay => 
            voltageDisplay.getAttribute('text') === '5.00V'
        )).toBe(true);

        // Check current display
        expect(voltageDisplays.some(currentDisplay => 
            currentDisplay.getAttribute('text') === '500.00mA'
        )).toBe(true);

        // Check circles
        const circles = getAllByTestId('Circle');
        expect(circles.length).toBeGreaterThan(0);
    });

    it('handles missing component gracefully', () => {
        const { queryByTestId } = renderWithContext('non-existent-id');
        expect(queryByTestId('Rect')).toBeNull();
    });
});