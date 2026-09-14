---
id: laboratorio-guardia-sigilo-evidencia-pruebas
titulo: Evidencia de pruebas del guardia (H4)
tipo: proceso
estado: completado
audiencia: estudiante
acceso: publico
version: 1
---

# Evidencia de pruebas: máquina de estados del guardia (H4)

- Fecha: 14 de septiembre de 2026.
- Criterio validado: `CR-01` a `CR-10` de `docs/especificacion.md` y conducta esperada de `GDD.md`.
- Versión evaluada: rama `main`, commit `ee1b41b` (árbol de trabajo limpio). El commit final
  evaluable lo define la persona en la entrega.
- Entorno: Windows, Node.js 22 (PowerShell bloquea `npm.ps1`; se usa `npm.cmd`), Phaser 3.90.0,
  Vite 6.4.3, Vitest 4.1.10, TypeScript 5.9.3.

## Validación automatizada completa

Comando: `npm.cmd run validate` (`typecheck` → `test:run` → `build`).

Resultado: **aprobado**.

- `npm.cmd run typecheck`: sin errores de tipos.
- `npm.cmd run test:run`: 70 pruebas aprobadas en 8 archivos.
- `npm.cmd run build`: 22 módulos compilados en `dist/`; advertencia de tamaño de chunk de
  Phaser (≈1,5 MB) conocida y aceptada para el laboratorio.

## Cobertura por criterio

| Criterio | Método | Comando o pasos | Resultado |
|---|---|---|---|
| CR-01 Telemetría por transición | automatizado | `tests/behavior/fsm.test.ts` (evento exactamente cuando cambia el estado; `recordTransition` en `guardSimulation.test.ts`) | aprobado |
| CR-02 Patrullar | automatizado | `tests/behavior/fsm.test.ts` (quietud sin percepción) + `tests/application/guardSimulation.test.ts` (ciclo 27,17→28,5→5,2→6,17→27,17; punto bloqueado → alternativo) | aprobado |
| CR-03 Investigar | automatizado | `tests/application/guardSimulation.test.ts` (destino = última posición conocida por sonido; LKP inaccesible → RETURN) | aprobado |
| CR-04 Perseguir | automatizado | `tests/application/guardSimulation.test.ts` (captura a distancia límite; replanificación sólo por cambio relevante o intervalo de 500 ms) | aprobado |
| CR-05 Buscar | automatizado | `tests/application/guardSimulation.test.ts` (reloj simulado de 100 ms/paso; vencimiento a 3000 ms y recuperación de visión) | aprobado |
| CR-06 Regresar | automatizado | `tests/behavior/fsm.test.ts` + `tests/application/guardSimulation.test.ts` (regreso a punto válido → PATROL) | aprobado |
| CR-07 Captura terminal | automatizado + manual | `tests/application/guardSimulation.test.ts`; en escena: secuencia manual C | aprobado |
| CR-08 Camino principal | automatizado + manual | `tests/application/guardSimulation.test.ts` ("full journey (CR-08)"); secuencia manual A | aprobado |
| CR-09 Caso límite | automatizado + manual | `tests/application/guardSimulation.test.ts` (pérdida de visión con ruta activa → destino = LKP, replan desde posición actual); secuencia manual B | aprobado |
| CR-10 Invariantes | automatizado | `tests/behavior/fsm.test.ts` (determinismo; evento ssi hay cambio; CAPTURED no navega) + restricciones de dominio verificadas por `typecheck` | aprobado |

## Secuencia manual A — camino principal en escena (CR-08)

Precondición: `npm.cmd run dev` o `npm.cmd run build` + Vite preview, sin red.

1. `R` reinicia el escenario. Jugador en (2,2); guardia en (27,17) mirando hacia la izquierda.
2. Desplazar el jugador por el pasillo hasta quedar dentro del cono frontal del guardia
   (distancia al centro < 220 px y dentro del ángulo de visión). Observar en el HUD
   `estado CHASE`, evento/`vision`, memoria `vision` y la ruta de persecución dibujada.
3. Retroceder hasta el borde del cono y ocultarse detrás de una pared. Observar
   `estado SEARCH`, evento `lost-sight`; el marcador rojo fija la última posición vista.
4. Permanecer oculto durante más de 3 s. Observar `estado RETURN`, evento `search-expired`.
5. Esperar hasta alcanzar un punto de patrulla válido. Observar `estado PATROL`, evento
   `arrival`.

Verificar que cada transición se muestra en el HUD con estado anterior, evento y causa.

## Secuencia manual B — caso límite: pérdida de visión en persecución (CR-09)

1. `R`, luego provocar `CHASE` acercándose al cono del guardia (igual que el paso 2 de la
   secuencia A).
2. Con la ruta de persecución activa, girar y ocultarse detrás de una pared cercana para que
   el guardia deje de ver al jugador.
3. Verificar que el guardia abandona la dirección de la posición viva y navega al marcador
   rojo (última posición vista): `estado SEARCH`, evento `lost-sight`.
4. Confirmar en el HUD que la memoria corresponde a `vision` (no a la posición actual del
   jugador). El test automatizado fija con reloj simulado el destino exacto = última posición
   vista y la re-planificación desde la posición actual.

## Secuencia manual C — captura terminal (CR-07)

1. `R`; acercar el jugador hasta que el guardia lo vea y quede a distancia centro-centro
   ≤ 20 px.
2. Verificar `estado CAPTURED / CAPTURADO` en el HUD, sin ruta dibujada y sin que el guardia
   se desplace después.
3. `R` para reiniciar y volver al estado inicial reproducible (fuerza de la grabación
   `RF-09`).

## Servicio y coexistencia

- `npm.cmd run typecheck` — tipos estrictos sin errores.
- `npm.cmd run test:run` — 70 pruebas en 8 archivos.
- `npm.cmd run build` — 22 módulos en `dist/`.
- Vite preview + solicitud HTTP local — HTTP 200, sin recursos descargados por separado
  (mismo criterio que la validación H3).

## Límites

- No existe automatización de navegador; la interacción visual se verifica por compilación,
  arranque HTTP y las secuencias manuales A, B y C.
- La precisión pixel exacta de las secuencias manuales depende del operador; la replicación
  determinista se respalda en las pruebas automatizadas indicadas para cada criterio.
- La advertencia de tamaño de chunk de Phaser queda registrada como riesgo aceptado.

Una captura o la afirmación del agente no reemplaza un resultado reproducible.