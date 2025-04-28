import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createComponentModel, applyComponentStamp, ComponentModel } from '@/simulation/models/componentModelFactory';
import { EditorComponent } from '@/definitions/general';
import { CircuitEdge } from '@/simulation/circuit/circuitDetection';
import { Matrix } from 'mathjs';
import { DIPSwitchComponent } from '@/definitions/components/dipswitch';
import { ResistorComponent } from '@/definitions/components/resistor';
import { PowerSupplyComponent } from '@/definitions/components/powerSupply';
import { LEDComponent } from '@/definitions/components/led';
import { applyResistorStamp, ResistorModel } from '@/simulation/models/resistorModel';
import { applyDipSwitchStamp, DipSwitchModel } from '@/simulation/models/DIPSwitchModel';
import { applyIndependentVoltageSourceStamp, IndependentVoltageSource } from '@/simulation/models/independentVoltageSourceModel';
import { applyLEDStamp, LEDModel } from '@/simulation/models/LEDModel';
import { applyLogicGateStamp, LogicGateModel } from '@/simulation/models/logicGateModel';

// Mocks for dependencies
const mockDipSwitchModel = { isLinear: true, type: 'dip-switch', edge: {} };
const mockResistorModel = { isLinear: true, type: 'resistor', edge: {} };
const mockIVSModel = { isLinear: false, type: 'independent-voltage-source', edge: {} };
const mockLEDModel = { isLinear: false, type: 'led', edge: {} };

vi.mock('@/simulation/models/resistorModel', () => ({
    createResistorModel: vi.fn(() => mockResistorModel),
    applyResistorStamp: vi.fn()
}));
vi.mock('@/simulation/models/DIPSwitchModel', () => ({
    createDipSwitchModel: vi.fn(() => mockDipSwitchModel),
    applyDipSwitchStamp: vi.fn()
}));
vi.mock('@/simulation/models/independentVoltageSourceModel', () => ({
    createIndependentVoltageSourceModel: vi.fn(() => mockIVSModel),
    applyIndependentVoltageSourceStamp: vi.fn()
}));
vi.mock('@/simulation/models/LEDModel', () => ({
    createLEDModel: vi.fn(() => mockLEDModel),
    applyLEDStamp: vi.fn()
}));
vi.mock('@/simulation/models/logicGateModel', () => ({
    applyLogicGateStamp: vi.fn()
}));

vi.mock('@/simulation/circuit/circuitDetection', () => ({
    isDIPSwitchConnection: vi.fn(conn => conn && conn.type === 'dipswitch'),
    getSwitchIndex: vi.fn(() => 1)
}));

function makeEdge(type: string = 'component', metadata: any = {}): CircuitEdge {
    return {
        id: 'edge-1',
        sourceId: 'n1',
        targetId: 'n2',
        connection: { type, id: 'c1', metadata }
    };
}

describe('createComponentModel', () => {
    it('returns dip-switch model if type is dip-switch and connection matches', () => {
        const component = { type: 'dip-switch', switchStates: [false, true] } as DIPSwitchComponent;
        const edge = makeEdge('dipswitch');
        const model = createComponentModel(component, edge);
        expect(model).toBe(mockDipSwitchModel);
    });

    it('returns resistor model for resistor type', () => {
        const component = { type: 'resistor' } as ResistorComponent;
        const edge = makeEdge();
        const model = createComponentModel(component, edge);
        expect(model).toBe(mockResistorModel);
    });

    it('returns IVS model for power-supply type', () => {
        const component = { type: 'power-supply' } as PowerSupplyComponent;
        const edge = makeEdge();
        const model = createComponentModel(component, edge);
        expect(model).toBe(mockIVSModel);
    });

    it('returns LED model for led type', () => {
        const component = { type: 'led' } as LEDComponent;
        const edge = makeEdge();
        const model = createComponentModel(component, edge);
        expect(model).toBe(mockLEDModel);
    });

    it('returns null and warns for unsupported type', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const component = { type: 'foo' } as EditorComponent;
        const edge = makeEdge();
        const model = createComponentModel(component, edge);
        expect(model).toBeNull();
        expect(warnSpy).toHaveBeenCalledWith('Component type foo not supported');
        warnSpy.mockRestore();
    });

    it('returns null if dip-switch type but not a DIPSwitchConnection', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const component = { type: 'dip-switch', switchStates: [false, true] } as DIPSwitchComponent;
        const edge = makeEdge('component', { componentType: 'not-dip-switch' });
        const model = createComponentModel(component, edge);
        expect(model).toBeNull();
        warnSpy.mockRestore();
    });
});

describe('applyComponentStamp', () => {
    const conductanceMatrix = {} as Matrix;
    const nodeMap = { a: 1, b: 2 };
    const inputSourcesMatrix = {} as Matrix;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls applyResistorStamp for resistor', () => {
        const model = { type: 'resistor', isLinear: true, edge: {} };
        applyComponentStamp(model as ResistorModel, conductanceMatrix, nodeMap);
        expect(applyResistorStamp).toHaveBeenCalledWith(conductanceMatrix, model, nodeMap);
    });

    it('calls applyDipSwitchStamp for dip-switch', () => {
        const model = { type: 'dip-switch', isLinear: true, edge: {} };
        applyComponentStamp(model as DipSwitchModel, conductanceMatrix, nodeMap);
        expect(applyDipSwitchStamp).toHaveBeenCalledWith(conductanceMatrix, model, nodeMap);
    });

    it('calls applyIndependentVoltageSourceStamp for IVS with inputSourcesMatrix', () => {
        const model = { type: 'independent-voltage-source', isLinear: false, edge: {} };
        applyComponentStamp(model as IndependentVoltageSource, conductanceMatrix, nodeMap, inputSourcesMatrix);
        expect(applyIndependentVoltageSourceStamp).toHaveBeenCalledWith(conductanceMatrix, inputSourcesMatrix, model, nodeMap);
    });

    it('does not call applyIndependentVoltageSourceStamp if inputSourcesMatrix missing', () => {
        const model = { type: 'independent-voltage-source', isLinear: false, edge: {} };
        applyComponentStamp(model as IndependentVoltageSource, conductanceMatrix, nodeMap);
        expect(applyIndependentVoltageSourceStamp).not.toHaveBeenCalled();
    });

    it('calls applyLEDStamp for led with inputSourcesMatrix', () => {
        const model = { type: 'led', isLinear: false, edge: {} };
        applyComponentStamp(model as LEDModel, conductanceMatrix, nodeMap, inputSourcesMatrix);
        expect(applyLEDStamp).toHaveBeenCalledWith(conductanceMatrix, inputSourcesMatrix, model, nodeMap);
    });

    it('does not call applyLEDStamp if inputSourcesMatrix missing', () => {
        const model = { type: 'led', isLinear: false, edge: {} };
        applyComponentStamp(model as LEDModel, conductanceMatrix, nodeMap);
        expect(applyLEDStamp).not.toHaveBeenCalled();
    });

    it('calls applyLogicGateStamp for logic-gate with inputSourcesMatrix', () => {
        const model = { type: 'logic-gate', isLinear: false, edge: {} };
        applyComponentStamp(model as LogicGateModel, conductanceMatrix, nodeMap, inputSourcesMatrix);
        expect(applyLogicGateStamp).toHaveBeenCalledWith(conductanceMatrix, inputSourcesMatrix, model, nodeMap);
    });

    it('does not call applyLogicGateStamp if inputSourcesMatrix missing', () => {
        const model = { type: 'logic-gate', isLinear: false, edge: {} };
        applyComponentStamp(model as LogicGateModel, conductanceMatrix, nodeMap);
        expect(applyLogicGateStamp).not.toHaveBeenCalled();
    });

    it('warns for unsupported model type', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const model = { type: 'foo', isLinear: false, edge: {} };
        applyComponentStamp(model as ComponentModel, conductanceMatrix, nodeMap);
        expect(warnSpy).toHaveBeenCalledWith('Component type foo not supported');
        warnSpy.mockRestore();
    });

    it('does nothing if model is missing type', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const model = { isLinear: false, edge: {} };
        applyComponentStamp(model as ComponentModel, conductanceMatrix, nodeMap);
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });
});