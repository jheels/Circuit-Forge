import { useState } from 'react';
import NavBar from './components/topbars/NavBar';
import Simulator from './pages/Simulator';
import ICEditor from './pages/ICEditor';

function App() {
    const [selectedTool, setSelectedTool] = useState<'simulator' | 'ic-editor'>('simulator');

    return (
        <div className="relative flex flex-col h-screen">
            <NavBar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
            {selectedTool === 'simulator' ? <Simulator /> : <ICEditor />}
        </div>
    );
}

export default App;