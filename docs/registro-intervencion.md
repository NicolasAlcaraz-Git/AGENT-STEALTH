---
id: laboratorio-guardia-sigilo-registro-intervencion
titulo: Registro de intervención agéntica (H4)
tipo: proceso
estado: completado
audiencia: estudiante
acceso: publico
version: 1
---

# Registro de intervención agéntica

- Fecha: 14 de septiembre de 2026.
- Objetivo y criterio de aceptación: incorporar una máquina de estados autónoma al guardia
  (PATROL, INVESTIGATE, CHASE, SEARCH, RETURN, CAPTURED) con telemetría por transición,
  integrada a percepción, memoria y navegación, y conectada a la escena. Aceptación:
  criterios CR-01 a CR-10 de `docs/especificacion.md` y `npm.cmd run validate` en verde.
- Estado inicial: rama `main`, commit base `c48f184` (repositorio individual desde la
  plantilla). Baseline H1–H3: 39 pruebas en 6 archivos.
- Herramienta y modelo declarados: OpenCode; modelo `opencode/big-pickle` (H3 declaró
  `openai/gpt-5.6-sol`). El registro no incluye razonamientos internos del modelo.

| Orden | Entrada relevante | Acción o herramienta | Resultado observable | Decisión humana |
|---:|---|---|---|---|
| 1 | "Preparar el punto de partida" | Lectura de instrucciones, arquitectura, permisos, scripts y pruebas baseline | Identificada la entrada al comportamiento (percepción → memoria → navegación) y su punto de prueba | Aceptar |
| 2 | "Explorar y planificar" | Lectura/búsqueda del repositorio (rutas, símbolos, flujo, pruebas, comandos) | `docs/auditoria-repositorio.md`: hechos comprobados, supuestos y preguntas abiertas | Aceptar |
| 3 | "Definir antes de editar" | Escritura de `GDD.md`, `docs/especificacion.md` y `docs/plan.md` | GDD y criterios CR-01 a CR-10 aprobados; plan por fases H4.1–H4.5 | Aceptar (borradores revisados y corregidos) |
| 4 | "Usar la herramienta con control humano" | Matriz de permisos de `docs/permisos-recomendados.md` | Lectura/búsqueda habilitadas; edición acotada al alcance; red, instalación, secretos y publicación fuera de alcance | Aceptar |
| 5 | Fase 1 — FSM pura | Edición: crear `src/domain/behavior/fsm.ts`, `src/domain/telemetry/telemetry.ts` | `npm.cmd run typecheck` sin errores; FSM sin Phaser/DOM | Aceptar |
| 6 | Fase 2 — Pruebas del dominio | Edición: crear `tests/behavior/fsm.test.ts` | CR-01…CR-07 y CR-10 aprobados (21 pruebas) | Aceptar |
| 7 | Fase 3 — Coordinación | Edición: crear `src/application/simulation/guardSimulation.ts` y `tests/application/guardSimulation.test.ts` | CR-08/CR-09 aprobados con reloj simulado (10 pruebas) | Aceptar |
| 8 | Fase 4 — Escena autónoma | Edición: `src/game/scenes/GameScene.ts` | Build OK; guardia decide solo; se eliminan el clic como destino y el toggle de algoritmo (ESPACIO) | Aceptar |
| 9 | Correcciones de revisión | Revisión de diferencias | HUD con estado, evento y causa de la última transición, visión, sonido y memoria; LKP marcada | Aceptar |
| 10 | Fase 5 — Validación integrada | `npm.cmd run validate` | Typecheck OK; 70 pruebas en 8 archivos OK; build 22 módulos OK | Aceptar |
| 11 | Evidencia de pruebas | Escritura de `docs/evidencia-pruebas.md` + `npm.cmd run validate` de cierre | CR-01…CR-10 vinculados a comandos y secuencias manuales; validate verde | Aceptar |
| 12 | Fase 6 — Revisión y entrega | Escritura de `docs/registro-intervencion.md` y `docs/informe-final.md` | Trazabilidad y cierre documentados | Aceptar |
| 13 | Commits y entrega en plataforma | Acción del humano | PENDIENTE: commits progresivos/final y carga en la plataforma | Acción humana (fuera del alcance del agente) |

## Decisiones

| Decisión | Motivo | Control humano |
|---|---|---|
| Incluir CAPTURADO (terminal) en la FSM | El guardia debe detenerse al capturar | Prueba de terminalidad y escena sin navegación |
| Flujo Investigar → Buscar → Regresar | Al llegar a la LKP sin visión se busca y luego se regresa | Pruebas de secuencia CR-05/CR-08 |
| Integrar la FSM en la escena | Conducta jugable y telemetría en pantalla | Recorrido manual A–C |
| El clic como destino manual se elimina | El guardia decide su conducta | Extracción definitiva del modo H3 en escena |
| Captura por distancia euclidiana entre centros ≤ 20 px | Simplifica y es verificable | Prueba a distancia límite |
| Búsqueda por celdas Manhattan ≤ 3 en orden estable | Orden determinado y repetible | Test de barrido de celdas |

## Acciones rechazadas

| Acción | Decisión | Motivo |
|---|---|---|
| Instalar o actualizar dependencias | Rechazada | El alcance no requiere dependencias nuevas; se conserva el lockfile |
| Acceder a internet o a la red | Rechazada | Fuera de alcance según la matriz de permisos |
| Leer secretos o datos personales | Rechazada | El laboratorio no los necesita |
| Ampliar el alcance a H5 u otros comportamientos | Rechazada | El alcance aprobado es H4 |
| Modificar configuración de Git / crear commits | Rechazada (acción humana) | El control de versiones lo maneja exclusivamente la persona |

## Cierre

- Archivos creados: `src/domain/behavior/fsm.ts`, `src/domain/telemetry/telemetry.ts`,
  `src/application/simulation/guardSimulation.ts`, `tests/behavior/fsm.test.ts`,
  `tests/application/guardSimulation.test.ts`, `docs/evidencia-pruebas.md`,
  `docs/registro-intervencion.md`, `docs/informe-final.md`.
- Archivos modificados: `src/game/scenes/GameScene.ts`, `README.md`,
  `docs/resumenestado.md`.
- Validaciones: `npm.cmd run validate` (typecheck + 70 pruebas en 8 archivos + build de
  22 módulos) aprobada; advertencia de chunk de Phaser conocida y aceptada.
- Correcciones humanas: eliminación del clic como destino manual; eliminación del toggle de
  algoritmo (ESPACIO); búsqueda en orden estable por distancia Manhattan; captura por
  distancia euclidiana entre centros; CAPTURADO como estado terminal.
- Riesgos pendientes: no hay automatización de navegador; advertencia de tamaño de chunk;
  commits y entrega en plataforma quedan en manos de la persona.
- Estado final: rama `main`, commit evaluado `ee1b41b`; el commit final evaluable lo define
  la persona.

No se registran cadenas de pensamiento privadas, credenciales ni conversaciones irrelevantes.