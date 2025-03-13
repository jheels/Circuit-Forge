import { NavBar } from '@/components/layout/topbars/NavBar';
import { Simulator } from './routes/Simulator';
import { UIProvider } from '@/context/UIContext';
import { Toaster } from 'react-hot-toast';

const AppContent: React.FC = () => {
    return (
        <div>
        <Toaster/>
        <div className="relative flex flex-col h-screen">
            <NavBar />
            <Simulator />
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