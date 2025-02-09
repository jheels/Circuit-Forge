import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSimulatorContext } from "@/context/SimulatorContext"
import { useSaveContext } from "@/context/SaveContext"
import { Clock } from 'lucide-react';
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
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
    disabled?: boolean
    onClick?: () => void
}

interface ToolBarDropdownProps {
    label: string
    items: DropdownItem[]
}

interface ToolBarProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
}

// Save status indicator component
const SaveIndicator: React.FC = () => {
    const { hasUnsavedChanges, currentProject } = useSaveContext();

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {hasUnsavedChanges ? (
                <span className="text-yellow-500 font-semibold">Unsaved changes</span>
            ) : currentProject?.metadata.lastSaved ? (
                <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-green-500" strokeWidth={3} />
                    <span className="text-green-500 font-semibold">
                        {`Saved ${new Date(currentProject.metadata.lastSaved).toLocaleTimeString()}`}
                    </span>
                </div>
            ) : null}
        </div>
    );
};

function ToolBarDropdown({ label, items }: ToolBarDropdownProps) {
    return (
        <MenubarMenu>
            <MenubarTrigger className="px-3 py-1.5">{label}</MenubarTrigger>
            <MenubarContent>
                {items.map((item, index) =>
                    item.isSeparator ? (
                        <MenubarSeparator key={index} />
                    ) : (
                        <MenubarItem key={index} onSelect={item.onClick} disabled={item.disabled}>
                            {item.label}
                            {item.shortcut && <MenubarShortcut>{item.shortcut}</MenubarShortcut>}
                        </MenubarItem>
                    )
                )}
            </MenubarContent>
        </MenubarMenu>
    )
}

const usePreventUnloadWithUnsavedChanges = (hasUnsavedChanges: boolean) => {
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                event.preventDefault();
                event.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);
};

export function ToolBar({ onZoomIn, onZoomOut, onZoomReset }: ToolBarProps) {
    const { projectName, setProjectName, resetProject } = useSimulatorContext();
    const { saveProject, exportProjectAsImage, loadProject, hasUnsavedChanges, currentFileHandle, setCurrentFileHandle } = useSaveContext();
    const [previousProjectName, setPreviousProjectName] = useState(projectName)
    const [isEditingName, setIsEditingName] = useState(false)
    const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const MAX_LENGTH = 20

    useEffect(() => {
        if (isEditingName && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isEditingName])

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

    const onDocumentationClick = () => {
        window.open("https://circuit-forge.gitbook.io/circuit-forge", "_blank")
    }

    const onAboutClick = () => {
        window.open("https://github.com/jheels/Circuit-Forge", "_blank")
    }

    const handleNewProject = () => {
        setIsAlertDialogOpen(true)
    }

    const confirmNewProject = () => {
        setCurrentFileHandle(null);
        resetProject()
        setIsAlertDialogOpen(false)
    }

    const handleSave = async () => {
        const result = await saveProject();
        if (!result.success) {
            console.error(result.error);
        }
    }

    const handleSaveAs = async () => {
        const result = await saveProject(true);
        if (!result.success) {
            console.error(result.error);
        }
    }

    const handleExportAsImage = async () => {
        await exportProjectAsImage();
    }

    const handleLoadProject = async () => {
        await loadProject();
    }

    const menuItems = [
        {
            label: "File",
            items: [
                { label: "New Project", shortcut: "⌘N", onClick: handleNewProject },
                { label: "Load Project", shortcut: "⌘L", onClick: handleLoadProject },
                { isSeparator: true },
                { label: "Save", shortcut: "⌘S", onClick: handleSave, disabled: !hasUnsavedChanges || !currentFileHandle },
                { label: "Save As", shortcut: "⌘⇧S", onClick: handleSaveAs },
                { isSeparator: true },
                { label: "Export as PNG", shortcut: "", onClick: handleExportAsImage },
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
                { label: "Zoom In", shortcut: "⌘+", onClick: onZoomIn },
                { label: "Zoom Out", shortcut: "⌘-", onClick: onZoomOut },
                { isSeparator: true },
                { label: "Reset Zoom", shortcut: "⌘0", onClick: onZoomReset },
            ],
        },
        {
            label: "Help",
            items: [
                { label: "Documentation", shortcut: "F1", onClick: onDocumentationClick },
                { label: "About", onClick: onAboutClick },
            ],
        },
    ]

    usePreventUnloadWithUnsavedChanges(hasUnsavedChanges);

    return (
        <div className="bg-white text-foreground flex justify-between items-center shadow-md z-10">
            <Menubar className="border-none shadow-none">
                {menuItems.map((menu, index) => (
                    <ToolBarDropdown key={index} label={menu.label} items={menu.items} />
                ))}
            </Menubar>
            <div className="flex items-center space-x-4 pr-3">
            <SaveIndicator />
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
            <ConfirmationDialog
                open={isAlertDialogOpen}
                onOpenChange={setIsAlertDialogOpen}
                title="New Project"
                description="Are you sure you want to create a new project? This action cannot be undone."
                onConfirm={confirmNewProject}
            />
        </div>
    )
}