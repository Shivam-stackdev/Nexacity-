import { describe, expect, it } from "vitest";

import { resolveJoystickInput, smoothAxis } from "../lib/mobile-controls";

describe("mobile controls", () => {
  it("applies a dead zone and keeps the joystick idle for tiny drags", () => {
    expect(resolveJoystickInput(4, 0, 50)).toMatchObject({ active: false, direction: { x: 0, y: 0 } });
  });

  it("clamps the visual knob while retaining normalized direction", () => {
    const input = resolveJoystickInput(150, 0, 50);
    expect(input).toMatchObject({ active: true, direction: { x: 1, y: 0 }, knob: { x: 50, y: 0 } });
  });

  it("eases movement toward the target vector instead of snapping", () => {
    const eased = smoothAxis(0, 1, 1 / 60);
    expect(eased).toBeGreaterThan(0);
    expect(eased).toBeLessThan(1);
  });
});
