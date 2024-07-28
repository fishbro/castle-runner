import Trigger, { TriggerOptions } from "./Trigger";
import { DestroyOptions, Sprite, Text, Texture } from "pixi.js";

export type GateOptions = TriggerOptions & {
    text: string;
};

class Gate extends Trigger {
    text: Text;
    gateSprite: Sprite;

    constructor(options: GateOptions) {
        super(options);

        this.gateSprite = new Sprite(Texture.WHITE);
        this.text = new Text(options.text, {
            fontSize: 50,
            fill: 0xffffff
        });
        this.init();
    }

    init() {
        const { gateSprite, text } = this;

        gateSprite.width = this.boundary.width;
        gateSprite.height = this.boundary.height;
        gateSprite.tint = 0x000000;
        gateSprite.alpha = 0.5;
        gateSprite.anchor.set(0.5);
        this.addChild(gateSprite);

        text.anchor.set(0.5);
        this.addChild(text);
    }

    destroy(options?: DestroyOptions) {
        super.destroy(options);

        this.text.destroy();
        this.gateSprite.destroy();
    }
}

export default Gate;
