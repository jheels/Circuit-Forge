import { createContext, ReactNode } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const DndContext = createContext(null);

/**
 * 
 * @param { ReactNode} children - The children components to be wrapped by the DndProvider.
 * This is typically the main application or a specific part of the application that requires drag-and-drop functionality.
 * @returns {JSX.Element} - A JSX element that wraps the children with the DndProvider.
 */
export const DndProviderWrapper = ({ children }: { children: ReactNode }) => {
    return (
        <DndProvider backend={HTML5Backend}>
            {children}
        </DndProvider>
    );
};

export default DndContext;