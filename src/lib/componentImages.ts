import LED from '../assets/led.svg';
import Breadboard from '../assets/breadboard.svg';
import Resistor from '../assets/resistor.svg';
import PowerSupply from '../assets/power-supply.svg';
import DipSwitch from '../assets/dip-switch.svg';
import IC74LS00 from '../assets/74LS00.svg';
import IC74LS04 from '../assets/74LS04.svg';
import IC74LS08 from '../assets/74LS08.svg';
import IC74LS32 from '../assets/74LS32.svg';
import IC74LS02 from '../assets/74LS02.svg';
import IC74LS86 from '../assets/74LS86.svg';

const componentImages: Record<string, string> = {
    'led': LED,
    'breadboard': Breadboard,
    'resistor': Resistor,
    'power-supply': PowerSupply,
    'dip-switch': DipSwitch,
    '74LS04': IC74LS04,
    '74LS00': IC74LS00,
    '74LS08': IC74LS08,
    '74LS32': IC74LS32,
    '74LS02': IC74LS02,
    '74LS86': IC74LS86
}

/**
 * 
 * @param sideBarID - The ID of the sidebar component
 * @description - Returns the image associated with the sidebar component ID.
 * @returns {string | null} - The image URL or null if not found
 */
export const getComponentImage = (sideBarID: string) => {
    return componentImages[sideBarID] || null;
}