import Squad, { type SquadOptions } from "./Squad";

// const EnemySquadOptions = SquadOptions & {
//
// };

class EnemySquad extends Squad {
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
    }
}

export default EnemySquad;
