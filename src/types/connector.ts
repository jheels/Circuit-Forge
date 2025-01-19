import { v4 as uuidv4 } from 'uuid';
import { Point } from './general';

export const SNAPPING_THRESHOLD = 5;
export const BREAKAWAY_THRESHOLD = 20;

interface ConnectorOffset {
    x: number; // normalised offset between 0 and 1 relative to the components dimensions
    y: number;
}

export type ConnectorType = 'input' | 'output' | 'bidirectional' | 'ground' | 'power';

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

    offset: ConnectorOffset;
    
    isConnected: boolean;
    isHovered: boolean;
    connectedTo?: string;
    getInteractionRegion: (componentPosition: Point, dimensions: { width: number; height: number }) => ConnectorRegion;
}

export const createConnector = (
    componentID: string,
    type: ConnectorType,
    offset: ConnectorOffset,
    hitAreaSize: number = 5
): Connector => ({
    id: uuidv4(),
    componentID,
    type,
    offset,
    isConnected: false,
    isHovered: false,
    getInteractionRegion: (position: Point, dimensions: { width: number; height: number }): ConnectorRegion => {
        const x = position.x + (offset.x * dimensions.width);
        const y = position.y + (offset.y * dimensions.height);
        
        return {
            x: x - hitAreaSize / 2,
            y: y - hitAreaSize / 2,
            width: hitAreaSize,
            height: hitAreaSize
        };
    }
});

export const isPointInConnector = (
    point: Point,
    connector: Connector,
    componentPosition: Point,
    componentDimensions: { width: number; height: number }
): boolean => {
    const region = connector.getInteractionRegion(componentPosition, componentDimensions);
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
    const region = connector.getInteractionRegion(componentPosition, componentDimensions);
    return {
        x: region.x + region.width / 2,
        y: region.y + region.height / 2
    };
};
