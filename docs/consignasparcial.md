Parcial 1 - Desarrollo agéntico documentado

Parcial 1 - Desarrollo agéntico documentado
Propósito
Conducir una intervención pequeña sobre un proyecto de videojuego mediante un proceso trazable: comprender el repositorio, definir una intención de diseño, especificar el cambio, planificarlo, usar un agente con control humano, validar el resultado y revisar las decisiones tomadas.

La actividad se inicia en la clase del 9 de septiembre y continúa de forma individual. La entrega formal se realiza en esta plataforma hasta el 15 de septiembre de 2026 a las 23:59.

Consigna general
La cátedra presenta en clase una situación de comportamiento acotada sobre el repositorio base. Definí un GDD simplificado que guíe la resolución, implementá sólo el cambio incluido en el alcance y documentá el proceso completo. La situación específica y toda pauta de corrección permanecen fuera de este material público.

El parcial se realiza de forma individual fuera del aula. Antes de modificar código, prepará tu copia con la plantilla para repositorio individual con agente y recorré la guía práctica autogestionada: incluye un prompt de muestra y una plantilla copiable para pedir a OpenCode una propuesta fundada, corregirla y ordenar los artefactos, herramientas y evidencias que necesitás conservar.

Repositorio y uso de herramientas
Creá un repositorio público individual desde la plantilla indicada por la cátedra.
Conservá el commit inicial, los commits progresivos y el commit final evaluable.
Leé las instrucciones, la arquitectura, los scripts y las pruebas antes de editar.
Usá OpenCode o una herramienta equivalente inicialmente con lectura y búsqueda. Una traza provista por la cátedra es una alternativa si no disponés de modelo.
No instales dependencias, no uses red, no publiques, no accedas a secretos ni ejecutes comandos que no estén documentados o autorizados.
Detenete y registrá la situación si falta una decisión de diseño, un permiso o evidencia para continuar.
Cómo realizar el trabajo
1. Preparar el punto de partida
Creá el repositorio individual solicitado, verificá su estado y conservá el commit base. Leé las instrucciones, arquitectura, permisos, scripts y pruebas. Todavía no propongas archivos a modificar: primero identificá cómo llega una entrada al comportamiento que querés cambiar y dónde se lo comprueba.

2. Definir antes de editar
Completá GDD.md con la experiencia de juego, el problema concreto, la conducta esperada, reglas, restricciones, fuera de alcance y un caso límite. Luego redactá docs/especificacion.md: cada criterio debe decir qué ocurre en qué condición y con qué evidencia se lo demostrará.

Por ejemplo, “el guardia es más inteligente” no se puede comprobar. Un criterio útil describe un estímulo y un resultado visible o probado, como una transición, una ruta válida, una memoria que se conserva o un fallo explícito ante un destino inaccesible. El caso límite debe desafiar una condición relevante, no repetir el camino favorable.

3. Explorar y planificar
En docs/auditoria-repositorio.md, registrá rutas, símbolos, flujo observado, pruebas, comandos y límites de la arquitectura. Separá hechos comprobados de supuestos y preguntas abiertas. En docs/plan.md, vinculá cada cambio mínimo con los archivos previstos, una verificación, un riesgo y una condición de detención.

No inventes una solución para una decisión de diseño que la consigna no define. Registrá la ambigüedad y consultá antes de seguir.

4. Usar la herramienta con control humano
La primera consulta a OpenCode o herramienta equivalente debe ser de sólo lectura. Pedí rutas, símbolos, evidencia, supuestos y dudas; contrastá sus afirmaciones con el repositorio. Antes de permitir escritura, completá una matriz de permisos: lectura y búsqueda pueden habilitarse para el proyecto; edición y scripts declarados sólo para el alcance aprobado; red, instalación, publicación y secretos permanecen fuera de alcance.

En docs/registro-intervencion.md, anotá la instrucción resumida, la acción o herramienta, el resultado observable y tu decisión. Registrá correcciones y acciones rechazadas. No incluyas claves, datos privados ni razonamientos internos del modelo.

5. Implementar y validar
Aplicá cambios pequeños y revisá cada diferencia antes de continuar. Ejecutá primero la prueba relacionada y después la validación documentada por el repositorio. En docs/evidencia-pruebas.md, relacioná cada criterio con un comando o una secuencia manual reproducible, su resultado y la versión validada.

La evidencia debe cubrir como mínimo el camino principal y un caso límite. Si una prueba falla, registrá cómo se reproduce, su impacto y la corrección o el límite pendiente. No reemplaces una validación por una captura aislada o por la afirmación de la herramienta.

6. Revisar y entregar
Leé las diferencias completas, verificá que el alcance no haya crecido y completá docs/informe-final.md con resultado, decisiones, controles humanos, validaciones, límites y riesgos. Declarar un límite no resuelto es preferible a ocultarlo. Luego identificá el commit final y completá la entrega en la plataforma.

Hitos verificables
Hito	Artefacto o evidencia	Verificación
Inicio	URL del repositorio y commit base	El historial permite identificar el punto de partida.
GDD	GDD.md	Define experiencia, problema, reglas, límites y un caso límite.
Exploración	docs/auditoria-repositorio.md	Distingue rutas, flujo, pruebas, evidencia y supuestos.
Especificación	docs/especificacion.md	Declara alcance, restricciones y criterios observables.
Plan	docs/plan.md	Relaciona cambios, riesgos y validaciones.
Intervención	docs/registro-intervencion.md	Registra acciones, resultados y decisiones humanas.
Implementación	Código y commits	El cambio es pequeño, revisable y consistente con el plan.
Validación	docs/evidencia-pruebas.md	Demuestra el camino principal y el caso límite.
Revisión	docs/informe-final.md	Explica decisiones, correcciones y riesgos pendientes.
Cada hito responde una pregunta distinta: qué se busca (GDD), qué se aceptará (especificación), qué se sabe del proyecto (auditoría), cómo se intervendrá (plan), qué ocurrió durante el proceso (registro), qué cambió (implementación), cómo se comprobó (validación) y qué límites siguen abiertos (revisión).

Estructura esperada
/
├── GDD.md
├── README.md
├── docs/
│   ├── auditoria-repositorio.md
│   ├── especificacion.md
│   ├── plan.md
│   ├── registro-intervencion.md
│   ├── evidencia-pruebas.md
│   └── informe-final.md
├── src/
└── tests/
Podés adaptar la estructura existente del repositorio siempre que los artefactos requeridos sean localizables.

Entrega en la plataforma
Escribí en el campo de entrega:

URL del repositorio público individual.
Hash o enlace del commit final evaluable.
Herramienta y modelo utilizados, si están disponibles.
Comandos de validación ejecutados y resultado.
Declaración de que el repositorio no contiene secretos, credenciales ni datos privados.
El repositorio permite comprobar el proceso técnico; la entrega en plataforma registra la versión presentada dentro del plazo.

Preguntas frecuentes
¿Puedo usar otra herramienta o no usar un modelo?
Sí. OpenCode es la referencia, pero una herramienta equivalente o una traza provista por la cátedra son válidas si conservan el mismo proceso, permisos mínimos y evidencia observable. También podés realizar la intervención manualmente y documentar tus decisiones y validaciones.

¿Cuándo habilito escritura o ejecuto comandos?
Después de explorar, definir alcance y planificar. Ejecutá sólo comandos documentados o autorizados por el repositorio. Una necesidad de instalar dependencias, usar red, publicar, acceder a secretos, eliminar archivos o modificar configuración requiere detenerse y consultar.

¿Qué hago si una validación falla?
No declares el criterio como cumplido. Conservá el resultado, reproducí el fallo, formulá una hipótesis, revisá la diferencia y registrá si corregís, ajustás el plan o detenés el trabajo. Una falla no comprendida es una condición válida para escalar.

¿Qué significa que la evidencia sea reproducible?
Otra persona debe poder identificar la versión evaluada y repetir el comando o los pasos de juego para observar el mismo resultado. Indicá commit, entorno cuando sea relevante, criterio, método, resultado y ubicación de la salida o prueba.

Criterios públicos
El problema de diseño, el alcance y la aceptación están definidos de forma verificable.
La intervención se apoya en exploración y evidencia, no en afirmaciones del agente.
Los permisos y las acciones son mínimos, justificados y seguros.
Los cambios son incrementales, revisables y coherentes con el GDD y el plan.
La validación se vincula con los criterios de aceptación, incluido un caso límite.
La documentación declara decisiones humanas, límites y uso de IA sin incluir razonamientos internos privados.
Un resultado ejecutable no sustituye los artefactos del proceso. Del mismo modo, una afirmación de la herramienta no sustituye una prueba reproducible.