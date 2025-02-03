import { EditorComponent, Point } from '../general';
import { v4 as uuidv4 } from 'uuid';
import { createConnector } from '../connector';
import { createDefaultProperties } from '../properties';

export interface LEDComponent extends EditorComponent {
    readonly type: 'led';
}

export const createLEDComponent = (position: Point, name: string): LEDComponent => {
    const editorID = `LED-${uuidv4()}`;
    const powerConnector = createConnector(editorID, 'cathode', { x: 0.4, y: 53/60 });
    const groundConnector = createConnector(editorID, 'anode', { x: 2/3, y: 53/60 });

    return {
        editorID: editorID,
        type: 'led',
        dimensions: { width: 30, height: 50 },
        position: position,
        properties: createDefaultProperties('led', name),
        connectors: {
            [powerConnector.id]: powerConnector,
            [groundConnector.id]: groundConnector,
        }
    }
}   

