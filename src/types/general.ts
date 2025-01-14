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
    isSelected: boolean;
    isHovered: boolean;
}

export interface SimulatorContextType {
    projectName: string;
    saveStatus: {isSaved: boolean; lastSaved: Date | null },
    components: Record<string, EditorComponent>;
    selectedComponent: string | null;
    hoveredConnector: Connector | null;
    setProjectName: (name: string) => void;
    setSaveStatus: (status: {isSaved: boolean; lastSaved: Date | null }) => void;
    createComponent: (type: string, position: Point) => EditorComponent;
    addComponent: (component: EditorComponent) => void;
    removeComponent: (editorId: string) => void;
    updateComponent: (editorId: string, updates: Partial<EditorComponent>) => void;
    setSelectedComponent: (editorId: string | null) => void;
    startWireCreation: (connector: Connector) => void;
    resetProject: () => void;
}