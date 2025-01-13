import { EditorComponent, Point } from "../general";
import { v4 as uuidv4 } from "uuid";

export type PowerMode = "AC" | "DC";

export interface PowerSupplyProperties {
    voltage: number;
    mode: PowerMode;
    isEnabled: boolean;
}

export interface PowerSupplyComponent extends EditorComponent {
    readonly type: "Power Supply";
    properties: PowerSupplyProperties;
}

export const DEFAULT_POWER_SUPPLY_PROPERTIES: PowerSupplyProperties = {
    voltage: 5,
    mode: "DC",
    isEnabled: false,
};

export const createPowerSupplyComponent = (position: Point): PowerSupplyComponent => {
    return {
        editorID: `PowerSupply-${uuidv4()}`, // need to make read only
        type: "Power Supply",
        name: "Power Supply",
        properties: DEFAULT_POWER_SUPPLY_PROPERTIES,
        position: position,
        connectors: [
            {
                id: "PowerSupply-positive-" + uuidv4(),
                position: {
                    x: position.x + 5,
                    y: position.y + 50,
                },
                type: "power",
                isConnected: false,
            },
            {
                id: "PowerSupply-ground-" + uuidv4(),
                position: {
                    x: position.x + 35,
                    y: position.y + 50,
                },
                type: "ground",
                isConnected: false,
            },
        ],
        isSelected: false,
        isHovered: false,
    };
};