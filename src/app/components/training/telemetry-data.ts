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

export const MESOCYCLE: MesoWeek[] = [
  { index: 1, label: "Semana 1", phase: "Introducción al MEV", rirTarget: "RIR 3", intensityPct: 68 },
  { index: 2, label: "Semana 2", phase: "Acumulación MAV-1", rirTarget: "RIR 2", intensityPct: 74 },
  { index: 3, label: "Semana 3", phase: "Fase de Estímulo Pico MAV-2", rirTarget: "RIR 1", intensityPct: 82 },
  { index: 4, label: "Semana 4", phase: "Sobrecarga Límite MRV", rirTarget: "RIR 0 · Al Fallo", intensityPct: 91 },
  { index: 5, label: "Semana 5", phase: "Descarga / Resensibilización", rirTarget: "RIR 4", intensityPct: 52 },
];

export type MuscleGroup = {
  id: string;
  name: string;
  mev: number;
  mav: number;
  mrv: number;
  weekly: Record<number, number>;
};

export const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: "chest", name: "Pecho", mev: 8, mav: 16, mrv: 22, weekly: { 1: 9, 2: 12, 3: 16, 4: 21, 5: 6 } },
  { id: "back", name: "Espalda", mev: 10, mav: 18, mrv: 25, weekly: { 1: 11, 2: 15, 3: 19, 4: 24, 5: 8 } },
  { id: "quads", name: "Cuádriceps", mev: 8, mav: 14, mrv: 20, weekly: { 1: 8, 2: 11, 3: 15, 4: 20, 5: 6 } },
  { id: "hamstrings", name: "Isquiotibiales", mev: 6, mav: 12, mrv: 16, weekly: { 1: 6, 2: 9, 3: 13, 4: 16, 5: 4 } },
  { id: "shoulders", name: "Hombros", mev: 8, mav: 16, mrv: 22, weekly: { 1: 9, 2: 13, 3: 17, 4: 22, 5: 6 } },
  { id: "arms", name: "Brazos", mev: 8, mav: 14, mrv: 20, weekly: { 1: 8, 2: 12, 3: 16, 4: 20, 5: 6 } },
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

// Mapped Routines by Environment Type and Mesocycle Week in Spanish
export const ROUTINES: Record<string, Record<number, { day: string; split: string; exercises: Exercise[] }>> = {
  Gym: {
    1: {
      day: "Día A", split: "Empuje Horizontal / Tracción Vertical",
      exercises: [
        { id: "gym-e1", name: "Press de Banca con Barra", pattern: "Empuje Horizontal", sets: 4, repRange: "8–10", loadKg: 92, tensionType: "Mechanical" },
        { id: "gym-e2", name: "Dominadas Lastradas", pattern: "Tracción Vertical", sets: 4, repRange: "6–8", loadKg: 24, tensionType: "Mechanical" },
        { id: "gym-e3", name: "Press Inclinado con Mancuernas", pattern: "Empuje Inclinado", sets: 3, repRange: "10–12", loadKg: 34, tensionType: "Stretch-Loaded" },
        { id: "gym-e4", name: "Aperturas en Polea", pattern: "Aducción", sets: 3, repRange: "12–15", loadKg: 18, tensionType: "Metabolic" },
      ],
    },
    2: {
      day: "Día A", split: "Empuje Horizontal / Tracción Vertical",
      exercises: [
        { id: "gym-e1", name: "Press de Banca con Barra", pattern: "Empuje Horizontal", sets: 4, repRange: "6–8", loadKg: 100, tensionType: "Mechanical" },
        { id: "gym-e2", name: "Dominadas Lastradas", pattern: "Tracción Vertical", sets: 4, repRange: "5–7", loadKg: 28, tensionType: "Mechanical" },
        { id: "gym-e3", name: "Press Inclinado con Mancuernas", pattern: "Empuje Inclinado", sets: 4, repRange: "8–10", loadKg: 38, tensionType: "Stretch-Loaded" },
        { id: "gym-e4", name: "Aperturas en Polea", pattern: "Aducción", sets: 3, repRange: "12–15", loadKg: 20, tensionType: "Metabolic" },
      ],
    },
    3: {
      day: "Día A", split: "Empuje Horizontal / Tracción Vertical",
      exercises: [
        { id: "gym-e1", name: "Press de Banca con Barra", pattern: "Empuje Horizontal", sets: 5, repRange: "5–7", loadKg: 108, tensionType: "Mechanical" },
        { id: "gym-e2", name: "Dominadas Lastradas", pattern: "Tracción Vertical", sets: 4, repRange: "5–6", loadKg: 32, tensionType: "Mechanical" },
        { id: "gym-e3", name: "Press Inclinado con Mancuernas", pattern: "Empuje Inclinado", sets: 4, repRange: "8–10", loadKg: 42, tensionType: "Stretch-Loaded" },
        { id: "gym-e4", name: "Aperturas en Polea", pattern: "Aducción", sets: 4, repRange: "10–12", loadKg: 22, tensionType: "Metabolic" },
      ],
    },
    4: {
      day: "Día A", split: "Empuje Horizontal / Tracción Vertical",
      exercises: [
        { id: "gym-e1", name: "Press de Banca con Barra", pattern: "Empuje Horizontal", sets: 5, repRange: "3–5", loadKg: 118, tensionType: "Mechanical" },
        { id: "gym-e2", name: "Dominadas Lastradas", pattern: "Tracción Vertical", sets: 5, repRange: "4–5", loadKg: 36, tensionType: "Mechanical" },
        { id: "gym-e3", name: "Press Inclinado con Mancuernas", pattern: "Empuje Inclinado", sets: 4, repRange: "6–8", loadKg: 46, tensionType: "Stretch-Loaded" },
        { id: "gym-e4", name: "Aperturas en Polea", pattern: "Aducción", sets: 3, repRange: "10–12", loadKg: 22, tensionType: "Metabolic" },
      ],
    },
    5: {
      day: "Día A", split: "Descarga · Refresco Técnico",
      exercises: [
        { id: "gym-e1", name: "Press de Banca con Barra", pattern: "Empuje Horizontal", sets: 2, repRange: "8–10", loadKg: 72, tensionType: "Mechanical" },
        { id: "gym-e2", name: "Dominadas Lastradas", pattern: "Tracción Vertical", sets: 2, repRange: "8–10", loadKg: 12, tensionType: "Mechanical" },
        { id: "gym-e3", name: "Press Inclinado con Mancuernas", pattern: "Empuje Inclinado", sets: 2, repRange: "10–12", loadKg: 26, tensionType: "Stretch-Loaded" },
        { id: "gym-e4", name: "Aperturas en Polea", pattern: "Aducción", sets: 2, repRange: "12–15", loadKg: 14, tensionType: "Metabolic" },
      ],
    },
  },
  Casa: {
    1: {
      day: "Día A", split: "Básicos de Bandas y Peso Corporal",
      exercises: [
        { id: "casa-e1", name: "Flexiones con Banda", pattern: "Empuje Horizontal", sets: 4, repRange: "15–20", loadKg: 0, tensionType: "Mechanical" },
        { id: "casa-e2", name: "Remo con Banda", pattern: "Tracción Horizontal", sets: 4, repRange: "12–15", loadKg: 15, tensionType: "Metabolic" },
        { id: "casa-e3", name: "Flexiones Pike", pattern: "Empuje Vertical", sets: 3, repRange: "10–12", loadKg: 0, tensionType: "Stretch-Loaded" },
        { id: "casa-e4", name: "Aperturas con Banda", pattern: "Aducción", sets: 3, repRange: "15–20", loadKg: 8, tensionType: "Metabolic" },
      ],
    },
    2: {
      day: "Día A", split: "Básicos de Bandas y Peso Corporal",
      exercises: [
        { id: "casa-e1", name: "Flexiones con Banda", pattern: "Empuje Horizontal", sets: 4, repRange: "12–15", loadKg: 5, tensionType: "Mechanical" },
        { id: "casa-e2", name: "Remo con Banda", pattern: "Tracción Horizontal", sets: 4, repRange: "10–12", loadKg: 20, tensionType: "Metabolic" },
        { id: "casa-e3", name: "Flexiones Pike", pattern: "Empuje Vertical", sets: 4, repRange: "8–10", loadKg: 0, tensionType: "Stretch-Loaded" },
        { id: "casa-e4", name: "Aperturas con Banda", pattern: "Aducción", sets: 3, repRange: "12–15", loadKg: 12, tensionType: "Metabolic" },
      ],
    },
    3: {
      day: "Día A", split: "Básicos de Bandas y Peso Corporal",
      exercises: [
        { id: "casa-e1", name: "Flexiones con Banda", pattern: "Empuje Horizontal", sets: 5, repRange: "12–15", loadKg: 10, tensionType: "Mechanical" },
        { id: "casa-e2", name: "Remo con Banda", pattern: "Tracción Horizontal", sets: 4, repRange: "10–12", loadKg: 25, tensionType: "Metabolic" },
        { id: "casa-e3", name: "Flexiones Pike", pattern: "Empuje Vertical", sets: 4, repRange: "8–10", loadKg: 0, tensionType: "Stretch-Loaded" },
        { id: "casa-e4", name: "Aperturas con Banda", pattern: "Aducción", sets: 4, repRange: "12–15", loadKg: 15, tensionType: "Metabolic" },
      ],
    },
    4: {
      day: "Día A", split: "Básicos de Bandas y Peso Corporal",
      exercises: [
        { id: "casa-e1", name: "Flexiones con Banda", pattern: "Empuje Horizontal", sets: 5, repRange: "10–12", loadKg: 15, tensionType: "Mechanical" },
        { id: "casa-e2", name: "Remo con Banda", pattern: "Tracción Horizontal", sets: 5, repRange: "8–10", loadKg: 30, tensionType: "Metabolic" },
        { id: "casa-e3", name: "Flexiones Pike", pattern: "Empuje Vertical", sets: 4, repRange: "6–8", loadKg: 0, tensionType: "Stretch-Loaded" },
        { id: "casa-e4", name: "Aperturas con Banda", pattern: "Aducción", sets: 3, repRange: "10–12", loadKg: 18, tensionType: "Metabolic" },
      ],
    },
    5: {
      day: "Día A", split: "Descarga · Refresco Técnico",
      exercises: [
        { id: "casa-e1", name: "Flexiones Estándar", pattern: "Empuje Horizontal", sets: 2, repRange: "10–12", loadKg: 0, tensionType: "Mechanical" },
        { id: "casa-e2", name: "Remo con Banda (Ligero)", pattern: "Tracción Horizontal", sets: 2, repRange: "12–15", loadKg: 10, tensionType: "Metabolic" },
        { id: "casa-e3", name: "Flexiones Declinadas", pattern: "Empuje Vertical", sets: 2, repRange: "10–12", loadKg: 0, tensionType: "Stretch-Loaded" },
        { id: "casa-e4", name: "Aperturas con Banda (Ligero)", pattern: "Aducción", sets: 2, repRange: "12–15", loadKg: 5, tensionType: "Metabolic" },
      ],
    },
  },
  PRO: {
    1: {
      day: "Día A", split: "Protocolo de Alta Intensidad PRO",
      exercises: [
        { id: "pro-e1", name: "Press de Banca con Mancuernas con Déficit", pattern: "Empuje Horizontal", sets: 4, repRange: "8–10", loadKg: 45, tensionType: "Mechanical" },
        { id: "pro-e2", name: "Remo Lastrado Apoyado en Pecho", pattern: "Tracción Horizontal", sets: 4, repRange: "6–8", loadKg: 50, tensionType: "Mechanical" },
        { id: "pro-e3", name: "Fondos Lastrados", pattern: "Empuje Vertical", sets: 3, repRange: "8–10", loadKg: 20, tensionType: "Stretch-Loaded" },
        { id: "pro-e4", name: "Pullover con Mancuerna", pattern: "Estiramiento-Dorsal", sets: 3, repRange: "12–15", loadKg: 28, tensionType: "Metabolic" },
      ],
    },
    2: {
      day: "Día A", split: "Protocolo de Alta Intensidad PRO",
      exercises: [
        { id: "pro-e1", name: "Press de Banca con Mancuernas con Déficit", pattern: "Empuje Horizontal", sets: 4, repRange: "6–8", loadKg: 50, tensionType: "Mechanical" },
        { id: "pro-e2", name: "Remo Lastrado Apoyado en Pecho", pattern: "Tracción Horizontal", sets: 4, repRange: "6–8", loadKg: 55, tensionType: "Mechanical" },
        { id: "pro-e3", name: "Fondos Lastrados", pattern: "Empuje Vertical", sets: 4, repRange: "8–10", loadKg: 25, tensionType: "Stretch-Loaded" },
        { id: "pro-e4", name: "Pullover con Mancuerna", pattern: "Estiramiento-Dorsal", sets: 3, repRange: "10–12", loadKg: 32, tensionType: "Metabolic" },
      ],
    },
    3: {
      day: "Día A", split: "Protocolo de Alta Intensidad PRO",
      exercises: [
        { id: "pro-e1", name: "Press de Banca con Mancuernas con Déficit", pattern: "Empuje Horizontal", sets: 5, repRange: "5–7", loadKg: 55, tensionType: "Mechanical" },
        { id: "pro-e2", name: "Remo Lastrado Apoyado en Pecho", pattern: "Tracción Horizontal", sets: 4, repRange: "5–6", loadKg: 60, tensionType: "Mechanical" },
        { id: "pro-e3", name: "Fondos Lastrados", pattern: "Empuje Vertical", sets: 4, repRange: "6–8", loadKg: 30, tensionType: "Stretch-Loaded" },
        { id: "pro-e4", name: "Pullover con Mancuerna", pattern: "Estiramiento-Dorsal", sets: 4, repRange: "10–12", loadKg: 36, tensionType: "Metabolic" },
      ],
    },
    4: {
      day: "Día A", split: "Protocolo de Alta Intensidad PRO",
      exercises: [
        { id: "pro-e1", name: "Press de Banca con Mancuernas con Déficit", pattern: "Empuje Horizontal", sets: 5, repRange: "3–5", loadKg: 60, tensionType: "Mechanical" },
        { id: "pro-e2", name: "Remo Lastrado Apoyado en Pecho", pattern: "Tracción Horizontal", sets: 5, repRange: "4–5", loadKg: 65, tensionType: "Mechanical" },
        { id: "pro-e3", name: "Fondos Lastrados", pattern: "Empuje Vertical", sets: 4, repRange: "5–7", loadKg: 35, tensionType: "Stretch-Loaded" },
        { id: "pro-e4", name: "Pullover con Mancuerna", pattern: "Estiramiento-Dorsal", sets: 3, repRange: "6–8", loadKg: 40, tensionType: "Metabolic" },
      ],
    },
    5: {
      day: "Día A", split: "Descarga · Refresco Técnico",
      exercises: [
        { id: "pro-e1", name: "Press de Banca con Mancuernas con Déficit (Ligero)", pattern: "Empuje Horizontal", sets: 2, repRange: "10–12", loadKg: 30, tensionType: "Mechanical" },
        { id: "pro-e2", name: "Remo Lastrado Apoyado en Pecho (Ligero)", pattern: "Tracción Horizontal", sets: 2, repRange: "10–12", loadKg: 35, tensionType: "Mechanical" },
        { id: "pro-e3", name: "Fondos con Peso Corporal", pattern: "Empuje Vertical", sets: 2, repRange: "10–12", loadKg: 0, tensionType: "Stretch-Loaded" },
        { id: "pro-e4", name: "Pullover con Mancuerna (Ligero)", pattern: "Estiramiento-Dorsal", sets: 2, repRange: "12–15", loadKg: 20, tensionType: "Metabolic" },
      ],
    },
  }
};
