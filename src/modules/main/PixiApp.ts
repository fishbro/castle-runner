import { Application, Point } from "pixi.js";
import BoxCollider from "./BoxCollider";
import Way from "../way/Way";
import EventEmitter from "eventemitter3";
import {
    collisionResponse,
    distanceBetweenTwoPoints,
    testForAABB
} from "../utils/misc";
import Soldier from "../units/Soldier";

class PixiApp {
    static events: EventEmitter = new EventEmitter();
    app: Application = new Application();
    way: Way | null = null;

    isGameStarted = false;
    soldierSize = 0;
    collisionObjects: BoxCollider[] = [];
    _curSoldiers = 0;

    set curSoldiers(value: number) {
        const { app, collisionObjects, soldierSize } = this;
        const before = this._curSoldiers;
        this._curSoldiers = value;

        if (before === value) return;

        if (value < before) {
            for (let i = 0; i < before - value; i++) {
                const last = collisionObjects.pop();
                if (last) {
                    last.destroy();
                    app.stage.removeChild(last);
                }
            }
        } else {
            for (let i = 0; i < value - before; i++) {
                const soldier = new Soldier({
                    width: soldierSize,
                    height: soldierSize,
                    tint: 0xffffff,
                    x:
                        (app.screen.width - soldierSize) / 2 +
                        (1 - Math.random()) * 10,
                    y:
                        (app.screen.height - soldierSize) / 2 +
                        (1 - Math.random()) * 10,
                    acceleration: new Point(0),
                    mass: 1
                });
                app.stage.addChild(soldier);
                // collisionObjects.push(soldier);
            }
        }
    }

    get curSoldiers() {
        return this._curSoldiers;
    }

    constructor(frame: HTMLDivElement) {
        const { app } = this;
        const promises = [];

        promises.push(app.init({ background: "#000", resizeTo: frame }));
        promises.push(Way.loadTextures());
        promises.push(Soldier.loadTextures());

        Promise.all(promises).then(() => {
            frame.appendChild(app.canvas);
            //@ts-ignore
            globalThis.__PIXI_APP__ = app;
            this.way = new Way(app);
            this.soldierSize = app.screen.width / 20;

            PixiApp.events.on("addCollisionObject", this.addCollisionObject);
            PixiApp.events.on(
                "removeCollisionObject",
                this.removeCollisionObject
            );

            this.init();
        });
    }

    init() {
        const { app, way, collisionObjects } = this;

        if (!way) return;
        way.init();

        const movementSpeed = 0.05;
        const soldierSize = app.screen.width / 40;

        // The square you move around
        const target = new Soldier({
            width: soldierSize,
            height: soldierSize,
            tint: 0xff0000,
            x: (app.screen.width - soldierSize) / 2,
            y: (app.screen.height - soldierSize) / 2,
            acceleration: new Point(0),
            mass: 5000,
            isTarget: true
        });
        app.stage.addChild(target);

        this.curSoldiers = 5;

        const mouseCoords = {
            x: app.screen.width / 2,
            y: app.screen.height / 2
        };

        app.stage.eventMode = "static";
        app.stage.hitArea = app.screen;
        app.stage.on("mousemove", event => {
            mouseCoords.x = Math.min(
                Math.max(app.screen.width * 0.2, event.global.x),
                app.screen.width * 0.8
            );
        });
        app.stage.on("mousedown", event => {
            this.curSoldiers = Math.round(Math.random() * 100);
        });

        // Listen for animate update
        app.ticker.add(time => {
            if (!this.isGameStarted) return;
            const delta = time.deltaTime;

            const targetCenterPosition = target.center;

            way.tickerUpdate(delta);
            target.tickerUpdate(delta);
            collisionObjects.forEach(object => {
                object.tickerUpdate(delta);
                // Check whether the green square ever moves off the screen
                // If so, reverse acceleration in that direction
                if (object.x < 0 || object.x > app.screen.width - 100) {
                    object.acceleration.x = -object.acceleration.x;
                }

                if (object.y < 0 || object.y > app.screen.height - 100) {
                    object.acceleration.y = -object.acceleration.y;
                }

                if (object.x < app.stage.width * 0.2) {
                    object.x = app.stage.width * 0.2;
                }
                if (object.x > app.stage.width * 0.8) {
                    object.x = app.stage.width * 0.8;
                }
            });

            //let green square follow the red square
            collisionObjects
                .filter(object => object !== target)
                .forEach(object1 => {
                    object1.zIndex = Math.round(object1.y / 10);
                    if (object1 instanceof Soldier) {
                        if (target.acceleration.x > 1) {
                            object1.setAnimation("right");
                        } else if (target.acceleration.x < -1) {
                            object1.setAnimation("left");
                        } else {
                            object1.setAnimation("forward");
                        }
                    }

                    const greenSquareCenterPosition = new Point(
                        object1.x,
                        object1.y
                    );

                    const totargetDirection = new Point(
                        target.x - greenSquareCenterPosition.x,
                        target.y - greenSquareCenterPosition.y
                    );

                    const angleTotarget = Math.atan2(
                        totargetDirection.y,
                        totargetDirection.x
                    );

                    const distRedGreenSquare = distanceBetweenTwoPoints(
                        targetCenterPosition,
                        greenSquareCenterPosition
                    );

                    const greenSpeed = distRedGreenSquare * movementSpeed;

                    object1.acceleration.set(
                        Math.cos(angleTotarget) * greenSpeed,
                        Math.sin(angleTotarget) * greenSpeed
                    );

                    collisionObjects
                        .filter(object2 => object2 !== object1)
                        .forEach(object2 => {
                            if (testForAABB(object1, object2)) {
                                const collisionPush = collisionResponse(
                                    object1,
                                    object2
                                );
                                // overlapFix(object1, object2);
                                object2.acceleration.set(
                                    collisionPush.x * object1.mass,
                                    collisionPush.y * object1.mass
                                );
                            }
                        });
                });

            // Calculate the direction vector between the mouse pointer and
            // the red square
            const toMouseDirection = new Point(
                mouseCoords.x - targetCenterPosition.x,
                mouseCoords.y - targetCenterPosition.y
            );

            // Use the above to figure out the angle that direction has
            const angleToMouse = Math.atan2(
                toMouseDirection.y,
                toMouseDirection.x
            );

            // Figure out the speed the square should be travelling by, as a
            // function of how far away from the mouse pointer the red square is
            const distMousetarget = distanceBetweenTwoPoints(
                mouseCoords as Point,
                targetCenterPosition
            );
            const redSpeed = distMousetarget * movementSpeed;

            // Calculate the acceleration of the red square
            target.acceleration.set(
                Math.cos(angleToMouse) * redSpeed,
                Math.sin(angleToMouse) * redSpeed
            );

            collisionObjects.forEach(object => {
                object.acceleration.set(
                    object.acceleration.x + Math.cos(angleToMouse) * redSpeed,
                    object.acceleration.y + Math.sin(angleToMouse) * redSpeed
                );
            });
        });
    }

    start() {
        this.isGameStarted = true;
        this.way?.start();
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

export default PixiApp;
