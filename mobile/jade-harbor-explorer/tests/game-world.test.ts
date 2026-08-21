import { describe, expect, it } from "vitest";

import { PLAYER_START, WORLD_SIZE, cameraForPlayer, landmarkAt, movePlayer } from "../lib/game-world";

describe("Jade Harbor world logic", () => {
  it("keeps the explorer inside world bounds", () => {
    const moved = movePlayer({ x: 30, y: 30 }, { x: -1, y: -1 }, 2);
    expect(moved.x).toBeGreaterThanOrEqual(28);
    expect(moved.y).toBeGreaterThanOrEqual(28);
  });

  it("prevents the explorer from entering a blocked building zone", () => {
    const moved = movePlayer({ x: 90, y: 300 }, { x: 1, y: 0 }, 0.3);
    expect(moved).toEqual({ x: 90, y: 300 });
  });

  it("centers and clamps the overhead camera around the explorer", () => {
    const camera = cameraForPlayer(PLAYER_START, { x: 390, y: 500 });
    expect(camera.x).toBeGreaterThanOrEqual(0);
    expect(camera.y).toBeGreaterThanOrEqual(0);
    const farCamera = cameraForPlayer({ x: WORLD_SIZE.width, y: WORLD_SIZE.height }, { x: 390, y: 500 });
    expect(farCamera.x).toBeLessThanOrEqual(WORLD_SIZE.width - 390);
    expect(farCamera.y).toBeLessThanOrEqual(WORLD_SIZE.height - 500);
  });

  it("identifies the Lantern Market landmark", () => {
    expect(landmarkAt({ x: 476, y: 1098 })?.id).toBe("lantern-market");
  });
});
