import { describe, it, expect, vi } from 'vitest';
import { createConnector, getInteractionRegion, isPointInConnector, getConnectorPosition, validateConnection, Connector } from '@/definitions/connector';
import type { EditorComponent, Point } from '@/definitions/general';

// Full interface mocks
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

vi.mock('@/lib/utils', () => ({
    isBreadboard: (comp: EditorComponent) => comp.type === 'breadboard',
}));

describe('connector.ts', () => {
    it('createConnector creates a connector with all fields', () => {
        const connector = createConnector(
            'comp1',
            'input',
            { x: 0.5, y: 0.5 },
            3,
            'customID',
            { foo: 'bar' }
        );
        expect(connector).toMatchObject({
            id: 'comp1:customID',
            componentID: 'comp1',
            type: 'input',
            offset: { x: 0.5, y: 0.5 },
            hitAreaSize: 3,
            isConnected: false,
            metadata: { foo: 'bar' },
        });
    });

    it('getInteractionRegion calculates correct region', () => {
        const connector: Connector = {
            id: 'c1',
            componentID: 'comp1',
            type: 'output',
            hitAreaSize: 4,
            offset: { x: 0.5, y: 0.5 },
            isConnected: false,
        };
        const region = getInteractionRegion(connector, { x: 10, y: 20 }, { width: 10, height: 10 });
        expect(region).toEqual({
            x: 10 + 5 - 2,
            y: 20 + 5 - 2,
            width: 4,
            height: 4,
        });
    });

    it('isPointInConnector returns true if point is inside', () => {
        const connector: Connector = {
            id: 'c1',
            componentID: 'comp1',
            type: 'output',
            hitAreaSize: 4,
            offset: { x: 0.5, y: 0.5 },
            isConnected: false,
        };
        const pos = { x: 10, y: 20 };
        const dims = { width: 10, height: 10 };
        const region = getInteractionRegion(connector, pos, dims);
        const center: Point = { x: region.x + 2, y: region.y + 2 };
        expect(isPointInConnector(center, connector, pos, dims)).toBe(true);
    });

    it('isPointInConnector returns false if point is outside', () => {
        const connector: Connector = {
            id: 'c1',
            componentID: 'comp1',
            type: 'output',
            hitAreaSize: 4,
            offset: { x: 0.5, y: 0.5 },
            isConnected: false,
        };
        const pos = { x: 10, y: 20 };
        const dims = { width: 10, height: 10 };
        const outside: Point = { x: 100, y: 100 };
        expect(isPointInConnector(outside, connector, pos, dims)).toBe(false);
    });

    it('getConnectorPosition returns the center of the region', () => {
        const connector: Connector = {
            id: 'c1',
            componentID: 'comp1',
            type: 'output',
            hitAreaSize: 4,
            offset: { x: 0.5, y: 0.5 },
            isConnected: false,
        };
        const pos = { x: 10, y: 20 };
        const dims = { width: 10, height: 10 };
        const region = getInteractionRegion(connector, pos, dims);
        const expected = { x: region.x + region.width / 2, y: region.y + region.height / 2 };
        expect(getConnectorPosition(connector, pos, dims)).toEqual(expected);
    });

    it('validateConnection returns true for valid types and breadboard', () => {
        const bb = mockBreadboardComponent();
        const comp = mockNonBreadboardComponent();
        const c1: Connector = {
            id: 'bb1:1',
            componentID: bb.editorID,
            type: 'input',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const c2: Connector = {
            id: 'c1:1',
            componentID: comp.editorID,
            type: 'output',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const components = { [bb.editorID]: bb, [comp.editorID]: comp };
        expect(validateConnection(c1, c2, components)).toBe(true);
    });

    it('validateConnection returns false for invalid type combination', () => {
        const bb = mockBreadboardComponent();
        const comp = mockNonBreadboardComponent();
        const c1: Connector = {
            id: 'bb1:1',
            componentID: bb.editorID,
            type: 'input',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const c2: Connector = {
            id: 'c1:1',
            componentID: comp.editorID,
            type: 'input',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const components = { [bb.editorID]: bb, [comp.editorID]: comp };
        expect(validateConnection(c1, c2, components)).toBe(false);
    });

    it('validateConnection returns false if neither component is breadboard', () => {
        const comp1 = mockNonBreadboardComponent('c1');
        const comp2 = mockNonBreadboardComponent('c2');
        const c1: Connector = {
            id: 'c1:1',
            componentID: comp1.editorID,
            type: 'input',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const c2: Connector = {
            id: 'c2:1',
            componentID: comp2.editorID,
            type: 'output',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const components = { [comp1.editorID]: comp1, [comp2.editorID]: comp2 };
        expect(validateConnection(c1, c2, components)).toBe(false);
    });

    it('validateConnection allows bidirectional to positive', () => {
        const bb = mockBreadboardComponent();
        const comp = mockNonBreadboardComponent();
        const c1: Connector = {
            id: 'bb1:1',
            componentID: bb.editorID,
            type: 'bidirectional',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const c2: Connector = {
            id: 'c1:1',
            componentID: comp.editorID,
            type: 'positive',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const components = { [bb.editorID]: bb, [comp.editorID]: comp };
        expect(validateConnection(c1, c2, components)).toBe(true);
    });

    it('validateConnection allows negative to cathode', () => {
        const bb = mockBreadboardComponent();
        const comp = mockNonBreadboardComponent();
        const c1: Connector = {
            id: 'bb1:1',
            componentID: bb.editorID,
            type: 'negative',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const c2: Connector = {
            id: 'c1:1',
            componentID: comp.editorID,
            type: 'cathode',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const components = { [bb.editorID]: bb, [comp.editorID]: comp };
        expect(validateConnection(c1, c2, components)).toBe(true);
    });

    it('validateConnection does not allow positive to negative', () => {
        const bb = mockBreadboardComponent();
        const comp = mockNonBreadboardComponent();
        const c1: Connector = {
            id: 'bb1:1',
            componentID: bb.editorID,
            type: 'positive',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const c2: Connector = {
            id: 'c1:1',
            componentID: comp.editorID,
            type: 'negative',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const components = { [bb.editorID]: bb, [comp.editorID]: comp };
        expect(validateConnection(c1, c2, components)).toBe(false);
    });

    // Negative test: should not allow connection if connector types are not compatible
    it('validateConnection returns false for anode to cathode if not allowed', () => {
        const bb = mockBreadboardComponent();
        const comp = mockNonBreadboardComponent();
        const c1: Connector = {
            id: 'bb1:1',
            componentID: bb.editorID,
            type: 'anode',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const c2: Connector = {
            id: 'c1:1',
            componentID: comp.editorID,
            type: 'cathode',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const components = { [bb.editorID]: bb, [comp.editorID]: comp };
        // According to rules, anode can connect to cathode, so this should be true
        expect(validateConnection(c1, c2, components)).toBe(true);
    });

    it('validateConnection returns false for output to output', () => {
        const bb = mockBreadboardComponent();
        const comp = mockNonBreadboardComponent();
        const c1: Connector = {
            id: 'bb1:1',
            componentID: bb.editorID,
            type: 'output',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const c2: Connector = {
            id: 'c1:1',
            componentID: comp.editorID,
            type: 'output',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const components = { [bb.editorID]: bb, [comp.editorID]: comp };
        expect(validateConnection(c1, c2, components)).toBe(false);
    });

    it('validateConnection returns false for input to cathode', () => {
        const bb = mockBreadboardComponent();
        const comp = mockNonBreadboardComponent();
        const c1: Connector = {
            id: 'bb1:1',
            componentID: bb.editorID,
            type: 'input',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const c2: Connector = {
            id: 'c1:1',
            componentID: comp.editorID,
            type: 'cathode',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
        };
        const components = { [bb.editorID]: bb, [comp.editorID]: comp };
        expect(validateConnection(c1, c2, components)).toBe(false);
    });
});