import {
    Application,
    Assets,
    Container,
    ContainerChild,
    Point,
    Sprite
} from "pixi.js";
import Squad from "../units/Squad";
import Gate from "./Gate";
import EnemySquad from "../units/EnemySquad";
import BoxCollider from "../main/BoxCollider";
import PixiApp from "../main/PixiApp";
import { distanceBetweenTwoPoints, testForAABB } from "../utils/misc";
import Soldier from "../units/Soldier";

type WayState = "start" | "way" | "pause" | "end";

class Way {
    symbol: Container<ContainerChild> = new Container();
    app: PixiApp;
    collisionObjects: BoxCollider[] = [];

    startPoint = 0;
    curPos = 0;
    speed = 3;
    state: WayState = "start";

    soldierSpeed = 0.05;
    playerSquad: Squad | null = null;
    enemies: EnemySquad[] = [];

    constructor(app: PixiApp) {
        this.app = app;
        this.symbol.sortableChildren = true;
        this.symbol.name = "way";
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

        PixiApp.events.on("addCollisionObject", this.addCollisionObject);
        PixiApp.events.on("removeCollisionObject", this.removeCollisionObject);

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
                    let object = null;
                    const { value, pos, width = 0 } = obj;
                    switch (obj.type) {
                        case "multiplier":
                            object = new Gate({
                                width: waySprite.width * width,
                                height: 100,
                                tint: 0x00ff00,
                                x: waySprite.width * pos.x,
                                y: waySprite.height * pos.y * -1 + tileOffset,
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
                            });

                            break;

                        case "increase":
                            object = new Gate({
                                width: waySprite.width * width,
                                height: 100,
                                tint: 0x00ff00,
                                x: waySprite.width * pos.x,
                                y: waySprite.height * pos.y * -1 + tileOffset,
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
                            });

                            break;

                        case "enemy":
                            object = new EnemySquad({
                                soldiers: value,
                                target: new Point(
                                    waySprite.width * pos.x,
                                    waySprite.height * pos.y * -1 + tileOffset
                                ),
                                debug: true
                            });
                            this.enemies.push(object);

                            break;

                        default:
                            break;
                    }

                    if (object) objectsContainer.addChild(object);
                });
            }

            symbol.addChild(tileContainer);

            waySprite.anchor.set(0, 1);
            waySprite.y = tileOffset;
            tileOffset += -waySprite.height;
        });

        symbol.addChild(objectsContainer);

        const factor = symbol.width / app.app.screen.width;
        symbol.scale.set(1 / factor);
        symbol.y = app.app.screen.height;

        this.startPoint = this.symbol.y;

        app.app.stage.addChild(symbol);

        const playerSquad = (this.playerSquad = new Squad({
            soldiers: 1,
            target: new Point(
                app.app.screen.width / 2,
                app.app.screen.height / 2
            ),
            debug: true
        }));
        app.app.stage.addChild(playerSquad);
    };

    conf = {
        borders: [0.2, 0.8],
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
                        type: "enemy",
                        value: 40,
                        pos: new Point(0.5, 0.5)
                    },
                    {
                        type: "multiplier",
                        value: 2,
                        pos: new Point(0.75, 0.75),
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
                    // {
                    //     type: "enemy",
                    //     value: 40,
                    //     pos: new Point(0.5, 0.5)
                    // },
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
        const {
            app,
            symbol,
            startPoint,
            speed,
            state,
            collisionObjects,
            playerSquad,
            soldierSpeed
        } = this;

        if (!playerSquad) return;

        if (state === "pause") return;

        this.enemies.forEach(enemy => {
            enemy.tickerUpdate(delta);
        });

        this.curPos += speed * delta;
        if (symbol.y < symbol.height) symbol.y = this.curPos + startPoint;

        playerSquad.tickerUpdate(delta);

        collisionObjects
            .filter(obj => obj.destroyed)
            .forEach(obj => {
                obj.destroy();
            });

        collisionObjects.forEach(object1 => {
            collisionObjects
                .filter(object2 => object2 !== object1)
                .forEach(object2 => {
                    if (testForAABB(object1, object2)) {
                        object1.onCollide(object2);
                        object2.onCollide(object1);
                    }
                });

            if (object1 instanceof Soldier) {
                if (object1.x < app.app.stage.width * this.conf.borders[0]) {
                    object1.x = app.app.stage.width * this.conf.borders[0];
                    //@ts-ignore
                    object1.acceleration.x = 0;
                }
                if (object1.x > app.app.stage.width * this.conf.borders[1]) {
                    object1.x = app.app.stage.width * this.conf.borders[1];
                    //@ts-ignore
                    object1.acceleration.x = 0;
                }
            }
        });

        const toMouseDirection = new Point(
            app.mouseCoords.x - playerSquad.target.x,
            app.mouseCoords.y - playerSquad.target.y
        );

        // Use the above to figure out the angle that direction has
        const angleToMouse = Math.atan2(toMouseDirection.y, toMouseDirection.x);

        // Figure out the speed the square should be travelling by, as a
        // function of how far away from the mouse pointer the red square is
        const distMousetarget = distanceBetweenTwoPoints(
            app.mouseCoords,
            playerSquad.target
        );
        const redSpeed = distMousetarget * soldierSpeed;

        // Calculate the acceleration of the squad target
        playerSquad.acceleration.set(
            Math.cos(angleToMouse) * redSpeed,
            Math.sin(angleToMouse) * redSpeed
        );
    }

    addCollisionObject = (object: BoxCollider) => {
        this.collisionObjects.push(object);
    };

    removeCollisionObject = (object: BoxCollider) => {
        const index = this.collisionObjects.indexOf(object);
        if (index !== -1) {
            this.collisionObjects.splice(index, 1);
        }
    };
}

export default Way;
