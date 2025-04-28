import { describe, it, expect, beforeEach } from 'vitest';
import { createResistorModel, applyResistorStamp, ResistorModel } from '@/simulation/models/resistorModel';
import { CircuitEdge, createWireConnection } from '@/simulation/circuit/circuitDetection';
import { Matrix, matrix } from 'mathjs';
import type { EditorComponent } from '@/definitions/general';
import { ResistorComponent } from '@/definitions/components/resistor';

// Mock ResistorComponent based on EditorComponent
const mockResistorComponent = (value: number, unit: string): EditorComponent & { properties: { value: number, unit: string } } => ({
    editorID: 'resistor-1',
    type: 'resistor',
    dimensions: { width: 10, height: 5 },
    rotation: 0,
    position: { x: 0, y: 0 },
    properties: { value, unit },
    connectors: {},
});

// Helper to create a mock CircuitEdge
const mockCircuitEdge = (sourceId: string, targetId: string): CircuitEdge => ({
    id: 'edge-1',
    sourceId,
    targetId,
    connection: createWireConnection('wire-1'),
});

describe('ResistorModel', () => {
    it('creates a resistor model with correct conductance for ohms', () => {
        const component = mockResistorComponent(100, 'Ω');
        const edge = mockCircuitEdge('n1', 'n2');
        const model = createResistorModel(component as ResistorComponent, edge);

        expect(model.type).toBe('resistor');
        expect(model.conductance).toBeCloseTo(1 / 100);
        expect(model.edge).toBe(edge);
        expect(model.isLinear).toBe(true);
    });

    it('creates a resistor model with correct conductance for kΩ', () => {
        const component = mockResistorComponent(2, 'kΩ');
        const edge = mockCircuitEdge('n1', 'n2');
        const model = createResistorModel(component as ResistorComponent, edge);

        expect(model.conductance).toBeCloseTo(1 / 2000);
    });

    it('creates a resistor model with correct conductance for MΩ', () => {
        const component = mockResistorComponent(0.5, 'MΩ');
        const edge = mockCircuitEdge('n1', 'n2');
        const model = createResistorModel(component as ResistorComponent, edge);

        expect(model.conductance).toBeCloseTo(1 / 500000);
    });
});

describe('applyResistorStamp', () => {
    let mat: Matrix;
    let nodeMap: Record<string, number>;

    beforeEach(() => {
        // 3x3 zero matrix for 3 nodes
        mat = matrix([
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ]);
        nodeMap = { n1: 0, n2: 1, n3: 2 };
    });

    it('applies stamp between two nodes', () => {
        const edge = mockCircuitEdge('n1', 'n2');
        const model: ResistorModel = {
            isLinear: true,
            type: 'resistor',
            conductance: 0.01,
            edge,
        };

        applyResistorStamp(mat, model, nodeMap);

        expect(mat.get([0, 0])).toBeCloseTo(0.01);
        expect(mat.get([1, 1])).toBeCloseTo(0.01);
        expect(mat.get([0, 1])).toBeCloseTo(-0.01);
        expect(mat.get([1, 0])).toBeCloseTo(-0.01);
    });

    it('applies stamp when one node is ground (missing from nodeMap)', () => {
        // Remove n2 from nodeMap to simulate ground
        nodeMap = { n1: 0 };
        const edge = mockCircuitEdge('n1', 'n2');
        const model: ResistorModel = {
            isLinear: true,
            type: 'resistor',
            conductance: 0.02,
            edge,
        };

        applyResistorStamp(mat, model, nodeMap);

        expect(mat.get([0, 0])).toBeCloseTo(0.02);
    });

    it('applies stamp when the other node is ground (missing from nodeMap)', () => {
        nodeMap = { n2: 1 };
        const edge = mockCircuitEdge('n1', 'n2');
        const model: ResistorModel = {
            isLinear: true,
            type: 'resistor',
            conductance: 0.05,
            edge,
        };

        applyResistorStamp(mat, model, nodeMap);

        expect(mat.get([1, 1])).toBeCloseTo(0.05);
    });
});