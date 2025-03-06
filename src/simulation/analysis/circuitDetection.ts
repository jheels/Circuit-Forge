
import { PowerDistribution } from '@/hooks/simulation/useFindPowerDistribution';
import { v4 as uuidv4 } from 'uuid';
import { PowerSupplyComponent } from '@/types/components/powerSupply';
import { Connection, isWireConnection } from '@/types/connection';
import { BreadboardComponent } from '@/types/components/breadboard';
import { EditorComponent } from '@/types/general';
import { DIPSwitchComponent } from '@/types/components/dipswitch';
import { processDIPSwitchConnections, processTwoTerminalComponentConnections, processICComponentConnections, processWireConnections } from './circuitProcessing';
import { ICComponent } from '@/types/components/ic';

export type NodeType = 'power' | 'ground' | 'regular';

interface DIPSwitchMetadata {
    componentType: 'dip-switch';
    switchIndex: number;
}

interface ICComponentMetadata {
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

export const createComponentConnection = (
    componentId: string,
    componentType: string,
    metadata?: Record<string, any>
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

export const createEdgesFromConnections = (
    graph: CircuitGraph,
    connections: Record<string, Connection>,
    components: Record<string, EditorComponent>,
    powerDistribution: PowerDistribution,
    getConnectorConnections: (connectorID: string) => Set<string>,
): CircuitGraph => {
    graph = processWireConnections(graph, connections, powerDistribution);

    // TODO: refactor since only one connection per connector so unnecessary loops.
    Object.values(components).forEach(component => {
        if (component.type === 'power-supply' || component.type === 'breadboard') return;
        // TODO: refactor to use functions for each component type.
        if (component.type === 'dip-switch') {
            graph = processDIPSwitchConnections(graph, connections, powerDistribution, component as DIPSwitchComponent, getConnectorConnections);
        } else if (component.type === 'ic') {
            console.log('processing ic connections');
            graph = processICComponentConnections(graph, connections, powerDistribution, component as ICComponent, getConnectorConnections);
        } else {
            graph = processTwoTerminalComponentConnections(graph, connections, powerDistribution, component, getConnectorConnections);
        }
    });

    return graph;
}

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

export const removeDisconnectedPaths = (
    graph: CircuitGraph,
    powerDistribution: PowerDistribution
): CircuitGraph => {
    const { nodes, edges } = graph;
    const { powerNode, groundNode } = powerDistribution;

    // Sets to track valid nodes and edges that belong to any complete path.
    const validNodes = new Set<string>([powerNode, groundNode]);
    const validEdges = new Set<string>();

    // This DFS function now receives its own visited set for the current branch.
    const explorePath = (
        currentNode: string,
        currentPath: { nodes: string[], edges: string[] },
        visited: Set<string>
    ): boolean => {
        // If we reached the ground, mark the path as valid.
        if (currentNode === groundNode) {
            currentPath.nodes.forEach((node) => validNodes.add(node));
            currentPath.edges.forEach((edge) => validEdges.add(edge));
            return true;
        }

        // Mark the current node as visited in this branch.
        const newVisited = new Set(visited);
        newVisited.add(currentNode);

        let foundValidPath = false;

        // Find all adjacent edges from the current node that are not already in the current path.
        const availableEdges = Object.values(edges).filter((edge) =>
            (edge.sourceId === currentNode || edge.targetId === currentNode) &&
            !currentPath.edges.includes(edge.id)
        );

        // Try each available edge.
        for (const edge of availableEdges) {
            const nextNode = edge.sourceId === currentNode ? edge.targetId : edge.sourceId;

            // If nextNode has already been visited in this branch, skip to avoid a cycle.
            if (newVisited.has(nextNode)) continue;

            // Add this edge and next node to the current path.
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
