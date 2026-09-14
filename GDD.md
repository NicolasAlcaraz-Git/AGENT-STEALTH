# GDD simplificado

## Experiencia de juego

Escena 2D cenital de sigilo sobre el laboratorio "Guardia de Sigilo". Una persona mueve
al jugador con el teclado y debe cruzar el mapa sin ser capturado. Un guardia recorre
puntos de patrulla, percibe al jugador sólo por visión y sonido, y reacciona de forma
autónoma: investiga ruidos, persigue cuando ve, busca donde perdió la vista y vuelve a
patrullar. Toda decisión del guardia es observable en pantalla, de modo que la persona
puede identificar por qué ocurrió cada cambio de comportamiento.

## Problema concreto

El guardia percibe y conserva memoria (H3 completado), pero todavía no decide su conducta:
sólo obedece a destinos indicados por una persona. Para que el laboratorio cumpla el
producto previsto, el guardia debe decidir con una máquina de estados (H4: Patrullar,
Investigar, Perseguir, Buscar, Regresar y, al capturar, detenerse) usando únicamente la
información que percibe, separando percepción, memoria, decisión, búsqueda y locomoción.

## Conducta esperada

- **Patrullar**: recorre cíclicamente los puntos de patrulla (27,17) → (28,5) → (5,2) →
  (6,17) → (27,17) mediante rutas válidas de A*.
- **Investigar**: ante un sonido oído y sin visión, navega hacia la última posición
  conocida registrada por percepción válida.
- **Perseguir**: al ver al jugador, actualiza la última posición conocida y lo persigue;
  cuando está a distancia de captura, el guardia se detiene (estado terminal).
- **Buscar**: al perder la visión, navega a la última posición conocida y, si no vuelve a
  ver, recorre durante un tiempo limitado las celdas cercanas.
- **Regresar**: al agotar la búsqueda, vuelve a un punto de patrulla válido y retoma el ciclo.

## Reglas

- La visión tiene prioridad sobre el sonido: ante percepción simultánea gana la visión y
  la última posición conocida corresponde a la percepción válida más nueva.
- El guardia decide sólo sobre lo percibido: no usa la posición del jugador cuando no lo ve.
- La última posición conocida cambia sólo ante una percepción válida (visión o sonido).
- Persecución: recalcular cuando cambia el objetivo de forma relevante o vence el intervalo
  de replanificación (500 ms); conservar la ruta mientras no ocurra eso.
- Búsqueda limitada: 3000 ms alrededor de la última posición conocida, radio de hasta 3 celdas.
- Captura: al alcanzar el jugador a 20 px, el guardia se detiene y no continúa navegando.
- Cada transición de estado produce telemetría observable (estado anterior, evento, estado
  nuevo y causa).
- Un destino inaccesible produce un fracaso explícito y una recuperación registrada.

## Restricciones

- El dominio (`src/domain/`) no importa Phaser, DOM ni APIs del navegador.
- Percepción, memoria, decisión, búsqueda, seguimiento y locomoción permanecen separados.
- La presentación (escena Phaser) no decide reglas de comportamiento.
- No se agregan dependencias, no hay red, no se accede a secretos ni se publica.

## Fuera de alcance

- Arte, animaciones o audio de producción.
- Combate, inventario, narrativa ramificada o multijugador.
- Zona de captura/salida configurable como destino del jugador (sólo la captura del guardia).
- Generación procedural de niveles.
- Comparación con behavior trees, utility AI o GOAP (hito H5).

## Caso límite

Pérdida de visión durante una persecución con ruta activa: el guardia debe abandonar la
ruta hacia la posición viva del jugador, fijar la última posición vista como destino de
búsqueda y navegar desde su posición actual, sin usar información futura del jugador.