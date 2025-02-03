import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { EditorComponent, Point, Wire } from '@/types/general';
import { createLEDComponent } from "@/types/components/led";
import { createResistorComponent } from "@/types/components/resistor";
import { createPowerSupplyComponent } from "@/types/components/powerSupply";
import { createBreadboardComponent } from "@/types/components/breadboard";
import { Connector } from "@/types/connector";
import { Connection } from "@/types/connection";

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
    clickedConnector: Connector | null;
    connections: Record<string, Connection>;
    connectorConnections: Record<string, Set<string>>;
    setProjectName: (name: string) => void;
    setSaveStatus: (status: { isSaved: boolean; lastSaved: Date | null }) => void;
    createComponent: (type: string, position: Point) => EditorComponent;
    addComponent: (component: EditorComponent) => void;
    removeComponent: (editorID: string) => void;
    updateComponent: (editorID: string, updates: Partial<EditorComponent>) => void;
    cleanUpComponentWires: (editorID: string) => void;
    addWire: (wire: Wire) => void;
    removeWire: (wireID: string) => void;
    updateWire: (wireID: string, updates: Partial<Wire>) => void;
    setCreatingWire: (wire: Wire | null) => void;
    setHoveredConnectorID: (id: string | null) => void;
    setSelectedComponent: (id: string | null) => void;
    setSelectedWire: (id: string | null) => void;
    setClickedConnector: (connector: Connector | null) => void;
    addConnection: (connection: Connection) => void;
    removeConnection: (connectionID: string) => void;
    getConnectorConnections: (connectorID: string) => Set<string>;
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
    const [clickedConnector, setClickedConnector] = useState<Connector | null>(null);
    const [connections, setConnections] = useState<Record<string, Connection>>({});
    const [connectorConnections, setConnectorConnections] = useState<Record<string, Set<string>>>({});

    useEffect(() => {
        localStorage.setItem('simulatorProjectName', projectName);
    }, [projectName]);

    const addConnection = (connection: Connection) => {
        setConnections((prev) => ({
            ...prev,
            [connection.id]: connection
        }));
        setConnectorConnections((prev) => {
            const startConnections = prev[connection.sourceConnectorID] || new Set();
            startConnections.add(connection.id);
            const endConnections = prev[connection.targetConnectorID] || new Set();
            endConnections.add(connection.id);
            return {
                ...prev,
                [connection.sourceConnectorID]: startConnections,
                [connection.targetConnectorID]: endConnections
            };
        });
    }

    const removeConnection = (connectionID: string) => {
        const connection = connections[connectionID];
        if (!connection) return;
        setConnections((prev) => {
            const newConnections = { ...prev };
            delete newConnections[connectionID];
            return newConnections;
        });
        setConnectorConnections((prev) => {
            const startConnections = prev[connection.sourceConnectorID] || new Set();
            startConnections.delete(connectionID);
            const endConnections = prev[connection.targetConnectorID] || new Set();
            endConnections.delete(connectionID);

            const newConnections = { ...prev };
            if (startConnections.size === 0) {
                delete newConnections[connection.sourceConnectorID];
            } else {
                newConnections[connection.sourceConnectorID] = startConnections;
            }

            if (endConnections.size === 0) {
                delete newConnections[connection.targetConnectorID];
            } else {
                newConnections[connection.targetConnectorID] = endConnections;
            }

            return newConnections;
        });
    }

    const getConnectorConnections = (connectorID: string) => {
        return connectorConnections[connectorID] || new Set();
    }

    const cleanUpComponentWires = (editorID: string) => {
        const component = components[editorID];
        if (!component) return;
        // remove all associated wires with the component using connectorConnections
        const connectors = Object.values(component.connectors);
        // iterate through each connectors connection and check if its a wire if so remove it
        connectors.forEach((connector) => {
            const connectorConnections = getConnectorConnections(connector.id);
            connectorConnections.forEach((connectionID) => {
                const connection = connections[connectionID];
                if (!connection) return;
                if (connection.type === 'wire' && connection.metadata.wireID) {
                    removeWire(connection.metadata.wireID);
                }
            });
        });
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
            case 'Breadboard':
                return createBreadboardComponent(position, name);
            default:
                throw new Error(`Invalid component type: ${type}`);
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

        const connectionID = Object.keys(connections).find((id) => {
            const connection = connections[id];
            return connection.type === 'wire' && connection.metadata.wireID === wireID;
        });
        
        if (connectionID) {
            removeConnection(connectionID);
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
        setClickedConnector(null);
        setConnections({});
        setConnectorConnections({});
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
            clickedConnector,
            connections,
            connectorConnections,
            setProjectName,
            setSaveStatus,
            createComponent,
            addComponent,
            removeComponent,
            updateComponent,
            cleanUpComponentWires,
            addWire,
            removeWire,
            updateWire,
            setCreatingWire,
            setHoveredConnectorID,
            setClickedConnector,
            setSelectedComponent,
            setSelectedWire,
            resetProject,
            addConnection,
            removeConnection,
            getConnectorConnections,
        }}>
            {children}
        </SimulatorContext.Provider>
    );
}