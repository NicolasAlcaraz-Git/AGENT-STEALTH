---
id: laboratorio-guardia-sigilo
titulo: Laboratorio Guardia de Sigilo
tipo: indice
audiencia: estudiante
acceso: publico
version: 4
---

# Laboratorio Guardia de Sigilo

Proyecto canónico de PIAPC 2026 para aplicar desarrollo agéntico e inteligencia artificial de videojuegos.

## Estado

H0 a H4 implementados: escenario base, repositorio preparado para agentes, navegación BFS/A*, percepción con memoria y máquina de estados autónoma del guardia (patrullar, investigar, perseguir, buscar, regresar y capturar) con telemetría por transición. El guardia decide de forma autónoma en la escena.

## Ejecución

Requiere Node.js 22 o superior.

```bash
npm ci
npm run dev
```

Validación completa:

```bash
npm run validate
```

En la escena:

- WASD o flechas: mover al jugador.
- Q: emitir un sonido desde el jugador.
- R: reiniciar el escenario.

El guardia decide solo (patrulla, investiga, persigue, busca y regresa). El HUD muestra el estado actual, la última transición (anterior → nuevo y evento), su causa, el motivo de visión, el sonido y la memoria.

## Propósito

Construir un juego 2D cenital mínimo donde un guardia:

- patrulla puntos definidos;
- percibe al jugador mediante visión y sonido;
- conserva una última posición conocida;
- navega mediante A*;
- sigue caminos sin mezclar búsqueda y locomoción;
- decide mediante una máquina de estados;
- expone telemetría suficiente para comprender y probar su conducta.

El proyecto no busca producir un videojuego comercial. Es un entorno de experimentación controlado, reproducible y apto para personas y agentes de desarrollo.

## Documentos

- [Especificación del producto](specs/01-producto.md)
- [Especificación pedagógica](specs/02-pedagogica.md)
- [GDD simplificado](GDD.md)
- [Consigna del parcial](docs/consignasparcial.md)
- [Arquitectura](docs/arquitectura.md)
- [Hitos](docs/hitos.md)
- [Contrato para proyectos alternativos](docs/contrato-proyecto-alternativo.md)
- [Decisiones técnicas](docs/decisiones-tecnicas.md)
- [Auditoría H1](docs/auditoria-h1.md)
- [Permisos recomendados](docs/permisos-recomendados.md)
- [Auditoría del repositorio](docs/auditoria-repositorio.md)
- [Especificación H4](docs/especificacion.md)
- [Plan H4](docs/plan.md)
- [Registro de intervención](docs/registro-intervencion.md)
- [Evidencia de pruebas](docs/evidencia-pruebas.md)
- [Informe final](docs/informe-final.md)
- [Resumen de estado](docs/resumenestado.md)
- [Plantillas](docs/plantillas/registro-intervencion.md)
- [H3: percepción y movimiento](docs/h3-percepcion-movimiento.md)
- [Intervención H3](docs/evidencias/h3-intervencion.md)
- [Validación H3](docs/evidencias/h3-validacion.md)

## Tecnología de referencia

- Phaser con TypeScript.
- Vite para desarrollo y compilación.
- Vitest para pruebas de dominio.
- Node.js 22 o superior.
- npm y archivo de bloqueo para instalaciones reproducibles.

El estudiante puede adoptar Unity u otro entorno si cumple el contrato de equivalencia.

## Restricción principal

La lógica de navegación, percepción y decisión no dependerá de Phaser. El motor será un adaptador de entrada, tiempo, colisiones y representación visual.
