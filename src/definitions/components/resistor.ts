import { EditorComponent, Point } from '../general';
import { v4 as uuidv4 } from 'uuid';
import { createConnector } from '../connector';
import { createDefaultProperties } from '../properties';

export interface ResistorComponent extends EditorComponent {
    readonly type: 'resistor';
}

/**
 * Creates a resistor component with specified position and name.
 *
 * @param position - The position of the resistor component on the canvas, represented as a `Point` object.
 * @param name - The name of the resistor component.
 * @returns A `ResistorComponent` object representing the created resistor, including its editor ID, type, dimensions, rotation, position, properties, and connectors.
 */
export const createResistorComponent = (position: Point, name: string): ResistorComponent => {
    const editorID = `Resistor-${uuidv4()}`;
    const leftConnector = createConnector(editorID, 'bidirectional', { x: -1/6, y: 0.5 });
    const rightConnector = createConnector(editorID, 'bidirectional', { x: 1+1/6, y: 0.5 });

    return {
        editorID: editorID,
        type: 'resistor',
        dimensions: { width: 15, height: 2.5 },
        rotation: 0,
        position: position,
        properties: createDefaultProperties('resistor', name),
        connectors: {
            [leftConnector.id]: leftConnector,
            [rightConnector.id]: rightConnector,
        }
    }
}