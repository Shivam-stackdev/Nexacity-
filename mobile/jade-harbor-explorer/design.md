# Jade Harbor Mobile Prototype — Interface Design

## Product intent

Jade Harbor is a portrait-first, Android-targeted **3D** exploration prototype set in an original stylized mountain harbor city. The experience is a focused open-world vertical slice built with a native OpenGL-backed 3D scene: the player moves an explorer through a walkable harbor district, the elevated camera follows their position, and the city is assembled from reusable facade, bridge, lantern, market, and jade-ornament families.

## Screen list

| Screen | Primary content and functionality |
|---|---|
| Exploration | Full-screen 3D harbor district, controllable explorer, elevated follow camera, landmark labels, water, walkable roads, modular buildings, market props, smooth analog joystick, jump/sprint actions, and a time-of-day control. |
| Pause sheet | Resume control, district legend, compact performance note, and restart action. |
| Landmark panel | Short context card when the explorer enters a landmark zone, with a dismiss control. |

## Portrait layout

The exploration view uses the whole 9:16 screen. The top safe area contains a compact district chip, time-of-day readout, performance label, and pause button. The center holds a real-time 3D world seen through an elevated follow camera. The left bottom quarter reserves a floating analog joystick with a dead zone, eased movement response, and spring-centered knob for one-handed movement. The right bottom corner groups jump, hold-to-sprint, and restart actions. A subtle quest/landmark prompt sits above controls so it does not obscure the explorer.

## Core user flows

The player opens the prototype and begins in the Lantern Market. They press and drag the floating left joystick to move in eight directions across 3D terrain; the input smooths into movement rather than snapping to a direction. The explorer turns toward movement while the camera follows at an elevated third-person angle. The player taps JUMP to perform a grounded jump and holds SPRINT for faster movement. Entering the Stone Bridge, Jade Gate, or Harbor Pier triggers a concise landmark card. The TIME control advances the lighting cycle for review, while the prototype also transitions gradually during play.

## Visual direction

The world uses a warm ochre ground, dark teal roofs, jade water, grey stone, bronze accents, and warm lantern light. A restrained, original harbor lighting cycle moves between clear day, amber sunset, and cool moonlit night. It changes the sky, fog, water tint, directional light, ambient light, lantern strength, and emissive windows without high-cost real-time shadows or proprietary visual assets. The scene translates the original Jade Harbor concept art into 3D modular geometry: repeated roof-and-facade modules form buildings, bridge segments span water, lantern and market meshes dress walkable streets, and a jade ornament marks a landmark.

## Performance choices

The prototype uses a single native GL context, static low-poly geometry, a limited light set, shared materials, simple box collisions, and a capped device pixel ratio. The lighting cycle reuses existing material and light references and updates its visible state at a controlled cadence. It avoids runtime asset streaming, large texture maps, per-frame geometry allocation, expensive shadows, and transparency-heavy effects. World objects are created once from static data; only player, camera, controls, and lighting values change during play. This gives a real 3D baseline for later GLB/Godot asset replacement while keeping the Android vertical slice intentionally small.
