import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { Wire, Component, SimulatorContextType, Point } from '@/types';

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
    const [components, setComponents] = useState<Record<string, Component>>({});
    const [wires, setWires] = useState<Record<string, Wire>>({});
    const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
    
    useEffect(() => {
        localStorage.setItem('simulatorProjectName', projectName);
    }, [projectName]);

    const addComponent = (component: Component) => {
        setComponents((prev) => ({
            ...prev,
            [component.editorId]: component
        }));
    }

    const removeComponent = (editorId: string) => {
        setComponents((prev) => {
            const newComponents = { ...prev };
            delete newComponents[editorId];
            return newComponents;
        });
    }

    const updateComponentPosition = (editorId: string, position: Point) => {
        setComponents((prev) => ({
            ...prev,
            [editorId]: {
                ...prev[editorId],
                x: position.x,
                y: position.y,
            }
        }));
    }

    const addWire = (wire: Wire) => {
        setWires((prev) => ({
            ...prev,
            [wire.editorId]: wire
        }));
    }

    const removeWire = (editorId: string) => {
        setWires((prev) => {
            const newWires = { ...prev };
            delete newWires[editorId];
            return newWires;
        });
    }

    return (
        <SimulatorContext.Provider value={{
            projectName,
            saveStatus,
            components,
            wires,
            selectedComponent,
            setProjectName,
            setSaveStatus,
            addComponent,
            removeComponent,
            updateComponentPosition,
            addWire,
            removeWire,
            setSelectedComponent
        }}>
            {children}
        </SimulatorContext.Provider>
    );
}