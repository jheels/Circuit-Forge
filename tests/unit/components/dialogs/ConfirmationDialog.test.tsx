import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';

describe('ConfirmationDialog', () => {
    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        title: 'Delete Item',
        description: 'Are you sure you want to delete this item?',
        onConfirm: vi.fn(),
    };

    it('renders title and description', () => {
        render(<ConfirmationDialog {...defaultProps} />);
        expect(screen.getByText('Delete Item')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
    });

    it('renders Cancel and Confirm buttons', () => {
        render(<ConfirmationDialog {...defaultProps} />);
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('calls onConfirm when Confirm is clicked', () => {
        render(<ConfirmationDialog {...defaultProps} />);
        fireEvent.click(screen.getByText('Confirm'));
        expect(defaultProps.onConfirm).toHaveBeenCalled();
    });

    it('calls onCancel when Cancel is clicked and onCancel is provided', () => {
        const onCancel = vi.fn();
        render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onCancel).toHaveBeenCalled();
    });

    it('calls onOpenChange(false) when Cancel is clicked and onCancel is not provided', () => {
        const onOpenChange = vi.fn();
        render(<ConfirmationDialog {...defaultProps} onOpenChange={onOpenChange} onCancel={undefined} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not render dialog content when open is false', () => {
        render(<ConfirmationDialog {...defaultProps} open={false} />);
        expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
        expect(screen.queryByText('Are you sure you want to delete this item?')).not.toBeInTheDocument();
    });
});