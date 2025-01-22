import { EditorComponent, Point } from "../general";
import { v4 as uuidv4 } from "uuid";
import { createConnector } from "../connector";
import { createDefaultProperties } from '../properties';


export interface PowerSupplyComponent extends EditorComponent {
    readonly type: "POWER SUPPLY";
}

export const createPowerSupplyComponent = (position: Point, name: string): PowerSupplyComponent => {
    const editorID = `PowerSupply-${uuidv4()}`;
    const positiveConnector = createConnector(editorID, 'power', { x: 1/3, y: 6/5 });
    const groundConnector = createConnector(editorID, 'ground', { x: 2/3, y: 6/5 });

    return {
        editorID: editorID,
        type: "POWER SUPPLY",
        properties: createDefaultProperties("POWER SUPPLY", name),
        position: position,
        dimensions: { width: 60, height: 50 },
        connectors: {
            [positiveConnector.id]: positiveConnector,
            [groundConnector.id]: groundConnector,
        },
    };
};