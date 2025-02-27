import { lusolve, matrix, Matrix, zeros } from "mathjs";
import { CircuitEdge, CircuitGraph, CircuitNode } from "../analysis/circuitDetection";
import { EditorComponent } from "@/types/general";
import { applyWireStamp, createWireModel } from "../models/wireModel";
import { applyComponentStamp, createComponentModel } from "../models/componentModelFactory";

interface MNAMatrixSystem {
    conductanceMatrix: Matrix;          // The (n+m)×(n+m) coefficient matrix
    conductanceUnknownVector: Matrix;          // The (n+m)×1 unknown vector (voltages and currents)
    inputSourcesVector: Matrix;          // The (n+m)×1 known vector (source values)
    nodeMap: Record<string, number>;  // Maps node IDs to matrix indices
    nodeCount: number;  // Number of nodes excluding ground (n)
}

const createNodeMap = (nodes: Record<string, CircuitNode>): Record<string, number> => {
    const mapping: Record<string, number> = {};
    let index = 0;

    Object.values(nodes).forEach((node) => {
        if (node.id !== 'unified-ground') {
            mapping[node.id] = index;
            index++;
        }
    });

    return mapping;
}

const initialiseMNASystem = (nodeCount: number): MNAMatrixSystem => {
    const conductanceMatrix = matrix(zeros(nodeCount, nodeCount));
    const conductanceUnknownVector = matrix(zeros(nodeCount, 1));
    const inputSourcesVector = matrix(zeros(nodeCount, 1));

    return {
        conductanceMatrix,
        conductanceUnknownVector,
        inputSourcesVector,
        nodeMap: {},
        nodeCount,
    }
}

export const processEdge = (
    edge: CircuitEdge,
    components: Record<string, EditorComponent>,
    system: MNAMatrixSystem
): void => {
    const { conductanceMatrix, inputSourcesVector, nodeMap } = system;

    if (edge.connection.type === 'wire') {
        const wireModel = createWireModel(edge);
        applyWireStamp(conductanceMatrix, wireModel, nodeMap);
        return;
    }

    const component = components[edge.connection.id];

    if (!component) {
        console.warn(`Component ${edge.connection.id} not found`);
        return;
    }

    const model = createComponentModel(component, edge);
    if (!model) {
        console.warn(`Model for component ${component.type} not found`);
        return;
    }

    applyComponentStamp(model, conductanceMatrix, nodeMap, inputSourcesVector);
}

export const solveCircuit = (graph: CircuitGraph, components: Record<string, EditorComponent>): Record<string, number> => {
    const nodeMapping = createNodeMap(graph.nodes);
    const nodeCount = Object.keys(nodeMapping).length;

    const system = initialiseMNASystem(nodeCount);
    system.nodeMap = nodeMapping;

    Object.values(graph.edges).forEach((edge) => {
        processEdge(edge, components, system);
    });

    const solution = lusolve(system.conductanceMatrix, system.inputSourcesVector);
    system.conductanceUnknownVector = solution;

    const voltages: Record<string, number> = {'unified-ground': 0};
    Object.entries(nodeMapping).forEach(([nodeID, index]) => {
        voltages[nodeID] = solution.get([index, 0]);
    });

    voltages['unified_power_current'] = solution.get([solution.size()[0] - 1, 0]);

    return voltages;
};