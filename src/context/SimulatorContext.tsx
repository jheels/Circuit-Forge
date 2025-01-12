import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { EditorComponent, SimulatorContextType } from '@/types/general';

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

export const useSimulatorContext = () => {
    const context = useContext(SimulatorContext);
    if (!context) {
        throw new Error('useSimulatorContext must be used within a SimulatorContextProvider');
    }
    return context;
}

export const SimulatorContextProvider: React.FC<{children : ReactNode}> = ({ children }) => {
    const [projectName, setProjectName] = useState<string>(() => {
        return localStorage.getItem('simulatorProjectName') || 'Untitled Project';
    });
    const [saveStatus, setSaveStatus] = useState<{ isSaved: boolean; lastSaved: Date | null }>({ isSaved: false, lastSaved: null }); // might have to export to a type
    const [components, setComponents] = useState<Record<string, EditorComponent>>({});
    const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
    
    useEffect(() => {
        localStorage.setItem('simulatorProjectName', projectName);
    }, [projectName]);

    const addComponent = (component: EditorComponent) => {
        setComponents((prev) => ({
            ...prev,
            [component.editorID]: component
        }));
    }

    const removeComponent = (editorID: string) => {
        setComponents((prev) => {
            const newComponents = { ...prev };
            delete newComponents[editorID];
            return newComponents;
        });
    }

    const updateComponent = (editorID: string, updates: Partial<EditorComponent>) => {
        setComponents((prev) => ({
            ...prev,
            [editorID]: {
                ...prev[editorID],
                ...updates,
            }
        }));
    }

    const resetProject = () => {
        setProjectName('Untitled Project');
        setSaveStatus({ isSaved: false, lastSaved: null });
        setComponents({});
        setSelectedComponent(null);
    }

    return (
        <SimulatorContext.Provider value={{
            projectName,
            saveStatus,
            components,
            selectedComponent,
            setProjectName,
            setSaveStatus,
            addComponent,
            removeComponent,
            updateComponent,
            setSelectedComponent,
            resetProject
        }}>
            {children}
        </SimulatorContext.Provider>
    );
}