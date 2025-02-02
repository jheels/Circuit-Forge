import { v4 as uuidv4 } from 'uuid';
import { Connector } from './connector';

type ConnectionType = 'wire' | 'direct' | 'strip';

interface ConnectionMetadata {
    wireID?: string;
    stripID?: string;
    resistance?: number;
    isValid?: boolean;
}

export interface Connection {
    id: string;
    sourceConnectorID: string;
    targetConnectorID: string;

    type: ConnectionType;
    metadata: ConnectionMetadata;
}

// helper functions

export const createDirectConnection = (sourceConnector: Connector, targetConnector: Connector): Connection => {
    return {
        id: `connection-${uuidv4()}`,
        sourceConnectorID: sourceConnector.id,
        targetConnectorID: targetConnector.id,
        type: 'direct',
        metadata: {},
    };
};

export const createWireConnection = (sourceConnector: Connector, targetConnector: Connector, wireID: string): Connection => {
    return {
        id: `connection-${uuidv4()}`,
        sourceConnectorID: sourceConnector.id,
        targetConnectorID: targetConnector.id,
        type: 'wire',
        metadata: {
            wireID,
        },
    };
}

export const createStripConnection = (sourceConnector: Connector, targetConnector: Connector, stripID: string): Connection => {
    return {
        id: `connection-${uuidv4()}`,
        sourceConnectorID: sourceConnector.id,
        targetConnectorID: targetConnector.id,
        type: 'strip',
        metadata: {
            stripID,
        },
    };
}