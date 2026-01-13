import { _decorator, Component, Node, Sprite, Material, Vec4, v4, Vec3, Color, v3, color } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

const t_Pos = v3(0, 0, 0), t_Color = color(0, 0, 0, 0);

@ccclass('Light2DComponent')
@executeInEditMode
export class Light2DComponent extends Component {
    static Instance: Light2DComponent = null;

    @property({ readonly: true })
    maxLightCount = 5;

    get active() { return this._active; }

    private _active = true;
    private _shadeRenderer: Sprite = null;
    private _shadeMat: Material = null;
    private _idPool: number[] = [];
    private _lightData: Vec4[] = [];
    private _dirty = false;

    onLoad() {
        Light2DComponent.Instance = this;

        this.fillData();

        this._shadeRenderer = this.getComponent(Sprite);
        this._shadeMat = this._shadeRenderer.customMaterial;
        this._active = this._shadeRenderer.enabled;
    }

    onDestroy() {
        Light2DComponent.Instance = null;
    }

    update(dt: number) {
        if (!this._active || !this._dirty) return;
        this._dirty = false;
        this.uploadLightData();
    }

    /**
     * 激活/禁用
     */
    setActive(active: boolean) {
        if (this._active !== active) {
            this._active = active;
            this._shadeRenderer.enabled = active;
        }
    }

    /**
     * 请求光源ID
     */
    requestLight() {
        const idPool = this._idPool;
        if (idPool.length > 0) {
            return idPool.pop();
        }
        return -1;
    }

    /**
     * 回收光源
     * @param id 
     */
    recycleLight(id: number) {
        if (this.isValidLight(id)) {
            this.setLightDataById(id, t_Pos, 0, t_Color);
            this._idPool.push(id);
        }
    }

    /**
     * 更新指定光源数据
     * @param id 光源id
     * @param worldPos 光源位置
     * @param radius 光源半径
     * @param color 光源颜色
     */
    setLightDataById(id: number, worldPos: Vec3, radius: number, color: Color) {
        if (this.isValidLight(id)) {
            const lightData = this._lightData;
            const offset = (id - 1) * 2;
            const posRadiusData = lightData[offset];
            posRadiusData.x = worldPos.x, posRadiusData.y = worldPos.y;
            posRadiusData.z = radius;
            const colorData = lightData[offset + 1];
            Color.toVec4(color, colorData);

            this._dirty = true;
        }
    }

    private fillData() {
        const maxLightCount = this.maxLightCount;

        const idPool = this._idPool;
        idPool.length = 0;
        for (let g = 0; g < maxLightCount; g++) {
            idPool.push(g + 1);
        }

        const lightData = this._lightData;
        lightData.length = 0;
        for (let g = 0; g < maxLightCount * 2; g++) {
            lightData.push(v4());
        }
    }

    private uploadLightData() {
        this._shadeMat.setProperty('lightData', this._lightData);
    }

    private isValidLight(id: number) {
        return id > 0 && id <= this.maxLightCount;
    }
}