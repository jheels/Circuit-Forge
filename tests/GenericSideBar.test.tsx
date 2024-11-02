import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GenericSideBar from '@/components/sidebars/GenericSideBar';

const mockComponents = [
    { id: '1', name: 'Component 1', description: 'Description 1' },
    { id: '2', name: 'Component 2', description: 'Description 2' },
    { id: '3', name: 'Component 3', description: 'Description 3' },
];

describe('GenericSideBar', () => {
    it('should render with search input, visibility toggle, and import button.', () => {
        render(<GenericSideBar components={mockComponents} showImportChipDialog={true} />);

        const toggleButton = screen.getByTestId('toggleSidebar');
        const ImportChipButton = screen.getByTestId('importChipButton');

        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
        expect(screen.getByText('Component 1')).toBeInTheDocument();
        expect(screen.getByText('Component 2')).toBeInTheDocument();
        expect(screen.getByText('Component 3')).toBeInTheDocument();
        expect(toggleButton).toBeInTheDocument();
        expect(ImportChipButton).toBeInTheDocument();
    });

    it('should toggle visibility when the toggle button is clicked.', () => {
        render(<GenericSideBar components={mockComponents} showImportChipDialog={true} />);

        const toggleButton = screen.getByTestId('toggleSidebar');
        const sidebar = screen.getByTestId('sidebar');

        expect(sidebar).toHaveClass('w-1/5');

        fireEvent.click(toggleButton);

        expect(sidebar).toHaveClass('w-3');
    });

    it('should open the import dialog when the import button is clicked.', () => {
        render(<GenericSideBar components={mockComponents} showImportChipDialog={true} />);
        const importChipButton = screen.getByTestId('importChipButton');

        expect(screen.queryByText('Import Chip')).not.toBeInTheDocument();
        fireEvent.click(importChipButton);
        expect(screen.getByText('Import Chip')).toBeInTheDocument();
    });

    it('should filter the components based on the search term.', () => {
        render(<GenericSideBar components={mockComponents} showImportChipDialog={true} />);
        const searchInput = screen.getByPlaceholderText('Search');

        expect(screen.getByText('Component 1')).toBeInTheDocument();
        expect(screen.getByText('Component 2')).toBeInTheDocument();
        expect(screen.getByText('Component 3')).toBeInTheDocument();

        fireEvent.change(searchInput, { target: { value: 'Component 1' } });

        expect(screen.getByText('Component 1')).toBeInTheDocument();
        expect(screen.queryByText('Component 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Component 3')).not.toBeInTheDocument();
    });
});
