import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import { Renderer } from "expo-three";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import * as THREE from "three";

import {
  EXPLORER_START,
  landmarkAt3D,
  createExplorerMotion,
  requestJump,
  stepExplorerMotion,
  type Landmark3D,
  type Vec3,
} from "@/lib/jade-harbor-3d-world";
import { getHarborDayCycle, type HarborTimeOfDay } from "@/lib/day-cycle";
import { resolveJoystickInput, smoothAxis } from "@/lib/mobile-controls";
import { applyOrbitDrag, cameraRelativeDirection, createCameraOrbit, smoothCameraOrbit } from "@/lib/camera-orbit";

type HarborLighting = {
  sun: THREE.DirectionalLight;
  skyLight: THREE.HemisphereLight;
  waterMaterial: THREE.MeshStandardMaterial;
  lanternLights: THREE.PointLight[];
  emissiveMaterials: THREE.MeshStandardMaterial[];
  skyColor: THREE.Color;
  progress: number;
  frameCount: number;
};

type SceneRuntime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  explorer: THREE.Group;
  gl: ExpoWebGLRenderingContext;
  lighting: HarborLighting;
};

const COLORS = {
  ground: 0xcba96e,
  road: 0xe6cc90,
  water: 0x2b8291,
  stone: 0x8e9189,
  timber: 0x5a311e,
  plaster: 0xb98555,
  roof: 0x1f5c61,
  jade: 0x2d9b84,
  bronze: 0xbd8a37,
  lantern: 0xf3ae4b,
};

const CYCLE_COLORS = {
  daySky: new THREE.Color(0x7bc6d1),
  sunsetSky: new THREE.Color(0xc86547),
  nightSky: new THREE.Color(0x102842),
  daySun: new THREE.Color(0xffe2a8),
  sunsetSun: new THREE.Color(0xff9656),
  nightSun: new THREE.Color(0x7188c6),
  dayWater: new THREE.Color(0x2b8291),
  sunsetWater: new THREE.Color(0x8c4a5b),
  nightWater: new THREE.Color(0x173d61),
};

function makeMaterial(color: number, roughness = 0.8, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  return object;
}

function createExplorer() {
  const explorer = new THREE.Group();
  const skin = makeMaterial(0xe9b98d, 0.75);
  const hair = makeMaterial(0x211a20, 0.9);
  const coat = makeMaterial(0x244e62, 0.7);
  const trim = makeMaterial(COLORS.bronze, 0.45, 0.35);

  explorer.add(mesh(new THREE.SphereGeometry(0.46, 12, 10), skin, 0, 2.05, 0));
  explorer.add(mesh(new THREE.SphereGeometry(0.48, 12, 8), hair, 0, 2.24, -0.06));
  explorer.add(mesh(new THREE.CylinderGeometry(0.48, 0.62, 1.25, 8), coat, 0, 1.02, 0));
  explorer.add(mesh(new THREE.TorusGeometry(0.49, 0.07, 6, 12), trim, 0, 1.56, 0));
  explorer.add(mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.68, 6), hair, -0.25, 0.28, 0));
  explorer.add(mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.68, 6), hair, 0.25, 0.28, 0));
  explorer.position.set(EXPLORER_START.x, 0, EXPLORER_START.z);
  return explorer;
}

function createHouse(x: number, z: number, scale = 1, rotation = 0) {
  const group = new THREE.Group();
  const stone = makeMaterial(COLORS.stone, 0.93);
  const plaster = makeMaterial(COLORS.plaster, 0.88);
  const timber = makeMaterial(COLORS.timber, 0.82);
  const roof = makeMaterial(COLORS.roof, 0.58, 0.06);
  const window = new THREE.MeshStandardMaterial({ color: 0xe7b45d, emissive: 0x7d4218, emissiveIntensity: 0.25, roughness: 0.62 });

  group.add(mesh(new THREE.BoxGeometry(4.8, 1.0, 4.8), stone, 0, 0.5, 0));
  group.add(mesh(new THREE.BoxGeometry(4.1, 3.4, 4.1), plaster, 0, 2.7, 0));
  group.add(mesh(new THREE.BoxGeometry(4.5, 0.32, 4.5), timber, 0, 4.18, 0));
  const roofMesh = mesh(new THREE.ConeGeometry(3.35, 2.0, 4), roof, 0, 5.22, 0);
  roofMesh.rotation.y = Math.PI / 4;
  group.add(roofMesh);
  for (const [dx, dz] of [[-1.45, 2.08], [1.45, 2.08], [-2.08, -1.45], [2.08, -1.45]] as const) {
    group.add(mesh(new THREE.BoxGeometry(0.72, 0.95, 0.13), window, dx, 2.85, dz));
  }
  group.add(mesh(new THREE.BoxGeometry(0.95, 1.55, 0.16), timber, 0, 1.75, 2.08));
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  return group;
}

function createMarket(x: number, z: number) {
  const group = new THREE.Group();
  const timber = makeMaterial(COLORS.timber, 0.82);
  const cloth = makeMaterial(COLORS.roof, 0.7);
  const bronze = makeMaterial(COLORS.bronze, 0.45, 0.35);
  const pottery = makeMaterial(0x7e9e85, 0.82);
  group.add(mesh(new THREE.BoxGeometry(6.2, 0.32, 2.9), timber, 0, 2.98, 0));
  for (const [dx, dz] of [[-2.7, -1.1], [2.7, -1.1], [-2.7, 1.1], [2.7, 1.1]] as const) {
    group.add(mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.1, 6), timber, dx, 1.55, dz));
  }
  group.add(mesh(new THREE.BoxGeometry(5.5, 0.38, 2.3), cloth, 0, 3.28, 0));
  group.add(mesh(new THREE.BoxGeometry(4.6, 1.1, 1.15), timber, 0, 0.55, 0.25));
  for (const dx of [-1.6, -0.7, 0.7, 1.6]) group.add(mesh(new THREE.SphereGeometry(0.27, 8, 6), pottery, dx, 1.25, 0.82));
  const lantern = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.56, 8), bronze, -2.25, 2.18, 1.2);
  group.add(lantern);
  group.position.set(x, 0, z);
  return group;
}

function createBridge() {
  const group = new THREE.Group();
  const stone = makeMaterial(COLORS.stone, 0.9);
  const jade = makeMaterial(COLORS.jade, 0.5, 0.15);
  group.add(mesh(new THREE.BoxGeometry(9.5, 0.75, 3.4), stone, 0, 1.0, -3));
  group.add(mesh(new THREE.BoxGeometry(9.6, 0.28, 0.24), stone, 0, 1.7, -4.45));
  group.add(mesh(new THREE.BoxGeometry(9.6, 0.28, 0.24), stone, 0, 1.7, -1.55));
  for (const x of [-3.9, -1.3, 1.3, 3.9]) group.add(mesh(new THREE.BoxGeometry(0.22, 0.22, 3.48), jade, x, 1.5, -3));
  return group;
}

function createLantern(x: number, z: number) {
  const group = new THREE.Group();
  const timber = makeMaterial(COLORS.timber, 0.8);
  const bronze = makeMaterial(COLORS.bronze, 0.4, 0.4);
  const glow = new THREE.MeshStandardMaterial({ color: COLORS.lantern, emissive: 0x9f4f18, emissiveIntensity: 0.7, roughness: 0.45 });
  group.add(mesh(new THREE.CylinderGeometry(0.16, 0.2, 3.0, 6), timber, 0, 1.5, 0));
  group.add(mesh(new THREE.BoxGeometry(1.2, 0.16, 0.16), bronze, 0.44, 2.7, 0));
  group.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.62, 8), glow, 0.9, 2.15, 0));
  const light = new THREE.PointLight(0xffb758, 1.4, 7, 2);
  light.position.set(0.9, 2.2, 0);
  group.add(light);
  group.position.set(x, 0, z);
  return group;
}

function buildWorld(scene: THREE.Scene) {
  const ground = mesh(new THREE.PlaneGeometry(76, 76), makeMaterial(COLORS.ground, 0.98), 0, 0, 0);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const waterMaterial = new THREE.MeshStandardMaterial({ color: COLORS.water, roughness: 0.28, metalness: 0.14 });
  for (const [x, z, width, depth] of [[-27, -1, 16, 46], [27, -1, 16, 46]] as const) {
    const water = mesh(new THREE.PlaneGeometry(width, depth), waterMaterial, x, 0.03, z);
    water.rotation.x = -Math.PI / 2;
    scene.add(water);
  }

  const roadMaterial = makeMaterial(COLORS.road, 0.94);
  for (const [x, z, width, depth] of [[0, 0, 15, 68], [0, 11, 52, 10], [0, -3, 22, 8]] as const) {
    const road = mesh(new THREE.BoxGeometry(width, 0.08, depth), roadMaterial, x, 0.08, z);
    scene.add(road);
  }

  scene.add(createHouse(-17, -15, 1, 0.18));
  scene.add(createHouse(14, -18, 1.08, -0.12));
  scene.add(createHouse(-18, 6, 0.98, -0.18));
  scene.add(createHouse(15, 7, 1.05, 0.24));
  scene.add(createHouse(0, 16, 1.18, 0));
  scene.add(createMarket(0, 10));
  scene.add(createMarket(11, 10));
  scene.add(createBridge());
  for (const [x, z] of [[-7, 11], [7, 11], [-6, -1], [6, -1], [15, -13], [-16, -4]] as const) scene.add(createLantern(x, z));

  const jadeGate = new THREE.Group();
  const jade = makeMaterial(COLORS.jade, 0.46, 0.22);
  const bronze = makeMaterial(COLORS.bronze, 0.35, 0.5);
  jadeGate.add(mesh(new THREE.CylinderGeometry(1.6, 1.8, 4.3, 8), jade, 0, 2.15, 0));
  jadeGate.add(mesh(new THREE.ConeGeometry(2.9, 2.3, 4), bronze, 0, 5.15, 0));
  jadeGate.position.set(14, 0, -16);
  scene.add(jadeGate);

  return waterMaterial;
}

function updateHarborLighting(runtime: SceneRuntime) {
  const cycle = getHarborDayCycle(runtime.lighting.progress);
  const { skyColor, sun, skyLight, waterMaterial, lanternLights, emissiveMaterials } = runtime.lighting;
  skyColor.copy(CYCLE_COLORS.nightSky).lerp(CYCLE_COLORS.daySky, cycle.daylight);
  skyColor.lerp(CYCLE_COLORS.sunsetSky, cycle.sunset);
  runtime.renderer.setClearColor(skyColor, 1);
  if (runtime.scene.fog instanceof THREE.Fog) {
    runtime.scene.fog.color.copy(skyColor);
    runtime.scene.fog.near = 27 - cycle.night * 6;
    runtime.scene.fog.far = 78 - cycle.night * 18;
  }

  sun.color.copy(CYCLE_COLORS.nightSun).lerp(CYCLE_COLORS.daySun, cycle.daylight);
  sun.color.lerp(CYCLE_COLORS.sunsetSun, cycle.sunset);
  sun.intensity = 0.34 + cycle.daylight * 1.85 + cycle.sunset * 0.55;
  sun.position.set(Math.cos(runtime.lighting.progress * Math.PI * 2) * 25, 8 + cycle.daylight * 26, 14);
  skyLight.color.copy(CYCLE_COLORS.nightSky).lerp(CYCLE_COLORS.daySky, cycle.daylight);
  skyLight.color.lerp(CYCLE_COLORS.sunsetSky, cycle.sunset * 0.65);
  skyLight.groundColor.setHex(cycle.night > 0.55 ? 0x122836 : 0x2f5553);
  skyLight.intensity = 0.58 + cycle.daylight * 1.75;

  waterMaterial.color.copy(CYCLE_COLORS.nightWater).lerp(CYCLE_COLORS.dayWater, cycle.daylight);
  waterMaterial.color.lerp(CYCLE_COLORS.sunsetWater, cycle.sunset * 0.8);
  waterMaterial.emissive.copy(waterMaterial.color).multiplyScalar(0.04 + cycle.night * 0.1);
  const lanternFactor = 0.2 + cycle.night * 1.4 + cycle.sunset * 0.72;
  lanternLights.forEach((light) => {
    light.intensity = lanternFactor;
  });
  emissiveMaterials.forEach((material) => {
    material.emissiveIntensity = 0.08 + lanternFactor * 0.45;
  });

  return cycle.label;
}

export function JadeHarbor3D() {
  const runtimeRef = useRef<SceneRuntime | null>(null);
  const frameRef = useRef<number | null>(null);
  const directionRef = useRef<Vec3>({ x: 0, z: 0 });
  const joystickTargetRef = useRef<Vec3>({ x: 0, z: 0 });
  const orbitRef = useRef(createCameraOrbit());
  const orbitTargetRef = useRef(createCameraOrbit());
  const orbitGestureRef = useRef({ x: 0, y: 0 });
  const explorerPositionRef = useRef<Vec3>(EXPLORER_START);
  const explorerMotionRef = useRef(createExplorerMotion(EXPLORER_START));
  const activeLandmarkRef = useRef<string | null>(null);
  const pausedRef = useRef(false);
  const statsFrameRef = useRef(0);
  const jumpQueuedRef = useRef(false);
  const sprintRef = useRef(false);
  const airborneRef = useRef(false);
  const joystickKnob = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [paused, setPaused] = useState(false);
  const [joystickActive, setJoystickActive] = useState(false);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [landmark, setLandmark] = useState<Landmark3D | null>(null);
  const [sceneStats, setSceneStats] = useState({ drawCalls: 0, triangles: 0 });
  const [isSprinting, setIsSprinting] = useState(false);
  const [isAirborne, setIsAirborne] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<HarborTimeOfDay>("SUNSET");

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      runtimeRef.current?.renderer.dispose();
    };
  }, []);

  const resetWorld = useCallback(() => {
    const runtime = runtimeRef.current;
    explorerPositionRef.current = EXPLORER_START;
    explorerMotionRef.current = createExplorerMotion(EXPLORER_START);
    directionRef.current = { x: 0, z: 0 };
    joystickTargetRef.current = { x: 0, z: 0 };
    orbitRef.current = createCameraOrbit();
    orbitTargetRef.current = createCameraOrbit();
    orbitGestureRef.current = { x: 0, y: 0 };
    activeLandmarkRef.current = null;
    jumpQueuedRef.current = false;
    sprintRef.current = false;
    airborneRef.current = false;
    joystickKnob.setValue({ x: 0, y: 0 });
    setJoystickActive(false);
    setLandmark(null);
    setIsAirborne(false);
    setIsSprinting(false);
    setPaused(false);
    if (runtime) runtime.explorer.position.set(EXPLORER_START.x, 0, EXPLORER_START.z);
  }, [joystickKnob]);

  const queueJump = useCallback(() => {
    if (explorerMotionRef.current.grounded) jumpQueuedRef.current = true;
  }, []);

  const setSprintActive = useCallback((active: boolean) => {
    sprintRef.current = active;
    setIsSprinting(active);
  }, []);

  const advanceTimeOfDay = useCallback(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.lighting.progress = (runtime.lighting.progress + 0.25) % 1;
    setTimeOfDay(updateHarborLighting(runtime));
  }, []);

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    const renderer = new Renderer({ gl }) as unknown as THREE.WebGLRenderer;
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x7bc6d1, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x7bc6d1, 32, 80);
    const camera = new THREE.PerspectiveCamera(50, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 120);
    camera.position.set(0, 13.2, 30);
    const explorer = createExplorer();
    scene.add(explorer);
    const skyLight = new THREE.HemisphereLight(0xfff2cb, 0x24494c, 2.3);
    scene.add(skyLight);
    const sun = new THREE.DirectionalLight(0xffdca0, 2.2);
    sun.position.set(-18, 27, 12);
    scene.add(sun);
    const waterMaterial = buildWorld(scene);
    const lanternLights: THREE.PointLight[] = [];
    const emissiveMaterials: THREE.MeshStandardMaterial[] = [];
    scene.traverse((object) => {
      if (object instanceof THREE.PointLight) lanternLights.push(object);
      if (object instanceof THREE.Mesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial && material.emissive.getHex() !== 0) emissiveMaterials.push(material);
        });
      }
    });

    runtimeRef.current = {
      renderer,
      scene,
      camera,
      explorer,
      gl,
      lighting: {
        sun,
        skyLight,
        waterMaterial,
        lanternLights,
        emissiveMaterials,
        skyColor: new THREE.Color(0xc86547),
        progress: 0.72,
        frameCount: 0,
      },
    };
    setTimeOfDay(updateHarborLighting(runtimeRef.current));
    let lastTime = Date.now();
    const render = () => {
      frameRef.current = requestAnimationFrame(render);
      const runtime = runtimeRef.current;
      if (!runtime) return;
      const now = Date.now();
      const delta = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (!pausedRef.current) {
        directionRef.current = {
          x: smoothAxis(directionRef.current.x, joystickTargetRef.current.x, delta),
          z: smoothAxis(directionRef.current.z, joystickTargetRef.current.z, delta),
        };
        orbitRef.current = smoothCameraOrbit(orbitRef.current, orbitTargetRef.current, delta);
        let motion = explorerMotionRef.current;
        if (jumpQueuedRef.current) {
          motion = requestJump(motion);
          jumpQueuedRef.current = false;
        }
        const worldDirection = cameraRelativeDirection(directionRef.current, orbitRef.current.yaw);
        motion = stepExplorerMotion(motion, worldDirection, delta, sprintRef.current);
        explorerMotionRef.current = motion;
        explorerPositionRef.current = motion.position;
        runtime.explorer.position.x = motion.position.x;
        runtime.explorer.position.y = motion.height;
        runtime.explorer.position.z = motion.position.z;
        if (motion.grounded === airborneRef.current) {
          airborneRef.current = !motion.grounded;
          setIsAirborne(!motion.grounded);
        }
        if (Math.hypot(directionRef.current.x, directionRef.current.z) > 0.02) {
          runtime.explorer.rotation.y = Math.atan2(directionRef.current.x, directionRef.current.z);
        }
        const cameraDistance = 19.2;
        const horizontalDistance = Math.cos(orbitRef.current.pitch) * cameraDistance;
        const targetCamera = new THREE.Vector3(
          motion.position.x + Math.sin(orbitRef.current.yaw) * horizontalDistance,
          1 + Math.sin(orbitRef.current.pitch) * cameraDistance + motion.height * 0.15,
          motion.position.z + Math.cos(orbitRef.current.yaw) * horizontalDistance,
        );
        runtime.camera.position.lerp(targetCamera, Math.min(1, delta * 4.8));
        runtime.camera.lookAt(motion.position.x, 1.0 + motion.height * 0.25, motion.position.z - 1.5);
        const nextLandmark = landmarkAt3D(motion.position);
        const nextId = nextLandmark?.id ?? null;
        if (nextId !== activeLandmarkRef.current) {
          activeLandmarkRef.current = nextId;
          setLandmark(nextLandmark);
        }

        runtime.lighting.progress = (runtime.lighting.progress + delta / 210) % 1;
        runtime.lighting.frameCount += 1;
        if (runtime.lighting.frameCount % 18 === 0) {
          setTimeOfDay(updateHarborLighting(runtime));
        }
      }

      runtime.renderer.render(runtime.scene, runtime.camera);
      statsFrameRef.current += 1;
      if (statsFrameRef.current % 20 === 0) {
        setSceneStats({
          drawCalls: runtime.renderer.info.render.calls,
          triangles: runtime.renderer.info.render.triangles,
        });
      }
      runtime.gl.endFrameEXP();
    };
    render();
  }, []);

  const joystickResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => setJoystickActive(true),
        onPanResponderMove: (_, gesture) => {
          const input = resolveJoystickInput(gesture.dx, gesture.dy, 44);
          joystickTargetRef.current = { x: input.direction.x, z: input.direction.y };
          setJoystickActive(input.active);
          Animated.timing(joystickKnob, {
            toValue: { x: input.knob.x, y: input.knob.y },
            duration: 45,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderRelease: () => {
          joystickTargetRef.current = { x: 0, z: 0 };
          setJoystickActive(false);
          Animated.spring(joystickKnob, { toValue: { x: 0, y: 0 }, damping: 16, stiffness: 260, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () => {
          joystickTargetRef.current = { x: 0, z: 0 };
          setJoystickActive(false);
          Animated.spring(joystickKnob, { toValue: { x: 0, y: 0 }, damping: 16, stiffness: 260, useNativeDriver: true }).start();
        },
      }),
    [joystickKnob],
  );

  const cameraResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          orbitGestureRef.current = { x: 0, y: 0 };
          setIsOrbiting(true);
        },
        onPanResponderMove: (_, gesture) => {
          const deltaX = gesture.dx - orbitGestureRef.current.x;
          const deltaY = gesture.dy - orbitGestureRef.current.y;
          orbitGestureRef.current = { x: gesture.dx, y: gesture.dy };
          orbitTargetRef.current = applyOrbitDrag(orbitTargetRef.current, deltaX, deltaY);
        },
        onPanResponderRelease: () => setIsOrbiting(false),
        onPanResponderTerminate: () => setIsOrbiting(false),
      }),
    [],
  );

  return (
    <View style={styles.shell}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={styles.topHud}>
          <View style={styles.districtChip}>
            <View style={styles.liveDot} />
            <Text style={styles.districtText}>{timeOfDay} · JADE HARBOR</Text>
          </View>
          <View style={styles.topActions}>
            <View style={styles.statsChip}>
              <Text style={styles.statsText}>{sceneStats.drawCalls} DC · {sceneStats.triangles} TRIS</Text>
            </View>
            <Pressable onPress={advanceTimeOfDay} style={({ pressed }) => [styles.timeButton, pressed && styles.pressed]}>
              <Text style={styles.timeButtonText}>TIME</Text>
            </Pressable>
            <Pressable onPress={() => setPaused(true)} style={({ pressed }) => [styles.pauseButton, pressed && styles.pressed]}>
              <Text style={styles.pauseButtonText}>Ⅱ</Text>
            </Pressable>
          </View>
        </View>

        <View {...cameraResponder.panHandlers} style={styles.cameraSwipeZone} />
        <View pointerEvents="none" style={styles.cameraHint}>
          <Text style={styles.cameraHintText}>{isOrbiting ? "ORBITING" : "SWIPE TO LOOK"}</Text>
        </View>

        {landmark ? (
          <View style={styles.landmarkCard}>
            <View style={[styles.landmarkAccent, { backgroundColor: landmark.accent }]} />
            <View style={styles.landmarkCopy}>
              <Text style={styles.landmarkEyebrow}>3D LANDMARK DISCOVERED</Text>
              <Text style={styles.landmarkTitle}>{landmark.title}</Text>
              <Text style={styles.landmarkSubtitle}>{landmark.subtitle}</Text>
            </View>
            <Pressable onPress={() => setLandmark(null)} hitSlop={10} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.explorePrompt}>
            <Text style={styles.explorePromptText}>Walk through the 3D harbor district.</Text>
          </View>
        )}

        <View style={styles.controls}>
          <View {...joystickResponder.panHandlers} style={styles.joystickBase}>
            <View style={[styles.joystickRing, joystickActive && styles.joystickRingActive]} />
            <Animated.View style={[styles.joystickThumb, { transform: joystickKnob.getTranslateTransform() }]} />
          </View>
          <View style={styles.controlHintWrap}>
            <Text style={styles.controlHint}>{isAirborne ? "AIRBORNE" : isSprinting ? "SPRINTING" : joystickActive ? "ANALOG MOVE" : "DRAG TO WALK"}</Text>
            <View style={styles.actionRow}>
              <Pressable onPress={queueJump} style={({ pressed }) => [styles.jumpButton, pressed && styles.pressed]}>
                <Text style={styles.jumpText}>JUMP</Text>
              </Pressable>
              <Pressable onPressIn={() => setSprintActive(true)} onPressOut={() => setSprintActive(false)} style={({ pressed }) => [styles.sprintButton, isSprinting && styles.sprintButtonActive, pressed && styles.pressed]}>
                <Text style={styles.sprintText}>{isSprinting ? "SPRINT" : "HOLD"}</Text>
              </Pressable>
            </View>
            <Pressable onPress={resetWorld} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
              <Text style={styles.resetText}>RESTART</Text>
            </Pressable>
          </View>
        </View>

        {paused ? (
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseSheet}>
              <Text style={styles.pauseEyebrow}>3D EXPLORATION PAUSED</Text>
              <Text style={styles.pauseTitle}>South Harbor District</Text>
              <Text style={styles.pauseCopy}>The world uses shared low-poly facade, bridge, lantern, market, and jade landmark families. Collision and follow-camera movement remain local to this playable district.</Text>
              <Pressable onPress={() => setPaused(false)} style={({ pressed }) => [styles.resumeButton, pressed && styles.pressed]}>
                <Text style={styles.resumeText}>RESUME</Text>
              </Pressable>
              <Pressable onPress={resetWorld} style={({ pressed }) => [styles.pauseRestartButton, pressed && styles.pressed]}>
                <Text style={styles.pauseRestartText}>RESTART DISTRICT</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: "#7BC6D1" },
  topHud: { position: "absolute", left: 16, right: 16, top: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  districtChip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(8, 21, 25, 0.86)", borderWidth: 1, borderColor: "rgba(239, 195, 105, 0.38)", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#5ED5B7" },
  districtText: { color: "#F4E8C8", fontSize: 10, fontWeight: "800", letterSpacing: 0.95 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  statsChip: { backgroundColor: "rgba(8, 21, 25, 0.72)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(174, 235, 211, 0.26)", paddingHorizontal: 8, paddingVertical: 7 },
  statsText: { color: "#BDEDDC", fontSize: 9, fontWeight: "800", letterSpacing: 0.35 },
  timeButton: { borderRadius: 12, backgroundColor: "rgba(138, 79, 54, 0.82)", borderWidth: 1, borderColor: "rgba(255, 205, 144, 0.48)", paddingHorizontal: 9, paddingVertical: 7 },
  timeButtonText: { color: "#FFE2B5", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  pauseButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(8, 21, 25, 0.86)", borderWidth: 1, borderColor: "rgba(239, 195, 105, 0.38)", alignItems: "center", justifyContent: "center" },
  pauseButtonText: { color: "#F4E8C8", fontSize: 17, fontWeight: "900" },
  cameraSwipeZone: { position: "absolute", right: 0, top: 76, bottom: 156, width: "48%" },
  cameraHint: { position: "absolute", right: 22, bottom: 160, borderRadius: 10, backgroundColor: "rgba(10, 31, 34, 0.52)", paddingHorizontal: 9, paddingVertical: 5 },
  cameraHintText: { color: "#F2E1B0", fontSize: 9, fontWeight: "800", letterSpacing: 0.7 },
  landmarkCard: { position: "absolute", left: 16, right: 16, bottom: 128, flexDirection: "row", gap: 11, borderRadius: 18, padding: 14, backgroundColor: "rgba(18, 35, 37, 0.96)", borderWidth: 1, borderColor: "rgba(244, 222, 159, 0.35)" },
  landmarkAccent: { width: 5, borderRadius: 3 },
  landmarkCopy: { flex: 1 },
  landmarkEyebrow: { color: "#D2C093", fontSize: 10, fontWeight: "800", letterSpacing: 1.05 },
  landmarkTitle: { color: "#FFF1C9", fontSize: 19, lineHeight: 25, fontWeight: "800", marginTop: 2 },
  landmarkSubtitle: { color: "#D9D3BC", fontSize: 12, lineHeight: 17, marginTop: 3 },
  closeButton: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  closeButtonText: { color: "#F4E8C8", fontSize: 23, lineHeight: 24 },
  explorePrompt: { position: "absolute", bottom: 136, left: 44, right: 44, alignItems: "center" },
  explorePromptText: { color: "rgba(31, 51, 47, 0.9)", backgroundColor: "rgba(255, 239, 195, 0.78)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7, fontSize: 11, fontWeight: "700" },
  controls: { position: "absolute", left: 18, right: 18, bottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  joystickBase: { width: 112, height: 112, borderRadius: 56, backgroundColor: "rgba(9, 29, 34, 0.38)", borderWidth: 1, borderColor: "rgba(255, 238, 189, 0.38)", alignItems: "center", justifyContent: "center" },
  joystickRing: { position: "absolute", width: 76, height: 76, borderRadius: 38, borderWidth: 1, borderColor: "rgba(236, 200, 125, 0.34)", backgroundColor: "rgba(26, 73, 78, 0.14)" },
  joystickRingActive: { borderColor: "rgba(247, 218, 139, 0.8)", backgroundColor: "rgba(235, 147, 83, 0.14)" },
  joystickThumb: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(244, 210, 132, 0.9)", borderWidth: 3, borderColor: "#2B5155", shadowColor: "#FAD487", shadowOpacity: 0.4, shadowRadius: 10, elevation: 3 },
  controlHintWrap: { alignItems: "flex-end", gap: 9 },
  controlHint: { color: "#FCEDBF", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  actionRow: { flexDirection: "row", gap: 8 },
  jumpButton: { minWidth: 68, alignItems: "center", backgroundColor: "rgba(27, 71, 95, 0.88)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(190, 235, 250, 0.48)", paddingHorizontal: 13, paddingVertical: 10 },
  jumpText: { color: "#E2F4FB", fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  sprintButton: { minWidth: 68, alignItems: "center", backgroundColor: "rgba(10, 31, 34, 0.8)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255, 238, 189, 0.34)", paddingHorizontal: 13, paddingVertical: 10 },
  sprintButtonActive: { backgroundColor: "rgba(94, 213, 183, 0.86)", borderColor: "rgba(224, 255, 244, 0.8)" },
  sprintText: { color: "#F6E5B8", fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  resetButton: { backgroundColor: "rgba(10, 31, 34, 0.8)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255, 238, 189, 0.34)", paddingHorizontal: 15, paddingVertical: 10 },
  resetText: { color: "#F6E5B8", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  pauseOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(6, 16, 18, 0.72)", alignItems: "center", justifyContent: "center", padding: 28 },
  pauseSheet: { width: "100%", maxWidth: 360, borderRadius: 24, padding: 24, backgroundColor: "#173336", borderWidth: 1, borderColor: "rgba(247, 211, 125, 0.36)" },
  pauseEyebrow: { color: "#EAB957", fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  pauseTitle: { color: "#FFF0C8", fontSize: 29, fontWeight: "800", marginTop: 5 },
  pauseCopy: { color: "#DAD8C5", fontSize: 14, lineHeight: 20, marginTop: 10 },
  resumeButton: { marginTop: 22, backgroundColor: "#EAB957", borderRadius: 15, paddingVertical: 14, alignItems: "center" },
  resumeText: { color: "#183336", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  pauseRestartButton: { marginTop: 10, borderRadius: 15, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: "rgba(255, 239, 200, 0.24)" },
  pauseRestartText: { color: "#F6E6BF", fontSize: 12, fontWeight: "800", letterSpacing: 0.6 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
