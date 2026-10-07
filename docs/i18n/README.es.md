# RoboWebSim

[English](../../README.md) | [العربية](README.ar.md) | [Français](README.fr.md) | **Español** | [Português (Brasil)](README.pt-BR.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

> El README en inglés es la versión canónica. Las traducciones pueden quedar ligeramente por detrás de la versión más reciente.

**Simulador 3D de programación robótica y navegación que funciona directamente en el navegador.**

RoboWebSim permite a estudiantes y desarrolladores programar un robot, ejecutar secuencias de comandos, crear programas Blockly, inspeccionar sensores virtuales, editar arenas 3D y completar lecciones guiadas desde el navegador.

**Simulador en vivo:** https://robo-web-sim.vercel.app  
**Juego público:** https://joenasr.itch.io/robosim

> RoboWebSim es un simulador educativo pensado para funcionar primero en el navegador. No necesita ROS, backend robótico ni un simulador nativo.

## Qué puedes hacer

- controlar un robot en una arena 3D configurable
- construir programas con Blockly
- ejecutar colas de comandos con iniciar, pausar, detener, reiniciar y repetir
- completar lecciones basadas en datos con reglas explícitas
- cargar escenarios de juego libre
- consultar sensores virtuales deterministas
- editar obstáculos y objetivos
- colocar objetos integrados y modelos GLB locales
- guardar y restaurar escenas localmente
- guardar, cargar, renombrar, eliminar e importar programas
- usar el simulador en escritorio y móvil

## Inicio rápido

Requisitos:

- Node.js compatible con el árbol de dependencias actual
- npm
- navegador moderno con WebGL

```bash
git clone https://github.com/Joenasriani/robo-web-sim.git
cd robo-web-sim
npm install
npm run dev
```

Abre:

```text
http://localhost:3000
```

Build de producción:

```bash
npm run build
npm start
```

Validación:

```bash
npm run lint
npm test -- --runInBand
npm run build
```

## Primer programa del robot

1. Abre `/simulator`.
2. Carga un escenario para principiantes.
3. Añade bloques de movimiento en Blockly.
4. Ejecuta el programa.
5. Observa la cola, el movimiento, sensores y resultado de objetivo/colisión.

Blockly y la cola visible usan la misma representación nativa de comandos.

## Rutas principales

### `/`
Introducción del proyecto y acceso al simulador.

### `/simulator`
Espacio 3D principal: controles, Blockly, cola de comandos, lecciones, escenarios, edición de arena, biblioteca de modelos, telemetría, sensores y registro de eventos.

### `/lessons`
Navegador de lecciones y progreso local.

## Arquitectura

RoboWebSim usa Next.js 16, React 19 y TypeScript.

Stack principal:

- Next.js App Router
- React 19
- Three.js
- React Three Fiber
- @react-three/drei
- Zustand
- Blockly
- Tailwind CSS
- `localStorage`
- Jest / jsdom

Consulta [docs/ARCHITECTURE.md](../ARCHITECTURE.md).

## Modelo de movimiento

Movimiento determinista y por pasos:

- traslación: `0.5`
- rotación: `π / 8`

Comandos nativos:

- `forward`
- `backward`
- `left`
- `right`
- `wait`

## Alcance del simulador

RoboWebSim se centra en aprendizaje de robótica, lógica de comandos, navegación, creación de entornos y programación educativa.

Actualmente no pretende ofrecer:

- física continua de cuerpos rígidos
- dinámica robótica validada
- interoperabilidad ROS
- compatibilidad Webots
- hardware-in-the-loop
- control de robots físicos
- ruido realista de sensores
- simulación robótica de nivel investigación

## Contribuir

Consulta [CONTRIBUTING.md](../../CONTRIBUTING.md).

Para seguridad, consulta [SECURITY.md](../../SECURITY.md).

## Licencia

El código fuente está bajo [licencia MIT](../../LICENSE).

Los modelos GLB procedurales pueden mantener declaraciones CC0 separadas según [public/models/README.md](../../public/models/README.md).

## Proyecto

RoboSim / RoboWebSim también se usa como módulo interactivo de aprendizaje dentro de RoboMarket.

- RoboMarket: https://robomarket.ae/
- Joe Nasr: https://joe-nasr-signals.vercel.app/

Creado por Joe Nasr.
