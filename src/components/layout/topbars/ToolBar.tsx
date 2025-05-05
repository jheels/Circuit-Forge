import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSimulatorContext } from "@/context/SimulatorContext"
import { useSaveContext } from "@/context/SaveContext"
import { Clock } from 'lucide-react';
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import { RotationControls } from "@/components/RotationControls"
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger,
} from "@/components/ui/menubar"
import { getOS, sendErrorToast, sendSuccessToast } from "@/lib/utils"

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

/**
 * 
 * @returns {JSX.Element} - The SaveIndicator component
 * @description - A component that displays the save status of the project.
 * If there are unsaved changes, it shows "Unsaved changes" in yellow.
 * If the project is saved, it shows the last saved time in green.
 */
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

// Custom hook to prevent page unload if there are unsaved changes
// This hook adds an event listener to the window's beforeunload event
// and prevents the default action if there are unsaved changes
const usePreventUnloadWithUnsavedChanges = (hasUnsavedChanges: boolean) => {
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                event.preventDefault();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);
};

/**
 * 
 * @param {onZoomIn} - Function to handle zoom in
 * @param {onZoomOut} - Function to handle zoom out
 * @param {onZoomReset} - Function to handle zoom reset
 * @description - A toolbar component that contains the project name, save indicator, and menu items.
 * It uses the Menubar component to create a menu bar with dropdowns for File, Edit, View, and Help.
 * The toolbar also includes a save indicator and a project name input field.
 * @returns {JSX.Element} - The ToolBar component
 * @see https://ui.shadcn.com/docs/components/menubar
 */
export function ToolBar({ onZoomIn, onZoomOut, onZoomReset }: ToolBarProps) {
    const {
        projectName,
        setProjectName,
        resetProject,
        selectedComponent,
        clipboardComponent,
        copySelectedComponent,
        cutSelectedComponent,
        pasteClipboardComponent,
    } = useSimulatorContext();
    const {
        saveProject,
        exportProjectAsImage,
        loadProject,
        hasUnsavedChanges,
        currentFileHandle,
        setCurrentFileHandle,
    } = useSaveContext();
    const [previousProjectName, setPreviousProjectName] = useState(projectName)
    const [isEditingName, setIsEditingName] = useState(false)
    const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const MAX_LENGTH = 20
    const OS = getOS();

    const shortcutSymbol = OS === "mac" ? "⌘" : "Ctrl ";

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

    const onDocumentationClick = useCallback(() => {
        window.open("https://circuit-forge.gitbook.io/circuit-forge", "_blank")
    }, []);

    const onAboutClick = () => {
        window.open("https://github.com/jheels/Circuit-Forge", "_blank")
    }

    const handleNewProject = useCallback(() => {
        setIsAlertDialogOpen(true);
    }, []);

    const confirmNewProject = () => {
        setCurrentFileHandle(null);
        resetProject()
        setIsAlertDialogOpen(false)
    }

    // unifies save and save as logic
    const handleSaveLogic = useCallback(async (isSaveAs: boolean) => {
        try {
            const result = await saveProject(isSaveAs);
            if (result.success) {
                sendSuccessToast('Project saved');
            } else {
                console.error('Error saving project:', result.error);
            }
        } catch (error) {
            console.error('Unexpected error during save:', error);
        }
    }, [saveProject]);

    const handleSave = useCallback(async () => {
        await handleSaveLogic(false);
    }, [handleSaveLogic]);

    const handleSaveAs = useCallback(async () => {
        await handleSaveLogic(true);
    }, [handleSaveLogic]);

    const handleLoadProject = useCallback(async () => {
        try {
            const result = await loadProject();
            if (result.success) {
                sendSuccessToast('Project loaded');
            } else {
                sendErrorToast(result.error || 'Failed to load project');
                console.error('Error loading project:', result.error);
            }
        } catch (error) {
            console.error('Unexpected error during load:', error);
        }
    }, [loadProject]);

    const handleExportAsImage = useCallback(async () => {
        await exportProjectAsImage();
    }, [exportProjectAsImage]);

    // Handle keyboard shortcuts
    // This effect listens for keydown events and triggers the corresponding actions
    // based on the pressed keys and modifiers (like metaKey for Command/Ctrl)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        if (e.shiftKey) {
                            e.preventDefault();
                            handleNewProject();
                        }
                        break;
                    case 'l':
                        e.preventDefault();
                        handleLoadProject();
                        break;
                    case 's':
                        e.preventDefault();
                        if (e.shiftKey) {
                            handleSaveAs();
                        } else if (hasUnsavedChanges && currentFileHandle) {
                            handleSave();
                        } else if (!currentFileHandle) {
                            sendErrorToast('Must use Save As first.');
                        }
                        break;
                    case 'x':
                        e.preventDefault();
                        if (selectedComponent) cutSelectedComponent();
                        break;
                    case 'c':
                        e.preventDefault();
                        if (selectedComponent) copySelectedComponent();
                        break;
                    case 'v':
                        e.preventDefault();
                        if (clipboardComponent) pasteClipboardComponent();
                        break;
                    case 'e':
                        e.preventDefault();
                        handleExportAsImage();
                        sendSuccessToast('Exported as PNG');
                        break;
                    case 'd':
                        e.preventDefault();
                        onDocumentationClick();
                        break;
                    case '=':
                        e.preventDefault();
                        onZoomIn();
                        break;
                    case '-':
                        e.preventDefault();
                        onZoomOut();
                        break;
                    case '0':
                        e.preventDefault();
                        onZoomReset();
                        break;
                    default:
                        break;
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleNewProject, handleLoadProject, handleSaveAs, handleSave, handleExportAsImage, onDocumentationClick, onZoomIn, onZoomOut, onZoomReset, hasUnsavedChanges, currentFileHandle, selectedComponent, cutSelectedComponent, copySelectedComponent, clipboardComponent, pasteClipboardComponent]);

    // Structure the menu items for the Menubar
    // Each menu item can have sub-items, shortcuts, and separators
    const menuItems = [
        {
            label: "File",
            items: [
                { label: "New Project", shortcut: shortcutSymbol + "⇧N", onClick: handleNewProject },
                { label: "Load Project", shortcut: shortcutSymbol + "L", onClick: handleLoadProject },
                { isSeparator: true },
                { label: "Save", shortcut: shortcutSymbol + "S", onClick: handleSave, disabled: !hasUnsavedChanges || !currentFileHandle },
                { label: "Save As", shortcut: shortcutSymbol + "⇧S", onClick: handleSaveAs },
                { isSeparator: true },
                { label: "Export as PNG", shortcut: shortcutSymbol + "E", onClick: handleExportAsImage },
            ],
        },
        {
            label: "Edit",
            items: [
                { label: "Undo", shortcut: shortcutSymbol + "Z" },
                { label: "Redo", shortcut: shortcutSymbol + "⇧Z" },
                { isSeparator: true },
                { label: "Cut", shortcut: shortcutSymbol + "X", onClick: cutSelectedComponent, disabled: !selectedComponent },
                { label: "Copy", shortcut: shortcutSymbol + "C", onClick: copySelectedComponent, disabled: !selectedComponent },
                { label: "Paste", shortcut: shortcutSymbol + "V", onClick: pasteClipboardComponent, disabled: !clipboardComponent },
            ],
        },
        {
            label: "View",
            items: [
                { label: "Zoom In", shortcut: shortcutSymbol + "+", onClick: onZoomIn },
                { label: "Zoom Out", shortcut: shortcutSymbol + "-", onClick: onZoomOut },
                { isSeparator: true },
                { label: "Reset Zoom", shortcut: shortcutSymbol + "0", onClick: onZoomReset },
            ],
        },
        {
            label: "Help",
            items: [
                { label: "Documentation", shortcut: shortcutSymbol + "D", onClick: onDocumentationClick },
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
            {/* show component rotation when selected */}
            <RotationControls />
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