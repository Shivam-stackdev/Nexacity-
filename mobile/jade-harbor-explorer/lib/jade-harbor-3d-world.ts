export type Vec3 = { x: number; z: number };

export type Collider = { x: number; z: number; width: number; depth: number };

export type Landmark3D = {
  id: string;
  title: string;
  subtitle: string;
  x: number;
  z: number;
  radius: number;
  accent: string;
};

export type ExplorerMotionState = {
  position: Vec3;
  height: number;
  verticalVelocity: number;
  grounded: boolean;
  sprinting: boolean;
};

export const WORLD_LIMIT = 34;
export const EXPLORER_START: Vec3 = { x: 0, z: 17 };
export const EXPLORER_SPEED = 9.5;
export const SPRINT_MULTIPLIER = 1.6;
export const JUMP_IMPULSE = 10.5;
export const GRAVITY = 29;

export const buildingColliders: Collider[] = [
  { x: -17, z: -15, width: 8, depth: 8 },
  { x: 14, z: -18, width: 8, depth: 8 },
  { x: -18, z: 6, width: 8, depth: 8 },
  { x: 15, z: 7, width: 8, depth: 8 },
  { x: 0, z: 16, width: 10, depth: 7 },
];

export const landmarks3D: Landmark3D[] = [
  { id: "lantern-market", title: "Lantern Market", subtitle: "A modular timber market lit by low-cost warm lanterns.", x: 0, z: 10, radius: 5.6, accent: "#F6B85A" },
  { id: "moonstone-bridge", title: "Moonstone Bridge", subtitle: "A repeated stone span joins the harbor quarters over jade water.", x: 0, z: -3, radius: 5.2, accent: "#AEBDB1" },
  { id: "jade-gate", title: "Jade Gate", subtitle: "A hero landmark built around the shared jade-and-bronze material family.", x: 14, z: -16, radius: 5.2, accent: "#62D0B4" },
  { id: "harbor-pier", title: "Harbor Pier", subtitle: "An open district edge designed for future streamed-world expansion.", x: -17, z: -4, radius: 5.5, accent: "#75B8E3" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function overlaps(position: Vec3, collider: Collider, radius = 0.85) {
  return (
    position.x + radius > collider.x - collider.width / 2 &&
    position.x - radius < collider.x + collider.width / 2 &&
    position.z + radius > collider.z - collider.depth / 2 &&
    position.z - radius < collider.z + collider.depth / 2
  );
}

export function moveExplorer3D(position: Vec3, direction: Vec3, dtSeconds: number, speedMultiplier = 1): Vec3 {
  const magnitude = Math.hypot(direction.x, direction.z);
  if (magnitude < 0.02) return position;

  const speed = EXPLORER_SPEED * speedMultiplier;
  const candidate = {
    x: clamp(position.x + (direction.x / magnitude) * speed * dtSeconds, -WORLD_LIMIT, WORLD_LIMIT),
    z: clamp(position.z + (direction.z / magnitude) * speed * dtSeconds, -WORLD_LIMIT, WORLD_LIMIT),
  };

  return buildingColliders.some((collider) => overlaps(candidate, collider)) ? position : candidate;
}

export function createExplorerMotion(position = EXPLORER_START): ExplorerMotionState {
  return { position, height: 0, verticalVelocity: 0, grounded: true, sprinting: false };
}

export function requestJump(state: ExplorerMotionState): ExplorerMotionState {
  if (!state.grounded) return state;
  return { ...state, grounded: false, verticalVelocity: JUMP_IMPULSE };
}

export function stepExplorerMotion(
  state: ExplorerMotionState,
  direction: Vec3,
  dtSeconds: number,
  sprinting: boolean,
): ExplorerMotionState {
  const position = moveExplorer3D(state.position, direction, dtSeconds, sprinting ? SPRINT_MULTIPLIER : 1);
  let height = state.height;
  let verticalVelocity = state.verticalVelocity;
  let grounded = state.grounded;

  if (!grounded || verticalVelocity > 0) {
    verticalVelocity -= GRAVITY * dtSeconds;
    height += verticalVelocity * dtSeconds;
    if (height <= 0) {
      height = 0;
      verticalVelocity = 0;
      grounded = true;
    }
  }

  return { position, height, verticalVelocity, grounded, sprinting };
}

export function landmarkAt3D(position: Vec3): Landmark3D | null {
  return landmarks3D.find((landmark) => Math.hypot(position.x - landmark.x, position.z - landmark.z) <= landmark.radius) ?? null;
}
