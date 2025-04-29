import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, vi, beforeEach, expect } from "vitest";
import { ToolBar } from "@/components/layout/topbars/ToolBar";
import { useSimulatorContext, SimulatorContextType } from "@/context/SimulatorContext";
import { useSaveContext, SaveContextType } from "@/context/SaveContext";

vi.mock("@/context/SimulatorContext", () => ({
    useSimulatorContext: vi.fn(),
}));

vi.mock("@/context/SaveContext", () => ({
    useSaveContext: vi.fn(),
}));

const mockSimulatorContext: Partial<SimulatorContextType> = {
    projectName: "Test Project",
    setProjectName: vi.fn(),
    resetProject: vi.fn(),
    selectedComponent: null,
    clipboardComponent: null,
    copySelectedComponent: vi.fn(),
    cutSelectedComponent: vi.fn(),
    pasteClipboardComponent: vi.fn(),
};

const mockSaveContext: Partial<SaveContextType> = {
    saveProject: vi.fn(),
    exportProjectAsImage: vi.fn(),
    loadProject: vi.fn(),
    hasUnsavedChanges: true,
    currentFileHandle: {},
    setCurrentFileHandle: vi.fn(),
};

describe("ToolBar", () => {
    beforeEach(() => {
        vi.mocked(useSimulatorContext).mockReturnValue(mockSimulatorContext as SimulatorContextType);
        vi.mocked(useSaveContext).mockReturnValue(mockSaveContext as SaveContextType);
    });

    it("should render the toolbar with all menu items", () => {
        render(<ToolBar onZoomIn={vi.fn()} onZoomOut={vi.fn()} onZoomReset={vi.fn()} />);
        expect(screen.getByText("File")).toBeInTheDocument();
        expect(screen.getByText("Edit")).toBeInTheDocument();
        expect(screen.getByText("View")).toBeInTheDocument();
        expect(screen.getByText("Help")).toBeInTheDocument();
    });

    it("should trigger 'New Project' confirmation dialog when clicked", async () => {
        render(<ToolBar onZoomIn={vi.fn()} onZoomOut={vi.fn()} onZoomReset={vi.fn()} />);
        await userEvent.click(screen.getByText("File"));
        await userEvent.click(screen.getByText("New Project"));
        expect(screen.getByText("New Project")).toBeInTheDocument();
    });

    it("should call saveProject when 'Save' is clicked", async () => {
        render(<ToolBar onZoomIn={vi.fn()} onZoomOut={vi.fn()} onZoomReset={vi.fn()} />);
        await userEvent.click(screen.getByText("File"));
        await userEvent.click(screen.getByText("Save"));
        expect(mockSaveContext.saveProject).toHaveBeenCalledWith(false);
    });

    it("should call exportProjectAsImage when 'Export as PNG' is clicked", async () => {
        render(<ToolBar onZoomIn={vi.fn()} onZoomOut={vi.fn()} onZoomReset={vi.fn()} />);
        await userEvent.click(screen.getByText("File"));
        await userEvent.click(screen.getByText("Export as PNG"));
        expect(mockSaveContext.exportProjectAsImage).toHaveBeenCalled();
    });

    it("should open documentation when 'Documentation' is clicked", async () => {
        const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
        render(<ToolBar onZoomIn={vi.fn()} onZoomOut={vi.fn()} onZoomReset={vi.fn()} />);
        await userEvent.click(screen.getByText("Help"));
        await userEvent.click(screen.getByText("Documentation"));
        expect(openSpy).toHaveBeenCalledWith("https://circuit-forge.gitbook.io/circuit-forge", "_blank");
    });

    // it("should handle keyboard shortcuts for zooming", async () => {
    //     const onZoomIn = vi.fn();
    //     const onZoomOut = vi.fn();
    //     const onZoomReset = vi.fn();
    //     render(<ToolBar onZoomIn={onZoomIn} onZoomOut={onZoomOut} onZoomReset={onZoomReset} />);

    //     await userEvent.keyboard("{Meta>}={/Meta}");
    //     expect(onZoomIn).toHaveBeenCalled();

    //     await userEvent.keyboard("{Meta>}-{/Meta}");
    //     expect(onZoomOut).toHaveBeenCalled();

    //     await userEvent.keyboard("{Meta>}0{/Meta}");
    //     expect(onZoomReset).toHaveBeenCalled();
    // });

    it("should display unsaved changes indicator when there are unsaved changes", () => {
        render(<ToolBar onZoomIn={vi.fn()} onZoomOut={vi.fn()} onZoomReset={vi.fn()} />);
        expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    });

    it("should display the last saved time when there are no unsaved changes", () => {
        vi.mocked(useSaveContext).mockReturnValue({
            ...mockSaveContext,
            hasUnsavedChanges: false,
            currentProject: { metadata: { lastSaved: Date.now() } },
        } as SaveContextType);

        render(<ToolBar onZoomIn={vi.fn()} onZoomOut={vi.fn()} onZoomReset={vi.fn()} />);
        expect(screen.getByText(/Saved/)).toBeInTheDocument();
    });
    // it("should handle keyboard shortcuts for File menu", async () => {
    //     const handleNewProject = vi.fn();
    //     const handleLoadProject = vi.fn();
    //     const handleSave = vi.fn();
    //     const handleSaveAs = vi.fn();
    //     const handleExportAsImage = vi.fn();

    //     render(
    //         <ToolBar
    //             onZoomIn={vi.fn()}
    //             onZoomOut={vi.fn()}
    //             onZoomReset={vi.fn()}
    //         />
    //     );

    //     // Mocking the functions
    //     mockSaveContext.saveProject = handleSave;
    //     mockSaveContext.exportProjectAsImage = handleExportAsImage;

    //     // Trigger New Project shortcut
    //     await userEvent.keyboard("{Meta>}{Shift>}n{/Shift}{/Meta}");
    //     expect(handleNewProject).toHaveBeenCalled();

    //     // Trigger Load Project shortcut
    //     await userEvent.keyboard("{Meta>}l{/Meta}");
    //     expect(handleLoadProject).toHaveBeenCalled();

    //     // Trigger Save shortcut
    //     await userEvent.keyboard("{Meta>}s{/Meta}");
    //     expect(handleSave).toHaveBeenCalledWith(false);

    //     // Trigger Save As shortcut
    //     await userEvent.keyboard("{Meta>}{Shift>}s{/Shift}{/Meta}");
    //     expect(handleSaveAs).toHaveBeenCalled();

    //     // Trigger Export as PNG shortcut
    //     await userEvent.keyboard("{Meta>}e{/Meta}");
    //     expect(handleExportAsImage).toHaveBeenCalled();
    // });

    // it("should handle keyboard shortcuts for Edit menu", async () => {
    //     const cutSelectedComponent = vi.fn();
    //     const handleCopy = vi.fn();
    //     const handlePaste = vi.fn();

    //     render(
    //         <ToolBar
    //             onZoomIn={vi.fn()}
    //             onZoomOut={vi.fn()}
    //             onZoomReset={vi.fn()}
    //         />
    //     );

    //     // Mocking the functions
    //     mockSimulatorContext.cutSelectedComponent = cutSelectedComponent;
    //     mockSimulatorContext.copySelectedComponent = handleCopy;
    //     mockSimulatorContext.pasteClipboardComponent = handlePaste;

    //     // Trigger Cut shortcut
    //     await userEvent.keyboard("{Meta>}x{/Meta}");
    //     expect(cutSelectedComponent).toHaveBeenCalled();

    //     // Trigger Copy shortcut
    //     await userEvent.keyboard("{Meta>}c{/Meta}");
    //     expect(handleCopy).toHaveBeenCalled();

    //     // Trigger Paste shortcut
    //     await userEvent.keyboard("{Meta>}v{/Meta}");
    //     expect(handlePaste).toHaveBeenCalled();
    // });

    // it("should handle keyboard shortcuts for View menu", async () => {
    //     const onZoomIn = vi.fn();
    //     const onZoomOut = vi.fn();
    //     const onZoomReset = vi.fn();

    //     render(
    //         <ToolBar
    //             onZoomIn={onZoomIn}
    //             onZoomOut={onZoomOut}
    //             onZoomReset={onZoomReset}
    //         />
    //     );

    //     // Trigger Zoom In shortcut
    //     await userEvent.keyboard("{Meta>}={/Meta}");
    //     expect(onZoomIn).toHaveBeenCalled();

    //     // Trigger Zoom Out shortcut
    //     await userEvent.keyboard("{Meta>}-{/Meta}");
    //     expect(onZoomOut).toHaveBeenCalled();

    //     // Trigger Reset Zoom shortcut
    //     await userEvent.keyboard("{Meta>}0{/Meta}");
    //     expect(onZoomReset).toHaveBeenCalled();
    // });

    // it("should handle keyboard shortcuts for Help menu", async () => {
    //     render(
    //         <ToolBar
    //             onZoomIn={vi.fn()}
    //             onZoomOut={vi.fn()}
    //             onZoomReset={vi.fn()}
    //         />
    //     );

    //     // Mocking the functions
    //     vi.spyOn(window, "open").mockImplementation(() => null);

    //     // Trigger Documentation shortcut
    //     await userEvent.keyboard("{Meta>}d{/Meta}");
    //     expect(window.open).toHaveBeenCalledOnce();

    //     // Trigger About shortcut
    //     await userEvent.keyboard("{Meta>}a{/Meta}");
    //     expect(window.open).toHaveBeenCalledOnce();
    // });
});