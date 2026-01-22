import { _decorator, Component, Node, gfx, director } from 'cc';
import { PostProcessComponent, RenderWindow } from '../../Builtin/PostProcess/PostProcessComponent';
const { ccclass, property } = _decorator;
const {
    ColorAttachment, Format, DepthStencilAttachment, RenderPassInfo,
} = gfx;

@ccclass('PP_OutlineComponent')
export class PP_OutlineComponent extends PostProcessComponent {
    protected getRTCreateInfo() {
        const shadingScale = 1;

        const colorAttachment = new ColorAttachment();
        colorAttachment.format = Format.RGBA8;
        const normalAttachment = new ColorAttachment();
        normalAttachment.format = Format.RGBA8;
        const depthStencilAttachment = new DepthStencilAttachment();
        depthStencilAttachment.format = Format.DEPTH_STENCIL;
        const passInfo = new RenderPassInfo([colorAttachment, normalAttachment], depthStencilAttachment);

        const mainWindow = director.root.mainWindow;
        return {
            width: mainWindow.width * shadingScale,
            height: mainWindow.height * shadingScale,
            passInfo
        }
    }

    protected onRenderEnd(src: RenderWindow) {
        const outlinePass = this.postProcessMaterials[0].passes[0];
        const pointSampler = director.root.pipeline.globalDSManager.pointSampler;
        const depthBinding = outlinePass.getBinding('depthTexture');
        outlinePass.bindTexture(depthBinding, src.framebuffer.depthStencilTexture);
        outlinePass.bindSampler(depthBinding, pointSampler);
        const normalBinding = outlinePass.getBinding('normalTexture');
        outlinePass.bindTexture(normalBinding, src.framebuffer.colorTextures[1]);
        outlinePass.bindSampler(normalBinding, pointSampler);

        this.blit(src, director.root.mainWindow, outlinePass);
    }
}