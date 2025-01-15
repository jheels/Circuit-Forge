import { Editor } from "@/components/Editor";
import { SimulatorContextProvider } from "@/context/SimulatorContext";

export function Simulator() {
    return (
        <SimulatorContextProvider>
            <Editor />
        </SimulatorContextProvider>
    );
}
