import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { createPowerSupplyComponent } from '@/definitions/components/powerSupply';
import * as uuid from 'uuid';
import * as connectorModule from '@/definitions/connector';
import * as propertiesModule from '@/definitions/properties';

// filepath: /Users/jheels/Documents/Programs/3yp/circuit-forge/tests/unit/definitions/components/powerSupply.test.ts

describe('createPowerSupplyComponent', () => {
    const mockPoint = { x: 42, y: 99 };
    const mockName = 'PS1';
    const mockEditorID = 'PowerSupply-mock-uuid';
    const mockNegativeConnector: connectorModule.Connector = {
        id: 'neg-conn',
        componentID: mockEditorID,
        type: 'negative',
        hitAreaSize: connectorModule.DEFAULT_HIT_AREA,
        offset: { x: 5 / 12, y: 14 / 15 },
        isConnected: false,
        metadata: {}
    };
    const mockPositiveConnector: connectorModule.Connector = {
        id: 'pos-conn',
        componentID: mockEditorID,
        type: 'positive',
        hitAreaSize: connectorModule.DEFAULT_HIT_AREA,
        offset: { x: 7 / 12, y: 14 / 15 },
        isConnected: false,
        metadata: {}
    };
    const mockProperties = { prop: 'value' };

    beforeEach(() => {
        vi.spyOn(connectorModule, 'createConnector')
            .mockImplementationOnce(() => mockNegativeConnector as connectorModule.Connector)
            .mockImplementationOnce(() => mockPositiveConnector as connectorModule.Connector);
        vi.spyOn(propertiesModule, 'createDefaultProperties').mockReturnValue(mockProperties as Record<string, propertiesModule.PropertyValue>);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create a power supply component with correct structure', () => {
        const ps = createPowerSupplyComponent(mockPoint, mockName);
        expect(ps).toMatchObject({
            editorID: ps.editorID,
            type: 'power-supply',
            dimensions: { width: 30, height: 30 },
            rotation: 0,
            position: mockPoint,
            properties: mockProperties,
            connectors: {
                [mockNegativeConnector.id]: mockNegativeConnector,
                [mockPositiveConnector.id]: mockPositiveConnector,
            }
        });
    });

    it('should call createConnector and createDefaultProperties with correct arguments', () => {
        const ps = createPowerSupplyComponent(mockPoint, mockName);
        expect(connectorModule.createConnector).toHaveBeenCalledWith(
            ps.editorID, 'negative', { x: 5 / 12, y: 14 / 15 }
        );
        expect(connectorModule.createConnector).toHaveBeenCalledWith(
            ps.editorID, 'positive', { x: 7 / 12, y: 14 / 15 }
        );
        expect(propertiesModule.createDefaultProperties).toHaveBeenCalledWith('power-supply', mockName);
    });
    it('should handle empty name gracefully', () => {
        const ps = createPowerSupplyComponent(mockPoint, '');
        expect(propertiesModule.createDefaultProperties).toHaveBeenCalledWith('power-supply', '');
        expect(ps.properties).toBe(mockProperties);
    });

});