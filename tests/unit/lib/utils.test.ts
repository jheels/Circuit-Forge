import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { findConnectorIDAtPoint, calculateDistance, rotatePoint, getOS } from "@/lib/utils";
import type { EditorComponent, Point } from "@/definitions/general";
import { isPointInConnector } from "@/definitions/connector";

// Mock for isPointInConnector
vi.mock("@/definitions/connector", () => ({
    isPointInConnector: vi.fn(),
}));


describe("findConnectorIDAtPoint", () => {
    const point: Point = { x: 10, y: 10 };
    const connectorA = { id: "A" } as any;
    const connectorB = { id: "B" } as any;

    let components: Record<string, EditorComponent>;

    beforeEach(() => {
        vi.clearAllMocks();
        components = {
            comp1: {
                editorID: "1",
                type: "resistor",
                dimensions: { width: 10, height: 10 },
                rotation: 0,
                position: { x: 0, y: 0 },
                properties: {},
                connectors: { a: connectorA }
            },
            comp2: {
                editorID: "2",
                type: "breadboard",
                dimensions: { width: 20, height: 20 },
                rotation: 0,
                position: { x: 5, y: 5 },
                properties: {},
                connectors: { b: connectorB }
            }
        };
    });

    it("returns connector id if point is in a non-breadboard connector", () => {
        (isPointInConnector as any).mockImplementation((pt, conn) => conn === connectorA);
        expect(findConnectorIDAtPoint(point, components)).toBe("A");
    });

    it("returns connector id if point is in a breadboard connector", () => {
        (isPointInConnector as any).mockImplementation((pt, conn) => conn === connectorB);
        expect(findConnectorIDAtPoint(point, components)).toBe("B");
    });

    it("returns null if point is not in any connector", () => {
        (isPointInConnector as any).mockReturnValue(false);
        expect(findConnectorIDAtPoint(point, components)).toBeNull();
    });
});

describe("calculateDistance", () => {
    it("returns 0 for the same point", () => {
        const p: Point = { x: 1, y: 1 };
        expect(calculateDistance(p, p)).toBe(0);
    });

    it("calculates correct distance for horizontal points", () => {
        expect(calculateDistance({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3);
    });

    it("calculates correct distance for vertical points", () => {
        expect(calculateDistance({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(4);
    });

    it("calculates correct distance for diagonal points", () => {
        expect(calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });
});

describe("rotatePoint", () => {
    const origin: Point = { x: 0, y: 0 };

    it("returns the same point for 0 degrees", () => {
        expect(rotatePoint({ x: 1, y: 0 }, origin, 0)).toEqual({ x: 1, y: 0 });
    });

    it("rotates 90 degrees counterclockwise", () => {
        const result = rotatePoint({ x: 1, y: 0 }, origin, 90);
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(1);
    });

    it("rotates 180 degrees", () => {
        const result = rotatePoint({ x: 1, y: 0 }, origin, 180);
        expect(result.x).toBeCloseTo(-1);
        expect(result.y).toBeCloseTo(0);
    });

    it("rotates around a non-origin point", () => {
        const result = rotatePoint({ x: 2, y: 1 }, { x: 1, y: 1 }, 90);
        expect(result.x).toBeCloseTo(1);
        expect(result.y).toBeCloseTo(2);
    });
});

describe("getOS", () => {
    const originalUserAgent = navigator.userAgent;

    function setUserAgent(ua: string) {
        Object.defineProperty(window.navigator, "userAgent", {
            value: ua,
            configurable: true,
        });
    }

    afterEach(() => {
        setUserAgent(originalUserAgent);
    });

    it("detects mac", () => {
        setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X)");
        expect(getOS()).toBe("mac");
    });

    it("detects linux", () => {
        setUserAgent("Mozilla/5.0 (X11; Linux x86_64)");
        expect(getOS()).toBe("linux");
    });

    it("detects windows", () => {
        setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
        expect(getOS()).toBe("windows");
    });

    it("returns unknown for other platforms", () => {
        setUserAgent("Mozilla/5.0 (OtherOS)");
        expect(getOS()).toBe("unknown");
    });
});