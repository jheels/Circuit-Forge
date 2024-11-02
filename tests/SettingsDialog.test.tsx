import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SettingsDialog from '@/components/dialogs/SettingsDialog';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

describe('SettingsDialog', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should render SettingsDialog with correct headers', () => {
        render(
            <SettingsDialog
                open={true}
                onOpenChange={() => {}}
            />
        );

        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Make changes to your setting here. Click save when you\'re done.')).toBeInTheDocument();
        expect(screen.getByText('High Contrast')).toBeInTheDocument();
        expect(screen.getByText('VoiceOver')).toBeInTheDocument();
    });

    it('should toggle high contrast switch', () => {
        render(
            <SettingsDialog
                open={true}
                onOpenChange={() => {}}
            />
        );

        const highContrastSwitch = screen.getByLabelText('High Contrast');
        expect(highContrastSwitch).not.toBeChecked();

        fireEvent.click(highContrastSwitch);
        expect(highContrastSwitch).toBeChecked();

        fireEvent.click(highContrastSwitch);
        expect(highContrastSwitch).not.toBeChecked();
    });

    it('should toggle voice over switch', () => {
        render(
            <SettingsDialog
                open={true}
                onOpenChange={() => {}}
            />
        );

        const voiceOverSwitch = screen.getByLabelText('VoiceOver');
        expect(voiceOverSwitch).not.toBeChecked();

        fireEvent.click(voiceOverSwitch);
        expect(voiceOverSwitch).toBeChecked();

        fireEvent.click(voiceOverSwitch);
        expect(voiceOverSwitch).not.toBeChecked();
    });

    it('should call onOpenChange when save button is clicked', () => {
        const onOpenChange = vi.fn();

        render(
            <SettingsDialog
                open={true}
                onOpenChange={onOpenChange}
            />
        );

        const saveButton = screen.getByText('Save changes');
        fireEvent.click(saveButton);

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange when close button is clicked', () => {
        const onOpenChange = vi.fn();

        render(
            <SettingsDialog
                open={true}
                onOpenChange={onOpenChange}
            />
        );

        const closeButton = screen.getByText('Close').closest('button');
        fireEvent.click(closeButton);

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange when escape key is pressed.', () => {
        const onOpenChange = vi.fn();

        render(
            <SettingsDialog
                open={true}
                onOpenChange={onOpenChange}
            />
        );

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(onOpenChange).toHaveBeenCalled();
    });

    it('should call onOpenChange when backdrop is clicked.', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();

        render(
            <SettingsDialog
                open={true}
                onOpenChange={onOpenChange}
            />
        );
        
        const backdrop = screen.getByTestId('dialog-overlay')
    
        // Simulate clicking on the backdrop
        await user.click(backdrop)    
        expect(onOpenChange).toHaveBeenCalled();
            
    });

    it('should save and retrieve settings correctly', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();

        const TestComponent = () => {
            const [isOpen, setIsOpen] = useState(true);
            return (
                <SettingsDialog
                    open={isOpen}
                    onOpenChange={(open) => {
                        setIsOpen(open);
                        onOpenChange(open);
                    }}
                />
            );
        };

        render(<TestComponent />);

        const highContrastSwitch = screen.getByLabelText('High Contrast');
        await user.click(highContrastSwitch);
        const voiceOverSwitch = screen.getByLabelText('VoiceOver');
        await user.click(voiceOverSwitch);

        const saveButton = screen.getByText('Save changes');
        await user.click(saveButton);

        // Close the dialog
        fireEvent.click(document.body);

        // Reopen the dialog
        render(<TestComponent />);

        // Check if the settings are correctly retrieved from localStorage
        expect(screen.getByLabelText('High Contrast')).toBeChecked();
        expect(screen.getByLabelText('VoiceOver')).toBeChecked();
    });

    it('should not save settings if toggled and then the dialog is closed', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();

        const TestComponent = () => {
            const [isOpen, setIsOpen] = useState(true);
            return (
                <SettingsDialog
                    open={isOpen}
                    onOpenChange={(open) => {
                        setIsOpen(open);
                        onOpenChange(open);
                    }}
                />
            );
        };

        render(<TestComponent />);

        const highContrastSwitch = screen.getByLabelText('High Contrast');
        await user.click(highContrastSwitch);
        const voiceOverSwitch = screen.getByLabelText('VoiceOver');
        await user.click(voiceOverSwitch);

        // Close the dialog
        fireEvent.click(document.body);

        // Reopen the dialog
        render(<TestComponent />);

        // Check if the settings are correctly retrieved from localStorage
        expect(screen.getByLabelText('High Contrast')).not.toBeChecked();
        expect(screen.getByLabelText('VoiceOver')).not.toBeChecked();
    });
});