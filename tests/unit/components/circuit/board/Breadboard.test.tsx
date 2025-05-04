import { render, screen } from '@testing-library/react';
import { Breadboard, PinHole, PinLabel, generatePowerLabels, generateRegularLabels } from '@/components/circuit/board/Breadboard';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { BreadboardComponent, createBreadboardComponent } from '@/definitions/components/breadboard';

import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';

vi.mock('react-konva', () => ({
    Rect: ({ children, ...props }: any) => <div data-testid="rect" {...props}>{children}</div>,
    Text: ({ children, ...props }: any) => <div data-testid="text" {...props}>{children}</div>,
    Group: ({ children, ...props }: any) => <div data-testid="group" {...props}>{children}</div>,
}));

vi.mock('@/context/SimulatorContext', () => ({
    useSimulatorContext: vi.fn(),
}));

describe('Breadboard Component', () => {
    const mockBreadboardComponent: BreadboardComponent = createBreadboardComponent(
        { x: 0, y: 0 },
        'Breadboard')
    beforeEach(() => {
        (useSimulatorContext as vi.Mock).mockReturnValue({
            components: { Breadboard: mockBreadboardComponent },
            selectedComponent: null,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });


    it('renders PinHole correctly', () => {
        render(<PinHole x={0} y={0} type="positive" />);
        const pinHoles = screen.getAllByTestId('rect');
        expect(pinHoles).toHaveLength(1);
    });

    it('renders PinLabel correctly', () => {
        render(<PinLabel x={0} y={0} text="Test" />);
        const pinLabels = screen.getAllByTestId('text');
        expect(pinLabels).toHaveLength(1);
    });

    it('generatePowerLabels creates the expected items', () => {
        const labels: JSX.Element[] = generatePowerLabels();
        expect(labels).toHaveLength(8); 
    });

    it('generateRegularLabels creates the expected items', () => {
        const regularLabels: JSX.Element[] = generateRegularLabels();
        expect(regularLabels).toHaveLength(90);
    });

    it('renders the Breadboard', () => {
        render(<Breadboard componentID="Breadboard" />);
        expect(screen.getAllByTestId('rect').length).toBeGreaterThan(0); // Includes all pin holes
        expect(screen.getAllByTestId('text').length).toBeGreaterThan(0); // Includes all labels
    });
});