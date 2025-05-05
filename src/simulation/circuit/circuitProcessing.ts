import { Connection, isWireConnection } from "@/definitions/connection";
import { CircuitGraph, createCircuitEdge, createComponentConnection, createDIPSwitchConnection, createICComponentConnection, createWireConnection } from "./circuitDetection";
import { PowerDistribution } from "@/hooks/simulation/useFindPowerDistribution";
import { DIPSwitchComponent } from "@/definitions/components/dipswitch";
import { EditorComponent } from "@/definitions/general";
import { getICDefinition, ICComponent } from "@/definitions/components/ic";
import { Connector } from "@/definitions/connector";

/**
 * Updates the strip ID to either the power node or ground node based on the provided power distribution.
 * If the strip ID corresponds to a powered rail, it is replaced with the power node.
 * If the strip ID corresponds to a grounded rail, it is replaced with the ground node.
 * If the strip ID does not match any powered or grounded rails, it is returned unchanged.
 *
 * @param stripID - The identifier of the strip to be updated.
 * @param powerDistribution - An object containing the power and ground nodes, as well as the sets of powered and grounded rails.
 * @returns The updated strip ID, which may be the power node, ground node, or the original strip ID.
 */
const updateStripIDForPowerAndGround = (
    stripID: string,
    powerDistribution: PowerDistribution
): string => {
    const { powerNode, groundNode, poweredRails, groundedRails } = powerDistribution;

    if (poweredRails.has(stripID)) {
        return powerNode;
    } else if (groundedRails.has(stripID)) {
        return groundNode;
    }

    return stripID;
}

/**
 * Processes wire connections in a circuit graph by updating the graph's nodes and edges
 * based on the provided connections and power distribution.
 *
 * @param graph - The circuit graph containing nodes and edges to be updated.
 * @param connections - A record of connection objects, where each connection represents
 * a potential wire connection in the circuit.
 * @param powerDistribution - The power distribution object used to update strip IDs
 * for power and ground connections.
 * @returns The updated circuit graph with processed wire connections.
 */
export const processWireConnections = (
    graph: CircuitGraph,
    connections: Record<string, Connection>,
    powerDistribution: PowerDistribution
): CircuitGraph => {
    const { nodes, edges } = graph;
    const processedConnections = new Set<string>();

    Object.values(connections).forEach(connection => {
        if (isWireConnection(connection) && connection.metadata.targetStripID && !processedConnections.has(connection.id)) {
            const sourceId = updateStripIDForPowerAndGround(connection.metadata.stripID, powerDistribution);
            const targetId = updateStripIDForPowerAndGround(connection.metadata.targetStripID, powerDistribution);

            if (!nodes[sourceId] || !nodes[targetId]) return;
            const edge = createCircuitEdge(
                sourceId,
                targetId,
                createWireConnection(connection.metadata.wireID)
            );
            edges[edge.id] = edge;
            processedConnections.add(connection.id);
        }
    });

    return { nodes, edges };
}

/**
 * Processes the connections of a DIP switch component within a circuit graph.
 * This function ensures that the DIP switch connections are properly represented
 * as edges in the circuit graph, based on the provided connections and power distribution.
 *
 * @param graph - The current circuit graph containing nodes and edges.
 * @param connections - A record of connection objects, keyed by their IDs.
 * @param powerDistribution - The power distribution object used to manage power and ground strips.
 * @param DIPSwitchComponent - The DIP switch component being processed.
 * @param getConnectorConnection - A function that retrieves the connection ID for a given connector ID.
 * @returns The updated circuit graph with the DIP switch connections added as edges.
 */
export const processDIPSwitchConnections = (
    graph: CircuitGraph,
    connections: Record<string, Connection>,
    powerDistribution: PowerDistribution,
    DIPSwitchComponent: DIPSwitchComponent,
    getConnectorConnection: (connectorID: string) => string | null
): CircuitGraph => {
    const { nodes, edges } = graph;
    const connectorArray = Object.values(DIPSwitchComponent.connectors);

    if (connectorArray.length !== 16) return graph;

    for (let i = 0; i < 8; i++) {
        const leftConnector = connectorArray[i * 2];
        const rightConnector = connectorArray[i * 2 + 1];
        const leftConnectionID = getConnectorConnection(leftConnector.id);
        const rightConnectionID = getConnectorConnection(rightConnector.id);
        const leftConnection = leftConnectionID ? connections[leftConnectionID] : null;
        const rightConnection = rightConnectionID ? connections[rightConnectionID] : null;

        if (!leftConnection || !rightConnection) return graph;

        const leftStripID = updateStripIDForPowerAndGround(leftConnection.metadata.stripID, powerDistribution);
        const rightStripID = updateStripIDForPowerAndGround(rightConnection.metadata.stripID, powerDistribution);

        const edge = createCircuitEdge(
            nodes[leftStripID].id,
            nodes[rightStripID].id,
            createDIPSwitchConnection(DIPSwitchComponent.editorID, i)
        );
        edges[edge.id] = edge;
    }

    return { nodes, edges };
}

/**
 * Processes the connections of an integrated circuit (IC) component within a circuit graph.
 * This function updates the circuit graph by creating edges between input and output connectors
 * of the IC component based on their connections and metadata.
 *
 * @param graph - The current circuit graph containing nodes and edges.
 * @param connections - A record of connection objects, keyed by connection ID.
 * @param powerDistribution - The power distribution object used to update strip IDs for power and ground.
 * @param ICComponent - The IC component being processed, containing its connectors and metadata.
 * @param getConnectorConnection - A function that retrieves the connection ID for a given connector ID.
 * @returns The updated circuit graph with new edges added for the IC component's connections.
 */
export const processICComponentConnections = (
    graph: CircuitGraph,
    connections: Record<string, Connection>,
    powerDistribution: PowerDistribution,
    ICComponent: ICComponent,
    getConnectorConnection: (connectorID: string) => string | null
): CircuitGraph => {
    const gateConnectors: Record<number, {
        inputs: { connector: Connector, node: string }[],
        output: { connector: Connector, node: string } | null
    }> = {};

    const { nodes, edges } = graph;

    Object.values(ICComponent.connectors).forEach(connector => {
        const connectorConnectionID = getConnectorConnection(connector.id)
        if (!connectorConnectionID) return;

        const connection = connections[connectorConnectionID];

        const stripID = updateStripIDForPowerAndGround(connection.metadata.stripID, powerDistribution);
        if (!connector.metadata) return;
        if (connector.metadata.gateIndex === undefined) return;
        
        const gateIndex = Number(connector.metadata.gateIndex);

        if (!gateConnectors[gateIndex]) {
            gateConnectors[gateIndex] = { inputs: [], output: null };
        }

        if (connector.type === 'output') {
            gateConnectors[gateIndex].output = { connector, node: stripID };
        } else if (connector.type === 'input') {
            gateConnectors[gateIndex].inputs.push({ connector, node: stripID });
        }
    });

    Object.entries(gateConnectors).forEach(([gateIndex, gate]) => {
        if (!gate.output) return;

        gate.inputs.forEach(input => {
            const edge = createCircuitEdge(
                input.node,
                gate.output!.node,
                createICComponentConnection(
                    ICComponent.editorID,
                    ICComponent.icType,
                    parseInt(gateIndex),
                    getICDefinition(ICComponent.icType).gateType,
                    'input',
                    Number(input.connector.metadata?.inputIndex)
                )
            );

            edges[edge.id] = edge;
        });
    });

    return { nodes, edges };
}

/**
 * Processes the connections of a two-terminal component within a circuit graph.
 * 
 * This function updates the circuit graph by analyzing the connections of a 
 * two-terminal component, determining the associated strip IDs, and creating 
 * an edge between the corresponding nodes in the graph.
 * 
 * @param graph - The current circuit graph containing nodes and edges.
 * @param connections - A record of connection objects, indexed by connection IDs.
 * @param powerDistribution - The power distribution object used to update strip IDs.
 * @param component - The two-terminal component being processed.
 * @param getConnectorConnection - A function that retrieves the connection ID 
 *                                  for a given connector ID.
 * @returns The updated circuit graph with the new edge added, or the original 
 *          graph if the component does not have exactly two valid connections.
 */
export const processTwoTerminalComponentConnections = (
    graph: CircuitGraph,
    connections: Record<string, Connection>,
    powerDistribution: PowerDistribution,
    component: EditorComponent,
    getConnectorConnection: (connectorID: string) => string | null
): CircuitGraph => {
    const { nodes, edges } = graph;

    const stripIDs: string[] = [];
    Object.values(component.connectors).forEach(connector => {
        const connectorConnectionID = getConnectorConnection(connector.id);
        if (!connectorConnectionID) return;
        const stripID = updateStripIDForPowerAndGround(connections[connectorConnectionID].metadata.stripID, powerDistribution);
        stripIDs.push(stripID);
    });

    if (stripIDs.length !== 2) return graph;

    const edge = createCircuitEdge(
        nodes[stripIDs[0]].id,
        nodes[stripIDs[1]].id,
        createComponentConnection(component.editorID, component.type)
    )
    edges[edge.id] = edge;

    return { nodes, edges };
}