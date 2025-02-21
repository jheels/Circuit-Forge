import { Editor } from "@/components/layout/Editor";
import { SimulatorContextProvider } from "@/context/SimulatorContext";
import { SaveProvider } from "@/context/SaveContext";
import { useRef } from "react";
import Konva from "konva";


export function Simulator() {
    const stageRef = useRef<Konva.Stage>(null);


    return (
        <SimulatorContextProvider>
            <SaveProvider stageRef={stageRef}>
                <Editor stageRef={stageRef}/>
            </SaveProvider>
        </SimulatorContextProvider>
    );
}
