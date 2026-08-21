import { describe, expect, it } from "vitest";

import { getHarborDayCycle } from "../lib/day-cycle";

describe("Jade Harbor day cycle", () => {
  it("identifies the warm late-day interval as sunset", () => {
    const sunset = getHarborDayCycle(0.72);
    expect(sunset.label).toBe("SUNSET");
    expect(sunset.sunset).toBeGreaterThan(0.9);
  });

  it("identifies the end of the cycle as night and reduces daylight", () => {
    const night = getHarborDayCycle(0.98);
    expect(night.label).toBe("NIGHT");
    expect(night.daylight).toBeLessThan(0.2);
  });

  it("wraps cycle progress predictably", () => {
    expect(getHarborDayCycle(1.72).progress).toBeCloseTo(0.72);
  });
});
