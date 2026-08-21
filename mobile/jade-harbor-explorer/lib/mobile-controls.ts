export type StickVector = { x: number; y: number };

export type JoystickInput = {
  direction: StickVector;
  knob: StickVector;
  active: boolean;
};

export function resolveJoystickInput(dx: number, dy: number, radius: number, deadZone = 0.12): JoystickInput {
  const distance = Math.hypot(dx, dy);
  if (distance <= radius * deadZone || distance === 0) {
    return { direction: { x: 0, y: 0 }, knob: { x: 0, y: 0 }, active: false };
  }

  const unitX = dx / distance;
  const unitY = dy / distance;
  const clampedDistance = Math.min(distance, radius);
  return {
    direction: { x: unitX, y: unitY },
    knob: { x: unitX * clampedDistance, y: unitY * clampedDistance },
    active: true,
  };
}

export function smoothAxis(current: number, target: number, dtSeconds: number, response = 15) {
  const alpha = 1 - Math.exp(-response * dtSeconds);
  return current + (target - current) * alpha;
}
