import '@testing-library/jest-dom';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { NavBar } from '@/components/topbars/NavBar';
import { UIProvider } from '@/context/UIContext';


describe('NavBar', () => {
    const renderWithContext = (component: ReactNode) => {
        return render(
            <UIProvider>
                {component}
            </UIProvider>
        );
    }

    it('should render with logo, simulator and ic-editor buttons, dark mode toggle, and settings button.', () => {
        renderWithContext(<NavBar />);

        const simulatorButton = screen.getByTestId('Simulator');
        const icEditorButton = screen.getByTestId('IC Editor');
        const darkModeToggle = screen.getByTestId('dark-mode-switch');
        const settingsButton = screen.getByTestId('settings-switch');

        expect(screen.getByText('Circuit')).toBeInTheDocument();
        expect(screen.getByText('Forge')).toBeInTheDocument();
        expect(simulatorButton).toBeInTheDocument();
        expect(icEditorButton).toBeInTheDocument();
        expect(darkModeToggle).toBeInTheDocument();
        expect(settingsButton).toBeInTheDocument();
    });

    it('should toggle dark mode when dark mode switch is clicked.', () => {
        renderWithContext(<NavBar />);

        const darkModeToggle = screen.getByTestId('dark-mode-switch');
        expect(darkModeToggle).toHaveClass('data-[state=unchecked]:bg-gray-200');
        fireEvent.click(darkModeToggle);
        expect(darkModeToggle).toHaveClass('data-[state=checked]:bg-gray-700');
        fireEvent.click(darkModeToggle);
        expect(darkModeToggle).toHaveClass('data-[state=unchecked]:bg-gray-200');
    });

    it('should open settings dialog when settings button is clicked.', () => {
        renderWithContext(<NavBar />);

        const settingsButton = screen.getByTestId('settings-switch');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        fireEvent.click(settingsButton);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
        expect(screen.queryByTestId('settings-dialog')).not.toBeInTheDocument();
    });

    it('should switch between simulator and ic-editor when corresponding buttons are clicked.', () => {
        renderWithContext(<NavBar />);

        const simulatorButton = screen.getByTestId('Simulator');
        const icEditorButton = screen.getByTestId('IC Editor');

        // Default selected tool is simulator
        expect(simulatorButton).toHaveClass('bg-white text-black');
        expect(icEditorButton).not.toHaveClass('bg-white text-black');

        fireEvent.click(icEditorButton);
        expect(simulatorButton).not.toHaveClass('bg-white text-black');
        expect(icEditorButton).toHaveClass('bg-white text-black');

        fireEvent.click(simulatorButton);
        expect(simulatorButton).toHaveClass('bg-white text-black');
        expect(icEditorButton).not.toHaveClass('bg-white text-black');
    });

    it('should render tooltip content when tooltip button is hovered.', () => {
        renderWithContext(<NavBar />);

        const simulatorButton = screen.getByTestId('Simulator');
        const icEditorButton = screen.getByTestId('IC Editor');

        fireEvent.mouseEnter(simulatorButton);
        // small delay for tooltip to render
        setTimeout(() => {
            expect(screen.getByText('Simulator')).toBeInTheDocument();
        }, 1000);
        fireEvent.mouseLeave(simulatorButton);
        expect(screen.queryByText('Simulator')).not.toBeInTheDocument();

        fireEvent.mouseEnter(icEditorButton);
        setTimeout(() => {
            expect(screen.getByText('IC Editor')).toBeInTheDocument();
        }, 1000);
        fireEvent.mouseLeave(icEditorButton);
        expect(screen.queryByText('IC Editor')).not.toBeInTheDocument();
    });
});