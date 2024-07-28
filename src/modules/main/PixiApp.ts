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
    mouseCoords: Point = new Point();

    isGameStarted = false;

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
            this.way = new Way(this);
            // this.soldierSize = app.screen.width / 20;

            this.init();
        });
    }

    init() {
        const { app, way } = this;
        if (!way) return;
        way.init();

        this.mouseCoords.set(app.screen.width / 2, app.screen.height / 2);

        app.stage.eventMode = "static";
        app.stage.hitArea = app.screen;
        app.stage.on("mousemove", event => {
            this.mouseCoords.x = Math.min(
                Math.max(app.screen.width * 0.2, event.global.x),
                app.screen.width * 0.8
            );
        });

        // Listen for animate update
        app.ticker.add(time => {
            if (!this.isGameStarted) return;
            const delta = time.deltaTime;

            way.tickerUpdate(delta);
        });
    }

    start() {
        this.isGameStarted = true;
        this.way?.start();
    }
}

export default PixiApp;
