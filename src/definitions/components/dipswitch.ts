import { Connector, createConnector } from "../connector";
import { EditorComponent, Point } from "../general";
import { v4 as uuidv4 } from "uuid";
import { createDefaultProperties } from "../properties";

export interface DIPSwitchComponent extends EditorComponent {
    readonly type: 'dip-switch';
    switchStates: boolean[];  // Array of 8 boolean values (true = closed, false = open)
}

export const createDIPSwitchComponent = (position: Point, name: string): DIPSwitchComponent => {
    const editorID = `DIPSwitch-${uuidv4()}`;
    const connectors: Record<string, Connector> = {};
    if (!position || !name) {
        throw new Error('Position and name are required to create a DIP switch component.');
    }

    // Create 16 connectors - 2 for each switch
    for (let i = 0; i < 8; i++) {
        // Left side connectors
        const leftConnector = createConnector(
            editorID, 
            'bidirectional', 
            { x: 0.125, y: (i + 0.5) / 8 },
            2.5,
            'terminal-' + i + '-left'
        );
        console.log('leftConnector', leftConnector);
        connectors[leftConnector.id] = leftConnector;
        
        // Right side connectors
        const rightConnector = createConnector(
            editorID, 
            'bidirectional', 
            { x: 0.875, y: (i + 0.5) / 8 },
            2.5,
            'terminal-' + i + '-right'
        );
        connectors[rightConnector.id] = rightConnector;
    }

    return {
        editorID,
        type: 'dip-switch',
        dimensions: { width: 20, height: 40 },
        rotation: 0,
        position,
        switchStates: Array(8).fill(false),  // All switches off initially
        properties: createDefaultProperties('dip-switch', name),
        connectors
    };
};