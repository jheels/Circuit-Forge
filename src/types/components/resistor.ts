import { EditorComponent, Point } from '../general';
import { v4 as uuidv4 } from 'uuid';

export type ResistanceUnit = 'Ω' | 'kΩ' | 'MΩ';

export interface ResistorProperties {
    value: number;
    unit: ResistanceUnit;
}

export interface ResistorComponent extends EditorComponent {
    readonly type: 'Resistor';
    properties: ResistorProperties;
}

export const DEFAULT_RESISTOR_PROPERTIES: ResistorProperties = {
    value: 0,
    unit: 'Ω',
}

export const createResistorComponent = (position: Point): ResistorComponent => {
    return {
        editorID: `Resistor-${uuidv4()}`,
        type: 'Resistor',
        name: 'Resistor',
        position: position,
        properties: DEFAULT_RESISTOR_PROPERTIES,
        connectors: [
            {
                id: 'Resistor-connector-1-' + uuidv4(),
                position: {
                    x: position.x + 5,
                    y: position.y + 50,
                },
                type: 'ground',
                isConnected: false
            },
            {
                id: 'Resistor-connector-2-' + uuidv4(),
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