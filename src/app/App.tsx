import { NavBar } from '@/components/layout/topbars/NavBar';
import { Simulator } from './routes/Simulator';
import { UIProvider } from '@/context/UIContext';
import { Toaster } from 'react-hot-toast';

/**
 * 
 * @returns {JSX.Element}
 * @description This is the content for the App. It contains the navbar and the simulator.
 * @see App
 */
const AppContent: React.FC = () => {
    return (
        <div>
            <Toaster
                position='bottom-center'
                reverseOrder={false}
            />
            <div className="relative flex flex-col h-screen">
                <NavBar />
                <Simulator />
            </div>
        </div>
    );
};

/**
 * 
 * @returns {JSX.Element}
 * @description Main entry point for the application.
 * @see AppContent
 */
function App() {
    return (
        <UIProvider>
            <AppContent />
        </UIProvider>
    );
}

export default App;