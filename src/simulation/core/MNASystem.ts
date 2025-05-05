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

/**
 * Creates a mapping of circuit node IDs to unique numerical indices, excluding the "unified-ground" node since
 * it has a relative voltage of 0V. 
 *
 * @param nodes - A record of circuit nodes where the key is the node ID and the value is a `CircuitNode` object.
 * @returns A record where the key is the node ID and the value is its corresponding numerical index.
 */
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

/**
 * Initialises an MNAMatrixSystem with the specified number of nodes.
 *
 * This function creates and returns an object representing the Modified Nodal Analysis (MNA) system,
 * which includes the conductance matrix, conductance unknown vector, input sources vector, and other
 * related properties. All matrices and vectors are initialised with zeros.
 *
 * @param nodeCount - The number of nodes in the system. Determines the dimensions of the matrices and vectors.
 * @returns An object representing the MNAMatrixSystem
 * @see MNAMatrixSystem
 */
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

/**
 * Solves the circuit described by the given graph and component models using Modified Nodal Analysis (MNA).
 *
 * @param graph - The circuit graph representing the nodes and connections in the circuit.
 * @param models - A record of component models, where the key is the component ID and the value is the component model.
 * @returns A record mapping node IDs to their calculated voltages, including special entries:
 *          - `'unified-ground'`: Voltage at the unified ground node (always 0).
 *          - `'unified_power_current'`: The current through the unified power source.
 */
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