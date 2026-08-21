import { Image, PanResponder, Pressable, StyleSheet, Text, View, type ImageSourcePropType, type LayoutChangeEvent } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  PLAYER_START,
  WORLD_SIZE,
  cameraForPlayer,
  landmarkAt,
  landmarks,
  movePlayer,
  type Landmark,
  type Vec2,
  type WorldRect,
} from "@/lib/game-world";

const facade = require("@/assets/images/jade-harbor-mobile/facade.jpg") as ImageSourcePropType;
const bridge = require("@/assets/images/jade-harbor-mobile/bridge.jpg") as ImageSourcePropType;
const lantern = require("@/assets/images/jade-harbor-mobile/lantern.jpg") as ImageSourcePropType;
const market = require("@/assets/images/jade-harbor-mobile/market.jpg") as ImageSourcePropType;
const ornament = require("@/assets/images/jade-harbor-mobile/ornament.jpg") as ImageSourcePropType;

type SceneAsset = {
  id: string;
  image: ImageSourcePropType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: string;
};

const sceneAssets: SceneAsset[] = [
  { id: "north-facade-a", image: facade, x: 138, y: 267, width: 190, height: 190 },
  { id: "north-facade-b", image: facade, x: 620, y: 225, width: 202, height: 202, rotation: "7deg" },
  { id: "market", image: market, x: 390, y: 1004, width: 195, height: 195 },
  { id: "east-market", image: market, x: 662, y: 838, width: 155, height: 155, rotation: "-7deg" },
  { id: "west-harbor-house", image: facade, x: 142, y: 790, width: 165, height: 165, rotation: "-5deg" },
  { id: "bridge", image: bridge, x: 380, y: 578, width: 225, height: 225 },
  { id: "jade-gate", image: ornament, x: 680, y: 284, width: 142, height: 142 },
  { id: "lantern-a", image: lantern, x: 398, y: 1130, width: 67, height: 120 },
  { id: "lantern-b", image: lantern, x: 560, y: 1002, width: 58, height: 103 },
  { id: "lantern-c", image: lantern, x: 304, y: 608, width: 54, height: 96 },
];

const waterZones: WorldRect[] = [
  { x: 0, y: 480, width: 360, height: 440 },
  { x: 616, y: 488, width: 364, height: 420 },
  { x: 384, y: 430, width: 206, height: 150 },
];

const roads: WorldRect[] = [
  { x: 386, y: 112, width: 186, height: 1350 },
  { x: 170, y: 1024, width: 650, height: 135 },
  { x: 296, y: 627, width: 380, height: 106 },
  { x: 598, y: 455, width: 210, height: 96 },
];

function worldStyle(rect: WorldRect, camera: Vec2) {
  return {
    left: rect.x - camera.x,
    top: rect.y - camera.y,
    width: rect.width,
    height: rect.height,
  };
}

export function JadeHarborGame() {
  const [player, setPlayer] = useState<Vec2>(PLAYER_START);
  const [camera, setCamera] = useState<Vec2>({ x: 290, y: 900 });
  const [viewport, setViewport] = useState<Vec2>({ x: 1, y: 1 });
  const [joystickPosition, setJoystickPosition] = useState<Vec2>({ x: 0, y: 0 });
  const [paused, setPaused] = useState(false);
  const [activeLandmark, setActiveLandmark] = useState<Landmark | null>(null);
  const playerRef = useRef(PLAYER_START);
  const directionRef = useRef<Vec2>({ x: 0, y: 0 });
  const lastLandmarkRef = useRef<string | null>(null);

  const resetGame = useCallback(() => {
    playerRef.current = PLAYER_START;
    directionRef.current = { x: 0, y: 0 };
    lastLandmarkRef.current = null;
    setPlayer(PLAYER_START);
    setCamera(cameraForPlayer(PLAYER_START, viewport));
    setJoystickPosition({ x: 0, y: 0 });
    setActiveLandmark(null);
    setPaused(false);
  }, [viewport]);

  useEffect(() => {
    if (paused) return;
    const tick = setInterval(() => {
      const nextPlayer = movePlayer(playerRef.current, directionRef.current, 1 / 30);
      if (nextPlayer === playerRef.current) return;
      playerRef.current = nextPlayer;
      setPlayer(nextPlayer);
      setCamera(cameraForPlayer(nextPlayer, viewport));
      const landmark = landmarkAt(nextPlayer);
      const landmarkId = landmark?.id ?? null;
      if (landmarkId !== lastLandmarkRef.current) {
        lastLandmarkRef.current = landmarkId;
        setActiveLandmark(landmark);
      }
    }, 33);
    return () => clearInterval(tick);
  }, [paused, viewport]);

  const onWorldLayout = useCallback((event: LayoutChangeEvent) => {
    const nextViewport = { x: event.nativeEvent.layout.width, y: event.nativeEvent.layout.height };
    setViewport(nextViewport);
    setCamera(cameraForPlayer(playerRef.current, nextViewport));
  }, []);

  const joystick = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
          const radius = 44;
          const x = Math.max(-radius, Math.min(radius, gesture.dx));
          const y = Math.max(-radius, Math.min(radius, gesture.dy));
          setJoystickPosition({ x, y });
          directionRef.current = { x: x / radius, y: y / radius };
        },
        onPanResponderRelease: () => {
          directionRef.current = { x: 0, y: 0 };
          setJoystickPosition({ x: 0, y: 0 });
        },
        onPanResponderTerminate: () => {
          directionRef.current = { x: 0, y: 0 };
          setJoystickPosition({ x: 0, y: 0 });
        },
      }),
    [],
  );

  const heroPosition = { left: player.x - camera.x - 18, top: player.y - camera.y - 25 };

  return (
    <View style={styles.gameShell}>
      <View style={styles.topHud}>
        <View style={styles.districtChip}>
          <View style={styles.liveDot} />
          <Text style={styles.districtText}>JADE HARBOR · SOUTH QUARTER</Text>
        </View>
        <Pressable onPress={() => setPaused(true)} style={({ pressed }) => [styles.pauseButton, pressed && styles.pressed]}>
          <Text style={styles.pauseButtonText}>Ⅱ</Text>
        </Pressable>
      </View>

      <View style={styles.worldViewport} onLayout={onWorldLayout}>
        <View style={styles.mapBackdrop} />
        {waterZones.map((zone, index) => (
          <View key={`water-${index}`} style={[styles.water, worldStyle(zone, camera)]} />
        ))}
        {roads.map((road, index) => (
          <View key={`road-${index}`} style={[styles.road, worldStyle(road, camera)]} />
        ))}
        {landmarks.map((landmark) => (
          <View key={landmark.id} style={[styles.landmarkHalo, { left: landmark.position.x - camera.x - landmark.radius, top: landmark.position.y - camera.y - landmark.radius, width: landmark.radius * 2, height: landmark.radius * 2, borderColor: landmark.accent }]} />
        ))}
        {sceneAssets.map((asset) => (
          <Image
            accessibilityLabel={`${asset.id} environment asset`}
            key={asset.id}
            resizeMode="contain"
            source={asset.image}
            style={[styles.sceneAsset, { left: asset.x - camera.x, top: asset.y - camera.y, width: asset.width, height: asset.height, transform: asset.rotation ? [{ rotate: asset.rotation }] : undefined }]}
          />
        ))}
        <View style={[styles.hero, heroPosition]}>
          <View style={styles.heroHead} />
          <View style={styles.heroHair} />
          <View style={styles.heroBody} />
          <View style={styles.heroShadow} />
        </View>
        <View style={[styles.northMarker, { left: viewport.x - 48, top: 18 }]}>
          <Text style={styles.northMarkerText}>N</Text>
          <View style={styles.northArrow} />
        </View>
      </View>

      {activeLandmark ? (
        <View style={styles.landmarkCard}>
          <View style={[styles.landmarkAccent, { backgroundColor: activeLandmark.accent }]} />
          <View style={styles.landmarkCopy}>
            <Text style={styles.landmarkEyebrow}>DISCOVERED</Text>
            <Text style={styles.landmarkTitle}>{activeLandmark.title}</Text>
            <Text style={styles.landmarkSubtitle}>{activeLandmark.subtitle}</Text>
          </View>
          <Pressable onPress={() => setActiveLandmark(null)} hitSlop={10} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Text style={styles.closeButtonText}>×</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.explorePrompt}>
          <Text style={styles.explorePromptText}>Explore the market, bridge, gate, and harbor pier.</Text>
        </View>
      )}

      <View style={styles.controls}>
        <View {...joystick.panHandlers} style={styles.joystickBase}>
          <View style={[styles.joystickThumb, { transform: [{ translateX: joystickPosition.x }, { translateY: joystickPosition.y }] }]} />
        </View>
        <View style={styles.controlHintWrap}>
          <Text style={styles.controlHint}>DRAG TO MOVE</Text>
          <Pressable onPress={resetGame} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
            <Text style={styles.resetText}>RESTART</Text>
          </Pressable>
        </View>
      </View>

      {paused ? (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseSheet}>
            <Text style={styles.pauseEyebrow}>PAUSED</Text>
            <Text style={styles.pauseTitle}>South Quarter</Text>
            <Text style={styles.pauseCopy}>A mobile-safe exploration slice built from reusable facade, bridge, lantern, market, and roof-ornament asset families.</Text>
            <Pressable onPress={() => setPaused(false)} style={({ pressed }) => [styles.resumeButton, pressed && styles.pressed]}>
              <Text style={styles.resumeText}>RESUME EXPLORING</Text>
            </Pressable>
            <Pressable onPress={resetGame} style={({ pressed }) => [styles.pauseRestartButton, pressed && styles.pressed]}>
              <Text style={styles.pauseRestartText}>RESTART DISTRICT</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gameShell: { flex: 1, backgroundColor: "#13292C", overflow: "hidden" },
  topHud: { position: "absolute", zIndex: 10, left: 16, right: 16, top: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  districtChip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(8, 21, 25, 0.82)", borderWidth: 1, borderColor: "rgba(239, 195, 105, 0.35)", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#F6B85A" },
  districtText: { color: "#F4E8C8", fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  pauseButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(8, 21, 25, 0.82)", borderWidth: 1, borderColor: "rgba(239, 195, 105, 0.35)", alignItems: "center", justifyContent: "center" },
  pauseButtonText: { color: "#F4E8C8", fontSize: 17, fontWeight: "900" },
  worldViewport: { flex: 1, overflow: "hidden", backgroundColor: "#C7A86D" },
  mapBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "#C8A86E" },
  water: { position: "absolute", backgroundColor: "#287A8C", borderColor: "#67B5BE", borderWidth: 3, borderRadius: 54, opacity: 0.96 },
  road: { position: "absolute", backgroundColor: "#E3C98F", borderColor: "#9F7849", borderWidth: 2, borderRadius: 24 },
  landmarkHalo: { position: "absolute", borderWidth: 1.5, borderRadius: 999, opacity: 0.46, backgroundColor: "rgba(255, 246, 209, 0.06)" },
  sceneAsset: { position: "absolute", opacity: 0.98 },
  hero: { position: "absolute", width: 36, height: 52, alignItems: "center", zIndex: 8 },
  heroHead: { position: "absolute", width: 16, height: 16, borderRadius: 9, backgroundColor: "#E9B98D", top: 6, zIndex: 3 },
  heroHair: { position: "absolute", width: 18, height: 11, borderTopLeftRadius: 9, borderTopRightRadius: 9, backgroundColor: "#221B22", top: 4, zIndex: 4 },
  heroBody: { position: "absolute", width: 23, height: 27, borderRadius: 10, backgroundColor: "#274D61", borderWidth: 2, borderColor: "#F4D589", top: 19, zIndex: 2 },
  heroShadow: { position: "absolute", width: 30, height: 10, borderRadius: 99, backgroundColor: "rgba(44, 31, 25, 0.28)", bottom: 0 },
  northMarker: { position: "absolute", alignItems: "center", gap: 2 },
  northMarkerText: { color: "#203A3B", fontSize: 11, fontWeight: "900" },
  northArrow: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 11, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: "#203A3B" },
  landmarkCard: { position: "absolute", zIndex: 12, left: 16, right: 16, bottom: 122, flexDirection: "row", gap: 11, borderRadius: 18, padding: 14, backgroundColor: "rgba(18, 35, 37, 0.96)", borderWidth: 1, borderColor: "rgba(244, 222, 159, 0.35)" },
  landmarkAccent: { width: 5, borderRadius: 3 },
  landmarkCopy: { flex: 1 },
  landmarkEyebrow: { color: "#D2C093", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  landmarkTitle: { color: "#FFF1C9", fontSize: 19, lineHeight: 25, fontWeight: "800", marginTop: 2 },
  landmarkSubtitle: { color: "#D9D3BC", fontSize: 12, lineHeight: 17, marginTop: 3 },
  closeButton: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  closeButtonText: { color: "#F4E8C8", fontSize: 23, lineHeight: 24 },
  explorePrompt: { position: "absolute", bottom: 132, left: 44, right: 44, alignItems: "center" },
  explorePromptText: { color: "rgba(31, 51, 47, 0.86)", backgroundColor: "rgba(255, 239, 195, 0.72)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7, fontSize: 11, fontWeight: "700" },
  controls: { position: "absolute", left: 18, right: 18, bottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  joystickBase: { width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(10, 31, 34, 0.42)", borderWidth: 1, borderColor: "rgba(255, 238, 189, 0.35)", alignItems: "center", justifyContent: "center" },
  joystickThumb: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(244, 210, 132, 0.82)", borderWidth: 3, borderColor: "#2B5155" },
  controlHintWrap: { alignItems: "flex-end", gap: 9 },
  controlHint: { color: "#FCEDBF", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  resetButton: { backgroundColor: "rgba(10, 31, 34, 0.78)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255, 238, 189, 0.34)", paddingHorizontal: 15, paddingVertical: 10 },
  resetText: { color: "#F6E5B8", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  pauseOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 30, backgroundColor: "rgba(6, 16, 18, 0.72)", alignItems: "center", justifyContent: "center", padding: 28 },
  pauseSheet: { width: "100%", maxWidth: 360, borderRadius: 24, padding: 24, backgroundColor: "#173336", borderWidth: 1, borderColor: "rgba(247, 211, 125, 0.36)" },
  pauseEyebrow: { color: "#EAB957", fontSize: 11, fontWeight: "900", letterSpacing: 1.6 },
  pauseTitle: { color: "#FFF0C8", fontSize: 30, fontWeight: "800", marginTop: 5 },
  pauseCopy: { color: "#DAD8C5", fontSize: 14, lineHeight: 20, marginTop: 10 },
  resumeButton: { marginTop: 22, backgroundColor: "#EAB957", borderRadius: 15, paddingVertical: 14, alignItems: "center" },
  resumeText: { color: "#183336", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  pauseRestartButton: { marginTop: 10, borderRadius: 15, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: "rgba(255, 239, 200, 0.24)" },
  pauseRestartText: { color: "#F6E6BF", fontSize: 12, fontWeight: "800", letterSpacing: 0.6 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
