# Lessons Reference

RoboWebSim includes eight guided lessons. They are available from the simulator and from the `/lessons` page.

Lesson progress is stored in browser `localStorage`.

## Lesson 1: Your First Move

Move forward to reach the target.

Completion:
- reach the target

## Lesson 2: Turn and Move

Turn toward the target, then move to it.

Completion:
- reach the target
- turn at least once

## Lesson 3: Navigate Around an Obstacle

Reach the target without hitting an obstacle.

Completion:
- reach the target
- avoid collisions

## Lesson 4: Build and Run a Command Queue

Create a route in the command queue and let the queue finish.

Completion:
- complete the command queue
- reach the target

## Lesson 5: Queue a Turn and Move Route

Build a queued route that combines turns and forward movement.

Completion:
- complete the command queue
- reach the target
- turn at least once

## Lesson 6: Avoid Obstacles Without Hitting Any

Route:

1. Forward ×2
2. Turn Right ×4
3. Forward ×4
4. Turn Left ×4
5. Forward ×5

Completion:
- reach the target
- avoid collisions
- turn at least once

## Lesson 7: Read the Telemetry Sensors

Use front obstacle distance and target distance to guide the robot.

Completion:
- reach the target
- avoid collisions

## Lesson 8: Full Autonomous Program

Build and run the full queued route without stopping it early.

Route:

1. Turn Left ×4
2. Forward ×4
3. Turn Right ×4
4. Forward ×4

Completion:
- complete the command queue
- reach the target
- turn at least once

## Lesson data

Lessons are defined in `src/lessons/lessonData.ts`.

Each lesson can define:
- `id`
- `title`
- `objective`
- `steps`
- `successCondition`
- `hint`
- `startPose`
- `arenaOverrides`
- `completionRules`

Enabled completion rules use AND semantics.

Supported rules:
- `reachTarget`
- `avoidCollision`
- `makeAtLeastOneTurn`
- `completeQueue`
