import {
    Application,
    Assets,
    Container,
    ContainerChild,
    Point,
    Sprite,
    Texture
} from "pixi.js";
import Trigger from "./Trigger";
import Squad from "../units/Squad";
import Gate from "./Gate";
import BoxCollider from "../main/BoxCollider";

type WayState = "start" | "way" | "pause" | "end";

class Way {
    symbol: Container<ContainerChild> = new Container();
    app: Application;

    startPoint = 0;
    curPos = 0;
    speed = 3;
    state: WayState = "start";

    constructor(app: Application) {
        this.app = app;
        this.symbol.sortableChildren = true;
    }

    static loadTextures = () => {
        return Assets.load([
            {
                alias: "end",
                src: "/assets/map/enemy.jpg"
            },
            {
                alias: "start",
                src: "/assets/map/our.jpg"
            },
            {
                alias: "way",
                src: "/assets/map/way.jpg"
            }
        ]);
    };

    init = () => {
        const { symbol, conf, app } = this;

        const objectsContainer = new Container();
        objectsContainer.name = "objects";

        let tileOffset = 0;
        conf.tiles.forEach(({ type, objects }) => {
            const tileContainer = new Container();
            tileContainer.name = type;

            const texture = Assets.get(type);
            const waySprite = new Sprite(texture);
            tileContainer.addChild(waySprite);
            waySprite.name = type;

            if (objects) {
                objects.forEach(obj => {
                    const { value, pos, width } = obj;
                    let options = {
                        width: waySprite.width * width,
                        height: 100,
                        tint: 0x00ff00,
                        x: waySprite.width * pos.x,
                        y: waySprite.height * pos.y * -1 + tileOffset,
                        onTrigger: (trigger: Trigger, collider: BoxCollider) =>
                            true,
                        text: ""
                    };
                    switch (obj.type) {
                        case "multiplier":
                            options = {
                                ...options,
                                text:
                                    value >= 1
                                        ? `* ${value}`
                                        : `/ ${1 / value}`,
                                onTrigger: (_trigger, collider) => {
                                    if (collider instanceof Squad) {
                                        collider.curSoldiers = Math.round(
                                            collider.curSoldiers * value
                                        );
                                        return true;
                                    }
                                    return false;
                                }
                            };

                            break;

                        case "increase":
                            options = {
                                ...options,
                                text: value.toString(),
                                onTrigger: (_trigger, collider) => {
                                    if (collider instanceof Squad) {
                                        collider.curSoldiers = Math.round(
                                            collider.curSoldiers + value
                                        );
                                        return true;
                                    }
                                    return false;
                                }
                            };

                            break;

                        default:
                            break;
                    }
                    const multiplier = new Gate(options);
                    objectsContainer.addChild(multiplier);
                });
            }

            symbol.addChild(tileContainer);

            waySprite.anchor.set(0, 1);
            waySprite.y = tileOffset;
            tileOffset += -waySprite.height;
        });

        symbol.addChild(objectsContainer);

        const factor = symbol.width / app.screen.width;
        symbol.scale.set(1 / factor);
        symbol.y = app.screen.height;

        this.startPoint = this.symbol.y;

        app.stage.addChild(symbol);
    };

    conf = {
        tiles: [
            {
                type: "start",
                objects: [
                    {
                        type: "multiplier",
                        value: 0.5,
                        pos: new Point(0.75, 1),
                        width: 0.5
                    },
                    {
                        type: "multiplier",
                        value: 2,
                        pos: new Point(0.75, 0.5),
                        width: 0.5
                    }
                ]
            },
            {
                type: "way",
                objects: [
                    {
                        type: "multiplier",
                        value: 2,
                        pos: new Point(0.25, 0),
                        width: 0.5
                    },
                    {
                        type: "multiplier",
                        value: 2,
                        pos: new Point(0.25, 0.5),
                        width: 0.5
                    },
                    {
                        type: "multiplier",
                        value: 2,
                        pos: new Point(0.25, 1),
                        width: 0.5
                    }
                ]
            },
            {
                type: "way",
                objects: [
                    {
                        type: "increase",
                        value: +50,
                        pos: new Point(0.25, 0),
                        width: 0.5
                    },
                    {
                        type: "increase",
                        value: -20,
                        pos: new Point(0.25, 0.5),
                        width: 0.5
                    },
                    {
                        type: "increase",
                        value: +10,
                        pos: new Point(0.25, 1),
                        width: 0.5
                    }
                ]
            },
            {
                type: "end",
                objects: [
                    {
                        type: "multiplier",
                        value: 2,
                        pos: new Point(0.75, 0),
                        width: 0.5
                    },
                    {
                        type: "multiplier",
                        value: 2,
                        pos: new Point(0.75, 0.5),
                        width: 0.5
                    }
                ]
            }
        ]
    };

    start() {
        this.state = "way";
    }

    pause() {
        this.state = "pause";
    }

    end() {
        this.state = "end";
    }

    tickerUpdate(delta: number) {
        const { symbol, startPoint, speed, state } = this;

        if (state === "pause") return;

        this.curPos += speed * delta;
        if (symbol.y < symbol.height) symbol.y = this.curPos + startPoint;
    }
}

export default Way;
