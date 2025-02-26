import { lusolve, matrix, Matrix, zeros } from "mathjs";
import { CircuitGraph, CircuitNode } from "../analysis/circuitDetection";
import { EditorComponent } from "@/types/general";
import { applyResistorStamp, createResistorModel } from "../models/resistorModel";
import { ResistorComponent } from "@/types/components/resistor";
import { applyWireStamp, createWireModel } from "../models/wireModel";
import { PowerSupplyComponent } from "@/types/components/powerSupply";
import { applyPowerSupplyStamp, createPowerSupplyModel } from "../models/powerSupplyModel";

interface MNAMatrixSystem {
    conductanceMatrix: Matrix;          // The (n+m)×(n+m) coefficient matrix
    conductanceUnknownVector: Matrix;          // The (n+m)×1 unknown vector (voltages and currents)
    inputSourcesVector: Matrix;          // The (n+m)×1 known vector (source values)
    nodeMapping: Record<string, number>;  // Maps node IDs to matrix indices
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
        nodeMapping: {},
        nodeCount,
    }
}

export const solveCircuit = (graph: CircuitGraph, components: Record<string, EditorComponent>): Record<string, number> => {
    const nodeMapping = createNodeMap(graph.nodes);
    const nodeCount = Object.keys(nodeMapping).length;

    const system = initialiseMNASystem(nodeCount);
    system.nodeMapping = nodeMapping;

    Object.values(graph.edges).forEach((edge) => {
        if (edge.connections[0].type !== 'component') {
            const wireModel = createWireModel(edge);
            applyWireStamp(system.conductanceMatrix, wireModel, nodeMapping);
            return;
        }

        const component = components[edge.connections[0].id];
        if (component.type === 'resistor') {
            const resistorModel = createResistorModel(component as ResistorComponent, edge);
            applyResistorStamp(system.conductanceMatrix, resistorModel, nodeMapping);
        } else if (component.type === 'power-supply') {
            const newSize = system.conductanceMatrix.size()[0] + 1;
            system.conductanceMatrix.resize([newSize, newSize]);
            system.inputSourcesVector.resize([newSize, 1]);
            const PowerSupplyModel = createPowerSupplyModel(component as PowerSupplyComponent, edge);
            applyPowerSupplyStamp(system.conductanceMatrix, system.inputSourcesVector,
                PowerSupplyModel, nodeMapping);
        }
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