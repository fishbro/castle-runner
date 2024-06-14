import { Container, DestroyOptions, Point, Sprite, Texture } from "pixi.js";
import PixiApp from "./PixiApp";

export type BoxColliderOptions = {
    width?: number;
    height?: number;
    tint?: number;
    x?: number;
    y?: number;
    acceleration?: Point;
    mass?: number;
    isTarget?: boolean;
};

class BoxCollider extends Container<any> {
    acceleration: Point;
    mass: number;
    boundary: Sprite = new Sprite();
    isTarget = false;

    constructor(options: BoxColliderOptions) {
        super(options);

        this.sortableChildren = true;

        this.x = options.x || 0;
        this.y = options.y || 0;
        this.acceleration = options.acceleration || new Point(0);
        this.mass = options.mass || 1;

        this.boundary.width = options.width || 0;
        this.boundary.height = options.height || 0;
        this.boundary.tint = options.tint || 0xffffff;
        this.boundary.anchor.set(0.5);

        const { boundary } = this;
        this.addChild(boundary);

        if (options.isTarget) {
            this.isTarget = true;
            this.boundary.texture = Texture.WHITE;
        } else {
            PixiApp.events.emit("addCollisionObject", this);
        }
    }

    get center() {
        return new Point(this.x, this.y);
    }

    tickerUpdate(delta: number) {
        this.acceleration.set(
            this.acceleration.x * 0.99,
            this.acceleration.y * 0.99
        );

        this.x += this.acceleration.x * delta;
        this.y += this.acceleration.y * delta;
    }

    destroy(options?: DestroyOptions) {
        if (!this.isTarget) {
            PixiApp.events.emit("removeCollisionObject", this);
        }

        this.boundary.destroy();

        super.destroy(options);
    }
}

export default BoxCollider;
