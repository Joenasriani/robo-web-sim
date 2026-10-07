# RoboWebSim

[English](../../README.md) | [العربية](README.ar.md) | [Français](README.fr.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | **简体中文** | [日本語](README.ja.md) | [한국어](README.ko.md)

> 英文 README 是规范版本。翻译内容可能会略晚于最新版本。

**基于浏览器的 3D 机器人编程与导航模拟器。**

RoboWebSim 让学习者和开发者可以直接在浏览器中编程机器人、执行有序命令、使用 Blockly 构建程序、查看虚拟传感器、编辑 3D 场景，并完成引导式课程。

**在线模拟器：** https://robo-web-sim.vercel.app  
**公开游戏：** https://joenasr.itch.io/robosim

> RoboWebSim 是一个以浏览器为核心的教育模拟器，不需要 ROS、机器人后端或原生模拟器运行时。

## 你可以做什么

- 在可配置的 3D 场景中控制机器人
- 使用 Blockly 构建机器人程序
- 运行、暂停、停止、重启和重放命令队列
- 完成带有明确规则的数据驱动课程
- 加载自由探索场景
- 查看确定性的虚拟传感器数据
- 编辑障碍物和目标
- 放置内置对象和本地 GLB 模型
- 本地保存和恢复场景
- 保存、加载、重命名、删除和导入程序
- 在桌面和移动设备上使用

## 快速开始

要求：

- 与当前依赖树兼容的 Node.js
- npm
- 支持 WebGL 的现代浏览器

```bash
git clone https://github.com/Joenasriani/robo-web-sim.git
cd robo-web-sim
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

生产构建：

```bash
npm run build
npm start
```

验证：

```bash
npm run lint
npm test -- --runInBand
npm run build
```

## 第一个机器人程序

1. 打开 `/simulator`。
2. 加载一个初学者自由场景。
3. 在 Blockly 中添加机器人移动块。
4. 运行程序。
5. 观察命令队列、机器人移动、传感器状态，以及目标/碰撞结果。

Blockly 与可见命令队列使用相同的原生命令表示。

## 主要路由

### `/`
项目介绍与模拟器入口。

### `/simulator`
主要 3D 工作区：机器人控制、Blockly、命令队列、课程、场景、场景编辑、模型库、遥测、传感器和事件日志。

### `/lessons`
课程浏览器和本地进度。

## 架构

RoboWebSim 使用 Next.js 16、React 19 和 TypeScript。

核心技术栈：

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

更多信息请参阅 [docs/ARCHITECTURE.md](../ARCHITECTURE.md)。

## 运动模型

机器人采用确定性的步进运动：

- 平移步长：`0.5`
- 旋转步长：`π / 8`

原生命令：

- `forward`
- `backward`
- `left`
- `right`
- `wait`

## 模拟范围

RoboWebSim 专注于机器人学习、命令逻辑、导航、环境构建和教育编程。

当前不声称提供：

- 连续刚体物理
- 经过验证的机器人动力学
- ROS 互操作性
- Webots 兼容性
- 硬件在环控制
- 真实机器人控制
- 真实传感器噪声
- 研究级机器人仿真

## 贡献

参阅 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

安全问题请参阅 [SECURITY.md](../../SECURITY.md)。

## 许可证

RoboWebSim 源代码采用 [MIT License](../../LICENSE)。

程序生成的 GLB 模型可保留独立的 CC0 声明，详见 [public/models/README.md](../../public/models/README.md)。

## 项目

RoboSim / RoboWebSim 也作为 RoboMarket 中的交互式机器人学习模块使用。

- RoboMarket: https://robomarket.ae/
- Joe Nasr: https://joe-nasr-signals.vercel.app/

由 Joe Nasr 创建。
