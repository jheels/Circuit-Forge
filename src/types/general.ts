import { Connector } from "./connector";

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
    name: string;
    dimensions: { width: number; height: number };
    position: Point;
    properties: Record<string, any>;
    connectors: Connector[]; 
}

export interface Wire {
    id: string;
    startConnectorID: string;
    endConnectorID: string | null;
    points: Point[];
}