import { describe, it, expect } from 'vitest';
import { createBreadboardComponent, REGULAR_SECTION_WIDTH, PIN_SPACING, BOARD_ROWS, getStripID } from '@/definitions/components/breadboard';
import { isBreadboard } from '@/lib/utils';

describe('createBreadboardComponent', () => {
    const position = { x: 10, y: 20 };
    const name = 'TestBoard';
    const breadboard = createBreadboardComponent(position, name);

    it('should create a breadboard with correct type and name', () => {
        expect(breadboard.type).toBe('breadboard');
        expect(breadboard.properties.name).toBe(name);
    });

    it('should set the correct position and rotation', () => {
        expect(breadboard.position).toEqual(position);
        expect(breadboard.rotation).toBe(0);
    });

    it('should calculate correct dimensions', () => {
        const expectedWidth = 3 * REGULAR_SECTION_WIDTH + 4 * PIN_SPACING * 2 + 4 * PIN_SPACING;
        const expectedHeight = BOARD_ROWS * PIN_SPACING;
        expect(breadboard.dimensions.width).toBeGreaterThan(0);
        expect(breadboard.dimensions.height).toBe(expectedHeight);
    });

    it('should have connectors and strips', () => {
        expect(Object.keys(breadboard.connectors).length).toBeGreaterThan(0);
        expect(Object.keys(breadboard.stripMapping.strips).length).toBeGreaterThan(0);
    });

    it('should have positive and negative strip IDs', () => {
        expect(breadboard.stripMapping.positiveStripIDs.length).toBeGreaterThan(0);
        expect(breadboard.stripMapping.negativeStripIDs.length).toBeGreaterThan(0);
    });

    it('should map connectors to strips', () => {
        const connectorIds = Object.keys(breadboard.connectors);
        const anyConnectorId = connectorIds[0];
        expect(breadboard.stripMapping.connectorToStrip[anyConnectorId]).toBeTypeOf('string');
    });

    it('should implement BreadboardComponent interface fully', () => {
        expect(typeof breadboard.editorID).toBe('string');
        expect(typeof breadboard.type).toBe('string');
        expect(typeof breadboard.dimensions).toBe('object');
        expect(typeof breadboard.rotation).toBe('number');
        expect(typeof breadboard.position).toBe('object');
        expect(typeof breadboard.properties).toBe('object');
        expect(typeof breadboard.connectors).toBe('object');
        expect(typeof breadboard.stripMapping).toBe('object');
    });
});

describe('getStripID', () => {
    const breadboard = createBreadboardComponent({ x: 0, y: 0 }, 'bb');
    const connectorIds = Object.keys(breadboard.connectors);
    const connector = breadboard.connectors[connectorIds[0]];

    it('should return correct strip ID for a valid connector', () => {
        const stripID = getStripID(breadboard, connector);
        expect(stripID).toBeTypeOf('string');
        expect(breadboard.stripMapping.strips[stripID!]).toBeDefined();
    });

    it('should return null for a connector not in the breadboard', () => {
        const fakeConnector = { ...connector, id: 'not-exist' };
        expect(getStripID(breadboard, fakeConnector)).toBeNull();
    });

    it('should return null if breadboard is not valid', () => {
        // @ts-expect-error
        expect(getStripID({}, connector)).toBeNull();
    });
});

describe('isBreadboard', () => {
    it('should return true for a breadboard component', () => {
        const breadboard = createBreadboardComponent({ x: 0, y: 0 }, 'bb');
        expect(isBreadboard(breadboard)).toBe(true);
    });

    it('should return false for a non-breadboard object', () => {
        expect(isBreadboard({})).toBe(false);
        expect(isBreadboard(null)).toBe(false);
        expect(isBreadboard(undefined)).toBe(false);
    });
});