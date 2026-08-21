# Compact City Prototype

This repository contains the first playable foundation milestone for a small anime-style 3D mobile city game. The project uses **Godot 4.4.1** and the Compatibility renderer so the scene is oriented toward mid-range Android hardware and a 30 FPS baseline.

## Current milestone

The prototype includes a compact procedural city test environment, a reusable third-person player scene, walking and running, a follow camera, a virtual joystick and run button architecture for Android touch input, and a lightweight performance/debug overlay. Buildings, roads, park features, school, petrol station, bus stop, and race markers are intentionally simple procedural placeholders.

Missions, economy, racing gameplay, NPC AI, traffic, multiple vehicles, inventory, shops, multiplayer, and advanced graphics are intentionally deferred to later milestones.

## Run locally

Open this folder in Godot 4.4.x and press **Run Project**. For keyboard testing, use **WASD** to move and **Shift** to run. On a touch device, use the left virtual joystick, the right-side **RUN** button, and a swipe on the right half of the screen to adjust the camera yaw.

A headless smoke test can be run from a terminal:

```bash
godot4 --headless --path . --quit-after 3
```

## Build a local Android APK

The local Android SDK, OpenJDK 17, Godot export templates, and a debug keystore are configured in the sandbox. Build a sideloadable debug APK with:

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
./tools/build_local_apk.sh
```

The output is written to `build/compact-city-debug.apk`. It is arm64-oriented, zip-aligned, and debug-signed for local phone testing. Verify the package with Android Build-Tools before installing it with `adb install -r build/compact-city-debug.apk`. A physical Android device is still required to confirm touch behavior and on-device FPS.

### Android startup crash fix

The crash recording showed: `Couldn't load project data at path ''. Is the .pck file missing?` The first repair corrected the `_cl_` file to Godot's binary command-line format. The follow-up repair corrected the pack URI as well: Android asset files are addressed through Godot's `assets://` scheme, so the build pipeline now encodes `--main-pack assets://data.pck` through `tools/write_command_line.py`. The APK is rebuilt and statically verified after both changes.

## Structure

```text
compact-city-prototype/
├── scenes/
│   ├── player/Player.tscn
│   └── world/Main.tscn
├── scripts/
│   ├── player/Player.gd
│   ├── ui/TouchControls.gd
│   ├── ui/DebugHud.gd
│   └── world/Main.gd
├── assets/
│   ├── characters/
│   ├── vehicles/
│   ├── environment/
│   ├── textures/
│   └── audio/
├── data/
├── project.godot
└── .gitignore
```

## Performance notes

The city is deliberately small and dense. Geometry is low-poly and generated at runtime, materials are simple `StandardMaterial3D` instances, the Compatibility renderer is enabled for desktop and mobile, and the directional light shadow distance is capped. Static colliders are only created for the ground and major environment pieces. The debug overlay reports FPS and node count during testing; Android profiling remains a required follow-up on a physical mid-range phone.

## Next recommended milestone

After director confirmation, add the modular vehicle base architecture and one basic controllable scooter. Vehicle interaction, missions, and NPC systems should remain out of scope until that vehicle slice is tested and committed.
