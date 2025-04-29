import { renderHook, act } from '@testing-library/react';
import { useConnectorManagement } from '@/hooks/circuit/useConnectorManagement';
import { EditorComponent, Point, Wire } from '@/definitions/general';
import { Connector } from '@/definitions/connector';
import { SnapState } from '@/hooks/ui/useSnapManagement';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { sendErrorToast } from '@/lib/utils';


// Mocks
vi.mock('uuid', () => ({
    v4: () => 'mock-uuid',
}));
vi.mock('@/definitions/connector', async (importOriginal) => {
    const mod = await importOriginal();
    return {
        ...mod,
        getConnectorPosition: vi.fn((connector, position, dimensions) => ({ x: 10, y: 20 })),
    };
});
vi.mock('@/definitions/connection', async (importOriginal) => {
    const mod = await importOriginal();
    return {
        ...mod,
        createAppropriateConnection: vi.fn((a, b, comps, wireId) => ({
            id: 'connection-id',
            from: a,
            to: b,
            wireId,
        })),
    };
});
vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn() },
}));
vi.mock('@/lib/utils', () => ({
    sendErrorToast: vi.fn(),
}));

const basePosition: Point = { x: 0, y: 0 };
const baseDimensions = { width: 100, height: 100 };
const baseComponent: EditorComponent = { id: 'comp1', type: 'type', position: { x: 0, y: 0 }, dimensions: { width: 10, height: 10 }, connectors: [] };
const baseConnector: Connector = { id: 'conn1', type: 'input', parentComponentId: 'comp1', index: 0 };

describe('useConnectorManagement', () => {
    let setSelectedWire: ReturnType<typeof vi.fn>;
    let updateWire: ReturnType<typeof vi.fn>;
    let addConnection: ReturnType<typeof vi.fn>;
    let removeConnection: ReturnType<typeof vi.fn>;
    let setCreatingWire: ReturnType<typeof vi.fn>;
    let setClickedConnector: ReturnType<typeof vi.fn>;
    let addWire: ReturnType<typeof vi.fn>;
    let getConnectorConnection: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        setSelectedWire = vi.fn();
        updateWire = vi.fn();
        addConnection = vi.fn();
        removeConnection = vi.fn();
        setCreatingWire = vi.fn();
        setClickedConnector = vi.fn();
        addWire = vi.fn();
        getConnectorConnection = vi.fn(() => '');
    });

    it('should start wire creation on connector click when not creating a wire', () => {
        const { result } = renderHook(() =>
            useConnectorManagement(
                basePosition,
                baseDimensions,
                { comp1: baseComponent },
                { conn1: baseConnector },
                null,
                setSelectedWire,
                updateWire,
                addConnection,
                removeConnection,
                setCreatingWire,
                setClickedConnector,
                addWire,
                getConnectorConnection
            )
        );

        act(() => {
            result.current.handleConnectorClick('conn1');
        });

        expect(setCreatingWire).toHaveBeenCalledWith(expect.objectContaining({
            id: 'wire-mock-uuid',
            startConnector: baseConnector,
            endConnector: null,
            points: [{ x: 10, y: 20 }],
        }));
        expect(addWire).toHaveBeenCalled();
        expect(setClickedConnector).toHaveBeenCalledWith(baseConnector);
    });

    it('should not allow connecting to an already connected connector', () => {
        getConnectorConnection = vi.fn(() => 'some-connection');
        const { result } = renderHook(() =>
            useConnectorManagement(
                basePosition,
                baseDimensions,
                { comp1: baseComponent },
                { conn1: baseConnector },
                null,
                setSelectedWire,
                updateWire,
                addConnection,
                removeConnection,
                setCreatingWire,
                setClickedConnector,
                addWire,
                getConnectorConnection
            )
        );
        act(() => {
            result.current.handleConnectorClick('conn1');
        });
        // sendErrorToast should be called
        expect(sendErrorToast).toHaveBeenCalledWith('Connector already connected', 'connector-connected-toast');
        expect(setCreatingWire).not.toHaveBeenCalled();
    });

    it('should not allow connecting to the same connector when creating a wire', () => {
        const creatingWire: Wire = {
            id: 'wire1',
            startConnector: baseConnector,
            endConnector: null,
            points: [{ x: 10, y: 20 }],
        };
        const { result } = renderHook(() =>
            useConnectorManagement(
                basePosition,
                baseDimensions,
                { comp1: baseComponent },
                { conn1: baseConnector },
                creatingWire,
                setSelectedWire,
                updateWire,
                addConnection,
                removeConnection,
                setCreatingWire,
                setClickedConnector,
                addWire,
                getConnectorConnection
            )
        );
        act(() => {
            result.current.handleConnectorClick('conn1');
        });
        expect(sendErrorToast).toHaveBeenCalledWith('Cannot connect to same connector', 'same-connector-toast');
        expect(addConnection).not.toHaveBeenCalled();
        expect(updateWire).not.toHaveBeenCalled();
    });

    it('should complete wire creation on connector click', () => {
        const otherConnector: Connector = { ...baseConnector, id: 'conn2' };
        const creatingWire: Wire = {
            id: 'wire1',
            startConnector: baseConnector,
            endConnector: null,
            points: [{ x: 10, y: 20 }],
        };
        const { result } = renderHook(() =>
            useConnectorManagement(
                basePosition,
                baseDimensions,
                { comp1: baseComponent },
                { conn1: baseConnector, conn2: otherConnector },
                creatingWire,
                setSelectedWire,
                updateWire,
                addConnection,
                removeConnection,
                setCreatingWire,
                setClickedConnector,
                addWire,
                getConnectorConnection
            )
        );
        act(() => {
            result.current.handleConnectorClick('conn2');
        });
        expect(addConnection).toHaveBeenCalledWith(expect.objectContaining({
            from: baseConnector,
            to: otherConnector,
            wireId: 'wire1',
        }));
        expect(updateWire).toHaveBeenCalledWith('wire1', expect.objectContaining({
            endConnector: otherConnector,
            points: expect.any(Array),
        }));
        expect(setCreatingWire).toHaveBeenCalledWith(null);
        expect(setClickedConnector).toHaveBeenCalledWith(otherConnector);
    });

    it('should remove and add connections on updateConnectionsOnDrop', () => {
        const snapState: SnapState = {
            isSnapped: true,
            connectionIDs: ['c1', 'c2'],
            connections: [
                { connector: baseConnector, otherConnector: { ...baseConnector, id: 'conn2' } },
            ],
        };
        const { result } = renderHook(() =>
            useConnectorManagement(
                basePosition,
                baseDimensions,
                { comp1: baseComponent },
                { conn1: baseConnector },
                null,
                setSelectedWire,
                updateWire,
                addConnection,
                removeConnection,
                setCreatingWire,
                setClickedConnector,
                addWire,
                getConnectorConnection
            )
        );
        act(() => {
            const ids = result.current.updateConnectionsOnDrop(snapState);
            expect(removeConnection).toHaveBeenCalledWith('c1');
            expect(removeConnection).toHaveBeenCalledWith('c2');
            expect(addConnection).toHaveBeenCalled();
            expect(ids).toEqual(['connection-id']);
        });
    });

    it('should return empty array if not snapped in updateConnectionsOnDrop', () => {
        const snapState: SnapState = {
            isSnapped: false,
            connectionIDs: ['c1'],
            connections: [],
        };
        const { result } = renderHook(() =>
            useConnectorManagement(
                basePosition,
                baseDimensions,
                { comp1: baseComponent },
                { conn1: baseConnector },
                null,
                setSelectedWire,
                updateWire,
                addConnection,
                removeConnection,
                setCreatingWire,
                setClickedConnector,
                addWire,
                getConnectorConnection
            )
        );
        act(() => {
            const ids = result.current.updateConnectionsOnDrop(snapState);
            expect(ids).toEqual([]);
        });
    });
});