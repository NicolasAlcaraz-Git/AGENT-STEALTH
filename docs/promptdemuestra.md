Trabajamos sobre el laboratorio Guardia de Sigilo.

Explorá primero README.md, AGENTS.md, docs/arquitectura.md,
docs/permisos-recomendados.md, las especificaciones, los hitos, el código y
las pruebas relacionadas. Si necesitás ampliar el contexto, buscá rutas y
símbolos vinculados. No modifiques archivos ni ejecutes comandos.

Determiná el estado actual del laboratorio a partir de las fuentes del
repositorio. Indicá qué capacidades del guardia ya existen, cuáles todavía no
existen y qué rutas o símbolos respaldan cada afirmación. No asumas que existe
una máquina de estados hasta comprobarlo. Separá evidencia, supuestos y
preguntas abiertas.

Luego elaborá una propuesta completa de progresión para:
1. Patrullar puntos cíclicos.
2. Investigar un sonido o última posición conocida.
3. Perseguir al jugador cuando exista percepción visual válida.
4. Buscar durante un tiempo limitado al perder visión.
5. Regresar a un punto de patrulla válido.

Para cada conducta indicá estado de origen, evento, guarda, estado destino y
acción; la información que puede usar el guardia y la que no debe consultar;
cuándo recalcular o conservar una ruta; qué hacer ante un destino inaccesible;
una prueba del camino principal y un caso límite; y las capas, rutas y pruebas
relacionadas.

Respetá estas restricciones:
- El dominio no puede importar Phaser, DOM ni APIs del navegador.
- Percepción, memoria, decisión, búsqueda, seguimiento y locomoción deben
  permanecer separados.
- Visión tiene prioridad sobre sonido y la última posición conocida cambia sólo
  ante una percepción válida.
- Cada transición debe producir telemetría observable.
- No agregar dependencias, no usar red, no acceder a secretos ni publicar.

Presentá el resultado en este orden:
1. Evidencia encontrada.
2. Supuestos y preguntas abiertas.
3. Tabla completa de estados y transiciones.
4. Plan incremental por hitos H4.1 a H4.5.
5. Estrategia de pruebas y evidencia.
6. Archivos posiblemente afectados.
7. Condiciones para detenerse y consultar.

No implementes todavía.