import { EditorComponent, Point } from '../general';
import { v4 as uuidv4 } from 'uuid';

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
    return {
        editorID: `LED-${uuidv4()}`,
        type: 'LED',
        name: 'LED',
        position: position,
        properties: DEFAULT_LED_PROPERTIES,
        connectors: [
            {
                id: 'LED-cathode-' + uuidv4(),
                position: {
                    x: position.x + 5,
                    y: position.y + 50,
                },
                type: 'ground',
                isConnected: false
            },
            {
                id: 'LED-anode-' + uuidv4(),
                position: {
                    x: position.x + 35,
                    y: position.y + 50,
                },
                type: 'power',
                isConnected: false
            }
        ],
        isSelected: false,
        isHovered: false
    }
}

