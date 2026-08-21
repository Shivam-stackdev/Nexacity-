# Nexacity Staged Boot Screen

## Purpose

Nexacity now uses a two-step startup presentation on Android. A static native splash image appears before the engine can draw its first frame, after which a lightweight in-engine overlay remains visible through scene initialization. This prevents a blank, unbranded screen while the environment, world, player, and touch controls are prepared.

## Visual and timing specification

The native portrait asset at `assets/nexacity_boot_splash.png` has a dark navy background, a centered sky-blue `NEXACITY` title, soft atmospheric haze, and a small number of subdued particles. It is generated reproducibly by `tools/create_boot_splash.py` at 1080 × 1920 pixels.

The in-engine `NexacityBootOverlay` uses a CanvasLayer rather than a 3D scene or custom shader. The title begins its fade at 0.2 seconds, reaches full glow at 0.7 seconds, holds through 1.8 seconds, then fades out over 0.4 seconds. If initialization takes longer than the planned hold period, the overlay remains visible until readiness and then begins its fade.

| Time window | Behavior |
| --- | --- |
| 0.0–0.2 seconds | Dark background; native splash and in-engine handoff keep the screen branded. |
| 0.2–0.7 seconds | `NEXACITY` and its sky-blue glow fade in with the status label. |
| 0.7–1.8 seconds | Full glow holds while startup stages run. |
| 1.8–2.2 seconds | The in-engine overlay fades smoothly to gameplay once the scene is ready. |

## Startup stages

`scripts/world/Main.gd` now yields between visible stages instead of inserting blocking waits. The statuses appear in the following sequence: **Initialize Godot**, **Initialize environment**, **Generate world**, **Load player**, **Load touch controls**, and **Ready**. The UI is created before the first yield, so it gets a render opportunity before runtime world creation begins.

The overlay has lightweight validation points for environment creation, city generation, player instantiation, and touch-control initialization. If any of those checks fail, the overlay remains onscreen. Debug builds display a concise error message rather than silently transitioning away; the error is also recorded through Godot's error output.

## Android packaging

`project.godot` registers the splash with `application/boot_splash/image`, a matching dark boot background, and a brief native minimum display time. Godot documents both the boot splash image and minimum-display-time project settings. [1]

The manual GitHub Actions workflow at `.github/workflows/android-debug.yml` exports the project as `build/nexacity.pck`, copies it to `assets/data.pck` in the official Android template, and writes the Android command line with `--main-pack assets://data.pck`. The project uses `export_filter="all_resources"`, so the configured native boot splash is included in the exported Godot pack without an additional copy step.

## Validation record

The project was opened with the official Godot 4.4.1 headless editor, which imported the new splash and registered the new overlay script. A short headless scene run also exercised the staged startup sequence with no parse, script, or runtime error after the environment-node naming postcondition was corrected. The existing successful manual build run, `32533112348`, is on `feature/jade-harbor-3d-controls` and published a non-expired `nexacity-debug-apk` artifact.

## Reference

[1]: https://docs.godotengine.org/en/4.4/classes/class_projectsettings.html "Godot Engine 4.4 ProjectSettings — boot splash settings"
