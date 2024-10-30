import ICEditorSideBar from '../components/sidebars/ICEditorSideBar';
import Toolbar from "../components/topbars/ToolBar";

export default function ICEditor() {
    return (
        <div className="flex flex-col flex-grow overflow-hidden">
            <Toolbar projectKey="icEditorProjectName" defaultName="Untitled Chip" />
            <div className="flex flex-grow overflow-hidden">
                <div className="flex-grow p-4 bg-red">
                    {/* IC Editor main content */}
                </div>
                <ICEditorSideBar />
            </div>
        </div>
    );
}
