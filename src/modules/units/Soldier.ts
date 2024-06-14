import BoxCollider, { BoxColliderOptions } from "../main/BoxCollider";
import { AnimatedSprite, Assets, DestroyOptions } from "pixi.js";

const anim_conf = {
    left: "horde_knight_run_left_45_v01",
    right: "horde_knight_run_right_45_v01",
    forward: "horde_knight_run_v01"
};

type AnimType = "left" | "right" | "forward";

class Soldier extends BoxCollider {
    curAnim: AnimType | null = null;
    animations: Map<AnimType, AnimatedSprite> = new Map();

    constructor(options: BoxColliderOptions) {
        super(options);

        this.addAnimations();
        this.setAnimation("forward");
    }

    addAnimations = () => {
        Object.keys(anim_conf).forEach((conf, key) => {
            //@ts-ignore
            const anim_name = anim_conf[conf];
            const animation = new AnimatedSprite(
                Assets.get("our").animations[anim_name]
            );
            animation.anchor.set(0.5);
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

    destroy(options?: DestroyOptions) {
        this.animations.forEach(anim => anim.destroy());

        super.destroy(options);
    }
}

export default Soldier;
