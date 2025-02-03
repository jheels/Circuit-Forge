import { EditorComponent, Point } from '../general';
import { v4 as uuidv4 } from 'uuid';
import { createConnector } from '../connector';
import { createDefaultProperties } from '../properties';

export interface ResistorComponent extends EditorComponent {
    readonly type: 'RESISTOR';
}

export const createResistorComponent = (position: Point, name: string): ResistorComponent => {
    const editorID = `Resistor-${uuidv4()}`;
    const leftConnector = createConnector(editorID, 'bidirectional', { x: -1/6, y: 0.5 });
    const rightConnector = createConnector(editorID, 'bidirectional', { x: 1+1/6, y: 0.5 });

    return {
        editorID: editorID,
        type: 'RESISTOR',
        dimensions: { width: 15, height: 2.5 },
        position: position,
        properties: createDefaultProperties('RESISTOR', name),
        connectors: {
            [leftConnector.id]: leftConnector,
            [rightConnector.id]: rightConnector,
        }
    }
}