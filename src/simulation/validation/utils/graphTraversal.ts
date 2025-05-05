import {  CircuitGraph } from "@/simulation/circuit/circuitDetection";

/**
 * Determines if there is a path consisting only of "wire" connections between two nodes in a circuit graph.
 *
 * @param graph - The circuit graph containing nodes and edges.
 * @param sourceNodeID - The ID of the starting node for the traversal.
 * @param targetNodeID - The ID of the target node to reach.
 * @param excludeEdgeIds - An optional array of edge IDs to exclude from the traversal.
 * @returns `true` if a path consisting only of "wire" connections exists between the source and target nodes, otherwise `false`.
 */
export const hasWireOnlyPath = (
    graph: CircuitGraph,
    sourceNodeID: string,
    targetNodeID: string,
    excludeEdgeIds: string[] = []
): boolean => {
    const dfs = (currentNode: string, visited: Set<string>): boolean => {
        if (currentNode === targetNodeID) {
            return true;
        }

        const newVisited = new Set(visited);
        newVisited.add(currentNode);

        const availableEdges = Object.values(graph.edges).filter(edge => 
            (edge.sourceId === currentNode || edge.targetId === currentNode) &&
            !excludeEdgeIds.includes(edge.id) &&
            !newVisited.has(edge.id) &&
            edge.connection.type === 'wire'
        );

        for (const edge of availableEdges) {
            const nextNode = edge.sourceId === currentNode ? edge.targetId : edge.sourceId;
            if (newVisited.has(nextNode)) continue;
            if (dfs(nextNode, newVisited)) {
                return true;
            }
        }

        return false;
    };

    return dfs(sourceNodeID, new Set<string>());
}
