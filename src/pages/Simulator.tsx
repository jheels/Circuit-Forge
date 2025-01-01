import SimSideBar from "@/components/sidebars/SimSideBar";
import Toolbar from "@/components/topbars/ToolBar";
import Editor from "@/components/Editor";
import { SimulatorContextProvider } from "@/context/SimulatorContext";

export default function Simulator() {
    return (
        <SimulatorContextProvider>
        <div className="flex flex-col flex-grow overflow-hidden">
            <Toolbar/>
            <div className="flex flex-grow overflow-hidden">
                <Editor />
                <SimSideBar />
            </div>
        </div>
        </SimulatorContextProvider>
    );
}
