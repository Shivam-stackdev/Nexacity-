# Jade Harbor Mobile Prototype — Interface Design

## Product intent

Jade Harbor is a portrait-first, Android-targeted **3D** exploration prototype set in an original stylized mountain harbor city. The experience is a focused open-world vertical slice built with a native OpenGL-backed 3D scene: the player moves an explorer through a walkable harbor district, the elevated camera follows their position, and the city is assembled from reusable facade, bridge, lantern, market, and jade-ornament families.

## Screen list

| Screen | Primary content and functionality |
|---|---|
| Exploration | Full-screen 3D harbor district, controllable explorer, elevated follow camera, landmark labels, water, walkable roads, modular buildings, market props, and touch controls. |
| Pause sheet | Resume control, district legend, compact performance note, and restart action. |
| Landmark panel | Short context card when the explorer enters a landmark zone, with a dismiss control. |

## Portrait layout

The exploration view uses the whole 9:16 screen. The top safe area contains a compact district chip and landmark indicator. The center holds a real-time 3D world seen through an elevated follow camera. The left bottom quarter reserves a large drag joystick for one-handed movement; the right bottom corner holds pause and reset buttons. A subtle quest/landmark prompt sits above controls so it does not obscure the explorer.

## Core user flows

The player opens the prototype and begins in the Lantern Market. They press and drag the left joystick to move in eight directions across 3D terrain. The explorer turns toward movement while the camera follows at an elevated third-person angle. Entering the Stone Bridge, Jade Gate, or Harbor Pier triggers a concise landmark card. The player can pause, read the district legend, resume, or restart the local session.

## Visual direction

The world uses a warm ochre ground, dark teal roofs, jade water, grey stone, bronze accents, and warm lantern light. The scene translates the existing original Jade Harbor concept art into 3D modular geometry: repeated roof-and-facade modules form buildings, bridge segments span water, lantern and market meshes dress walkable streets, and a jade ornament marks a landmark. The camera is deliberately elevated and stylized to preserve clear touch gameplay.

## Performance choices

The prototype uses a single native GL context, static low-poly geometry, a limited light set, shared materials, simple box collisions, and a capped device pixel ratio. It avoids runtime asset streaming, large texture maps, per-frame geometry allocation, expensive shadows, and transparency-heavy effects. World objects are created once from static data; only player and camera transforms update during play. This gives a real 3D baseline for later GLB/Godot asset replacement while keeping the Android vertical slice intentionally small.
