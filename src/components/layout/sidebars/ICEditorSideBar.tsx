import { GenericSideBar } from './GenericSideBar';

const dummyComponents = Array(1).fill(null).map((_, i) => ({
    id: `component-${i + 1}`,
    name: `IC Component ${i + 1}`,
    description: `Description for IC Component ${i + 1}`
}));

export function ICEditorSideBar() {
    return <GenericSideBar components={dummyComponents} showImportChipDialog={false} />;
}
