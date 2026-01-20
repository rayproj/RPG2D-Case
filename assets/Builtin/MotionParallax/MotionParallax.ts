import { _decorator, Component, Node, Material, sp, v3, v4, Vec3 } from 'cc';
import { EDITOR, PREVIEW } from 'cc/env';
const { ccclass, property, executeInEditMode } = _decorator;

const t_v3_1 = v3();

@ccclass('MotionParallax')
@executeInEditMode
export class MotionParallax extends Component {
    @property(Material)
    parallaxMat: Material = null;
    @property
    strength = 10;

    private _ske: sp.Skeleton = null;
    private _lastPos = v3();
    private _dir = v4();
    private _parallaxEnable = false;

    onLoad() {
        this._ske = this.getComponent(sp.Skeleton);
        if (EDITOR || PREVIEW) {
            this.startParallax();
        }
    }

    update(dt: number) {
        if (!this._parallaxEnable) return;
        const currPos = this.node.getPosition(t_v3_1);
        const dir = Vec3.subtract(t_v3_1, this._lastPos, currPos);
        this._dir.set(dir.x, dir.y, dir.z, this.strength);

        this._ske.setMaterialProperty('direction', this._dir);

        this.node.getPosition(this._lastPos);
    }

    startParallax() {
        this.node.getPosition(this._lastPos);
        this._ske.customMaterial = this.parallaxMat;
        this._parallaxEnable = true;
    }

    endParallax() {
        this._parallaxEnable = false;
        this._ske.customMaterial = null;
    }
}