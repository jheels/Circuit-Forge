import { v4 as uuidv4 } from 'uuid';
import { Connector, validateConnection } from './connector';
import { EditorComponent } from './general';
import { isBreadboard } from '@/lib/utils';
import { BreadboardComponent, getStripID } from './components/breadboard';

type ConnectionType = 'wire' | 'strip';

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

export const isWireConnection = (connection: Connection): connection is Connection & { metadata: WireConnectionMetadata } => {
    return connection.type === 'wire';
}

export const isStripToStripConnection = (connection: Connection): boolean => {
    return connection.type === 'strip' && connection.metadata.targetStripID !== undefined;
}

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
        console.log('firing');
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
