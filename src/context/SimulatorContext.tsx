import { createContext, useState, useContext, ReactNode } from "react";
import { EditorComponent, Point, Wire } from '@/types/general';
import { createLEDComponent } from "@/types/components/led";
import { createResistorComponent } from "@/types/components/resistor";
import { createPowerSupplyComponent } from "@/types/components/powerSupply";
import { createBreadboardComponent } from "@/types/components/breadboard";
import { Connector } from "@/types/connector";
import { Connection, isWireConnection } from "@/types/connection";
import { toast } from "react-hot-toast";
import { createDIPSwitchComponent } from "@/types/components/dipswitch";
import { createHexInverter, createQuadNANDGate, createQuadANDGate, createQuadORGate, createQuadNORGate, createQuadXORGate } from "@/types/components/ic";
import { sendErrorToast, sendSuccessToast } from "@/lib/utils";

interface SimulatorContextType {
    projectName: string;
    components: Record<string, EditorComponent>;
    componentElectricalValues: Record<string, Record<number, { voltage: number, current: number }>>
    componentCounts: Record<string, number>;
    selectedComponent: string | null;
    selectedWire: string | null;
    wires: Record<string, Wire>;
    creatingWire: Wire | null;
    hoveredConnectorID: string | null;
    clickedConnector: Connector | null;
    connections: Record<string, Connection>;
    connectorConnectionMap: Record<string, string>;
    clipboardComponent: EditorComponent | null;
    copySelectedComponent: () => void;
    cutSelectedComponent: () => void;
    pasteClipboardComponent: () => void;
    setProjectName: (name: string) => void;
    createComponent: (type: string, position: Point) => EditorComponent;
    addComponent: (component: EditorComponent) => void;
    removeComponent: (editorID: string) => void;
    updateComponent: (editorID: string, updates: Partial<EditorComponent>) => void;
    updateComponentElectricalValues: (componentElectricalValues: Record<string, Record<number, { voltage: number, current: number }>>) => void;
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
    getConnectorConnection: (connectorID: string) => string;
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

export const SimulatorContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
    // TODO: refactor to just store a one to one map since we just added a limitation Record<string, string>;
    const [connectorConnectionMap, setConnectorConnectionMap] = useState<Record<string, string>>({});
    const [clipboardComponent, setClipboardComponent] = useState<EditorComponent | null>(null);
    const [componentElectricalValues, setComponentElectricalValues] = useState<{ [key: string]: { [key: number]: { voltage: number, current: number } } }>({});

    const handleComponentAction = (action: 'copy' | 'cut') => {
        if (!selectedComponent || !components[selectedComponent]) return;

        const component = components[selectedComponent];
        if (component.type === 'breadboard') {
            sendErrorToast(`Cannot ${action} breadboard`);
            return;
        }

        if (component.type === 'power-supply') {
            sendErrorToast(`Cannot ${action} power supply`);
            return;
        }

        setClipboardComponent(component);

        if (action === 'cut') {
            removeComponent(selectedComponent);
            setSelectedComponent(null);
            sendSuccessToast(`${component.properties.name} cut`);
        } else {
            sendSuccessToast(`${component.properties.name} copied`);
        }
    };

    const copySelectedComponent = () => handleComponentAction('copy');
    const cutSelectedComponent = () => handleComponentAction('cut');

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
        sendSuccessToast(`${newName} pasted`);
    };

    const addConnection = (connection: Connection) => {
        setConnections((prev) => ({
            ...prev,
            [connection.id]: connection
        }));

        setConnectorConnectionMap((prev) => ({
            ...prev,
            [connection.sourceConnector.id]: connection.id,
            [connection.targetConnector.id]: connection.id,
        }));
        connection.sourceConnector.isConnected = true;
        connection.targetConnector.isConnected = true;
    }

    const removeConnection = (connectionID: string) => {
        const connection = connections[connectionID];
        if (!connection) return;
        connection.sourceConnector.isConnected = false;
        connection.targetConnector.isConnected = false;
        setConnections((prev) => {
            const newConnections = { ...prev };
            delete newConnections[connectionID];
            return newConnections;
        });
        setConnectorConnectionMap((prev) => {
            const newMap = { ...prev };
            delete newMap[connection.sourceConnector.id];
            delete newMap[connection.targetConnector.id];
            return newMap;
        });
    }

    const getConnectorConnection = (connectorID: string) => {
        return connectorConnectionMap[connectorID] || null;
    }

    const cleanUpComponentWires = (editorID: string) => {
        // TODO: Refactor to make it unified for connections so it handles wires or direct ones dynamically.
        const component = components[editorID];
        if (!component) return;
        const connectors = Object.values(component.connectors);
        connectors.forEach((connector) => {
            const connectorConnectionID = getConnectorConnection(connector.id);
            if (!connectorConnectionID) return;
            const connection = connections[connectorConnectionID];
            if (!connection) return;
            if (isWireConnection(connection) && connection.metadata.wireID) {
                removeWire(connection.metadata.wireID);
            } else {
                removeConnection(connectorConnectionID);
            }
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
            case 'dip-switch':
                return createDIPSwitchComponent(position, name);
            case '74LS04':
                return createHexInverter(position, name);
            case '74LS00':
                return createQuadNANDGate(position, name);
            case '74LS08':
                return createQuadANDGate(position, name);
            case '74LS32':
                return createQuadORGate(position, name);
            case '74LS02':
                return createQuadNORGate(position, name);
            case '74LS86':
                return createQuadXORGate(position, name);

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

    const updateComponentElectricalValues = (componentElectricalValues: Record<string, Record<number, { voltage: number, current: number }>>) => {
        setComponentElectricalValues(componentElectricalValues);
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
            return isWireConnection(connection) && connection.metadata.wireID === wireID;
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
        // check if it resets everything
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
        setConnectorConnectionMap({});
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
            connectorConnectionMap,
            clipboardComponent,
            componentElectricalValues,
            updateComponentElectricalValues,
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
            getConnectorConnection,
        }}>
            {children}
        </SimulatorContext.Provider>
    );
}