import { createContext, ReactNode } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const DndContext = createContext(null);

export const DndProviderWrapper = ({ children }: { children: ReactNode }) => {
    return (
        <DndProvider backend={HTML5Backend}>
            {children}
        </DndProvider>
    );
};

export default DndContext;