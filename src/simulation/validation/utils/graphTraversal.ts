import {  CircuitGraph } from "@/simulation/analysis/circuitDetection";

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
            edge.connections.every(conn => conn.type === 'wire')
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
