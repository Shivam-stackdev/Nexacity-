export type Vec2 = { x: number; y: number };

export type Landmark = {
  id: string;
  title: string;
  subtitle: string;
  position: Vec2;
  radius: number;
  accent: string;
};

export type WorldRect = { x: number; y: number; width: number; height: number };

export const WORLD_SIZE = { width: 980, height: 1600 } as const;
export const PLAYER_START: Vec2 = { x: 480, y: 1160 };
export const PLAYER_SPEED = 245;

export const blockedZones: WorldRect[] = [
  { x: 104, y: 250, width: 278, height: 192 },
  { x: 568, y: 214, width: 286, height: 250 },
  { x: 128, y: 774, width: 234, height: 180 },
  { x: 614, y: 752, width: 246, height: 198 },
  { x: 366, y: 1254, width: 238, height: 152 },
];

export const landmarks: Landmark[] = [
  {
    id: "lantern-market",
    title: "Lantern Market",
    subtitle: "A compact modular street of warm light, timber trims, and shared market props.",
    position: { x: 476, y: 1098 },
    radius: 118,
    accent: "#F6B85A",
  },
  {
    id: "stone-bridge",
    title: "Moonstone Bridge",
    subtitle: "A repeatable arch segment links the market quarter to the harbor terraces.",
    position: { x: 486, y: 672 },
    radius: 105,
    accent: "#AFBEAC",
  },
  {
    id: "jade-gate",
    title: "Jade Gate",
    subtitle: "A high-value landmark using a shared jade-and-bronze material family.",
    position: { x: 733, y: 356 },
    radius: 112,
    accent: "#5ED5B7",
  },
  {
    id: "harbor-pier",
    title: "Harbor Pier",
    subtitle: "A quiet edge of the district where streamed city sectors would meet water.",
    position: { x: 228, y: 530 },
    radius: 110,
    accent: "#79B7E8",
  },
];

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function inRect(point: Vec2, rect: WorldRect, radius = 18) {
  return (
    point.x + radius > rect.x &&
    point.x - radius < rect.x + rect.width &&
    point.y + radius > rect.y &&
    point.y - radius < rect.y + rect.height
  );
}

export function movePlayer(player: Vec2, direction: Vec2, dtSeconds: number): Vec2 {
  const magnitude = Math.hypot(direction.x, direction.y);
  if (magnitude < 0.02) return player;

  const normalized = { x: direction.x / magnitude, y: direction.y / magnitude };
  const candidate = {
    x: clamp(player.x + normalized.x * PLAYER_SPEED * dtSeconds, 28, WORLD_SIZE.width - 28),
    y: clamp(player.y + normalized.y * PLAYER_SPEED * dtSeconds, 28, WORLD_SIZE.height - 28),
  };

  return blockedZones.some((zone) => inRect(candidate, zone)) ? player : candidate;
}

export function cameraForPlayer(player: Vec2, viewport: Vec2): Vec2 {
  return {
    x: clamp(player.x - viewport.x / 2, 0, Math.max(0, WORLD_SIZE.width - viewport.x)),
    y: clamp(player.y - viewport.y / 2, 0, Math.max(0, WORLD_SIZE.height - viewport.y)),
  };
}

export function landmarkAt(position: Vec2): Landmark | null {
  return (
    landmarks.find((landmark) => Math.hypot(position.x - landmark.position.x, position.y - landmark.position.y) <= landmark.radius) ??
    null
  );
}
