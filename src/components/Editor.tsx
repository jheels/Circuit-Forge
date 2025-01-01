import Toolbar from '@/components/topbars/ToolBar';
import SimSideBar from '@/components/sidebars/SimSideBar';
import Canvas from '@/components/Canvas';

const Editor: React.FC = () => {
    return (
        <div className="flex flex-col flex-grow overflow-hidden">
            <Toolbar />
            <div className="flex flex-grow overflow-hidden">
                <Canvas />
                <SimSideBar />
            </div>
        </div>
    );
};

export default Editor;