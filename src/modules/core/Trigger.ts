import BoxCollider, { BoxColliderOptions } from "./BoxCollider";
import { DestroyOptions } from "pixi.js";

export type TriggerOptions = BoxColliderOptions & {
    onTrigger: (trigger: Trigger, collider: BoxCollider) => boolean;
};

class Trigger extends BoxCollider {
    interactive = true;
    callback: (trigger: Trigger, collider: BoxCollider) => boolean;

    constructor(options: TriggerOptions) {
        super(options);

        this.callback = options.onTrigger;
    }

    onCollide = (collider: BoxCollider) => {
        if (this.interactive) {
            const isTriggered = this.callback(this, collider);
            if (isTriggered) {
                this.interactive = false;
                this.markForDestroy();
            }
        }
    };

    destroy(options?: DestroyOptions) {
        super.destroy(options);
    }
}

export default Trigger;
