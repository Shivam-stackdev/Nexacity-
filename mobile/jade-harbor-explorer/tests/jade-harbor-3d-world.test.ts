import { describe, expect, it } from "vitest";

import {
  EXPLORER_START,
  WORLD_LIMIT,
  createExplorerMotion,
  landmarkAt3D,
  moveExplorer3D,
  requestJump,
  stepExplorerMotion,
} from "../lib/jade-harbor-3d-world";

describe("Jade Harbor 3D world logic", () => {
  it("keeps the explorer inside the 3D district boundary", () => {
    const moved = moveExplorer3D({ x: WORLD_LIMIT - 0.2, z: WORLD_LIMIT - 0.2 }, { x: 1, z: 1 }, 2);
    expect(moved.x).toBeLessThanOrEqual(WORLD_LIMIT);
    expect(moved.z).toBeLessThanOrEqual(WORLD_LIMIT);
  });

  it("blocks movement into a 3D building footprint", () => {
    const moved = moveExplorer3D({ x: -23, z: -15 }, { x: 1, z: 0 }, 0.8);
    expect(moved).toEqual({ x: -23, z: -15 });
  });

  it("detects the market landmark in world coordinates", () => {
    expect(landmarkAt3D({ x: 0, z: 10 })?.id).toBe("lantern-market");
  });

  it("does not report a landmark at the starting point", () => {
    expect(landmarkAt3D(EXPLORER_START)).toBeNull();
  });

  it("moves farther while sprinting than while walking", () => {
    const walking = moveExplorer3D({ x: 0, z: 0 }, { x: 1, z: 0 }, 0.25);
    const sprinting = moveExplorer3D({ x: 0, z: 0 }, { x: 1, z: 0 }, 0.25, 1.6);
    expect(sprinting.x).toBeGreaterThan(walking.x);
  });

  it("starts a grounded jump and lands after gravity resolves", () => {
    const takeoff = requestJump(createExplorerMotion(EXPLORER_START));
    expect(takeoff.grounded).toBe(false);
    const rising = stepExplorerMotion(takeoff, { x: 0, z: 0 }, 0.1, false);
    expect(rising.height).toBeGreaterThan(0);

    let landing = rising;
    for (let index = 0; index < 40; index += 1) {
      landing = stepExplorerMotion(landing, { x: 0, z: 0 }, 0.1, false);
    }
    expect(landing).toMatchObject({ height: 0, verticalVelocity: 0, grounded: true });
  });
});
