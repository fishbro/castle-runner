import BoxCollider from "../main/BoxCollider";

class Trigger extends BoxCollider {
    interactive = true;
    callback: () => void = () => {};

    onCollision = () => {
        if (this.interactive) {
            this.interactive = false;
            this.callback();
        }
    };
}

export default Trigger;
