import React from 'react';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

const PropertiesPanel: React.FC = () => {
    const { components, selectedComponent, updateComponent, setSelectedComponent } = useSimulatorContext();
    
    if (!selectedComponent) {
        return null;
    }

    const component = components[selectedComponent];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        updateComponent(selectedComponent, {
            name: value});
    }

    return (
        <div className="absolute top-0 right-0 w-64 bg-white shadow-md rounded-lg border border-gray-200 ">
            <div className="flex justify-between items-center p-3 bg-black border-b border-gray-200">
                <h3 className="text-sm font-medium text-white">{component.type} Properties</h3>
                <button 
                    onClick={() => setSelectedComponent(null)} 
                    className="text-white hover:text-gray-400"
                >
                    <X size={16} />
                </button>
            </div>
            <div className="p-3 space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                    <Input 
                        className="w-full text-sm"
                        type="text" 
                        name="name" 
                        value={component.name} 
                        onChange={handleChange} 
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>
                {/* Add more properties here as needed */}
            </div>
        </div>
    );
}

export default PropertiesPanel;