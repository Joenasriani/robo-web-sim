# RoboWebSim

[English](../../README.md) | [العربية](README.ar.md) | [Français](README.fr.md) | [Español](README.es.md) | **Português (Brasil)** | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

> O README em inglês é a versão canônica. As traduções podem ficar ligeiramente atrás da versão mais recente.

**Simulador 3D de programação robótica e navegação que roda diretamente no navegador.**

O RoboWebSim permite que estudantes e desenvolvedores programem um robô, executem sequências de comandos, criem programas com Blockly, inspecionem sensores virtuais, editem arenas 3D e façam aulas guiadas no navegador.

**Simulador ao vivo:** https://robo-web-sim.vercel.app  
**Jogo público:** https://joenasr.itch.io/robosim

> O RoboWebSim é intencionalmente um simulador educacional browser-first. Ele não exige ROS, backend robótico ou runtime de simulador nativo.

## O que você pode fazer

- controlar um robô em uma arena 3D configurável
- criar programas com Blockly
- executar filas de comandos com iniciar, pausar, parar, reiniciar e repetir
- seguir aulas orientadas por dados com regras explícitas
- carregar cenários de jogo livre
- consultar sensores virtuais determinísticos
- editar obstáculos e alvos
- posicionar objetos integrados e modelos GLB locais
- salvar e restaurar cenas localmente
- salvar, carregar, renomear, excluir e importar programas
- usar o simulador em desktop e mobile

## Início rápido

Requisitos:

- Node.js compatível com a árvore atual de dependências
- npm
- navegador moderno com WebGL

```bash
git clone https://github.com/Joenasriani/robo-web-sim.git
cd robo-web-sim
npm install
npm run dev
```

Abra:

```text
http://localhost:3000
```

Build de produção:

```bash
npm run build
npm start
```

Validação:

```bash
npm run lint
npm test -- --runInBand
npm run build
```

## Primeiro programa do robô

1. Abra `/simulator`.
2. Carregue um cenário iniciante.
3. Adicione blocos de movimento no Blockly.
4. Execute o programa.
5. Observe a fila, o movimento, os sensores e o resultado de alvo/colisão.

Blockly e a fila visível usam a mesma representação nativa de comandos.

## Rotas principais

### `/`
Introdução do projeto e ponto de entrada.

### `/simulator`
Workspace 3D principal: controles, Blockly, fila de comandos, aulas, cenários, editor de arena, biblioteca de modelos, telemetria, sensores e log de eventos.

### `/lessons`
Navegador de aulas e progresso local.

## Arquitetura

O RoboWebSim usa Next.js 16, React 19 e TypeScript.

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

Veja [docs/ARCHITECTURE.md](../ARCHITECTURE.md).

## Modelo de movimento

Movimento determinístico por passos:

- translação: `0.5`
- rotação: `π / 8`

Comandos nativos:

- `forward`
- `backward`
- `left`
- `right`
- `wait`

## Escopo da simulação

O RoboWebSim é focado em aprendizado de robótica, lógica de comandos, navegação, criação de ambientes e programação educacional.

Atualmente não pretende oferecer:

- física contínua de corpos rígidos
- dinâmica robótica validada
- interoperabilidade ROS
- compatibilidade Webots
- hardware-in-the-loop
- controle de robô físico
- ruído realista de sensores
- simulação robótica de nível de pesquisa

## Contribuição

Veja [CONTRIBUTING.md](../../CONTRIBUTING.md).

Para segurança, veja [SECURITY.md](../../SECURITY.md).

## Licença

O código-fonte está sob [licença MIT](../../LICENSE).

Modelos GLB procedurais podem manter declarações CC0 separadas conforme [public/models/README.md](../../public/models/README.md).

## Projeto

RoboSim / RoboWebSim também é usado como módulo interativo de aprendizado no RoboMarket.

- RoboMarket: https://robomarket.ae/
- Joe Nasr: https://joe-nasr-signals.vercel.app/

Criado por Joe Nasr.
