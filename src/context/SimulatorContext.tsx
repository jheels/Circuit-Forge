import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { EditorComponent, Point } from '@/types/general';
import { createLEDComponent } from "@/types/components/led";
import { createResistorComponent } from "@/types/components/resistor";
import { createPowerSupplyComponent } from "@/types/components/powerSupply";
import { Wire } from "@/types/general";

type ConnectorWireMap = Record<string, { wireID: string, isStart: boolean }[]>;

interface SimulatorContextType {
    projectName: string;
    saveStatus: { isSaved: boolean; lastSaved: Date | null };
    components: Record<string, EditorComponent>;
    componentCounts: Record<string, number>;
    selectedComponent: string | null;
    selectedWire: string | null;
    wires: Record<string, Wire>;
    creatingWire: Wire | null;
    hoveredConnectorID: string | null;
    connectorWireMap: ConnectorWireMap;
    setProjectName: (name: string) => void;
    setSaveStatus: (status: { isSaved: boolean; lastSaved: Date | null }) => void;
    createComponent: (type: string, position: Point) => EditorComponent;
    addComponent: (component: EditorComponent) => void;
    removeComponent: (editorID: string) => void;
    updateComponent: (editorID: string, updates: Partial<EditorComponent>) => void;
    addWire: (wire: Wire) => void;
    removeWire: (wireID: string) => void;
    updateWire: (wireID: string, updates: Partial<Wire>) => void;
    setCreatingWire: (wire: Wire | null) => void;
    setHoveredConnectorID: (id: string | null) => void;
    setSelectedComponent: (id: string | null) => void;
    setSelectedWire: (id: string | null) => void;
    resetProject: () => void;
}

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
    const [saveStatus, setSaveStatus] = useState<{ isSaved: boolean; lastSaved: Date | null }>({ isSaved: false, lastSaved: null });
    const [components, setComponents] = useState<Record<string, EditorComponent>>({});
    const [componentCounts, setComponentCounts] = useState<Record<string, number>>({});
    const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
    const [selectedWire, setSelectedWire] = useState<string | null>(null);
    const [wires, setWires] = useState<Record<string, Wire>>({});
    const [creatingWire, setCreatingWire] = useState<Wire | null>(null);
    const [hoveredConnectorID, setHoveredConnectorID] = useState<string | null>(null);
    const [connectorWireMap, setConnectorWireMap] = useState<ConnectorWireMap>({});
    
    useEffect(() => {
        localStorage.setItem('simulatorProjectName', projectName);
    }, [projectName]);

    const addWireToConnector = (connectorID: string, wireID: string, isStart: boolean) => {
        setConnectorWireMap((prev) => ({
            ...prev,
            [connectorID]: [...(prev[connectorID] || []), { wireID, isStart }]
        }));
    }

    const removeWireFromConnector = (connectorID: string, wireID: string) => {
        setConnectorWireMap((prev) => {
            const updatedConnectorWires = (prev[connectorID] || []).filter(({ wireID: id }) => id !== wireID);
            if (updatedConnectorWires.length === 0) {
                const { [connectorID]: _, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [connectorID]: updatedConnectorWires
            };
        });
    }

    const cleanUpComponentWires = (editorID: string) => {
        const component = components[editorID];
        if (!component) return;
        for (const connectorID in component.connectors){
            const wires = connectorWireMap[connectorID] || [];
            wires.forEach(({ wireID }) => {
                removeWire(wireID);
                removeWireFromConnector(connectorID, wireID);
            });
        }
    }

    const createComponent = (type: string, position: Point): EditorComponent => {
        const newCount = (componentCounts[type] || 0) + 1;
        setComponentCounts((prev) => ({
            ...prev,
            [type]: newCount
        }));
        const name = `${type} ${newCount}`;
        switch (type) {
            case 'LED':
                return createLEDComponent(position, name);
            case 'Resistor':
                return createResistorComponent(position, name);
            case 'Power Supply':
                return createPowerSupplyComponent(position, name);
            default:
                return null;
        }
    }

    const addComponent = (component: EditorComponent) => {
        setComponents((prev) => ({
            ...prev,
            [component.editorID]: component
        }));
    }

    const removeComponent = (editorID: string) => {
        cleanUpComponentWires(editorID);
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

    const addWire = (wire: Wire) => {
        setWires((prev) => ({
            ...prev,
            [wire.id]: wire
        }));
    }

    const removeWire = (wireID: string) => {    
        const wire = wires[wireID];
        if (!wire) return;
        removeWireFromConnector(wire.startConnectorID, wireID);
        if (wire.endConnectorID) {
            removeWireFromConnector(wire.endConnectorID, wireID);
        }
        setWires((prev) => {
            const newWires = { ...prev };
            delete newWires[wireID];
            return newWires;
        });
    }

    const updateWire = (wireID: string, updates: Partial<Wire>) => {
        setWires((prev) => ({
            ...prev,
            [wireID]: {
                ...prev[wireID],
                ...updates,
            }
        }));
    }

    const resetProject = () => {
        setProjectName('Untitled Project');
        setSaveStatus({ isSaved: false, lastSaved: null });
        setComponents({});
        setSelectedComponent(null);
        setSelectedWire(null);
        setComponentCounts({});
        setWires({});
        setCreatingWire(null);
        setHoveredConnectorID(null);
        setConnectorWireMap({});
    }

    return (
        <SimulatorContext.Provider value={{
            projectName,
            saveStatus,
            components,
            componentCounts,
            selectedComponent,
            selectedWire,
            wires,
            creatingWire,
            hoveredConnectorID,
            connectorWireMap,
            setProjectName,
            setSaveStatus,
            createComponent,
            addComponent,
            removeComponent,
            updateComponent,
            addWireToConnector,
            removeWireFromConnector,
            cleanUpComponentWires,
            addWire,
            removeWire,
            updateWire,
            setCreatingWire,
            setHoveredConnectorID,
            setSelectedComponent,
            setSelectedWire,
            resetProject
        }}>
            {children}
        </SimulatorContext.Provider>
    );
}