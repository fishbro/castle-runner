import { Application, Point, Texture } from "pixi.js";
import BoxCollider from "./BoxCollider";

class PixiApp {
    app: Application;

    constructor(frame: HTMLDivElement) {
        const app = (this.app = new Application());

        app.init({ background: "#000", resizeTo: window }).then(() => {
            frame.appendChild(app.canvas);

            this.init();
        });
    }

    init() {
        const { app } = this;

        // Options for how objects interact
        // How fast the red square moves
        const movementSpeed = 0.05;

        // Test For Hit
        // A basic AABB check between two different squares
        function testForAABB(object1: BoxCollider, object2: BoxCollider) {
            const bounds1 = object1.getBounds();
            const bounds2 = object2.getBounds();

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
            const bounds1 = object1.getBounds();
            const bounds2 = object2.getBounds();

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

        const collisionObjects: BoxCollider[] = [];

        // The square you move around
        const redSquare = new BoxCollider(Texture.WHITE, {
            width: 20,
            height: 20,
            tint: 0xff0000,
            x: (app.screen.width - 100) / 2,
            y: (app.screen.height - 100) / 2,
            acceleration: new Point(0),
            mass: 5000
        });
        app.stage.addChild(redSquare);

        for (let i = 0; i < 50; i++) {
            const randomSquare = new BoxCollider(Texture.WHITE, {
                width: 20,
                height: 20,
                tint: 0xffffff,
                x: Math.random() * app.screen.width,
                y: Math.random() * app.screen.height,
                acceleration: new Point(0),
                mass: 1
            });
            app.stage.addChild(randomSquare);
            collisionObjects.push(randomSquare);
        }

        const mouseCoords = { x: 0, y: 0 };

        app.stage.eventMode = "static";
        app.stage.hitArea = app.screen;
        app.stage.on("mousemove", event => {
            mouseCoords.x = event.global.x;
            mouseCoords.y = event.global.y;
        });
        app.stage.on("mousedown", event => {
            for (let i = 0; i < 10; i++) {
                const randomSquare = new BoxCollider(Texture.WHITE, {
                    width: 20,
                    height: 20,
                    tint: 0xffffff,
                    x: mouseCoords.x - 10,
                    y: mouseCoords.y - 10,
                    acceleration: new Point(0),
                    mass: 1
                });
                app.stage.addChild(randomSquare);
                collisionObjects.push(randomSquare);
            }
        });

        // Listen for animate update
        app.ticker.add(time => {
            const delta = time.deltaTime;

            const redSquareCenterPosition = redSquare.center;

            redSquare.tickerUpdate(delta);
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

                // If the green square pops out of the cordon, it pops back into the
                // middle
                if (
                    object.x < -30 ||
                    object.x > app.screen.width + 30 ||
                    object.y < -30 ||
                    object.y > app.screen.height + 30
                ) {
                    object.position.set(
                        (app.screen.width - 100) / 2,
                        (app.screen.height - 100) / 2
                    );
                }
            });

            //let green square follow the red square
            collisionObjects
                .filter(object => object !== redSquare)
                .forEach(object1 => {
                    const greenSquareCenterPosition = new Point(
                        object1.x + object1.width * 0.5,
                        object1.y + object1.height * 0.5
                    );

                    const toRedSquareDirection = new Point(
                        redSquare.x - greenSquareCenterPosition.x,
                        redSquare.y - greenSquareCenterPosition.y
                    );

                    const angleToRedSquare = Math.atan2(
                        toRedSquareDirection.y,
                        toRedSquareDirection.x
                    );

                    const distRedGreenSquare = distanceBetweenTwoPoints(
                        redSquareCenterPosition,
                        greenSquareCenterPosition
                    );

                    const greenSpeed = distRedGreenSquare * movementSpeed;

                    object1.acceleration.set(
                        Math.cos(angleToRedSquare) * greenSpeed,
                        Math.sin(angleToRedSquare) * greenSpeed
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

            // If the mouse is off screen, then don't update any further
            if (
                app.screen.width > mouseCoords.x ||
                mouseCoords.x > 0 ||
                app.screen.height > mouseCoords.y ||
                mouseCoords.y > 0
            ) {
                // Calculate the direction vector between the mouse pointer and
                // the red square
                const toMouseDirection = new Point(
                    mouseCoords.x - redSquareCenterPosition.x,
                    mouseCoords.y - redSquareCenterPosition.y
                );

                // Use the above to figure out the angle that direction has
                const angleToMouse = Math.atan2(
                    toMouseDirection.y,
                    toMouseDirection.x
                );

                // Figure out the speed the square should be travelling by, as a
                // function of how far away from the mouse pointer the red square is
                const distMouseRedSquare = distanceBetweenTwoPoints(
                    mouseCoords as Point,
                    redSquareCenterPosition
                );
                const redSpeed = distMouseRedSquare * movementSpeed;

                // Calculate the acceleration of the red square
                redSquare.acceleration.set(
                    Math.cos(angleToMouse) * redSpeed,
                    Math.sin(angleToMouse) * redSpeed
                );

                collisionObjects.forEach(object => {
                    object.acceleration.set(
                        object.acceleration.x +
                            Math.cos(angleToMouse) * redSpeed,
                        object.acceleration.y +
                            Math.sin(angleToMouse) * redSpeed
                    );
                });
            }
        });
    }
}

export default PixiApp;
