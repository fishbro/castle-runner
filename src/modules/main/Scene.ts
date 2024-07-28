import PixiApp from "./PixiApp";
import { Container, ContainerChild } from "pixi.js";

class Scene {
    symbol: Container<ContainerChild> = new Container();
    app: PixiApp;

    constructor(app: PixiApp) {
        this.app = app;
        this.symbol.sortableChildren = true;
        this.symbol.name = "Scene";
    }
}

export default Scene;
