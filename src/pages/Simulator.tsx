import SimSideBar from "@/components/sidebars/SimSideBar";
import Toolbar from "@/components/topbars/ToolBar";
import Editor from "@/components/Editor";

export default function Simulator() {
    return (
        <div className="flex flex-col flex-grow overflow-hidden">
            <Toolbar projectKey="simulatorProjectName" defaultName="Untitled Project" />
            <div className="flex flex-grow overflow-hidden">
                <Editor />
                <SimSideBar />
            </div>
        </div>
    );
}
