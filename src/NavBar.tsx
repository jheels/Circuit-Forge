import { useState} from 'react'
import { Anvil, Moon, Sun, Settings, Microchip, Code, LucideIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import ToolBar  from './ToolBar'
interface TooltipButtonProps {
    icon: LucideIcon
    tooltip: string
}

function TooltipButton({ icon: Icon, tooltip }: TooltipButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Icon className="h-7 w-7" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    )
}


export function Navbar() {
    const [isDarkMode, setIsDarkMode] = useState(false)

    return (
        <header>
            <nav className="bg-black text-primary-foreground p-2 flex items-center justify-between">
                <div className="flex items-center">
                    <Anvil strokeWidth={2} className="h-8 w-8 mr-2" />
                    <span className="text-3xl"><span className="font-light">Circuit</span><b>Forge</b></span>
                </div>
                <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-6">
                        <TooltipProvider>
                            <TooltipButton icon={Code} tooltip="Simulator" />
                            <TooltipButton icon={Microchip} tooltip="IC Editor" />
                        </TooltipProvider>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={isDarkMode}
                            onCheckedChange={setIsDarkMode}
                            className="data-[state=checked]:bg-gray-700 data-[state=unchecked]:bg-gray-200"
                        />
                        {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        <Button variant="ghost" size="icon">
                            <Settings className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </nav>
            <ToolBar />
        </header>
    )
}

export default Navbar;