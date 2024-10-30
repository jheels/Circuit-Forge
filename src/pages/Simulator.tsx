import SimSideBar from "../components/sidebars/SimSideBar";
import Toolbar from "../components/topbars/ToolBar";

export default function Simulator() {
    return (
        <div className="flex flex-col flex-grow overflow-hidden">
            <Toolbar projectKey="simulatorProjectName" defaultName="Untitled Project" />
            <div className="flex flex-grow overflow-hidden">
                <div className="flex-grow p-4 bg-red">
                    {}
                </div>
                <SimSideBar />
            </div>
        </div>
    );
}
