import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { createLEDComponent } from '@/definitions/components/led';
import * as connectorModule from '@/definitions/connector';
import * as propertiesModule from '@/definitions/properties';

describe('createLEDComponent', () => {
    const mockPoint = { x: 5, y: 8 };
    const mockName = 'LED1';
    const mockEditorID = 'LED-mock-uuid';
    const mockAnodeConnector: connectorModule.Connector = {
        id: 'anode-conn',
        componentID: mockEditorID,
        type: 'anode',
        hitAreaSize: connectorModule.DEFAULT_HIT_AREA,
        offset: { x: 0.233333, y: 0.44444 },
        isConnected: false,
        metadata: {}
    };
    const mockCathodeConnector: connectorModule.Connector = {
        id: 'cathode-conn',
        componentID: mockEditorID,
        type: 'cathode',
        hitAreaSize: connectorModule.DEFAULT_HIT_AREA,
        offset: { x: -0.11111, y: 0.444444 },
        isConnected: false,
        metadata: {}
    };
    const mockProperties = { prop: 'value' };

    beforeEach(() => {
        vi.spyOn(connectorModule, 'createConnector')
            .mockImplementationOnce(() => mockAnodeConnector as connectorModule.Connector)
            .mockImplementationOnce(() => mockCathodeConnector as connectorModule.Connector);
        vi.spyOn(propertiesModule, 'createDefaultProperties').mockReturnValue(mockProperties as Record<string, propertiesModule.PropertyValue>);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create an LED component with correct structure', () => {
        const led = createLEDComponent(mockPoint, mockName);
        expect(led).toMatchObject({
            editorID: led.editorID,
            type: 'led',
            dimensions: { width: 15, height: 25 },
            rotation: 0,
            position: mockPoint,
            properties: mockProperties,
            connectors: {
                [mockAnodeConnector.id]: mockAnodeConnector,
                [mockCathodeConnector.id]: mockCathodeConnector,
            }
        });
    });

    it('should call createConnector and createDefaultProperties with correct arguments', () => {
        const led = createLEDComponent(mockPoint, mockName);
        expect(connectorModule.createConnector).toHaveBeenCalledWith(
            led.editorID, 'anode', { x: 0.233333, y: 0.44444 }
        );
        expect(connectorModule.createConnector).toHaveBeenCalledWith(
            led.editorID, 'cathode', { x: -0.11111, y: 0.444444 }
        );
        expect(propertiesModule.createDefaultProperties).toHaveBeenCalledWith('led', mockName);
    });

    it('should throw if createDefaultProperties throws', () => {
        (propertiesModule.createDefaultProperties as unknown as vi.Mock).mockImplementationOnce(() => { throw new Error('fail prop'); });
        expect(() => createLEDComponent(mockPoint, mockName)).toThrow('fail prop');
    });

    it('should handle empty name and still call createDefaultProperties', () => {
        createLEDComponent(mockPoint, '');
        expect(propertiesModule.createDefaultProperties).toHaveBeenCalledWith('led', '');
    });

    it('should handle undefined position gracefully', () => {
        // @ts-expect-error testing undefined position
        expect(() => createLEDComponent(undefined, mockName)).not.toThrow();
    });

    it('should handle null name gracefully', () => {
        // @ts-expect-error testing null name
        expect(() => createLEDComponent(mockPoint, null)).not.toThrow();
    });
});