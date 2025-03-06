import { EditorComponent } from "@/types/general";
import { CircuitEdge, getSwitchIndex, isDIPSwitchConnection } from "../analysis/circuitDetection";
import { DIPSwitchComponent } from "@/types/components/dipswitch";
import { applyDipSwitchStamp, createDipSwitchModel, DipSwitchModel } from "./DIPSwitchModel";
import { applyResistorStamp, createResistorModel, ResistorModel } from "./resistorModel";
import { ResistorComponent } from "@/types/components/resistor";
import { applyIndependentVoltageSourceStamp, createIndependentVoltageSource, IndependentVoltageSource } from "./independentVoltageSource";
import { PowerSupplyComponent } from "@/types/components/powerSupply";
import { Matrix } from "mathjs";
import { applyLEDStamp, createLEDModel, LEDModel } from "./LEDModel";
import { applyLogicGateStamp, LogicGateModel } from "./logicGateModel";

export interface ComponentModel {
    isLinear: boolean;
    type: string;
    edge: CircuitEdge;
}

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
            return createIndependentVoltageSource(component as PowerSupplyComponent, edge);
        case 'led':
            return createLEDModel(edge);
        default:
            console.warn(`Component type ${component.type} not supported`);
            return null;
    }
}

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