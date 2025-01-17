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
    const positiveConnector = createConnector(editorID, 'power', { x: 5 / 40, y: 50 / 60 });
    const groundConnector = createConnector(editorID, 'ground', { x: 35 / 40, y: 50 / 60 });

    return {
        editorID: editorID,
        type: "POWER SUPPLY",
        name: name,
        properties: DEFAULT_POWER_SUPPLY_PROPERTIES,
        position: position,
        dimensions: { width: 40, height: 60 },
        connectors: {
            [positiveConnector.id]: positiveConnector,
            [groundConnector.id]: groundConnector,
        },
    };
};