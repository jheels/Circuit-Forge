import NavBar from './NavBar';
import SideBar from './SideBar';
import ToolBar from './ToolBar';

function App() {
  return (
    <div className="relative flex flex-col h-screen">
      <NavBar />
      <ToolBar />
      <div className="flex flex-grow overflow-hidden">
        <div className="flex-grow p-4">
          {/* Your main content for component editing */}
        </div>
        <SideBar />
      </div>
    </div>
  );
}

export default App;