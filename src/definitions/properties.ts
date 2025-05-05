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

// Type guards to check the type of property definitions
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

/**
 * A record defining the properties for various electronic components.
 * Each component is associated with an array of property definitions.
 *
 * @constant
 * @type {Record<string, PropertyDefinition[]>}
 *
 * @property {'resistor'} resistor - Properties for a resistor component.
 * - `name`: Common property for naming the component.
 * - `value`: Resistance value (number) in the range of 1 to 1,000,000 (Ω).
 * - `unit`: Unit of resistance, selectable from ['Ω', 'kΩ', 'MΩ'].
 *
 * @property {'led'} led - Properties for an LED component.
 * - `name`: Common property for naming the component.
 * - `colour`: LED color, selectable from ['red', 'green', 'blue', 'yellow'].
 * - `intensity`: Intensity of the LED (number) in the range of 0 to 100 (%), non-editable.
 * - `isIlluminated`: Boolean indicating whether the LED is illuminated, non-editable.
 *
 * @property {'power-supply'} power-supply - Properties for a power supply component.
 * - `name`: Common property for naming the component.
 * - `voltage`: Voltage value (number) in the range of 0 to 24 (V).
 *
 * @property {'breadboard'} breadboard - Properties for a breadboard component.
 * - `name`: Common property for naming the component.
 *
 * @property {'dip-switch'} dip-switch - Properties for a DIP switch component.
 * - `name`: Common property for naming the component.
 *
 * @property {'ic'} ic - Properties for an integrated circuit (IC) component.
 * - `name`: Common property for naming the component.
 */
export const ComponentProperties: Record<string, PropertyDefinition[]> = {
    'resistor': [
        CommonProperties.name,
        {
            type: 'number',
            id: 'value',
            label: 'Resistance',
            defaultValue: 300,
            editable: true,
            required: true,
            validationFn: (value) => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 1e6,
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
            unit: 'V',
            validationFn: (value) => typeof value === 'number' &&  value <= 24 && value >= 0, // voltage must be less than or equal to 24V
        },
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

/**
 * Retrieves the property definitions for a given component type.
 *
 * @param componentType - The type of the component for which to retrieve property definitions.
 * @returns An array of `PropertyDefinition` objects associated with the specified component type.
 *          If no properties are found for the given component type, an empty array is returned.
 * @remarks Logs a warning to the console if no property definitions are found for the specified component type.
 */
export const getComponentProperties = (componentType: string): PropertyDefinition[] => {
    const properties = ComponentProperties[componentType];
    if (!properties) {
        console.warn(`No property definitions found for component type: ${componentType}`);
        return [];
    }
    return properties;
};

/**
 * Creates a default set of properties for a given component type.
 *
 * @param componentType - The type of the component for which properties are being created.
 * @param name - The name to assign to the 'name' property of the component.
 * @returns A record where each key is a property ID and the value is either the default value
 *          of the property or the provided name if the property ID is 'name'.
 */
export const createDefaultProperties = (componentType: string, name: string): Record<string, PropertyValue> => {
    const properties = getComponentProperties(componentType);
    return properties.reduce((acc, prop) => ({
        ...acc,
        [prop.id]: prop.id === 'name' ? name : prop.defaultValue
    }), {});
};