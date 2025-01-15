import { EditorComponent, Point } from '../general';
import { v4 as uuidv4 } from 'uuid';
import { createConnector } from '../connector';

type ResistanceUnit = 'Ω' | 'kΩ' | 'MΩ';
interface ResistorProperties {
    value: number;
    unit: ResistanceUnit;
}

export interface ResistorComponent extends EditorComponent {
    readonly type: 'RESISTOR';
    properties: ResistorProperties;
}

export const DEFAULT_RESISTOR_PROPERTIES: ResistorProperties = {
    value: 0,
    unit: 'Ω',
}

export const createResistorComponent = (position: Point, name: string): ResistorComponent => {
    const editorID = `Resistor-${uuidv4()}`;

    return {
        editorID: editorID,
        type: 'RESISTOR',
        name: name,
        dimensions: { width: 60, height: 30 },
        position: position,
        properties: DEFAULT_RESISTOR_PROPERTIES,
        connectors: [
            createConnector(editorID, 'bidirectional', { x: -1/6, y: 0.5 }), // might have to fiddle around with offsets
            createConnector(editorID, 'bidirectional', { x: 1+1/6, y: 0.5 }),
        ]
    }
}