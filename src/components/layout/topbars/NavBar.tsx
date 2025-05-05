import { useState } from 'react';
import { Anvil, Settings, Microchip, CircuitBoard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useUIContext } from '@/context/UIContext';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';
import { TooltipButton } from '@/components/ui/ToolTipButton';
import { sendErrorToast } from '@/lib/utils';

/**
 * 
 * @returns {JSX.Element} - The NavBar component
 * @description - A navigation bar component that contains the application title, simulator, IC editor, and settings button.
 */
export function NavBar() {
    const { selectedTool, setSelectedTool } = useUIContext();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <>
            <nav className="bg-black text-primary-foreground p-2 flex items-center justify-between">
                <div className="flex items-center">
                    <Anvil strokeWidth={2} className="h-8 w-8 mr-2" />
                    <span className="text-3xl"><span className="font-light">Circuit</span><b>Forge</b></span>
                </div>
                <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-6">
                        <TooltipButton icon={CircuitBoard} tooltip="Simulator" isSelected={selectedTool === 'simulator'} onClick={() => setSelectedTool('simulator')} />
                        <TooltipButton icon={Microchip} tooltip="IC Editor" isSelected={selectedTool === 'ic-editor'} onClick={() => sendErrorToast('Feature not implemented!')} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button aria-label='settings-button' data-testid='settings-switch' variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                            <Settings className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </nav>
            <SettingsDialog data-testid='settings-dialog' open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        </>
    );
}