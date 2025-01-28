import { EditorComponent, Point } from '../general';
import { v4 as uuidv4 } from 'uuid';
import { createConnector, ConnectorType } from '../connector';
import { createDefaultProperties } from '../properties';

const PIN_SPACING = 5;
const PINS_PER_STRIP = 5;
const SECTION_SPACING = PIN_SPACING * 7;
const BOARD_ROWS = 64;

const REGULAR_SECTION_WIDTH = (PINS_PER_STRIP + 1) * PIN_SPACING * 2;
const POWER_RAIL_WIDTH = PIN_SPACING * 2;

interface Strip {
    readonly id: string;
    readonly type: ConnectorType;
    readonly connectorIds: string[];
}

interface StripMapping {
    connectorToStrip: Record<string, string>;
    strips: Record<string, Strip>;
}

export interface BreadboardComponent extends EditorComponent {
    readonly type: 'BREADBOARD';
    readonly stripMapping: StripMapping;
}

const createStrip = (type: ConnectorType, connectorIds: string[]): Strip => ({
    id: `strip-${uuidv4()}`,
    type,
    connectorIds
});

const createPositiveStrip = (connectorIds: string[]): Strip => createStrip('positive', connectorIds);
const createNegativeStrip = (connectorIds: string[]): Strip => createStrip('negative', connectorIds);
const createRegularStrip = (connectorIds: string[]): Strip => createStrip('bidirectional', connectorIds);

const calculateBreadboardDimensions = () => {
    const width = 3 * REGULAR_SECTION_WIDTH + 4 * POWER_RAIL_WIDTH + 4 * PIN_SPACING;
    const height = BOARD_ROWS * PIN_SPACING;
    return { width, height };
};

export const createBreadboardComponent = (position: Point, name: string): BreadboardComponent => {
    const editorID = `Breadboard-${uuidv4()}`;
    const dimensions = calculateBreadboardDimensions();
    const connectors: Record<string, ReturnType<typeof createConnector>> = {};
    const stripMapping: StripMapping = {
        connectorToStrip: {},
        strips: {}
    };  

    const createPinConnector = (
        x: number,
        y: number,
        type: ConnectorType
    ): string => {
        const connector = createConnector(
            editorID,
            type,
            {
                x: x / dimensions.width,
                y: y / dimensions.height
            }
        );
        connectors[connector.id] = connector;
        return connector.id;
    };

    // Create a power rail section (both positive and negative rails)
    const createPowerRailSection = (startX: number) => {
        const positiveConnectors: string[] = [];
        const negativeConnectors: string[] = [];

        for (let row = 0; row < BOARD_ROWS; row++) {
            const y = row * PIN_SPACING;

            negativeConnectors.push(
                createPinConnector(startX, y, 'negative')
            );

            // Positive rail
            positiveConnectors.push(
                createPinConnector(startX + PIN_SPACING, y, 'positive')
            );
        }


        // Create strips for power and ground rails
        const positiveStrip = createPositiveStrip(positiveConnectors);
        const negativeStrip = createNegativeStrip(negativeConnectors);

        stripMapping.strips[positiveStrip.id] = positiveStrip;
        stripMapping.strips[negativeStrip.id] = negativeStrip;

        // Map connectors to their strips
        positiveConnectors.forEach(id => {
            stripMapping.connectorToStrip[id] = positiveStrip.id;
        });
        negativeConnectors.forEach(id => {
            stripMapping.connectorToStrip[id] = negativeStrip.id;
        });
    };
    // Create a regular section of the breadboard
    const createRegularSection = (startX: number) => {
        for (let row = 0; row < BOARD_ROWS; row++) {
            const leftStripConnectors: string[] = [];
            const rightStripConnectors: string[] = [];
            const y = row * PIN_SPACING;

            // Create left group (A-E)
            for (let pin = 0; pin < PINS_PER_STRIP; pin++) {
                const x = startX + (pin * PIN_SPACING);
                leftStripConnectors.push(
                    createPinConnector(x, y, 'bidirectional')
                );
            }

            // Create right group (F-J)
            for (let pin = 0; pin < PINS_PER_STRIP; pin++) {
                const x = startX + SECTION_SPACING + (pin * PIN_SPACING);
                rightStripConnectors.push(
                    createPinConnector(x, y, 'bidirectional')
                );
            }

            // Create strips and map connectors
            const leftStrip = createRegularStrip(leftStripConnectors);
            const rightStrip = createRegularStrip(rightStripConnectors);
            stripMapping.strips[leftStrip.id] = leftStrip;
            stripMapping.strips[rightStrip.id] = rightStrip;
            leftStripConnectors.forEach(id => {
                stripMapping.connectorToStrip[id] = leftStrip.id;
            });
            rightStripConnectors.forEach(id => {
                stripMapping.connectorToStrip[id] = rightStrip.id;
            });
        }
    };

    let currentX = 0;

    // Left power rail
    createPowerRailSection(currentX);
    currentX += POWER_RAIL_WIDTH + PIN_SPACING; // gap of 1 pin
    createRegularSection(currentX);
    currentX += REGULAR_SECTION_WIDTH + PIN_SPACING;
    createPowerRailSection(currentX);
    currentX += POWER_RAIL_WIDTH + PIN_SPACING;
    createRegularSection(currentX);
    currentX += REGULAR_SECTION_WIDTH + PIN_SPACING;
    createPowerRailSection(currentX);
    currentX += POWER_RAIL_WIDTH + PIN_SPACING;
    createRegularSection(currentX);
    currentX += REGULAR_SECTION_WIDTH + PIN_SPACING;
    createPowerRailSection(currentX);

    return {
        editorID,
        type: 'BREADBOARD',
        dimensions,
        position,
        properties: createDefaultProperties('BREADBOARD', name),
        connectors,
        stripMapping
    };
};