import { EditorComponent, Point } from '../general';
import { v4 as uuidv4 } from 'uuid';
import { createConnector } from '../connector';

interface LEDProperties {
    color: string;
    intensity: number;
    isIlluminated: boolean;
}

export interface LEDComponent extends EditorComponent {
    readonly type: 'LED';
    properties: LEDProperties;
}

const DEFAULT_LED_PROPERTIES: LEDProperties = {
    color: 'red',
    intensity: 0,
    isIlluminated: false,
}

export const createLEDComponent = (position: Point, name: string): LEDComponent => {
    const editorID = `LED-${uuidv4()}`;

    return {
        editorID: editorID,
        type: 'LED',
        name: name,
        dimensions: { width: 30, height: 50 },
        position: position,
        properties: DEFAULT_LED_PROPERTIES,
        connectors: [
            createConnector(editorID, 'power', { x: 0.4, y: 53/60 }),
            createConnector(editorID, 'ground', { x: 2/3, y: 53/60 },),
        ],
    }
}

