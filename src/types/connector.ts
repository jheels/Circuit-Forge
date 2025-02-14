/**
 * TODO:
 * - Verify the connection rules
 * - Check cathodes
 * - remove componentID since its already in the ID 
 * - move connection validation to the connection.ts file
 */
import { v4 as uuidv4 } from 'uuid';
import { EditorComponent, Point } from './general';
import { isBreadboard } from '@/lib/utils';

export const SNAPPING_THRESHOLD = 2.5;
export const BREAKAWAY_THRESHOLD = 2.5;

interface ConnectorOffset {
    x: number;
    y: number;
}

export type ConnectorType = 'input' | 'output' | 'bidirectional' | 'positive' | 'negative' | 'cathode' | 'anode';

export interface ConnectorRegion {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Connector {
    readonly id: string;
    readonly componentID: string;
    readonly type: ConnectorType;
    readonly hitAreaSize: number;
    offset: ConnectorOffset;
}

export const createConnector = (
    componentID: string,
    type: ConnectorType,
    offset: ConnectorOffset,
    hitAreaSize: number = 2.5
): Connector => ({
    id: componentID + ':' + uuidv4(),
    componentID,
    type,
    offset,
    hitAreaSize
});

export const getInteractionRegion = (
    connector: Connector,
    componentPosition: Point,
    dimensions: { width: number; height: number },
): ConnectorRegion => {
    const x = componentPosition.x + (connector.offset.x * dimensions.width);
    const y = componentPosition.y + (connector.offset.y * dimensions.height);

    return {
        x: x - connector.hitAreaSize / 2,
        y: y - connector.hitAreaSize / 2,
        width: connector.hitAreaSize,
        height: connector.hitAreaSize
    };
};

export const isPointInConnector = (
    point: Point,
    connector: Connector,
    componentPosition: Point,
    componentDimensions: { width: number; height: number }
): boolean => {
    const region = getInteractionRegion(connector, componentPosition, componentDimensions);
    return point.x >= region.x &&
        point.x <= region.x + region.width &&
        point.y >= region.y &&
        point.y <= region.y + region.height;
};

export const getConnectorPosition = (
    connector: Connector,
    componentPosition: Point,
    componentDimensions: { width: number; height: number }
): Point => {
    const region = getInteractionRegion(connector, componentPosition, componentDimensions);
    return {
        x: region.x + region.width / 2,
        y: region.y + region.height / 2
    };
};

export const validateConnection = (connector1: Connector, connector2: Connector, components: Record<string, EditorComponent>): boolean => {
    const connectionRules: Record<ConnectorType, ConnectorType[]> = {
        'input': ['output', 'bidirectional'],
        'output': ['input', 'bidirectional'],
        'bidirectional': ['bidirectional', 'positive', 'negative', 'cathode', 'anode', 'input', 'output'], // for now they can connect to anything
        'positive': ['positive', 'anode', 'bidirectional'], // possibly has more but need to check
        'negative': ['negative', 'cathode', 'bidirectional'], // possibly has more but need to check
        'cathode': ['negative', 'bidirectional', 'anode'], // possibly has more but need to check
        'anode': ['positive', 'bidirectional', 'cathode'], // possibly has more but need to check
    }

    const isValidConnection =  connectionRules[connector1.type].includes(connector2.type);

    const component1 = components[connector1.componentID];
    const component2 = components[connector2.componentID];

    const HasBreadboardConnection = isBreadboard(component1) || isBreadboard(component2);

    return isValidConnection && HasBreadboardConnection;
}