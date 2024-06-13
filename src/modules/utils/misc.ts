import BoxCollider from "../main/BoxCollider";
import { Point } from "pixi.js";

export function testForAABB(object1: BoxCollider, object2: BoxCollider) {
    const bounds1 = object1.boundary.getBounds();
    const bounds2 = object2.boundary.getBounds();

    return (
        bounds1.x < bounds2.x + bounds2.width &&
        bounds1.x + bounds1.width > bounds2.x &&
        bounds1.y < bounds2.y + bounds2.height &&
        bounds1.y + bounds1.height > bounds2.y
    );
}

export function testForCircleCollision(
    object1: BoxCollider,
    object2: BoxCollider
) {
    const bounds1 = object1.boundary.getBounds();
    const bounds2 = object2.boundary.getBounds();

    // Calculate the distance between the centers of the circles
    const dx = bounds1.x - bounds2.x;
    const dy = bounds1.y - bounds2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius1 = bounds1.width / 2;
    const radius2 = bounds2.width / 2;

    // Check if the distance is less than the sum of the radii
    return distance < radius1 + radius2;
}

export function collisionResponse(object1: BoxCollider, object2: BoxCollider) {
    if (!object1 || !object2) {
        return new Point(0);
    }

    const vCollision = new Point(object2.x - object1.x, object2.y - object1.y);

    const distance = Math.sqrt(
        (object2.x - object1.x) * (object2.x - object1.x) +
            (object2.y - object1.y) * (object2.y - object1.y)
    );

    const vCollisionNorm = new Point(
        vCollision.x / distance,
        vCollision.y / distance
    );

    return vCollisionNorm;
}

export function distanceBetweenTwoPoints(p1: Point, p2: Point) {
    const a = p1.x - p2.x;
    const b = p1.y - p2.y;

    return Math.hypot(a, b);
}
