import GenericSidebar from './GenericSidebar';

const dummyComponents = Array(36).fill(null).map((_, i) => ({
    id: `component-${i + 1}`,
    name: `Component ${i + 1}`,
    description: `Description for Component ${i + 1}`
}));

export default function SimSideBar() {
    return <GenericSidebar components={dummyComponents} />;
}