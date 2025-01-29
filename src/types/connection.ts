
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