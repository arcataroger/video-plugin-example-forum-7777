import {connect} from 'datocms-plugin-sdk';
import {render} from "./utils/render.tsx";
import {UploadSidebarPanel} from "./components/UploadSidebarPanel.tsx";

connect({
    uploadSidebarPanels() {
        return [
            {
                id: 'uploadSidebarPanelExample',
                label: 'Upload Sidebar Panel Example',
                startOpen: true,
            },
        ];
    },
    renderUploadSidebarPanel(_:string, ctx) {
        render(<UploadSidebarPanel ctx={ctx}/>);
    },
});