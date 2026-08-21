import { describe, expect, it } from "vitest";

import {
  MAX_CAMERA_PITCH,
  MIN_CAMERA_PITCH,
  applyOrbitDrag,
  cameraRelativeDirection,
  createCameraOrbit,
  smoothCameraOrbit,
} from "../lib/camera-orbit";

describe("camera orbit controls", () => {
  it("clamps pitch within the usable elevated-camera range", () => {
    const high = applyOrbitDrag(createCameraOrbit(), 0, -1000);
    const low = applyOrbitDrag(createCameraOrbit(), 0, 1000);
    expect(high.pitch).toBe(MAX_CAMERA_PITCH);
    expect(low.pitch).toBe(MIN_CAMERA_PITCH);
  });

  it("maps joystick movement into camera-relative world space", () => {
    const forwardAtQuarterTurn = cameraRelativeDirection({ x: 0, z: -1 }, Math.PI / 2);
    expect(forwardAtQuarterTurn.x).toBeCloseTo(-1);
    expect(forwardAtQuarterTurn.z).toBeCloseTo(0);
  });

  it("smooths the camera toward a swipe target instead of snapping", () => {
    const current = createCameraOrbit();
    const target = applyOrbitDrag(current, 80, -20);
    const next = smoothCameraOrbit(current, target, 1 / 60);
    expect(next.yaw).not.toBe(current.yaw);
    expect(next.yaw).not.toBe(target.yaw);
    expect(next.pitch).toBeGreaterThan(current.pitch);
    expect(next.pitch).toBeLessThan(target.pitch);
  });
});
