import { Connector } from "./connector";
import { PropertyValue } from "./properties";

export type Point = {
    x: number;
    y: number;
}

export interface SidebarComponent {
    readonly sidebarID: string;
    name: string;
    description: string;
    graphic?: JSX.Element;
}

export interface EditorComponent {
    readonly editorID: string;
    readonly type: string;
    dimensions: { width: number; height: number };
    rotation: number;
    position: Point;
    properties: Record<string, PropertyValue>;
    connectors: Record<string, Connector>;
}

export interface Wire {
    id: string;
    startConnector: Connector;
    endConnector: Connector | null;
    points: Point[];
}