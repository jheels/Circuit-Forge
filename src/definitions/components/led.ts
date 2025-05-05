import { EditorComponent, Point } from '../general';
import { v4 as uuidv4 } from 'uuid';
import { createConnector } from '../connector';
import { createDefaultProperties } from '../properties';

export interface LEDComponent extends EditorComponent {
    readonly type: 'led';
}

/**
 * Creates an LED component with specified position and name.
 *
 * @param position - The position of the LED component on the canvas, represented as a `Point` object.
 * @param name - The name of the LED component.
 * @returns An `LEDComponent` object representing the created LED with its properties, connectors, and metadata.
 */
export const createLEDComponent = (position: Point, name: string): LEDComponent => {
    const editorID = `LED-${uuidv4()}`;
    const anodeConnector = createConnector(editorID, 'anode', { x: 0.233333, y: 0.44444 });
    const cathodeConnector = createConnector(editorID, 'cathode', { x: -0.11111, y: 0.444444 });

    return {
        editorID: editorID,
        type: 'led',
        dimensions: { width: 15, height: 25 },
        rotation: 0,
        position: position,
        properties: createDefaultProperties('led', name),
        connectors: {
            [anodeConnector.id]: anodeConnector,
            [cathodeConnector.id]: cathodeConnector
        }
    }
}