import Soldier from "./Soldier";
import { Application, Point } from "pixi.js";
import { distanceBetweenTwoPoints } from "../utils/misc";
import BoxCollider, { BoxColliderOptions } from "../main/BoxCollider";

type SquadOptions = BoxColliderOptions & {
    app: Application;
    soldiers: number;
    target: Point;
};

class Squad extends BoxCollider {
    app: Application;
    soldierSize = 20;
    soldiersList: Soldier[] = [];
    target: Point;
    movementSpeed = 0.005;
    acceleration: Point = new Point(0);

    constructor(options: SquadOptions) {
        super(options);

        this.app = options.app;
        this.curSoldiers = options.soldiers;
        this.target = options.target;

        this.init();
    }

    init() {
        const { soldierSize, app } = this;

        this.boundary.width = soldierSize;
        this.boundary.height = soldierSize;
        this.boundary.tint = 0xffffff;
        this.boundary.anchor.set(0.5);
        this.boundary.zIndex = 1000;
        this.boundary.x = this.target.x;
        this.boundary.y = this.target.y;
        app.stage.addChild(this.boundary);
    }

    _curSoldiers = 0;

    set curSoldiers(value: number) {
        const { app, soldiersList, soldierSize } = this;
        const before = this._curSoldiers;
        this._curSoldiers = value;

        if (before === value) return;

        if (value < before) {
            for (let i = 0; i < before - value; i++) {
                const last = soldiersList.pop();
                if (last) {
                    last.markForDestroy();
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
                    mass: 0.1
                });
                app.stage.addChild(soldier);
                soldiersList.push(soldier);
            }
        }
    }

    get curSoldiers() {
        return this._curSoldiers;
    }

    moveSoldier = (soldier: Soldier, target: Point, delta: number) => {
        const soldierPos = new Point(soldier.x, soldier.y);

        const totargetDirection = new Point(
            target.x - soldierPos.x,
            target.y - soldierPos.y
        );

        const angleToTarget = Math.atan2(
            totargetDirection.y,
            totargetDirection.x
        );

        const distToTarget = distanceBetweenTwoPoints(target, soldierPos);
        const soldierSpeed = distToTarget * this.movementSpeed;

        soldier.acceleration.set(
            soldier.acceleration.x + Math.cos(angleToTarget) * soldierSpeed,
            soldier.acceleration.y + Math.sin(angleToTarget) * soldierSpeed
        );
    };

    tickerUpdate(delta: number) {
        const { target } = this;

        this.boundary.x = target.x;
        this.boundary.y = target.y;

        this.acceleration.set(
            this.acceleration.x * 0.99,
            this.acceleration.y * 0.99
        );

        this.target.x += this.acceleration.x * delta;
        this.target.y += this.acceleration.y * delta;

        this.soldiersList.forEach(soldier => {
            this.moveSoldier(soldier, target, delta);
            soldier.zIndex = Math.round(soldier.y / 10);
            soldier.tickerUpdate(delta);
        });

        // console.log(target);
    }
}

export default Squad;
