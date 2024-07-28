import { Container, DestroyOptions, Point, Sprite, Texture } from "pixi.js";
import PixiApp from "./PixiApp";

export type BoxColliderOptions = {
    width?: number;
    height?: number;
    tint?: number;
    x?: number;
    y?: number;
    debug?: boolean;
};

class BoxCollider extends Container<any> {
    boundary: Sprite = new Sprite();
    destroyed = false;

    constructor(options: BoxColliderOptions) {
        super(options);

        this.sortableChildren = true;

        this.x = options.x || 0;
        this.y = options.y || 0;

        if (options.debug) {
            this.boundary.texture = Texture.WHITE;
            this.boundary.zIndex = 999999;
        }

        this.boundary.width = options.width || 0;
        this.boundary.height = options.height || 0;
        this.boundary.tint = options.tint || 0xffffff;
        this.boundary.anchor.set(0.5);

        const { boundary } = this;
        this.addChild(boundary);

        PixiApp.events.emit("addCollisionObject", this);
    }

    get center() {
        return new Point(this.x, this.y);
    }

    tickerUpdate(delta: number) {}

    onCollide(collider: BoxCollider) {}

    markForDestroy() {
        this.destroyed = true;
    }

    destroy(options?: DestroyOptions) {
        PixiApp.events.emit("removeCollisionObject", this);
        this.boundary.destroy();

        super.destroy(options);
    }
}

export default BoxCollider;
