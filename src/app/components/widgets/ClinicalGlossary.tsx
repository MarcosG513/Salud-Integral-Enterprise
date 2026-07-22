import { X } from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";
import { useState, useRef, useEffect, useCallback, useId } from "react";
import ReactDOM from "react-dom";

export const GLOSSARY_TERMS: Record<string, { term: string; definition: string; significance: string }> = {
  lh: {
    term: "LH (Hormona Luteinizante)",
    definition: "Estimula las células de Leydig en los testículos para producir testosterona. En mujeres, desencadena la ovulación.",
    significance: "Su supresión indica apagado hipotalámico inducido por estrés o baja disponibilidad energética."
  },
  fsh: {
    term: "FSH (Hormona Foliculoestimulante)",
    definition: "Regula el desarrollo, el crecimiento y la maduración reproductiva corporal.",
    significance: "La supresión conjunta con LH confirma hipogonadismo hipogonadotrófico funcional."
  },
  shbg: {
    term: "SHBG (Globulina Fijadora de Hormonas Sexuales)",
    definition: "Proteína plasmática reguladora de la disponibilidad de hormonas sexuales libres.",
    significance: "Niveles elevados a causa de déficit calórico excesivo reducen el porcentaje de testosterona libre biodisponible."
  },
  cortisol: {
    term: "Cortisol (Glucocorticoide del estrés)",
    definition: "Hormona catabólica liberada por las glándulas suprarrenales ante estresores físicos o mentales.",
    significance: "Elevaciones crónicas inducen la atrofia muscular por degradación proteica y suprimen la secreción pulsátil de LH."
  },
  "red-s": {
    term: "RED-S (Déficit Relativo de Energía en el Deporte)",
    definition: "Síndrome clínico general que afecta el metabolismo, el eje reproductivo, la inmunidad y la salud ósea.",
    significance: "Causado por un suministro de energía insuficiente comparado con el gasto por entrenamiento de forma crónica."
  },
  ea: {
    term: "EA (Disponibilidad Energética)",
    definition: "Relación entre ingesta calórica neta (Ingesta - Gasto por ejercicio) y la masa libre de grasa (FFM).",
    significance: "Un valor por debajo de 30 kcal/kg FFM/día apaga prioritariamente las funciones reproductiva y tiroidea."
  },
  "disponibilidad energética": {
    term: "EA (Disponibilidad Energética)",
    definition: "Relación entre ingesta calórica neta (Ingesta - Gasto por ejercicio) y la masa libre de grasa (FFM).",
    significance: "Un valor por debajo de 30 kcal/kg FFM/día apaga prioritariamente las funciones reproductiva y tiroidea."
  },
  "disponibilidad energetica": {
    term: "EA (Disponibilidad Energética)",
    definition: "Relación entre ingesta calórica neta (Ingesta - Gasto por ejercicio) y la masa libre de grasa (FFM).",
    significance: "Un valor por debajo de 30 kcal/kg FFM/día apaga prioritariamente las funciones reproductiva y tiroidea."
  },
  "disponibilidad energéticaea (disponibilidad energética)": {
    term: "EA (Disponibilidad Energética)",
    definition: "Relación entre ingesta calórica neta (Ingesta - Gasto por ejercicio) y la masa libre de grasa (FFM).",
    significance: "Un valor por debajo de 30 kcal/kg FFM/día apaga prioritariamente las funciones reproductiva y tiroidea."
  },
  ffm: {
    term: "FFM (Masa Libre de Grasa)",
    definition: "Suma de todos los tejidos corporales activos excepto la masa adiposa (músculo, hueso, órganos, agua).",
    significance: "Utilizada como denominador clave para normalizar la tasa metabólica (TMB) y la disponibilidad de energía."
  },
  mrv: {
    term: "MRV (Volumen Máximo Recuperable)",
    definition: "El límite superior de volumen de entrenamiento semanal del cual un atleta es capaz de recuperarse.",
    significance: "Exceder este hito clínico de forma sostenida desencadena sobreentrenamiento sistémico y catabolismo celular."
  },
  mev: {
    term: "MEV (Volumen Mínimo Efectivo)",
    definition: "La dosis mínima umbral de series de entrenamiento semanales necesarias para conservar o inducir hipertrofia.",
    significance: "Útil en fases de déficit calórico para mantener masa muscular reduciendo la fatiga central de entrenamiento."
  },
  // 12 Clinical Supplements mappings
  cre: {
    term: "Monohidrato de Creatina",
    definition: "Aumenta los depósitos celulares de fosfocreatina para la resíntesis rápida de ATP durante esfuerzos de alta intensidad.",
    significance: "Mejora la fuerza explosiva, la capacidad de trabajo y el volumen intracelular de hidratación."
  },
  creatina: {
    term: "Monohidrato de Creatina",
    definition: "Aumenta los depósitos celulares de fosfocreatina para la resíntesis rápida de ATP durante esfuerzos de alta intensidad.",
    significance: "Mejora la fuerza explosiva, la capacidad de trabajo y el volumen intracelular de hidratación."
  },
  cit: {
    term: "Malato de L-Citrulina",
    definition: "Precursor directo de óxido nítrico por la vía eNOS, optimizando el flujo sanguíneo y el aporte de oxígeno muscular.",
    significance: "Reduce el estrés por fatiga muscular y maximiza la eliminación de lactato y amonio durante la sesión."
  },
  citrulina: {
    term: "Malato de L-Citrulina",
    definition: "Precursor directo de óxido nítrico por la vía eNOS, optimizando el flujo sanguíneo y el aporte de oxígeno muscular.",
    significance: "Reduce el estrés por fatiga muscular y maximiza la eliminación de lactato y amonio durante la sesión."
  },
  ash: {
    term: "Ashwagandha KSM-66",
    definition: "Hierba adaptógena que modula el eje HPA para atenuar la secreción crónica de cortisol inducida por estrés físico.",
    significance: "Optimiza la recuperación del SNC, previene el catabolismo y favorece el balance de testosterona libre."
  },
  ashwagandha: {
    term: "Ashwagandha KSM-66",
    definition: "Hierba adaptógena que modula el eje HPA para atenuar la secreción crónica de cortisol inducida por estrés físico.",
    significance: "Optimiza la recuperación del SNC, previene el catabolismo y favorece el balance de testosterona libre."
  },
  caf: {
    term: "Cafeína Anhidra",
    definition: "Antagonista competitivo de los receptores de adenosina en el cerebro, inhibiendo la señal de fatiga nerviosa.",
    significance: "Incrementa el reclutamiento de unidades motoras y mejora temporalmente la fuerza y la concentración."
  },
  cafeina: {
    term: "Cafeína Anhidra",
    definition: "Antagonista competitivo de los receptores de adenosina en el cerebro, inhibiendo la señal de fatiga nerviosa.",
    significance: "Incrementa el reclutamiento de unidades motoras y mejora temporalmente la fuerza y la concentración."
  },
  bet: {
    term: "Beta-Alanina",
    definition: "Aminoácido limitante en la síntesis de carnosina intramuscular, amortiguando la acumulación de protones (H+).",
    significance: "Retrasa la aparición de la acidosis y fatiga muscular en esfuerzos continuos de 60-240 segundos."
  },
  "beta-alanina": {
    term: "Beta-Alanina",
    definition: "Aminoácido limitante en la síntesis de carnosina intramuscular, amortiguando la acumulación de protones (H+).",
    significance: "Retrasa la aparición de la acidosis y fatiga muscular en esfuerzos continuos de 60-240 segundos."
  },
  the: {
    term: "L-Teanina",
    definition: "Aminoácido que promueve la actividad de ondas cerebrales alfa, induciendo relajación mental sin causar somnolencia.",
    significance: "Sincroniza y suaviza la respuesta nerviosa de la cafeína, previniendo la sobre-estimulación periférica."
  },
  teanina: {
    term: "L-Teanina",
    definition: "Aminoácido que promueve la actividad de ondas cerebrales alfa, induciendo relajación mental sin causar somnolencia.",
    significance: "Sincroniza y suaviza la respuesta nerviosa de la cafeína, previniendo la sobre-estimulación periférica."
  },
  mg: {
    term: "Glicinato de Magnesio",
    definition: "Mineral esencial implicado en más de 300 reacciones enzimáticas y regulador clave de los receptores NMDA de glutamato.",
    significance: "Soporta la relajación de la fibra muscular, la conducción nerviosa y optimiza la calidad del descanso profundo."
  },
  magnesio: {
    term: "Glicinato de Magnesio",
    definition: "Mineral esencial implicado en más de 300 reacciones enzimáticas y regulador clave de los receptores NMDA de glutamato.",
    significance: "Soporta la relajación de la fibra muscular, la conducción nerviosa y optimiza la calidad del descanso profundo."
  },
  zn: {
    term: "Picolinato de Zinc",
    definition: "Cofactor enzimático crucial para la síntesis de ARN/ADN y el soporte inmunológico y androgénico testicular.",
    significance: "Previene la caída de testosterona libre durante períodos prolongados de déficit calórico o sobrecarga de entreno."
  },
  zinc: {
    term: "Picolinato de Zinc",
    definition: "Cofactor enzimático crucial para la síntesis de ARN/ADN y el soporte inmunológico y androgénico testicular.",
    significance: "Previene la caída de testosterona libre durante períodos prolongados de déficit calórico o sobrecarga de entreno."
  },
  o3: {
    term: "Aceite de Pescado Omega-3",
    definition: "Ácidos grasos esenciales que se incorporan a la membrana celular, optimizando la fluidez y reduciendo la inflamación de bajo grado.",
    significance: "Mejora la sensibilidad insulínica, la recuperación miocárdica y la salud vascular sistémica."
  },
  "omega-3": {
    term: "Aceite de Pescado Omega-3",
    definition: "Ácidos grasos esenciales que se incorporan a la membrana celular, optimizando la fluidez y reduciendo la inflamación de bajo grado.",
    significance: "Mejora la sensibilidad insulínica, la recuperación miocárdica y la salud vascular sistémica."
  },
  d3: {
    term: "Vitamina D3",
    definition: "Hormona secosteroide reguladora de la expresión de genes de receptores nucleares y absorción de calcio.",
    significance: "Crucial para mantener la densidad ósea, la síntesis androgénica y el correcto funcionamiento inmunocelular."
  },
  "vitamina-d3": {
    term: "Vitamina D3",
    definition: "Hormona secosteroide reguladora de la expresión de genes de receptores nucleares y absorción de calcio.",
    significance: "Crucial para mantener la densidad ósea, la síntesis androgénica y el correcto funcionamiento inmunocelular."
  },
  wpi: {
    term: "Aislado de Proteína de Suero",
    definition: "Fracción proteica de absorción rápida y alto valor biológico rica en leucina para la señalización de mTORC1.",
    significance: "Estimula la síntesis de proteínas musculares (MPS) y la reconstrucción miofibrilar post-esfuerzo."
  },
  "proteina-suero": {
    term: "Aislado de Proteína de Suero",
    definition: "Fracción proteica de absorción rápida y alto valor biológico rica en leucina para la señalización de mTORC1.",
    significance: "Estimula la síntesis de proteínas musculares (MPS) y la reconstrucción miofibrilar post-esfuerzo."
  },
  mel: {
    term: "Melatonina",
    definition: "Hormona indolamina sintetizada en la glándula pineal que coordina el ritmo circadiano y actúa como potente antioxidante celular.",
    significance: "Induce el sueño reparador y reduce el daño oxidativo provocado por entrenamientos exhaustivos."
  },
  melatonina: {
    term: "Melatonina",
    definition: "Hormona indolamina sintetizada en la glándula pineal que coordina el ritmo circadiano y actúa como potente antioxidante celular.",
    significance: "Induce el sueño reparador y reduce el daño oxidativo provocado por entrenamientos exhaustivos."
  },

  // ── Training Stimulus Mechanisms ─────────────────────────────────────────────
  tension_mecanica: {
    term: "Tensión Mecánica (Estímulo Primario)",
    definition: "Factor principal de la hipertrofia muscular. Ocurre cuando los sarcómeros se exponen a una carga alta bajo máximo reclutamiento de unidades motoras.",
    significance: "Es el driver más potente de la síntesis de proteínas musculares (MPS). Se optimiza con cargas de 65–85% del 1RM en rangos de 5–12 repeticiones."
  },
  "tensión mecánica": {
    term: "Tensión Mecánica (Estímulo Primario)",
    definition: "Factor principal de la hipertrofia muscular. Ocurre cuando los sarcómeros se exponen a una carga alta bajo máximo reclutamiento de unidades motoras.",
    significance: "Es el driver más potente de la síntesis de proteínas musculares (MPS). Se optimiza con cargas de 65–85% del 1RM en rangos de 5–12 repeticiones."
  },
  "tension mecanica": {
    term: "Tensión Mecánica (Estímulo Primario)",
    definition: "Factor principal de la hipertrofia muscular. Ocurre cuando los sarcómeros se exponen a una carga alta bajo máximo reclutamiento de unidades motoras.",
    significance: "Es el driver más potente de la síntesis de proteínas musculares (MPS). Se optimiza con cargas de 65–85% del 1RM en rangos de 5–12 repeticiones."
  },
  mechanical: {
    term: "Tensión Mecánica (Estímulo Primario)",
    definition: "Factor principal de la hipertrofia muscular. Ocurre cuando los sarcómeros se exponen a una carga alta bajo máximo reclutamiento de unidades motoras.",
    significance: "Es el driver más potente de la síntesis de proteínas musculares (MPS). Se optimiza con cargas de 65–85% del 1RM en rangos de 5–12 repeticiones."
  },

  estres_metabolico: {
    term: "Estrés Metabólico (Estímulo Secundario)",
    definition: "Acumulación intramuscular de metabolitos (lactato, Pi, H⁺) que induce hinchazón celular y cascadas de señalización hipertrófica secundarias.",
    significance: "Complementa la tensión mecánica. Se potencia con rangos altos (12–20 reps), series largas con poco descanso y oclusión vascular parcial."
  },
  "estrés metabólico": {
    term: "Estrés Metabólico (Estímulo Secundario)",
    definition: "Acumulación intramuscular de metabolitos (lactato, Pi, H⁺) que induce hinchazón celular y cascadas de señalización hipertrófica secundarias.",
    significance: "Complementa la tensión mecánica. Se potencia con rangos altos (12–20 reps), series largas con poco descanso y oclusión vascular parcial."
  },
  "estres metabolico": {
    term: "Estrés Metabólico (Estímulo Secundario)",
    definition: "Acumulación intramuscular de metabolitos (lactato, Pi, H⁺) que induce hinchazón celular y cascadas de señalización hipertrófica secundarias.",
    significance: "Complementa la tensión mecánica. Se potencia con rangos altos (12–20 reps), series largas con poco descanso y oclusión vascular parcial."
  },
  "tensión metabólica": {
    term: "Estrés Metabólico (Estímulo Secundario)",
    definition: "Acumulación intramuscular de metabolitos (lactato, Pi, H⁺) que induce hinchazón celular y cascadas de señalización hipertrófica secundarias.",
    significance: "Complementa la tensión mecánica. Se potencia con rangos altos (12–20 reps), series largas con poco descanso y oclusión vascular parcial."
  },
  metabolic: {
    term: "Estrés Metabólico (Estímulo Secundario)",
    definition: "Acumulación intramuscular de metabolitos (lactato, Pi, H⁺) que induce hinchazón celular y cascadas de señalización hipertrófica secundarias.",
    significance: "Complementa la tensión mecánica. Se potencia con rangos altos (12–20 reps), series largas con poco descanso y oclusión vascular parcial."
  },

  carga_estiramiento: {
    term: "Hipertrofia Mediada por Estiramiento",
    definition: "Tensión mecánica máxima aplicada cuando las fibras musculares se encuentran en su mayor longitud sarcomérica elongada.",
    significance: "Evidencia emergente indica que la carga en estiramiento produce hipertrofia de sarcómeros en serie, aumentando la longitud del fascículo y la fuerza pico."
  },
  "tensión carga de estiramiento": {
    term: "Hipertrofia Mediada por Estiramiento",
    definition: "Tensión mecánica máxima aplicada cuando las fibras musculares se encuentran en su mayor longitud sarcomérica elongada.",
    significance: "Evidencia emergente indica que la carga en estiramiento produce hipertrofia de sarcómeros en serie, aumentando la longitud del fascículo y la fuerza pico."
  },
  estiramiento: {
    term: "Hipertrofia Mediada por Estiramiento",
    definition: "Tensión mecánica máxima aplicada cuando las fibras musculares se encuentran en su mayor longitud sarcomérica elongada.",
    significance: "Evidencia emergente indica que la carga en estiramiento produce hipertrofia de sarcómeros en serie, aumentando la longitud del fascículo y la fuerza pico."
  },
  "stretch-loaded": {
    term: "Hipertrofia Mediada por Estiramiento",
    definition: "Tensión mecánica máxima aplicada cuando las fibras musculares se encuentran en su mayor longitud sarcomérica elongada.",
    significance: "Evidencia emergente indica que la carga en estiramiento produce hipertrofia de sarcómeros en serie, aumentando la longitud del fascículo y la fuerza pico."
  },
  "carga de estiramiento": {
    term: "Hipertrofia Mediada por Estiramiento",
    definition: "Tensión mecánica máxima aplicada cuando las fibras musculares se encuentran en su mayor longitud sarcomérica elongada.",
    significance: "Evidencia emergente indica que la carga en estiramiento produce hipertrofia de sarcómeros en serie, aumentando la longitud del fascículo y la fuerza pico."
  },

  // ── Panel de Control de Telemetría — Definiciones de campos editables ─────────

  porcentaje_grasa_panel: {
    term: "Porcentaje de Grasa (%)",
    definition: "Masa adiposa relativa al peso total. Indispensable para calcular la Masa Libre de Grasa (FFM) y la Tasa Metabólica Basal mediante la fórmula de Cunningham.",
    significance: "Variaciones del ±1% alteran el cálculo de FFM y, en consecuencia, las metas calóricas y de macronutrientes de forma significativa."
  },

  edad_panel: {
    term: "Edad Cronológica (Años)",
    definition: "Ajusta la tasa metabólica basal y la curva de sensibilidad a la señalización androgénica y recuperación del SNC.",
    significance: "A mayor edad, mayor es la tasa de pérdida de masa muscular (sarcopenia) y menor la capacidad de recuperación neuromuscular entre sesiones."
  },

  peso_crudo_panel: {
    term: "Registro de Peso Crudo (kg)",
    definition: "Masa corporal matutina en ayunas y post-micción. Utilizado para calcular medias móviles y filtrar fluctuaciones por retención hídrica.",
    significance: "El algoritmo EMA de suavizado (ventana de 20 entradas) elimina el ruido de la retención de agua para revelar la tendencia real de cambio de masa corporal."
  },

  deficit_calorico_panel: {
    term: "Déficit Calórico Semanal Objetivo",
    definition: "Balance energético negativo acumulado para la oxidación grasa sin comprometer la masa muscular ni suprimir el eje tiroideo.",
    significance: "Un déficit excesivo (>700 kcal/día) activa la proteólisis muscular y suprime la secreción pulsátil de LH. El rango óptimo es 300–500 kcal/día."
  },

  gasto_actividad_panel: {
    term: "Gasto por Actividad Física (EA)",
    definition: "Calorías quemadas en el entrenamiento (EAT) y actividad diaria no relacionada al ejercicio (NEAT).",
    significance: "Este valor es el denominador que determina la Disponibilidad Energética (EA). Subestimarlo provoca un falso superávit que puede enmascarar un estado real de LEA crónica."
  },

  citrulina_dosis_panel: {
    term: "Dosis de L-Citrulina (g)",
    definition: "Precursor de L-Arginina que optimiza la síntesis de Óxido Nítrico (NO) endotelial, aumentando el flujo sanguíneo y la hiperemia.",
    significance: "La dosis eficaz clínicamente validada oscila entre 6 g y 8 g administrados 30–45 minutos antes del entrenamiento. Dosis inferiores a 4 g producen efecto subóptimo."
  },

  timing_suplementos_panel: {
    term: "Timing Pre-Entreno / Noche (min)",
    definition: "Ventana temporal estratégica previa al esfuerzo o al descanso para asegurar la máxima concentración en plasma del compuesto.",
    significance: "La farmacocinética de la citrulina exige 30–45 min de antelación para alcanzar el pico de NO plasmático coincidiendo con el inicio del esfuerzo máximo."
  },

  readiness_snc_panel: {
    term: "Estado de Recuperación del SNC (%)",
    definition: "Indicador de la capacidad del Sistema Nervioso Central para reclutar unidades motoras de alto umbral sin desencadenar neurofatiga.",
    significance: "Por debajo del 70%, el sistema activa el cierre de volumen AMPK/mTORC1 y limita el máximo de series por ejercicio para prevenir el sobreentrenamiento central."
  },

  semana_mesociclo_panel: {
    term: "Semana del Mesociclo Activo",
    definition: "Etapa de la periodización (MEV, MAV, MRV o Descarga) que determina el volumen estricto de series semanales.",
    significance: "La progresión correcta de MEV→MAV→MRV en 4 semanas, seguida de descarga, es el mecanismo central de supercompensación y adaptación hipertrófica a largo plazo."
  }
};

// ── Portal Tooltip Engine ─────────────────────────────────────────────────────
// Uses ReactDOM.createPortal to escape overflow:hidden stacking contexts.
// Positions the tooltip using getBoundingClientRect() for pixel-perfect viewport alignment.

interface TooltipPortalProps {
  data: { term: string; definition: string; significance: string };
  anchorEl: HTMLButtonElement | null;
  position: "top" | "bottom";
  onClose: () => void;
}

function TooltipPortal({ data, anchorEl, position, onClose }: TooltipPortalProps) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const computeCoords = useCallback(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const vpW = window.innerWidth;

    const popupWidth = Math.min(320, vpW - 24);
    const calculatedLeft = rect.left + scrollX + rect.width / 2 - popupWidth / 2;
    const clampedLeft = Math.max(12 + scrollX, Math.min(calculatedLeft, scrollX + vpW - popupWidth - 12));

    // Vertical: choose side based on requested prop, BUT override to bottom if trigger
    // is within the top 240px of the viewport (e.g. AxisStatusBar, EA header row)
    const forceBottom = rect.top < 240;

    let top: number;
    if (position === "bottom" || forceBottom) {
      top = rect.bottom + scrollY + 8;
    } else {
      const ttH = tooltipRef.current?.offsetHeight ?? 140;
      top = rect.top + scrollY - ttH - 8;
    }

    // Hard clamp: never let the card render above 16px from top of the document
    top = Math.max(scrollY + 16, top);

    setCoords({ top, left: clampedLeft });
  }, [anchorEl, position]);

  useEffect(() => {
    computeCoords();
    window.addEventListener("scroll", computeCoords, true);
    window.addEventListener("resize", computeCoords);
    return () => {
      window.removeEventListener("scroll", computeCoords, true);
      window.removeEventListener("resize", computeCoords);
    };
  }, [computeCoords]);

  // Re-compute once the tooltip renders (needed for top-placement height measurement)
  useEffect(() => {
    if (position === "top") computeCoords();
  }, [computeCoords, position]);

  // Click-outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
        anchorEl && !anchorEl.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [anchorEl, onClose]);

  return ReactDOM.createPortal(
    <div
      ref={tooltipRef}
      style={{
        position: "absolute",
        top: coords.top,
        left: coords.left,
        zIndex: 9999,
      }}
      className="bg-[#0F1322] border border-[#1E293B] rounded-xl p-3 shadow-2xl text-left max-h-[80vh] overflow-y-auto max-w-[calc(100vw-24px)] w-80 z-[9999]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-1.5 border-b border-[#1E293B] pb-1">
        <span className="font-mono text-xs font-bold text-[#00F0FF] uppercase tracking-wider">
          {data.term}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
        >
          <X size={10} />
        </button>
      </div>
      <span className="block text-xs leading-relaxed text-slate-200 mb-1.5 font-sans font-normal normal-case">
        {data.definition}
      </span>
      <span className="block text-xs leading-relaxed text-slate-400 italic border-l-2 border-[#A855F7] pl-1.5 font-sans font-normal normal-case">
        Relevancia: {data.significance}
      </span>
    </div>,
    document.body
  );
}

// ── Public GlossaryTooltip Component ─────────────────────────────────────────
// INSTANCE ISOLATION FIX: Every rendered tooltip gets a guaranteed-unique
// instanceId via React.useId(). The activeGlossaryId in context is compared
// against this unique ID, NOT the shared term string. This prevents the
// multi-popup stacking bug where all "MRV"/"MEV"/"Cortisol" tooltips opened
// simultaneously when clicking any single instance.
//
// Dictionary lookup still uses the clean term string — the two concerns are
// fully decoupled: identity (instanceId) vs. content (searchKey).

interface GlossaryTooltipProps {
  term: keyof typeof GLOSSARY_TERMS | string;
  position?: "top" | "bottom";
  /** Optional explicit scope key — pass e.g. `muscle-${g.id}-mrv` in mapped lists.
   *  Falls back to the auto-generated React useId() instance id. */
  instanceId?: string;
}

export function GlossaryTooltip({ term, position = "top", instanceId }: GlossaryTooltipProps) {
  const { activeGlossaryId, setActiveGlossaryId } = useClinicalEngine();
  const btnRef = useRef<HTMLButtonElement>(null);
  // React 18 useId() — stable per component instance, unique across the tree
  const reactId = useId();

  // Content lookup — still keyed by the clean term string (shared across instances)
  const searchKey = String(term || "").toLowerCase().trim();
  const data = GLOSSARY_TERMS[searchKey];

  // Instance identity — unique per rendered component, never shared
  const uniqueInstanceId = instanceId ?? `${searchKey}-${reactId}`;

  if (!data) return null;

  // Visibility check uses the UNIQUE instance id, not the shared term string
  const isOpen = activeGlossaryId === uniqueInstanceId;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveGlossaryId(activeGlossaryId === uniqueInstanceId ? null : uniqueInstanceId);
  };

  const handleClose = () => setActiveGlossaryId(null);

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className="flex items-center justify-center size-3.5 rounded-full bg-slate-800 hover:bg-[#00F0FF]/25 border border-slate-700 hover:border-[#00F0FF] text-xs text-slate-400 hover:text-[#00F0FF] transition-all cursor-pointer font-bold select-none focus:outline-none"
        title={`Definición de ${term}`}
      >
        ℹ️
      </button>

      {isOpen && (
        <TooltipPortal
          data={data}
          anchorEl={btnRef.current}
          position={position}
          onClose={handleClose}
        />
      )}
    </span>
  );
}
