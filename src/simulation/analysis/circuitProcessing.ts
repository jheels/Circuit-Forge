import { Connection, isWireConnection } from "@/types/connection";
import { CircuitGraph, createCircuitEdge, createComponentConnection, createDIPSwitchConnection, createWireConnection } from "./circuitDetection";
import { PowerDistribution } from "@/hooks/simulation/useFindPowerDistribution";
import { DIPSwitchComponent } from "@/types/components/dipswitch";
import { EditorComponent } from "@/types/general";

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

export const processDIPSwitchConnections = (
    graph: CircuitGraph,
    connections: Record<string, Connection>,
    powerDistribution: PowerDistribution,
    DIPSwitchComponent: DIPSwitchComponent,
    getConnectorConnections: (connectorID: string) => Set<string>
): CircuitGraph => {
    const { nodes, edges } = graph;
    const connectorArray = Object.values(DIPSwitchComponent.connectors);

    if (connectorArray.length !== 16) return graph;

    for (let i = 0; i < 8; i++) {
        const leftConnector = connectorArray[i * 2];
        const rightConnector = connectorArray[i * 2 + 1];
        const leftConnection = connections[Array.from(getConnectorConnections(leftConnector.id))[0]];
        const rightConnection = connections[Array.from(getConnectorConnections(rightConnector.id))[0]];

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

export const processTwoTerminalComponents = (
    graph: CircuitGraph,
    connections: Record<string, Connection>,
    powerDistribution: PowerDistribution,
    component: EditorComponent,
    getConnectorConnections: (connectorID: string) => Set<string>
): CircuitGraph => {
    const { nodes, edges } = graph;

    const stripIDs: string[] = [];
    Object.values(component.connectors).forEach(connector => {
        const connectorConnections = getConnectorConnections(connector.id);
        connectorConnections.forEach(connection => {
            const stripID = updateStripIDForPowerAndGround(connections[connection].metadata.stripID, powerDistribution);
            stripIDs.push(stripID);
        });
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