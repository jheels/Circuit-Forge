import { Connection } from '@/definitions/connection';
import { EditorComponent, Wire } from '@/definitions/general';
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useSimulatorContext } from '@/context/SimulatorContext';
import Konva from 'konva';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';

interface CircuitMetadata {
    name: string;
    lastSaved: number;
}

// Mirroring the structure of the project from SimulatorContext
interface CircuitProject {
    metadata: CircuitMetadata;
    components: Record<string, EditorComponent>;
    componentCounts: Record<string, number>;
    connections: Record<string, Connection>;
    connectorConnectionMap: Record<string, string>;
    wires: Record<string, Wire>;
}

interface SaveResult {
    success: boolean;
    error?: string;
}

export interface SaveContextType {
    currentProject: CircuitProject | null;
    currentFileHandle: FileSystemFileHandle | null;
    hasUnsavedChanges: boolean;
    setCurrentFileHandle: (fileHandle: FileSystemFileHandle | null) => void;
    saveProject: (saveAs?: boolean) => Promise<SaveResult>;
    loadProject: () => Promise<SaveResult>;
    exportProjectAsImage: () => Promise<void>;
}

const SaveContext = createContext<SaveContextType | undefined>(undefined);

interface SaveProviderProps {
    children: React.ReactNode;
    stageRef: React.RefObject<Konva.Stage>;
}

// Zod schemas matching the structure of the project
const PointSchema = z.object({ x: z.number(), y: z.number() });
const ConnectorSchema = z.object({
    id: z.string(),
    componentID: z.string(),
    type: z.string(),
    hitAreaSize: z.number(),
    offset: z.object({ x: z.number(), y: z.number() }),
    isConnected: z.boolean(),
    metadata: z.record(z.unknown()).optional(),
});
const EditorComponentSchema = z.object({
    editorID: z.string(),
    type: z.string(),
    dimensions: z.object({ width: z.number(), height: z.number() }),
    rotation: z.number(),
    position: PointSchema,
    properties: z.record(z.unknown()),
    connectors: z.record(ConnectorSchema),
});
const WireSchema = z.object({
    id: z.string(),
    startConnector: ConnectorSchema,
    endConnector: ConnectorSchema.nullable(),
    points: z.array(PointSchema),
});
const ConnectionSchema = z.object({
    id: z.string(),
    sourceConnector: ConnectorSchema,
    targetConnector: ConnectorSchema,
    type: z.string(),
    metadata: z.record(z.unknown()),
});
const CircuitProjectSchema = z.object({
    metadata: z.object({ name: z.string(), lastSaved: z.number() }),
    components: z.record(EditorComponentSchema),
    componentCounts: z.record(z.number()),
    connections: z.record(ConnectionSchema),
    connectorConnectionMap: z.record(z.string()),
    wires: z.record(WireSchema),
}).strict(); // Reject unknown fields even if rest of the object is valid

/**
 * 
 * @param { ReactNode } children - The children components to be wrapped by the SaveProvider.
 * @param { React.RefObject<Konva.Stage> } stageRef - A reference to the Konva stage used for rendering the circuit.
 * @returns {JSX.Element} - A JSX element that wraps the children with the SaveContext provider.
 * @description Provides a context for saving and loading circuit projects.
 * This context includes methods for saving the current project, loading a project from a file,
 */
export const SaveProvider: React.FC<SaveProviderProps> = ({ children, stageRef }) => {
    const {
        projectName,
        components,
        componentCounts,
        connections,
        connectorConnectionMap,
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
        connectorConnectionMap,
        wires,
    }), [projectName, components, componentCounts, connections, connectorConnectionMap, wires]);

    useEffect(() => {
        setHasUnsavedChanges(true);
    }, [projectName, components, connections, connectorConnectionMap, wires]);


    const serialiseProject = useCallback((project: CircuitProject) => {
        return JSON.stringify(project, null, 2);
    }, []);

    const deserialiseProject = useCallback((json: string): CircuitProject => {
        const deserialisedProject = JSON.parse(json);

        return { ...deserialisedProject };
    }, []);

    /**
     * 
     * @param project - The project object to validate.
     * @returns { valid: boolean, error?: string } - An object indicating whether the project is valid and an error message if it is not.
     */
    const validateProject = (project: unknown): { valid: boolean, error?: string } => {
        const result = CircuitProjectSchema.safeParse(project);
        if (!result.success) {
            const validationError = fromError(result.error);
            console.error("Loading error:", validationError.toString());
            return { valid: false, error: "Project file is invalid - check console" };
        }
        return { valid: true };
    };

    /**
     * @param {boolean} saveAs - Whether to prompt the user for a new file name.
     * @returns {Promise<SaveResult>} - A promise that resolves to an object indicating the success or failure of the save operation.
     * @description Saves the current project to a file. If saveAs is true, prompts the user for a new file name.
     */
    const saveProject = useCallback(async (saveAs: boolean = false): Promise<SaveResult> => {
        if (!currentProject) {
            return { success: false, error: 'No project to save.' };
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
                setCurrentFileHandle(fileHandle); // For future saves overwriting it 
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
            if (error instanceof DOMException && error.name === 'AbortError') {
                return { success: false, error: 'Aborted save' };
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to save project.'
            }
        }
    }, [currentFileHandle, currentProject, serialiseProject]);

    /**
     * @returns {Promise<LoadResult>} - A promise that resolves to an object indicating the success or failure of the load operation.
     * @description Loads a project from a file. Prompts the user to select a file and deserialises it into the current project.
     */
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

            // Validate project structure before loading
            const validation = validateProject(project);
            if (!validation.valid) {
                return { success: false, error: validation.error || 'Project validation failed.' };
            }

            // Update SimulatorContext with the loaded project
            resetProject();
            setProjectName(project.metadata.name);
            Object.values(project.components).forEach(component => {addComponent(component)});
            Object.values(project.connections).forEach(connection => addConnection(connection));
            Object.values(project.wires).forEach(wire => addWire(wire));
            setComponentCounts(project.componentCounts);
            setCurrentFileHandle(fileHandle);
            setHasUnsavedChanges(true);

            return { success: true };
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return { success: false, error: 'Aborted loading' };
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to load project'
            }
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

/**
 * 
 * @returns {SaveContextType} - The current context value of the SaveContext.
 * @throws {Error} - Throws an error if the context is used outside of a SaveProvider.
 * @description A custom hook to access the SaveContext. It provides methods for saving, loading, and exporting projects.
 */
export const useSaveContext = () => {
    const context = useContext(SaveContext);

    if (!context) {
        throw new Error('useSaveContext must be used within a SaveProvider');
    }

    return context;
};