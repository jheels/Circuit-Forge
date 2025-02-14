import { createContext, useState, useContext, ReactNode } from "react";
import { EditorComponent, Point, Wire } from '@/types/general';
import { createLEDComponent } from "@/types/components/led";
import { createResistorComponent } from "@/types/components/resistor";
import { createPowerSupplyComponent } from "@/types/components/powerSupply";
import { createBreadboardComponent } from "@/types/components/breadboard";
import { Connector } from "@/types/connector";
import { Connection, isWireConnection } from "@/types/connection";

interface SimulatorContextType {
    projectName: string;
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
    clipboardComponent: EditorComponent | null;
    copySelectedComponent: () => void;
    cutSelectedComponent: () => void;
    pasteClipboardComponent: () => void;
    setProjectName: (name: string) => void;
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
    setComponentCounts: (counts: Record<string, number>) => void;
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
    const [clipboardComponent, setClipboardComponent] = useState<EditorComponent | null>(null);

    const copySelectedComponent = () => {
        if (!selectedComponent || !components[selectedComponent]) return;

        const componentToCopy = components[selectedComponent];
        if (componentToCopy.type === 'breadboard' || componentToCopy.type === 'power-supply') {
            console.log('Cannot copy breadboard or power supply components');
            return;
        }
        setClipboardComponent(componentToCopy);
        console.log('Copied component to clipboard:', componentToCopy);
    };

    const cutSelectedComponent = () => {
        if (!selectedComponent || !components[selectedComponent]) return;

        const componentToCut = components[selectedComponent];
        if (componentToCut.type === 'breadboard' || componentToCut.type === 'power-supply') {
            console.log('Cannot copy breadboard or power supply components');
            return;
        }
        setClipboardComponent(componentToCut);
        removeComponent(selectedComponent);
        setSelectedComponent(null);
        console.log('Cut component to clipboard:', componentToCut);
    };

    const pasteClipboardComponent = () => {
        if (!clipboardComponent) return;

        const OFFSET_DISTANCE = 20;
        const { position } = clipboardComponent;
        const newPosition = { x: position.x + OFFSET_DISTANCE, y: position.y + OFFSET_DISTANCE };
        const newName = `${clipboardComponent.properties.name} Copy`;
        const newComponent = createComponent(clipboardComponent.type, newPosition);

        const updatedProperties = {
            ...clipboardComponent.properties,
            name: newName
        }
        newComponent.properties = updatedProperties;

        addComponent(newComponent);
        setSelectedComponent(newComponent.editorID);
        console.log('Pasted component from clipboard:', newComponent);
    };

    const addConnection = (connection: Connection) => {
        setConnections((prev) => ({
            ...prev,
            [connection.id]: connection
        }));
        setConnectorConnections((prev) => {
            const startConnections = prev[connection.sourceConnector.id] || new Set();
            startConnections.add(connection.id);
            const endConnections = prev[connection.targetConnector.id] || new Set();
            endConnections.add(connection.id);
            return {
                ...prev,
                [connection.sourceConnector.id]: startConnections,
                [connection.targetConnector.id]: endConnections
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
            const startConnections = prev[connection.sourceConnector.id] || new Set();
            startConnections.delete(connectionID);
            const endConnections = prev[connection.targetConnector.id] || new Set();
            endConnections.delete(connectionID);

            const newConnections = { ...prev };
            if (startConnections.size === 0) {
                delete newConnections[connection.sourceConnector.id];
            } else {
                newConnections[connection.sourceConnector.id] = startConnections;
            }

            if (endConnections.size === 0) {
                delete newConnections[connection.targetConnector.id];
            } else {
                newConnections[connection.targetConnector.id] = endConnections;
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
                if (isWireConnection(connection) && connection.metadata.wireID) {
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
            case 'led':
                return createLEDComponent(position, name);
            case 'resistor':
                return createResistorComponent(position, name);
            case 'power-supply':
                return createPowerSupplyComponent(position, name);
            case 'breadboard':
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
        const component = components[editorID];
        if (!component) return;

        cleanUpComponentWires(editorID);

        setComponents((prev) => {
            const newComponents = { ...prev };
            delete newComponents[editorID];
            return newComponents;
        });

        setComponentCounts((prev) => {
            const newCounts = { ...prev };
            if (newCounts[component.type] > 0) {
                newCounts[component.type] -= 1;
            }
            return newCounts;
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
        console.log('Removing wire:', wireID);
        // possibly bring back wireConnection
        const connectionID = Object.keys(connections).find((id) => {
            const connection = connections[id];
            return isWireConnection(connection) && connection.metadata.wireID === wireID;
        });
        console.log('Removing connection:', connectionID);
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
        setClipboardComponent(null);
    }

    return (
        <SimulatorContext.Provider value={{
            projectName,
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
            clipboardComponent,
            copySelectedComponent,
            cutSelectedComponent,
            pasteClipboardComponent,
            setProjectName,
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
            setComponentCounts,
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