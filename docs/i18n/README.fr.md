# RoboWebSim

[English](../../README.md) | [العربية](README.ar.md) | **Français** | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

> Le README anglais est la version de référence. Les traductions peuvent légèrement différer de la dernière version.

**Simulateur 3D de programmation robotique et de navigation, directement dans le navigateur.**

RoboWebSim permet aux apprenants et aux développeurs de programmer un robot, exécuter des séquences de commandes, créer des programmes Blockly, inspecter des capteurs virtuels, modifier des arènes 3D et suivre des leçons guidées dans le navigateur.

**Simulateur en ligne :** https://robo-web-sim.vercel.app  
**Jeu public :** https://joenasr.itch.io/robosim

> RoboWebSim est volontairement un simulateur éducatif centré sur le navigateur. Il ne nécessite ni ROS, ni backend robotique, ni moteur de simulation natif.

## Ce que vous pouvez faire

- contrôler un robot dans une arène 3D configurable
- créer des programmes avec Blockly
- exécuter des files de commandes avec lecture, pause, arrêt, redémarrage et replay
- suivre des leçons pilotées par les données avec règles de réussite explicites
- charger des scénarios de jeu libre
- consulter des capteurs virtuels déterministes
- modifier obstacles et cibles
- placer des objets intégrés et des modèles GLB locaux
- sauvegarder et restaurer des scènes localement
- sauvegarder, charger, renommer, supprimer et importer des programmes
- utiliser le simulateur sur ordinateur et mobile

## Démarrage rapide

Prérequis :

- une version de Node.js compatible avec les dépendances actuelles
- npm
- un navigateur moderne avec WebGL

```bash
git clone https://github.com/Joenasriani/robo-web-sim.git
cd robo-web-sim
npm install
npm run dev
```

Ouvrez :

```text
http://localhost:3000
```

Build de production :

```bash
npm run build
npm start
```

Validation :

```bash
npm run lint
npm test -- --runInBand
npm run build
```

## Premier programme robot

1. Ouvrez `/simulator`.
2. Chargez un scénario débutant.
3. Ajoutez des blocs de mouvement dans Blockly.
4. Exécutez le programme.
5. Observez la file de commandes, les mouvements, les capteurs et le résultat cible/collision.

Blockly et la file visible utilisent la même représentation native des commandes.

## Routes principales

### `/`
Présentation du projet et point d’entrée.

### `/simulator`
Espace 3D principal : contrôles, Blockly, file de commandes, leçons, scénarios, édition d’arène, bibliothèque de modèles, télémétrie, capteurs et journal d’événements.

### `/lessons`
Navigateur de leçons et progression locale.

## Architecture

RoboWebSim utilise Next.js 16, React 19 et TypeScript.

Stack principale :

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

Voir [docs/ARCHITECTURE.md](../ARCHITECTURE.md) pour plus de détails.

## Modèle de mouvement

Le mouvement est déterministe et basé sur des pas fixes.

- translation : `0.5`
- rotation : `π / 8`

Commandes natives :

- `forward`
- `backward`
- `left`
- `right`
- `wait`

## Portée du simulateur

RoboWebSim se concentre sur l’apprentissage de la robotique, la logique de commandes, la navigation, la création d’environnements et la programmation éducative.

Il ne prétend pas fournir :

- physique rigide continue
- dynamique robotique validée
- interopérabilité ROS
- compatibilité Webots
- hardware-in-the-loop
- contrôle d’un robot physique
- bruit capteur réaliste
- simulation robotique de niveau recherche

## Contribution

Voir [CONTRIBUTING.md](../../CONTRIBUTING.md).

Pour la sécurité, voir [SECURITY.md](../../SECURITY.md).

## Licence

Le code source RoboWebSim est sous [licence MIT](../../LICENSE).

Les modèles GLB procéduraux peuvent conserver des déclarations CC0 distinctes, documentées dans [public/models/README.md](../../public/models/README.md).

## Projet

RoboSim / RoboWebSim est également utilisé comme module d’apprentissage interactif dans RoboMarket.

- RoboMarket : https://robomarket.ae/
- Joe Nasr : https://joe-nasr-signals.vercel.app/

Créé par Joe Nasr.
