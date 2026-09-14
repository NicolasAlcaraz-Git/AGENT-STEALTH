---
id: laboratorio-guardia-sigilo-plan-h4
titulo: Plan de la máquina de estados del guardia
tipo: proceso
estado: borrador
audiencia: estudiante
acceso: publico
version: 1
---

# Plan: máquina de estados del guardia (H4)

Estado: **BORRADOR para revisión humana**. Orden de implementación H4.1–H4.5 con cambios
mínimos, cada uno con archivos previstos, verificación, riesgo y condición de detención.
Se ejecuta después de aprobados `GDD.md`, `docs/auditoria-repositorio.md` y
`docs/especificacion.md`.

## Fase 1 — Dominio: FSM pura

Cambio: definir estados, eventos y una función de transición pura
(`src/domain/behavior/fsm.ts`); telemetría estructurada (`src/domain/telemetry/telemetry.ts`).

| Ítem | Descripción |
|---|---|
| Archivos previstos | Crear `src/domain/behavior/fsm.ts`, `src/domain/telemetry/telemetry.ts` |
| Contratos | Estado anterior + entradas modeladas (visión válida, sonido oído, fin de ruta, captura, vencimiento) → `{ estadoNuevo, transición? }` |
| Verificación | `npm run typecheck`; borrador revisable |
| Riesgo | FSM acoplada a detalles de aplicación |
| Detención | La entrada requerida no es percepción modelada (viola decisión "sólo lo percibido") |

## Fase 2 — Pruebas del dominio

Cambio: cubrir CR-01 a CR-07 y CR-10.

| Ítem | Descripción |
|---|---|
| Archivos previstos | Crear `tests/behavior/fsm.test.ts` |
| Verificación | `npm run test:run` (nuevos casos + baseline 39) |
| Riesgo | Secuencia de eventos errónea en el reloj simulado |
| Detención | Una transición esperada no se reproduce de forma determinista |

## Fase 3 — Aplicación: coordinación guardia

Cambio: `src/application/simulation/guardSimulation.ts` integra percepción + memoria + FSM
+ navegación en una simulación pura (reloj inyectado).

| Ítem | Descripción |
|---|---|
| Archivos previstos | Crear `src/application/simulation/guardSimulation.ts`, `tests/application/guardSimulation.test.ts` |
| Verificación | `npm run test:run`; casos CR-08/CR-09 |
| Riesgo | Duplicación de lógica entre escena y simulación |
| Detención | La simulación necesita tiempo o entrada reales de Phaser para decidir |

## Fase 4 — Presentación: escena autónoma

Cambio: `src/game/scenes/GameScene.ts` usa `guardSimulation`; el guardia decide solo;
se elimina el clic como destino manual (se conservan `Q` y `R`); HUD muestra estado,
evento y causa; indicador de captura.

| Ítem | Descripción |
|---|---|
| Archivos previstos | Modificar `src/game/scenes/GameScene.ts` |
| Verificación | `npm run build`; recorrido manual con secuencias documentadas |
| Riesgo | La escena vuelve a decidir reglas (violación de límite arquitectónico) |
| Detención | La escena requiere lógica de decisión no provista por el dominio |

## Fase 5 — Validación integrada

| Ítem | Descripción |
|---|---|
| Archivos previstos | Crear `docs/evidencia-pruebas.md` |
| Verificación | `npm.cmd run validate` completo (typecheck + tests + build) |
| Riesgo | Regresión en el baseline |
| Detención | Fallo no comprendido o cambio concurrente en conflicto |

## Fase 6 — Revisión y entrega

| Ítem | Descripción |
|---|---|
| Archivos previstos | Crear `docs/registro-intervencion.md`, `docs/informe-final.md` |
| Verificación | Revisión humana de diferencias; commits y entrega los hace la persona |
| Riesgo | Alcance ampliado fuera del plan |
| Detención | Acción de commit/publicación no autorizada (queda en manos del humano) |

## Condiciones de detención generales

- La especificación admite interpretaciones con efectos distintos sin decisión documentada.
- Cambios concurrentes que interfieren con la tarea.
- Una validación falla por causa no comprendida.
- Se requieren credenciales, red, instalación, publicación o pérdida de información.
- Un cambio cruza un límite arquitectónico sin decisión documentada.

## Mapa de trazabilidad

| Criterio | Fase donde se cubre | Archivo principal |
|---|---|---|
| CR-01, CR-02, CR-03, CR-04, CR-05, CR-06, CR-07, CR-10 | Fase 2 | `tests/behavior/fsm.test.ts` |
| CR-08, CR-09 | Fase 3 (+ secuencias manuales Fase 4/5) | `tests/application/guardSimulation.test.ts`, `docs/evidencia-pruebas.md` |