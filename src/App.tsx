import { NavBar } from '@/components/topbars/NavBar';
import { Simulator } from './pages/Simulator';
import { ICEditor } from './pages/ICEditor';
import { UIProvider, useUIContext } from '@/context/UIContext';
import { Toaster } from 'react-hot-toast';

const AppContent: React.FC = () => {
    const { selectedTool } = useUIContext();
    return (
        <div>
        <Toaster/>
        <div className="relative flex flex-col h-screen">
            <NavBar />
            {selectedTool === 'simulator' ? <Simulator /> : <ICEditor />}
        </div>
        </div>
    );
};

function App() {
    return (
        <UIProvider>
            <AppContent />
        </UIProvider>
    );
}

export default App;