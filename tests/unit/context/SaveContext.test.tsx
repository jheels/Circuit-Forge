import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, act } from '@testing-library/react';
import { SaveProvider, useSaveContext } from '@/context/SaveContext';
import Konva from 'konva';
import { z } from 'zod';

// Mock SimulatorContext
vi.mock('@/context/SimulatorContext', () => ({
    useSimulatorContext: () => ({
        projectName: 'TestProject',
        components: {},
        componentCounts: {},
        connections: {},
        connectorConnectionMap: {},
        wires: {},
        resetProject: vi.fn(),
        setProjectName: vi.fn(),
        addComponent: vi.fn(),
        addWire: vi.fn(),
        addConnection: vi.fn(),
        setComponentCounts: vi.fn(),
    }),
}));

const TestComponent = ({ onReady }: { onReady: (ctx: ReturnType<typeof useSaveContext>) => void }) => {
    const ctx = useSaveContext();
    React.useEffect(() => {
        onReady(ctx);
        // eslint-disable-next-line
    }, []);
    return null;
};

describe('SaveContext', () => {
    let stageRef: React.RefObject<Konva.Stage>;
    let ctx: any;

    beforeEach(() => {
        stageRef = { current: null } as any;
        ctx = null;
        vi.restoreAllMocks();
    });

    it('should provide currentProject and hasUnsavedChanges', async () => {
        await act(async () => {
            render(
                <SaveProvider stageRef={stageRef}>
                    <TestComponent onReady={c => { ctx = c; }} />
                </SaveProvider>
            );
        });
        expect(ctx.currentProject).toBeTruthy();
        expect(ctx.hasUnsavedChanges).toBe(false);
        expect(ctx.currentProject.metadata.name).toBe('TestProject');
    });

    it('should validate a minimal project using zod', () => {
        const CircuitProjectSchema = z.object({
            metadata: z.object({ name: z.string(), lastSaved: z.number() }),
            components: z.record(z.any()),
            componentCounts: z.record(z.number()),
            connections: z.record(z.any()),
            connectorConnectionMap: z.record(z.string()),
            wires: z.record(z.any()),
        }).strict();

        const minimalProject = {
            metadata: { name: 'Test', lastSaved: Date.now() },
            components: {},
            componentCounts: {},
            connections: {},
            connectorConnectionMap: {},
            wires: {},
        };
        const result = CircuitProjectSchema.safeParse(minimalProject);
        expect(result.success).toBe(true);
    });

    it('should save a project (user happy path)', async () => {
        await act(async () => {
            render(
                <SaveProvider stageRef={stageRef}>
                    <TestComponent onReady={c => { ctx = c; }} />
                </SaveProvider>
            );
        });

        const mockWrite = vi.fn();
        const mockClose = vi.fn();
        const mockCreateWritable = vi.fn().mockResolvedValue({
            write: mockWrite,
            close: mockClose,
        });
        const mockFileHandle = {
            createWritable: mockCreateWritable,
        };
        // @ts-ignore
        window.showSaveFilePicker = vi.fn().mockResolvedValue(mockFileHandle);

        const result = await act(async () => await ctx.saveProject(true));

        expect(result.success).toBe(true);
        expect(mockCreateWritable).toHaveBeenCalled();
        expect(mockWrite).toHaveBeenCalled();
        expect(mockClose).toHaveBeenCalled();
    });

    it('should handle user cancelling save dialog', async () => {
        await act(async () => {
            render(
                <SaveProvider stageRef={stageRef}>
                    <TestComponent onReady={c => { ctx = c; }} />
                </SaveProvider>
            );
        });

        window.showSaveFilePicker = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));

        const result = await act(async () => await ctx.saveProject(true));
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/Aborted save/);
    });

    it('should load a valid project', async () => {
        await act(async () => {
            render(
                <SaveProvider stageRef={stageRef}>
                    <TestComponent onReady={c => { ctx = c; }} />
                </SaveProvider>
            );
        });

        const now = Date.now();
        const validProject = {
            metadata: { name: 'LoadedProject', lastSaved: now },
            components: {},
            componentCounts: {},
            connections: {},
            connectorConnectionMap: {},
            wires: {},
        };
        const fileText = JSON.stringify(validProject);

        const mockFile = {
            text: vi.fn().mockResolvedValue(fileText),
        };
        const mockFileHandle = {
            getFile: vi.fn().mockResolvedValue(mockFile),
        };
        // @ts-ignore
        window.showOpenFilePicker = vi.fn().mockResolvedValue([mockFileHandle]);

        const result = await act(async () => await ctx.loadProject());

        expect(result.success).toBe(true);
        expect(mockFileHandle.getFile).toHaveBeenCalled();
        expect(mockFile.text).toHaveBeenCalled();
    });

    it('should handle invalid project structure on load', async () => {
        await act(async () => {
            render(
                <SaveProvider stageRef={stageRef}>
                    <TestComponent onReady={c => { ctx = c; }} />
                </SaveProvider>
            );
        });

        const invalidProject = {
            components: {},
            componentCounts: {},
            connections: {},
            connectorConnectionMap: {},
            wires: {},
        };
        const fileText = JSON.stringify(invalidProject);

        const mockFile = {
            text: vi.fn().mockResolvedValue(fileText),
        };
        const mockFileHandle = {
            getFile: vi.fn().mockResolvedValue(mockFile),
        };
        // @ts-ignore
        window.showOpenFilePicker = vi.fn().mockResolvedValue([mockFileHandle]);

        const result = await act(async () => await ctx.loadProject());

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/Project file is invalid/);
    });

    it('should handle user cancelling load dialog', async () => {
        await act(async () => {
            render(
                <SaveProvider stageRef={stageRef}>
                    <TestComponent onReady={c => { ctx = c; }} />
                </SaveProvider>
            );
        });

        // @ts-ignore
        window.showOpenFilePicker = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));

        const result = await act(async () => await ctx.loadProject());

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/Aborted loading/);
    });

    it('should export project as image', async () => {
                await act(async () => {
            render(
                <SaveProvider stageRef={stageRef}>
                    <TestComponent onReady={c => { ctx = c; }} />
                </SaveProvider>
            );
        });

        const mockToDataURL = vi.fn().mockReturnValue('data:image/png;base64,abc');
        const mockStage = {
            width: vi.fn().mockReturnValue(100),
            height: vi.fn().mockReturnValue(100),
            scaleX: vi.fn().mockReturnValue(1),
            scale: vi.fn(),
            position: vi.fn().mockReturnValue({ x: 0, y: 0 }),
            getClientRect: vi.fn().mockReturnValue({ x: 0, y: 0, width: 100, height: 100 }),
            toDataURL: mockToDataURL,
        };
        Object.defineProperty(stageRef, 'current', { value: mockStage, writable: true });

        const clickSpy = vi.fn();
        vi.spyOn(document, 'createElement').mockReturnValue({
            set href(val: string) {},
            set download(val: string) {},
            click: clickSpy,
            style: {},
        } as any);
        vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
        vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});


        await act(async () => {
            await ctx.exportProjectAsImage();
        });

        expect(mockToDataURL).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
    });
});