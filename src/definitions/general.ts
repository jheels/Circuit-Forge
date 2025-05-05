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

/**
 * Represents a component within the editor.
 * 
 * @property editorID - A unique identifier for the editor component.
 * @property type - The type or category of the component.
 * @property dimensions - The dimensions of the component, including width and height.
 * @property rotation - The rotation angle of the component in degrees.
 * @property position - The position of the component represented as a `Point`.
 * @property properties - A record of property names and their corresponding values.
 * @property connectors - A record of connector names and their corresponding connector details.
 */
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

export interface ComponentProps {
    componentID: string
}