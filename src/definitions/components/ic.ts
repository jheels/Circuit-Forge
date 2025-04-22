import { Connector, ConnectorType, createConnector } from "../connector";
import { EditorComponent, Point } from "../general";
import { v4 as uuidv4 } from "uuid";
import { createDefaultProperties } from "../properties";

export interface ICComponent extends EditorComponent {
    readonly type: 'ic';
    readonly icType: string;
}

interface ICPinDefinition {
    type: ConnectorType
    name: string
    gateIndex?: number
    inputIndex?: number
    // no output index as only 1 output for now
}

interface ICDefinition {
    icType: string,
    description: string,
    gateType: string,
    gateCount: number,
    inputsPerGate: number,
    outputsPerGate: number,
    pinMappings: Record<number, ICPinDefinition>
}

export const createICComponent = (
    position: Point,
    name: string,
    definition: ICDefinition
): ICComponent => {
    const editorID = `IC-${definition.icType}-${uuidv4()}`;
    const dimensions = { width: 15, height: 35 };

    const connectors: Record<string, Connector> = {};

    for (let pinNum = 1; pinNum <= 14; pinNum++) {
        const isLeftSide = pinNum <= 7;
        const pinDefinition = definition.pinMappings[pinNum];

        let yPosition;
        if (isLeftSide) {
            yPosition = (pinNum - 1) / 7 + 1/14;
        } else {
            yPosition = (14 - pinNum) / 7 + 1/14;
        }
        const connector = createConnector(
            editorID,
            pinDefinition.type,
            {
                x: isLeftSide ? 0 : 1,
                y: yPosition
            },
            2.5,
            pinDefinition.name,
            {
                pinNumber: pinNum,
                gateIndex: pinDefinition.gateIndex,
                inputIndex: pinDefinition.inputIndex
            }
        );

        connectors[connector.id] = connector;
    }

    return {
        editorID,
        type: 'ic',
        icType: definition.icType,
        dimensions,
        rotation: 0,
        position,
        properties: createDefaultProperties('ic', name),
        connectors
    }
}

const COMMON_PIN_MAPPINGS: Record<number, ICPinDefinition> = {
    1: { type: 'input', name: 'input 1A', gateIndex: 0, inputIndex: 0 },
    2: { type: 'input', name: 'input 1B', gateIndex: 0, inputIndex: 1 },
    3: { type: 'output', name: 'output 1', gateIndex: 0 },
    4: { type: 'input', name: 'input 2A', gateIndex: 1, inputIndex: 0 },
    5: { type: 'input', name: 'input 2B', gateIndex: 1, inputIndex: 1 },
    6: { type: 'output', name: 'output 2', gateIndex: 1 },
    7: { type: 'negative', name: 'ground' },
    8: { type: 'output', name: 'output 3', gateIndex: 2 },
    9: { type: 'input', name: 'input 3A', gateIndex: 2, inputIndex: 0 },
    10: { type: 'input', name: 'input 3B', gateIndex: 2, inputIndex: 1 },
    11: { type: 'output', name: 'output 4', gateIndex: 3 },
    12: { type: 'input', name: 'input 4A', gateIndex: 3, inputIndex: 0 },
    13: { type: 'input', name: 'input 4B', gateIndex: 3, inputIndex: 1 },
    14: { type: 'positive', name: 'VCC' }
};

const HEX_INVERTER_PIN_MAPPINGS: Record<number, ICPinDefinition> = {
    1: { type: 'input', name: 'input 1', gateIndex: 0, inputIndex: 0 },
    2: { type: 'output', name: 'output 1', gateIndex: 0 },
    3: { type: 'input', name: 'input 2', gateIndex: 1, inputIndex: 0 },
    4: { type: 'output', name: 'output 2', gateIndex: 1 },
    5: { type: 'input', name: 'input 3', gateIndex: 2, inputIndex: 0 },
    6: { type: 'output', name: 'output 3', gateIndex: 2 },
    7: { type: 'negative', name: 'ground' },
    8: { type: 'output', name: 'output 4', gateIndex: 3 },
    9: { type: 'input', name: 'input 4', gateIndex: 3, inputIndex: 0 },
    10: { type: 'output', name: 'output 5', gateIndex: 4 },
    11: { type: 'input', name: 'input 5', gateIndex: 4, inputIndex: 0 },
    12: { type: 'output', name: 'output 6', gateIndex: 5 },
    13: { type: 'input', name: 'input 6', gateIndex: 5, inputIndex: 0 },
    14: { type: 'positive', name: 'VCC' }
};

const NOR_GATE_PIN_MAPPINGS: Record<number, ICPinDefinition> = {
    1: { type: 'output', name: 'output 1', gateIndex: 0 },
    2: { type: 'input', name: 'input 1A', gateIndex: 0, inputIndex: 0 },
    3: { type: 'input', name: 'input 1B', gateIndex: 0, inputIndex: 1 },
    4: { type: 'output', name: 'output 2', gateIndex: 1 },
    5: { type: 'input', name: 'input 2A', gateIndex: 1, inputIndex: 0 },
    6: { type: 'input', name: 'input 2B', gateIndex: 1, inputIndex: 1 },
    7: { type: 'negative', name: 'ground' },
    8: { type: 'input', name: 'input 3A', gateIndex: 2, inputIndex: 0 },
    9: { type: 'input', name: 'input 3B', gateIndex: 2, inputIndex: 1 },
    10: { type: 'output', name: 'output 3', gateIndex: 2 },
    11: { type: 'input', name: 'input 4A', gateIndex: 3, inputIndex: 0 },
    12: { type: 'input', name: 'input 4B', gateIndex: 3, inputIndex: 1 },
    13: { type: 'output', name: 'output 4', gateIndex: 3 },
    14: { type: 'positive', name: 'VCC' }
};


const IC_DEFINITIONS: Record<string, ICDefinition> = {
    '74LS00': {
        icType: '74LS00',
        description: 'Quad 2-Input NAND Gate',
        gateType: 'NAND',
        gateCount: 4,
        inputsPerGate: 2,
        outputsPerGate: 1,
        pinMappings: COMMON_PIN_MAPPINGS
    },
    '74LS02': {
        icType: '74LS02',
        description: 'Quad 2-Input NOR Gate',
        gateType: 'NOR',
        gateCount: 4,
        inputsPerGate: 2,
        outputsPerGate: 1,
        pinMappings: NOR_GATE_PIN_MAPPINGS
    },
    '74LS04': {
        icType: '74LS04',
        description: 'Hex Inverter',
        gateType: 'NOT',
        gateCount: 6,
        inputsPerGate: 1,
        outputsPerGate: 1,
        pinMappings: HEX_INVERTER_PIN_MAPPINGS
    },
    '74LS08': {
        icType: '74LS08',
        description: 'Quad 2-Input AND Gate',
        gateType: 'AND',
        gateCount: 4,
        inputsPerGate: 2,
        outputsPerGate: 1,
        pinMappings: COMMON_PIN_MAPPINGS
    },
    '74LS32': {
        icType: '74LS32',
        description: 'Quad 2-Input OR Gate',
        gateType: 'OR',
        gateCount: 4,
        inputsPerGate: 2,
        outputsPerGate: 1,
        pinMappings: COMMON_PIN_MAPPINGS
    },
    '74LS86': {
        icType: '74LS86',
        description: 'Quad 2-Input XOR Gate',
        gateType: 'XOR',
        gateCount: 4,
        inputsPerGate: 2,
        outputsPerGate: 1,
        pinMappings: COMMON_PIN_MAPPINGS
    }
}

export const getICDefinition = (icType: string): ICDefinition => {
    return IC_DEFINITIONS[icType];
}

export const createQuadNANDGate = (position: Point, name: string): ICComponent => {
    return createICComponent(position, name, getICDefinition('74LS00'));
}

export const createQuadNORGate = (position: Point, name: string): ICComponent => {
    return createICComponent(position, name, getICDefinition('74LS02'));
}

export const createHexInverter = (position: Point, name: string): ICComponent => {
    return createICComponent(position, name, getICDefinition('74LS04'));
}

export const createQuadANDGate = (position: Point, name: string): ICComponent => {
    return createICComponent(position, name, getICDefinition('74LS08'));
}

export const createQuadORGate = (position: Point, name: string): ICComponent => {
    return createICComponent(position, name, getICDefinition('74LS32'));
}

export const createQuadXORGate = (position: Point, name: string): ICComponent => {
    return createICComponent(position, name, getICDefinition('74LS86'));
}