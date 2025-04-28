import { describe, it, expect } from 'vitest';
import { createIndependentVoltageSourceModel, applyVoltageSourceStamp, applyIndependentVoltageSourceStamp, IndependentVoltageSource } from '@/simulation/models/independentVoltageSourceModel';
import { createCircuitEdge, createComponentConnection, CircuitEdge } from '@/simulation/circuit/circuitDetection';
import { matrix, Matrix } from 'mathjs';
import { PowerSupplyComponent } from '@/definitions/components/powerSupply';

// Mock PowerSupplyComponent
const mockPowerSupplyComponent = (voltage: number) => ({
    editorID: 'ps-1',
    type: 'power-supply',
    properties: { voltage },
    dimensions: { width: 1, height: 1 },
    rotation: 0,
    position: { x: 0, y: 0 },
    connectors: {} // left empty for this test
});

// Helper to create a simple CircuitEdge
const mockCircuitEdge = (): CircuitEdge => {
    return createCircuitEdge('nodeA', 'nodeB', createComponentConnection('ps-1', 'power-supply'));
};

describe('IndependentVoltageSourceModel', () => {
    it('createIndependentVoltageSourceModel returns correct model', () => {
        const component = mockPowerSupplyComponent(9);
        const edge = mockCircuitEdge();
        const model = createIndependentVoltageSourceModel(component as PowerSupplyComponent, edge);

        expect(model.type).toBe('independent-voltage-source');
        expect(model.voltage).toBe(9);
        expect(model.edge).toBe(edge);
        expect(model.isLinear).toBe(true);
    });

    it('applyVoltageSourceStamp modifies matrices as expected', () => {
        // 2x2 matrix and 2x1 vector
        const G: Matrix = matrix([[1, 2], [3, 4]]);
        const I: Matrix = matrix([[5], [6]]);
        applyVoltageSourceStamp(G, I, 12, 0);

        // Should resize to 3x3 and 3x1
        expect(G.size()).toEqual([3, 3]);
        expect(I.size()).toEqual([3, 1]);
        // Check the voltage source stamp
        expect(G.get([0, 2])).toBe(1);
        expect(G.get([2, 0])).toBe(1);
        expect(I.get([2, 0])).toBe(12);
    });

    it('applyIndependentVoltageSourceStamp applies correct stamp using nodeMap', () => {
        const component = mockPowerSupplyComponent(5);
        const edge = createCircuitEdge('nodeX', 'nodeY', createComponentConnection('ps-2', 'power-supply'));
        const model: IndependentVoltageSource = createIndependentVoltageSourceModel(component as PowerSupplyComponent, edge);

        const G: Matrix = matrix([[0]]);
        const I: Matrix = matrix([[0]]);
        const nodeMap = { nodeX: 0 };

        applyIndependentVoltageSourceStamp(G, I, model, nodeMap);

        expect(G.size()).toEqual([2, 2]);
        expect(I.size()).toEqual([2, 1]);
        expect(G.get([0, 1])).toBe(1);
        expect(G.get([1, 0])).toBe(1);
        expect(I.get([1, 0])).toBe(5);
    });

    it('applyIndependentVoltageSourceStamp throws if node not in nodeMap', () => {
        const component = mockPowerSupplyComponent(3.3);
        const edge = createCircuitEdge('nodeA', 'nodeB', createComponentConnection('ps-3', 'power-supply'));
        const model: IndependentVoltageSource = createIndependentVoltageSourceModel(component as PowerSupplyComponent, edge);

        const G: Matrix = matrix([[0]]);
        const I: Matrix = matrix([[0]]);
        const nodeMap = { nodeZ: 0 };

        expect(() => applyIndependentVoltageSourceStamp(G, I, model, nodeMap)).toThrow();
    });
});