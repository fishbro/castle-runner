import { Application } from "pixi.js";

class PixiApp {
    app: Application;

    constructor(frame: HTMLDivElement) {
        const app = (this.app = new Application());

        app.init({ background: "#000", resizeTo: window }).then(() => {
            frame.appendChild(app.canvas);
        });
    }
}

export default PixiApp;
