import { render, screen, fireEvent } from '@testing-library/react';
import ImportChipDialog from '../src/components/dialogs/ImportChipDialog';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';

describe('ImportChipDialog', () => {
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

    it('should call onFileChange with the selected file', () => {
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

    it('should display an error alert for non-.chip file', () => {
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

});
