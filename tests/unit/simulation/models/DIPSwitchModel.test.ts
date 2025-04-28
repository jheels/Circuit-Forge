import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDipSwitchModel, applyDipSwitchStamp, DipSwitchModel } from '@/simulation/models/DIPSwitchModel';
import { CircuitEdge, CircuitConnection } from '@/simulation/circuit/circuitDetection';
import { Matrix, zeros, matrix } from 'mathjs';

describe('DIPSwitchModel', () => {
    const mockConnection: CircuitConnection = {
        type: 'component',
        id: 'mock-component-id',
        metadata: {
            componentType: 'dip-switch',
            switchIndex: 0
        }
    };
    const mockEdge: CircuitEdge = {
        id: 'edge-n1-n2-mock',
        sourceId: 'n1',
        targetId: 'n2',
        connection: mockConnection
    };

    describe('createDipSwitchModel', () => {
        it('should create a DipSwitchModel with correct properties', () => {
            const model = createDipSwitchModel(2, true, mockEdge);
            expect(model).toMatchObject({
                isLinear: true,
                type: 'dip-switch',
                switchIndex: 2,
                switchState: true,
                edge: mockEdge
            });
        });
    });

    describe('applyDipSwitchStamp', () => {
        let conductanceMatrix: Matrix;
        let nodeMap: Record<string, number>;

        beforeEach(() => {
            conductanceMatrix = matrix(zeros([3, 3])) as Matrix;
            nodeMap = { n1: 0, n2: 1 };
        });

        it('should call applyResistorStamp with high conductance when switch is closed', async () => {
            const model: DipSwitchModel = createDipSwitchModel(0, true, mockEdge);

            // Mock applyResistorStamp
            const applyResistorStampModule = await import('@/simulation/models/resistorModel');
            const spy = vi.spyOn(applyResistorStampModule, 'applyResistorStamp');

            applyDipSwitchStamp(conductanceMatrix, model, nodeMap);

            expect(spy).toHaveBeenCalledWith(
                conductanceMatrix,
                expect.objectContaining({
                    conductance: 1e10,
                    edge: mockEdge
                }),
                nodeMap
            );
            spy.mockRestore();
        });

        it('should call applyResistorStamp with low conductance when switch is open', async () => {
            const model: DipSwitchModel = createDipSwitchModel(0, false, mockEdge);

            // Mock applyResistorStamp
            const applyResistorStampModule = await import('@/simulation/models/resistorModel');
            const spy = vi.spyOn(applyResistorStampModule, 'applyResistorStamp');

            applyDipSwitchStamp(conductanceMatrix, model, nodeMap);

            expect(spy).toHaveBeenCalledWith(
                conductanceMatrix,
                expect.objectContaining({
                    conductance: 1e-20,
                    edge: mockEdge
                }),
                nodeMap
            );
            spy.mockRestore();
        });
    });
});