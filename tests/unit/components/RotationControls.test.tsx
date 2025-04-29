import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RotationControls } from '@/components/RotationControls';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { rotatePoint } from '@/lib/utils';
import { updateWirePositions } from '@/hooks/ui/useWireUpdates';
import type { Connector } from '@/definitions/connector';
import type { EditorComponent } from '@/definitions/general';

// tests/unit/components/RotationControls.test.tsx

vi.mock('@/context/SimulatorContext', () => ({
    useSimulatorContext: vi.fn()
}));
vi.mock('@/lib/utils', () => ({
    rotatePoint: vi.fn(),
    cn: vi.fn(),
}));
vi.mock('@/hooks/ui/useWireUpdates', () => ({
    updateWirePositions: vi.fn()
}));

const MOCK_ID = 'comp-1';
const WIDTH = 20;
const HEIGHT = 10;
const baseComponent: EditorComponent = {
    editorID: MOCK_ID,
    type: 'resistor',
    dimensions: { width: WIDTH, height: HEIGHT },
    rotation: 0,
    position: { x: 5, y: 5 },
    properties: {},
    connectors: {
        c1: { id: 'c1', offset: { x: 0, y: 0 }, isConnected: true } as Connector,
        c2: { id: 'c2', offset: { x: 1, y: 1 }, isConnected: true } as Connector
    }
};

const makeContext = (overrides: Partial<ReturnType<typeof useSimulatorContext>>) => ({
    selectedComponent: MOCK_ID,
    components: { [MOCK_ID]: baseComponent },
    updateComponent: vi.fn(),
    getConnectorConnection: vi.fn(),
    connections: { },
    wires: { },
    updateWire: vi.fn(),
    ...overrides
});

describe('RotationControls', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // default rotatePoint to shift by full width/height
        (rotatePoint as vi.Mock).mockImplementation(
            (_pt, origin, _angle) => ({ x: origin.x + WIDTH, y: origin.y + HEIGHT })
        );
    });

    it('renders nothing when no component is selected', () => {
        (useSimulatorContext as vi.Mock).mockReturnValue({ selectedComponent: null } as any);
        const { container } = render(<RotationControls />);
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when selected component not in context', () => {
        (useSimulatorContext as vi.Mock).mockReturnValue({ selectedComponent: 'x', components: {} } as any);
        const { container } = render(<RotationControls />);
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing for type breadboard or ic', () => {
        const ctx = makeContext({ components: { [MOCK_ID]: { ...baseComponent, type: 'breadboard' } } });
        (useSimulatorContext as vi.Mock).mockReturnValue(ctx as any);
        const { container: c1 } = render(<RotationControls />);
        expect(c1.firstChild).toBeNull();

        const ctx2 = makeContext({ components: { [MOCK_ID]: { ...baseComponent, type: 'ic' } } });
        (useSimulatorContext as vi.Mock).mockReturnValue(ctx2 as any);
        const { container: c2 } = render(<RotationControls />);
        expect(c2.firstChild).toBeNull();
    });

    it('renders two rotation buttons', () => {
        (useSimulatorContext as vi.Mock).mockReturnValue(makeContext({}) as any);
        const { getAllByRole } = render(<RotationControls />);
        const buttons = getAllByRole('button');
        expect(buttons).toHaveLength(2);
        expect(buttons[0]).toHaveAttribute('title', expect.stringContaining('Anticlockwise'));
        expect(buttons[1]).toHaveAttribute('title', expect.stringContaining('Clockwise'));
    });

    it('calls updateComponent and updateWirePositions on anticlockwise click', () => {
        const ctx = makeContext({});
        (useSimulatorContext as vi.Mock).mockReturnValue(ctx as any);
        const { getAllByRole } = render(<RotationControls />);
        fireEvent.click(getAllByRole('button')[0]);
        // rotation: (0 - 90 + 360) % 360 = 270
        expect(ctx.updateComponent).toHaveBeenCalledWith(MOCK_ID, {
            rotation: 270,
            connectors: {
                c1: expect.objectContaining({ offset: { x: 1, y: 1 }, isConnected: false }),
                c2: expect.objectContaining({ offset: { x: 1, y: 1 }, isConnected: false })
            }
        });
        expect(updateWirePositions).toHaveBeenCalledWith(
            expect.any(Object),
            baseComponent.dimensions,
            ctx.getConnectorConnection,
            ctx.connections,
            ctx.wires,
            ctx.updateWire,
            baseComponent.position
        );
    });

    it('calls updateComponent and updateWirePositions on clockwise click', () => {
        const ctx = makeContext({});
        (useSimulatorContext as vi.Mock).mockReturnValue(ctx as any);
        const { getAllByRole } = render(<RotationControls />);
        fireEvent.click(getAllByRole('button')[1]);
        // rotation: (0 + 90) % 360 = 90
        expect(ctx.updateComponent).toHaveBeenCalledWith(MOCK_ID, {
            rotation: 90,
            connectors: {
                c1: expect.objectContaining({ offset: { x: 1, y: 1 }, isConnected: false }),
                c2: expect.objectContaining({ offset: { x: 1, y: 1 }, isConnected: false })
            }
        });
        expect(updateWirePositions).toHaveBeenCalled();
    });
});