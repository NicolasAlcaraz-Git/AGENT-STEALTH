Resumen de estado para retomar la sesión

Contexto
- Proyecto: Laboratorio "Guardia de Sigilo" (PIAPC 2026). H0–H3 completados; H4 (máquina de estados) IMPLEMENTADO y validado. Entrega 15/9/2026 23:59 (hoy 14/9).
- Stack: Phaser 3.90, Vite 6.4.3, Vitest 4.1.10, TypeScript 5.9 estricto, Node 22.
- Dato operativo: la política de PowerShell bloquea npm.ps1 → usar npm.cmd.
- Repo: público. Git lo maneja el humano (no hago init/commits/push). Commit evaluado de H4: `ee1b41b` (docs/resumenestado.md ya está commiteado).

Estructura actual (H4 implementado)
- src/domain/: behavior/fsm.ts (NUEVO), telemetry/telemetry.ts (NUEVO), navigation/{gridGraph,search,pathFollower}.ts, perception/{perception,memory}.ts, model/{grid,vector}.ts.
- src/application/simulation/: labLevel.ts (mapa GRID 30×20, TILE 32), navigationDemo.ts, perceptionSimulation.ts, guardSimulation.ts (NUEVO: coordina percepción + FSM + navegación + telemetría).
- src/game/scenes/GameScene.ts: MODO AUTÓNOMO. Se eliminó el clic como destino manual y el toggle de algoritmo (SPACE); se conservan Q (sonido) y R (reinicio). HUD muestra estado, última transición (previo → nuevo + evento), causa, visión, sonido y memoria. Se dibuja la ruta activa y el marcador de última posición conocida.
- tests/: navigation, perception, model, application (baseline 39), behavior/fsm.test.ts (NUEVO, 21), application/guardSimulation.test.ts (NUEVO, 10). Total 70 pruebas en 8 archivos.

Decisiones confirmadas por el usuario
1. Incluir CAPTURADO (terminal) en la FSM.
2. Flujo Investigar → Buscar → Regresar (al llegar a la última posición conocida sin visión se busca y luego se regresa).
3. Integrar la FSM en la escena Phaser (jugable + telemetría en pantalla).
4. Git lo maneja el humano.
5. Alcance H4 completo (aceptado el riesgo del plazo).
6. Los 4 artefactos previos se redactan como borradores para revisión humana antes de implementar.
7. El clic como destino manual se elimina definitivamente.
8. La captura se verifica por distancia euclidiana entre centros (guardia-jugador) ≤ CAPTURE_DISTANCE_PX.
9. La búsqueda usa celdas a distancia Manhattan ≤ SEARCH_RADIUS_CELLS desde la LKP, en orden estable.

Constantes y puntos de patrulla implementados
- REPLAN_INTERVAL_MS = 500 (Perseguir)
- SEARCH_DURATION_MS = 3000
- SEARCH_RADIUS_CELLS = 3
- CAPTURE_DISTANCE_PX = 20
- PATROL_POINTS cíclicos: (27,17) → (28,5) → (5,2) → (6,17) → (27,17)

Diseño FSM implementado
Estados: PATROL, INVESTIGATE, CHASE, SEARCH, RETURN, CAPTURED.
- PATROL → CHASE (visión válida) | → INVESTIGATE (sonido oído, visión inválida); al llegar → siguiente punto cíclico; punto inaccesible → alternativo.
- INVESTIGATE → CHASE (visión) | → SEARCH (llega a LKP) | → RETURN (LKP inaccesible); nueva percepción → re-destino.
- CHASE → CAPTURED (distancia ≤ captura) | → SEARCH (pierde visión, destino=LKP).
- SEARCH → CHASE (recupera visión) | → RETURN (se agota el tiempo). Fases: viaje al LKP + recorrido limitado.
- RETURN → CHASE (visión) | → PATROL (llega a punto válido); punto inaccesible → alternativo.
- CAPTURED: terminal, no navega.
- Reglas: visión > sonido; LKP sólo por percepción válida; decidir sólo sobre lo percibido; recalcular en CHASE sólo si cambia el objetivo o vence el intervalo; telemetría por transición (tiempo, estado previo, evento, estado nuevo, causa).

Artefactos de proceso (Hitos de docs/consignasparcial.md)
- GDD.md: aprobado y commiteado.
- docs/auditoria-repositorio.md, docs/especificacion.md, docs/plan.md: BORRADORES aprobados (heurística de decisión 6 cumplida).
- docs/registro-intervencion.md, docs/evidencia-pruebas.md, docs/informe-final.md: COMPLETADOS el 14/9/2026 en docs/ raíz (verificación: `npm.cmd run validate` de cierre en verde, CR-01 a CR-10 vinculados).
- Matriz de permisos: la referencia docs/permisos-recomendados.md ya existía; el registro de uso efectivo va en docs/registro-intervencion.md.
- Entrega en plataforma: pendiente (URL + hash + herramienta/modelo + comandos + declaración sin secretos), acción del humano.

Validación (verificada)
- npm.cmd run validate = typecheck OK, 70 pruebas (8 archivos) OK, build OK (22 módulos). Advertencia de chunk de Phaser conocida y aceptada.
- Smoke test: vite preview + solicitud HTTP local → HTTP 200 (1231 bytes).
- Caso límite cubierto en tests: pérdida de visión durante persecución con ruta activa → destino = LKP (no la posición viva), replanificación desde la posición actual, sin información futura.

Hecho hasta ahora
1. Guardia autónomo con FSM completa (dominio puro, sin Phaser/DOM).
2. Telemetría por transición en dominio y mostrada en HUD.
3. Coordinación percepción+FSM+navegación en guardSimulation.ts (reloj inyectado, testeable sin navegador).
4. Escena en modo autónomo con ruta, cono de visión, radio sonoro y última posición conocida visibles.
5. 70 pruebas verdes (39 baseline + 21 FSM + 10 simulación) y build OK.

Siguientes pasos (orden)
1. Commits (progresivos/final) y entrega en plataforma: acciones EXCLUSIVAS del humano.

Completado en esta sesión
1. docs/evidencia-pruebas.md: camino principal (CR-08) + caso límite (CR-09) + captura terminal (CR-07), CR-01 a CR-10 vinculados a comandos reproducibles y secuencias manuales A/B/C.
2. docs/registro-intervencion.md: tabla de acciones, resultados y decisiones humanas del proceso H4.
3. docs/informe-final.md: resultado, decisiones, controles humanos, validaciones, límites y riesgos.
4. README.md actualizado (estado H4, controles vigentes Q/R, documentos del proceso, versión 4).
5. `npm.cmd run validate` de cierre en verde: typecheck OK, 70 pruebas (8 archivos) OK, build OK (22 módulos).

Restricciones vigentes
Dominio sin Phaser/DOM; percepción/memoria/decisión/búsqueda/locomoción separadas; sin dependencias nuevas, red, secretos ni publicar; el control de versiones es exclusivo del humano. Límites declarados: no hay pruebas automatizadas de navegador; la interacción visual se verifica por compilación + arranque HTTP + secuencias manuales (mismo criterio que H3).