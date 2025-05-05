import { GenericSideBar } from './GenericSideBar';
import { SidebarComponent } from '@/definitions/general';

const simulatorComponents: SidebarComponent[] = [
    {
        sidebarID: 'breadboard',
        name: 'Breadboard',
        description: 'A breadboard is a construction base for prototyping of electronics.',
    },
    {
        sidebarID: 'resistor',
        name: 'Resistor',
        description: 'A resistor is a passive two-terminal electrical component that implements electrical resistance as a circuit element.',
    },
    {
        sidebarID: 'led',
        name: 'LED',
        description: 'A light-emitting diode (LED) is a semiconductor light source that emits light when current flows through it.',
    },
    {
        sidebarID: 'power-supply',
        name: 'Power Supply',
        description: 'A power supply is an electrical device that supplies electric power to an electrical load.',
    },
    {
        sidebarID: 'dip-switch',
        name: 'Dip Switch x8',
        description: 'A collection of 8 toggle switches with two positions each.'
    },
    {
        sidebarID: '74LS04',
        name: '74LS04 Hex Inverter',
        description: 'Contains six independent NOT gates (inverters).'
    },
    {
        sidebarID: '74LS00',
        name: '74LS00 Quad NAND',
        description: 'Contains four independent 2-input NAND gates.'
    },
    {
        sidebarID: '74LS08',
        name: '74LS08 Quad AND',
        description: 'Contains four independent 2-input AND gates.'
    },
    {
        sidebarID: '74LS32',
        name: '74LS32 Quad OR',
        description: 'Contains four independent 2-input OR gates.'
    },
    {
        sidebarID: '74LS02',
        name: '74LS02 Quad NOR',
        description: 'Contains four independent 2-input NOR gates.'
    },
    {
        sidebarID: '74LS86',
        name: '74LS86 Quad XOR',
        description: 'Contains four independent 2-input XOR gates.'
    },
    {
        sidebarID: 'MYSTERY',
        name: 'Mystery IC',
        description: 'A mystery IC with unknown functionality.'
    }
];

/**
 * 
 * @returns {JSX.Element} - The SimSideBar component
 * @description - A sidebar component for the simulator that contains various components such as breadboard, resistors, LEDs, and more.
 * Applies composition with the GenericSideBar component.
 */
export function SimSideBar() {
    return <GenericSideBar components={simulatorComponents} showImportChipDialog={true} />;
}