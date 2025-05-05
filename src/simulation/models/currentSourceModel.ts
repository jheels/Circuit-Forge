import { Matrix } from "mathjs";
import { CircuitEdge } from "../circuit/circuitDetection";
import { ComponentModel } from "./componentModelFactory";

export interface CurrentSourceModel extends ComponentModel {
    type: 'current-source';
    current: number;
}

export const createCurrentSourceModel = (current: number, edge: CircuitEdge): CurrentSourceModel => {
    return {
        isLinear: true,
        type: 'current-source',
        current,
        edge
    }
}

/**
 * Applies the current source stamp to the input sources vector for circuit simulation.
 * This function modifies the `inputSourcesVector` to account for the current source
 * defined in the `model`, based on the node mapping provided in `nodeMap`.
 *
 * @param inputSourcesVector - The matrix representing the input sources vector
 *                             in the circuit simulation.
 * @param model - The current source model containing the current value and the
 *                edge information (source and target nodes).
 * @param nodeMap - A mapping of node IDs to their corresponding indices in the
 *                  simulation matrix.
 */
export const applyCurrentSourceStamp = (
    inputSourcesVector: Matrix,
    model: CurrentSourceModel,
    nodeMap: Record<string, number>
): void => {
    const { current, edge } = model;
    const { sourceId, targetId } = edge;

    const sourceIndex = nodeMap[sourceId];
    const targetIndex = nodeMap[targetId];

    if (sourceIndex === undefined && targetIndex === undefined) {
        return;
    }

    if (sourceIndex === undefined || targetIndex === undefined) {
        const nonGroundIndex = sourceIndex === undefined ? targetIndex : sourceIndex;
        inputSourcesVector.set([nonGroundIndex, 0], inputSourcesVector.get([nonGroundIndex, 0]) + current);
        return;
    }

    inputSourcesVector.set([sourceIndex, 0], inputSourcesVector.get([sourceIndex, 0]) - current);
    inputSourcesVector.set([targetIndex, 0], inputSourcesVector.get([targetIndex, 0]) + current);
}