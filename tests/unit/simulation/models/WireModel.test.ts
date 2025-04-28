import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWireModel, applyWireStamp } from '@/simulation/models/wireModel';
import { CircuitEdge, CircuitConnection } from '@/simulation/circuit/circuitDetection';
import { Matrix, zeros, matrix } from 'mathjs';

describe('WireModel', () => {
    const mockConnection: CircuitConnection = {
        type: 'component',
        id: 'wire1',
        metadata: { componentType: 'wire' }
    };
    const mockEdge: CircuitEdge = {
        id: 'edge-wire-n1-n2',
        sourceId: 'n1',
        targetId: 'n2',
        connection: mockConnection
    };

    describe('createWireModel', () => {
        it('should create a WireModel with correct properties', () => {
            const model = createWireModel(mockEdge);
            expect(model).toMatchObject({
                isLinear: true,
                type: 'resistor',
                conductance: 1,
                edge: mockEdge
            });
        });
    });

    describe('applyWireStamp', () => {
        let conductanceMatrix: Matrix;
        let nodeMap: Record<string, number>;

        beforeEach(() => {
            conductanceMatrix = matrix(zeros([3, 3])) as Matrix;
            nodeMap = { n1: 0, n2: 1 };
        });

        it('should call applyResistorStamp with correct arguments', async () => {
            const model = createWireModel(mockEdge);

            // Mock applyResistorStamp
            const resistorModule = await import('@/simulation/models/resistorModel');
            const spy = vi.spyOn(resistorModule, 'applyResistorStamp');

            applyWireStamp(conductanceMatrix, model, nodeMap);

            expect(spy).toHaveBeenCalledWith(
                conductanceMatrix,
                expect.objectContaining({
                    conductance: 1,
                    edge: mockEdge
                }),
                nodeMap
            );
            spy.mockRestore();
        });
    });
});