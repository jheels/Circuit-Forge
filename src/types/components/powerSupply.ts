import { EditorComponent, ComponentMetadata, Point } from "../general";
import { v4 as uuidv4 } from "uuid";

export type PowerMode = "AC" | "DC";

export interface PowerSupplyProperties {
    voltage: number;
    mode: PowerMode;
    isEnabled: boolean;
}

export interface PowerSupplyMetadata extends ComponentMetadata {
    name: "Power Supply";
    properties: PowerSupplyProperties;
}

export interface PowerSupplyComponent extends EditorComponent {
    readonly type: "Power Supply";
    metadata: PowerSupplyMetadata;
}

export const DEFAULT_POWER_SUPPLY_PROPERTIES: PowerSupplyProperties = {
    voltage: 5,
    mode: "DC",
    isEnabled: false,
};

export const createPowerSupplyComponent = (position: Point): PowerSupplyComponent => {
    return {
        editorID: `PowerSupply-${uuidv4()}`,
        type: "Power Supply",
        position: position,
        metadata: {
            name: "Power Supply",
            properties: DEFAULT_POWER_SUPPLY_PROPERTIES,
        },
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