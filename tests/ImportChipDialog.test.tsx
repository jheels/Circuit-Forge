import { render, screen, fireEvent } from '@testing-library/react';
import ImportChipDialog from '@/components/dialogs/ImportChipDialog';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('ImportChipDialog', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    })

    it('should render ImportChipDialog with correct headers', () => {
        render(
            <ImportChipDialog
                isOpen={true}
                onOpenChange={() => {}}
                selectedFile={null}
                onFileChange={() => {}}
                onImport={() => {}}
            />
        );

        expect(screen.getByText('Import Chip')).toBeInTheDocument();
        expect(screen.getByText('Only .chip files can be uploaded.')).toBeInTheDocument();
        expect(screen.getByText('Select a file...')).toBeInTheDocument();
        expect(screen.getByText('Import')).toBeInTheDocument();
    });

    it('should update to the selected .chip file.', () => {
        const file = new File(['dummy content'], 'example.chip', { type: 'application/octet-stream' });
        const onFileChange = vi.fn();

        render(
            <ImportChipDialog
                isOpen={true}
                onOpenChange={() => {}}
                selectedFile={null}
                onFileChange={onFileChange}
                onImport={() => {}}
            />
        );

        const fileInput = screen.getByText('Select a file...').parentElement.querySelector('input[type="file"]');
        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(onFileChange).toHaveBeenCalledWith(file);
    });

    it('should display an error alert for non-.chip file.', () => {
        const file = new File(['dummy content'], 'example.txt', { type: 'text/plain' });
        const onFileChange = vi.fn();
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        render(
            <ImportChipDialog
                isOpen={true}
                onOpenChange={() => {}}
                selectedFile={null}
                onFileChange={onFileChange}
                onImport={() => {}}
            />
        );

        const fileInput = screen.getByText('Select a file...').parentElement.querySelector('input[type="file"]');
        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(onFileChange).toHaveBeenCalledWith(null);
        expect(alertMock).toHaveBeenCalledWith('Please select a valid .chip file');
        alertMock.mockRestore();
    });

    it('should disable import button when no file is selected.', () => {
        render(
            <ImportChipDialog
                isOpen={true}
                onOpenChange={() => {}}
                selectedFile={null}
                onFileChange={() => {}}
                onImport={() => {}}
            />
        );

        const importButton = screen.getByText('Import').closest('button');
        expect(importButton).toBeDisabled();
    });

    it('should enable import button when a file is selected.', () => {
        const file = new File(['dummy content'], 'example.chip', { type: 'application/octet-stream' });

        render(
            <ImportChipDialog
                isOpen={true}
                onOpenChange={() => {}}
                selectedFile={file}
                onFileChange={() => {}}
                onImport={() => {}}
            />
        );

        const importButton = screen.getByText('Import').closest('button');
        expect(importButton).not.toBeDisabled();
    });

    it('should call onImport when import button is clicked.', () => {
        const file = new File(['dummy content'], 'example.chip', { type: 'application/octet-stream' });
        const onImport = vi.fn();

        render(
            <ImportChipDialog
                isOpen={true}
                onOpenChange={() => {}}
                selectedFile={file}
                onFileChange={() => {}}
                onImport={onImport}
            />
        );

        const importButton = screen.getByText('Import').closest('button');
        fireEvent.click(importButton);

        expect(onImport).toHaveBeenCalled();
    });

    it('should call onOpenChange when close button is clicked.', () => {
        const onOpenChange = vi.fn();

        render(
            <ImportChipDialog
                isOpen={true}
                onOpenChange={onOpenChange}
                selectedFile={null}
                onFileChange={() => {}}
                onImport={() => {}}
            />
        );

        const closeButton = screen.getByText('Close').closest('button');
        fireEvent.click(closeButton);

        expect(onOpenChange).toHaveBeenCalled();
    });

    it('should call onOpenChange when backdrop is clicked.', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();

        render(
            <ImportChipDialog
                isOpen={true}
                onOpenChange={onOpenChange}
                selectedFile={null}
                onFileChange={() => {}}
                onImport={() => {}}
            />
        );
        
        const backdrop = screen.getByTestId('dialog-overlay')
    
        // Simulate clicking on the backdrop
        await user.click(backdrop)    
        expect(onOpenChange).toHaveBeenCalled();
            
    });

    it('should call onOpenChange when escape key is pressed.', () => {
        const onOpenChange = vi.fn();

        render(
            <ImportChipDialog
                isOpen={true}
                onOpenChange={onOpenChange}
                selectedFile={null}
                onFileChange={() => {}}
                onImport={() => {}}
            />
        );

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(onOpenChange).toHaveBeenCalled();
    });

    it('should call onOpenChange when close button is clicked.', () => {
        const onOpenChange = vi.fn();

        render(
            <ImportChipDialog
                isOpen={true}
                onOpenChange={onOpenChange}
                selectedFile={null}
                onFileChange={() => {}}
                onImport={() => {}}
            />
        );

        const closeButton = screen.getByText('Close').closest('button');
        fireEvent.click(closeButton);

        expect(onOpenChange).toHaveBeenCalled();
    });
});
