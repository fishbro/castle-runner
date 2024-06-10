import { Point, Sprite, Texture } from "pixi.js";
import { SpriteOptions } from "pixi.js/lib/scene/sprite/Sprite";

class BoxCollider extends Sprite {
    acceleration: Point;
    mass: number;

    constructor(
        options?: SpriteOptions | Texture,
        colOpt?: {
            width?: number;
            height?: number;
            tint?: number;
            x?: number;
            y?: number;
            acceleration?: Point;
            mass?: number;
        }
    ) {
        super(options);
        if (colOpt) {
            this.width = colOpt.width || 0;
            this.height = colOpt.height || 0;
            this.tint = colOpt.tint || 0xffffff;
            this.x = colOpt.x || 0;
            this.y = colOpt.y || 0;
            this.acceleration = colOpt.acceleration || new Point(0);
            this.mass = colOpt.mass || 1;
        } else {
            this.acceleration = new Point(0);
            this.mass = 1;
        }
    }

    get center() {
        return new Point(this.x + this.width / 2, this.y + this.height / 2);
    }

    tickerUpdate(delta: number) {
        this.acceleration.set(
            this.acceleration.x * 0.99,
            this.acceleration.y * 0.99
        );

        this.x += this.acceleration.x * delta;
        this.y += this.acceleration.y * delta;
    }
}

export default BoxCollider;
