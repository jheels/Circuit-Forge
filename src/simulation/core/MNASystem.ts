import { lusolve, matrix, Matrix, zeros } from "mathjs";
import { CircuitGraph, CircuitNode } from "../circuit/circuitDetection";
import { applyComponentStamp, ComponentModel } from "../models/componentModelFactory";

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

export const solveCircuit = (graph: CircuitGraph,  models: Record<string, ComponentModel>): Record<string, number> => {
    const nodeMapping = createNodeMap(graph.nodes);
    const nodeCount = Object.keys(nodeMapping).length;

    const system = initialiseMNASystem(nodeCount);
    system.nodeMap = nodeMapping;

    Object.values(models).forEach((model) => {
        applyComponentStamp(model, system.conductanceMatrix, nodeMapping, system.inputSourcesVector);
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