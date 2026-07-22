// ─────────────────────────────────────────────────────────────
// Hypertrophy Landmarks & CNS Autoregulator — telemetry data model
// ─────────────────────────────────────────────────────────────

export const COLORS = {
  space: "#070A13",
  surface: "#0F1322",
  border: "#1E293B",
  cyan: "#00F0FF",
  purple: "#A855F7",
  crimson: "#FF4D4D",
};

export type MesoWeek = {
  index: number;
  label: string;
  phase: string;
  rirTarget: string;
  intensityPct: number;
};

// Week 1..5 — MEV ramp → MAV peak → MRV overreach → deload implied
export const MESOCYCLE: MesoWeek[] = [
  { index: 1, label: "Week 1", phase: "MEV Introduction", rirTarget: "RIR 3", intensityPct: 68 },
  { index: 2, label: "Week 2", phase: "MAV-1 Accumulation", rirTarget: "RIR 2", intensityPct: 74 },
  { index: 3, label: "Week 3", phase: "MAV-2 Peak Stimulus Phase", rirTarget: "RIR 1", intensityPct: 82 },
  { index: 4, label: "Week 4", phase: "MRV Overreach", rirTarget: "RIR 0 · To Failure", intensityPct: 91 },
  { index: 5, label: "Week 5", phase: "Deload / Resensitization", rirTarget: "RIR 4", intensityPct: 52 },
];

export type MuscleGroup = {
  id: string;
  name: string;
  // physiologic volume landmarks in weekly working sets
  mev: number;
  mav: number;
  mrv: number;
  // accumulated working sets per week index (1..5)
  weekly: Record<number, number>;
};

export const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: "chest", name: "Chest", mev: 8, mav: 16, mrv: 22, weekly: { 1: 9, 2: 12, 3: 16, 4: 21, 5: 6 } },
  { id: "back", name: "Back", mev: 10, mav: 18, mrv: 25, weekly: { 1: 11, 2: 15, 3: 19, 4: 24, 5: 8 } },
  { id: "quads", name: "Quads", mev: 8, mav: 14, mrv: 20, weekly: { 1: 8, 2: 11, 3: 15, 4: 20, 5: 6 } },
  { id: "hamstrings", name: "Hamstrings", mev: 6, mav: 12, mrv: 16, weekly: { 1: 6, 2: 9, 3: 13, 4: 16, 5: 4 } },
  { id: "shoulders", name: "Shoulders", mev: 8, mav: 16, mrv: 22, weekly: { 1: 9, 2: 13, 3: 17, 4: 22, 5: 6 } },
  { id: "arms", name: "Arms", mev: 8, mav: 14, mrv: 20, weekly: { 1: 8, 2: 12, 3: 16, 4: 20, 5: 6 } },
];

export type Exercise = {
  id: string;
  name: string;
  pattern: string;
  sets: number;
  repRange: string;
  loadKg: number;
  tensionType: "Mechanical" | "Metabolic" | "Stretch-Loaded";
};

export const ROUTINE: Record<number, { day: string; split: string; exercises: Exercise[] }> = {
  1: {
    day: "Day A", split: "Horizontal Push / Vertical Pull",
    exercises: [
      { id: "e1", name: "Barbell Bench Press", pattern: "Horizontal Push", sets: 4, repRange: "8–10", loadKg: 92, tensionType: "Mechanical" },
      { id: "e2", name: "Weighted Pull-Up", pattern: "Vertical Pull", sets: 4, repRange: "6–8", loadKg: 24, tensionType: "Mechanical" },
      { id: "e3", name: "Incline DB Press", pattern: "Incline Push", sets: 3, repRange: "10–12", loadKg: 34, tensionType: "Stretch-Loaded" },
      { id: "e4", name: "Cable Fly", pattern: "Adduction", sets: 3, repRange: "12–15", loadKg: 18, tensionType: "Metabolic" },
    ],
  },
  2: {
    day: "Day A", split: "Horizontal Push / Vertical Pull",
    exercises: [
      { id: "e1", name: "Barbell Bench Press", pattern: "Horizontal Push", sets: 4, repRange: "6–8", loadKg: 100, tensionType: "Mechanical" },
      { id: "e2", name: "Weighted Pull-Up", pattern: "Vertical Pull", sets: 4, repRange: "5–7", loadKg: 28, tensionType: "Mechanical" },
      { id: "e3", name: "Incline DB Press", pattern: "Incline Push", sets: 4, repRange: "8–10", loadKg: 38, tensionType: "Stretch-Loaded" },
      { id: "e4", name: "Cable Fly", pattern: "Adduction", sets: 3, repRange: "12–15", loadKg: 20, tensionType: "Metabolic" },
    ],
  },
  3: {
    day: "Day A", split: "Horizontal Push / Vertical Pull",
    exercises: [
      { id: "e1", name: "Barbell Bench Press", pattern: "Horizontal Push", sets: 5, repRange: "5–7", loadKg: 108, tensionType: "Mechanical" },
      { id: "e2", name: "Weighted Pull-Up", pattern: "Vertical Pull", sets: 4, repRange: "5–6", loadKg: 32, tensionType: "Mechanical" },
      { id: "e3", name: "Incline DB Press", pattern: "Incline Push", sets: 4, repRange: "8–10", loadKg: 42, tensionType: "Stretch-Loaded" },
      { id: "e4", name: "Cable Fly", pattern: "Adduction", sets: 4, repRange: "10–12", loadKg: 22, tensionType: "Metabolic" },
    ],
  },
  4: {
    day: "Day A", split: "Horizontal Push / Vertical Pull",
    exercises: [
      { id: "e1", name: "Barbell Bench Press", pattern: "Horizontal Push", sets: 5, repRange: "3–5", loadKg: 118, tensionType: "Mechanical" },
      { id: "e2", name: "Weighted Pull-Up", pattern: "Vertical Pull", sets: 5, repRange: "4–5", loadKg: 36, tensionType: "Mechanical" },
      { id: "e3", name: "Incline DB Press", pattern: "Incline Push", sets: 4, repRange: "6–8", loadKg: 46, tensionType: "Stretch-Loaded" },
      { id: "e4", name: "Cable Fly", pattern: "Adduction", sets: 3, repRange: "10–12", loadKg: 22, tensionType: "Metabolic" },
    ],
  },
  5: {
    day: "Day A", split: "Deload · Technical Refresh",
    exercises: [
      { id: "e1", name: "Barbell Bench Press", pattern: "Horizontal Push", sets: 2, repRange: "8–10", loadKg: 72, tensionType: "Mechanical" },
      { id: "e2", name: "Weighted Pull-Up", pattern: "Vertical Pull", sets: 2, repRange: "8–10", loadKg: 12, tensionType: "Mechanical" },
      { id: "e3", name: "Incline DB Press", pattern: "Incline Push", sets: 2, repRange: "10–12", loadKg: 26, tensionType: "Stretch-Loaded" },
      { id: "e4", name: "Cable Fly", pattern: "Adduction", sets: 2, repRange: "12–15", loadKg: 14, tensionType: "Metabolic" },
    ],
  },
};

// CNS readiness per week (0–100). Week 4 = critical overreach → override.
export const CNS_READINESS: Record<number, number> = { 1: 88, 2: 79, 3: 64, 4: 31, 5: 94 };

export const CNS_CRITICAL_THRESHOLD = 45;

export type DoreyLog = { day: string; done: boolean };
export const DOREY_WEEK: DoreyLog[] = [
  { day: "MON", done: true },
  { day: "TUE", done: false },
  { day: "WED", done: true },
  { day: "THU", done: false },
  { day: "FRI", done: true },
  { day: "SAT", done: true },
  { day: "SUN", done: false },
];
