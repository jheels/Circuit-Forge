import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    PropertyDefinition,
    PropertyValue,
    isTextProperty,
    isNumberProperty,
    isBooleanProperty,
    isSelectProperty
} from '@/types/properties';

interface PropertyFieldProps {
    definition: PropertyDefinition;
    value: PropertyValue;
    onChange: (value: PropertyValue) => void;
    onValidationError?: (error: string) => void;
}

const validateValue = (definition: PropertyDefinition, value: PropertyValue): boolean => {
    if (definition.validationFn) {
        return definition.validationFn(value);
    }
    return true;
};

export const PropertyField: React.FC<PropertyFieldProps> = ({
    definition,
    value,
    onChange,
    onValidationError
}) => {
    const handleChange = (newValue: PropertyValue) => {
        if (!validateValue(definition, newValue)) {
            onValidationError?.(`Invalid value for ${definition.label}`);
            return;
        }
        onChange(newValue);
    };

    if (!definition.editable) {
        return;
    }

    if (isTextProperty(definition)) {
        return (
            <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">
                    {definition.label}
                </Label>
                <Input
                    type="text"
                    value={value as string}
                    onChange={(e) => handleChange(e.target.value)}
                    minLength={definition.minLength}
                    maxLength={definition.maxLength}
                    className="w-full text-sm"
                    onKeyDown={(e) => e.stopPropagation()}
                />
            </div>
        );
    }

    if (isNumberProperty(definition)) {
        return (
            <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">
                    {definition.label} {definition.unit && `(${definition.unit})`}
                </Label>
                <Input
                    type="number"
                    value={value as number}
                    onChange={(e) => handleChange(Number(e.target.value))}
                    min={definition.minValue}
                    max={definition.maxValue}
                    className="w-full text-sm"
                    onKeyDown={(e) => e.stopPropagation()}
                />
            </div>
        );
    }

    if (isBooleanProperty(definition)) {
        return (
            <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-600">
                    {definition.label}
                </Label>
                <Switch
                    checked={value as boolean}
                    onCheckedChange={handleChange}
                />
            </div>
        );
    }

    if (isSelectProperty(definition)) {
        return (
            <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">
                    {definition.label}
                </Label>
                <Select
                    value={value as string}
                    onValueChange={handleChange}
                >
                    <SelectTrigger className="w-full text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {definition.options.map((option) => (
                            <SelectItem key={option} value={option}>
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        );
    }

    return null;
};