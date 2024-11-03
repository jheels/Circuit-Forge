import { useState } from 'react';
import { Search, Download, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ImportChipDialog from '@/components/dialogs/ImportChipDialog';
import { useSidebar } from '@/context/SidebarContext';

interface ComponentTile {
    id: string;
    name: string;
    description: string;
}

interface GenericSideBarProps {
    components: ComponentTile[];
    showImportChipDialog: boolean;
}

export default function GenericSideBar({ components, showImportChipDialog }: GenericSideBarProps) {
    const { isOpen, toggleSidebar } = useSidebar();
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
        <div data-testid="sidebar" className={`relative h-full bg-gray-200 ${isOpen ? 'w-1/5' : 'w-3'} flex-shrink-0`}>
            <button
                onClick={toggleSidebar}
                data-testid="toggleSidebar"
                className="absolute -left-3 top-1/2 -translate-y-1/2 h-16 w-6 flex items-center justify-center bg-gray-300"
            >
                {isOpen ? (
                    <ChevronLeft className="h-6 w-6" />
                ) : (
                    <ChevronRight className="h-6 w-6" />
                )}
            </button>

            {isOpen && (
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
                        <div className="grid grid-cols-3 gap-4">
                            {filteredComponents.map((component) => (
                                <div key={component.id} className="flex flex-col items-center bg-white rounded-lg shadow-sm p-2">
                                    <div className="w-full aspect-square bg-gray-300 rounded-md flex items-center justify-center mb-2">
                                    </div>
                                    <div className="flex items-center justify-center w-full">
                                        <span className="text-xs text-center truncate mr-1">{component.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-0 h-4 w-4"
                                            title={component.description}
                                        >
                                            <Info className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
            {showImportChipDialog && (
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
