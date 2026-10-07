# RoboWebSim

[English](../../README.md) | [العربية](README.ar.md) | [Français](README.fr.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [简体中文](README.zh-CN.md) | **日本語** | [한국어](README.ko.md)

> 英語版 README が正式な基準です。翻訳は最新リリースより少し遅れる場合があります。

**ブラウザで動作する 3D ロボットプログラミング／ナビゲーションシミュレーター。**

RoboWebSim では、学習者や開発者がロボットをプログラムし、コマンド列を実行し、Blockly でプログラムを構築し、仮想センサーを確認し、3D アリーナを編集し、ガイド付きレッスンをブラウザ上で実行できます。

**ライブシミュレーター:** https://robo-web-sim.vercel.app  
**公開ゲーム:** https://joenasr.itch.io/robosim

> RoboWebSim はブラウザ中心の教育用シミュレーターです。ROS、ロボティクス用バックエンド、ネイティブシミュレーターは必要ありません。

## できること

- 設定可能な 3D アリーナでロボットを操作
- Blockly でロボットプログラムを作成
- コマンドキューの実行・一時停止・停止・再起動・再生
- 明確な完了条件を持つデータ駆動レッスン
- フリープレイシナリオの読み込み
- 決定論的な仮想センサー値の確認
- 障害物とターゲットの編集
- 組み込みオブジェクトやローカル GLB モデルの配置
- アリーナシーンのローカル保存と復元
- プログラムの保存・読み込み・名前変更・削除・インポート
- デスクトップとモバイルの両方に対応

## クイックスタート

必要条件：

- 現在の依存関係に対応した Node.js
- npm
- WebGL 対応のモダンブラウザ

```bash
git clone https://github.com/Joenasriani/robo-web-sim.git
cd robo-web-sim
npm install
npm run dev
```

開く：

```text
http://localhost:3000
```

本番ビルド：

```bash
npm run build
npm start
```

検証：

```bash
npm run lint
npm test -- --runInBand
npm run build
```

## 最初のロボットプログラム

1. `/simulator` を開く。
2. 初心者向けフリープレイシナリオを読み込む。
3. Blockly に移動ブロックを追加する。
4. プログラムを実行する。
5. コマンドキュー、ロボットの動き、センサー状態、ターゲット／衝突結果を確認する。

Blockly と表示されるコマンドキューは同じネイティブコマンド表現を使用します。

## 主なルート

### `/`
プロジェクト紹介と入口。

### `/simulator`
3D ワークスペース：ロボット操作、Blockly、コマンドキュー、レッスン、シナリオ、アリーナ編集、モデルライブラリ、テレメトリ、センサー、イベントログ。

### `/lessons`
レッスンブラウザとローカル進捗。

## アーキテクチャ

RoboWebSim は Next.js 16、React 19、TypeScript を使用しています。

主な技術：

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

詳細は [docs/ARCHITECTURE.md](../ARCHITECTURE.md) を参照してください。

## モーションモデル

ロボットは決定論的なステップ方式で移動します。

- 移動量：`0.5`
- 回転量：`π / 8`

ネイティブコマンド：

- `forward`
- `backward`
- `left`
- `right`
- `wait`

## シミュレーション範囲

RoboWebSim は、ロボティクス学習、コマンドロジック、ナビゲーション、環境作成、教育プログラミングに重点を置いています。

現時点では以下を対象としていません：

- 連続剛体物理
- 検証済みロボットダイナミクス
- ROS 相互運用
- Webots 互換
- Hardware-in-the-loop
- 実機ロボット制御
- 現実的なセンサーノイズ
- 研究レベルのロボットシミュレーション

## コントリビューション

[CONTRIBUTING.md](../../CONTRIBUTING.md) を参照してください。

セキュリティについては [SECURITY.md](../../SECURITY.md) を参照してください。

## ライセンス

RoboWebSim のソースコードは [MIT License](../../LICENSE) です。

手続き的に生成された GLB モデルは、[public/models/README.md](../../public/models/README.md) に記載された個別の CC0 宣言を維持できます。

## プロジェクト

RoboSim / RoboWebSim は RoboMarket のインタラクティブなロボティクス学習モジュールとしても使用されています。

- RoboMarket: https://robomarket.ae/
- Joe Nasr: https://joe-nasr-signals.vercel.app/

Created by Joe Nasr.
