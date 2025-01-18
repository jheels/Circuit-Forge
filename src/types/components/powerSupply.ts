import { EditorComponent, Point } from "../general";
import { v4 as uuidv4 } from "uuid";
import { createConnector } from "../connector";

type PowerMode = "AC" | "DC";
interface PowerSupplyProperties {
    voltage: number;
    mode: PowerMode;
    isEnabled: boolean;
}

export interface PowerSupplyComponent extends EditorComponent {
    readonly type: "POWER SUPPLY";
    properties: PowerSupplyProperties;
}

export const DEFAULT_POWER_SUPPLY_PROPERTIES: PowerSupplyProperties = {
    voltage: 5,
    mode: "DC",
    isEnabled: false,
};

export const createPowerSupplyComponent = (position: Point, name: string): PowerSupplyComponent => {
    const editorID = `PowerSupply-${uuidv4()}`;
    const positiveConnector = createConnector(editorID, 'power', { x: 1/3, y: 6/5 });
    const groundConnector = createConnector(editorID, 'ground', { x: 2/3, y: 6/5 });

    return {
        editorID: editorID,
        type: "POWER SUPPLY",
        name: name,
        properties: DEFAULT_POWER_SUPPLY_PROPERTIES,
        position: position,
        dimensions: { width: 60, height: 50 },
        connectors: {
            [positiveConnector.id]: positiveConnector,
            [groundConnector.id]: groundConnector,
        },
    };
};