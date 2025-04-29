import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { EditorComponent } from '@/definitions/general';
import { ComponentTooltip } from '@/components/ComponentTooltip';

vi.mock('react-konva', () => {
    return {
        Group: ({ children }: any) => <div data-testid="group">{children}</div>,
        Rect: (props: any) => <div data-testid="rect" {...props} />,
        Text: ({ text }: { text: string }) => <div data-testid="text">{text}</div>,
    };
});

describe('ComponentTooltip', () => {
    const baseComponent = (overrides: Partial<EditorComponent>): EditorComponent => ({
        editorID: 'comp1',
        type: 'generic',
        dimensions: { width: 0, height: 0 },
        rotation: 0,
        position: { x: 0, y: 0 },
        connectors: {},
        properties: { name: 'TestComponent', ...(overrides.properties || {}) },
        ...overrides,
    });

    it('renders nothing when visible is false', () => {
        const { container } = render(
            <ComponentTooltip
                componentId="comp1"
                componentElectricalValues={{}}
                component={baseComponent({})}
                visible={false}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('shows N/A for voltage and current when no values exist', () => {
        render(
            <ComponentTooltip
                componentId="comp1"
                componentElectricalValues={{}}
                component={baseComponent({ properties: { name: 'NoValues' } })}
                visible={true}
            />
        );
        // Title
        expect(screen.getByText('NoValues')).toBeDefined();
        // Labels and values
        expect(screen.getByText('Vᵈ:')).toBeDefined();
        expect(screen.getByText('I:')).toBeDefined();
        const naValues = screen.getAllByText('N/A');
        expect(naValues).toHaveLength(2);
    });

    it('formats a single dip-switch entry correctly', () => {
        const values = {
            comp1: {
                0: { voltage: 1.23, current: 0.00456 },
            },
        };
        render(
            <ComponentTooltip
                componentId="comp1"
                componentElectricalValues={values}
                component={baseComponent({ type: 'dip-switch', properties: { name: 'MySwitch' } })}
                visible={true}
            />
        );
        expect(screen.getByText('MySwitch')).toBeDefined();
        expect(screen.getByText('SW 1')).toBeDefined();
        expect(screen.getByText('1.23 V')).toBeDefined();
        expect(screen.getByText('4.56 mA')).toBeDefined();
        // Only background rect, no separators for single entry
        const rects = screen.getAllByTestId('rect');
        expect(rects).toHaveLength(1);
    });

    it('renders multiple IC entries with separator', () => {
        const values = {
            comp1: {
                0: { voltage: 5, current: 2 },
                1: { voltage: 3.3, current: 0.5 },
            },
        };
        render(
            <ComponentTooltip
                componentId="comp1"
                componentElectricalValues={values}
                component={baseComponent({ type: 'ic', properties: { name: 'IC1' } })}
                visible={true}
            />
        );
        expect(screen.getByText('IC1')).toBeDefined();
        // Gate labels
        expect(screen.getByText('G 0')).toBeDefined();
        expect(screen.getByText('G 1')).toBeDefined();
        // Voltages and currents
        expect(screen.getByText('5.00 V')).toBeDefined();
        expect(screen.getByText('2.00 A')).toBeDefined();
        expect(screen.getByText('3.30 V')).toBeDefined();
        expect(screen.getByText('500.00 mA')).toBeDefined();
        // One separator between two entries + background rect
        const rects = screen.getAllByTestId('rect');
        expect(rects).toHaveLength(2);
    });
});