import { render, fireEvent } from '@testing-library/react';
import { BaseComponent } from '@/components/circuit/base/BaseComponent';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { useSnapManagement } from '@/hooks/ui/useSnapManagement';
import { useWireUpdates } from '@/hooks/ui/useWireUpdates';
import { useConnectorManagement } from '@/hooks/circuit/useConnectorManagement';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Connector } from '@/definitions/connector';

vi.mock('@/context/SimulatorContext');
vi.mock('@/hooks/ui/useSnapManagement');
vi.mock('@/hooks/ui/useWireUpdates');
vi.mock('@/hooks/circuit/useConnectorManagement');

vi.mock('react-konva', () => ({
    Group: ({ children, ...props }: any) => <div data-testid="Group" {...props}>{children}</div>,
    Rect: ({ children, ...props }: any) => <div data-testid="Rect" {...props}>{children}</div>,
}));

describe('BaseComponent', () => {
    const mockSimulatorContext = {
        components: {
            testComponent: {
                position: { x: 100, y: 100 },
                connectors: {},
                dimensions: { width: 50, height: 50 },
                rotation: 0,
                type: 'resistor',
            },
        },
        connections: {},
        wires: {},
        hoveredConnectorID: null,
        creatingWire: null,
        componentElectricalValues: {},
        updateComponent: vi.fn(),
        setSelectedComponent: vi.fn(),
        setHoveredConnectorID: vi.fn(),
        setSelectedWire: vi.fn(),
        setCreatingWire: vi.fn(),
        addWire: vi.fn(),
        updateWire: vi.fn(),
        removeWire: vi.fn(),
        addConnection: vi.fn(),
        removeConnection: vi.fn(),
        setClickedConnector: vi.fn(),
        getConnectorConnection: vi.fn(),
    };

    const mockSnapManagement = {
        snapState: {},
        setSnapState: vi.fn(),
        handleDragMove: vi.fn((callback) => callback({ x: 150, y: 150 })),
    };

    const mockWireUpdates = vi.fn();
    const mockConnectorManagement = {
        handleConnectorClick: vi.fn(),
        updateConnectionsOnDrop: vi.fn(),
    };

    beforeEach(() => {
        (useSimulatorContext as vi.Mock).mockReturnValue(mockSimulatorContext);
        (useSnapManagement as vi.Mock).mockReturnValue(mockSnapManagement);
        (useWireUpdates as vi.Mock).mockReturnValue(mockWireUpdates);
        (useConnectorManagement as vi.Mock).mockReturnValue(mockConnectorManagement);
    });

    it('renders correctly with children', () => {
        const { getByText } = render(
            <BaseComponent componentID="testComponent">
                <div>Child Component</div>
            </BaseComponent>
        );

        expect(getByText('Child Component')).toBeInTheDocument();
    });

    it('handles selection on click', () => {
        const { getAllByTestId } = render(
            <BaseComponent componentID="testComponent">
                <div>Child Component</div>
            </BaseComponent>
        );

        const groups = getAllByTestId('Group');
        fireEvent.click(groups[0]);

        expect(mockSimulatorContext.setSelectedComponent).toHaveBeenCalledWith(expect.any(Function));
        expect(mockSimulatorContext.setSelectedWire).toHaveBeenCalledWith(null);
    });

    // it('handles drag move', () => {
    //     const { getAllByTestId } = render(
    //         <BaseComponent componentID="testComponent">
    //             <div>Child Component</div>
    //         </BaseComponent>
    //     );
    //     const groups = getAllByTestId('Group');
    //     const draggableGroup = Array.from(groups).find((group: HTMLElement) => group.hasAttribute('draggable'));
    //     if (draggableGroup) {
    //         fireEvent.drag(draggableGroup, { clientX: 150, clientY: 150 });
    //     }
    //     expect(mockSnapManagement.handleDragMove).toHaveBeenCalledWith();
    // });

    it('handles drag end and updates connectors', () => {
        const { getAllByTestId } = render(
            <BaseComponent componentID="testComponent">
                <div>Child Component</div>
            </BaseComponent>
        );

        const groups = getAllByTestId('Group');
        const draggableGroup = Array.from(groups).find((group: HTMLElement) => group.hasAttribute('draggable'));
        if (draggableGroup) {
            fireEvent.dragEnd(draggableGroup);
        }
        expect(mockConnectorManagement.updateConnectionsOnDrop).toHaveBeenCalledWith(mockSnapManagement.snapState);
        expect(mockSnapManagement.setSnapState).toHaveBeenCalled();
    });

    it('handles connector click', () => {
        (mockSimulatorContext.hoveredConnectorID as any) = 'connector1';
        (mockSimulatorContext.components.testComponent.connectors as Record<string, Connector>) = {
            connector1: {
            id: 'connector1',
            componentID: 'testComponent',
            type: 'input',
            hitAreaSize: 2.5,
            offset: { x: 0.5, y: 0.5 },
            isConnected: false,
            metadata: {},
            },
        };
        const { getByTestId } = render(
            <BaseComponent componentID="testComponent">
                <div>Child Component</div>
            </BaseComponent>
        );

        const rect = getByTestId('Rect');
        fireEvent.click(rect);

        expect(mockConnectorManagement.handleConnectorClick).toHaveBeenCalledWith('connector1');
    });

    it('handles wire escape on keydown', () => {
        (mockSimulatorContext.creatingWire as any) = { id: 'wire1' };

        render(
            <BaseComponent componentID="testComponent">
                <div>Child Component</div>
            </BaseComponent>
        );

        fireEvent.keyDown(window, { key: 'Escape' });

        expect(mockSimulatorContext.removeWire).toHaveBeenCalledWith('wire1');
        expect(mockSimulatorContext.setCreatingWire).toHaveBeenCalledWith(null);
        expect(mockSimulatorContext.setClickedConnector).toHaveBeenCalledWith(null);
    });
});