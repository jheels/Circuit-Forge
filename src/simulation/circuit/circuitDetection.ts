
import { PowerDistribution } from '@/hooks/simulation/useFindPowerDistribution';
import { v4 as uuidv4 } from 'uuid';
import { PowerSupplyComponent } from '@/definitions/components/powerSupply';
import { Connection, isWireConnection } from '@/definitions/connection';
import { BreadboardComponent } from '@/definitions/components/breadboard';
import { EditorComponent } from '@/definitions/general';
import { DIPSwitchComponent } from '@/definitions/components/dipswitch';
import { processDIPSwitchConnections, processTwoTerminalComponentConnections, processICComponentConnections, processWireConnections } from './circuitProcessing';
import { ICComponent } from '@/definitions/components/ic';

export type NodeType = 'power' | 'ground' | 'regular';

interface DIPSwitchMetadata {
    componentType: 'dip-switch';
    switchIndex: number;
}

export interface ICComponentMetadata {
    componentType: 'ic';
    icType: string;
    gateIndex: number;
    gateType: string;
    pinFunction: string;
    inputIndex?: number;
}

interface GeneralComponentMetadata {
    componentType: string;
}

export interface CircuitConnection {
    type: 'wire' | 'component';
    id: string;
    metadata?: DIPSwitchMetadata | ICComponentMetadata | GeneralComponentMetadata;
}
// Factory functions to create connections
export const createComponentConnection = (
    componentId: string,
    componentType: string,
    metadata?: Record<string, DIPSwitchMetadata | ICComponentMetadata | GeneralComponentMetadata>,
): CircuitConnection => {
    return {
        type: 'component',
        id: componentId,
        metadata: {
            componentType,
            ...metadata
        } as GeneralComponentMetadata
    }
}

export const createDIPSwitchConnection = (
    componentId: string,
    switchIndex: number
): CircuitConnection => {
    return {
        type: 'component',
        id: componentId,
        metadata: {
            componentType: 'dip-switch',
            switchIndex
        } as DIPSwitchMetadata
    }
}

export const createICComponentConnection = (
    componentId: string,
    icType: string,
    gateIndex: number,
    gateType: string,
    pinFunction: string,
    inputIndex?: number
): CircuitConnection => {
    return {
        type: 'component',
        id: componentId,
        metadata: {
            componentType: 'ic',
            icType,
            gateIndex,
            gateType,
            pinFunction,
            inputIndex
        } as ICComponentMetadata
    }
}

export const createWireConnection = (
    wireId: string
): CircuitConnection => {
    return {
        type: 'wire',
        id: wireId,
    }
}
// Type guards
export const isDIPSwitchConnection = (
    connection: CircuitConnection
): connection is CircuitConnection & { metadata: DIPSwitchMetadata } => {
    return connection.type === 'component' &&
        connection.metadata?.componentType === 'dip-switch';
};

export const isICComponentConnection = (
    connection: CircuitConnection
): connection is CircuitConnection & { metadata: ICComponentMetadata } => {
    return connection.type === 'component' &&
        connection.metadata?.componentType === 'ic';
};

export const getComponentType = (
    connection: CircuitConnection
): string | undefined => {
    return connection.type === 'component' ? connection.metadata?.componentType : undefined;
};

export const getSwitchIndex = (
    connection: CircuitConnection
): number | undefined => {
    return isDIPSwitchConnection(connection) ? connection.metadata.switchIndex : undefined;
};

export interface CircuitNode {
    id: string;
    type: NodeType;
    voltage?: number;
}

export interface CircuitEdge {
    id: string;
    sourceId: string;
    targetId: string;
    connection: CircuitConnection;
}

export interface CircuitGraph {
    nodes: Record<string, CircuitNode>;
    edges: Record<string, CircuitEdge>;
}

export const createCircuitNode = (
    type: NodeType,
    stripId: string
): CircuitNode => {
    return {
        id: stripId,
        type,
    }
}

export const createCircuitEdge = (
    sourceId: string,
    targetId: string,
    connection: CircuitConnection
): CircuitEdge => {
    return {
        id: 'edge-' + sourceId + '-' + targetId + '-' + uuidv4(),
        sourceId,
        targetId,
        connection
    }
}

export const initialiseCircuitGraph = (): CircuitGraph => {
    const nodes: Record<string, CircuitNode> = {};
    const edges: Record<string, CircuitEdge> = {};

    return { nodes, edges };
}

/**
 * Initialises the power distribution in a circuit by adding power and ground nodes
 * and connecting them with an edge representing the power supply component.
 *
 * @param powerDistribution - An object containing the identifiers for the power and ground nodes.
 * @param powerSupply - The power supply component to be connected between the power and ground nodes.
 * @param graph - The circuit graph containing nodes and edges to be updated.
 * @returns The updated circuit graph with the power and ground nodes and their connecting edge.
 */
export const initialisePowerDistribution = (
    powerDistribution: PowerDistribution,
    powerSupply: PowerSupplyComponent,
    graph: CircuitGraph,
): CircuitGraph => {
    const { nodes, edges } = graph;
    const { powerNode, groundNode } = powerDistribution;

    nodes[powerNode] = createCircuitNode('power', powerNode);
    nodes[groundNode] = createCircuitNode('ground', groundNode);

    const edge = createCircuitEdge(powerNode, groundNode, createComponentConnection(powerSupply.editorID, powerSupply.type));
    edges[edge.id] = edge;

    return { nodes, edges };
}

/**
 * Initialises active regular strips in the circuit graph by identifying strips
 * with connections and adding them as nodes to the graph if they do not already exist.
 *
 * @param graph - The current circuit graph containing nodes and edges.
 * @param connections - A record of connections in the circuit, where each connection
 * maps to its metadata and properties.
 * @param breadboard - The breadboard component containing strip mapping information.
 * 
 * @returns The updated circuit graph with added nodes for active regular strips.
 */
export const initialiseActiveRegularStrips = (
    graph: CircuitGraph,
    connections: Record<string, Connection>,
    breadboard: BreadboardComponent,
): CircuitGraph => {
    const { nodes, edges } = graph;
    const stripsWithConnections = new Set<string>();

    Object.values(connections).forEach(connection => {
        if (isWireConnection(connection) && connection.metadata.targetStripID) {
            stripsWithConnections.add(connection.metadata.targetStripID);
        }
        const stripID = connection.metadata.stripID;
        if (breadboard.stripMapping.strips[stripID].type !== 'bidirectional') return;
        stripsWithConnections.add(stripID);
    })

    stripsWithConnections.forEach(stripId => {
        if (!nodes[stripId]) {
            const node = createCircuitNode('regular', stripId);
            nodes[node.id] = node;
        }
    });

    return { nodes, edges };
}

/**
 * Creates edges in the circuit graph based on the provided connections and components.
 *
 * @param graph - The initial circuit graph to be updated with new edges.
 * @param connections - A record of connection objects, where each key is a connection ID.
 * @param components - A record of editor components, where each key is a component ID.
 * @param powerDistribution - The power distribution object used to manage power flow in the circuit.
 * @param getConnectorConnection - A function that retrieves the connection ID for a given connector ID.
 * @returns The updated circuit graph with edges created based on the connections and components.
 */
export const createEdgesFromConnections = (
    graph: CircuitGraph,
    connections: Record<string, Connection>,
    components: Record<string, EditorComponent>,
    powerDistribution: PowerDistribution,
    getConnectorConnection: (connectorID: string) => string | null,
): CircuitGraph => {
    graph = processWireConnections(graph, connections, powerDistribution);
    Object.values(components).forEach(component => {
        if (component.type === 'power-supply' || component.type === 'breadboard') return;
        if (component.type === 'dip-switch') {
            graph = processDIPSwitchConnections(graph, connections, powerDistribution, component as DIPSwitchComponent, getConnectorConnection);
        } else if (component.type === 'ic') {
            graph = processICComponentConnections(graph, connections, powerDistribution, component as ICComponent, getConnectorConnection);
        } else {
            graph = processTwoTerminalComponentConnections(graph, connections, powerDistribution, component, getConnectorConnection);
        }
    });

    return graph;
}

/**
 * Finds the connected subgraph of a circuit starting from a specific node.
 * This function performs a depth-first search (DFS) to traverse the graph
 * and collect all nodes and edges that are connected to the starting node.
 *
 * @param graph - The circuit graph containing nodes and edges.
 * @returns A subgraph containing the connected nodes and edges.
 *
 * The returned subgraph includes:
 * - `nodes`: A record of node IDs to their corresponding `CircuitNode` objects.
 * - `edges`: A record of edge IDs to their corresponding `CircuitEdge` objects.
 *
 * The traversal starts from a node with the ID `'unified-power'`.
 * Nodes and edges that are already visited are skipped to prevent infinite loops.
 */
export const findConnectedCircuit = (
    graph: CircuitGraph,
): CircuitGraph => {
    const visitedNodes = new Set<string>();
    const visitedEdges = new Set<string>();

    const connectedNodes: Record<string, CircuitNode> = {};
    const resultEdges: Record<string, CircuitEdge> = {};

    const dfs = (nodeId: string) => {

        if (visitedNodes.has(nodeId)) return;

        visitedNodes.add(nodeId);
        if (!graph.nodes[nodeId]) return;
        connectedNodes[nodeId] = graph.nodes[nodeId];

        const connectedEdges = Object.values(graph.edges).filter(edge => {
            return edge.sourceId === nodeId || edge.targetId === nodeId;
        });

        connectedEdges.forEach(edge => {
            if (visitedEdges.has(edge.id)) return;

            visitedEdges.add(edge.id);
            resultEdges[edge.id] = edge;

            const nextNode = edge.sourceId === nodeId ? edge.targetId : edge.sourceId;
            dfs(nextNode);
        });
    };

    dfs('unified-power');

    return { nodes: connectedNodes, edges: resultEdges };
};

/**
 * Removes disconnected paths from a circuit graph, retaining only the paths
 * that connect the power node to the ground node.
 *
 * This function performs a depth-first search (DFS) to identify all valid paths
 * in the circuit graph that connect the power node to the ground node. It then
 * constructs a new subgraph containing only the nodes and edges that belong to
 * these valid paths.
 *
 * @param graph - The circuit graph to process, containing nodes and edges.
 * @param powerDistribution - An object specifying the power node and ground node
 *                            in the circuit graph.
 * @returns A new `CircuitGraph` object containing only the nodes and edges
 *          that are part of valid paths connecting the power node to the ground node.
 */
export const removeDisconnectedPaths = (
    graph: CircuitGraph,
    powerDistribution: PowerDistribution
): CircuitGraph => {
    const { nodes, edges } = graph;
    const { powerNode, groundNode } = powerDistribution;

    const validNodes = new Set<string>([powerNode, groundNode]);
    const validEdges = new Set<string>();

    const explorePath = (
        currentNode: string,
        currentPath: { nodes: string[], edges: string[] },
        visited: Set<string>
    ): boolean => {
        if (currentNode === groundNode) {
            currentPath.nodes.forEach((node) => validNodes.add(node));
            currentPath.edges.forEach((edge) => validEdges.add(edge));
            return true;
        }

        const newVisited = new Set(visited);
        newVisited.add(currentNode);

        let foundValidPath = false;

        const availableEdges = Object.values(edges).filter((edge) =>
            (edge.sourceId === currentNode || edge.targetId === currentNode) &&
            !currentPath.edges.includes(edge.id)
        );

        for (const edge of availableEdges) {
            const nextNode = edge.sourceId === currentNode ? edge.targetId : edge.sourceId;

            // If nextNode has already been visited in this branch, skip to avoid a cycle.
            if (newVisited.has(nextNode)) continue;

            currentPath.edges.push(edge.id);
            currentPath.nodes.push(nextNode);

            // Recursively explore from the next node, using a fresh visited set (copied from newVisited).
            if (explorePath(nextNode, currentPath, newVisited)) {
                foundValidPath = true;
            }

            // Backtrack: remove the last node and edge from the path.
            currentPath.nodes.pop();
            currentPath.edges.pop();
        }

        return foundValidPath;
    };

    // Start DFS from the power node with an initially empty visited set.
    explorePath(powerNode, { nodes: [powerNode], edges: [] }, new Set());

    // Build the new subgraph consisting only of valid nodes and edges.
    const resultNodes: Record<string, CircuitNode> = {};
    const resultEdges: Record<string, CircuitEdge> = {};

    validNodes.forEach((nodeId) => {
        resultNodes[nodeId] = nodes[nodeId];
    });

    validEdges.forEach((edgeId) => {
        resultEdges[edgeId] = edges[edgeId];
    });

    return {
        nodes: resultNodes,
        edges: resultEdges,
    };
};
