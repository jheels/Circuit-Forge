import { EditorComponent, Point } from '../general';
import { v4 as uuidv4 } from 'uuid';
import { createConnector } from '../connector';

export interface LEDProperties {
    color: string;
    intensity: number;
    isIlluminated: boolean;
}

export interface LEDComponent extends EditorComponent {
    readonly type: 'LED';
    properties: LEDProperties;
}

export const DEFAULT_LED_PROPERTIES: LEDProperties = {
    color: 'red',
    intensity: 0,
    isIlluminated: false,
}

export const createLEDComponent = (position: Point): LEDComponent => {
    const editorID = `LED-${uuidv4()}`;

    return {
        editorID: editorID,
        type: 'LED',
        name: 'LED',
        dimensions: { width: 30, height: 50 },
        position: position,
        properties: DEFAULT_LED_PROPERTIES,
        connectors: [
            createConnector(editorID, 'power', { x: 0.25, y: 1 }),
            createConnector(editorID, 'ground', { x: 0.95, y: 1 }),
        ],
        isSelected: false,
        isHovered: false
    }
}

