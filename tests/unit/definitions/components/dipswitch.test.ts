import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createDIPSwitchComponent, DIPSwitchComponent } from '@/definitions/components/dipswitch';
import * as connectorModule from '@/definitions/connector';
import * as propertiesModule from '@/definitions/properties';

describe('createDIPSwitchComponent', () => {
    const mockPoint = { x: 5, y: 10 };
    const mockName = 'SW1';
    const mockEditorIDPattern = /^DIPSwitch-/;
    const mockConnectors: connectorModule.Connector[] = [];
    const mockProperties = { prop: 'value' };

    beforeEach(() => {
        // 16 connectors: 2 per switch, 8 switches
        for (let i = 0; i < 16; i++) {
            mockConnectors[i] = {
                id: `conn-${i}`,
                componentID: 'mock-comp',
                type: 'bidirectional',
                hitAreaSize: 2.5,
                offset: { x: i % 2 === 0 ? 0.125 : 0.875, y: (Math.floor(i / 2) + 0.5) / 8 },
                isConnected: false,
                metadata: {}
            };
        }
        let call = 0;
        vi.spyOn(connectorModule, 'createConnector').mockImplementation(() => mockConnectors[call++]);
        vi.spyOn(propertiesModule, 'createDefaultProperties').mockReturnValue(mockProperties as Record<string, propertiesModule.PropertyValue>);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create a DIP switch component with correct structure', () => {
        const dip = createDIPSwitchComponent(mockPoint, mockName);
        expect(dip.editorID).toMatch(mockEditorIDPattern);
        expect(dip.type).toBe('dip-switch');
        expect(dip.dimensions).toEqual({ width: 20, height: 40 });
        expect(dip.rotation).toBe(0);
        expect(dip.position).toBe(mockPoint);
        expect(dip.switchStates).toEqual(Array(8).fill(false));
        expect(dip.properties).toBe(mockProperties);
        expect(Object.values(dip.connectors)).toHaveLength(16);
        // Check connector keys and values
        mockConnectors.forEach(conn => {
            expect(dip.connectors[conn.id]).toBe(conn);
        });
    });

    it('should call createConnector 16 times with correct arguments', () => {
        createDIPSwitchComponent(mockPoint, mockName);
        for (let i = 0; i < 8; i++) {
            expect(connectorModule.createConnector).toHaveBeenCalledWith(
                expect.stringMatching(mockEditorIDPattern),
                'bidirectional',
                { x: 0.125, y: (i + 0.5) / 8 },
                2.5,
                `terminal-${i}-left`
            );
            expect(connectorModule.createConnector).toHaveBeenCalledWith(
                expect.stringMatching(mockEditorIDPattern),
                'bidirectional',
                { x: 0.875, y: (i + 0.5) / 8 },
                2.5,
                `terminal-${i}-right`
            );
        }
    });

    it('should call createDefaultProperties with correct arguments', () => {
        createDIPSwitchComponent(mockPoint, mockName);
        expect(propertiesModule.createDefaultProperties).toHaveBeenCalledWith('dip-switch', mockName);
    });

    it('should throw if position is missing', () => {
        // @ts-expect-error because point is undefined
        expect(() => createDIPSwitchComponent(undefined, mockName)).toThrow();
    });

    it('should throw if name is missing', () => {
        // @ts-expect-error because we are missing the name
        expect(() => createDIPSwitchComponent(mockPoint)).toThrow();
    });
});

describe('DIPSwitchComponent switchStates', () => {
    const mockPoint = { x: 5, y: 10 };
    const mockName = 'SW1';
    it('should have switchStates as an array of 8 booleans', () => {
        const dip = createDIPSwitchComponent(mockPoint, mockName);
        expect(Array.isArray(dip.switchStates)).toBe(true);
        expect(dip.switchStates).toHaveLength(8);
        dip.switchStates.forEach(state => expect(typeof state).toBe('boolean'));
    });

    it('should not mutate the switchStates array between instances', () => {
        const dip1 = createDIPSwitchComponent(mockPoint, mockName) as DIPSwitchComponent;
        const dip2 = createDIPSwitchComponent(mockPoint, mockName) as DIPSwitchComponent;
        dip1.switchStates[0] = true;
        expect(dip2.switchStates[0]).toBe(false);
    });
});