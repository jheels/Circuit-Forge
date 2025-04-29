import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createICComponent, createQuadNANDGate, createQuadNORGate, createHexInverter, createQuadANDGate, createQuadORGate, createQuadXORGate, ICDefinition } from '@/definitions/components/ic';
import * as connectorModule from '@/definitions/connector';
import * as propertiesModule from '@/definitions/properties';

const mockPoint = { x: 1, y: 2 };
const mockName = 'IC1';
const mockICDef: ICDefinition  = {
    icType: 'TESTIC',
    description: 'Test IC',
    gateType: 'TEST',
    gateCount: 2,
    inputsPerGate: 2,
    outputsPerGate: 1,
    pinMappings: {
        1: { type: 'input', name: 'A' },
        2: { type: 'output', name: 'Y' },
        3: { type: 'negative', name: 'GND' },
        4: { type: 'positive', name: 'VCC' }
    }
};
const mockProperties = { foo: 'bar' };
const mockConnectors = [
    { id: 'c1', componentID: 'mock', type: 'input', hitAreaSize: 2.5, offset: { x: 0, y: 0 }, isConnected: false, metadata: {} },
    { id: 'c2', componentID: 'mock', type: 'output', hitAreaSize: 2.5, offset: { x: 1, y: 0 }, isConnected: false, metadata: {} },
    { id: 'c3', componentID: 'mock', type: 'negative', hitAreaSize: 2.5, offset: { x: 0, y: 1 }, isConnected: false, metadata: {} },
    { id: 'c4', componentID: 'mock', type: 'positive', hitAreaSize: 2.5, offset: { x: 1, y: 1 }, isConnected: false, metadata: {} }
];

describe('createICComponent', () => {
    beforeEach(() => {
        let call = 0;
        vi.spyOn(connectorModule, 'createConnector').mockImplementation(() => mockConnectors[call++] as connectorModule.Connector);
        vi.spyOn(propertiesModule, 'createDefaultProperties').mockReturnValue(mockProperties as Record<string, propertiesModule.PropertyValue>);
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create an ICComponent with correct structure', () => {
        const ic = createICComponent(mockPoint, mockName, mockICDef);
        expect(ic.editorID).toMatch(/^IC-TESTIC-/);
        expect(ic.type).toBe('ic');
        expect(ic.icType).toBe('TESTIC');
        expect(ic.dimensions).toEqual({ width: 15, height: 35 });
        expect(ic.rotation).toBe(0);
        expect(ic.position).toBe(mockPoint);
        expect(ic.properties).toBe(mockProperties);
        expect(Object.values(ic.connectors)).toHaveLength(4);
        expect(ic.connectors['c1']).toBe(mockConnectors[0]);
        expect(ic.connectors['c2']).toBe(mockConnectors[1]);
        expect(ic.connectors['c3']).toBe(mockConnectors[2]);
        expect(ic.connectors['c4']).toBe(mockConnectors[3]);
    });

    it('should call createConnector for each pin', () => {
        createICComponent(mockPoint, mockName, mockICDef);
        expect(connectorModule.createConnector).toHaveBeenCalledTimes(4);
        expect(connectorModule.createConnector).toHaveBeenCalledWith(
            expect.stringMatching(/^IC-TESTIC-/),
            'input',
            expect.any(Object),
            2.5,
            'A',
            expect.any(Object)
        );
        expect(connectorModule.createConnector).toHaveBeenCalledWith(
            expect.stringMatching(/^IC-TESTIC-/),
            'output',
            expect.any(Object),
            2.5,
            'Y',
            expect.any(Object)
        );
        expect(connectorModule.createConnector).toHaveBeenCalledWith(
            expect.stringMatching(/^IC-TESTIC-/),
            'negative',
            expect.any(Object),
            2.5,
            'GND',
            expect.any(Object)
        );
        expect(connectorModule.createConnector).toHaveBeenCalledWith(
            expect.stringMatching(/^IC-TESTIC-/),
            'positive',
            expect.any(Object),
            2.5,
            'VCC',
            expect.any(Object)
        );
    });

    it('should call createDefaultProperties with correct arguments', () => {
        createICComponent(mockPoint, mockName, mockICDef);
        expect(propertiesModule.createDefaultProperties).toHaveBeenCalledWith('ic', mockName);
    });

    it('should throw if position is missing', () => {
        // @ts-expect-error
        expect(() => createICComponent(undefined, mockName, mockICDef)).toThrow();
    });

    it('should throw if name is missing', () => {
        // @ts-expect-error
        expect(() => createICComponent(mockPoint, undefined, mockICDef)).toThrow();
    });

    it('should throw if definition is missing', () => {
        // @ts-expect-error
        expect(() => createICComponent(mockPoint, mockName, undefined)).toThrow();
    });
});

describe('Gate creation functions', () => {
    beforeEach(() => {
        vi.spyOn(connectorModule, 'createConnector').mockReturnValue({
            id: 'mock',
            componentID: 'mock',
            type: 'input',
            hitAreaSize: 2.5,
            offset: { x: 0, y: 0 },
            isConnected: false,
            metadata: {}
        } as connectorModule.Connector);
        vi.spyOn(propertiesModule, 'createDefaultProperties').mockReturnValue(mockProperties as any);
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('createQuadNANDGate returns ICComponent with type "ic" and icType "74LS00"', () => {
        const ic = createQuadNANDGate(mockPoint, mockName);
        expect(ic.type).toBe('ic');
        expect(ic.icType).toBe('74LS00');
    });

    it('createQuadNORGate returns ICComponent with type "ic" and icType "74LS02"', () => {
        const ic = createQuadNORGate(mockPoint, mockName);
        expect(ic.type).toBe('ic');
        expect(ic.icType).toBe('74LS02');
    });

    it('createHexInverter returns ICComponent with type "ic" and icType "74LS04"', () => {
        const ic = createHexInverter(mockPoint, mockName);
        expect(ic.type).toBe('ic');
        expect(ic.icType).toBe('74LS04');
    });

    it('createQuadANDGate returns ICComponent with type "ic" and icType "74LS08"', () => {
        const ic = createQuadANDGate(mockPoint, mockName);
        expect(ic.type).toBe('ic');
        expect(ic.icType).toBe('74LS08');
    });

    it('createQuadORGate returns ICComponent with type "ic" and icType "74LS32"', () => {
        const ic = createQuadORGate(mockPoint, mockName);
        expect(ic.type).toBe('ic');
        expect(ic.icType).toBe('74LS32');
    });

    it('createQuadXORGate returns ICComponent with type "ic" and icType "74LS86"', () => {
        const ic = createQuadXORGate(mockPoint, mockName);
        expect(ic.type).toBe('ic');
        expect(ic.icType).toBe('74LS86');
    });
});