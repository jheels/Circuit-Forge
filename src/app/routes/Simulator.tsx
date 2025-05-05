import { Editor } from "@/components/layout/Editor";
import { SaveProvider } from "@/context/SaveContext";
import { SimulatorContextProvider } from "@/context/SimulatorContext";
import { useRef } from "react";
import Konva from "konva";

/**
 * @returns {JSX.Element}
 * @description This is the main component for the simulator. It contains editor workspace.
 */
export function Simulator() {
    const stageRef = useRef<Konva.Stage>(null);


    return (
        <SimulatorContextProvider>
            <SaveProvider stageRef={stageRef}>
                <Editor stageRef={stageRef} />
            </SaveProvider>
        </SimulatorContextProvider>
    );
}
