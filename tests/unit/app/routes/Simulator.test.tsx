import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Simulator } from "@/app/routes/Simulator";
import * as Editor from "@/components/layout/Editor";
import * as SimulatorContext from "@/context/SimulatorContext";
import * as SaveContext from "@/context/SaveContext";
import { UIProvider } from "@/context/UIContext";
import { DndProviderWrapper } from "@/context/DndContext";

vi.mock('react-konva', () => ({
    __esModule: true,
    Stage: (props: any) => <div data-testid="mock-stage" {...props} />,
    Layer: (props: any) => <div data-testid="mock-layer" {...props} />,
    default: {},
}));

const renderWithContext = (component: React.ReactNode) => {
    return render(
        <DndProviderWrapper>
            <UIProvider>
                {component}
            </UIProvider>
        </DndProviderWrapper>
    );
}

describe("Simulator", () => {
    it("renders without crashing", () => {
        const { container } = renderWithContext(<Simulator />);
        expect(container).toBeTruthy();
    });

    it("provides stageRef to SaveProvider and Editor", () => {
        const editorSpy = vi.spyOn(Editor, "Editor");
        renderWithContext(<Simulator />);
        expect(editorSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                stageRef: expect.any(Object),
            }),
            expect.anything()
        );
        editorSpy.mockRestore();
    });

    it("wraps Editor with SimulatorContextProvider and SaveProvider", () => {
        const simulatorContextSpy = vi.spyOn(SimulatorContext, "SimulatorContextProvider");
        const saveProviderSpy = vi.spyOn(SaveContext, "SaveProvider");
        renderWithContext(<Simulator/>);
        expect(simulatorContextSpy).toHaveBeenCalled();
        expect(saveProviderSpy).toHaveBeenCalled();
        simulatorContextSpy.mockRestore();
        saveProviderSpy.mockRestore();
    });
});
