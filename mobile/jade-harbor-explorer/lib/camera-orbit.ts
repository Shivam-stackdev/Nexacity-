import type { Vec3 } from "@/lib/jade-harbor-3d-world";

export type CameraOrbit = { yaw: number; pitch: number };

export const DEFAULT_CAMERA_ORBIT: CameraOrbit = { yaw: 0, pitch: 0.78 };
export const MIN_CAMERA_PITCH = 0.4;
export const MAX_CAMERA_PITCH = 1.02;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function wrapAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function easeAngle(current: number, target: number, alpha: number) {
  const delta = wrapAngle(target - current);
  return wrapAngle(current + delta * alpha);
}

export function createCameraOrbit(): CameraOrbit {
  return { ...DEFAULT_CAMERA_ORBIT };
}

export function applyOrbitDrag(orbit: CameraOrbit, dx: number, dy: number): CameraOrbit {
  return {
    yaw: wrapAngle(orbit.yaw - dx * 0.012),
    pitch: clamp(orbit.pitch - dy * 0.008, MIN_CAMERA_PITCH, MAX_CAMERA_PITCH),
  };
}

export function smoothCameraOrbit(current: CameraOrbit, target: CameraOrbit, dtSeconds: number, response = 11): CameraOrbit {
  const alpha = 1 - Math.exp(-response * dtSeconds);
  return {
    yaw: easeAngle(current.yaw, target.yaw, alpha),
    pitch: current.pitch + (target.pitch - current.pitch) * alpha,
  };
}

export function cameraRelativeDirection(input: Vec3, yaw: number): Vec3 {
  const cosine = Math.cos(yaw);
  const sine = Math.sin(yaw);
  return {
    x: input.x * cosine + input.z * sine,
    z: -input.x * sine + input.z * cosine,
  };
}
