import {
    Application,
    Assets,
    Container,
    ContainerChild,
    Sprite
} from "pixi.js";

class Way {
    symbol: Container<ContainerChild> = new Container();
    app: Application;

    startPoint = 0;
    curPos = 0;
    speed = 1;

    constructor(app: Application) {
        this.app = app;
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

        let pos = 0;

        conf.tiles.forEach(tile => {
            const container = new Container();
            container.name = tile;
            const texture = Assets.get(tile);
            const sprite = new Sprite(texture);
            sprite.name = tile;
            container.addChild(sprite);

            sprite.anchor.set(0, 1);
            sprite.y = pos;
            pos += -sprite.height;

            symbol.addChild(container);
        });

        const factor = symbol.width / app.screen.width;
        symbol.scale.set(1 / factor);
        symbol.y = app.screen.height;

        this.startPoint = this.symbol.y;

        app.stage.addChild(symbol);

        this.speed = symbol.height / 1000;
    };

    conf = {
        tiles: ["start", "way", "end"]
    };

    tickerUpdate(delta: number) {
        const { symbol, startPoint, speed } = this;

        this.curPos += speed * delta;

        if (symbol.y < symbol.height) symbol.y = this.curPos + startPoint;
    }
}

export default Way;
