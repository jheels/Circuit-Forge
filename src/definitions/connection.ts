import { v4 as uuidv4 } from 'uuid';
import { Connector, validateConnection } from './connector';
import { EditorComponent } from './general';
import { isBreadboard } from '@/lib/utils';
import { BreadboardComponent, getStripID } from './components/breadboard';

type ConnectionType = 'wire' | 'strip';

// target ID is optional if its a wire connection
interface BaseConnectionMetadata {
    stripID: string;
    targetStripID?: string;
}

export type StripConnectionMetadata = BaseConnectionMetadata

export interface WireConnectionMetadata extends BaseConnectionMetadata {
    wireID: string;
}

export type ConnectionMetadata = StripConnectionMetadata | WireConnectionMetadata;

export interface Connection {
    id: string;
    sourceConnector: Connector;
    targetConnector: Connector;
    type: ConnectionType;
    metadata: ConnectionMetadata;
}

export const getNonBreadboardComponent = (connection: Connection, components: Record<string, EditorComponent>): EditorComponent => {
    const sourceComponent = components[connection.sourceConnector.componentID];
    const targetComponent = components[connection.targetConnector.componentID];

    return isBreadboard(sourceComponent) ? targetComponent : sourceComponent;
}

// Type guards
export const isWireConnection = (connection: Connection): connection is Connection & { metadata: WireConnectionMetadata } => {
    return connection.type === 'wire';
}

export const isStripToStripConnection = (connection: Connection): boolean => {
    return connection.type === 'strip' && connection.metadata.targetStripID !== undefined;
}


/**
 * Creates a wire connection between two connectors.
 *
 * @param sourceConnector - The connector where the wire originates.
 * @param targetConnector - The connector where the wire terminates.
 * @param wireID - A unique identifier for the wire.
 * @param stripID - The identifier for the strip associated with the source connector.
 * @param targetStripID - (Optional) The identifier for the strip associated with the target connector.
 * @returns A `Connection` object representing the wire connection.
 */
const createWireConnection = (sourceConnector: Connector, targetConnector: Connector, wireID: string, stripID: string, targetStripID?: string): Connection => {
    return {
        id: `connection-${uuidv4()}`,
        sourceConnector: sourceConnector,
        targetConnector: targetConnector,
        type: 'wire',
        metadata: {
            wireID,
            stripID,
            targetStripID,
        },
    };
}

/**
 * Creates a new strip connection object linking a source connector to a target connector.
 *
 * @param sourceConnector - The connector object representing the source of the connection.
 * @param targetConnector - The connector object representing the target of the connection.
 * @param stripID - A unique identifier for the strip associated with this connection.
 * @returns A `Connection` object representing the strip connection.
 */
const createStripConnection = (sourceConnector: Connector, targetConnector: Connector, stripID: string): Connection => {
    return {
        id: `connection-${uuidv4()}`,
        sourceConnector: sourceConnector,
        targetConnector: targetConnector,
        type: 'strip',
        metadata: {
            stripID,
        },
    };
}

/**
 * Creates an appropriate connection between two connectors, either as a strip connection
 * or a wire connection, depending on the context of the components involved.
 *
 * @param sourceConnector - The connector from which the connection originates.
 * @param targetConnector - The connector to which the connection is made.
 * @param components - A record of all editor components, indexed by their IDs.
 * @param wireID - (Optional) The ID of the wire to be used for the connection.
 * 
 * @returns A `Connection` object representing the created connection.
 * 
 * @throws {Error} If the connection is invalid or if required strip IDs are null.
 */
export const createAppropriateConnection = (
    sourceConnector: Connector,
    targetConnector: Connector,
    components: Record<string, EditorComponent>,
    wireID?: string,
): Connection => {
    if (!validateConnection(sourceConnector, targetConnector, components)) {
        throw new Error('Invalid connection');
    }

    const sourceComponent = components[sourceConnector.componentID];
    const targetComponent = components[targetConnector.componentID];
    const isSourceComponentBreadboard = isBreadboard(sourceComponent);
    const isTargetComponentBreadboard = isBreadboard(targetComponent);
    const breadboardComponent = isSourceComponentBreadboard ? sourceComponent : targetComponent;
    const breadboardConnector = isSourceComponentBreadboard ? sourceConnector : targetConnector;

    const stripID = getStripID(breadboardComponent as BreadboardComponent, breadboardConnector);
    if (!stripID) throw new Error('Strip ID cannot be null');

    if (!wireID) {
        return createStripConnection(sourceConnector, targetConnector, stripID);
    }

    if (isSourceComponentBreadboard && isTargetComponentBreadboard) {
        const sourceStripID = getStripID(sourceComponent as BreadboardComponent, sourceConnector);
        const targetStripID = getStripID(targetComponent as BreadboardComponent, targetConnector);

        if (!sourceStripID || !targetStripID) throw new Error('Strip IDs cannot be null');

        return createWireConnection(sourceConnector, targetConnector, wireID, sourceStripID, targetStripID);
    }

    return createWireConnection(sourceConnector, targetConnector, wireID, stripID);
}
