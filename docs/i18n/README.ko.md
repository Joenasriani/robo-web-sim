# RoboWebSim

[English](../../README.md) | [العربية](README.ar.md) | [Français](README.fr.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | **한국어**

> 영어 README가 기준 문서입니다. 번역본은 최신 릴리스보다 약간 늦을 수 있습니다.

**브라우저에서 바로 실행되는 3D 로봇 프로그래밍 및 내비게이션 시뮬레이터.**

RoboWebSim을 통해 학습자와 개발자는 로봇을 프로그래밍하고, 명령 시퀀스를 실행하고, Blockly로 프로그램을 만들고, 가상 센서를 확인하고, 3D 아레나를 편집하고, 가이드형 수업을 진행할 수 있습니다.

**라이브 시뮬레이터:** https://robo-web-sim.vercel.app  
**공개 게임:** https://joenasr.itch.io/robosim

> RoboWebSim은 브라우저 중심의 교육용 시뮬레이터입니다. ROS, 로봇 백엔드 또는 네이티브 시뮬레이터 런타임이 필요하지 않습니다.

## 할 수 있는 것

- 구성 가능한 3D 아레나에서 로봇 제어
- Blockly로 로봇 프로그램 작성
- 명령 큐 실행, 일시정지, 정지, 재시작, 다시 재생
- 명확한 완료 조건이 있는 데이터 기반 레슨
- 자유 플레이 시나리오 로드
- 결정론적 가상 센서 값 확인
- 장애물과 목표 편집
- 내장 오브젝트와 로컬 GLB 모델 배치
- 아레나 장면 로컬 저장 및 복원
- 프로그램 저장, 로드, 이름 변경, 삭제, 가져오기
- 데스크톱과 모바일 레이아웃 사용

## 빠른 시작

필수 조건:

- 현재 의존성과 호환되는 Node.js
- npm
- WebGL을 지원하는 최신 브라우저

```bash
git clone https://github.com/Joenasriani/robo-web-sim.git
cd robo-web-sim
npm install
npm run dev
```

열기:

```text
http://localhost:3000
```

프로덕션 빌드:

```bash
npm run build
npm start
```

검증:

```bash
npm run lint
npm test -- --runInBand
npm run build
```

## 첫 번째 로봇 프로그램

1. `/simulator`를 엽니다.
2. 초보자용 자유 플레이 시나리오를 로드합니다.
3. Blockly에 이동 블록을 추가합니다.
4. 프로그램을 실행합니다.
5. 명령 큐, 로봇 이동, 센서 상태, 목표/충돌 결과를 확인합니다.

Blockly와 표시되는 명령 큐는 동일한 네이티브 명령 표현을 사용합니다.

## 주요 경로

### `/`
프로젝트 소개 및 진입점.

### `/simulator`
메인 3D 워크스페이스: 로봇 제어, Blockly, 명령 큐, 레슨, 시나리오, 아레나 편집, 모델 라이브러리, 텔레메트리, 센서, 이벤트 로그.

### `/lessons`
레슨 브라우저와 로컬 진행 상태.

## 아키텍처

RoboWebSim은 Next.js 16, React 19, TypeScript를 사용합니다.

핵심 스택:

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

자세한 내용은 [docs/ARCHITECTURE.md](../ARCHITECTURE.md)를 참고하세요.

## 이동 모델

로봇 이동은 결정론적이며 스텝 기반입니다.

- 이동 스텝: `0.5`
- 회전 스텝: `π / 8`

네이티브 명령:

- `forward`
- `backward`
- `left`
- `right`
- `wait`

## 시뮬레이션 범위

RoboWebSim은 로봇 학습, 명령 로직, 내비게이션, 환경 제작, 교육용 프로그래밍에 초점을 둡니다.

현재 다음 기능을 주장하지 않습니다:

- 연속 강체 물리
- 검증된 로봇 동역학
- ROS 상호운용성
- Webots 호환성
- Hardware-in-the-loop
- 실제 로봇 제어
- 현실적인 센서 노이즈
- 연구급 로봇 시뮬레이션

## 기여

[CONTRIBUTING.md](../../CONTRIBUTING.md)를 참고하세요.

보안 문제는 [SECURITY.md](../../SECURITY.md)를 참고하세요.

## 라이선스

RoboWebSim 소스 코드는 [MIT License](../../LICENSE)를 따릅니다.

절차적으로 생성된 GLB 모델은 [public/models/README.md](../../public/models/README.md)에 설명된 별도의 CC0 선언을 유지할 수 있습니다.

## 프로젝트

RoboSim / RoboWebSim은 RoboMarket의 인터랙티브 로봇 학습 모듈로도 사용됩니다.

- RoboMarket: https://robomarket.ae/
- Joe Nasr: https://joe-nasr-signals.vercel.app/

Created by Joe Nasr.
