import { describe, it, expect, vi } from 'vitest';
import {
    PropertyDefinition,
    isTextProperty,
    isNumberProperty,
    isBooleanProperty,
    isSelectProperty,
    getComponentProperties,
    createDefaultProperties,
    ComponentProperties
} from '@/definitions/properties';

const mockTextProperty: PropertyDefinition = {
    type: 'text',
    id: 'mockText',
    label: 'Mock Text',
    defaultValue: 'default',
    editable: true,
    minLength: 2,
    maxLength: 10,
    required: true,
    validationFn: (value) => typeof value === 'string' && value.length >= 2
};

const mockNumberProperty: PropertyDefinition = {
    type: 'number',
    id: 'mockNumber',
    label: 'Mock Number',
    defaultValue: 5,
    editable: false,
    minValue: 0,
    maxValue: 10,
    unit: 'V',
    required: false,
    validationFn: (value) => typeof value === 'number' && value >= 0 && value <= 10
};

const mockBooleanProperty: PropertyDefinition = {
    type: 'boolean',
    id: 'mockBool',
    label: 'Mock Bool',
    defaultValue: false,
    editable: true,
    required: false
};

const mockSelectProperty: PropertyDefinition = {
    type: 'select',
    id: 'mockSelect',
    label: 'Mock Select',
    options: ['a', 'b'],
    defaultValue: 'a',
    editable: true,
    required: true,
    multiple: false
};

describe('Type guards', () => {
    it('isTextProperty returns true for text property', () => {
        expect(isTextProperty(mockTextProperty)).toBe(true);
    });
    it('isTextProperty returns false for non-text property', () => {
        expect(isTextProperty(mockNumberProperty)).toBe(false);
    });
    it('isNumberProperty returns true for number property', () => {
        expect(isNumberProperty(mockNumberProperty)).toBe(true);
    });
    it('isNumberProperty returns false for non-number property', () => {
        expect(isNumberProperty(mockBooleanProperty)).toBe(false);
    });
    it('isBooleanProperty returns true for boolean property', () => {
        expect(isBooleanProperty(mockBooleanProperty)).toBe(true);
    });
    it('isBooleanProperty returns false for non-boolean property', () => {
        expect(isBooleanProperty(mockSelectProperty)).toBe(false);
    });
    it('isSelectProperty returns true for select property', () => {
        expect(isSelectProperty(mockSelectProperty)).toBe(true);
    });
    it('isSelectProperty returns false for non-select property', () => {
        expect(isSelectProperty(mockTextProperty)).toBe(false);
    });
});

describe('getComponentProperties', () => {
    it('returns correct properties for resistor', () => {
        const props = getComponentProperties('resistor');
        expect(Array.isArray(props)).toBe(true);
        expect(props.some(p => p.id === 'value')).toBe(true);
        expect(props.some(p => p.id === 'unit')).toBe(true);
    });

    it('returns correct properties for led', () => {
        const props = getComponentProperties('led');
        expect(props.some(p => p.id === 'colour')).toBe(true);
        expect(props.some(p => p.id === 'intensity')).toBe(true);
        expect(props.some(p => p.id === 'isIlluminated')).toBe(true);
    });

    it('returns empty array and warns for unknown type', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        const props = getComponentProperties('unknown-type');
        expect(props).toEqual([]);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No property definitions found for component type: unknown-type'));
        warnSpy.mockRestore();
    });
});

describe('createDefaultProperties', () => {
    it('creates default properties for resistor', () => {
        const defaults = createDefaultProperties('resistor', 'R1');
        expect(defaults.name).toBe('R1');
        expect(defaults.value).toBe(300);
        expect(defaults.unit).toBe('Ω');
    });

    it('creates default properties for led', () => {
        const defaults = createDefaultProperties('led', 'LED1');
        expect(defaults.name).toBe('LED1');
        expect(defaults.colour).toBe('red');
        expect(defaults.intensity).toBe(0);
        expect(defaults.isIlluminated).toBe(false);
    });

    it('returns only name for breadboard', () => {
        const defaults = createDefaultProperties('breadboard', 'BB1');
        expect(defaults).toEqual({ name: 'BB1' });
    });

    it('returns empty object for unknown type', () => {
        const defaults = createDefaultProperties('unknown-type', 'X');
        expect(defaults).toEqual({});
    });
});

describe('Validation functions', () => {
    it('validates resistor value correctly', () => {
        const resistorValueProp = ComponentProperties['resistor'].find(p => p.id === 'value');
        expect(resistorValueProp?.validationFn?.(100)).toBe(true);
        expect(resistorValueProp?.validationFn?.(0)).toBe(false);
        expect(resistorValueProp?.validationFn?.(1e10)).toBe(false);
        expect(resistorValueProp?.validationFn?.('not a number' as string)).toBe(false);
        expect(resistorValueProp?.validationFn?.(1.5)).toBe(false);
    });

    it('validates power-supply voltage correctly', () => {
        const voltageProp = ComponentProperties['power-supply'].find(p => p.id === 'voltage');
        expect(voltageProp?.validationFn?.(5)).toBe(true);
        expect(voltageProp?.validationFn?.(25)).toBe(false);
        expect(voltageProp?.validationFn?.(-1)).toBe(false);
        expect(voltageProp?.validationFn?.('5' as string)).toBe(false);
    });

    it('validates name property correctly', () => {
        const nameProp = ComponentProperties['resistor'].find(p => p.id === 'name');
        expect(nameProp?.validationFn?.('R1')).toBe(true);
        expect(nameProp?.validationFn?.('')).toBe(false);
        expect(nameProp?.validationFn?.(123 as number)).toBe(false);
    });
});
