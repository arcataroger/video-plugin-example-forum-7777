import { Canvas, Button } from 'datocms-react-ui';
import {RenderUploadSidebarPanelCtx} from "datocms-plugin-sdk";
type AssetSidebarPanelProps = {
    ctx: RenderUploadSidebarPanelCtx;
};
export const AssetSidebarPanel = ({ ctx }: AssetSidebarPanelProps) => (
    <Canvas ctx={ctx}>
        <h2>Hello from the sidebar!</h2>
        <p>I don't know what's going on here</p>
        <p>Nothing is showing</p>
        <Button buttonType='primary'>This is a test</Button>
    </Canvas>
);