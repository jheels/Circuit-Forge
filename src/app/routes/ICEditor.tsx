import { ICEditorSideBar } from '@/components/layout/sidebars/ICEditorSideBar';
import { ToolBar } from "@/components/layout/topbars/ToolBar";

export function ICEditor() {
    return (
        <div className="flex flex-col flex-grow overflow-hidden">
            <ToolBar projectKey="icEditorProjectName" defaultName="Untitled Chip" />
            <div className="flex flex-grow overflow-hidden">
                <div className="flex-grow p-4 bg-red">
                    {/* IC Editor main content */}
                </div>
                <ICEditorSideBar />
            </div>
        </div>
    );
}
