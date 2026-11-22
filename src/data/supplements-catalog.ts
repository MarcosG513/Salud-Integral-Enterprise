// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGO CLÍNICO DE SUPLEMENTACIÓN CONDICIONAL (EVIDENCIA 2023–2026)
// Categorías: Núcleo Condicional, Soporte Base Contextual y Módulos Opt-In Privados
// ─────────────────────────────────────────────────────────────────────────────

export type SupplementCategory = "core" | "contextual" | "opt_in_vascular";

export interface SupplementSpec {
  id: string;
  name: string;
  abbr: string;
  category: SupplementCategory;
  evidenceClass: "A" | "B";
  standardDose: string;
  pathway: string;
  timingGuide: string;
  femaleNote?: string;
  cycleNote?: string;
  hepaticSafetyWarning?: string;
  hepaticChecks?: string[];
  editorialDisclaimer: string;
}

export const SUPPLEMENTS_CATALOG: SupplementSpec[] = [
  // ── 1. NÚCLEO CONDICIONAL (Evidencia y Condicionalidad Fisiológica) ─────────
  {
    id: "cre",
    name: "Monohidrato de Creatina",
    abbr: "CrM",
    category: "core",
    evidenceClass: "A",
    standardDose: "3–5 g/día",
    pathway: "Resíntesis de fosfocreatina (ATP) e hidratación intracelular",
    timingGuide: "Diario · Cualquier hora",
    femaleNote:
      "Nota fisiológica femenina: Las mujeres presentan reservas endógenas basales hasta un 20–30% menores. La suplementación con 3–5 g/día aporta respaldo cognitivo y de fuerza ante restricción de sueño, fase lútea, posparto y posmenopausia.",
    cycleNote: "Uso continuo; días 1–21 activan amortiguación hídrica en TDEE adaptativo.",
    editorialDisclaimer:
      "El ligero incremento inicial de peso (0.5–1.5 kg) refleja retención hídrica intramuscular fisiológica, no ganancia de tejido adiposo.",
  },
  {
    id: "caf",
    name: "Cafeína Anhidra",
    abbr: "CAF",
    category: "core",
    evidenceClass: "A",
    standardDose: "3–6 mg/kg",
    pathway: "Antagonismo de receptores de adenosina y activación neuromuscular",
    timingGuide: "~60 min pre-entreno",
    editorialDisclaimer:
      "Bloqueada dinámicamente en entrenamientos vespertinos tardíos o nocturnos (< 8 h antes de dormir) para preservar la arquitectura del sueño profundo.",
  },
  {
    id: "ash",
    name: "Ashwagandha KSM-66",
    abbr: "KSM",
    category: "core",
    evidenceClass: "A",
    standardDose: "600 mg/día",
    pathway: "Modulación del eje HPA y atenuación de cortisol elevado",
    timingGuide: "Ciclos ~8 semanas · PM/Comida",
    cycleNote: "Ciclo sugerido de ~8 semanas con descanso posterior. Evidencia matizada: apoya manejo de estrés y sueño, sin garantizar alzas clínicas constantes de testosterona.",
    hepaticSafetyWarning:
      "Advertencia de seguridad hepática: Existen reportes clínicos de lesión hepática idiosincrásica y hepatitis colestásica asociados a extractos de Ashwagandha. Requiere descarte de hepatopatía crónica y supervisión médica previa (incluyendo perfil tiroideo).",
    hepaticChecks: [
      "Confirmo ausencia de enfermedad hepática crónica, antecedentes de ictericia o elevación de transaminasas.",
      "Comprendo la advertencia clínica sobre reportes poco frecuentes de lesión hepática/hepatitis colestásica inducida por hierbas.",
      "He consultado o consultaré con un profesional médico (incluyendo evaluación tiroidea) antes de iniciar ciclos de 8 semanas.",
    ],
    editorialDisclaimer:
      "Uso condicional orientado a estrés crónico o elevación de cortisol. Suspende de inmediato ante fatiga inusual, náuseas, coluria o coloración amarillenta en piel/ojos.",
  },

  // ── 2. SOPORTE BASE CONTEXTUAL (Opcional, no obligatorio en Home) ──────────
  {
    id: "bet",
    name: "Beta-Alanina",
    abbr: "β-ALA",
    category: "contextual",
    evidenceClass: "A",
    standardDose: "4–6 g/día",
    pathway: "Incremento de carnosina intramuscular y tampón de H+",
    timingGuide: "Diario en tomas divididas",
    editorialDisclaimer:
      "Útil principalmente en esfuerzos continuos o series de alta densidad (60–240 s). La parestesia leve (hormigueo) es transitoria y benigna.",
  },
  {
    id: "o3",
    name: "Aceite de Pescado Omega-3",
    abbr: "O3",
    category: "contextual",
    evidenceClass: "A",
    standardDose: "1–3 g/día",
    pathway: "Resolución inflamatoria EPA/DHA y fluidez de membrana",
    timingGuide: "Con comida principal",
    editorialDisclaimer:
      "El sistema descuenta automáticamente los gramos lipídicos (9 kcal/g) del objetivo de grasas diarias cuando está marcado como activo.",
  },
  {
    id: "d3",
    name: "Vitamina D3",
    abbr: "D3",
    category: "contextual",
    evidenceClass: "A",
    standardDose: "600–800 UI/día",
    pathway: "Transcripción del receptor nuclear VDR y mineralización ósea",
    timingGuide: "Mañana · Con comida grasa",
    editorialDisclaimer:
      "Dosis de mantenimiento estándar según ingesta basal (600–800 UI/día) junto a comida con grasa. Dosis superiores deben ajustarse según analítica sérica de 25(OH)D.",
  },
  {
    id: "mg",
    name: "Glicinato de Magnesio",
    abbr: "MG",
    category: "contextual",
    evidenceClass: "A",
    standardDose: "310–320 mg/día",
    pathway: "Cofactor ATPasa, relajación neuromuscular y receptor NMDA",
    timingGuide: "Tarde / Pre-sueño",
    editorialDisclaimer:
      "Referencia clínica base de 310–320 mg/día en mujeres (hasta ~400 mg/día en hombres) cuando la ingesta dietética de vegetales/semillas es insuficiente.",
  },
  {
    id: "wpi",
    name: "Aislado de Proteína de Suero",
    abbr: "WPI",
    category: "contextual",
    evidenceClass: "A",
    standardDose: "30 g/toma",
    pathway: "Estimulación aguda de síntesis proteica muscular (MPS)",
    timingGuide: "Post-entreno o entre tomas",
    editorialDisclaimer:
      "Suplemento calórico conveniente cuando no se alcanza el objetivo proteico con alimentos sólidos. Se descuenta automáticamente de los macronutrientes diarios.",
  },

  // ── 3. MÓDULO OPT-IN PRIVADO: VITALIDAD Y SALUD VASCULAR ─────────────────
  {
    id: "cit",
    name: "Malato de L-Citrulina",
    abbr: "CitM",
    category: "opt_in_vascular",
    evidenceClass: "A",
    standardDose: "1.5–3 g/día (vasc.) · 6–8 g (pre)",
    pathway: "Biodisponibilidad L-Arginina y síntesis de Óxido Nítrico (eNOS)",
    timingGuide: "30–45 min pre-entreno o 1.5–3 g/día",
    editorialDisclaimer:
      "Soporte nutricional coadyuvante para función endotelial y flujo sanguíneo periférico. No sustituye valoración médica vascular ni tratamientos prescritos.",
  },
];

export const VASCULAR_VITALITY_EDITORIAL = {
  title: "Vitalidad y Salud Vascular (Módulo Privado Opt-In)",
  subtitle:
    "Herramientas basadas en evidencia para salud endotelial, suelo pélvico y función vascular, enfocadas en bienestar integral y libres de estigmas.",
  doreyProtocolSummary:
    "Protocolo Dorey de acondicionamiento vascular del suelo pélvico: 3 series × 15 contracciones submáximas (10 s contracción / 10 s relajación), 4 veces por semana.",
  clinicalDisclaimer:
    "Aviso clínico: El Protocolo Dorey y la L-Citrulina apoyan la resistencia vascular y muscular pélvica. Ante síntomas persistentes de disfunción endotelial o dolor pélvico, consulta a un especialista en urología o fisioterapia de suelo pélvico.",
};
