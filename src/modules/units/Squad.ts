import Soldier from "./Soldier";
import { DestroyOptions, Point, Texture } from "pixi.js";
import { distanceBetweenTwoPoints } from "../utils/misc";
import BoxCollider, { BoxColliderOptions } from "../main/BoxCollider";

export type SquadOptions = BoxColliderOptions & {
    soldiers: number;
    target: Point;
    debug?: boolean;
};

class Squad extends BoxCollider {
    soldierSize = 20;
    soldiersList: Soldier[] = [];
    target: Point;
    movementSpeed = 0.005;
    acceleration: Point = new Point(0);

    constructor(options: SquadOptions) {
        super(options);

        this.name = "Squad";

        this.target = options.target;
        this.curSoldiers = options.soldiers;

        if (options.debug) {
            this.boundary.texture = Texture.WHITE;
            this.boundary.alpha = 0.5;
            this.boundary.zIndex = 999999;
        }

        this.init();
    }

    init() {
        const { soldierSize } = this;

        this.boundary.width = soldierSize;
        this.boundary.height = soldierSize;
        this.boundary.tint = 0xffffff;
        this.boundary.anchor.set(0.5);
        this.boundary.x = this.target.x;
        this.boundary.y = this.target.y;
        this.addChild(this.boundary);
    }

    _curSoldiers = 0;

    set curSoldiers(value: number) {
        const { soldiersList, soldierSize } = this;
        const before = this._curSoldiers;
        this._curSoldiers = value;

        if (before === value) return;

        if (value < before) {
            for (let i = 0; i < before - value; i++) {
                const last = soldiersList.pop();
                if (last) {
                    last.markForDestroy();
                    this.removeChild(last);
                }
            }
        } else {
            for (let i = 0; i < value - before; i++) {
                const soldier = new Soldier({
                    squad: this,
                    width: soldierSize,
                    height: soldierSize,
                    tint: 0xffffff,
                    x: this.target.x + (1 - Math.random()) * 10,
                    y: this.target.y + (1 - Math.random()) * 10,
                    acceleration: new Point(0),
                    mass: 0.1
                });
                this.addChild(soldier);
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

    destroy(options?: DestroyOptions) {
        super.destroy(options);

        this.soldiersList.forEach(
            soldier => soldier.destroy && soldier.destroy()
        );
    }
}

export default Squad;
