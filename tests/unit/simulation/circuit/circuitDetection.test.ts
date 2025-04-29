import { describe, it, expect } from 'vitest';
import {
    createComponentConnection,
    createDIPSwitchConnection,
    createICComponentConnection,
    createWireConnection,
    isDIPSwitchConnection,
    isICComponentConnection,
    getComponentType,
    getSwitchIndex,
    createCircuitNode,
    createCircuitEdge,
    initialiseCircuitGraph,
    initialisePowerDistribution,
    initialiseActiveRegularStrips,
    findConnectedCircuit,
    removeDisconnectedPaths,
    CircuitGraph,
} from '@/simulation/circuit/circuitDetection';
import { Connection } from '@/definitions/connection';
import { Connector, createConnector } from '@/definitions/connector';

describe('circuitDetection', () => {
    it('createComponentConnection returns correct object', () => {
        const conn = createComponentConnection('c1', 'resistor', { foo: 1 });
        expect(conn).toMatchObject({ type: 'component', id: 'c1', metadata: { componentType: 'resistor', foo: 1 } });
    });

    it('createDIPSwitchConnection returns correct object', () => {
        const conn = createDIPSwitchConnection('d1', 2);
        expect(conn).toMatchObject({ type: 'component', id: 'd1', metadata: { componentType: 'dip-switch', switchIndex: 2 } });
    });

    it('createICComponentConnection returns correct object', () => {
        const conn = createICComponentConnection('ic1', '7400', 0, 'NAND', 'input', 1);
        expect(conn).toMatchObject({
            type: 'component',
            id: 'ic1',
            metadata: {
                componentType: 'ic',
                icType: '7400',
                gateIndex: 0,
                gateType: 'NAND',
                pinFunction: 'input',
                inputIndex: 1,
            },
        });
    });

    it('createWireConnection returns correct object', () => {
        const conn = createWireConnection('w1');
        expect(conn).toMatchObject({ type: 'wire', id: 'w1' });
    });

    it('isDIPSwitchConnection detects DIPSwitch', () => {
        const conn = createDIPSwitchConnection('d1', 1);
        expect(isDIPSwitchConnection(conn)).toBe(true);
        expect(isDIPSwitchConnection(createComponentConnection('c1', 'resistor'))).toBe(false);
    });

    it('isICComponentConnection detects IC', () => {
        const conn = createICComponentConnection('ic1', '7400', 0, 'NAND', 'input');
        expect(isICComponentConnection(conn)).toBe(true);
        expect(isICComponentConnection(createComponentConnection('c1', 'resistor'))).toBe(false);
    });

    it('getComponentType returns correct type', () => {
        expect(getComponentType(createComponentConnection('c1', 'resistor'))).toBe('resistor');
        expect(getComponentType(createWireConnection('w1'))).toBeUndefined();
    });

    it('getSwitchIndex returns correct index', () => {
        expect(getSwitchIndex(createDIPSwitchConnection('d1', 3))).toBe(3);
        expect(getSwitchIndex(createComponentConnection('c1', 'resistor'))).toBeUndefined();
    });

    it('createCircuitNode returns correct node', () => {
        const node = createCircuitNode('regular', 'strip1');
        expect(node).toEqual({ id: 'strip1', type: 'regular' });
    });

    it('createCircuitEdge returns correct edge', () => {
        const conn = createWireConnection('w1');
        const edge = createCircuitEdge('n1', 'n2', conn);
        expect(edge.sourceId).toBe('n1');
        expect(edge.targetId).toBe('n2');
        expect(edge.connection).toBe(conn);
        expect(edge.id).toMatch(/^edge-n1-n2-/);
    });

    it('initialiseCircuitGraph returns empty graph', () => {
        const graph = initialiseCircuitGraph();
        expect(graph.nodes).toEqual({});
        expect(graph.edges).toEqual({});
    });

    it('initialisePowerDistribution adds power and ground nodes and edge', () => {
        const pd = { powerNode: 'p', groundNode: 'g' };
        const ps = { editorID: 'ps1', type: 'power-supply' } as any;
        const graph = initialisePowerDistribution(pd, ps, initialiseCircuitGraph());
        expect(graph.nodes['p']).toMatchObject({ id: 'p', type: 'power' });
        expect(graph.nodes['g']).toMatchObject({ id: 'g', type: 'ground' });
        expect(Object.values(graph.edges).length).toBe(1);
        const edge = Object.values(graph.edges)[0];
        expect(edge.sourceId).toBe('p');
        expect(edge.targetId).toBe('g');
    });

    it('initialiseActiveRegularStrips adds only bidirectional strips', () => {
        const graph = initialiseCircuitGraph();
        const connector: Connector = createConnector('c1', 'positive', { x: 0, y: 0 });
        const connections = {
            c1: { id: 'c1', sourceConnector: connector, targetConnector: connector, type: 'strip', metadata: { stripID: 's1' } },
            c2: { id: 'c2', sourceConnector: connector, targetConnector: connector, type: 'strip', metadata: { stripID: 's2' } },
            c3: { id: 'c3', sourceConnector: connector, targetConnector: connector, type: 'wire', metadata: { stripID: 's3', targetStripID: 's4' } },
        } as Record<string, Connection>;
        const breadboard = {
            stripMapping: {
                strips: {
                    s1: { type: 'bidirectional' },
                    s2: { type: 'power' },
                    s3: { type: 'bidirectional' },
                    s4: { type: 'bidirectional' },
                },
            },
        } as any;
        const result = initialiseActiveRegularStrips(graph, connections, breadboard);
        expect(result.nodes['s1']).toBeDefined();
        expect(result.nodes['s3']).toBeDefined();
        expect(result.nodes['s4']).toBeDefined();
        expect(result.nodes['s2']).toBeUndefined();
    });

    it('findConnectedCircuit returns only connected nodes/edges from unified-power', () => {
        const graph: CircuitGraph = {
            nodes: {
                'unified-power': { id: 'unified-power', type: 'power' },
                n1: { id: 'n1', type: 'regular' },
                n2: { id: 'n2', type: 'regular' },
                n3: { id: 'n3', type: 'regular' },
            },
            edges: {
                e1: { id: 'e1', sourceId: 'unified-power', targetId: 'n1', connection: createWireConnection('w1') },
                e2: { id: 'e2', sourceId: 'n1', targetId: 'n2', connection: createWireConnection('w2') },
                e3: { id: 'e3', sourceId: 'n3', targetId: 'n3', connection: createWireConnection('w3') }, // disconnected
            },
        };
        const result = findConnectedCircuit(graph);
        expect(result.nodes['unified-power']).toBeDefined();
        expect(result.nodes['n1']).toBeDefined();
        expect(result.nodes['n2']).toBeDefined();
        expect(result.nodes['n3']).toBeUndefined();
        expect(result.edges['e1']).toBeDefined();
        expect(result.edges['e2']).toBeDefined();
        expect(result.edges['e3']).toBeUndefined();
    });

    it('removeDisconnectedPaths keeps only paths from power to ground', () => {
        const pd = { powerNode: 'p', groundNode: 'g' };
        const graph: CircuitGraph = {
            nodes: {
                p: { id: 'p', type: 'power' },
                n1: { id: 'n1', type: 'regular' },
                g: { id: 'g', type: 'ground' },
                n2: { id: 'n2', type: 'regular' },
            },
            edges: {
                e1: { id: 'e1', sourceId: 'p', targetId: 'n1', connection: createWireConnection('w1') },
                e2: { id: 'e2', sourceId: 'n1', targetId: 'g', connection: createWireConnection('w2') },
                e3: { id: 'e3', sourceId: 'n2', targetId: 'n2', connection: createWireConnection('w3') }, // disconnected
            },
        };
        const result = removeDisconnectedPaths(graph, pd);
        expect(result.nodes['p']).toBeDefined();
        expect(result.nodes['n1']).toBeDefined();
        expect(result.nodes['g']).toBeDefined();
        expect(result.nodes['n2']).toBeUndefined();
        expect(result.edges['e1']).toBeDefined();
        expect(result.edges['e2']).toBeDefined();
        expect(result.edges['e3']).toBeUndefined();
    });

    // Negative tests
    it('getComponentType returns undefined for wire connection', () => {
        expect(getComponentType({ type: 'wire', id: 'w1' })).toBeUndefined();
    });

    it('getSwitchIndex returns undefined for non-dip-switch', () => {
        expect(getSwitchIndex({ type: 'component', id: 'c1', metadata: { componentType: 'resistor' } })).toBeUndefined();
    });

    it('isDIPSwitchConnection returns false for wire', () => {
        expect(isDIPSwitchConnection({ type: 'wire', id: 'w1' })).toBe(false);
    });

    it('isICComponentConnection returns false for wire', () => {
        expect(isICComponentConnection({ type: 'wire', id: 'w1' })).toBe(false);
    });

    it('findConnectedCircuit returns empty if unified-power not present', () => {
        const graph: CircuitGraph = {
            nodes: { n1: { id: 'n1', type: 'regular' } },
            edges: {},
        };
        const result = findConnectedCircuit(graph);
        expect(result.nodes['n1']).toBeUndefined();
        expect(Object.keys(result.nodes)).toHaveLength(0);
    });

    it('removeDisconnectedPaths returns only power and ground if no path', () => {
        const pd = { powerNode: 'p', groundNode: 'g' };
        const graph: CircuitGraph = {
            nodes: {
                p: { id: 'p', type: 'power' },
                g: { id: 'g', type: 'ground' },
                n1: { id: 'n1', type: 'regular' },
            },
            edges: {
                e1: { id: 'e1', sourceId: 'n1', targetId: 'n1', connection: createWireConnection('w1') },
            },
        };
        const result = removeDisconnectedPaths(graph, pd);
        expect(result.nodes['p']).toBeDefined();
        expect(result.nodes['g']).toBeDefined();
        expect(result.nodes['n1']).toBeUndefined();
        expect(Object.keys(result.edges)).toHaveLength(0);
    });
});