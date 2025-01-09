export type Point = {
    x: number;
    y: number;
}

export interface ComponentTile {
    id: string;
    name: string;
    description: string;
    component?: JSX.Element;
}

export interface Component {
    editorId: string;
    x: number;
    y: number;
    info: any; // need to replace
}

export interface Wire {
    editorId: string;
    start: Point;
    end: Point;
}

export interface SimulatorContextType {
    projectName: string;
    saveStatus: {isSaved: boolean; lastSaved: Date | null },
    components: Record<string, Component>;
    wires: Record<string, Wire>;
    selectedComponent: string | null;
    setProjectName: (name: string) => void;
    setSaveStatus: (status: {isSaved: boolean; lastSaved: Date | null }) => void;
    addComponent: (component: Component) => void;
    removeComponent: (editorId: string) => void;
    updateComponent: (editorId: string, updates: Partial<Component>) => void;
    addWire: (wire: Wire) => void;
    removeWire: (editorId: string) => void;
    setSelectedComponent: (editorId: string | null) => void;
    resetProject: () => void;
}