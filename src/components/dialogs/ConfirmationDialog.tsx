import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

/**
 * 
 * @param open - Whether the dialog is open or not
 * @param onOpenChange - Function to change the open state of the dialog
 * @param title - Title of the dialog
 * @param description - Description of the dialog
 * @param onConfirm - Function to call when the confirm button is clicked
 * @param onCancel - Function to call when the cancel button is clicked
 * @description Confirmation dialog component that prompts the user for confirmation before proceeding with an action.
 * @returns {JSX.Element} - The rendered confirmation dialog component.
 * @see https://ui.shadcn.com/docs/components/alert-dialog
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ open, onOpenChange, title, description, onConfirm, onCancel }) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel || (() => onOpenChange(false))}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};