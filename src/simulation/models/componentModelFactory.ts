import { EditorComponent } from "@/types/general";
import { CircuitEdge, getSwitchIndex, isDIPSwitchConnection } from "../analysis/circuitDetection";
import { DIPSwitchComponent } from "@/types/components/dipswitch";
import { applyDipSwitchStamp, createDipSwitchModel, DipSwitchModel } from "./DIPSwitchModel";
import { applyResistorStamp, createResistorModel, ResistorModel } from "./resistorModel";
import { ResistorComponent } from "@/types/components/resistor";
import { applyPowerSupplyStamp, createPowerSupplyModel, PowerSupplyModel } from "./powerSupplyModel";
import { PowerSupplyComponent } from "@/types/components/powerSupply";
import { Matrix } from "mathjs";

export interface ComponentModel {
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
            return createPowerSupplyModel(component as PowerSupplyComponent, edge);
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
        case 'power-supply':
            if (!inputSourcesMatrix) {
                console.warn('Input sources matrix not provided for power supply');
                return;
            }
            applyPowerSupplyStamp(conductanceMatrix, inputSourcesMatrix, model as PowerSupplyModel, nodeMap);
            break;
        default:
            console.warn(`Component type ${model.type} not supported`);
    }
}