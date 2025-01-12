export type Point = {
    x: number;
    y: number;
}

export type ConnectorType = 'input' | 'output' | 'bidirectional' | 'ground' | 'power';

export interface Connector {
    id: string;
    position: Point;
    type: ConnectorType;
    isConnected: boolean;
    connectedTo?: string;
}

export interface ComponentMetadata {
    name: string;
    properties: Record<string, any>; // need to replace
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

    position: Point;
    metadata: ComponentMetadata;
    connectors: Connector[]; 
    isSelected: boolean;
    isHovered: boolean;
}

export interface SimulatorContextType {
    projectName: string;
    saveStatus: {isSaved: boolean; lastSaved: Date | null },
    components: Record<string, EditorComponent>;
    selectedComponent: string | null;
    setProjectName: (name: string) => void;
    setSaveStatus: (status: {isSaved: boolean; lastSaved: Date | null }) => void;
    createComponent: (type: string, position: Point) => EditorComponent;
    addComponent: (component: EditorComponent) => void;
    removeComponent: (editorId: string) => void;
    updateComponent: (editorId: string, updates: Partial<EditorComponent>) => void;
    setSelectedComponent: (editorId: string | null) => void;
    resetProject: () => void;
}