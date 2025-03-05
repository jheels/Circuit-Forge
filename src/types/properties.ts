export type PropertyValue = string | number | boolean | string[];

type ValidationFn = (value: PropertyValue) => boolean;

interface BasePropertyDefinition {
    id: string;
    label: string;
    defaultValue: PropertyValue;
    editable: boolean;
    required?: boolean;
    validationFn?: ValidationFn;
}

interface TextPropertyDefinition extends BasePropertyDefinition {
    type: 'text';
    defaultValue: string;
    minLength?: number;
    maxLength?: number;
}

interface NumberPropertyDefinition extends BasePropertyDefinition {
    type: 'number';
    defaultValue: number;
    minValue?: number;
    maxValue?: number;
    unit?: string;
}

interface BooleanPropertyDefinition extends BasePropertyDefinition {
    type: 'boolean';
    defaultValue: boolean;
}

interface SelectPropertyDefinition extends BasePropertyDefinition {
    type: 'select';
    options: string[];
    defaultValue: string;
    multiple?: boolean;
}

export type PropertyDefinition =
    | TextPropertyDefinition
    | NumberPropertyDefinition
    | BooleanPropertyDefinition
    | SelectPropertyDefinition;

export const isTextProperty = (prop: PropertyDefinition): prop is TextPropertyDefinition =>
    prop.type === 'text';

export const isNumberProperty = (prop: PropertyDefinition): prop is NumberPropertyDefinition =>
    prop.type === 'number';

export const isBooleanProperty = (prop: PropertyDefinition): prop is BooleanPropertyDefinition =>
    prop.type === 'boolean';

export const isSelectProperty = (prop: PropertyDefinition): prop is SelectPropertyDefinition =>
    prop.type === 'select';



const CommonProperties: Record<string, PropertyDefinition> = {
    name: {
        type: 'text',
        id: 'name',
        label: 'Name',
        defaultValue: '',
        editable: true,
        required: true,
        minLength: 1,
        maxLength: 50,
        validationFn: (value) => typeof value === 'string' && value.length > 0
    }
};

export const ComponentProperties: Record<string, PropertyDefinition[]> = {
    'resistor': [
        CommonProperties.name,
        {
            type: 'number',
            id: 'value',
            label: 'Resistance',
            defaultValue: 1000,
            editable: true,
            required: true,
            minValue: 0,
            validationFn: (value) => typeof value === 'number' && Number.isInteger(value), // resistance must be a whole number
        },
        {
            type: 'select',
            id: 'unit',
            label: 'Unit',
            options: ['Ω', 'kΩ', 'MΩ'],
            defaultValue: 'Ω',
            editable: true,
            required: true,
        }
    ],
    'led': [
        CommonProperties.name,
        {
            type: 'select',
            id: 'colour',
            label: 'Colour',
            options: ['red', 'green', 'blue', 'yellow'],
            defaultValue: 'red',
            editable: true,
            required: true,
        },
        {
            type: 'number',
            id: 'intensity',
            label: 'Intensity',
            defaultValue: 0,
            editable: false,
            minValue: 0,
            maxValue: 100,
            unit: '%',
        },
        {
            type: 'boolean',
            id: 'isIlluminated',
            label: 'Illuminated',
            defaultValue: false,
            editable: false,
        }
    ],
    'power-supply': [
        CommonProperties.name,
        {
            type: 'number',
            id: 'voltage',
            label: 'Voltage',
            defaultValue: 5,
            editable: true,
            required: true,
            minValue: 0,
            maxValue: 24,
            unit: 'V',
            validationFn: (value) => typeof value === 'number'
        },
        {
            type: 'boolean',
            id: 'isEnabled',
            label: 'Enabled',
            defaultValue: false,
            editable: true,
        }
    ],
    'breadboard': [
        CommonProperties.name,
    ],
    'dip-switch': [
        CommonProperties.name,
    ],
    'ic' : [
        CommonProperties.name,
    ],
};

// Helper function to get property definitions for a component type
export const getComponentProperties = (componentType: string): PropertyDefinition[] => {
    const properties = ComponentProperties[componentType];
    if (!properties) {
        console.warn(`No property definitions found for component type: ${componentType}`);
        return [];
    }
    return properties;
};

// Helper function to create default properties for a component
export const createDefaultProperties = (componentType: string, name: string): Record<string, PropertyValue> => {
    const properties = getComponentProperties(componentType);
    return properties.reduce((acc, prop) => ({
        ...acc,
        [prop.id]: prop.id === 'name' ? name : prop.defaultValue
    }), {});
};