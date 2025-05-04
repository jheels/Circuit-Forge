import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { DipSwitch } from "@/components/circuit/passive/DIPSwitch";
import { DIPSwitchComponent } from "@/definitions/components/dipswitch";
import { assert } from "console";

// Mock react-konva components
vi.mock("react-konva", () => ({
    Rect: (props: any) => <rect {...props} data-testid="rect" />,
    Group: (props: any) => <g {...props} data-testid="group">{props.children}</g>,
    Text: (props: any) => <text {...props} data-testid="text">{props.text}</text>,
}));

// Mock BaseComponent
vi.mock("@/components/circuit/passive/../base/BaseComponent", () => ({
    BaseComponent: (props: any) => <div data-testid="base">{props.children}</div>,
}));

// Mock useSimulatorContext
const mockUpdateComponent = vi.fn();
const mockContext = {
    components: {},
    selectedComponent: "",
    updateComponent: mockUpdateComponent,
};
vi.mock("@/context/SimulatorContext", () => ({
    useSimulatorContext: () => mockContext,
}));

const createMockComponent = (overrides?: Partial<DIPSwitchComponent>): DIPSwitchComponent => ({
    editorID: "DIPSwitch-1",
    type: "dip-switch",
    dimensions: { width: 20, height: 40 },
    rotation: 0,
    position: { x: 0, y: 0 },
    switchStates: Array(8).fill(false),
    properties: {},
    connectors: {},
    ...overrides,
});

describe("DipSwitch", () => {
    beforeEach(() => {
        mockUpdateComponent.mockClear();
    });

    it("renders nothing if component is not found", () => {
        mockContext.components = {};
        const { container } = render(<DipSwitch componentID="not-exist" />);
        expect(container.firstChild).toBeNull();
    });

    it("renders the correct number of switches", () => {
        const component = createMockComponent();
        mockContext.components = { [component.editorID]: component };
        const { getAllByTestId } = render(<DipSwitch componentID={component.editorID} />);
        // Each switch has a group for the slider and toggle, so count number of groups with text children
        const texts = getAllByTestId("text").filter(t => /^\d+$/.test(t.textContent ?? ""));
        expect(texts.length).toBe(8);
    });

    it("renders ON label", () => {
        const component = createMockComponent();
        mockContext.components = { [component.editorID]: component };
        const { getByText } = render(<DipSwitch componentID={component.editorID} />);
        expect(getByText("ON")).toBeTruthy();
    });


    it("toggles switch state on click", () => {
        const component = createMockComponent();
        mockContext.components = { [component.editorID]: component };
        const { getAllByTestId } = render(<DipSwitch componentID={component.editorID} />);
        // Each switch has two rects, the second is the toggle button
        const toggleRects = getAllByTestId("rect").filter((_, i) => i > 0); // skip body
        fireEvent.click(toggleRects[1]); // Click the first switch's toggle
        expect(mockUpdateComponent).toHaveBeenCalledWith(
            component.editorID,
            expect.objectContaining({
                switchStates: [true, false, false, false, false, false, false, false],
            })
        );
    });

    it("toggles correct switch when clicking different toggles", () => {
        const component = createMockComponent();
        mockContext.components = { [component.editorID]: component };
        const { getAllByTestId } = render(<DipSwitch componentID={component.editorID} />);
        const toggleRects = getAllByTestId("rect").filter((_, i) => i > 0);
        // Each switch has two rects, so toggleRects[2] is the second switch's toggle
        fireEvent.click(toggleRects[3]);
        expect(mockUpdateComponent).toHaveBeenCalledWith(
            component.editorID,
            expect.objectContaining({
                switchStates: [false, true, false, false, false, false, false, false],
            })
        );
    });
});