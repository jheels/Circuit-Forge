import { EditorComponent, Point } from '../general';
import { v4 as uuidv4 } from 'uuid';
import { createConnector, ConnectorType, Connector } from '../connector';
import { createDefaultProperties } from '../properties';
import { isBreadboard } from '@/lib/utils';


// predefined constants for breadboard dimensions
export const PIN_SPACING = 5;
export const BOARD_ROWS = 64;
const PINS_PER_STRIP = 5;
const SECTION_SPACING = PIN_SPACING * 7;

export const REGULAR_SECTION_WIDTH = (PINS_PER_STRIP + 1) * PIN_SPACING * 2;
const POWER_RAIL_WIDTH = PIN_SPACING * 2;

export interface Strip {
    readonly id: string;
    readonly type: ConnectorType;
    readonly connectorIds: string[];
}

interface StripMapping {
    connectorToStrip: Record<string, string>;
    strips: Record<string, Strip>;
    positiveStripIDs: string[];
    negativeStripIDs: string[];
}

export interface BreadboardComponent extends EditorComponent {
    readonly type: 'breadboard';
    readonly stripMapping: StripMapping;
}

const createStrip = (type: ConnectorType, connectorIds: string[], stripIdentifier: string, boardPosition: string): Strip => ({
    id: `${type}-strip-${stripIdentifier}-${boardPosition}`,
    type,
    connectorIds
});

const createPositiveStrip = (connectorIds: string[], boardPosition: string): Strip => createStrip('positive', connectorIds, 'plus', boardPosition);
const createNegativeStrip = (connectorIds: string[], boardPosition: string): Strip => createStrip('negative', connectorIds, 'minus', boardPosition);
const createRegularStrip = (connectorIds: string[], stripIdentifier: string, boardPosition: string): Strip => createStrip('bidirectional', connectorIds, stripIdentifier, boardPosition);

const calculateBreadboardDimensions = () => {
    const width = 3 * REGULAR_SECTION_WIDTH + 4 * POWER_RAIL_WIDTH + 4 * PIN_SPACING;
    const height = BOARD_ROWS * PIN_SPACING;
    return { width, height };
};

/**
 * Creates a breadboard component with specified position and name.
 *
 * @param position - The position of the breadboard on the canvas.
 * @param name - The name of the breadboard component.
 * @returns A `BreadboardComponent` object containing the breadboard's properties, connectors, and strip mappings.
 *
 * The breadboard is constructed with alternating power rail sections and regular sections:
 * - Power rail sections include positive and negative rails, each with their own connectors and strips.
 * - Regular sections include left and right groups of connectors (A-E and F-J) and their corresponding strips.
 *
 * The breadboard layout alternates between power rail sections and regular sections, iterating through 7 sections.
 */
export const createBreadboardComponent = (position: Point, name: string): BreadboardComponent => {
    const editorID = `Breadboard-${uuidv4()}`;
    const dimensions = calculateBreadboardDimensions();
    const connectors: Record<string, Connector> = {};
    const stripMapping: StripMapping = {
        connectorToStrip: {},
        strips: {},
        positiveStripIDs: [],
        negativeStripIDs: [],
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
            },
            5
        );
        connectors[connector.id] = connector;
        return connector.id;
    };

    // Create a power rail section (both positive and negative rails)
    const createPowerRailSection = (startX: number, boardPosition: string) => {
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
        const positiveStrip = createPositiveStrip(positiveConnectors, boardPosition);
        const negativeStrip = createNegativeStrip(negativeConnectors, boardPosition);

        stripMapping.strips[positiveStrip.id] = positiveStrip;
        stripMapping.strips[negativeStrip.id] = negativeStrip;
        stripMapping.positiveStripIDs.push(positiveStrip.id);
        stripMapping.negativeStripIDs.push(negativeStrip.id);

        // Map connectors to their strips
        positiveConnectors.forEach(id => {
            stripMapping.connectorToStrip[id] = positiveStrip.id;
        });
        negativeConnectors.forEach(id => {
            stripMapping.connectorToStrip[id] = negativeStrip.id;
        });
    };
    // Create a regular section of the breadboard
    const createRegularSection = (startX: number, boardPosition: string ) => {
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
            const leftStrip = createRegularStrip(leftStripConnectors, (row + 1).toString(), boardPosition + '-left');
            const rightStrip = createRegularStrip(rightStripConnectors,(row + 1).toString(), boardPosition + '-right');
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
    // alternate between power rail and regular sections
    for (let sectionIndex = 0; sectionIndex < 7; sectionIndex++) {
        if (sectionIndex % 2 === 0) {
            createPowerRailSection(currentX, sectionIndex.toString());
            currentX += POWER_RAIL_WIDTH + PIN_SPACING;
        } else {
            createRegularSection(currentX, sectionIndex.toString());
            currentX += REGULAR_SECTION_WIDTH + PIN_SPACING;
        }
    }

    return {
        editorID,
        type: 'breadboard',
        dimensions,
        rotation: 0,
        position,
        properties: createDefaultProperties('breadboard', name),
        connectors,
        stripMapping
    };
};

export const getStripID = (breadboard: BreadboardComponent, connector: Connector): string | null => {
    if (!isBreadboard(breadboard)) return null;
    const stripID = breadboard.stripMapping.connectorToStrip[connector.id];

    return stripID ?? null;
}
