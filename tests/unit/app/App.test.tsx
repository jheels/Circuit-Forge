import { render, screen } from '@testing-library/react';
import App from '@/app/App';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/components/layout/topbars/NavBar', () => ({
    NavBar: () => <nav data-testid="navbar" />
}));
vi.mock('@/app/routes/Simulator', () => ({
    Simulator: () => <main data-testid="simulator" />
}));
vi.mock('@/context/UIContext', () => ({
    UIProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="uiprovider">{children}</div>
}));
let toasterProps: any; 
vi.mock('react-hot-toast', () => ({
    Toaster: (props: any) => {
        toasterProps = props;
        return <div data-testid="toaster" {...props} />}
}));

describe('App', () => {
    it('renders UIProvider as the root', () => {
        render(<App />);
        expect(screen.getByTestId('uiprovider')).toBeInTheDocument();
    });

    it('renders Toaster with correct props', () => {
        render(<App />);
        const toaster = screen.getByTestId('toaster');
        expect(toaster).toBeInTheDocument();
        expect(toaster.getAttribute('position')).toBe('bottom-center');
        expect(toasterProps.reverseOrder).toBe(false);
    });

    it('renders NavBar and Simulator inside AppContent', () => {
        render(<App />);
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
        expect(screen.getByTestId('simulator')).toBeInTheDocument();
    });
});