import { _decorator, Component, Node, color, v3, NodeEventType } from 'cc';
import { Light2DComponent } from './Light2DComponent';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('Light2D')
@executeInEditMode
export class Light2D extends Component {
    @property
    radius = 100;
    @property
    color = color(255, 255, 255, 255);
    @property
    isStatic = true;

    private _lightId = -1;

    onEnable() {
        const lightIns = Light2DComponent.Instance;
        if (!lightIns) return;

        this._lightId = lightIns.requestLight();
        this.setData();

        if (!this.isStatic) {
            this.node.on(NodeEventType.TRANSFORM_CHANGED, this.setData, this);
        }
    }

    onDisable() {
        if (!this.isStatic) {
            this.node.off(NodeEventType.TRANSFORM_CHANGED, this.setData, this);
        }
        if (this._lightId > 0) {
            Light2DComponent.Instance.recycleLight(this._lightId);
            this._lightId = -1;
        }
    }

    private setData() {
        const lightIns = Light2DComponent.Instance;
        if (!lightIns) return;
        const pos = this.node.worldPosition;
        lightIns.setLightDataById(this._lightId, pos, this.radius, this.color);
    }
}