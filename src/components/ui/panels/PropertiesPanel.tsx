// components/PropertiesPanel.tsx

import React, { useState } from 'react';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PropertyField } from '@/components/ui/panels/PropertyField';
import { getComponentProperties } from '@/types/properties';
import { PropertyValue } from '@/types/properties';

export const PropertiesPanel: React.FC = () => {
    const { 
        components,     
        selectedComponent, 
        updateComponent, 
        setSelectedComponent 
    } = useSimulatorContext();

    const [validationError, setValidationError] = useState<string | null>(null);

    if (!selectedComponent) {
        return null;
    }

    const component = components[selectedComponent];
    const propertyDefinitions = getComponentProperties(component.type);

    const handlePropertyChange = (propertyId: string, value: PropertyValue) => {
        updateComponent(selectedComponent, {
            properties: {
                ...component.properties,
                [propertyId]: value
            }
        });
    };

    return (
        <div className="absolute top-0 right-0 w-64 bg-white shadow-md rounded-lg border border-gray-200">
            <div className="flex justify-between items-center p-3 bg-black border-b border-gray-200">
                <h3 className="text-sm font-medium text-white">
                    {component.type} Properties
                </h3>
                <button
                    onClick={() => setSelectedComponent(null)}
                    className="text-white hover:text-gray-400"
                >
                    <X size={16} />
                </button>
            </div>
            <div className="p-3 space-y-1">
                {validationError && (
                    <Alert variant="destructive" className="mb-3">
                        <AlertDescription>{validationError}</AlertDescription>
                    </Alert>
                )}
                {propertyDefinitions.map((definition) => (
                    <PropertyField
                        key={definition.id}
                        definition={definition}
                        value={component.properties[definition.id] ?? definition.defaultValue}
                        onChange={(value) => {handlePropertyChange(definition.id, value); setValidationError(null)}}
                        onValidationError={(error) => setValidationError(error)}
                    />
                ))}
            </div>
        </div>
    );
};