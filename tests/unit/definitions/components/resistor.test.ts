import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { createResistorComponent } from '@/definitions/components/resistor';
import * as connectorModule from '@/definitions/connector';
import * as propertiesModule from '@/definitions/properties';

describe('createResistorComponent', () => {
    const mockPoint = { x: 10, y: 20 };
    const mockName = 'R1';
    const mockEditorID = 'Resistor-mock-uuid';
    const mockLeftConnector: connectorModule.Connector = {
        id: 'left-conn',
        componentID: mockEditorID,
        type: 'bidirectional',
        hitAreaSize: connectorModule.DEFAULT_HIT_AREA,
        offset: { x: -1 / 6, y: 0.5 },
        isConnected: false,
        metadata: {}
    };

    const mockRightConnector: connectorModule.Connector = {
        id: 'right-conn',
        componentID: mockEditorID,
        type: 'bidirectional',
        hitAreaSize: connectorModule.DEFAULT_HIT_AREA,
        offset: { x: 1 + 1 / 6, y: 0.5 },
        isConnected: false,
        metadata: {}
    };
    const mockProperties = { prop: 'value' };

    beforeEach(() => {
        vi.spyOn(connectorModule, 'createConnector')
            .mockImplementationOnce(() => mockLeftConnector as connectorModule.Connector)
            .mockImplementationOnce(() => mockRightConnector as connectorModule.Connector);
        vi.spyOn(propertiesModule, 'createDefaultProperties').mockReturnValue(mockProperties as Record<string, propertiesModule.PropertyValue>);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create a resistor component with correct structure', () => {
        const resistor = createResistorComponent(mockPoint, mockName);
        expect(resistor).toMatchObject({
            editorID: resistor.editorID,
            type: 'resistor',
            dimensions: { width: 15, height: 2.5 },
            rotation: 0,
            position: mockPoint,
            properties: mockProperties,
            connectors: {
                [mockLeftConnector.id]: mockLeftConnector,
                [mockRightConnector.id]: mockRightConnector,
            }
        });
    });

    it('should call createConnector, and createDefaultProperties with correct arguments', () => {
        const resistor = createResistorComponent(mockPoint, mockName);
        expect(connectorModule.createConnector).toHaveBeenCalledWith(
            resistor.editorID, 'bidirectional', { x: -1/6, y: 0.5 }
        );
        expect(connectorModule.createConnector).toHaveBeenCalledWith(
            resistor.editorID, 'bidirectional', { x: 1+1/6, y: 0.5 }
        );
        expect(propertiesModule.createDefaultProperties).toHaveBeenCalledWith('resistor', mockName);
    });
});