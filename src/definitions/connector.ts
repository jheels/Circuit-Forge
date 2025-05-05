import { v4 as uuidv4 } from 'uuid';
import { EditorComponent, Point } from './general';
import { isBreadboard } from '@/lib/utils';

export const SNAPPING_THRESHOLD = 2.5;
export const BREAKAWAY_THRESHOLD = 2.5;
export const DEFAULT_HIT_AREA = 2.5;

interface ConnectorOffset {
    x: number;
    y: number;
}

export type ConnectorType =
    | 'input'
    | 'output'
    | 'bidirectional'
    | 'positive'
    | 'negative'
    | 'cathode'
    | 'anode';

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
    isConnected: boolean;
    readonly metadata?: Record<string, object>;
}

/**
 * Creates a connector object with the specified properties.
 *
 * @param componentID - The unique identifier of the component to which the connector belongs.
 * @param type - The type of the connector, defined by the `ConnectorType` enum.
 * @param offset - The offset position of the connector, defined by the `ConnectorOffset` type.
 * @param hitAreaSize - The size of the hit area for the connector. Defaults to `DEFAULT_HIT_AREA` if not provided.
 * @param connectorIDOverride - An optional override for the connector's unique identifier. If not provided, a UUID will be generated.
 * @param metadata - Optional metadata associated with the connector, represented as a record of key-value pairs.
 * @returns A `Connector` object with the specified properties.
 */
export const createConnector = (
    componentID: string,
    type: ConnectorType,
    offset: ConnectorOffset,
    hitAreaSize: number = DEFAULT_HIT_AREA,
    connectorIDOverride?: string,
    metadata?: Record<string, object>
): Connector => ({
    id: componentID + ':' + (connectorIDOverride || uuidv4()),
    componentID,
    type,
    offset,
    hitAreaSize,
    isConnected: false,
    metadata
});

/**
 * Calculates the interaction region for a given connector based on its position,
 * offset, and dimensions of the component it is attached to.
 *
 * @param connector - The connector object containing offset and hit area size.
 * @param componentPosition - The position of the component to which the connector is attached.
 * @param dimensions - The dimensions of the component (width and height).
 * @returns The interaction region of the connector as a `ConnectorRegion` object,
 *          including its position (x, y) and size (width, height).
 */
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

/**
 * Determines whether a given point lies within the interaction region of a connector.
 *
 * @param point - The point to check, represented as an object with `x` and `y` coordinates.
 * @param connector - The connector whose interaction region is being checked.
 * @param componentPosition - The position of the component containing the connector, represented as a point with `x` and `y` coordinates.
 * @param componentDimensions - The dimensions of the component containing the connector, including `width` and `height`.
 * @returns `true` if the point lies within the interaction region of the connector; otherwise, `false`.
 */
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

/**
 * Calculates the position of a connector relative to its associated component.
 *
 * @param connector - The connector for which the position is being calculated.
 * @param componentPosition - The top-left position of the component to which the connector belongs.
 * @param componentDimensions - The dimensions of the component, including its width and height.
 * @returns The position of the connector as a `Point` object, representing the center of the connector's interaction region.
 */
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

/**
 * Validates whether a connection between two connectors is allowed based on their types
 * and the components they belong to.
 *
 * @param connector1 - The first connector to validate.
 * @param connector2 - The second connector to validate.
 * @param components - A record of component IDs to their corresponding `EditorComponent` objects.
 * @returns `true` if the connection is valid according to the connection rules and at least one
 *          of the components is a breadboard; otherwise, `false`.
 */
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

    const isValidConnection = connectionRules[connector1.type].includes(connector2.type);

    const component1 = components[connector1.componentID];
    const component2 = components[connector2.componentID];

    const HasBreadboardConnection = isBreadboard(component1) || isBreadboard(component2);

    return isValidConnection && HasBreadboardConnection;
}