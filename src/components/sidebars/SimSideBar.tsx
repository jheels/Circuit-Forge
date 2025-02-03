import { GenericSideBar } from './GenericSideBar';
import { SidebarComponent } from '@/types/general'; // Adjust the import path as needed

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
    }
];

export function SimSideBar() {
    return <GenericSideBar components={simulatorComponents} showImportChipDialog={true} />;
}