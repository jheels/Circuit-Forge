import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLogicGateModel, evaluateLogicGate, updateLogicGateModel, applyLogicGateStamp, LogicGateModel } from '../../../../src/simulation/models/logicGateModel';
import { Matrix } from 'mathjs';
import { CircuitEdge } from '@/simulation/circuit/circuitDetection';
import { applyVoltageSourceStamp } from '@/simulation/models/independentVoltageSourceModel';
import { before } from 'node:test';

// Helper to mock a CircuitEdge for a given gate type
function mockCircuitEdge(gateType: string): CircuitEdge {
    return {
        id: 'edge-1',
        sourceId: 'n1',
        targetId: 'n2',
        connection: {
            type: 'component',
            id: 'ic-1',
            metadata: {
                componentType: 'ic',
                icType: '74LS00',
                gateIndex: 0,
                gateType,
                pinFunction: 'output'
            }
        }
    };
}

const applyVoltageSourceStampMock = vi.fn();
vi.mock('@/simulation/models/independentVoltageSourceModel', () => ({
    applyVoltageSourceStamp: (conductanceMatrix: Matrix, inputSourcesVector: Matrix, voltage: number, nodeId: number) => {
        applyVoltageSourceStampMock(conductanceMatrix, inputSourcesVector, voltage, nodeId);
    }
}));

beforeEach(() => {
    applyVoltageSourceStampMock.mockClear();
});

describe('LogicGateModel', () => {
    describe('createLogicGateModel', () => {
        it('should create a model with correct fields', () => {
            const edge = mockCircuitEdge('AND');
            const model = createLogicGateModel(edge, ['a', 'b'], 'out');
            expect(model.type).toBe('logic-gate');
            expect(model.gateType).toBe('AND');
            expect(model.inputNodeIds).toEqual(['a', 'b']);
            expect(model.outputNodeId).toBe('out');
            expect(model.lastInputVoltages).toEqual([0, 0]);
            expect(model.lastOutputVoltage).toBe(0);
            expect(model.edge).toBe(edge);
        });

        it('should set gateType to unknown if not IC component', () => {
            const edge = {
                id: 'edge-2',
                sourceId: 'n1',
                targetId: 'n2',
                connection: {
                    type: 'component',
                    id: 'other-1',
                    metadata: { componentType: 'other' }
                }
            };
            const model = createLogicGateModel(edge, ['a'], 'out');
            expect(model.gateType).toBe('unknown');
        });

        it('should handle empty inputNodeIds', () => {
            const edge = mockCircuitEdge('AND');
            const model = createLogicGateModel(edge, [], 'out');
            expect(model.lastInputVoltages).toEqual([]);
        });
    });

    describe('evaluateLogicGate', () => {
        it('should evaluate AND gate', () => {
            expect(evaluateLogicGate('AND', [5, 5], 0)).toBe(5);
            expect(evaluateLogicGate('AND', [5, 0], 0)).toBe(0);
            expect(evaluateLogicGate('AND', [0, 0], 0)).toBe(0);
        });

        it('should evaluate OR gate', () => {
            expect(evaluateLogicGate('OR', [5, 0], 0)).toBe(5);
            expect(evaluateLogicGate('OR', [0, 0], 0)).toBe(0);
        });

        it('should evaluate NAND gate', () => {
            expect(evaluateLogicGate('NAND', [5, 5], 0)).toBe(0);
            expect(evaluateLogicGate('NAND', [5, 0], 0)).toBe(5);
        });

        it('should evaluate NOR gate', () => {
            expect(evaluateLogicGate('NOR', [0, 0], 0)).toBe(5);
            expect(evaluateLogicGate('NOR', [5, 0], 0)).toBe(0);
        });

        it('should evaluate XOR gate', () => {
            expect(evaluateLogicGate('XOR', [5, 0], 0)).toBe(5);
            expect(evaluateLogicGate('XOR', [5, 5], 0)).toBe(0);
            expect(evaluateLogicGate('XOR', [0, 0], 0)).toBe(0);
        });

        it('should evaluate NOT gate', () => {
            expect(evaluateLogicGate('NOT', [5], 0)).toBe(0);
            expect(evaluateLogicGate('NOT', [0], 0)).toBe(5);
        });

        it('should return 0 for unknown gate', () => {
            expect(evaluateLogicGate('UNKNOWN', [5, 5], 0)).toBe(0);
        });

        it('should apply hysteresis: lastOutputVoltage > 2.5 keeps output high', () => {
            expect(evaluateLogicGate('NOT', [1.5], 5)).toBe(0);
            expect(evaluateLogicGate('NOT', [1.5], 0)).toBe(5);
        });

        it('should apply hysteresis for AND gate', () => {
            expect(evaluateLogicGate('AND', [1.5, 1.5], 5)).toBe(5);
            expect(evaluateLogicGate('AND', [1.5, 1.5], 0)).toBe(0);
        });

        it('should handle edge voltages for digital threshold', () => {
            expect(evaluateLogicGate('AND', [0.7, 5], 0)).toBe(0);
            expect(evaluateLogicGate('AND', [2.1, 5], 0)).toBe(5);
            expect(evaluateLogicGate('AND', [0.8, 2.0], 0)).toBe(0);
        });

        it('should handle single input gates', () => {
            expect(evaluateLogicGate('NOT', [5], 0)).toBe(0);
            expect(evaluateLogicGate('NOT', [0], 0)).toBe(5);
        });

        it('should handle empty inputVoltages', () => {
            expect(evaluateLogicGate('AND', [], 0)).toBe(5);
            expect(evaluateLogicGate('OR', [], 0)).toBe(0);
            expect(evaluateLogicGate('NAND', [], 0)).toBe(0);
            expect(evaluateLogicGate('NOR', [], 0)).toBe(5);
            expect(evaluateLogicGate('XOR', [], 0)).toBe(0);
            expect(evaluateLogicGate('NOT', [], 0)).toBe(5);
        });

        it('should handle undefined previousModel', () => {
            expect(evaluateLogicGate('AND', [1.5, 1.5], 0, undefined)).toBe(0);
        });
    });

    describe('updateLogicGateModel', () => {
        it('should update input voltages and output voltage', () => {
            const edge = mockCircuitEdge('AND');
            const model = createLogicGateModel(edge, ['a', 'b'], 'out');
            const voltages = { a: 5, b: 0 };
            const updated = updateLogicGateModel(model, voltages);
            expect(updated.lastInputVoltages).toEqual([5, 0]);
            expect(updated.lastOutputVoltage).toBe(0);
        });

        it('should default missing voltages to 0', () => {
            const edge = mockCircuitEdge('OR');
            const model = createLogicGateModel(edge, ['a', 'b'], 'out');
            const voltages = { a: 5 };
            const updated = updateLogicGateModel(model, voltages);
            expect(updated.lastInputVoltages).toEqual([5, 0]);
            expect(updated.lastOutputVoltage).toBe(5);
        });

        it('should use previousModel if provided (hysteresis)', () => {
            const edge = mockCircuitEdge('NOT');
            const model = createLogicGateModel(edge, ['a'], 'out');
            const voltages = { a: 1.5 };
            const updated = updateLogicGateModel(model, voltages);
            expect(updated.lastOutputVoltage).toBe(5);
        });

        it('should not mutate the original model', () => {
            const edge = mockCircuitEdge('AND');
            const model = createLogicGateModel(edge, ['a', 'b'], 'out');
            const voltages = { a: 5, b: 5 };
            const updated = updateLogicGateModel(model, voltages);
            expect(model.lastInputVoltages).toEqual([0, 0]);
            expect(model.lastOutputVoltage).toBe(0);
            expect(updated.lastInputVoltages).toEqual([5, 5]);
            expect(updated.lastOutputVoltage).toBe(5);
        });

        it('should handle empty inputNodeIds', () => {
            const edge = mockCircuitEdge('AND');
            const model = createLogicGateModel(edge, [], 'out');
            const voltages = {};
            const updated = updateLogicGateModel(model, voltages);
            expect(updated.lastInputVoltages).toEqual([]);
            expect(updated.lastOutputVoltage).toBe(5);
        });
    });

    describe('applyLogicGateStamp', () => {
        let conductanceMatrix: Matrix;
        let inputSourcesVector: Matrix;
        let nodeMap: Record<string, number>;
        let model: LogicGateModel;

        beforeEach(() => {
            conductanceMatrix = {} as Matrix;
            inputSourcesVector = {} as Matrix;
            nodeMap = { out: 2 };
            model = {
                isLinear: false,
                type: 'logic-gate',
                gateType: 'AND',
                inputNodeIds: ['a', 'b'],
                outputNodeId: 'out',
                lastInputVoltages: [5, 5],
                lastOutputVoltage: 5,
                edge: mockCircuitEdge('AND')
            };
        });

        it('should call applyVoltageSourceStamp with correct args', () => {
            applyLogicGateStamp(conductanceMatrix, inputSourcesVector, model, nodeMap);
            expect(applyVoltageSourceStampMock).toHaveBeenCalledWith(
                conductanceMatrix,
                inputSourcesVector,
                5,
                2
            );
        });

        it('should not call applyVoltageSourceStamp if outputNodeId not in nodeMap', () => {
            applyLogicGateStamp(conductanceMatrix, inputSourcesVector, model, {});
            expect(applyVoltageSourceStampMock).not.toHaveBeenCalled();
        });

        it('should handle negative output voltage', () => {
            model.lastOutputVoltage = -5;
            applyLogicGateStamp(conductanceMatrix, inputSourcesVector, model, nodeMap);
            expect(applyVoltageSourceStampMock).toHaveBeenCalledWith(
                conductanceMatrix,
                inputSourcesVector,
                -5,
                2
            );
        });
    });
});