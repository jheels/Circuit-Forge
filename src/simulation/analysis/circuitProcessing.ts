import { Connection, isWireConnection } from "@/types/connection";
import { CircuitGraph, createCircuitEdge, createComponentConnection, createDIPSwitchConnection, createICComponentConnection, createWireConnection } from "./circuitDetection";
import { PowerDistribution } from "@/hooks/simulation/useFindPowerDistribution";
import { DIPSwitchComponent } from "@/types/components/dipswitch";
import { EditorComponent } from "@/types/general";
import { getICDefinition, ICComponent } from "@/types/components/ic";
import { Connector } from "@/types/connector";

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
    getConnectorConnection: (connectorID: string) => string
): CircuitGraph => {
    const { nodes, edges } = graph;
    const connectorArray = Object.values(DIPSwitchComponent.connectors);

    if (connectorArray.length !== 16) return graph;

    for (let i = 0; i < 8; i++) {
        const leftConnector = connectorArray[i * 2];
        const rightConnector = connectorArray[i * 2 + 1];
        const leftConnection = connections[getConnectorConnection(leftConnector.id)];
        const rightConnection = connections[getConnectorConnection(rightConnector.id)];

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

export const processICComponentConnections = (
    graph: CircuitGraph,
    connections: Record<string, Connection>,
    powerDistribution: PowerDistribution,
    ICComponent: ICComponent,
    getConnectorConnection: (connectorID: string) => string
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

        const gateIndex = connector.metadata.gateIndex;

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
                    input.connector.metadata?.inputIndex
                )
            );

            edges[edge.id] = edge;
        });
    });

    return { nodes, edges };
}

export const processTwoTerminalComponentConnections = (
    graph: CircuitGraph,
    connections: Record<string, Connection>,
    powerDistribution: PowerDistribution,
    component: EditorComponent,
    getConnectorConnection: (connectorID: string) => string
): CircuitGraph => {
    const { nodes, edges } = graph;

    const stripIDs: string[] = [];
    Object.values(component.connectors).forEach(connector => {
        const connectorConnectionID = getConnectorConnection(connector.id);
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