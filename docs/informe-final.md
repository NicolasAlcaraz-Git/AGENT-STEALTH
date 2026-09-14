---
id: laboratorio-guardia-sigilo-informe-final
titulo: Informe final del desarrollo agéntico (H4)
tipo: proceso
estado: completado
audiencia: estudiante
acceso: publico
version: 1
---

# Informe final — Parcial 1: desarrollo agéntico documentado

## Resultado

El hito H4 del laboratorio está **implementado y validado**:

- Máquina de estados autónoma del guardia con PATROL, INVESTIGATE, CHASE, SEARCH, RETURN y
  CAPTURED (terminal), decidida sólo sobre lo percibido.
- Telemetría por transición (tiempo, estado anterior, evento, estado nuevo, causa) en el
  dominio y visible en el HUD.
- Coordinación de percepción, memoria y navegación en una simulación pura con reloj
  inyectado (`guardSimulation.ts`), testeable sin navegador.
- Escena en modo autónomo: se eliminaron el clic como destino manual y el toggle de
  algoritmo; se conservan `Q` (sonido) y `R` (reinicio).
- Validación: `npm.cmd run validate` aprobado (typecheck sin errores, 70 pruebas en 8
  archivos, build de 22 módulos).

## Decisiones

- CAPTURADO es un estado terminal: el guardia deja de navegar al capturar.
- Flujo Investigar → Buscar → Regresar: al llegar a la última posición conocida sin visión
  se busca (3 s, radio 3 celdas) y luego se regresa a patrulla.
- La captura se verifica por distancia euclidiana entre centros (guardia-jugador) ≤ 20 px.
- La búsqueda enumera celdas a distancia Manhattan ≤ 3 desde la LKP en orden estable.
- La persecución replanifica sólo si cambia el objetivo de forma relevante o vence el
  intervalo de 500 ms.
- La escena no decide reglas de comportamiento: sólo adapta entrada, tiempo y presentación.
- El alcance se limitó a H4 (se rechazó ampliar a H5 u otros comportamientos).

## Controles humanos y permisos

- Herramienta y modelo: OpenCode con modelo `opencode/big-pickle` para H4 (H3 declaró
  `openai/gpt-5.6-sol`).
- La primera consulta al agente fue de sólo lectura; la escritura se habilitó tras aprobar
  GDD, especificación y plan.
- Se aplicó la matriz de `docs/permisos-recomendados.md`: edición acotada al alcance;
  red, instalación, secretos, publicación y cambios de configuración de Git fuera de
  alcance.
- Cada fase se validó con `npm.cmd run typecheck` / `test:run` / `build` antes de avanzar.
- Los commits y la entrega en plataforma son acciones exclusivas de la persona.

## Validaciones

| Comando | Resultado |
|---|---|
| `npm.cmd run typecheck` | Sin errores |
| `npm.cmd run test:run` | 70 pruebas aprobadas en 8 archivos |
| `npm.cmd run build` | 22 módulos compilados en `dist/` |
| `npm.cmd run validate` | Aprobado en su totalidad |
| Vite preview + solicitud HTTP local | HTTP 200, sin recursos descargados por separado |

## Trazabilidad con la consigna

| Hito de la consigna | Artefacto | Estado |
|---|---|---|
| Inicio | URL del repositorio y commit base | Commit `c48f184` conservado |
| GDD | `GDD.md` | Aprobado |
| Exploración | `docs/auditoria-repositorio.md` | Aprobado |
| Especificación | `docs/especificacion.md` | Aprobado |
| Plan | `docs/plan.md` | Aprobado |
| Intervención | `docs/registro-intervencion.md` | Completado |
| Implementación | Código y commits | Cambios pequeños y revisados; commits finales pendientes (humano) |
| Validación | `docs/evidencia-pruebas.md` | Completado |
| Revisión | `docs/informe-final.md` | Completado |

## Límites

- No hay automatización de navegador; la presentación se verifica por compilación, arranque
  HTTP y las secuencias manuales A, B y C de `docs/evidencia-pruebas.md`.
- La advertencia de tamaño de chunk de Phaser (≈1,5 MB) se acepta para el laboratorio y se
  revisará en una integración más amplia si procede.
- La entrega en plataforma (URL, hash del commit final, herramienta/modelo, comandos y
  declaración sin secretos) queda pendiente de la persona.

## Riesgos

- Plazo de entrega 15/9/2026 23:59: el alcance completo de H4 se aceptó con el riesgo de
  quedar ajustado de tiempo; la validación quedó completada el 14/9/2026.
- Sin pruebas end-to-end de navegador, una regresión de presentación podría pasar los
  chequeos automatizados; mitigada por las secuencias manuales documentadas.
- No se declararon secretos ni datos privados; no se instalaron dependencias nuevas; no se
  usó red durante la intervención.

## Acciones humanas pendientes

1. Commits progresivos y commit final evaluable.
2. Entrega en la plataforma con:
   - URL del repositorio: `https://github.com/NicolasAlcaraz-Git/AGENT-STEALTH.git`.
   - Hash del commit final evaluable (el commit base conservado es `c48f184`).
   - Herramienta y modelo: OpenCode, modelo `opencode/big-pickle`.
   - Comandos de validación ejecutados y resultado (`npm.cmd run validate` aprobado:
     typecheck, 70 pruebas en 8 archivos, build de 22 módulos).
   - Declaración de que el repositorio no contiene secretos, credenciales ni datos
     privados.