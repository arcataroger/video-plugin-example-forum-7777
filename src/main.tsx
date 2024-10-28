import {connect, RenderUploadSidebarPanelCtx} from 'datocms-plugin-sdk';
import {render} from "./utils/render.tsx";
import {AssetSidebarPanel} from "./components/AssetSidebarPanel.tsx";

connect({
    uploadSidebarPanels() {
        return [
            {
                id: 'videoPluginExample',
                label: 'Video Plugin Example',
                startOpen: true,
            },
        ];
    },
    renderUploadSidebarPanel(_:string, ctx: RenderUploadSidebarPanelCtx) {
        render(<AssetSidebarPanel ctx={ctx}/>);
    },
});