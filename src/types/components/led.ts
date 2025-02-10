import { EditorComponent, Point } from '../general';
import { v4 as uuidv4 } from 'uuid';
import { createConnector } from '../connector';
import { createDefaultProperties } from '../properties';

export interface LEDComponent extends EditorComponent {
    readonly type: 'led';
}

export const createLEDComponent = (position: Point, name: string): LEDComponent => {
    const editorID = `LED-${uuidv4()}`;
    const powerConnector = createConnector(editorID, 'cathode', { x: -0.11111, y: 0.444444 });
    const groundConnector = createConnector(editorID, 'anode', { x: 0.233333, y: 0.44444 });

    return {
        editorID: editorID,
        type: 'led',
        dimensions: { width: 15, height: 25 },
        rotation: 0,
        position: position,
        properties: createDefaultProperties('led', name),
        connectors: {
            [powerConnector.id]: powerConnector,
            [groundConnector.id]: groundConnector,
        }
    }
}   

