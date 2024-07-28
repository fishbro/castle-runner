import BoxCollider, { BoxColliderOptions } from "../main/BoxCollider";
import { AnimatedSprite, Assets, DestroyOptions, Point } from "pixi.js";
import { collisionResponse } from "../utils/misc";

const anim_conf = {
    left: "horde_knight_run_left_45_v01",
    right: "horde_knight_run_right_45_v01",
    forward: "horde_knight_run_v01"
};

type AnimType = "left" | "right" | "forward";

export type SoldierOptions = BoxColliderOptions & {
    width?: number;
    height?: number;
    tint?: number;
    x?: number;
    y?: number;
    acceleration?: Point;
    mass?: number;
    isTarget?: boolean;
};

class Soldier extends BoxCollider {
    acceleration: Point;
    mass: number;
    isTarget = false;

    curAnim: AnimType | null = null;
    animations: Map<AnimType, AnimatedSprite> = new Map();

    constructor(options: SoldierOptions) {
        super(options);

        this.acceleration = options.acceleration || new Point(0);
        this.mass = options.mass || 1;

        if (options.isTarget) this.isTarget = true;

        this.addAnimations();
        this.setAnimation("forward");
    }

    addAnimations = () => {
        const { width, height } = this.boundary;

        Object.keys(anim_conf).forEach((conf, key) => {
            //@ts-ignore
            const anim_name = anim_conf[conf];
            const animation = new AnimatedSprite(
                Assets.get("our").animations[anim_name]
            );
            animation.anchor.set(0.5);
            animation.scale.set(width * 0.04, height * 0.04);
            animation.animationSpeed = 0.5;
            animation.play();
            animation.visible = false;
            this.addChild(animation);
            //@ts-ignore
            this.animations.set(conf, animation);
        });
    };

    setAnimation = (dir: "forward" | "left" | "right") => {
        const { curAnim } = this;
        if (curAnim === dir) return;

        if (curAnim) {
            const prev = this.animations.get(curAnim);
            if (prev) prev.visible = false;
        }

        const anim = this.animations.get(dir);
        if (anim) anim.visible = true;

        this.curAnim = dir;
    };

    static loadTextures = () => {
        return Assets.load([
            {
                alias: "our",
                src: "/assets/spritesheets/soldier/soldier.json"
            },
            {
                alias: "enemy",
                src: "/assets/spritesheets/enemy/enemy.json"
            }
        ]);
    };

    tickerUpdate(delta: number) {
        this.acceleration.set(
            this.acceleration.x * 0.9,
            this.acceleration.y * 0.9
        );

        this.x += this.acceleration.x * delta;
        this.y += this.acceleration.y * delta;

        if (this.acceleration.x > 1.5) {
            this.setAnimation("right");
        } else if (this.acceleration.x < -1.5) {
            this.setAnimation("left");
        } else {
            this.setAnimation("forward");
        }
    }

    onCollide(collider: BoxCollider) {
        super.onCollide(collider);

        if (collider instanceof Soldier) {
            const collisionPush = collisionResponse(collider, this);

            this.acceleration.set(
                this.acceleration.x + collisionPush.x * collider.mass,
                this.acceleration.y + collisionPush.y * collider.mass
            );
        }
    }

    destroy(options?: DestroyOptions) {
        this.animations.forEach(anim => anim.destroy());

        super.destroy(options);
    }
}

export default Soldier;
