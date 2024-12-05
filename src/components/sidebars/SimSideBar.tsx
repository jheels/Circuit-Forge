import GenericSideBar from './GenericSideBar';
import { ComponentTile } from '@/types'; // Adjust the import path as needed
import Breadboard from '@/components/circuit-components/Breadboard'; // Adjust the import path as needed

const dummyComponents: ComponentTile[] = [
    {
        id: 'breadboard',
        name: 'Breadboard',
        description: 'A breadboard is a construction base for prototyping of electronics.',
        component : <Breadboard />,
    },
    {
        id: 'resistor',
        name: 'Resistor',
        description: 'A resistor is a passive two-terminal electrical component that implements electrical resistance as a circuit element.',

    },
    {
        id: 'led',
        name: 'LED',
        description: 'A light-emitting diode (LED) is a semiconductor light source that emits light when current flows through it.',

    },
    {
        id: 'power-supply',
        name: 'Power Supply',
        description: 'A power supply is an electrical device that supplies electric power to an electrical load.',
    }
];

export default function SimSideBar() {
    return <GenericSideBar components={dummyComponents} showImportChipDialog={true} />;
}