import { describe, it, expect } from 'vitest';
import { processWireConnections, processDIPSwitchConnections, processICComponentConnections, processTwoTerminalComponentConnections } from '@/simulation/circuit/circuitProcessing';
import { createCircuitNode, CircuitGraph, } from '@/simulation/circuit/circuitDetection';
import { Connection } from '@/definitions/connection';
import { PowerDistribution } from '@/hooks/simulation/useFindPowerDistribution';
import { DIPSwitchComponent } from '@/definitions/components/dipswitch';
import { EditorComponent } from '@/definitions/general';
import { ICComponent } from '@/definitions/components/ic';
import { Connector } from '@/definitions/connector';

describe('circuitProcessing', () => {
    it('processWireConnections creates edge between strips', () => {
        const graph: CircuitGraph = {
            nodes: { s1: createCircuitNode('regular', 's1'), s2: createCircuitNode('regular', 's2') },
            edges: {},
        };
        const connections: Record<string, Connection> = {
            w1: { id: 'w1', type: 'wire', metadata: { stripID: 's1', targetStripID: 's2', wireID: 'w1' } } as Connection,
        };
        const powerDistribution: PowerDistribution = { powerNode: 'p', groundNode: 'g', poweredRails: new Set(), groundedRails: new Set() } as PowerDistribution;
        const result = processWireConnections(graph, connections, powerDistribution);
        expect(Object.values(result.edges).length).toBe(1);
        const edge = Object.values(result.edges)[0];
        expect(edge.sourceId).toBe('s1');
        expect(edge.targetId).toBe('s2');
        expect(edge.connection).toMatchObject({ type: 'wire', id: 'w1' });
    });

    it('processWireConnections skips if node missing', () => {
        const graph: CircuitGraph = { nodes: { s1: createCircuitNode('regular', 's1') }, edges: {} };
        const connections: Record<string, Connection> = {
            w1: { id: 'w1', type: 'wire', metadata: { stripID: 's1', targetStripID: 's2', wireID: 'w1' } } as Connection,
        };
        const powerDistribution: PowerDistribution = { powerNode: 'p', groundNode: 'g', poweredRails: new Set(), groundedRails: new Set() } as PowerDistribution;
        const result = processWireConnections(graph, connections, powerDistribution);
        expect(Object.values(result.edges).length).toBe(0);
    });

    it('processDIPSwitchConnections creates 8 edges for 16 connectors', () => {
        const nodes: CircuitGraph['nodes'] = {};
        for (let i = 0; i < 16; i++) nodes[`s${i}`] = createCircuitNode('regular', `s${i}`);
        const graph: CircuitGraph = { nodes, edges: {} };
        const connectors: Record<string, Connector> = {};
        for (let i = 0; i < 16; i++) connectors[`c${i}`] = { id: `c${i}` } as Connector;
        const dipSwitch: DIPSwitchComponent = { editorID: 'ds1', connectors } as DIPSwitchComponent;
        const connections: Record<string, Connection> = {};
        for (let i = 0; i < 16; i++) connections[`conn${i}`] = { id: `conn${i}`, type: 'strip', metadata: { stripID: `s${i}` } } as Connection;
        const getConnectorConnection = (id: string) => `conn${id.substring(1)}`;
        const powerDistribution: PowerDistribution = { powerNode: 'p', groundNode: 'g', poweredRails: new Set(), groundedRails: new Set() } as PowerDistribution;
        const result = processDIPSwitchConnections(graph, connections, powerDistribution, dipSwitch, getConnectorConnection);
        expect(Object.values(result.edges).length).toBe(8);
        Object.values(result.edges).forEach(edge => expect(edge.connection).toMatchObject({ type: 'component', id: 'ds1' }));
    });

    it('processDIPSwitchConnections returns graph if not 16 connectors', () => {
        const graph: CircuitGraph = { nodes: {}, edges: {} };
        const dipSwitch: DIPSwitchComponent = { editorID: 'ds1', connectors: {} } as DIPSwitchComponent;
        const connections: Record<string, Connection> = {};
        const getConnectorConnection = (id: string) => '';
        const powerDistribution: PowerDistribution = { powerNode: 'p', groundNode: 'g', poweredRails: new Set(), groundedRails: new Set() } as PowerDistribution;
        const result = processDIPSwitchConnections(graph, connections, powerDistribution, dipSwitch, getConnectorConnection);
        expect(result).toBe(graph);
    });

    it('processICComponentConnections creates edge for IC gate', () => {
        const graph: CircuitGraph = { nodes: { s1: createCircuitNode('regular', 's1'), s2: createCircuitNode('regular', 's2') }, edges: {} };
        const connectors: Record<string, Connector> = {
            in1: { id: 'in1', type: 'input', metadata: { gateIndex: 0, inputIndex: 1 } } as Connector,
            out1: { id: 'out1', type: 'output', metadata: { gateIndex: 0 } } as Connector,
        };
        const ic: ICComponent = { editorID: 'ic1', icType: '74LS00', connectors } as ICComponent;
        const connections: Record<string, Connection> = {
            c1: { id: 'c1', type: 'strip', metadata: { stripID: 's1' } } as Connection,
            c2: { id: 'c2', type: 'strip', metadata: { stripID: 's2' } } as Connection,
        };
        const getConnectorConnection = (id: string) => (id === 'in1' ? 'c1' : 'c2');
        const powerDistribution: PowerDistribution = { powerNode: 'p', groundNode: 'g', poweredRails: new Set(), groundedRails: new Set() } as PowerDistribution;
        const result = processICComponentConnections(graph, connections, powerDistribution, ic, getConnectorConnection);
        expect(Object.values(result.edges).length).toBe(1);
        const edge = Object.values(result.edges)[0];
        expect(edge.sourceId).toBe('s1');
        expect(edge.targetId).toBe('s2');
        expect(edge.connection).toMatchObject({ type: 'component', id: 'ic1' });
    });

    it('processICComponentConnections returns graph if no output', () => {
        const graph: CircuitGraph = { nodes: {}, edges: {} };
        const connectors: Record<string, Connector> = { in1: { id: 'in1', type: 'input', metadata: { gateIndex: 0, inputIndex: 1 } } as Connector };
        const ic: ICComponent = { editorID: 'ic1', icType: '7400', connectors } as ICComponent;
        const connections: Record<string, Connection> = {};
        const getConnectorConnection = (id: string) => '';
        const powerDistribution: PowerDistribution = { powerNode: 'p', groundNode: 'g', poweredRails: new Set(), groundedRails: new Set() } as PowerDistribution;
        const result = processICComponentConnections(graph, connections, powerDistribution, ic, getConnectorConnection);
        expect(result).toStrictEqual(graph);
    });

    it('processTwoTerminalComponentConnections creates edge for two-terminal', () => {
        const graph: CircuitGraph = { nodes: { s1: createCircuitNode('regular', 's1'), s2: createCircuitNode('regular', 's2') }, edges: {} };
        const connectors: Record<string, Connector> = { a: { id: 'a' } as Connector, b: { id: 'b' } as Connector };
        const component: EditorComponent = { editorID: 'r1', type: 'resistor', connectors } as EditorComponent;
        const connections: Record<string, Connection> = {
            ca: { id: 'ca', type: 'strip', metadata: { stripID: 's1' } } as Connection,
            cb: { id: 'cb', type: 'strip', metadata: { stripID: 's2' } } as Connection,
        };
        const getConnectorConnection = (id: string) => (id === 'a' ? 'ca' : 'cb');
        const powerDistribution: PowerDistribution = { powerNode: 'p', groundNode: 'g', poweredRails: new Set(), groundedRails: new Set() } as PowerDistribution;
        const result = processTwoTerminalComponentConnections(graph, connections, powerDistribution, component, getConnectorConnection);
        expect(Object.values(result.edges).length).toBe(1);
        const edge = Object.values(result.edges)[0];
        expect(edge.sourceId).toBe('s1');
        expect(edge.targetId).toBe('s2');
        expect(edge.connection).toMatchObject({ type: 'component', id: 'r1' });
    });

    it('processTwoTerminalComponentConnections returns graph if not two connectors', () => {
        const graph: CircuitGraph = { nodes: {}, edges: {} };
        const connectors: Record<string, Connector> = { a: { id: 'a' } as Connector };
        const component: EditorComponent = { editorID: 'r1', type: 'resistor', connectors } as EditorComponent;
        const connections: Record<string, Connection> = {};
        const getConnectorConnection = (id: string) => '';
        const powerDistribution: PowerDistribution = { powerNode: 'p', groundNode: 'g', poweredRails: new Set(), groundedRails: new Set() } as PowerDistribution;
        const result = processTwoTerminalComponentConnections(graph, connections, powerDistribution, component, getConnectorConnection);
        expect(result).toBe(graph);
    });

    it('processWireConnections maps powered/grounded rails to power/ground', () => {
        const graph: CircuitGraph = {
            nodes: { p: createCircuitNode('power', 'p'), g: createCircuitNode('ground', 'g') },
            edges: {},
        };
        const connections: Record<string, Connection> = {
            w1: { id: 'w1', type: 'wire', metadata: { stripID: 's1', targetStripID: 's2', wireID: 'w1' } } as Connection,
        };
        const powerDistribution: PowerDistribution = {
            powerNode: 'p',
            groundNode: 'g',
            poweredRails: new Set(['s1']),
            groundedRails: new Set(['s2']),
        } as PowerDistribution;
        graph.nodes['p'] = createCircuitNode('power', 'p');
        graph.nodes['g'] = createCircuitNode('ground', 'g');
        const result = processWireConnections(graph, connections, powerDistribution);
        const edge = Object.values(result.edges)[0];
        expect(edge.sourceId).toBe('p');
        expect(edge.targetId).toBe('g');
    });
});