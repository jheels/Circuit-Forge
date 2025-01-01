import Editor from "@/components/Editor";
import { SimulatorContextProvider } from "@/context/SimulatorContext";

export default function Simulator() {
    return (
        <SimulatorContextProvider>
            <Editor />
        </SimulatorContextProvider>
    );
}
