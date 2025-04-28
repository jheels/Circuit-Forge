import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { SimulatorContextProvider } from '@/context/SimulatorContext';
import { SaveProvider } from '@/context/SaveContext';
import { UIProvider } from '@/context/UIContext';
import { ToolBar } from '@/components/layout/topbars/ToolBar';
import { ReactNode, RefObject } from 'react';
import { Stage } from 'konva/lib/Stage';
import userEvent from '@testing-library/user-event';

// Setup portal container
beforeEach(() => {
    const portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', 'portal-root'); // Match your portal ID
    document.body.appendChild(portalRoot);
});

afterEach(() => {
    document.getElementById('portal-root')?.remove();
});

// Test remains the same, but now portals render into `portal-root`

const onZoomIn = vi.fn();
const onZoomOut = vi.fn();
const onZoomReset = vi.fn();

const menuBarOptionMap = {
    'File': ['New Project', 'Load Project', 'Save', 'Save As', 'Export as PNG'],
    'Edit': ['Undo', 'Redo', 'Cut', 'Copy', 'Paste'],
    'View': ['Zoom In', 'Zoom Out', 'Reset Zoom'],
    'Help': ['Documentation', 'About']
};

describe('ToolBar', () => {
    const renderWithContext = (component: ReactNode) => {
        return render(
            <UIProvider>
                <SimulatorContextProvider>
                    {/* Mocking the StageRef to avoid errors during rendering */}
                    <SaveProvider stageRef={{} as RefObject<Stage>}>
                        {component}
                    </SaveProvider>
                </SimulatorContextProvider>
            </UIProvider>,

        );
    }

    it('should render the menu bar with save status and project name on a new project.', () => {
        renderWithContext(<ToolBar onZoomIn={onZoomIn} onZoomOut={onZoomOut} onZoomReset={onZoomReset} />);

        const saveStatus = screen.getByText('Unsaved changes');
        const projectName = screen.getByText('Untitled Project');

        expect(saveStatus).toBeInTheDocument();
        expect(projectName).toBeInTheDocument();
        Object.keys(menuBarOptionMap).forEach(header => {
            expect(screen.getByText(header)).toBeInTheDocument();
        });
    })

    it('should render the menu options for File, Edit, View, and Help.', async () => {
        renderWithContext(<ToolBar onZoomIn={onZoomIn} onZoomOut={onZoomOut} onZoomReset={onZoomReset} />);

        for (const [header, options] of Object.entries(menuBarOptionMap)) {
            const menuButton = screen.getByText(header);
            await userEvent.click(menuButton);
            options.forEach(option => {
                expect(screen.getByText(option)).toBeInTheDocument();
            }
            );
            // Close the menu after checking options
            await userEvent.click(menuButton);
        }
    });

    it('should call the Zoom in function when clicked', async () => {
        renderWithContext(<ToolBar onZoomIn={onZoomIn} onZoomOut={onZoomOut} onZoomReset={onZoomReset} />);
        const viewMenuButton = screen.getByText('View');
        await userEvent.click(viewMenuButton);

        const zoomInButton = await screen.getByText('Zoom In');
        await userEvent.click(zoomInButton);
        expect(onZoomIn).toHaveBeenCalled();
    });
    it('should call the Zoom out function when clicked', async () => {
        renderWithContext(<ToolBar onZoomIn={onZoomIn} onZoomOut={onZoomOut} onZoomReset={onZoomReset} />);
        const viewMenuButton = screen.getByText('View');
        await userEvent.click(viewMenuButton);

        const zoomOutButton = await screen.getByText('Zoom Out');
        await userEvent.click(zoomOutButton);
        expect(onZoomOut).toHaveBeenCalled();
    });
    it('should call the Reset zoom function when clicked', async () => {
        renderWithContext(<ToolBar onZoomIn={onZoomIn} onZoomOut={onZoomOut} onZoomReset={onZoomReset} />);
        const viewMenuButton = screen.getByText('View');
        await userEvent.click(viewMenuButton);

        const resetZoomButton = await screen.getByText('Reset Zoom');
        await userEvent.click(resetZoomButton);
        expect(onZoomReset).toHaveBeenCalled();
    }
    );
    it('should update the project name when clicking on the project name', async () => {
        renderWithContext(<ToolBar onZoomIn={onZoomIn} onZoomOut={onZoomOut} onZoomReset={onZoomReset} />);
        const projectName = screen.getByText('Untitled Project');
        await userEvent.click(projectName);

        const input = screen.getByRole('textbox');
        // Delete the default value
        await userEvent.clear(input);
        // Type the new project name
        await userEvent.type(input, 'New Project Name');
        expect(input).toHaveValue('New Project Name');
    });
});