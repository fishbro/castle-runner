import { Application, Point } from "pixi.js";
import BoxCollider from "./BoxCollider";
import Way from "../way/Way";
import EventEmitter from "eventemitter3";
import { distanceBetweenTwoPoints, testForAABB } from "../utils/misc";
import Soldier from "../units/Soldier";
import Squad from "../units/Squad";

class PixiApp {
    static events: EventEmitter = new EventEmitter();
    app: Application = new Application();
    way: Way | null = null;

    isGameStarted = false;
    collisionObjects: BoxCollider[] = [];

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
            // this.soldierSize = app.screen.width / 20;

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
        const playerSquad = new Squad({
            app,
            soldiers: 1,
            target: new Point(app.screen.width / 2, app.screen.height / 2)
        });
        app.stage.addChild(playerSquad);

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
            playerSquad.curSoldiers = Math.round(Math.random() * 100);
        });

        // Listen for animate update
        app.ticker.add(time => {
            if (!this.isGameStarted) return;
            const delta = time.deltaTime;

            way.tickerUpdate(delta);
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
                    if (object1.x < app.stage.width * 0.2) {
                        object1.x = app.stage.width * 0.2;
                        //@ts-ignore
                        object1.acceleration.x = 0;
                    }
                    if (object1.x > app.stage.width * 0.8) {
                        object1.x = app.stage.width * 0.8;
                        //@ts-ignore
                        object1.acceleration.x = 0;
                    }
                }
            });

            const toMouseDirection = new Point(
                mouseCoords.x - playerSquad.target.x,
                mouseCoords.y - playerSquad.target.y
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
                playerSquad.target
            );
            const redSpeed = distMousetarget * movementSpeed;

            // Calculate the acceleration of the squad target
            playerSquad.acceleration.set(
                Math.cos(angleToMouse) * redSpeed,
                Math.sin(angleToMouse) * redSpeed
            );
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
