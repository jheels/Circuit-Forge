import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import React, { useRef } from 'react';

interface ImportChipDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedFile: File | null;
    onFileChange: (file: File | null) => void;
    onImport: () => void;
}

const ImportChipDialog: React.FC<ImportChipDialogProps> = ({ isOpen, onOpenChange, selectedFile, onFileChange, onImport }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.name.endsWith('.chip')) {
            onFileChange(file);
        } else {
            alert('Please select a valid .chip file');
            onFileChange(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange} data-testid="importChipDialog">
            <DialogContent className="sm:max-w-[425px] p-4">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">Import Chip</DialogTitle>
                    <DialogDescription>
                        Only .chip files can be uploaded.
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <div className="flex items-center justify-between p-2 border border-gray-300 rounded-md cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".chip"
                            className="hidden"
                        />
                        <span className="text-gray-500">
                            {selectedFile ? selectedFile.name : 'Select a file...'}
                        </span>
                        <Upload className="h-5 w-5 mr-2" />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={onImport} disabled={!selectedFile}>
                        Import
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImportChipDialog;