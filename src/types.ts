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
    info: ComponentTile;
}