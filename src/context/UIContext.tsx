import { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextProps {
    isSideBarOpen: boolean;
    toggleSidebar: () => void;
}

const UIContext = createContext<UIContextProps | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
    const [isSideBarOpen, setSideBarOpen] = useState(true);

    const toggleSidebar = () => {
        setSideBarOpen(!isSideBarOpen);
    };

    return (
        <UIContext.Provider value={{ isSideBarOpen, toggleSidebar }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUIContext = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUIContext must be used within a UIProvider');
    }
    return context;
};
