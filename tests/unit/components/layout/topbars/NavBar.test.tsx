import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NavBar } from '@/components/layout/topbars/NavBar';
import { UIProvider } from '@/context/UIContext';
import { ReactNode } from 'react';

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
        const settingsButton = screen.getByTestId('settings-switch');

        expect(screen.getByText('Circuit')).toBeInTheDocument();
        expect(screen.getByText('Forge')).toBeInTheDocument();
        expect(simulatorButton).toBeInTheDocument();
        expect(icEditorButton).toBeInTheDocument();
        expect(settingsButton).toBeInTheDocument();
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

    it('should show an error when trying to click the IC editor as its not implemented yet.', () => {
        renderWithContext(<NavBar />);

        const icEditorButton = screen.getByTestId('IC Editor');
        fireEvent.click(icEditorButton);
        // small delay for error message to render
        setTimeout(() => {
            expect(screen.getByText('Feature not implemented!')).toBeInTheDocument();
        }, 1000);
    });

    it('should select simulator tool when simulator button is clicked.', () => {
        renderWithContext(<NavBar />);

        const simulatorButton = screen.getByTestId('Simulator');
        fireEvent.click(simulatorButton);

        expect(screen.getByTestId('Simulator')).toHaveClass('bg-white');
        expect(screen.getByTestId('IC Editor')).not.toHaveClass('bg-white');
    });
});