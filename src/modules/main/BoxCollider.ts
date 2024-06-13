import {
    AnimatedSprite,
    Assets,
    Container,
    Point,
    Sprite,
    Texture
} from "pixi.js";

const anim_conf = {
    left: "horde_knight_run_left_45_v01",
    right: "horde_knight_run_right_45_v01",
    forward: "horde_knight_run_v01"
};

type AnimType = "left" | "right" | "forward";

class BoxCollider extends Container<any> {
    acceleration: Point;
    mass: number;
    boundary: Sprite = new Sprite();
    curAnim: AnimType | null = null;
    animations: Map<AnimType, AnimatedSprite> = new Map();

    constructor(options: {
        width?: number;
        height?: number;
        tint?: number;
        x?: number;
        y?: number;
        acceleration?: Point;
        mass?: number;
        isTarget?: boolean;
    }) {
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

        if (options.isTarget) {
            this.boundary.texture = Texture.WHITE;
        }
        // this.boundary.texture = Texture.WHITE;

        this.init();
    }

    init() {
        const { boundary } = this;
        this.addChild(boundary);

        this.addAnimations();
        this.setAnimation("forward");
        // console.log(Assets.get("our").animations["horde_knight_run_v01"]);
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
}

export default BoxCollider;
