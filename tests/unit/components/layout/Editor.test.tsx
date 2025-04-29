import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import Konva from 'konva'
import { Editor } from '@/components/layout/Editor'

// Mock child components
vi.mock('@/components/layout/topbars/ToolBar', () => ({
    ToolBar: ({ onZoomIn, onZoomOut, onZoomReset }: any) => (
        <div>
            <button onClick={onZoomIn}>Zoom In</button>
            <button onClick={onZoomOut}>Zoom Out</button>
            <button onClick={onZoomReset}>Reset</button>
        </div>
    )
}))
vi.mock('@/components/layout/sidebars/SimSideBar', () => ({
    SimSideBar: () => <aside data-testid="sim-sidebar" />
}))
vi.mock('@/components/layout/Canvas', () => ({
    Canvas: ({ scale, position, setPosition, handleZoom, stageRef }: any) => (
        <div data-testid="canvas" data-scale={scale} data-x={position.x} data-y={position.y} />
    )
}))
let testHandleZoom: ((e: any) => void) | null = null
vi.mock('@/components/layout/Canvas', () => ({
    Canvas: ({ scale, position, setPosition, handleZoom, stageRef }: any) => {
        testHandleZoom = handleZoom
        return (
            <div data-testid="canvas" data-scale={scale} data-x={position.x} data-y={position.y} />
        )
    }
}))


describe('Editor', () => {
    let stageRef: React.RefObject<Konva.Stage>
    beforeEach(() => {
        stageRef = { current: null }
    })

    it('renders ToolBar, Canvas, and SimSideBar', () => {
        render(<Editor stageRef={stageRef} />)
        expect(screen.getByText('Zoom In')).toBeInTheDocument()
        expect(screen.getByTestId('canvas')).toBeInTheDocument()
        expect(screen.getByTestId('sim-sidebar')).toBeInTheDocument()
    })

    it('initially sets scale to 5 and position to {x:0, y:0}', () => {
        render(<Editor stageRef={stageRef} />)
        const canvas = screen.getByTestId('canvas')
        expect(canvas.getAttribute('data-scale')).toBe('5')
        expect(canvas.getAttribute('data-x')).toBe('0')
        expect(canvas.getAttribute('data-y')).toBe('0')
    })

    it('zooms in when Zoom In is clicked', () => {
        render(<Editor stageRef={stageRef} />)
        fireEvent.click(screen.getByText('Zoom In'))
        const canvas = screen.getByTestId('canvas')
        expect(Number(canvas.getAttribute('data-scale'))).toBeCloseTo(5 * 1.05)
    })

    it('zooms out when Zoom Out is clicked', () => {
        render(<Editor stageRef={stageRef} />)
        fireEvent.click(screen.getByText('Zoom Out'))
        const canvas = screen.getByTestId('canvas')
        expect(Number(canvas.getAttribute('data-scale'))).toBeCloseTo(5 / 1.05)
    })

    it('resets zoom and position when Reset is clicked', () => {
        render(<Editor stageRef={stageRef} />)
        fireEvent.click(screen.getByText('Zoom In'))
        fireEvent.click(screen.getByText('Reset'))
        const canvas = screen.getByTestId('canvas')
        expect(canvas.getAttribute('data-scale')).toBe('5')
        expect(canvas.getAttribute('data-x')).toBe('0')
        expect(canvas.getAttribute('data-y')).toBe('0')
    })

    it('clamps scale between MIN_SCALE and MAX_SCALE', () => {
        render(<Editor stageRef={stageRef} />)
        for (let i = 0; i < 20; i++) fireEvent.click(screen.getByText('Zoom In'))
        let canvas = screen.getByTestId('canvas')
        expect(Number(canvas.getAttribute('data-scale'))).toBeLessThanOrEqual(10)
        for (let i = 0; i < 40; i++) fireEvent.click(screen.getByText('Zoom Out'))
        canvas = screen.getByTestId('canvas')
        expect(Number(canvas.getAttribute('data-scale'))).toBeGreaterThanOrEqual(1)
    })



    it('updates scale and position on handleZoom (wheel event)', () => {
        render(<Editor stageRef={stageRef} />)
        // Mock Konva stage and event
        const mockStage = {
            scaleX: vi.fn(() => 5),
            getPointerPosition: vi.fn(() => ({ x: 100, y: 200 })),
            x: vi.fn(() => 0),
            y: vi.fn(() => 0),
            getStage: vi.fn(function () { return this }),
        }
        const mockEvent = {
            evt: { preventDefault: vi.fn(), deltaY: -1 },
            target: { getStage: () => mockStage }
        }
        // Call handleZoom (zoom in)
        if (testHandleZoom) {
            testHandleZoom(mockEvent)
        }
        const canvas = screen.getByTestId('canvas')
        // Should zoom in (scale increases))
        expect(Number(canvas.getAttribute('data-scale'))).toBeCloseTo(5.005)

    })
})

