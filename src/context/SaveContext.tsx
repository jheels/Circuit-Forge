import { Connection } from '@/types/connection';
import { EditorComponent, Wire } from '@/types/general';
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useSimulatorContext } from '@/context/SimulatorContext';
import Konva from 'konva';

interface CircuitMetadata {
    name: string;
    lastSaved: number;
}

interface CircuitProject {
    metadata: CircuitMetadata;
    components: Record<string, EditorComponent>;
    componentCounts: Record<string, number>;
    connections: Record<string, Connection>;
    connectorConnections: Record<string, Set<string>>;
    wires: Record<string, Wire>;
}

interface SaveResult {
    success: boolean;
    error?: string;
}

interface SaveContextType {
    currentProject: CircuitProject | null;
    currentFileHandle: FileSystemFileHandle | null;
    hasUnsavedChanges: boolean;
    setCurrentFileHandle: (fileHandle: FileSystemFileHandle | null) => void;
    saveProject: (saveAs?: boolean) => Promise<SaveResult>;
    loadProject: () => Promise<void>;
    exportProjectAsImage: () => Promise<void>;
}

const SaveContext = createContext<SaveContextType | undefined>(undefined);

interface SaveProviderProps {
    children: React.ReactNode;
    stageRef: React.RefObject<Konva.Stage>;
}

export const SaveProvider: React.FC<SaveProviderProps> = ({ children, stageRef }) => {
    const {
        projectName,
        components,
        componentCounts,
        connections,
        connectorConnections,
        wires,
        resetProject,
        setProjectName,
        addComponent,
        addWire,
        addConnection,
        setComponentCounts,
     } = useSimulatorContext();
    const [currentFileHandle, setCurrentFileHandle] = useState<FileSystemFileHandle | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const currentProject = useMemo(() => ({
        metadata: {
            name: projectName,
            lastSaved: Date.now(),
        },
        components,
        componentCounts,
        connections,
        connectorConnections,
        wires,
    }), [projectName, components, componentCounts, connections, connectorConnections, wires]);

    useEffect(() => {
        setHasUnsavedChanges(true);
    }, [projectName, components, connections, connectorConnections, wires]);

    const serialiseProject = useCallback((project: CircuitProject) => {
        const serialisedProject = {
            ...project,
            connectorConnections: Object.fromEntries(
                Object.entries(project.connectorConnections).map(([key, value]) => [key, Array.from(value)])
            )
        };

        return JSON.stringify(serialisedProject, null, 2);
    }, []);

    const deserialiseProject = useCallback((json: string): CircuitProject => {
        const deserialisedProject = JSON.parse(json);

        return {
            ...deserialisedProject,
            connectorConnections: Object.fromEntries(
                Object.entries(deserialisedProject.connectorConnections).map(([key, value]) => [key, new Set(value)])
            )
        };
    }, []);

    const saveProject = useCallback(async (saveAs: boolean = false): Promise<SaveResult> => {
        if (!currentProject) {
            return { success: false, error: 'No project to save' };
        }

        try {
            let fileHandle = currentFileHandle;

            if (!fileHandle || saveAs) {
                fileHandle = await window.showSaveFilePicker({
                    suggestedName: `${currentProject.metadata.name}.bread`,
                    types: [{
                        description: 'Circuit Forge Simulation Project',
                        accept: {
                            'application/x-bread': ['.bread']
                        }
                    }]
                });
                setCurrentFileHandle(fileHandle);
            }

            const writable = await fileHandle?.createWritable();
            const updateProject = {
                ...currentProject,
                metadata: {
                    ...currentProject.metadata,
                    lastSaved: Date.now()
                }
            };

            await writable?.write(serialiseProject(updateProject));
            await writable?.close();

            setHasUnsavedChanges(false);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to save project'
            }
        }
    }, [currentFileHandle, currentProject, serialiseProject]);

    const loadProject = useCallback(async () => {
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Circuit Forge Simulation Project',
                    accept: {
                        'application/x-bread': ['.bread'],
                        'application/json': ['.json']
                    }
                }]
            });

            const file = await fileHandle.getFile();
            const contents = await file.text();
            const project = deserialiseProject(contents);

            // Update SimulatorContext with the loaded project
            // Need to add specific error handling here
            resetProject();
            setProjectName(project.metadata.name);
            Object.values(project.components).forEach(component => {addComponent(component)});
            Object.values(project.connections).forEach(connection => addConnection(connection));
            Object.values(project.wires).forEach(wire => addWire(wire));
            setComponentCounts(project.componentCounts);
            setCurrentFileHandle(fileHandle);
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Failed to load project:', error);
        }
    }, [addComponent, addConnection, addWire, deserialiseProject, resetProject, setComponentCounts, setProjectName]);

    const exportProjectAsImage = useCallback(async () => {
        if (stageRef.current) {
            const stage = stageRef.current;
            const originalWidth = stage.width();
            const originalHeight = stage.height();
            const originalScale = stage.scaleX();
            const originalPosition = stage.position();

            // Calculate the bounding box of all elements
            const boundingBox = stage.getClientRect({ skipTransform: true });

            // Resize the stage to fit all elements
            stage.width(boundingBox.width);
            stage.height(boundingBox.height);
            stage.scale({ x: 1, y: 1 });
            stage.position({ x: -boundingBox.x, y: -boundingBox.y });

            // Capture the image with a higher pixel ratio
            const dataURL = stage.toDataURL({ pixelRatio: 7.5 });

            // Restore the original stage size and position
            stage.width(originalWidth);
            stage.height(originalHeight);
            stage.scale({ x: originalScale, y: originalScale });
            stage.position(originalPosition);

            // Create a link to download the image
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `${currentProject?.metadata.name}_${currentProject.metadata.lastSaved}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [stageRef, currentProject]);

    return (
        <SaveContext.Provider value={{ currentProject, currentFileHandle, setCurrentFileHandle, saveProject, loadProject, exportProjectAsImage, hasUnsavedChanges }}>
            {children}
        </SaveContext.Provider>
    );
};

export const useSaveContext = () => {
    const context = useContext(SaveContext);

    if (!context) {
        throw new Error('useSaveContext must be used within a SaveProvider');
    }

    return context;
};