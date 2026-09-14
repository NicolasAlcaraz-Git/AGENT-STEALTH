Resumen de estado para retomar la sesión
Contexto
- Proyecto: Laboratorio "Guardia de Sigilo" (PIAPC 2026). H0–H3 completados; H4 (máquina de estados) es la tarea.
- Stack: Phaser 3.90, Vite 6.4.3, Vitest 4.1.10, TypeScript 5.9 estricto, Node 22.
- Dato operativo: la política de PowerShell bloquea npm.ps1 → usar npm.cmd.
- Baseline verificado: npm.cmd run validate = typecheck OK, 39 pruebas (6 archivos) OK, build OK. La advertencia de chunk de Phaser es conocida.
Estructura actual (lo que existe, sin tocar)
- src/domain/: navigation/{gridGraph,search,pathFollower}.ts, perception/{perception,memory}.ts, model/{grid,vector}.ts. No hay behavior/ ni telemetry/.
- src/application/simulation/: labLevel.ts (mapa GRID 30×20, TILE 32), navigationDemo.ts, perceptionSimulation.ts.
- src/game/scenes/GameScene.ts: navegación manual por clic; en H4 pasa a autónoma (clic se elimina; Q y R se conservan).
- tests/: navigation, perception, model, application (baseline 39).
Decisiones confirmadas por el usuario
1. Incluir CAPTURADO (terminal) en la FSM.
2. Flujo Investigar → Buscar → Regresar (al llegar a la última posición conocida sin visión se busca y luego se regresa).
3. Integrar la FSM en la escena Phaser (jugable + telemetría en pantalla).
4. Git lo maneja el humano: el repo no tiene .git; yo no hago init/commits/push. El usuario crea el repo individual y conserva commit inicial/progresivos/final.
5. Alcance H4 completo (aceptado el riesgo del plazo: entrega 15/9/2026 23:59, hoy 14/9).
6. Los 4 artefactos previos se redactan como borradores para revisión humana antes de implementar.
Constantes y puntos de patrulla acordados
- REPLAN_INTERVAL_MS = 500 (Perseguir)
- SEARCH_DURATION_MS = 3000
- SEARCH_RADIUS_CELLS = 3
- CAPTURE_DISTANCE_PX = 20
- PATROL_POINTS cíclicos: (27,17) → (28,5) → (5,2) → (6,17) → (27,17)
Diseño FSM (propuesta aprobada)
Estados: PATROL, INVESTIGATE, CHASE, SEARCH, RETURN, CAPTURED.
- PATROL → CHASE (visión válida) | → INVESTIGATE (sonido oído, visión inválida); al llegar → siguiente punto cíclico; punto inaccesible → alternativo.
- INVESTIGATE → CHASE (visión) | → SEARCH (llega a LKP) | → RETURN (LKP inaccesible); nueva percepción → re-destino.
- CHASE → CAPTURED (distancia ≤ captura) | → SEARCH (pierde visión, destino=LKP).
- SEARCH → CHASE (recupera visión) | → RETURN (se agota el tiempo). Fases: viaje al LKP + recorrido limitado.
- RETURN → CHASE (visión) | → PATROL (llega a punto válido); punto inaccesible → alternativo.
- CAPTURED: terminal, no navega.
- Reglas: visión > sonido; LKP sólo por percepción válida; decidir sólo sobre lo percibido; recalcular en CHASE sólo si cambia el objetivo o vence el intervalo; telemetría por transición.
Verificación vs. docs/consignasparcial.md
- Cumplido: primera consulta de sólo lectura (el análisis de promptdemuestra.md).
- Pendiente (obligatorio): repo público con commits (acción humana), GDD.md, docs/auditoria-repositorio.md, docs/especificacion.md, docs/plan.md, matriz de permisos completada, docs/registro-intervencion.md, docs/evidencia-pruebas.md, docs/informe-final.md, y entrega en plataforma (URL + hash + herramienta + comandos + declaración sin secretos).
Hecho hasta ahora
1. Análisis read-only y propuesta H4 completa (evidencia, supuestos, tabla de transiciones, hitos H4.1–H4.5, estrategia de pruebas, archivos afectados, condiciones de detención).
2. Cuestionario de diseño respondido.
3. Auditoría de cumplimiento contra la consigna y plan reformulado en 8 fases (aprobado por el usuario).
4. Todos creados y baseline npm run validate verificado (39 pruebas).
5. GDD.md escrito en la raíz — PENDIENTE de revisión/aprobación humana (fue lo último antes de este resumen).
Siguientes pasos (orden)
1. Usuario revisa/aprueba GDD.md.
2. Borradores docs/auditoria-repositorio.md, docs/especificacion.md, docs/plan.md (presentar uno a uno para revisión).
3. Matriz de permisos + docs/registro-intervencion.md.
4. Implementar H4.1 a H4.5 (dominio puro → tests tests/behavior/ → src/application/simulation/guardSimulation.ts + src/domain/telemetry/telemetry.ts → conexión GameScene.ts).
5. docs/evidencia-pruebas.md + npm.cmd run validate final.
6. docs/informe-final.md; commits y entrega los hace el humano.
Restricciones vigentes
Dominio sin Phaser/DOM; percepción/memoria/decisión/búsqueda/locomoción separadas; sin dependencias nuevas, red, secretos ni publicar; no escribir artefactos finales antes de revisión (según decisión 6); el control de versiones es exclusivo del humano.
