import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWireUpdates, updateWirePositions } from '@/hooks/ui/useWireUpdates';
import { Connector } from '@/definitions/connector';
import { Wire } from '@/definitions/general';
import { Connection } from '@/definitions/connection';

// Mock getConnectorPosition to return predictable values
vi.mock('@/definitions/connector', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        getConnectorPosition: vi.fn((connector, position, dimensions) => ({
            x: position.x + (connector.offsetX ?? 0),
            y: position.y + (connector.offsetY ?? 0),
        })),
    };
});

describe('useWireUpdates', () => {
    let connectors: Record<string, Connector>;
    let dimensions: { width: number; height: number };
    let connections: Record<string, Connection>;
    let wires: Record<string, Wire>;
    let getConnectorConnection: (id: string) => string;
    let updateWire: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        connectors = {
            c1: { id: 'c1', isConnected: true, offsetX: 0, offsetY: 0 } as Connector,
            c2: { id: 'c2', isConnected: true, offsetX: 10, offsetY: 10 } as Connector,
        };
        dimensions = { width: 100, height: 100 };
        wires = {
            w1: { id: 'w1', points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] },
        };
        connections = {
            conn1: {
                id: 'conn1',
                sourceConnector: connectors.c1,
                targetConnector: connectors.c2,
                metadata: { wireID: 'w1' },
                type: 'wire',
            } as unknown as Connection,
        };
        getConnectorConnection = (id: string) => id === 'c1' || id === 'c2' ? 'conn1' : '';
        updateWire = vi.fn();
    });

    it('should be a valid function', () => {
        expect(typeof useWireUpdates).toBe('function');
    });

    it('should update wire positions when hook callback is called', () => {
        const { result } = renderHook(() =>
            useWireUpdates(connectors, dimensions, connections, wires, getConnectorConnection, updateWire)
        );
        act(() => {
            result.current({ x: 5, y: 5 });
        });
        expect(updateWire).toHaveBeenCalledWith('w1', {
            points: [
                { x: 5, y: 5 }, // c1
                { x: 15, y: 15 }, // c2 (offset 10,10)
            ],
        });
    });

    it('should not update wires if no connections exist', () => {
        const { result } = renderHook(() =>
            useWireUpdates(connectors, dimensions, {}, wires, getConnectorConnection, updateWire)
        );
        act(() => {
            result.current({ x: 0, y: 0 });
        });
        expect(updateWire).not.toHaveBeenCalled();
    });

    it('should not update wires if wire does not exist', () => {
        connections.conn1.metadata.wireID = 'w2'; // wire w2 does not exist
        const { result } = renderHook(() =>
            useWireUpdates(connectors, dimensions, connections, wires, getConnectorConnection, updateWire)
        );
        act(() => {
            result.current({ x: 0, y: 0 });
        });
        expect(updateWire).not.toHaveBeenCalled();
    });

    it('updateWirePositions updates correct points for source and target', () => {
        const updateWireMock = vi.fn();
        updateWirePositions(
            connectors,
            dimensions,
            getConnectorConnection,
            connections,
            wires,
            updateWireMock,
            { x: 2, y: 3 }
        );
        expect(updateWireMock).toHaveBeenCalledWith('w1', {
            points: [
                { x: 2, y: 3 }, // c1
                { x: 12, y: 13 }, // c2
            ],
        });
    });

    it('should not update wire if connector is not part of a connection', () => {
        const connectors2 = {
            ...connectors,
            c3: { id: 'c3', isConnected: false, offsetX: 0, offsetY: 0 } as Connector,
        };
        const getConnectorConnection2 = (id: string) => (id === 'c1' || id === 'c2' ? 'conn1' : '');
        const updateWireMock = vi.fn();
        updateWirePositions(
            connectors2,
            dimensions,
            getConnectorConnection2,
            connections,
            wires,
            updateWireMock,
            { x: 0, y: 0 }
        );
        expect(updateWireMock).toHaveBeenCalledTimes(1);
    });
});