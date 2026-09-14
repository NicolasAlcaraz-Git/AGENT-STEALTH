---
id: laboratorio-guardia-sigilo-especificacion-h4
titulo: Especificación de la máquina de estados del guardia
tipo: proceso
estado: borrador
audiencia: estudiante
acceso: publico
version: 1
---

# Especificación: máquina de estados del guardia (H4)

Estado: **BORRADOR para revisión humana**. Complementa `GDD.md`. Alcance: sólo el
comportamiento autónomo del guardia (H4.1–H4.5). Fuera de alcance: arte, audio, combate,
H5.

## Alcance

- Introducir una FSM en el dominio (`src/domain/behavior/`) con estados PATROL,
  INVESTIGATE, CHASE, SEARCH, RETURN, CAPTURED.
- Introducir telemetría estructurada por transición (`src/domain/telemetry/`).
- Coordinar la FSM con percepción, memoria y navegación en aplicación
  (`src/application/simulation/guardSimulation.ts`).
- Conectar la FSM a la escena: el guardia decide solo; se elimina el clic como destino
  manual de navegación; se conservan `Q` (sonido) y `R` (reinicio) y la telemetría en HUD.
- Constantes: patrulla cíclica (27,17) → (28,5) → (5,2) → (6,17) → (27,17);
  `REPLAN_INTERVAL_MS=500` (Perseguir); `SEARCH_DURATION_MS=3000`;
  `SEARCH_RADIUS_CELLS=3`; `CAPTURE_DISTANCE_PX=20` (distancia euclidiana entre centros).
- Decisiones confirmadas: el clic como destino manual se elimina; el recorrido de búsqueda
  usa celdas a distancia Manhattan ≤ `SEARCH_RADIUS_CELLS` desde la última posición
  conocida, en orden estable.

## Restricciones

- El dominio no importa Phaser, DOM ni APIs de navegador.
- Percepción, memoria, decisión, búsqueda y locomoción permanecen separadas.
- La escena no decide reglas de comportamiento.
- Sin dependencias nuevas, sin red, sin secretos.
- El guardia sólo decide sobre lo percibido; nunca usa la posición del jugador cuando no
  lo ve.

## Criterios observables

### CR-01 Telemetría por transición

Condición: cada vez que el estado cambia.
Resultado: se registra un evento con tiempo, estado anterior, evento, estado nuevo y
causa.
Evidencia: prueba automatizada en `tests/behavior/` que compara la secuencia de
transiciones registrada ante una secuencia de situaciones simulada; en la escena, el HUD
muestra estado actual, evento y causa de la última transición.

### CR-02 Patrullar (H4.1)

Condición: guardia en PATROL sin visión ni sonido.
Resultado: navega al siguiente punto del ciclo mediante una ruta válida (estado A*
`success`); al llegar, avanza al siguiente punto; un punto inaccesible produce un fracaso
explícito y la selección de un alternativo válido.
Evidencia: prueba automatizada de secuencia sobre un mapa controlado que verifica el
orden cíclico y el manejo del punto bloqueado.

### CR-03 Investigar (H4.2)

Condición: sonido oído o última posición conocida válida sin visión simultánea.
Resultado: el guardia se dirige a la última posición conocida guardada por percepción
válida; si el destino es inaccesible, transiciona a RETURN con telemetría.
Evidencia: prueba que inyecta un evento sonoro y verifica destino = última posición
conocida registrada, sin usar la posición actual del jugador.

### CR-04 Perseguir (H4.3)

Condición: el guardia ve al jugador.
Resultado: actualiza la última posición conocida a la posición vista, persigue, y
replanifica sólo si el objetivo cambió de forma relevante o venció el intervalo de 500 ms;
si la distancia al jugador ≤ 20 px, transiciona a CAPTURED y deja de navegar.
Evidencia: prueba que verifica captura a distancia límite y que no se replanifica a cada
cuadro sino según el intervalo.

### CR-05 Buscar (H4.4)

Condición: el guardia pierde la visión del jugador.
Resultado: fija la última posición vista como destino, navega hasta ella y recorre un
área de hasta 3 celdas de radio durante 3000 ms; si recupera la visión, vuelve a CHASE; si
se agota el tiempo, transiciona a RETURN.
Evidencia: prueba con reloj simulado (100 ms/paso) que verifica inicio, vencimiento y
recuperación de percepción durante la búsqueda.

### CR-06 Regresar (H4.5)

Condición: búsqueda agotada o LKP inaccesible.
Resultado: navega a un punto de patrulla válido; si ve al jugador, vuelve a CHASE; si llega
a un punto válido, transiciona a PATROL; ante destino inaccesible, fracaso explícito y
alternativo válido.
Evidencia: prueba que verifica el regreso a un punto del ciclo y la recuperación ante
destino bloqueado.

### CR-07 Captura terminal

Condición: guardia en CAPTURED.
Resultado: el guardia no navega ni cambia de estado.
Evidencia: prueba que avanza el tiempo en CAPTURED y verifica que posición y estado no
cambian; en escena, indicador de captura.

### CR-08 Camino principal reproducible en escena

Condición: escenario reiniciado (`R`) y secuencia documentada de movimientos del jugador.
Resultado: se puede provocar PATROL → CHASE → SEARCH → RETURN → PATROL y observar cada
transición en el HUD y en la telemetría.
Evidencia: secuencia manual reproducible incluida en `docs/evidencia-pruebas.md` y
validación final `npm.cmd run validate`.

### CR-09 Caso límite: pérdida de visión durante persecución con ruta activa

Condición: el guardia persigue con ruta calculada hacia la posición viva del jugador y
deja de verlo en el cuadro siguiente.
Resultado: abandona la ruta a la posición viva, fija como destino la última posición vista
(no la actual del jugador), y navega desde su posición actual; no usa información futura
del jugador.
Evidencia: prueba automatizada con reloj simulado que inyecta visión válida en `t`, la
retira en `t+100 ms`, y verifica destino = última posición vista y re-planificación desde
la posición actual; además, secuencia manual documentada.

### CR-10 Invariantes

- Un guardia en CAPTURED no continúa navegando.
- La última posición conocida cambia sólo ante percepción válida.
- Toda ruta en ejecución contiene sólo celdas caminables.
- El estado informado coincide con el comportamiento ejecutado (telemetría por transición).
- Regresar a patrulla conduce a un punto válido o fracasa explícitamente.

## Criterios de aceptación globales

1. `npm.cmd run validate` finaliza correctamente con las pruebas nuevas incluidas.
2. La escena se ejecuta sin recursos descargados por separado.
3. Las transiciones del camino principal y del caso límite se reproducen con secuencias
   documentadas.
4. La FSM tiene pruebas automatizadas que cubren cada criterio CR-01 a CR-10.
5. La telemetría permite explicar por qué ocurrió cada transición sin leer código.