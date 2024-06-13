import { Sprite } from "pixi.js";
import PixiApp from "../main/PixiApp";

class Trigger {
    boundary: Sprite = new Sprite();
    interactive = true;
    callback: () => void = () => {};

    constructor(options: {
        width?: number;
        height?: number;
        x?: number;
        y?: number;
        callback?: () => void;
    }) {
        this.boundary.width = options.width || 0;
        this.boundary.height = options.height || 0;
        this.boundary.x = options.x || 0;
        this.boundary.y = options.y || 0;
        this.callback = options.callback || this.callback;

        PixiApp.events.emit("addCollisionObject", this);
    }

    onCollision = () => {
        if (this.interactive) {
            this.interactive = false;
            this.callback();
        }
    };

    destroy() {
        PixiApp.events.emit("removeCollisionObject", this);
        this.boundary.destroy();
    }
}

export default Trigger;
