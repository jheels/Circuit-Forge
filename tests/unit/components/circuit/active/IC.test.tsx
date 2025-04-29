import { render } from "@testing-library/react";
import { IC } from "@/components/circuit/active/IC";
import { useSimulatorContext } from "@/context/SimulatorContext";
import type { ICComponent } from "@/definitions/components/ic";
import type { ComponentProps } from "@/definitions/general";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock react-konva components
vi.mock("react-konva", () => ({
    Rect: (props: any) => <rect {...props} data-testid="Rect" />,
    Group: (props: any) => <g {...props} data-testid="Group">{props.children}</g>,
    Arc: (props: any) => <arc {...props} data-testid="Arc" />,
    Text: (props: any) => <text {...props} data-testid="Text">{props.text}</text>,
    Circle: (props: any) => <circle {...props} data-testid="Circle" />,
    Star: (props: any) => <polygon {...props} data-testid="Star" />,
}));

vi.mock("@/context/SimulatorContext");

const mockICComponent: ICComponent = {
    editorID: "ic1",
    type: "ic",
    icType: "555",
    dimensions: { width: 20, height: 10 },
    rotation: 0,
    position: { x: 0, y: 0 },
    properties: {
        name: "Mock IC",
        type: "ic",
    },
    connectors: {
        "0": {
            id: "0",
            componentID: "ic1",
            type: "bidirectional",
            offset: { x: 0, y: 0.1 },
            hitAreaSize: 2.5,
            metadata: {},
            isConnected: false,
        },
        "1": {
            id: "1",
            componentID: "ic1",
            type: "bidirectional",
            offset: { x: 1, y: 0.9 },
            hitAreaSize: 2.5,
            metadata: {},
            isConnected: false,
        },
    },
};

const baseContext = {
    components: { ic1: mockICComponent },
    selectedComponent: null,
    componentElectricalValues: {},
};

function mockContext(ctx: Partial<typeof baseContext>) {
    (useSimulatorContext as vi.Mock).mockReturnValue({ ...baseContext, ...ctx });
}

describe("IC component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders nothing if component not found", () => {
        mockContext({ components: {} });
        const { container } = render(<IC componentID="ic1" />);
        expect(container.firstChild).toBeNull();
    });

    it("renders IC body and pins", () => {
        mockContext({});
        const { getAllByTestId, getByText } = render(<IC componentID="ic1" />);
        expect(getAllByTestId("Rect").length).toBeGreaterThanOrEqual(3); // pins + body
        expect(getAllByTestId("Group").length).toBeGreaterThan(0);
        expect(getByText("555")).toBeInTheDocument();
        expect(getAllByTestId("Circle").length).toBe(1);
        expect(getAllByTestId("Arc").length).toBe(1);
    });

    it("renders with selectedComponent stroke", () => {
        mockContext({ selectedComponent: "ic1" });
        const { container } = render(<IC componentID="ic1" />);
        const rects = container.querySelectorAll("rect");
        expect(rects[2].getAttribute("stroke")).toBe('rgba(143,217,251, 0.5)')
        
    });

    it("renders explosion effect if Vcc out of range (too high)", () => {
        mockContext({
            componentElectricalValues: { ic1: [{ voltage: 6 }] },
        });
        const { getAllByTestId } = render(<IC componentID="ic1" />);
        expect(getAllByTestId("Star").length).toBe(2);
    });

    it("does not render explosion if Vcc is zero", () => {
        mockContext({
            componentElectricalValues: { ic1: [{ voltage: 0 }] },
        });
        const { queryAllByTestId } = render(<IC componentID="ic1" />);
        expect(queryAllByTestId("Star").length).toBe(0);
    });

    it("renders correct number of pins", () => {
        mockContext({});
        const { container } = render(<IC componentID="ic1" />);
        const pins = Array.from(container.querySelectorAll('rect')).filter(
            (pin) => pin.getAttribute('data-testid') === 'Rect' && pin.getAttribute('width') === '2.5'
        );
        expect(pins.length).toBe(2);


    });
});