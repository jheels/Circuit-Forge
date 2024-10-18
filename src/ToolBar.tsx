import { useEffect, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

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
    const [previousProjectName, setPreviousProjectName] = useState(projectName)
    const [isEditingName, setIsEditingName] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const MAX_LENGTH = 20;

    useEffect(() => {
        if (isEditingName && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditingName])

    const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProjectName(e.target.value);
    }

    const handleProjectNameBlur = () => {
        if (projectName.trim() === "") {
            setProjectName(previousProjectName)
        } else {
            setPreviousProjectName(projectName)
        }
        setIsEditingName(false);
    }

    const handleProjectNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleProjectNameBlur();
        }
    }

    const clipText = (text: string, maxLength: number) => {
        return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
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
                        className="font-semibold hover:bg-gray-100 cursor-text"
                        onClick={() => setIsEditingName(true)}
                    >
                        {clipText(projectName, MAX_LENGTH)}
                    </Button>
                )}
            </div>

        </div>
    )
}

export default ToolBar;