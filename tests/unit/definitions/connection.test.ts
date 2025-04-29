import { describe, it, expect, vi } from 'vitest';
import { createAppropriateConnection, isWireConnection, isStripToStripConnection, getNonBreadboardComponent } from '@/definitions/connection';
import type { Connection, WireConnectionMetadata } from '@/definitions/connection';
import type { Connector, ConnectorType } from '@/definitions/connector';
import type { EditorComponent } from '@/definitions/general';

// Mocks
const mockBreadboardComponent = (editorID = 'bb1'): EditorComponent => ({
    editorID,
    type: 'breadboard',
    dimensions: { width: 10, height: 10 },
    rotation: 0,
    position: { x: 0, y: 0 },
    properties: {},
    connectors: {},
});
const mockNonBreadboardComponent = (editorID = 'c1'): EditorComponent => ({
    editorID,
    type: 'resistor',
    dimensions: { width: 5, height: 2 },
    rotation: 0,
    position: { x: 0, y: 0 },
    properties: {},
    connectors: {},
});
const mockConnector = (componentID: string, type: string = 'input'): Connector => ({
    id: `${componentID}:con`,
    componentID,
    type: type as ConnectorType,
    offset: { x: 0, y: 0 },
    hitAreaSize: 2.5,
    isConnected: false,
});

vi.mock('@/lib/utils', () => ({
    isBreadboard: (comp: EditorComponent) => comp.type === 'breadboard',
}));
vi.mock('@/definitions/components/breadboard', () => ({
    getStripID: (comp: EditorComponent, connector: Connector) => `${comp.editorID}-strip-${connector.id}`,
}));

vi.mock('@/definitions/connector', async (importOriginal) => {
    const mod = await importOriginal();
    return {
        ...mod,
        validateConnection: (c1: Connector, c2: Connector, comps: Record<string, EditorComponent>) => true,
    };
});

describe('connection.ts', () => {
    it('creates a strip connection when no wireID is provided', () => {
        const bb = mockBreadboardComponent();
        const comp = mockNonBreadboardComponent();
        const source = mockConnector(bb.editorID, 'input');
        const target = mockConnector(comp.editorID, 'output');
        const components = { [bb.editorID]: bb, [comp.editorID]: comp };

        const conn = createAppropriateConnection(source, target, components);

        expect(conn.type).toBe('strip');
        expect(conn.metadata.stripID).toBe(`${bb.editorID}-strip-${source.id}`);
        expect(conn.metadata).not.toHaveProperty('wireID');
    });

    it('creates a wire connection between breadboard and non-breadboard', () => {
        const bb = mockBreadboardComponent();
        const comp = mockNonBreadboardComponent();
        const source = mockConnector(bb.editorID, 'input');
        const target = mockConnector(comp.editorID, 'output');
        const components = { [bb.editorID]: bb, [comp.editorID]: comp };

        const conn = createAppropriateConnection(source, target, components, 'wire-123');

        expect(conn.type).toBe('wire');
        expect((conn.metadata as WireConnectionMetadata).wireID).toBe('wire-123');
        expect(conn.metadata.stripID).toBe(`${bb.editorID}-strip-${source.id}`);
        expect(conn.metadata.targetStripID).toBeUndefined();
    });

    it('creates a wire connection between two breadboards', () => {
        const bb1 = mockBreadboardComponent('bb1');
        const bb2 = mockBreadboardComponent('bb2');
        const source = mockConnector(bb1.editorID, 'input');
        const target = mockConnector(bb2.editorID, 'output');
        const components = { [bb1.editorID]: bb1, [bb2.editorID]: bb2 };

        const conn = createAppropriateConnection(source, target, components, 'wire-abc');

        expect(conn.type).toBe('wire');
        expect((conn.metadata as WireConnectionMetadata).wireID).toBe('wire-abc');
        expect(conn.metadata.stripID).toBe(`${bb1.editorID}-strip-${source.id}`);
        expect(conn.metadata.targetStripID).toBe(`${bb2.editorID}-strip-${target.id}`);
    });

    it('throws if validateConnection returns false', async () => {
        const bb = mockBreadboardComponent();
        const comp = mockNonBreadboardComponent();
        const source = mockConnector(bb.editorID, 'input');
        const target = mockConnector(comp.editorID, 'output');
        const components = { [bb.editorID]: bb, [comp.editorID]: comp };

        vi.spyOn(await import('@/definitions/connector'), 'validateConnection').mockReturnValueOnce(false);

        expect(() => createAppropriateConnection(source, target, components)).toThrow('Invalid connection');
    });

    it('isWireConnection type guard works', () => {
        const conn: Connection = {
            id: 'c1',
            sourceConnector: mockConnector('bb1'),
            targetConnector: mockConnector('c1'),
            type: 'wire',
            metadata: { wireID: 'w1', stripID: 's1' },
        };
        expect(isWireConnection(conn)).toBe(true);

        const conn2: Connection = {
            id: 'c2',
            sourceConnector: mockConnector('bb1'),
            targetConnector: mockConnector('c1'),
            type: 'strip',
            metadata: { stripID: 's2' },
        };
        expect(isWireConnection(conn2)).toBe(false);
    });

    it('isStripToStripConnection returns true only for strip with targetStripID', () => {
        const conn: Connection = {
            id: 'c1',
            sourceConnector: mockConnector('bb1'),
            targetConnector: mockConnector('bb2'),
            type: 'strip',
            metadata: { stripID: 's1', targetStripID: 's2' },
        };
        expect(isStripToStripConnection(conn)).toBe(true);

        const conn2: Connection = {
            id: 'c2',
            sourceConnector: mockConnector('bb1'),
            targetConnector: mockConnector('bb2'),
            type: 'strip',
            metadata: { stripID: 's1' },
        };
        expect(isStripToStripConnection(conn2)).toBe(false);

        const conn3: Connection = {
            id: 'c3',
            sourceConnector: mockConnector('bb1'),
            targetConnector: mockConnector('bb2'),
            type: 'wire',
            metadata: { wireID: 'w1', stripID: 's1', targetStripID: 's2' },
        };
        expect(isStripToStripConnection(conn3)).toBe(false);
    });

    it('getNonBreadboardComponent returns the non-breadboard component', () => {
        const bb = mockBreadboardComponent();
        const comp = mockNonBreadboardComponent();
        const source = mockConnector(bb.editorID, 'input');
        const target = mockConnector(comp.editorID, 'output');
        const components = { [bb.editorID]: bb, [comp.editorID]: comp };

        const conn: Connection = {
            id: 'c1',
            sourceConnector: source,
            targetConnector: target,
            type: 'strip',
            metadata: { stripID: 's1' },
        };
        expect(getNonBreadboardComponent(conn, components)).toBe(comp);

        // Swap source/target
        const conn2: Connection = {
            id: 'c2',
            sourceConnector: target,
            targetConnector: source,
            type: 'strip',
            metadata: { stripID: 's1' },
        };
        expect(getNonBreadboardComponent(conn2, components)).toBe(comp);
    });
});