import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { SimulatorContextProvider, useSimulatorContext } from '@/context/SimulatorContext';
import { EditorComponent, Point, Wire } from '@/definitions/general';
import { Connector } from '@/definitions/connector';
import { Connection } from '@/definitions/connection';
import { sendErrorToast, sendSuccessToast } from '@/lib/utils';

// Mock all component creators and utility functions
vi.mock('@/definitions/components/led', () => ({
    createLEDComponent: (position: Point, name: string) => ({
        editorID: 'led1',
        type: 'led',
        position,
        properties: { name },
        connectors: {},
        dimensions: { width: 1, height: 1 },
        rotation: 0,
    }),
}));
vi.mock('@/definitions/components/resistor', () => ({
    createResistorComponent: (position: Point, name: string) => ({
        editorID: 'res1',
        type: 'resistor',
        position,
        properties: { name },
        connectors: {},
        dimensions: { width: 1, height: 1 },
        rotation: 0,
    }),
}));
vi.mock('@/definitions/components/powerSupply', () => ({
    createPowerSupplyComponent: (position: Point, name: string) => ({
        editorID: 'ps1',
        type: 'power-supply',
        position,
        properties: { name },
        connectors: {},
        dimensions: { width: 1, height: 1 },
        rotation: 0,
    }),
}));
vi.mock('@/definitions/components/breadboard', () => ({
    createBreadboardComponent: (position: Point, name: string) => ({
        editorID: 'bb1',
        type: 'breadboard',
        position,
        properties: { name },
        connectors: {},
        dimensions: { width: 1, height: 1 },
        rotation: 0,
    }),
}));
vi.mock('@/definitions/components/dipswitch', () => ({
    createDIPSwitchComponent: (position: Point, name: string) => ({
        editorID: 'dip1',
        type: 'dip-switch',
        position,
        properties: { name },
        connectors: {},
        dimensions: { width: 1, height: 1 },
        rotation: 0,
    }),
}));
vi.mock('@/definitions/components/ic', () => ({
    createHexInverter: (position: Point, name: string) => ({
        editorID: 'ic1',
        type: '74LS04',
        position,
        properties: { name },
        connectors: {},
        dimensions: { width: 1, height: 1 },
        rotation: 0,
    }),
    createQuadNANDGate: (position: Point, name: string) => ({
        editorID: 'ic2',
        type: '74LS00',
        position,
        properties: { name },
        connectors: {},
        dimensions: { width: 1, height: 1 },
        rotation: 0,
    }),
    createQuadANDGate: (position: Point, name: string) => ({
        editorID: 'ic3',
        type: '74LS08',
        position,
        properties: { name },
        connectors: {},
        dimensions: { width: 1, height: 1 },
        rotation: 0,
    }),
    createQuadORGate: (position: Point, name: string) => ({
        editorID: 'ic4',
        type: '74LS32',
        position,
        properties: { name },
        connectors: {},
        dimensions: { width: 1, height: 1 },
        rotation: 0,
    }),
    createQuadNORGate: (position: Point, name: string) => ({
        editorID: 'ic5',
        type: '74LS02',
        position,
        properties: { name },
        connectors: {},
        dimensions: { width: 1, height: 1 },
        rotation: 0,
    }),
    createQuadXORGate: (position: Point, name: string) => ({
        editorID: 'ic6',
        type: '74LS86',
        position,
        properties: { name },
        connectors: {},
        dimensions: { width: 1, height: 1 },
        rotation: 0,
    }),
}));
vi.mock('@/lib/utils', () => ({
    sendErrorToast: vi.fn(),
    sendSuccessToast: vi.fn(),
}));
vi.mock('@/definitions/connection', async (importOriginal) => {
    const mod = await importOriginal();
    return {
        ...mod,
        isWireConnection: (conn: any) => conn.type === 'wire',
    };
});

const DummyConsumer = ({ callback }: { callback: (ctx: ReturnType<typeof useSimulatorContext>) => void }) => {
    const ctx = useSimulatorContext();
    callback(ctx);
    return null;
};

describe('SimulatorContextProvider', () => {
    let context: any;
    const renderWithProvider = (cb: (ctx: any) => void) => {
        render(
            <SimulatorContextProvider>
                <DummyConsumer callback={cb} />
            </SimulatorContextProvider>
        );
    };

    beforeEach(() => {
        context = undefined;
        localStorage.clear();
    });

    it('provides initial state', () => {
        renderWithProvider((ctx) => { context = ctx; });
        expect(context.projectName).toBe('Untitled Project');
        expect(context.components).toEqual({});
        expect(context.componentCounts).toEqual({});
        expect(context.selectedComponent).toBeNull();
        expect(context.selectedWire).toBeNull();
        expect(context.wires).toEqual({});
        expect(context.creatingWire).toBeNull();
        expect(context.hoveredConnectorID).toBeNull();
        expect(context.clickedConnector).toBeNull();
        expect(context.connections).toEqual({});
        expect(context.connectorConnectionMap).toEqual({});
        expect(context.clipboardComponent).toBeNull();
        expect(context.componentElectricalValues).toEqual({});
    });

    it('sets and resets project name', () => {
        renderWithProvider((ctx) => { context = ctx; });
        act(() => context.setProjectName('Project X'));
        expect(context.projectName).toBe('Project X');
        act(() => context.resetProject());
        expect(context.projectName).toBe('Untitled Project');
    });

    it('creates all component types', () => {
        renderWithProvider((ctx) => { context = ctx; });
        const types = [
            'led', 'resistor', 'power-supply', 'breadboard', 'dip-switch',
            '74LS04', '74LS00', '74LS08', '74LS32', '74LS02', '74LS86'
        ];
        for (const type of types) {
            const comp = context.createComponent(type, { x: 1, y: 2 });
            expect(comp.type).toBe(type);
            expect(comp.position).toEqual({ x: 1, y: 2 });
        }
        expect(() => context.createComponent('invalid', { x: 0, y: 0 })).toThrow();
    });

    it('adds, updates, and removes a component', () => {
        renderWithProvider((ctx) => { context = ctx; });
        const comp = context.createComponent('led', { x: 0, y: 0 });
        act(() => context.addComponent(comp));
        expect(context.components[comp.editorID]).toBe(comp);
        act(() => context.updateComponent(comp.editorID, { rotation: 90 }));
        expect(context.components[comp.editorID].rotation).toBe(90);
        act(() => context.removeComponent(comp.editorID));
        expect(context.components[comp.editorID]).toBeUndefined();
    });

    it('sets and clears selected component and wire', () => {
        renderWithProvider((ctx) => { context = ctx; });
        act(() => context.setSelectedComponent('abc'));
        expect(context.selectedComponent).toBe('abc');
        act(() => context.setSelectedComponent(null));
        expect(context.selectedComponent).toBeNull();
        act(() => context.setSelectedWire('wire1'));
        expect(context.selectedWire).toBe('wire1');
        act(() => context.setSelectedWire(null));
        expect(context.selectedWire).toBeNull();
    });

    it('sets hovered and clicked connector', () => {
        renderWithProvider((ctx) => { context = ctx; });
        act(() => context.setHoveredConnectorID('cid'));
        expect(context.hoveredConnectorID).toBe('cid');
        const connector: Connector = { id: 'cid', componentID: 'comp', type: 'test', hitAreaSize: 1, offset: { x: 0, y: 0 }, isConnected: false };
        act(() => context.setClickedConnector(connector));
        expect(context.clickedConnector).toEqual(connector);
        act(() => context.setClickedConnector(null));
        expect(context.clickedConnector).toBeNull();
    });

    it('sets component counts', () => {
        renderWithProvider((ctx) => { context = ctx; });
        act(() => context.setComponentCounts({ led: 2, resistor: 1 }));
        expect(context.componentCounts).toEqual({ led: 2, resistor: 1 });
    });

    it('adds, updates, and removes a wire', () => {
        renderWithProvider((ctx) => { context = ctx; });
        const wire: Wire = {
            id: 'w1',
            startConnector: { id: 'c1', componentID: 'comp', type: 'test', hitAreaSize: 1, offset: { x: 0, y: 0 }, isConnected: false },
            endConnector: null,
            points: [{ x: 0, y: 0 }, { x: 1, y: 1 }]
        };
        act(() => context.addWire(wire));
        expect(context.wires['w1']).toBe(wire);
        act(() => context.updateWire('w1', { points: [{ x: 2, y: 2 }] }));
        expect(context.wires['w1'].points).toEqual([{ x: 2, y: 2 }]);
        act(() => context.removeWire('w1'));
        expect(context.wires['w1']).toBeUndefined();
    });

    it('sets creatingWire', () => {
        renderWithProvider((ctx) => { context = ctx; });
        const wire: Wire = {
            id: 'w2',
            startConnector: { id: 'c2', componentID: 'comp', type: 'test', hitAreaSize: 1, offset: { x: 0, y: 0 }, isConnected: false },
            endConnector: null,
            points: [{ x: 0, y: 0 }]
        };
        act(() => context.setCreatingWire(wire));
        expect(context.creatingWire).toBe(wire);
        act(() => context.setCreatingWire(null));
        expect(context.creatingWire).toBeNull();
    });

    it('adds and removes a connection, and gets connector connection', () => {
        renderWithProvider((ctx) => { context = ctx; });
        const connector: Connector = { id: 'c3', componentID: 'comp', type: 'test', hitAreaSize: 1, offset: { x: 0, y: 0 }, isConnected: false };
        const connection: Connection = {
            id: 'conn1',
            sourceConnector: connector,
            targetConnector: connector,
            type: 'wire',
            metadata: { wireID: 'w3' }
        };
        act(() => context.addConnection(connection));
        expect(context.connections['conn1']).toBe(connection);
        expect(context.connectorConnectionMap['c3']).toBe('conn1');
        expect(context.getConnectorConnection('c3')).toBe('conn1');
        act(() => context.removeConnection('conn1'));
        expect(context.connections['conn1']).toBeUndefined();
        expect(context.connectorConnectionMap['c3']).toBeUndefined();
        expect(context.getConnectorConnection('c3')).toBeNull();
    });

    it('updates component electrical values', () => {
        renderWithProvider((ctx) => { context = ctx; });
        const vals = { comp: { 0: { voltage: 5, current: 0.1 } } };
        act(() => context.updateComponentElectricalValues(vals));
        expect(context.componentElectricalValues).toEqual(vals);
    });

    it('copy/cut/paste selected component (with restrictions)', () => {
        renderWithProvider((ctx) => { context = ctx; });
        // Add a resistor and select it
        const comp = context.createComponent('resistor', { x: 0, y: 0 });
        act(() => context.addComponent(comp));
        act(() => context.setSelectedComponent(comp.editorID));
        act(() => context.copySelectedComponent());
        expect(context.clipboardComponent).toEqual(comp);
        expect(sendSuccessToast).toHaveBeenCalledWith(`${comp.properties.name} copied`);
        act(() => context.cutSelectedComponent());
        expect(context.components[comp.editorID]).toBeUndefined();
        expect(sendSuccessToast).toHaveBeenCalledWith(`${comp.properties.name} cut`);
        // Add a breadboard and select it
        const bb = context.createComponent('breadboard', { x: 0, y: 0 });
        act(() => context.addComponent(bb));
        act(() => context.setSelectedComponent(bb.editorID));
        act(() => context.copySelectedComponent());
        expect(sendErrorToast).toHaveBeenCalledWith('Cannot copy breadboard');
        act(() => context.cutSelectedComponent());
        expect(sendErrorToast).toHaveBeenCalledWith('Cannot cut breadboard');
        // Add a power supply and select it
        const ps = context.createComponent('power-supply', { x: 0, y: 0 });
        act(() => context.addComponent(ps));
        act(() => context.setSelectedComponent(ps.editorID));
        act(() => context.copySelectedComponent());
        expect(sendErrorToast).toHaveBeenCalledWith('Cannot copy power supply');
        act(() => context.cutSelectedComponent());
        expect(sendErrorToast).toHaveBeenCalledWith('Cannot cut power supply');
        // Paste clipboard (should paste resistor copy)
        act(() => context.copySelectedComponent(comp));
        act(() => context.pasteClipboardComponent());
        expect(sendSuccessToast).toHaveBeenCalledWith(`${comp.properties.name} Copy pasted`);
        expect(Object.values(context.components).some(c => c.properties.name === `${comp.properties.name} Copy`)).toBe(true);
    });

    it('cleanUpComponentWires removes wires/connections for a component', () => {
        renderWithProvider((ctx) => { context = ctx; });
        // Add a component with a connector
        const comp: EditorComponent = {
            editorID: 'comp1',
            type: 'resistor',
            position: { x: 0, y: 0 },
            properties: { name: 'R' },
            connectors: {
                a: { id: 'con1', componentID: 'comp1', type: 'test', hitAreaSize: 1, offset: { x: 0, y: 0 }, isConnected: false }
            },
            dimensions: { width: 1, height: 1 },
            rotation: 0,
        };
        act(() => context.addComponent(comp));
        // Add a connection for that connector
        const connection: Connection = {
            id: 'conn2',
            sourceConnector: comp.connectors.a,
            targetConnector: comp.connectors.a,
            type: 'wire',
            metadata: { wireID: 'w4' }
        };
        act(() => context.addConnection(connection));
        // Add the wire
        const wire: Wire = {
            id: 'w4',
            startConnector: comp.connectors.a,
            endConnector: null,
            points: [{ x: 0, y: 0 }]
        };
        act(() => context.addWire(wire));
        // Now clean up
        act(() => context.cleanUpComponentWires('comp1'));
        expect(context.connections['conn2']).toBeUndefined();
        expect(context.wires['w4']).toBeUndefined();
    });

    it('resetProject resets all state', () => {
        renderWithProvider((ctx) => { context = ctx; });
        act(() => {
            context.setProjectName('X');
            context.setComponentCounts({ led: 1 });
            context.setSelectedComponent('a');
            context.setSelectedWire('b');
            context.setHoveredConnectorID('c');
            context.setClickedConnector({ id: 'd', componentID: 'e', type: 't', hitAreaSize: 1, offset: { x: 0, y: 0 }, isConnected: false });
            context.setCreatingWire({ id: 'w', startConnector: { id: 's', componentID: 'e', type: 't', hitAreaSize: 1, offset: { x: 0, y: 0 }, isConnected: false }, endConnector: null, points: [{ x: 0, y: 0 }] });
            context.addWire({ id: 'w', startConnector: { id: 's', componentID: 'e', type: 't', hitAreaSize: 1, offset: { x: 0, y: 0 }, isConnected: false }, endConnector: null, points: [{ x: 0, y: 0 }] });
            context.addComponent(context.createComponent('led', { x: 0, y: 0 }));
            context.addConnection({
                id: 'conn',
                sourceConnector: { id: 's', componentID: 'e', type: 't', hitAreaSize: 1, offset: { x: 0, y: 0 }, isConnected: false },
                targetConnector: { id: 't', componentID: 'e', type: 't', hitAreaSize: 1, offset: { x: 0, y: 0 }, isConnected: false },
                type: 'wire',
                metadata: { wireID: 'w' }
            });
            context.copySelectedComponent(context.createComponent('led', { x: 1, y: 1 }));
            context.updateComponentElectricalValues({ x: { 0: { voltage: 1, current: 2 } } });
        });
        act(() => context.resetProject());
        expect(context.projectName).toBe('Untitled Project');
        expect(context.components).toEqual({});
        expect(context.componentCounts).toEqual({});
        expect(context.selectedComponent).toBeNull();
        expect(context.selectedWire).toBeNull();
        expect(context.wires).toEqual({});
        expect(context.creatingWire).toBeNull();
        expect(context.hoveredConnectorID).toBeNull();
        expect(context.clickedConnector).toBeNull();
        expect(context.connections).toEqual({});
        expect(context.connectorConnectionMap).toEqual({});
        expect(context.clipboardComponent).toBeNull();
    });
});