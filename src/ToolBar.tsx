import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger,
} from "@/components/ui/menubar"

interface DropdownItem {
    label?: string
    shortcut?: string
    isSeparator?: boolean
}

interface ToolbarDropdownProps {
    label: string
    items: DropdownItem[]
}

function ToolbarDropdown({ label, items }: ToolbarDropdownProps) {
    return (
        <MenubarMenu>
            <MenubarTrigger className="px-3 py-1.5">{label}</MenubarTrigger>
            <MenubarContent>
                {items.map((item, index) =>
                    item.isSeparator ? (
                        <MenubarSeparator key={index} />
                    ) : (
                        <MenubarItem key={index}>
                            {item.label}
                            {item.shortcut && <MenubarShortcut>{item.shortcut}</MenubarShortcut>}
                        </MenubarItem>
                    )
                )}
            </MenubarContent>
        </MenubarMenu>
    )
}

function Toolbar() {
    const [projectName, setProjectName] = useState(() => {
        // Retrieve the project name from localStorage if it exists
        return localStorage.getItem('projectName') || 'Untitled Project';
    });
    const [previousProjectName, setPreviousProjectName] = useState(projectName)
    const [isEditingName, setIsEditingName] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const MAX_LENGTH = 20

    useEffect(() => {
        if (isEditingName && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isEditingName])

    useEffect(() => {
        // Save the project name to localStorage whenever it changes
        localStorage.setItem('projectName', projectName);
    }, [projectName]);


    const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProjectName(e.target.value)
    }

    const handleProjectNameBlur = () => {
        if (projectName.trim() === "") {
            setProjectName(previousProjectName)
        } else {
            setPreviousProjectName(projectName)
        }
        setIsEditingName(false)
    }

    const handleProjectNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleProjectNameBlur()
        }
    }

    const clipText = (text: string, maxLength: number) => {
        return text.length > maxLength ? text.slice(0, maxLength) + "..." : text
    }

    const menuItems = [
        {
            label: "File",
            items: [
                { label: "New Project", shortcut: "⌘N" },
                { label: "Save", shortcut: "⌘S" },
                { label: "Save As", shortcut: "⇧⌘S" },
                { isSeparator: true },
                { label: "Export", shortcut: "⌘E" },
                { label: "Import", shortcut: "⌘I" },
            ],
        },
        {
            label: "Edit",
            items: [
                { label: "Undo", shortcut: "⌘Z" },
                { label: "Redo", shortcut: "⇧⌘Z" },
                { isSeparator: true },
                { label: "Cut", shortcut: "⌘X" },
                { label: "Copy", shortcut: "⌘C" },
                { label: "Paste", shortcut: "⌘V" },
            ],
        },
        {
            label: "View",
            items: [
                { label: "Zoom In", shortcut: "⌘+" },
                { label: "Zoom Out", shortcut: "⌘-" },
                { isSeparator: true },
                { label: "Reset Zoom", shortcut: "⌘0" },
            ],
        },
        {
            label: "Help",
            items: [
                { label: "Documentation", shortcut: "F1" },
                { label: "About" },
            ],
        },
    ]

    return (
        <div className="bg-white text-foreground flex justify-between items-center shadow-md z-10">
            <Menubar className="border-none shadow-none">
                {menuItems.map((menu, index) => (
                    <ToolbarDropdown key={index} label={menu.label} items={menu.items} />
                ))}
            </Menubar>
            <div className="flex items-center space-x-4 pr-3">
                {isEditingName ? (
                    <Input
                        ref={inputRef}
                        value={projectName}
                        onChange={handleProjectNameChange}
                        onBlur={handleProjectNameBlur}
                        onKeyDown={handleProjectNameKeyDown}
                        className="h-7 font-semibold w-48"
                    />
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="font-semibold hover:bg-accent hover:text-accent-foreground cursor-text"
                        onClick={() => setIsEditingName(true)}
                    >
                        {clipText(projectName, MAX_LENGTH)}
                    </Button>
                )}
            </div>
        </div>
    )
}

export default Toolbar