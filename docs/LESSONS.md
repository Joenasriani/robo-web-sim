# Lessons Reference

## Overview

RoboWebSim includes 3 beginner lessons that teach robot navigation fundamentals. Lessons are accessible via:
- The **left sidebar** on the `/simulator` page
- The standalone `/lessons` page

Lesson completion state is stored in `localStorage` (key: `robo-web-sim-completed-lessons`).

---

## Lesson 1: Move Forward to a Target

**Objective**: Move the robot forward until it reaches the green target marker.

**Steps**:
1. Press the **Forward** button or `↑` arrow key to move the robot
2. Keep pressing Forward until the robot reaches the green circle
3. Watch the status bar — it will tell you when you reach the target

**Success condition**: Robot reaches the green target marker

**Hint**: The target is ahead and to the right. Move forward several steps then turn right.

---

## Lesson 2: Turn and Reach a Target

**Objective**: Use turning controls to orient the robot, then move it to the target.

**Steps**:
1. Press **Turn Right** or **Turn Left** to rotate the robot
2. Face the robot toward the green target marker
3. Press **Forward** to drive toward the target

**Success condition**: Robot reaches the target after making at least one turn

**Hint**: Try turning right first, then move forward several steps.

---

## Lesson 3: Avoid an Obstacle and Reach a Goal

**Objective**: Navigate around the red obstacles and reach the green target.

**Steps**:
1. Move forward carefully. Red boxes are obstacles — hitting them counts as a collision
2. When an obstacle is in your path, turn left or right to go around it
3. After clearing the obstacle, straighten your path and head for the target

**Success condition**: Robot reaches the target without hitting any obstacles

**Hint**: Try moving forward a couple steps, turning left to go around the red box, then turning right and heading for the target.

---

## Completion Mechanics

- When the robot's position overlaps a target (within `target.radius + 0.3` units), `robot.health` becomes `'reached_target'`
- This causes the robot to turn **green** in the 3D view and shows "🎯 Target reached!" in the status bar
- On the lessons sidebar and `/lessons` page, a **"Mark as Complete"** button appears while `health === 'reached_target'`
- Clicking it stores the lesson ID in `completedLessons` and persists to localStorage
- A **Reset progress** button on `/lessons` clears all saved progress

## Adding New Lessons

1. Add a new entry to the `LESSONS` array in `src/lessons/lessonData.ts`
2. Each lesson needs: `id`, `title`, `objective`, `steps[]`, `successCondition`, `hint`
3. No changes needed elsewhere — the sidebar and lessons page render all lessons dynamically
