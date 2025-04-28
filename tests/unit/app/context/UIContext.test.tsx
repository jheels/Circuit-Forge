import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UIProvider, useUIContext } from '../../../../src/context/UIContext';

// Helper component to consume the context
const Consumer = () => {
    const { isSideBarOpen, toggleSidebar, selectedTool, setSelectedTool } = useUIContext();
    return (
        <div>
            <span data-testid="sidebar">{isSideBarOpen ? 'open' : 'closed'}</span>
            <span data-testid="tool">{selectedTool}</span>
            <button onClick={toggleSidebar}>Toggle Sidebar</button>
            <button onClick={() => setSelectedTool('ic-editor')}>Set IC Editor</button>
            <button onClick={() => setSelectedTool('simulator')}>Set Simulator</button>
        </div>
    );
};

describe('UIContext', () => {
    it('provides default values', () => {
        render(
            <UIProvider>
                <Consumer />
            </UIProvider>
        );
        expect(screen.getByTestId('sidebar').textContent).toBe('open');
        expect(screen.getByTestId('tool').textContent).toBe('simulator');
    });

    it('toggleSidebar toggles isSideBarOpen', () => {
        render(
            <UIProvider>
                <Consumer />
            </UIProvider>
        );
        const sidebar = screen.getByTestId('sidebar');
        const toggleBtn = screen.getByText('Toggle Sidebar');
        expect(sidebar.textContent).toBe('open');
        fireEvent.click(toggleBtn);
        expect(sidebar.textContent).toBe('closed');
        fireEvent.click(toggleBtn);
        expect(sidebar.textContent).toBe('open');
    });

    it('setSelectedTool updates selectedTool', () => {
        render(
            <UIProvider>
                <Consumer />
            </UIProvider>
        );
        const tool = screen.getByTestId('tool');
        const setIcEditorBtn = screen.getByText('Set IC Editor');
        const setSimulatorBtn = screen.getByText('Set Simulator');
        expect(tool.textContent).toBe('simulator');
        fireEvent.click(setIcEditorBtn);
        expect(tool.textContent).toBe('ic-editor');
        fireEvent.click(setSimulatorBtn);
        expect(tool.textContent).toBe('simulator');
    });

    it('throws error when useUIContext is used outside UIProvider', () => {
        // Suppress error output for this test
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const ErrorComponent = () => {
            useUIContext();
            return null;
        };
        expect(() => render(<ErrorComponent />)).toThrow(
            'useUIContext must be used within a UIProvider'
        );
        spy.mockRestore();
    });
});