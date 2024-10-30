import GenericSidebar from './GenericSidebar';

const dummyComponents = Array(36).fill(null).map((_, i) => ({
    id: `component-${i + 1}`,
    name: `IC Component ${i + 1}`,
    description: `Description for IC Component ${i + 1}`
}));

export default function ICEditorSideBar() {
    return <GenericSidebar components={dummyComponents} />;
}
