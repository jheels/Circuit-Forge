/**
 * Implement connection rules 
 * Power supply positive terminal must connect to a positive rail
    Power supply negative terminal must connect to a negative rail
    Only one power supply can be connected to a set of connected rails
    Allow jumpers between same-type rails (positive-to-positive or negative-to-negative)
    Prohibit mixed rail connections (positive-to-negative)
    Each section of the breadboard should have access to power through rails
    Voltage Standardization:
    Fixed voltage (typically 5V) for digital logic circuits
    No variable voltage support required for these labs
 */

import { EditorComponent, Point } from "../general";
import { v4 as uuidv4 } from "uuid";
import { createConnector } from "../connector";
import { createDefaultProperties } from '../properties';


export interface PowerSupplyComponent extends EditorComponent {
    readonly type: "power-supply";
}

/**
 * Creates a power supply component with specified position and name.
 *
 * @param position - The position of the power supply component on the canvas.
 * @param name - The name of the power supply component.
 * @returns A `PowerSupplyComponent` object representing the power supply with its properties, connectors, and dimensions.
 */
export const createPowerSupplyComponent = (position: Point, name: string): PowerSupplyComponent => {
    const editorID = `PowerSupply-${uuidv4()}`;
    const groundConnector = createConnector(editorID, 'negative', { x: 5/12, y: 14/15 });
    const positiveConnector = createConnector(editorID, 'positive', { x: 7/12, y: 14/15 });

    return {
        editorID: editorID,
        type: "power-supply",
        properties: createDefaultProperties("power-supply", name),
        rotation: 0,
        position: position,
        dimensions: { width: 30, height: 30 },
        connectors: {
            [groundConnector.id]: groundConnector,
            [positiveConnector.id]: positiveConnector,
        },
    };
};