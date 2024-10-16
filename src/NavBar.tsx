import { useState } from 'react'
import { Anvil, Moon, Sun, Settings, Microchip, Codesandbox } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export default function Navbar() {
    const [isDarkMode, setIsDarkMode] = useState(false)

    return (
        <nav className="bg-black text-primary-foreground p-2 flex items-center justify-between">
            <div className="flex items-center">
                <Anvil strokeWidth={2} className="h-8 w-8 mr-2" />
                <span className="text-2xl">Circuit<b>Forge</b></span>
            </div>
            <div className="flex items-center space-x-10">
                <div className="flex items-center space-x-5"> {/* Increased space between buttons */}
                    <Button variant="ghost" size="icon">
                        <Codesandbox className="h-7 w-7" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Microchip className="h-7 w-7" />
                    </Button>
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
    )
}