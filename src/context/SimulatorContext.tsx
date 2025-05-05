import { createContext, useState, useContext, ReactNode } from "react";
import { EditorComponent, Point, Wire } from '@/definitions/general';
import { createLEDComponent } from "@/definitions/components/led";
import { createResistorComponent } from "@/definitions/components/resistor";
import { createPowerSupplyComponent } from "@/definitions/components/powerSupply";
import { createBreadboardComponent } from "@/definitions/components/breadboard";
import { Connector } from "@/definitions/connector";
import { Connection, isWireConnection } from "@/definitions/connection";
import { createDIPSwitchComponent } from "@/definitions/components/dipswitch";
import { createHexInverter, createQuadNANDGate, createQuadANDGate, createQuadORGate, createQuadNORGate, createQuadXORGate, createMysteryIC } from "@/definitions/components/ic";
import { sendErrorToast, sendSuccessToast } from "@/lib/utils";

export interface SimulatorContextType {
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
    getConnectorConnection: (connectorID: string) => string | null;
    resetProject: () => void;
}

export const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

export const useSimulatorContext = () => {
    const context = useContext(SimulatorContext);
    if (!context) {
        throw new Error('useSimulatorContext must be used within a SimulatorContextProvider');
    }
    return context;
}

/**
 * 
 * @param { ReactNode} children - The children components to be wrapped by the SimulatorContextProvider.
 * @returns {JSX.Element} - A JSX element that wraps the children with the SimulatorContext provider.
 * @description It provides a context for managing the state of the simulator, including components, wires, connections, and project name.
 * It also provides functions to manipulate the state, such as adding, removing, and updating components and wires.
 */
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
    const [connectorConnectionMap, setConnectorConnectionMap] = useState<Record<string, string>>({});
    const [clipboardComponent, setClipboardComponent] = useState<EditorComponent | null>(null);
    // Maps editorID to electrical values with multi terminal support
    // e.g. { "editorID": { 1: { voltage: 5, current: 0.1 }, 2: { voltage: 3, current: 0.05 } } }
    const [componentElectricalValues, setComponentElectricalValues] = useState<{ [key: string]: { [key: number]: { voltage: number, current: number } } }>({});

    /**
     * 
     * @param action - The action to perform, either 'copy' or 'cut'.
     * @description Handles the action of copying or cutting a component. If the action is 'cut', it removes the component from the components state.
     * If the action is 'copy', it simply copies the component to the clipboard.
     */
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

    /**
     * 
     * @description Handles the action of pasting a component from the clipboard. It creates a new component with the same properties as the clipboard component,
     * but with a new position and a new name. The new component is then added to the components state and selected.
     * It also sends a success toast notification with the name of the pasted component.
     */
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

    /**
     * 
     * @param connection - The connection to add.
     * @description Adds a connection to the connections state and updates the connectorConnectionMap state.
     * It also sets the isConnected property of the source and target connectors to true.
     */
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

    /**
     * 
     * @param connectionID - The ID of the connection to remove.
     * @description Removes a connection from the connections state and updates the connectorConnectionMap state.
     * It also sets the isConnected property of the source and target connectors to false.
     */
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

    /**
     * 
     * @param connectorID - The ID of the connector to get the connection for.
     * @description Retrieves the connection ID for a given connector ID from the connectorConnectionMap state.
     * @returns {string | null} - The connection ID if it exists, otherwise null.
     */
    const getConnectorConnection = (connectorID: string) => {
        return connectorConnectionMap[connectorID] || null;
    }

    /**
     * 
     * @param editorID - The ID of the component to clean up wires for.
     * @description Cleans up the wires for a given component by removing the wires associated with its connectors.
     */
    const cleanUpComponentWires = (editorID: string) => {
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

    /**
     * 
     * @param type - The type of the component to create.
     * @param position - The position of the component.
     * @description Creates a new component of the specified type at the given position.
     * It also updates the component counts state to keep track of the number of components of each type.
     * @returns {EditorComponent} - The newly created component.
     */
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
            case 'MYSTERY':
                return createMysteryIC(position, name);
            default:
                throw new Error(`Invalid component type: ${type}`);
        }
    }

    /**
     * 
     * @param component - The component to add.
     * @description Adds a component to the components state and updates the component counts state.
     */
    const addComponent = (component: EditorComponent) => {
        setComponents((prev) => ({
            ...prev,
            [component.editorID]: component
        }));
    }

    /**
     * 
     * @param editorID - The ID of the component to remove.
     * @description Removes a component from the components state and updates the component counts state.
     * It also cleans up the wires associated with the component.
     */
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

    /**
     * 
     * @param editorID - The ID of the component to update.
     * @param updates - The updates to apply to the component.
     * @description Updates a component in the components state with the provided updates.
     */
    const updateComponent = (editorID: string, updates: Partial<EditorComponent>) => {
        setComponents((prev) => ({
            ...prev,
            [editorID]: {
                ...prev[editorID],
                ...updates,
            }
        }));
    }

    /**
     * 
     * @param componentElectricalValues - The electrical values to update.
     * @description Updates the component electrical values in the componentElectricalValues state.
     */
    const updateComponentElectricalValues = (componentElectricalValues: Record<string, Record<number, { voltage: number, current: number }>>) => {
        setComponentElectricalValues(componentElectricalValues);
    }

    /**
     * 
     * @param wire - The wire to add.
     * @description Adds a wire to the wires state.
     */
    const addWire = (wire: Wire) => {
        setWires((prev) => ({
            ...prev,
            [wire.id]: wire
        }));
    }

    /**
     * 
     * @param wireID - The ID of the wire to remove.
     * @description Removes a wire from the wires state and cleans up any connections associated with it.
     */
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

    /**
     * 
     * @param wireID - The ID of the wire to update.
     * @param updates - The updates to apply to the wire.
     * @description Updates a wire in the wires state with the provided updates.
     */
    const updateWire = (wireID: string, updates: Partial<Wire>) => {
        setWires((prev) => ({
            ...prev,
            [wireID]: {
                ...prev[wireID],
                ...updates,
            }
        }));
    }

    /**
     * 
     * @description Resets the project by clearing all components, wires, connections, and other states.
     */
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