import { render, fireEvent } from '@testing-library/react';
import { Wire } from '@/components/circuit/passive/Wire';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { EditorComponent, Point } from '@/definitions/general';
import { Connector, ConnectorType } from '@/definitions/connector';
import { Connection } from '@/definitions/connection';
import { vi, describe, beforeEach, it, expect } from 'vitest';

// Mock react-konva components
vi.mock('react-konva', () => ({
    Line: (props: any) => <div data-testid="Line" {...props} />,
    Circle: (props: any) => <div data-testid="Circle" {...props} />,
    Group: (props: any) => <div data-testid="Group" {...props} />,
}));

// Mock context
vi.mock('@/context/SimulatorContext');

const mockConnector = (id: string, componentID: string, type: ConnectorType, offset: { x: number; y: number }): Connector => ({
    id,
    componentID,
    type,
    offset,
    hitAreaSize: 2.5,
    isConnected: false,
});

const mockComponent: EditorComponent = {
    editorID: 'comp1',
    type: 'test',
    dimensions: { width: 10, height: 10 },
    rotation: 0,
    position: { x: 0, y: 0 },
    properties: {},
    connectors: {
        'conn1': mockConnector('conn1', 'comp1', 'input', { x: 0.1, y: 0.1 }),
        'conn2': mockConnector('conn2', 'comp1', 'output', { x: 0.9, y: 0.9 }),
    },
};

const mockWire = {
    id: 'wire1',
    startConnector: mockComponent.connectors['conn1'],
    endConnector: mockComponent.connectors['conn2'],
    points: [
        { x: 1, y: 1 },
        { x: 9, y: 9 },
    ] as Point[],
};

const mockConnection: Connection = {
    id: 'connection1',
    sourceConnector: mockComponent.connectors['conn1'],
    targetConnector: mockComponent.connectors['conn2'],
    type: 'wire',
    metadata: {
        wireID: 'wire1',
        stripID: 'strip1',
    },
};

const setupContext = (overrides: Partial<ReturnType<typeof useSimulatorContext>> = {}) => {
    (useSimulatorContext as vi.Mock).mockReturnValue({
        wires: { wire1: mockWire },
        components: { comp1: mockComponent },
        connections: { connection1: mockConnection },
        selectedWire: null,
        setSelectedWire: vi.fn(),
        setSelectedComponent: vi.fn(),
        updateWire: vi.fn(),
        removeWire: vi.fn(),
        setHoveredConnectorID: vi.fn(),
        removeConnection: vi.fn(),
        addConnection: vi.fn(),
        getConnectorConnection: vi.fn(),
        ...overrides,
    });
};

describe('Wire component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders wire lines and circles when selected', () => {
        setupContext({ selectedWire: 'wire1' });
        const { getAllByTestId } = render(<Wire wireID="wire1" />);
        expect(getAllByTestId('Line').length).toBeGreaterThan(0);
        expect(getAllByTestId('Circle').length).toBe(2);
    });

    it('renders wire lines and no circles when not selected', () => {
        setupContext({ selectedWire: null });
        const { getAllByTestId, queryAllByTestId } = render(<Wire wireID="wire1" />);
        expect(getAllByTestId('Line').length).toBeGreaterThan(0);
        expect(queryAllByTestId('Circle').length).toBe(0);
    });

    it('calls setSelectedWire and setSelectedComponent on click', () => {
        const setSelectedWire = vi.fn();
        const setSelectedComponent = vi.fn();
        setupContext({ setSelectedWire, setSelectedComponent });
        const { getByTestId } = render(<Wire wireID="wire1" />);
        fireEvent.click(getByTestId('Group'));
        expect(setSelectedWire).toHaveBeenCalled();
        expect(setSelectedComponent).toHaveBeenCalledWith(null);
    });

    it('changes cursor on mouse enter/leave', () => {
        setupContext();
        const { getByTestId } = render(<Wire wireID="wire1" />);
        const group = getByTestId('Group');
        fireEvent.mouseEnter(group);
        expect(document.body.style.cursor).toBe('pointer');
        fireEvent.mouseLeave(group);
        expect(document.body.style.cursor).toBe('default');
    });

    it('removes wire on Backspace keydown when selected', () => {
        const removeWire = vi.fn();
        const setSelectedWire = vi.fn();
        setupContext({ selectedWire: 'wire1', removeWire, setSelectedWire });
        render(<Wire wireID="wire1" />);
        const event = new KeyboardEvent('keydown', { key: 'Backspace' });
        window.dispatchEvent(event);
        expect(removeWire).toHaveBeenCalledWith('wire1');
        expect(setSelectedWire).toHaveBeenCalledWith(null);
    });

    it('does not remove wire on Backspace if not selected', () => {
        const removeWire = vi.fn();
        setupContext({ selectedWire: null, removeWire });
        render(<Wire wireID="wire1" />);
        const event = new KeyboardEvent('keydown', { key: 'Backspace' });
        window.dispatchEvent(event);
        expect(removeWire).not.toHaveBeenCalled();
    });

    it('does not call updateWire on drag start and drag move if valid connector not found', () => {
        const updateWire = vi.fn();
        setupContext({ selectedWire: 'wire1', updateWire });
        const { getAllByTestId } = render(<Wire wireID="wire1" />);
        const circles = getAllByTestId('Circle');
        fireEvent.mouseDown(circles[0]);
        fireEvent.mouseMove(circles[0], { clientX: 100, clientY: 100 });
        
        expect(updateWire).not.toHaveBeenCalled();
    });
});