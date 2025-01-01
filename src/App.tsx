import { useState } from 'react';
import NavBar from '@/components/topbars/NavBar';
import Simulator from './pages/Simulator';
import ICEditor from './pages/ICEditor';
import { UIProvider } from '@/context/UIContext';

function App() {
    const [selectedTool, setSelectedTool] = useState<'simulator' | 'ic-editor'>('simulator');

    return (
        <UIProvider>
            <div className="relative flex flex-col h-screen">
                <NavBar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
                {selectedTool === 'simulator' ? <Simulator /> : <ICEditor />}
            </div>
        </UIProvider>
    );
}

export default App;