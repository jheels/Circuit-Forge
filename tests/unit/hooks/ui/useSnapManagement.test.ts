import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSnapManagement, SnapState } from '@/hooks/ui/useSnapManagement';
import Konva from 'konva';
import { Connector } from '@/definitions/connector';
import { EditorComponent } from '@/definitions/general';

// Mocks for dependencies
vi.mock('@/definitions/connector', () => ({
    getConnectorPosition: vi.fn((connector, pos) => ({ x: pos.x, y: pos.y })),
    SNAPPING_THRESHOLD: 10,
    BREAKAWAY_THRESHOLD: 20,
    validateConnection: vi.fn(() => true),
}));
vi.mock('@/lib/utils', () => ({
    calculateDistance: vi.fn((a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)),
    sendErrorToast: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn() }
}));

const mockUpdateComponent = vi.fn();
const mockSetHoveredConnectorID = vi.fn();
const mockUpdateWirePositions = vi.fn();

const baseConnector = (id: string, isConnected = false) => ({
    id,
    isConnected,
    type: 'pin',
    parentComponentID: 'comp1',
});
const baseComponent = (id: string, connectors: any, position = { x: 0, y: 0 }, dimensions = { width: 10, height: 10 }) => ({
    editorID: id,
    connectors,
    position,
    dimensions,
});

describe('useSnapManagement', () => {
    let connectors: Record<string, Connector>;
    let components: Record<string, EditorComponent>;
    let dimensions: { width: number; height: number };

    beforeEach(() => {
        connectors = {
            c1: baseConnector('c1'),
            c2: baseConnector('c2', true),
        };
        components = {
            comp1: baseComponent('comp1', connectors),
            comp2: baseComponent('comp2', {
                c3: baseConnector('c3'),
                c4: baseConnector('c4', true),
            }, { x: 5, y: 5 }),
        };
        dimensions = { width: 10, height: 10 };
        vi.clearAllMocks();
    });

    it('should be a valid function and return expected API', () => {
        const { result } = renderHook(() =>
            useSnapManagement(
                'comp1',
                connectors,
                dimensions,
                components,
                mockUpdateComponent,
                mockSetHoveredConnectorID,
                mockUpdateWirePositions
            )
        );
        expect(typeof useSnapManagement).toBe('function');
        expect(result.current).toHaveProperty('snapState');
        expect(result.current).toHaveProperty('setSnapState');
        expect(result.current).toHaveProperty('handleDragMove');
    });

    it('should initialize snapState correctly', () => {
        const { result } = renderHook(() =>
            useSnapManagement(
                'comp1',
                connectors,
                dimensions,
                components,
                mockUpdateComponent,
                mockSetHoveredConnectorID,
                mockUpdateWirePositions
            )
        );
        expect(result.current.snapState).toEqual({
            isSnapped: false,
            position: null,
            connections: [],
            connectionIDs: [],
        });
    });

    it('should update snapState via setSnapState', () => {
        const { result } = renderHook(() =>
            useSnapManagement(
                'comp1',
                connectors,
                dimensions,
                components,
                mockUpdateComponent,
                mockSetHoveredConnectorID,
                mockUpdateWirePositions
            )
        );
        act(() => {
            result.current.setSnapState((prev: SnapState) => ({
                ...prev,
                isSnapped: true,
                position: { x: 1, y: 2 },
            }));
        });
        expect(result.current.snapState.isSnapped).toBe(true);
        expect(result.current.snapState.position).toEqual({ x: 1, y: 2 });
    });

    it('should call updateComponent and updateWirePositions on drag move (no snap)', () => {
        const { result } = renderHook(() =>
            useSnapManagement(
                'comp1',
                connectors,
                dimensions,
                components,
                mockUpdateComponent,
                mockSetHoveredConnectorID,
                mockUpdateWirePositions
            )
        );
        const mockEvent = {
            target: {
                x: () => 100,
                y: () => 200,
                position: vi.fn(),
            },
        } as unknown as Konva.KonvaEventObject<DragEvent>;

        act(() => {
            result.current.handleDragMove(mockEvent);
        });

        expect(mockUpdateComponent).toHaveBeenCalledWith('comp1', { position: { x: 100, y: 200 } });
        expect(mockUpdateWirePositions).toHaveBeenCalledWith({ x: 100, y: 200 });
    });

    it('should not snap if all connectors are already connected', () => {
        connectors = {
            c1: baseConnector('c1', true),
            c2: baseConnector('c2', true),
        };
        const { result } = renderHook(() =>
            useSnapManagement(
                'comp1',
                connectors,
                dimensions,
                components,
                mockUpdateComponent,
                mockSetHoveredConnectorID,
                mockUpdateWirePositions
            )
        );
        const mockEvent = {
            target: {
                x: () => 5,
                y: () => 5,
                position: vi.fn(),
            },
        } as unknown as Konva.KonvaEventObject<DragEvent>;

        act(() => {
            result.current.handleDragMove(mockEvent);
        });

        expect(result.current.snapState.isSnapped).toBe(false);
    });

    it('should call setHoveredConnectorID(null) on drag move', () => {
        const { result } = renderHook(() =>
            useSnapManagement(
                'comp1',
                connectors,
                dimensions,
                components,
                mockUpdateComponent,
                mockSetHoveredConnectorID,
                mockUpdateWirePositions
            )
        );
        const mockEvent = {
            target: {
                x: () => 1,
                y: () => 1,
                position: vi.fn(),
            },
        } as unknown as Konva.KonvaEventObject<DragEvent>;

        act(() => {
            result.current.handleDragMove(mockEvent);
        });

        expect(mockSetHoveredConnectorID).toHaveBeenCalledWith(null);
    });

    it('should break away if moved far enough', () => {
        // Set up snapped state
        const { result } = renderHook(() =>
            useSnapManagement(
                'comp1',
                connectors,
                dimensions,
                components,
                mockUpdateComponent,
                mockSetHoveredConnectorID,
                mockUpdateWirePositions
            )
        );
        act(() => {
            result.current.setSnapState((prev: SnapState) => ({
                ...prev,
                isSnapped: true,
                position: { x: 0, y: 0 },
                connections: [{ connector: connectors.c1, otherConnector: components.comp2.connectors.c3 }],
            }));
        });

        const mockEvent = {
            target: {
                x: () => 100,
                y: () => 100,
                position: vi.fn(),
            },
        } as unknown as Konva.KonvaEventObject<DragEvent>;

        act(() => {
            result.current.handleDragMove(mockEvent);
        });

        expect(result.current.snapState.isSnapped).toBe(false);
        expect(result.current.snapState.position).toBe(null);
        expect(mockUpdateComponent).toHaveBeenCalledWith('comp1', { position: { x: 100, y: 100 } });
        expect(mockUpdateWirePositions).toHaveBeenCalledWith({ x: 100, y: 100 });
    });
});