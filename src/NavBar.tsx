import { useState } from 'react'
import { Anvil, Moon, Sun, Settings, Microchip, CircuitBoard } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import TooltipButton from './ToolTipButton'
import SettingsDialog from './SettingsDialog'

export function Navbar() {
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    return (
        <>
        <nav className="bg-black text-primary-foreground p-2 flex items-center justify-between">
            <div className="flex items-center">
                <Anvil strokeWidth={2} className="h-8 w-8 mr-2" />
                <span className="text-3xl"><span className="font-light">Circuit</span><b>Forge</b></span>
            </div>
            <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-6">
                        <TooltipButton icon={CircuitBoard} tooltip="Simulator" />
                        <TooltipButton icon={Microchip} tooltip="IC Editor" />
                </div>
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={isDarkMode}
                        onCheckedChange={setIsDarkMode}
                        className="data-[state=checked]:bg-gray-700 data-[state=unchecked]:bg-gray-200"
                    />
                    {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                        <Settings className="h-6 w-6" />
                    </Button>
                </div>
            </div>
        </nav>
        <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        </>
    )
}

export default Navbar;