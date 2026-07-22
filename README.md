# 🌿 Salud Integral Enterprise — Guía Maestra de Usuario & Arquitectura

[![Capacitor Android](https://img.shields.io/badge/Capacitor-6.0-blue.svg)](https://capacitorjs.com/)
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini_3.5_Flash--Lite-AI_Engine-8e44ad.svg)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Salud Integral Enterprise** es una plataforma móvil de alto rendimiento diseñada para la optimización metabólica, la autorregulación biológica y la periodización de entrenamiento de fuerza. Inspirada en la estética minimalista y limpia de **Apple Health**, **Oura Ring** y **Nike Training Club**, la aplicación integra motores fisiológicos avanzados impulsados por Inteligencia Artificial generativa (**Google Gemini 3.5 Flash-Lite**) con preservación estricta de la capa gratuita y respuesta instantánea en cliente.

---

## 📱 1. Visión General de la Aplicación

La aplicación cierra la brecha entre la complejidad científica de la nutrición clínica y la sencillez visual que requiere un atleta o usuario diario en su teléfono móvil.

```
       ┌────────────────────────────────────────────────────────┐
       │             SALUD INTEGRAL ENTERPRISE (UI)            │
       │ (Minimalista, Tarjetas Flotantes, Anillos Concéntricos)│
       └──────────────────────────┬─────────────────────────────┘
                                  │
      ┌───────────────────────────┴───────────────────────────┐
      │          CLINICAL ENGINE CONTEXT (React 18)          │
      │   (Cunningham BMR, RED-S, EMA Weight, SNC Clamp)     │
      └───────────────────────────┬───────────────────────────┘
                                  │
       ┌──────────────────────────┴───────────────────────────┐
       │     ATO ORCHESTRATOR — GEMINI 3.5 FLASH-LITE AI      │
       │   (djb2 Cache Hash + Cooldown Guard 30s + Fallback)  │
       └──────────────────────────────────────────────────────┘
```

### Principios Fundamentales:
* **Aesthetic Superiority**: Interfaz visual ultra-limpia basada en tarjetas blancas flotantes (`bg-white rounded-3xl border border-slate-100 shadow-xl`), tipografía sans-serif moderna y micro-animaciones físicas.
* **Inteligencia Artificial Proactiva**: El motor **ATO (Adaptive Telemetry Orchestrator)** analiza de manera continua la homeostasis del atleta y emite recomendaciones personalizadas en lenguaje natural.
* **Precisión Biológica Integrada**: Algoritmos termodinámicos de tasa metabólica basal basados en Masa Libre de Grasa (**FFM**), alertas automáticas por **RED-S** (Relative Energy Deficiency in Sport) e interceptores de fatiga del Sistema Nervioso Central (**SNC**).

---

## 🧭 2. Manual Detallado de Módulos y Herramientas

### 🏠 2.1 Tablero Principal (Dashboard & Coach IA)
El **Tablero Principal** es la vista de control central del usuario.

* **🤖 Coach IA (Gemini 3.5 Flash-Lite):** Tarjeta destacada superior que muestra el estado de sincronización con la IA. Muestra resúmenes ejecutivos simples como: *"Tu plan nutricional y volumetría están sincronizados con tu tasa metabólica actual."* Incluye el botón táctil `[Recalibrar IA / Optimizar Con IA]`.
* **⭕ Anillos de Homeostasis:** Tres anillos concéntricos dinámicos (Proteína/Verde Esmeralda `#10B981`, Carbohidratos/Coral `#FF5E7E`, Grasas/Ámbar `#F59E0B`) que reflejan visualmente el avance del día frente al presupuesto energético objetivo.
* **📊 Telemetría y Laboratorio Avanzado (Acordeón Desplegable):** Para mantener la interfaz limpia y accesible para usuarios cotidianos, los gráficos crudos de tendencia de peso (**EMA**), histogramas de laboratorio y parámetros hormonales avanzados se encuentran dentro del acordeón desplegable *"📊 Mi Telemetría y Laboratorio Avanzado"*.

---

### 🥗 2.2 Módulo de Nutrición Metabólica ("Mi Plan de Nutrición")
Diseñado para la gestión metabólica diaria sin fricción.

* **🔥 Cálculo de TMB (Ecuación de Cunningham & Mifflin-St Jeor):**
  $$\text{BMR (Cunningham)} = 500 + 22 \times \text{FFM (kg)}$$
  Calcula las necesidades calóricas exactas basándose en la masa magra libre de grasa en lugar del peso bruto.
* **🍞 Ciclado Dinámico de Carbohidratos:** Ajusta automáticamente la cuota de carbohidratos según la exigencia energética de la rutina programada para el día (Días de empuje/pierna vs. Días de descanso).
* **📸 Fotografía de Alimentos & Registro:** Tarjetas visuales acompañadas de imágenes en alta resolución (Unsplash) para Desayuno, Almuerzo, Post-Entrenamiento y Cena, con barras indicadoras de macronutrientes en tiempo real.

---

### 🏋️ 2.3 Módulo de Entrenamiento & Periodización ("Tu Rutina de Hoy")
Administra las rutinas de hipertrofia y fuerza ajustando el volumen muscular óptimo.

* **📈 Volumetría Científica:**
  * **MEV** (*Minimum Effective Volume*): Volumen mínimo para desencadenar síntesis proteica.
  * **MAV** (*Maximum Adaptive Volume*): Rango donde ocurre la máxima ganancia muscular.
  * **MRV** (*Maximum Recoverable Volume*): Límite máximo de series antes del sobreentrenamiento.
  * **DELOAD**: Semana de descarga estratégica para restaurar receptores neuromusculares.
* **📝 Registro Táctil de Rutinas:** Control intuitivo de repeticiones objetivo, intensidad prescrita en **RIR** (*Reps in Reserve*), campos para modificar la carga en kilogramos y botones circulares de verificación de series completadas con animaciones visuales de recompensa.
* **🛡️ Interceptor de Fatiga del SNC:** Si la recuperación neuromuscular cae por debajo del 70%, el sistema activa automáticamente un cierre de seguridad (*SNC Clamp*), limitando el volumen a un máximo de 3 series por ejercicio para salvaguardar la fibra muscular.

---

### 💊 2.4 Dispensario de Suplementación & Cronómetro Circadiano ("Mis Suplementos Diarios")
Organización y control temporal de suplementos basados en evidencia clínica Clase A.

* **💊 Matriz de Suplementación:** Gestión de Creatina Monohidratada (5g), Malato de L-Citrulina (8g), Ashwagandha KSM-66 (600mg), Proteína de Suero (Whey), Magnesio y Melatonina.
* **⏱️ Cronómetro de Dosis Circadiano:** Clasifica los suplementos en ventanas ideales (Ayuno matutino, Pre-Entrenamiento, Ventana Anabólica Post-Entreno y Noche).
* **🧠 Bloqueo Circadiano de Cafeína:** Si la hora local supera las 14:00 hrs, el dispensario bloquea automáticamente las dosis de cafeína para no comprometer la arquitectura del sueño profundo.

---

### 🩸 2.5 Salud Hormonal & Laboratorio ("Análisis Hormonal y Laboratorio")
Panel biométrico de seguridad para el monitoreo del eje Hipotalámico-Pituitario-Gonadal (**HPG**).

* **🔬 Indicadores Clínicos:** Permite editar y monitorear valores de laboratorio en tiempo real:
  * **LH & FSH**: Gonadotropinas pituitarias.
  * **Testosterona Total & Libre**: Marcadores anabólicos primarios.
  * **SHBG**: Globulina fijadora de hormonas sexuales.
  * **Cortisol Matutino**: Indicador de sobreestrés sistémico y catabolismo.
* **⚠️ Alertas de Supresión RED-S:** Activa una advertencia visual inmediata si la disponibilidad energética cae por debajo del umbral crítico de $30 \text{ kcal/kg FFM/día}$.

---

### 🎛️ 2.6 Panel de Control de Telemetría (Drawer de Configuración)
Accesible desde el botón `[Ajustes]` del encabezado. Ofrece un glosario interactivo `ℹ️` con explicaciones detalladas para sus 9 variables principales:

1. **Porcentaje de Grasa Corporal (%)**: Utilizado para determinar la Masa Libre de Grasa (FFM) y la Tasa Metabólica Basal.
2. **Edad Cronológica**: Ajusta los coeficientes de declive hormonal metabólico.
3. **Registro de Peso Crudo (Algoritmo EMA)**: Utiliza una Media Móvil Exponencial (*Exponential Moving Average*) para filtrar fluctuaciones por retención de agua.
4. **Déficit / Superávit Calórico Semanal**: Define la velocidad de pérdida de grasa o ganancia muscular.
5. **Disponibilidad Energética (EA)**: Energía disponible para procesos fisiológicos tras descontar el gasto por ejercicio.
6. **Dosis de L-Citrulina (g)**: Ajusta los niveles de síntesis de Óxido Nítrico y vasodilatación.
7. **Timing de Suplementación**: Sincroniza la ingesta de ergogénicos con el reloj biológico.
8. **Recuperación / Readiness del SNC (%)**: Regula los límites de volumen de series en el entrenamiento.
9. **Semana del Mesociclo Activo**: Controla la progresión de carga (Semana 1 MEV a Semana 5 Deload).

---

## ⚙️ 3. Arquitectura Técnica & Seguridad de Cuota API

La aplicación implementa un orquestador inteligente cliente-servidor (`src/services/atoOrchestrator.ts`) diseñado para ofrecer respuestas instantáneas mientras protege estrictamente la cuota gratuita de **Google Gemini API (15 Solicitudes por Minuto / 1,500 por Día)**.

```
                  [Usuario / Cambio de Telemetría]
                                 │
                                 ▼
                     [Generar Hash H(Input)]
                                 │
                   ┌─────────────┴─────────────┐
                   │  ¿Existe en localStorage? │
                   └─────────────┬─────────────┘
                          Sí     │     No
             ┌───────────────────┴───────────────────┐
             ▼                                       ▼
  [Devolver Caché Local]                ¿Enfriamiento Activo (< 30s)?
   (0 llamadas a API)                                │
                                           Sí        │        No
                                    ┌────────────────┴────────────────┐
                                    ▼                                 ▼
                            [Ejecutar Fallback]               [Call Gemini 3.5 API]
                             (Reglas Locales)               (Estampar Timer 30s)
```

### Pilares de Resiliencia:
1. **Sistema de Hashing Determinista (djb2)**: Calcula una firma única para los datos biométricos. Si el usuario navega o refresca la app sin modificar parámetros, la respuesta se lee directamente desde `localStorage` sin tocar la red (**0 consumo de API**).
2. **Guardia de Enfriamiento (*Cooldown Guard*)**: Impone un intervalo mínimo obligatorio de **30 segundos** entre llamadas a la API de Gemini. Si se solicita un nuevo diagnóstico dentro del periodo de enfriamiento, el sistema responde instantáneamente utilizando el motor heurístico local.
3. **Motor Heurístico de Respaldo (*Fallback Engine*)**: En caso de ausencia de clave de API (`VITE_GEMINI_API_KEY`), falta de conexión a Internet o respuesta HTTP 429 (*Too Many Requests*), el orquestador activa un motor de reglas médicas local que calcula los parches de nutrición y entrenamiento sin interrumpir la experiencia de usuario.

---

## 📦 4. Guía de Compilación y Generación de APK Móvil

### Prerrequisitos
* Node.js v18+ y npm / pnpm
* Android Studio con Android SDK Build-Tools v34+
* Java OpenJDK 17

### 🛠️ Pasos de Compilación

1. **Clonar el repositorio e instalar dependencias:**
   ```bash
   git clone https://github.com/MarcosG513/Salud-Integral-Enterprise.git
   cd Salud-Integral-Enterprise
   npm install
   ```

2. **Compilar el paquete Web de producción (Vite):**
   ```bash
   npm run build
   ```

3. **Sincronizar los activos con la plataforma nativa Android (Capacitor):**
   ```bash
   npx cap sync android
   ```

4. **Compilar el instalador nativo APK (Gradle):**
   * **Windows (PowerShell / CMD):**
     ```powershell
     cd android
     .\gradlew assembleDebug
     ```
   * **Mac / Linux:**
     ```bash
     cd android && ./gradlew assembleDebug
     ```

### 📍 Ubicación del APK Generado:
```text
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia [MIT](LICENSE). Desarrollado para optimización de salud humana y rendimiento deportivo de precisión.