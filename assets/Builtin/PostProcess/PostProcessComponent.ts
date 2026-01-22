import { _decorator, Component, Node, Camera, RenderTexture, gfx, __private, director, RenderPipeline, PipelineEventType, renderer, PipelineStateManager, pipeline, Material } from 'cc';
const { ccclass, property } = _decorator;
const { ColorAttachment, Format, DepthStencilAttachment, RenderPassInfo,
    BufferInfo, BufferUsageBit, MemoryUsageBit, InputAssemblerInfo, Attribute,
    LoadOp, StoreOp, GeneralBarrierInfo, AccessFlagBit
} = gfx;

export type IRenderTextureCreateInfo = __private._cocos_asset_assets_render_texture__IRenderTextureCreateInfo;
export type RenderWindow = __private._cocos_render_scene_core_render_window__RenderWindow;

let _ia: gfx.InputAssembler;
let _rp: gfx.RenderPass;
let _renderArea = new gfx.Rect(0, 0, 0, 0);
let _clearColors = [new gfx.Color(0, 0, 0, 0)];

@ccclass('PostProcessComponent')
export class PostProcessComponent extends Component {
    @property([Material])
    postProcessMaterials: Material[] = [];

    private _camera: renderer.scene.Camera = null;

    onLoad() {
        const cameraComp = this.getComponent(Camera);
        this._camera = cameraComp.camera;

        const rt = new RenderTexture();
        const info = this.getRTCreateInfo();
        rt.reset(info);
        cameraComp.targetTexture = rt;

        this.init();
    }

    onEnable() {
        const pipeline = this.getPipeline();
        pipeline.on(PipelineEventType.RENDER_CAMERA_END, this.onRenderCameraEnd, this);
    }

    onDisable() {
        const pipeline = this.getPipeline();
        pipeline.off(PipelineEventType.RENDER_CAMERA_END, this.onRenderCameraEnd, this);
    }

    private getPipeline() {
        const pipelineRuntime = director.root.pipeline;
        const pipeline = pipelineRuntime as RenderPipeline;
        return pipeline;
    }

    private onRenderCameraEnd(camera: renderer.scene.Camera) {
        if (camera === this._camera) {
            this.onRenderEnd(camera.window);
        }
    }

    private init() {
        if (!_ia) {
            const device = director.root.device;
            const vbStride = 4 * Float32Array.BYTES_PER_ELEMENT;
            const vbSize = 4 * vbStride;
            const vb = device.createBuffer(
                new BufferInfo(
                    BufferUsageBit.VERTEX | gfx.BufferUsageBit.TRANSFER_DST,
                    MemoryUsageBit.HOST | MemoryUsageBit.DEVICE,
                    vbSize, vbStride
                )
            );
            const ibStride = Uint8Array.BYTES_PER_ELEMENT;
            const ibSize = 6 * ibStride;
            const ib = device.createBuffer(
                new BufferInfo(
                    BufferUsageBit.INDEX | BufferUsageBit.TRANSFER_DST,
                    MemoryUsageBit.HOST | MemoryUsageBit.DEVICE,
                    ibSize, ibStride
                )
            );
            const iaInfo = new InputAssemblerInfo(
                [
                    new Attribute("a_position", gfx.Format.RG32F),
                    new Attribute("a_texCoord", gfx.Format.RG32F)
                ],
                [vb], ib
            );
            ib.update(new Uint8Array([0, 1, 2, 1, 3, 2]));
            vb.update(new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]));
            _ia = device.createInputAssembler(iaInfo);

            const colorAttachment = new ColorAttachment();
            colorAttachment.format = Format.RGBA8;
            colorAttachment.loadOp = LoadOp.LOAD;
            colorAttachment.storeOp = StoreOp.STORE;
            colorAttachment.barrier = device.getGeneralBarrier(
                new GeneralBarrierInfo(
                    AccessFlagBit.NONE, AccessFlagBit.COLOR_ATTACHMENT_WRITE
                )
            )
            const rpInfo = new RenderPassInfo([colorAttachment]);
            _rp = device.createRenderPass(rpInfo);
        }
    }

    /**
     * 相机渲染完成回调，子类可自定义
     */
    protected onRenderEnd(src: RenderWindow) {
        this.blit(src, director.root.mainWindow, this.postProcessMaterials[0].passes[0]);
    }

    /**
     * 获取RT创建信息，子类可自定义
     */
    protected getRTCreateInfo(): IRenderTextureCreateInfo {
        const shadingScale = 1;

        const colorAttachment = new ColorAttachment();
        colorAttachment.format = Format.RGBA8;
        const depthStencilAttachment = new DepthStencilAttachment();
        depthStencilAttachment.format = Format.DEPTH_STENCIL;
        const passInfo = new RenderPassInfo([colorAttachment], depthStencilAttachment);

        const mainWindow = director.root.mainWindow;
        return {
            width: mainWindow.width * shadingScale,
            height: mainWindow.height * shadingScale,
            passInfo
        }
    }

    /**
     * 执行一次渲染过程
     */
    protected blit(src: RenderWindow, dst: RenderWindow, pass: renderer.Pass) {
        const device = director.root.device;
        const pipelineRuntime = director.root.pipeline;

        const colorBinding = pass.getBinding('colorTexture');
        pass.bindTexture(colorBinding, src.framebuffer.colorTextures[0]);
        pass.bindSampler(colorBinding, pipelineRuntime.globalDSManager.linearSampler);
        pass.update();


        _renderArea.width = dst.width;
        _renderArea.height = dst.height;
        const pos = PipelineStateManager.getOrCreatePipelineState(
            device, pass, pass.getShaderVariant(), _rp, _ia
        );

        const cmdBuffer = device.commandBuffer;
        cmdBuffer.beginRenderPass(_rp, dst.framebuffer, _renderArea, _clearColors, 0, 0);
        cmdBuffer.bindPipelineState(pos);
        cmdBuffer.bindDescriptorSet(pipeline.SetIndex.GLOBAL, pipelineRuntime.descriptorSet);
        cmdBuffer.bindDescriptorSet(pipeline.SetIndex.MATERIAL, pass.descriptorSet);
        cmdBuffer.bindInputAssembler(_ia);
        cmdBuffer.draw(_ia);
        cmdBuffer.endRenderPass();
    }
}