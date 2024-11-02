import GenericSideBar from './GenericSideBar';

const dummyComponents = Array(1).fill(null).map((_, i) => ({
    id: `component-${i + 1}`,
    name: `Component ${i + 1}`,
    description: `Description for Component ${i + 1}`
}));

export default function SimSideBar() {
    return <GenericSideBar components={dummyComponents} showImportChipDialog={true} />;
}