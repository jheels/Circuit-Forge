
import { PowerDistribution } from '@/hooks/simulation/useFindPowerDistribution';
import { v4 as uuidv4 } from 'uuid';
import { PowerSupplyComponent } from './components/powerSupply';
import { Connection, isWireConnection } from './connection';
import { BreadboardComponent } from './components/breadboard';
import { EditorComponent } from './general';

export type NodeType = 'power' | 'ground' | 'regular';

export interface CircuitConnection {
    type: 'wire' | 'component';
    id: string;
}

export interface CircuitNode {
    id: string;
    type: NodeType;
    voltage?: number;
}

export interface CircuitEdge {
    id: string;
    sourceId: string;
    targetId: string;
    connections: CircuitConnection[];
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
    connections: CircuitConnection[] = []

): CircuitEdge => {
    return {
        id: 'edge-' + sourceId + '-' + targetId + '-' + uuidv4(),
        sourceId,
        targetId,
        connections
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

    const edge = createCircuitEdge(powerNode, groundNode, [{ type: 'component', id: powerSupply.editorID }]);
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
    const { nodes, edges } = graph;
    const { powerNode, groundNode, poweredRails, groundedRails } = powerDistribution;

    const processedConnections = new Set<string>();

    Object.values(connections).forEach(connection => {
        if (isWireConnection(connection) && connection.metadata.targetStripID && !processedConnections.has(connection.id)) {
            let sourceId = connection.metadata.stripID;
            let targetId = connection.metadata.targetStripID;

            if (poweredRails.has(sourceId)) {
                sourceId = powerNode;
            } else if (groundedRails.has(sourceId)) {
                sourceId = groundNode;
            }

            if (poweredRails.has(targetId)) {
                targetId = powerNode;
            } else if (groundedRails.has(targetId)) {
                targetId = groundNode;
            }

            if (!nodes[sourceId] || !nodes[targetId]) return;
            const edge = createCircuitEdge(
                sourceId,
                targetId,
                [{ type: 'wire', id: connection.id }]
            );
            edges[edge.id] = edge;
            processedConnections.add(connection.id);
        }
    });

    // TODO: refactor since only one connection per connector so unnecessary loops.
    Object.values(components).forEach(component => {
        if (component.type === 'power-supply' || component.type === 'breadboard') return;
        const stripIDs: string[] = [];
        Object.values(component.connectors).forEach(connector => {
            const connectorConnections = getConnectorConnections(connector.id);
            connectorConnections.forEach(connection => {
                let stripID = connections[connection].metadata.stripID;

                if (poweredRails.has(stripID)) {
                    stripID = powerNode;
                } else if (groundedRails.has(stripID)) {
                    stripID = groundNode;
                }

                stripIDs.push(stripID);
            });
        });
        if (stripIDs.length !== 2) return;

        const edge = createCircuitEdge(
            nodes[stripIDs[0]].id,
            nodes[stripIDs[1]].id,
            [{ type: 'component', id: component.editorID }]
        )
        edges[edge.id] = edge;
    });

    return { nodes, edges };
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

export const weedOutUnconnectedPaths = (
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
