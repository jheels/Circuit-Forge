import { EditorComponent } from "@/definitions/general";
import { CircuitEdge, getSwitchIndex, isDIPSwitchConnection } from "../circuit/circuitDetection";
import { DIPSwitchComponent } from "@/definitions/components/dipswitch";
import { applyDipSwitchStamp, createDipSwitchModel, DipSwitchModel } from "./DIPSwitchModel";
import { applyResistorStamp, createResistorModel, ResistorModel } from "./resistorModel";
import { ResistorComponent } from "@/definitions/components/resistor";
import { applyIndependentVoltageSourceStamp, createIndependentVoltageSourceModel, IndependentVoltageSource } from "./independentVoltageSourceModel";
import { PowerSupplyComponent } from "@/definitions/components/powerSupply";
import { Matrix } from "mathjs";
import { applyLEDStamp, createLEDModel, LEDModel } from "./LEDModel";
import { applyLogicGateStamp, LogicGateModel } from "./logicGateModel";

export interface ComponentModel {
    isLinear: boolean;
    type: string;
    edge: CircuitEdge;
}

/**
 * Creates a component model based on the provided editor component and circuit edge.
 *
 * @param component - The editor component to create a model for. The type of the component
 * determines the specific model creation logic.
 * @param edge - The circuit edge associated with the component, providing connection details.
 * 
 * @returns A `ComponentModel` instance if the component type is supported and the model
 * creation is successful, or `null` if the component type is not supported.
 * 
 * @remarks
 * - For a 'dip-switch' component, the function checks the connection type and retrieves
 *   the switch index and state to create a DIP switch model.
 * - For other supported component types ('resistor', 'power-supply', 'led'), the function
 *   delegates to specific model creation functions.

 * ```
 */
export const createComponentModel = (
    component: EditorComponent,
    edge: CircuitEdge
): ComponentModel | null => {
    if (component.type === 'dip-switch' && isDIPSwitchConnection(edge.connection)) {
        const DIPSwitch = component as DIPSwitchComponent;
        const switchIndex = getSwitchIndex(edge.connection) as number;
        const switchState = DIPSwitch.switchStates[switchIndex];

        return createDipSwitchModel(switchIndex, switchState, edge);
    }

    switch (component.type) {
        case 'resistor':
            return createResistorModel(component as ResistorComponent, edge);
        case 'power-supply':
            return createIndependentVoltageSourceModel(component as PowerSupplyComponent, edge);
        case 'led':
            return createLEDModel(edge);
        default:
            console.warn(`Component type ${component.type} not supported`);
            return null;
    }
}

/**
 * Applies the appropriate stamp to the conductance matrix and optionally the input sources matrix
 * based on the type of the given component model.
 *
 * @param model - The component model containing the type and properties of the component.
 * @param conductanceMatrix - The matrix representing the conductance of the circuit.
 * @param nodeMap - A mapping of node identifiers to their corresponding indices in the matrices.
 * @param inputSourcesMatrix - (Optional) The matrix representing input sources in the circuit.
 *
 * The function handles the following component types:
 * - 'resistor': Applies a resistor stamp.
 * - 'dip-switch': Applies a dip-switch stamp.
 * - 'independent-voltage-source': Applies an independent voltage source stamp if `inputSourcesMatrix` is provided.
 * - 'led': Applies an LED stamp if `inputSourcesMatrix` is provided.
 * - 'logic-gate': Applies a logic gate stamp if `inputSourcesMatrix` is provided.
 *
 * If the component type is not supported, a warning is logged to the console.
 */
export const applyComponentStamp = (
    model: ComponentModel,
    conductanceMatrix: Matrix,
    nodeMap: Record<string, number>,
    inputSourcesMatrix?: Matrix
): void => {
    switch (model.type) {
        case 'resistor':
            applyResistorStamp(conductanceMatrix, model as ResistorModel, nodeMap);
            break;
        case 'dip-switch':
            applyDipSwitchStamp(conductanceMatrix, model as DipSwitchModel, nodeMap);
            break;
        case 'independent-voltage-source':
            if (inputSourcesMatrix) {
                applyIndependentVoltageSourceStamp(conductanceMatrix, inputSourcesMatrix, model as IndependentVoltageSource, nodeMap);
            }
            break;
        case 'led':
            if (inputSourcesMatrix) {
                applyLEDStamp(conductanceMatrix, inputSourcesMatrix, model as LEDModel, nodeMap);
            }
            break;
        case 'logic-gate':
            if (inputSourcesMatrix) {
                applyLogicGateStamp(conductanceMatrix, inputSourcesMatrix, model as LogicGateModel, nodeMap);
            }
            break;
        default:
            console.warn(`Component type ${model.type} not supported`);
    }
}