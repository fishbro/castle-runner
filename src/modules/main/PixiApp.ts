import { Application, Assets, Point, Texture } from "pixi.js";
import BoxCollider from "./BoxCollider";
import Way from "./Way";

class PixiApp {
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
                    app.stage.removeChild(last);
                }
            }
        } else {
            for (let i = 0; i < value - before; i++) {
                const soldier = new BoxCollider({
                    width: soldierSize,
                    height: soldierSize,
                    tint: 0xffffff,
                    x: Math.random() * app.screen.width,
                    y: Math.random() * app.screen.height,
                    acceleration: new Point(0),
                    mass: 1
                });
                app.stage.addChild(soldier);
                collisionObjects.push(soldier);
            }
        }
    }

    get curSoldiers() {
        return this._curSoldiers;
    }

    constructor(frame: HTMLDivElement) {
        const { app, way } = this;
        const promises = [];

        promises.push(app.init({ background: "#000", resizeTo: window }));
        promises.push(Way.loadTextures());
        promises.push(BoxCollider.loadTextures());

        Promise.all(promises).then(() => {
            frame.appendChild(app.canvas);
            //@ts-ignore
            globalThis.__PIXI_APP__ = app;
            this.way = new Way(app);
            this.soldierSize = app.screen.width / 20;

            this.init();
        });
    }

    init() {
        const { app, way, collisionObjects } = this;

        if (!way) return;
        way.init();

        // Options for how objects interact
        // How fast the red square moves
        const movementSpeed = 0.05;

        // Test For Hit
        // A basic AABB check between two different squares
        function testForAABB(object1: BoxCollider, object2: BoxCollider) {
            const bounds1 = object1.boundary.getBounds();
            const bounds2 = object2.boundary.getBounds();

            return (
                bounds1.x < bounds2.x + bounds2.width &&
                bounds1.x + bounds1.width > bounds2.x &&
                bounds1.y < bounds2.y + bounds2.height &&
                bounds1.y + bounds1.height > bounds2.y
            );
        }

        function testForCircleCollision(
            object1: BoxCollider,
            object2: BoxCollider
        ) {
            const bounds1 = object1.boundary.getBounds();
            const bounds2 = object2.boundary.getBounds();

            // Calculate the distance between the centers of the circles
            const dx = bounds1.x - bounds2.x;
            const dy = bounds1.y - bounds2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const radius1 = bounds1.width / 2;
            const radius2 = bounds2.width / 2;

            // Check if the distance is less than the sum of the radii
            return distance < radius1 + radius2;
        }

        // Calculates the results of a collision, allowing us to give an impulse that
        // shoves objects apart
        function collisionResponse(object1: BoxCollider, object2: BoxCollider) {
            if (!object1 || !object2) {
                return new Point(0);
            }

            const vCollision = new Point(
                object2.x - object1.x,
                object2.y - object1.y
            );

            const distance = Math.sqrt(
                (object2.x - object1.x) * (object2.x - object1.x) +
                    (object2.y - object1.y) * (object2.y - object1.y)
            );

            const vCollisionNorm = new Point(
                vCollision.x / distance,
                vCollision.y / distance
            );

            return vCollisionNorm;
        }

        // Calculate the distance between two given points
        function distanceBetweenTwoPoints(p1: Point, p2: Point) {
            const a = p1.x - p2.x;
            const b = p1.y - p2.y;

            return Math.hypot(a, b);
        }

        const soldierSize = app.screen.width / 40;

        // The square you move around
        const target = new BoxCollider({
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
                    if (target.acceleration.x > 1) {
                        object1.setAnimation("right");
                    } else if (target.acceleration.x < -1) {
                        object1.setAnimation("left");
                    } else {
                        object1.setAnimation("forward");
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
    }
}

export default PixiApp;
