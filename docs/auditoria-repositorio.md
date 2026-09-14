---
id: laboratorio-guardia-sigilo-auditoria
titulo: Auditoría del repositorio
tipo: proceso
estado: borrador
audiencia: estudiante
acceso: publico
version: 1
---

# Auditoría del repositorio

Estado: **BORRADOR para revisión humana** (hito Exploración de `docs/consignasparcial.md`).
Baseline verificado el 14/9/2026 con `npm.cmd run validate`: tipos OK, 39 pruebas en 6 archivos OK, build OK.

## Hechos comprobados

### Rutas y símbolos del dominio

| Ruta | Símbolos | Responsabilidad |
|---|---|---|
| `src/domain/model/grid.ts` | `GridPoint`, `GridMap`, `cellKey`, `createGridMap`, `isInside`, `isWalkable`, `cellCenter`, `worldToCell` | Cuadrícula lógica: mapa, celdas bloqueadas, conversión celda↔mundo |
| `src/domain/model/vector.ts` | `Vector2`, `distanceBetween`, `normalized`, `assertFiniteVector` | Geometría simple y validación de valores finitos |
| `src/domain/navigation/gridGraph.ts` | `walkableNeighbors` (4 vecinos cardinales), `manhattanDistance` | Grafo implícito de la cuadrícula |
| `src/domain/navigation/search.ts` | `SearchAlgorithm` (`bfs`\|`astar`), `SearchStatus` (`success`\|`unreachable`\|`invalid-start`\|`invalid-goal`), `SearchResult`, `findPathBfs`, `findPathAStar` | Búsqueda: BFS referencia + A* con métricas (`totalCost`, `expandedNodes`, `maximumFrontier`, `explored`) |
| `src/domain/navigation/pathFollower.ts` | `PathFollowerResult`, `advanceAlongPath` | Locomoción: avanzar por puntos de paso sin depender del cuadro |
| `src/domain/perception/perception.ts` | `VisionReason`, `VisionQuery`, `VisionResult`, `SoundEvent`, `SoundResult`, `evaluateVision`, `evaluateSound` | Sensores: visión con cono, rango y oclusión; sonido con radio y vigencia |
| `src/domain/perception/memory.ts` | `PerceptionSource`, `PerceptionObservation`, `PerceptionMemory`, `emptyPerceptionMemory`, `rememberObservation`, `timeSinceLastPerception` | Memoria: última posición conocida, prioridad visión, vencimiento por tiempo |

### Rutas y símbolos de aplicación

| Ruta | Símbolos | Responsabilidad |
|---|---|---|
| `src/application/simulation/labLevel.ts` | `TILE_SIZE=32`, `GRID_WIDTH=30`, `GRID_HEIGHT=20`, `PLAYER_START=(2,2)`, `GUARD_START=(27,17)`, `BLOCKED_AREAS`, `LAB_MAP` | Definición del nivel |
| `src/application/simulation/navigationDemo.ts` | `calculateRoute(map,start,goal,algorithm)` | Selección de algoritmo para navegación |
| `src/application/simulation/perceptionSimulation.ts` | `PerceptionSimulationState`, `PerceptionFrame`, `updatePerceptionSimulation`, `withSoundEvent`, `initialPerceptionState` | Coordina sensores y memoria; conserva evento sonoro vigente |

### Rutas y símbolos de presentación

| Ruta | Símbolos | Responsabilidad |
|---|---|---|
| `src/main.ts` | `new Phaser.Game(gameConfig)` | Arranque |
| `src/game/config.ts` | `gameConfig` | Configuración Phaser, escena `GameScene`, física arcade |
| `src/game/scenes/GameScene.ts` | `GameScene`, constantes `PLAYER_SPEED=190`, `GUARD_SPEED=115`, `VISION_RANGE=220`, `FIELD_OF_VIEW=PI/2`, `SOUND_RADIUS=190`, `SOUND_DURATION_MS=800` | Escena: entrada, presentación, movimiento y HUD |

### Flujo observado

1. `main.ts` → `GameScene.create()`: dibuja cuadrícula y paredes, crea jugador (física arcade + colisión), guardia, teclas, gráficos de percepción/navegación y HUD.
2. Entrada de usuario en `update()`:
   - WASD/flechas mueven al jugador (`velocity`, colisiones).
   - `R` reinicia la escena.
   - `ESPACIO` alterna algoritmo A*/BFS.
   - `Q` emite un evento sonoro en la posición del jugador.
   - Clic: fija `navigationGoal` (guardia conduce por clic; modo H3).
3. Cada cuadro: `updateGuardMovement` avanza al guardia con `advanceAlongPath` sobre la ruta calculada; `updatePerception` corre `updatePerceptionSimulation` y actualiza cono, radio sonoro, marcador de última posición conocida y HUD.

### Pruebas existentes (baseline)

| Archivo | Casos cubiertos |
|---|---|
| `tests/model/grid.test.ts` | Mapa: celdas caminables, límites, conversión, valores inválidos |
| `tests/navigation/search.test.ts` | BFS/A*: ruta óptima, inicio=destino, extremos inválidos, inaccesible, comparación de métricas |
| `tests/navigation/pathFollower.test.ts` | Avance parcial, consumir varios puntos, realineación, fin, dirección, inválidos |
| `tests/perception/perception.test.ts` | Visión: rango, cono, oclusión (central, esquina exacta, paso cercano); sonido: radio, vigencia, expiración |
| `tests/perception/memory.test.ts` | Prioridad temporal, visión simultánea, copia de posición |
| `tests/application/perceptionSimulation.test.ts` | Prioridad visión/ sonido simultáneos, expiración de evento |

### Comandos documentados

- `npm run dev` — servidor de desarrollo.
- `npm run build` — `tsc --noEmit && vite build`.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run test` / `npm run test:run` — Vitest interactivo / una pasada.
- `npm run validate` — `typecheck && test:run && build` (finaliza sin interacción).
- En PowerShell debe usarse `npm.cmd` (la política bloquea `npm.ps1`).

### Límites de la arquitectura verificados

- El dominio (`src/domain/`) no importa Phaser ni DOM: sus importaciones se restringen a módulos de dominio.
- La capa de aplicación coordina sensores y memoria; `perceptionSimulation` no es una escena.
- La escena traduce entrada/tiempo y sólo presenta resultados; no decide reglas de percepción.
- Sin dependencias agregadas: `phaser` es la única dependencia de runtime.
- Aún no existen `src/domain/behavior/` ni `src/domain/telemetry/` (pendientes de H4).
- La advertencia de tamaño de chunk de Phaser (≈1,5 MB) es conocida y aceptada en el laboratorio.

## Supuestos (requieren confirmación o verificación previa)

- Los puntos de patrulla acordados (27,17) → (28,5) → (5,2) → (6,17) son caminables y mutuamente alcanzables según `LAB_MAP`; se verificará con pruebas al implementar H4.1.
- EL guardia comienza en `GUARD_START=(27,17)`, que coincide con el primer punto de patrulla del ciclo.
- La constante `CAPTURE_DISTANCE_PX=20` usará las coordenadas de mundo (círculos del guardia y del jugador).

## Preguntas abiertas

- Al migrar a modo autónomo (H4), ¿se conserva el clic como herramienta de inspección pedagógica o se elimina por completo? El resumen de estado indica que el clic se elimina y quedan `Q` y `R`.
- ¿La persecución debe verificar la captura por centro del círculo del jugador o por borde de los gráficos? La decisión actual indica distancia euclidiana de centros ≤ 20 px.
- ¿El recorrido de búsqueda (SEARCH) alrededor de la última posición conocida debe priorizar celdas por distancia Manhattan o por algún orden fijo? El GDD fija radio (3 celdas) y duración (3000 ms), no el orden.