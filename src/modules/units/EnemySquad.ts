import Squad, { type SquadOptions } from "./Squad";
import Trigger from "../core/Trigger";
import Soldier from "./Soldier";
import PlayerSquad from "./PlayerSquad";

class EnemySquad extends Squad {
    active = false;
    trigger: Trigger = new Trigger({
        width: 400,
        height: 400,
        x: this.boundary.x,
        y: this.boundary.y,
        onTrigger: () => {
            this.active = true;
            return true;
        },
        debug: true
    });

    constructor(options: SquadOptions) {
        super(options);

        this.addChild(this.trigger);
        this.soldiersList.forEach(soldier => {
            soldier.onCollide = collider => {
                super.onCollide(collider);

                if (
                    this.active &&
                    collider instanceof Soldier &&
                    collider.squad instanceof PlayerSquad
                ) {
                    this.curSoldiers -= 1;
                    this.removeChild(collider);
                    collider.markForDestroy();

                    collider.squad.curSoldiers -= 1;
                }
            };
        });
    }
}

export default EnemySquad;
