import { useEffect, useState, useRef } from 'react'
import { Anvil, Moon, Sun, Settings, Microchip, Code, LucideIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

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

interface DropdownItem {
    label: string
    shortcut?: string
}

interface ToolbarDropdownProps {
    label: string
    items: DropdownItem[]
}

function ToolBarDropdown({ label, items }: ToolbarDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
            <Button variant="ghost" size="sm" className="hover:bg-gray-100  px-3 py-1.5">
                {label}
            </Button>
            {isOpen && (
                <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    {items.map((item, index) => (
                        <div key={index} className="px-4 py-2 hover:bg-gray-100 flex justify-between items-center">
                            <span className="text-sm">{item.label}</span>
                            {item.shortcut && <span className="text-xs text-gray-400">{item.shortcut}</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function ToolBar() {
    const [projectName, setProjectName] = useState("Untitled Project");
    const [isEditingName, setIsEditingName] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditingName && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditingName])

    const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProjectName(e.target.value);
    }

    const handleProjectNameBlur = () => {
        setIsEditingName(false);
    }

    const handleProjectNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            setIsEditingName(false);
        }
    }

    return (
        <div className="bg-white text-black py-0.5 flex justify-between items-center shadow-md">
            <div className="flex items-center">
                <ToolBarDropdown label="File" items={[
                    { label: "Save", shortcut: "⌘S" },
                    { label: "Save As", shortcut: "⇧⌘S" },
                    { label: "Export", shortcut: "⌘E" },
                    { label: "Import", shortcut: "⌘I" },
                ]} />
                <ToolBarDropdown label="Edit" items={[
                    { label: "Undo", shortcut: "⌘Z" },
                    { label: "Redo", shortcut: "⇧⌘Z" },
                    { label: "Cut", shortcut: "⌘X" },
                    { label: "Copy", shortcut: "⌘C" },
                    { label: "Paste", shortcut: "⌘V" },
                ]} />
                <ToolBarDropdown label="View" items={[
                    { label: "Zoom In", shortcut: "⌘+" },
                    { label: "Zoom Out", shortcut: "⌘-" },
                    { label: "Reset Zoom", shortcut: "⌘0" },
                ]} />
                <ToolBarDropdown label="Help" items={[
                    { label: "Documentation", shortcut: "F1" },
                    { label: "About" },
                ]} />
            </div>
        </div>
    )
}

export default function Navbar() {
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