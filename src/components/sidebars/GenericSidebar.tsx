import { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Search, Download, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImportChipDialog } from '@/components/dialogs/ImportChipDialog';
import { useUIContext } from '@/context/UIContext';
import { SidebarComponent } from '@/types/general';

interface GenericSideBarProps {
    components: SidebarComponent[];
    showImportChipDialog: boolean;
}

const DraggableComponent = ({ component }: { component: SidebarComponent }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'COMPONENT',
        item: { name: component.name },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            className={`flex flex-col items-center bg-white rounded-lg shadow-sm p-2 ${isDragging ? 'opacity-50' : ''}`}
            title={component.name}
        >
            {component.graphic ? (
                component.graphic
            ) : (
                <div className="w-full aspect-square bg-gray-300 rounded-md flex items-center justify-center mb-2"></div>
            )}

            <div className="flex items-center justify-between w-full">
                <span className="text-xs text-center flex-grow truncate">{component.name}</span>
                <Info className="h-3.5 w-3.5 text-gray-600 ml-2 flex-shrink-0" />
            </div>
        </div>
    );
};


export function GenericSideBar({ components, showImportChipDialog }: GenericSideBarProps) {
    const { isSideBarOpen, toggleSidebar } = useUIContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const filteredComponents = components.filter(component =>
        component.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleImport = () => {
        if (selectedFile) {
            // Implement file import logic here
            console.log('Importing file:', selectedFile.name);
            setIsImportDialogOpen(false);
            setSelectedFile(null);
        }
    };

    return (
        <div data-testid="sidebar" className={`relative h-full bg-gray-200 ${isSideBarOpen ? 'w-1/5' : 'w-3'} flex-shrink-0`}>
            <button
                onClick={toggleSidebar}
                data-testid="toggleSidebar"
                className="absolute -left-3 top-1/2 -translate-y-1/2 h-16 w-6 flex items-center justify-center bg-gray-300"
            >
                {isSideBarOpen ? (
                    <ChevronLeft className="h-6 w-6" />
                ) : (
                    <ChevronRight className="h-6 w-6" />
                )}
            </button>

            {isSideBarOpen && (
                <>
                    <div className="p-4 border-b shadow-sm border-gray-300">
                        <div className="flex items-center space-x-2">
                            <div className="relative flex-grow">
                                <Input
                                    type="text"
                                    placeholder="Search"
                                    className="pr-8 py-1 w-full h-[40px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600" />
                            </div>
                            {showImportChipDialog && (
                                <Button data-testid="importChipButton" variant="ghost" size="icon" onClick={() => setIsImportDialogOpen(true)}>
                                    <Download className="h-7 w-7" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="p-4 h-[calc(100vh-10rem)] overflow-y-scroll">
                        <div className="grid grid-cols-3 gap-2">
                            {filteredComponents.map((componentEntry) => (
                                <DraggableComponent key={componentEntry.sidebarID} component={componentEntry} />
                            ))}
                        </div>
                    </div>
                </>
            )}
            {isSideBarOpen && showImportChipDialog && (
                <ImportChipDialog
                    isOpen={isImportDialogOpen}
                    onOpenChange={setIsImportDialogOpen}
                    selectedFile={selectedFile}
                    onFileChange={setSelectedFile}
                    onImport={handleImport}
                />)}
        </div>
    );
}