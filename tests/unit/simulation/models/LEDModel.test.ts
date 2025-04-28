import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLEDModel, updateLEDModel, applyLEDStamp, LEDModel } from '@/simulation/models/LEDModel';
import { matrix, Matrix } from 'mathjs';
import { CircuitEdge, CircuitConnection } from '@/simulation/circuit/circuitDetection';

// Mock CircuitConnection and CircuitEdge
const mockConnection: CircuitConnection = {
    type: 'component',
    id: 'led1',
    metadata: { componentType: 'led' }
};

const mockEdge: CircuitEdge = {
    id: 'edge-1',
    sourceId: 'n1',
    targetId: 'n2',
    connection: mockConnection
};

describe('LEDModel', () => {
    describe('createLEDModel', () => {
        it('should create an LEDModel with default values', () => {
            const model = createLEDModel(mockEdge);
            expect(model.type).toBe('led');
            expect(model.saturationCurrent).toBeCloseTo(1e-15);
            expect(model.ideality).toBe(3);
            expect(model.thermalVoltage).toBeCloseTo(0.078); // 0.026 * 3
            expect(model.lastVoltage).toBeCloseTo(2.0);
            expect(model.equivalentConductance).toBeGreaterThan(0);
            expect(model.equivalentCurrent).toBeLessThan(0);
            expect(model.edge).toBe(mockEdge);
        });

        it('should use provided lastVoltage', () => {
            const model = createLEDModel(mockEdge, 1.5);
            expect(model.lastVoltage).toBeCloseTo(1.5);
        });
    });

    describe('updateLEDModel', () => {
        let model: LEDModel;
        beforeEach(() => {
            model = createLEDModel(mockEdge, 2.0);
        });

        it('should update lastVoltage and equivalent values', () => {
            const updated = updateLEDModel(model, 2.5);
            expect(updated.lastVoltage).not.toBe(model.lastVoltage);
            expect(updated.equivalentConductance).not.toBe(model.equivalentConductance);
            expect(updated.equivalentCurrent).not.toBe(model.equivalentCurrent);
        });

        it('should limit voltage change to maxChange', () => {
            const maxChange = model.thermalVoltage * 5;
            const updated = updateLEDModel(model, model.lastVoltage + maxChange * 10);
            expect(updated.lastVoltage).toBeCloseTo(model.lastVoltage + maxChange);
        });

        it('should limit negative voltage change to -maxChange', () => {
            const maxChange = model.thermalVoltage * 5;
            const updated = updateLEDModel(model, model.lastVoltage - maxChange * 10);
            expect(updated.lastVoltage).toBeCloseTo(model.lastVoltage - maxChange);
        });
    });

    describe('applyLEDStamp', () => {
        it('should call applyResistorStamp and applyCurrentSourceStamp with correct arguments', async () => {
            const conductanceMatrix = matrix([
                [0, 0],
                [0, 0]
            ]) as Matrix;
            const inputSourcesVector = matrix([
                [0],
                [0]
            ]) as Matrix;
            const model = createLEDModel(mockEdge, 2.0);
            const nodeMap = { n1: 0, n2: 1 };

            // Spy on the actual imported modules
            const resistorModule = await import('@/simulation/models/resistorModel');
            const currentSourceModule = await import('@/simulation/models/currentSourceModel');
            const resistorSpy = vi.spyOn(resistorModule, 'applyResistorStamp');
            const currentSourceSpy = vi.spyOn(currentSourceModule, 'applyCurrentSourceStamp');

            applyLEDStamp(conductanceMatrix, inputSourcesVector, model, nodeMap);

            expect(resistorSpy).toHaveBeenCalledWith(
                conductanceMatrix,
                expect.objectContaining({
                    isLinear: true,
                    type: 'resistor',
                    conductance: model.equivalentConductance,
                    edge: mockEdge
                }),
                nodeMap
            );
            expect(currentSourceSpy).toHaveBeenCalledWith(
                inputSourcesVector,
                expect.objectContaining({
                    isLinear: true,
                    type: 'current-source',
                    current: model.equivalentCurrent,
                    edge: mockEdge
                }),
                nodeMap
            );

            resistorSpy.mockRestore();
            currentSourceSpy.mockRestore();
        });
    });
});