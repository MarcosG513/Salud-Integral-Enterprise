// ─────────────────────────────────────────────────────────────────────────────
// BASE DE CONOCIMIENTO DE AYUDA Y GUÍA DE CONFIGURACIÓN (v6.1.0)
// Español claro, cercano, sin tecnicismos sin explicar y búsqueda tolerante.
// ─────────────────────────────────────────────────────────────────────────────

export type HelpCategoryId =
  | "inicio"
  | "tablero"
  | "nutricion"
  | "entrenamiento"
  | "suplementos"
  | "recuperacion"
  | "datos";

export type HelpTargetView =
  | "dashboard"
  | "nutrition"
  | "training"
  | "hormonal"
  | "supplements"
  | "profile"
  | "help";

export type HelpQuickLogTab = "weight" | "meal" | "sleep" | "training";

export interface HelpActionTarget {
  label: string;
  targetView?: HelpTargetView;
  openSettings?: boolean;
  openQuickLogTab?: HelpQuickLogTab;
  launchOnboarding?: "welcome" | "tour";
}

export interface HelpGuideArticle {
  id: string;
  category: HelpCategoryId;
  title: string;
  summary: string;
  whatAiDoes: string;
  whatYouConfigure: string[];
  proTip: string;
  keywords: string[];
  action: HelpActionTarget;
}

export interface HelpFaqItem {
  id: string;
  question: string;
  answer: string;
  category: HelpCategoryId;
  keywords: string[];
  action?: HelpActionTarget;
}

export interface HelpCategoryMeta {
  id: HelpCategoryId;
  label: string;
  shortLabel: string;
  description: string;
}

export function normalizeHelpSearch(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export const HELP_CATEGORIES: HelpCategoryMeta[] = [
  {
    id: "inicio",
    label: "Inicio Rápido y Configuración Básica",
    shortLabel: "Inicio",
    description: "Qué pocos datos ingresas tú y qué calcula el sistema de forma autónoma.",
  },
  {
    id: "tablero",
    label: "Tablero, Anillos de Homeostasis y Motor EMA-20",
    shortLabel: "Tablero y EMA-20",
    description: "Cómo leer los 3 anillos diarios, la fase de calibración y el check-in sin culpa.",
  },
  {
    id: "nutricion",
    label: "Nutrición y Registro con IA",
    shortLabel: "Nutrición IA",
    description: "Botón rápido +, AI Describe por voz/texto, Photo Detect, Etiqueta y validación.",
  },
  {
    id: "entrenamiento",
    label: "Entrenamiento Casa vs. Gimnasio (ACSM 2026)",
    shortLabel: "Entreno",
    description: "Casa o gym, qué es RIR, series 0.5x, doble progresión, cardio y biomecánica.",
  },
  {
    id: "suplementos",
    label: "Suplementación y Compuertas de Seguridad",
    shortLabel: "Suplementos",
    description: "Creatina, suero WPI, corte nocturno de cafeína, Ashwagandha y Protocolo Dorey.",
  },
  {
    id: "recuperacion",
    label: "Sueño, Pasos y Escudo Endocrino",
    shortLabel: "Recuperación",
    description: "Regla de sueño < 6.5 h, protección de hormonas sin cero carbos y telemetría.",
  },
  {
    id: "datos",
    label: "Modo Offline, Respaldos y Solución de Problemas",
    shortLabel: "Offline y Datos",
    description: "Guardado automático en IndexedDB, exportación CSV/JSON, Salud Nativa y Tour.",
  },
];

export const HELP_GUIDES: HelpGuideArticle[] = [
  {
    id: "inicio-perfil-minimo",
    category: "inicio",
    title: "Configuración inicial en 1 minuto: tus 10 datos básicos",
    summary:
      "Solo necesitas completar tu base física y rutina; la app se encarga de las fórmulas clínicas y los topes de seguridad.",
    whatAiDoes:
      "Selecciona automáticamente Mifflin-St Jeor o Cunningham (si añades % de grasa), estima tu gasto diario (TDEE), reparte proteína, carbohidratos, grasas protegidas, litros de agua y arma tu rutina ACSM 2026.",
    whatYouConfigure: [
      "Introduce peso, estatura, edad, sexo biológico y tus horas medias de sueño en el asistente de bienvenida o en Ajustes.",
      "Elige tu nivel de actividad diaria, objetivo principal (perder grasa, recomponer, ganar músculo o salud) y horario de entreno.",
      "Selecciona si entrenas en Casa (peso corporal o mancuernas/bandas) o en Gimnasio y cuántos días por semana.",
      "Opcional: añade tu % de grasa corporal en Ajustes si lo conoces; si no, no hace falta estimarlo a ojo.",
    ],
    proTip:
      "No necesitas ajustar manualmente multiplicadores de macros ni déficit calórico: la app los adapta según tu objetivo y tu descanso.",
    keywords: [
      "inicio",
      "configuracion",
      "perfil",
      "mifflin",
      "cunningham",
      "grasa",
      "ajustes",
      "empezar",
    ],
    action: {
      label: "Abrir asistente de bienvenida",
      launchOnboarding: "welcome",
    },
  },
  {
    id: "tablero-anillos-calibracion",
    category: "tablero",
    title: "Los 3 Anillos de Homeostasis, fase 'Calibrando' y Check-in semanal",
    summary:
      "Aprende qué significan proteína, carbos y grasas en tus anillos, por qué calibramos 14–30 días y cómo revisar tu semana sin estrés.",
    whatAiDoes:
      "Muestra tu progreso diario en tres anillos (Proteína en verde esmeralda, Carbohidratos en azul cian y Grasas en turquesa), aprende tu metabolismo real durante 14–30 días comparando ingesta con tendencia de peso y protege tus mínimos hormonales.",
    whatYouConfigure: [
      "Mira de un vistazo cuánto te falta para completar tus anillos del día desde la primera tarjeta del Tablero.",
      "Elige tu día preferido de la semana (domingo a sábado) en el selector de 'Check-in semanal flexible'.",
      "Pulsa 'Registrar Check-in Semanal' una vez a la semana para confirmar tu revisión sin compensaciones ni culpas.",
    ],
    proTip:
      "Durante las primeras 2 a 4 semanas verás 'Calibrando algoritmo'. Es normal: cuantos más pesajes matutinos e ingestas completas registres, más preciso será tu TDEE.",
    keywords: [
      "anillos",
      "homeostasis",
      "macros",
      "calibrando",
      "tdee",
      "check-in",
      "semanal",
      "culpa",
    ],
    action: {
      label: "Ir al Tablero principal",
      targetView: "dashboard",
    },
  },
  {
    id: "tablero-ema20-agua",
    category: "tablero",
    title: "Peso diario real vs. tendencia EMA-20 y agua por creatina",
    summary:
      "Tu báscula sube y baja por sal, estrés o creatina; la línea EMA-20 filtra el ruido para ver tu progreso real.",
    whatAiDoes:
      "Calcula un promedio suavizado de 20 días (EMA-20) para que una subida puntual de agua no arruine tu objetivo calórico. Si activas la Creatina o marcas retención, activa un amortiguador hídrico automático durante los primeros días de saturación.",
    whatYouConfigure: [
      "Pésate por la mañana en ayunas (idealmente 3 a 7 veces por semana) usando el botón flotante '+' → 'Peso'.",
      "Acepta comas o puntos decimales libremente (por ejemplo 84,5 o 84.5).",
      "Si quieres ver la gráfica comparada entre peso crudo y EMA-20, despliega el primer acordeón del Tablero.",
    ],
    proTip:
      "Un salto de +0.5 a +1.2 kg tras empezar creatina o cenar alto en carbohidratos es agua dentro del músculo, no grasa corporal.",
    keywords: [
      "peso",
      "ema",
      "ema-20",
      "bascula",
      "retencion",
      "agua",
      "creatina",
      "grafica",
    ],
    action: {
      label: "Registrar peso ahora",
      openQuickLogTab: "weight",
    },
  },
  {
    id: "nutricion-boton-rapido-ia",
    category: "nutricion",
    title: "Registro en 2 toques: Rápido, Etiqueta, AI Describe y Photo Detect",
    summary:
      "Anota cualquier comida desde cualquier pantalla con el botón '+' usando alimentos clínicos, texto/voz, fotografía o etiqueta.",
    whatAiDoes:
      "Comprime automáticamente tus fotos en el dispositivo antes de analizarlas de forma segura en la nube, desglosa platos complejos ingrediente por ingrediente (incluyendo aceites o salsas ocultas) y te ofrece un consejo glucémico breve.",
    whatYouConfigure: [
      "Pulsa el botón '+' abajo a la derecha y entra a la pestaña 'Comida'.",
      "Usa 'Rápido' para alimentos frecuentes con un solo toque y gramaje.",
      "Usa 'Etiqueta' para copiar directamente calorías y macros por porción de un producto envasado.",
      "Usa 'AI Describe' (escribiendo o dictando con 'Dictar') o 'Photo Detect' (haciendo foto al plato) para que Gemini IA estime los ingredientes.",
    ],
    proTip:
      "Si estás sin conexión o falla la red, el texto que hayas escrito no se pierde y puedes cambiar en 1 toque a 'Rápido' o 'Etiqueta'.",
    keywords: [
      "comida",
      "nutricion",
      "ia",
      "foto",
      "photo detect",
      "ai describe",
      "voz",
      "etiqueta",
      "boton +",
    ],
    action: {
      label: "Abrir registro de comida",
      openQuickLogTab: "meal",
    },
  },
  {
    id: "nutricion-validacion-parcial",
    category: "nutricion",
    title: "Ajustar porciones (0.5x–2x) y cuándo marcar 'Registro parcial'",
    summary:
      "La IA nunca guarda tus comidas a ciegas: revisas cada ingrediente, ajustas gramos y evitas distorsionar tu metabolismo.",
    whatAiDoes:
      "Recalcula al instante calorías y macros mientras tocas 0.5x, 1x, 1.5x o 2x o editas gramos. Si marcas 'Registro parcial', excluye ese día del cálculo adaptativo de TDEE para no confundir un día incompleto con un déficit extremo.",
    whatYouConfigure: [
      "Tras recibir el análisis de 'AI Describe' o 'Photo Detect', revisa las tarjetas editables de cada ingrediente.",
      "Toca 0.5x, 1x, 1.5x o 2x, escribe gramos exactos o pulsa '+ Añadir ingrediente' si faltó algo como aceite o pan.",
      "Marca la casilla 'Marcar como registro parcial' si ese día dejaste comidas sin anotar.",
      "Pulsa 'Confirmar y registrar' solo cuando veas correctas las cantidades.",
    ],
    proTip:
      "Cuando subas una foto sin cubiertos ni referencia de tamaño, la app bajará la confianza a 'Revisar porción' para recordarte ajustar los gramos.",
    keywords: [
      "porcion",
      "multiplicador",
      "0.5x",
      "2x",
      "confirmar",
      "parcial",
      "glucemico",
      "tip",
    ],
    action: {
      label: "Ir a módulo de Nutrición",
      targetView: "nutrition",
    },
  },
  {
    id: "entrenamiento-casa-gym-rir",
    category: "entrenamiento",
    title: "Casa vs. Gimnasio, qué es RIR y cómo contamos series (0.5x)",
    summary:
      "Tu rutina se adapta al material que tienes hoy y cuenta tanto el trabajo directo como el de músculos ayudantes.",
    whatAiDoes:
      "Cambia todo el catálogo de ejercicios entre Casa (peso corporal), Casa (mancuernas/bandas) y Gimnasio completo. Calcula automáticamente tu volumen semanal óptimo (MEV/MAV/MRV) sumando 1.0 serie por músculo principal y 0.5 series por músculo sinergista (ayudante).",
    whatYouConfigure: [
      "Elige tu entorno de entrenamiento y días/semana en el onboarding inicial o en Ajustes / Perfil.",
      "En Entrenamiento, revisa el RIR objetivo (RIR = cuántas repeticiones podrías haber hecho más antes del fallo; por ejemplo, RIR 2 significa parar sintiendo que podías sacar 2 más).",
      "Marca cada serie completada para llevar el control exacto del volumen de tu mesociclo.",
    ],
    proTip:
      "No hace falta entrenar al fallo en todas las series: trabajar entre RIR 1 y 3 estimula igual la masa muscular con mucha menos fatiga.",
    keywords: [
      "casa",
      "gimnasio",
      "rir",
      "sinergistas",
      "0.5x",
      "mev",
      "mav",
      "mrv",
      "acsm",
      "series",
    ],
    action: {
      label: "Abrir Entrenamiento",
      targetView: "training",
    },
  },
  {
    id: "entrenamiento-progresion-timer-deload",
    category: "entrenamiento",
    title: "Doble progresión, temporizador, cardio ≥ 3h y chequeo biomecánico",
    summary:
      "Sube peso solo cuando lo merezca tu técnica, descansa sin cortar tu música y evita fatiga acumulada automáticamente.",
    whatAiDoes:
      "Detecta si superaste el rango alto de repeticiones en sesiones seguidas (doble progresión) para sugerir +carga, reduce series automáticamente ante estancamiento o falta de sueño (Deload Reactivo) y verifica la separación entre cardio intenso y fuerza.",
    whatYouConfigure: [
      "Anota tus repeticiones y peso real al finalizar cada ejercicio o rutina para activar las sugerencias de doble progresión.",
      "Usa el temporizador de descanso integrado: funciona solo en pantalla y no interrumpe Spotify ni tu audio en segundo plano.",
      "Si haces cardio intenso el mismo día, indica al menos ≥ 3 horas de separación en la regla de entrenamiento concurrente.",
      "Completa el chequeo biomecánico de 5 movimientos (puntuación 1 a 3) para adaptar ejercicios según tu movilidad.",
    ],
    proTip:
      "Si el Deload Reactivo se activa, verás bajar las series a nivel de mantenimiento (4–8 por grupo): no es un retroceso, es para recuperar rendimiento.",
    keywords: [
      "progresion",
      "subir peso",
      "temporizador",
      "musica",
      "deload",
      "cardio",
      "3 horas",
      "biomecanico",
      "movilidad",
    ],
    action: {
      label: "Revisar rutina y biomecánica",
      targetView: "training",
    },
  },
  {
    id: "suplementos-dispensario-creatina-cafeina",
    category: "suplementos",
    title: "Cómo activar suplementos, ajuste automático con WPI/Creatina y Cafeína",
    summary:
      "Cada compuesto que marcas ajusta tus cálculos diarios y respeta tu ventana de sueño según la hora a la que entrenes.",
    whatAiDoes:
      "Si registras Aislado de Suero (WPI), descuenta sus gramos y calorías de tu meta de comida para no duplicar proteína. Si activas Creatina, protege tu tendencia EMA-20 contra el agua retenida. Además bloquea automáticamente la Cafeína cuando falta poco para tu hora de dormir.",
    whatYouConfigure: [
      "Entra en Suplementos y marca como 'TOMADO' o activo los que realmente uses cada día.",
      "Toca la dosis u horario de cualquier tarjeta si quieres personalizar tus gramos o franja horaria.",
      "Asegúrate de tener bien configurados tu 'Horario de entreno' y 'Hora de dormir' (Ajustes → Periodización y Descanso) para que el corte circadiano de cafeína sea exacto.",
    ],
    proTip:
      "Si entrenas de noche, el dispensario marcará la cafeína como bloqueada para proteger tu arquitectura de sueño profundo.",
    keywords: [
      "suplementos",
      "creatina",
      "whey",
      "wpi",
      "proteina",
      "cafeina",
      "noche",
      "bloqueo",
      "dosis",
    ],
    action: {
      label: "Ir a Suplementos",
      targetView: "supplements",
    },
  },
  {
    id: "suplementos-compuerta-hepatica-dorey",
    category: "suplementos",
    title: "Compuerta Hepática de Ashwagandha y Vitalidad Vascular (Protocolo Dorey)",
    summary:
      "Desbloquea compuestos con precaución clínica de forma segura y descubre dónde activar el módulo privado opcional.",
    whatAiDoes:
      "Mantiene bloqueada Ashwagandha KSM-66 por defecto como medida preventiva hepática y oculta el módulo de Vitalidad Vascular + Protocolo Dorey hasta que tú decidas activarlo.",
    whatYouConfigure: [
      "Para habilitar Ashwagandha KSM-66: pulsa el botón '🔒 Compuerta Hepática' en su tarjeta, lee la advertencia médica, marca las 3 casillas de verificación y confirma.",
      "Para activar Vitalidad y Salud Vascular (L-Citrulina eNOS + Protocolo Dorey 3×15): ve a Suplementos, desplázate al final del Dispensario Condicional y pulsa 'Activar Módulo' en la tarjeta privada Opt-In.",
      "Ajusta tus gramos diarios de L-Citrulina o sesiones semanales desde el mismo módulo o en Ajustes.",
    ],
    proTip:
      "Ante cualquier antecedente hepático, autoinmune o toma de medicación tiroidea, mantén la compuerta cerrada y consulta antes con tu médico.",
    keywords: [
      "ashwagandha",
      "ksm-66",
      "compuerta",
      "hepatica",
      "bloqueada",
      "dorey",
      "vascular",
      "citrulina",
      "suelo pelvico",
      "opt-in",
    ],
    action: {
      label: "Abrir Dispensario y Compuertas",
      targetView: "supplements",
    },
  },
  {
    id: "recuperacion-sueno-escudo-endocrino",
    category: "recuperacion",
    title: "Regla de sueño (< 6.5 h), Escudo Endocrino y acordeones de telemetría",
    summary:
      "Dormir poco o recortar calorías en exceso dispara alertas automáticas que protegen tus hormonas y energía.",
    whatAiDoes:
      "Si registras 3 o más noches recientes por debajo de 6.5 h (o promedio crónico bajo), pausa automáticamente nuevos recortes calóricos y reduce hasta un 15% el volumen de entrenamiento. Si tu Disponibilidad Energética baja del umbral (25 masculino / 30 femenino kcal/kg FFM), el Escudo IOC 2023 blinda tus grasas en ≥0.6 g/kg y fija un piso seguro de carbohidratos sin llevarlos jamás a 0 g.",
    whatYouConfigure: [
      "Anota tu descanso y pasos diarios desde el botón '+' → pestaña 'Sueño'.",
      "Despliega los dos acordeones colapsados al final del Tablero cuando quieras revisar tendencias EMA-20, EA en solo lectura o consultar al Entrenador IA ATO.",
      "Edita analíticas reales (LH, FSH, Testosterona, Cortisol, Prolactina, Estradiol) solo si tienes resultados de laboratorio en Salud Hormonal.",
    ],
    proTip:
      "La Disponibilidad Energética (EA) ahora es de solo lectura: ya no tienes un deslizador manual que pueda descalibrarla por error.",
    keywords: [
      "sueno",
      "6.5",
      "pasos",
      "escudo endocrino",
      "hormonal",
      "ea",
      "ioc 2023",
      "grasas",
      "carbohidratos",
      "acordeon",
      "ato",
    ],
    action: {
      label: "Registrar sueño y pasos",
      openQuickLogTab: "sleep",
    },
  },
  {
    id: "datos-offline-respaldos-tour",
    category: "datos",
    title: "Modo Offline IndexedDB, exportación CSV/JSON, Salud Nativa y Tour",
    summary:
      "Tus datos sobreviven sin conexión con copia espejo automática y puedes descargarlos o reiniciar la guía cuando quieras.",
    whatAiDoes:
      "Guarda cada cambio de forma inmediata para lectura rápida y lo replica en segundo plano en IndexedDB junto a una cola offline de sincronización idempotente.",
    whatYouConfigure: [
      "Ve a Perfil (icono de usuario abajo o en la barra) para comprobar el estado 'IndexedDB Espejo: Activo'.",
      "Pulsa 'Exportar CSV' para descargar historial de peso, comidas y entrenos en hoja de cálculo, o 'Exportar JSON' / 'Importar JSON' para respaldos completos.",
      "En el botón '+' → 'Sueño', pulsa 'Sincronizar Pasos y Sueño' para leer Health Connect / HealthKit en Android/iOS nativo (o usar el modo manual en web).",
      "Desde esta misma vista de Guía y Ayuda puedes relanzar el tour corto o reabrir la bienvenida en cualquier momento.",
    ],
    proTip:
      "Haz una copia rápida en JSON antes de cambiar de teléfono móvil para llevar todo tu historial contigo.",
    keywords: [
      "offline",
      "indexeddb",
      "sin internet",
      "csv",
      "json",
      "backup",
      "respaldo",
      "exportar",
      "health connect",
      "healthkit",
      "tour",
      "problema",
    ],
    action: {
      label: "Ir a Perfil y Respaldos",
      targetView: "profile",
    },
  },
];

export const HELP_FAQS: HelpFaqItem[] = [
  {
    id: "faq-creatina-peso",
    question: "¿Por qué subí de peso al empezar a tomar creatina?",
    answer:
      "La creatina atrae agua al interior del músculo (hidratación celular), lo cual es positivo y no representa ganancia de grasa. Cuando activas la creatina en el Dispensario, el motor activa un amortiguador hídrico temporal para evitar que tu TDEE estime falsamente un exceso calórico.",
    category: "tablero",
    keywords: ["creatina", "peso", "subi", "retencion", "agua", "bascula"],
    action: { label: "Ver suplementos", targetView: "supplements" },
  },
  {
    id: "faq-ashwagandha-bloqueada",
    question: "¿Por qué no puedo activar Ashwagandha KSM-66?",
    answer:
      "Ashwagandha incluye una Compuerta Hepática de seguridad obligatoria porque existen reportes infrecuentes de hepatotoxicidad e interacción tiroidea en personas sensibles. Para desbloquearla, pulsa el botón '🔒 Compuerta Hepática' en su tarjeta dentro de Suplementos y confirma las 3 preguntas de descarte clínico.",
    category: "suplementos",
    keywords: ["ashwagandha", "ksm", "bloqueada", "compuerta", "hepatica", "activar"],
    action: { label: "Abrir Dispensario", targetView: "supplements" },
  },
  {
    id: "faq-protocolo-dorey",
    question: "¿Dónde está el Protocolo Dorey y el módulo de Vitalidad Vascular?",
    answer:
      "Por privacidad clínica está desactivado por defecto como módulo Opt-In. Ve a la pestaña 'Suplementos', baja hasta la tarjeta 'Vitalidad y Salud Vascular' al final de la columna del Dispensario y pulsa 'Activar Módulo' para habilitar L-Citrulina vascular y los ejercicios 3×15 del Protocolo Dorey.",
    category: "suplementos",
    keywords: ["dorey", "vascular", "vitalidad", "citrulina", "suelo pelvico", "donde"],
    action: { label: "Ir a Suplementos", targetView: "supplements" },
  },
  {
    id: "faq-dia-sin-comidas",
    question: "¿Qué pasa si un día no registro todas mis comidas?",
    answer:
      "No pasa nada y nunca se te penaliza. Simplemente marca la casilla 'Marcar como registro parcial' al confirmar una comida en el botón '+', así el algoritmo sabrá ignorar ese día en el cálculo adaptativo de calorías sin descalibrar tu TDEE real.",
    category: "nutricion",
    keywords: ["comidas", "registro parcial", "olvide", "incompleto", "tdee"],
    action: { label: "Abrir registro rápido", openQuickLogTab: "meal" },
  },
  {
    id: "faq-casa-a-gimnasio",
    question: "¿Cómo cambio mi rutina de Casa a Gimnasio (o al revés)?",
    answer:
      "Puedes cambiar tu entorno en cualquier momento entre 'Casa (peso corporal)', 'Casa (mancuernas / bandas)' y 'Gimnasio completo' desde el asistente de bienvenida o editando tu perfil. Al instante se actualizarán todos los ejercicios, rangos de repeticiones y progresiones.",
    category: "entrenamiento",
    keywords: ["casa", "gimnasio", "gym", "rutina", "cambiar", "equipo"],
    action: { label: "Reabrir configuración inicial", launchOnboarding: "welcome" },
  },
  {
    id: "faq-calibrando-algoritmo",
    question: "¿Por qué dice 'Calibrando algoritmo' las primeras semanas?",
    answer:
      "El motor adaptativo necesita entre 14 y 30 días de datos combinados (peso matutino + registro completo de comidas) para medir con certeza cuántas calorías quema realmente tu cuerpo. Hasta completar esa ventana usa fórmulas clínicas seguras y te muestra el % de avance.",
    category: "tablero",
    keywords: ["calibrando", "algoritmo", "tdee", "semanas", "porcentaje"],
    action: { label: "Ver Tablero", targetView: "dashboard" },
  },
  {
    id: "faq-cafeina-bloqueada",
    question: "¿Por qué se bloquea la cafeína si entreno de noche?",
    answer:
      "La cafeína tiene una vida media prolongada; tomarla menos de ~8–10 horas antes de acostarte reduce tu sueño profundo y activa deuda de descanso. Si seleccionaste horario nocturno cerca de tu hora de dormir, la app intercepta la toma y recomienda entrenar sin estimulantes.",
    category: "suplementos",
    keywords: ["cafeina", "noche", "sueno", "bloqueada", "horario", "corte"],
    action: { label: "Revisar horarios en Ajustes", openSettings: true },
  },
  {
    id: "faq-datos-sin-internet",
    question: "¿Mis datos se guardan si me quedo sin internet?",
    answer:
      "Sí. Toda tu información se guarda localmente de inmediato y se duplica en IndexedDB con una cola de cambios pendientes offline. Solo requieren conexión en tiempo real el asesor IA ATO y el análisis de comidas con Gemini IA ('AI Describe' y 'Photo Detect').",
    category: "datos",
    keywords: ["internet", "offline", "indexeddb", "guardar", "respaldo", "sin red"],
    action: { label: "Ir a Perfil y Respaldos", targetView: "profile" },
  },
];
