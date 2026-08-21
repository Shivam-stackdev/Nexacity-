export type HarborTimeOfDay = "DAWN" | "DAY" | "SUNSET" | "NIGHT";

export type DayCycleState = {
  progress: number;
  daylight: number;
  sunset: number;
  night: number;
  label: HarborTimeOfDay;
};

function normalize(value: number) {
  return ((value % 1) + 1) % 1;
}

export function getHarborDayCycle(progress: number): DayCycleState {
  const normalized = normalize(progress);
  const daylight = Math.max(0, Math.sin(normalized * Math.PI));
  const sunset = Math.max(0, 1 - Math.abs(normalized - 0.72) / 0.18);
  const night = 1 - daylight;
  const label: HarborTimeOfDay =
    daylight < 0.16 ? "NIGHT" : sunset > 0.62 ? "SUNSET" : normalized < 0.5 ? "DAWN" : "DAY";

  return { progress: normalized, daylight, sunset, night, label };
}
