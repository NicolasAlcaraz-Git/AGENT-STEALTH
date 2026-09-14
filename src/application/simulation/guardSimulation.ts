import type { GridMap, GridPoint } from "../../domain/model/grid";
import { cellCenter, isWalkable, worldToCell } from "../../domain/model/grid";
import { distanceBetween, type Vector2 } from "../../domain/model/vector";
import { findPathAStar, type SearchStatus } from "../../domain/navigation/search";
import { manhattanDistance } from "../../domain/navigation/gridGraph";
import { advanceAlongPath } from "../../domain/navigation/pathFollower";
import {
  emptyPerceptionMemory,
  type PerceptionMemory,
} from "../../domain/perception/memory";
import type { SoundEvent, VisionResult } from "../../domain/perception/perception";
import {
  updatePerceptionSimulation,
} from "./perceptionSimulation";
import {
  stepGuardState,
  type GuardSituation,
  type GuardState,
} from "../../domain/behavior/fsm";
import {
  emptyTelemetryLog,
  recordTransition,
  type TelemetryLog,
} from "../../domain/telemetry/telemetry";

export const PATROL_POINTS: readonly GridPoint[] = [
  { x: 27, y: 17 },
  { x: 28, y: 5 },
  { x: 5, y: 2 },
  { x: 6, y: 17 },
];

export const REPLAN_INTERVAL_MS = 500;
export const SEARCH_DURATION_MS = 3000;
export const SEARCH_RADIUS_CELLS = 3;
export const CAPTURE_DISTANCE_PX = 20;

export interface GuardSimulationState {
  readonly fsmState: GuardState;
  readonly position: Vector2;
  readonly facing: Vector2;
  readonly memory: PerceptionMemory;
  readonly soundEvent: SoundEvent | null;
  readonly waypoints: readonly Vector2[];
  readonly nextWaypoint: number;
  readonly routeStatus: SearchStatus | null;
  readonly destination: GridPoint | null;
  readonly patrolIndex: number;
  readonly searchStartMs: number | null;
  readonly lastReplanMs: number | null;
  readonly sweepGoals: readonly GridPoint[];
  readonly sweepIndex: number;
  readonly unreachableTries: number;
  readonly captured: boolean;
  readonly telemetry: TelemetryLog;
}

export interface GuardFrameInput {
  readonly map: GridMap;
  readonly tileSize: number;
  readonly target: Vector2;
  readonly visionRange: number;
  readonly fieldOfViewRadians: number;
  readonly timeMs: number;
  readonly stepMs: number;
  readonly moveSpeed: number;
}

export interface GuardFrame {
  readonly state: GuardSimulationState;
  readonly vision: VisionResult;
  readonly soundHeard: boolean;
}

export function initialGuardState(position: Vector2, facing: Vector2): GuardSimulationState {
  return {
    fsmState: "PATROL",
    position: { ...position },
    facing: { ...facing },
    memory: emptyPerceptionMemory(),
    soundEvent: null,
    waypoints: [],
    nextWaypoint: 0,
    routeStatus: null,
    destination: null,
    patrolIndex: 0,
    searchStartMs: null,
    lastReplanMs: null,
    sweepGoals: [],
    sweepIndex: 0,
    unreachableTries: 0,
    captured: false,
    telemetry: emptyTelemetryLog(),
  };
}

export function updateGuardSimulation(
  state: GuardSimulationState,
  input: GuardFrameInput,
): GuardFrame {
  if (state.captured) {
    return { state, vision: undefinedVision(), soundHeard: false };
  }

  const moved = moveGuard(state, input);
  const perception = updatePerceptionSimulation(
    { memory: moved.state.memory, soundEvent: moved.state.soundEvent },
    {
      map: input.map,
      tileSize: input.tileSize,
      observer: moved.state.position,
      facing: moved.state.facing,
      target: input.target,
      visionRange: input.visionRange,
      fieldOfViewRadians: input.fieldOfViewRadians,
      timeMs: input.timeMs,
    },
  );

  const situation: GuardSituation = {
    vision: perception.vision.visible,
    soundHeard: perception.soundHeard,
    captureReached: distanceBetween(moved.state.position, input.target) <= CAPTURE_DISTANCE_PX,
    destinationReached: moved.arrived,
    destinationUnreachable: moved.state.routeStatus === "unreachable",
    searchExpired:
      moved.state.fsmState === "SEARCH"
      && moved.state.searchStartMs !== null
      && input.timeMs - moved.state.searchStartMs >= SEARCH_DURATION_MS,
    hasMemory: perception.state.memory.lastKnownPosition !== null,
  };

  let next: GuardSimulationState = {
    ...moved.state,
    memory: perception.state.memory,
    soundEvent: perception.state.soundEvent,
  };

  const decision = stepGuardState(next.fsmState, situation);
  if (decision.event !== null) {
    next = { ...next, fsmState: decision.state, captured: decision.state === "CAPTURED" };

    if (decision.state === "SEARCH") {
      const lastKnown = next.memory.lastKnownPosition;
      next = lastKnown
        ? {
          ...next,
          searchStartMs: input.timeMs,
          sweepGoals: computeSweepCells(
            input.map,
            worldToCell(lastKnown, input.tileSize),
            SEARCH_RADIUS_CELLS,
          ),
          sweepIndex: 0,
        }
        : next;
    }

    next = {
      ...next,
      telemetry: recordTransition(next.telemetry, {
        timeMs: input.timeMs,
        previousState: state.fsmState,
        event: decision.event,
        newState: decision.state,
        cause: decision.cause,
      }),
    };
  }

  if (next.captured) {
    return { state: clearRoute(next), vision: perception.vision, soundHeard: perception.soundHeard };
  }

  next = planBehavior(next, input, situation);
  return { state: next, vision: perception.vision, soundHeard: perception.soundHeard };
}

function undefinedVision(): VisionResult {
  return { visible: false, reason: "invalid-facing", distance: Number.POSITIVE_INFINITY };
}

interface MovedGuard {
  state: GuardSimulationState;
  arrived: boolean;
}

function moveGuard(state: GuardSimulationState, input: GuardFrameInput): MovedGuard {
  if (state.waypoints.length === 0) {
    return { state, arrived: false };
  }
  if (state.nextWaypoint >= state.waypoints.length) {
    return { state, arrived: true };
  }

  const distance = input.moveSpeed * input.stepMs / 1000;
  const movement = advanceAlongPath(
    state.position,
    state.waypoints,
    state.nextWaypoint,
    distance,
  );

  return {
    state: {
      ...state,
      position: movement.position,
      facing: movement.direction ?? state.facing,
      nextWaypoint: movement.nextWaypoint,
    },
    arrived: movement.completed,
  };
}

function planBehavior(
  state: GuardSimulationState,
  input: GuardFrameInput,
  situation: GuardSituation,
): GuardSimulationState {
  let next: GuardSimulationState = { ...state };

  switch (next.fsmState) {
    case "PATROL": {
      const point = patrolPoint(next.patrolIndex);
      if (
        situation.destinationReached
        || sameCell(worldToCell(next.position, input.tileSize), point)
        || next.routeStatus === "unreachable"
      ) {
        next = { ...next, patrolIndex: (next.patrolIndex + 1) % PATROL_POINTS.length };
      }
      const desired = patrolPoint(next.patrolIndex);
      return ensureRoute(next, desired, input, next.routeStatus !== "success");
    }

    case "INVESTIGATE": {
      const lastKnown = next.memory.lastKnownPosition;
      if (!lastKnown) {
        return next;
      }
      const desired = worldToCell(lastKnown, input.tileSize);
      const needsReplan = situation.soundHeard
        || next.routeStatus === "unreachable"
        || !sameCell(desired, next.destination);
      return ensureRoute(next, desired, input, needsReplan);
    }

    case "CHASE": {
      const desired = worldToCell(input.target, input.tileSize);
      const changed = !sameCell(desired, next.destination);
      const intervalElapsed = next.lastReplanMs === null
        || input.timeMs - next.lastReplanMs >= REPLAN_INTERVAL_MS;
      const force = changed || intervalElapsed || next.routeStatus === "unreachable";
      next = planChase(next, input, desired, force);
      return next;
    }

    case "SEARCH":
      return planSearch(next, input);

    case "RETURN": {
      if (situation.destinationReached || next.routeStatus === "unreachable") {
        next = { ...next, patrolIndex: (next.patrolIndex + 1) % PATROL_POINTS.length };
      }
      const desired = patrolPoint(next.patrolIndex);
      return ensureRoute(next, desired, input, next.routeStatus !== "success");
    }

    case "CAPTURED":
      return clearRoute(next);
  }
}

function planChase(
  state: GuardSimulationState,
  input: GuardFrameInput,
  desired: GridPoint,
  force: boolean,
): GuardSimulationState {
  let planned = ensureRoute(state, desired, input, force);
  if (planned.routeStatus !== "success") {
    return planned;
  }

  const lastWaypoint = planned.waypoints[planned.waypoints.length - 1];
  const reachesTarget = lastWaypoint !== undefined
    && distanceBetween(lastWaypoint, input.target) <= Number.EPSILON;
  if (reachesTarget) {
    return planned;
  }

  return {
    ...planned,
    waypoints: [...planned.waypoints, { ...input.target }],
  };
}

function planSearch(state: GuardSimulationState, input: GuardFrameInput): GuardSimulationState {
  if (!state.memory.lastKnownPosition) {
    return state;
  }

  const lkpCell = worldToCell(state.memory.lastKnownPosition, input.tileSize);
  const atLkp = sameCell(worldToCell(state.position, input.tileSize), lkpCell);

  let sweepGoals = state.sweepGoals;
  let sweepIndex = state.sweepIndex;
  if (sweepGoals.length === 0) {
    sweepGoals = computeSweepCells(input.map, lkpCell, SEARCH_RADIUS_CELLS);
    sweepIndex = 0;
  }

  if (!atLkp) {
    const force = state.routeStatus === "unreachable" || !sameCell(lkpCell, state.destination);
    return ensureRoute({ ...state, sweepGoals, sweepIndex }, lkpCell, input, force);
  }

  const routeConsumed = state.routeStatus === "success"
    && state.nextWaypoint >= state.waypoints.length;
  if (routeConsumed && sweepGoals.length > 0) {
    sweepIndex += 1;
  }

  const goal = sweepGoals[sweepIndex];
  if (!goal) {
    return { ...state, sweepGoals, sweepIndex };
  }
  return ensureRoute(
    { ...state, sweepGoals, sweepIndex },
    goal,
    input,
    state.routeStatus !== "success" || !sameCell(goal, state.destination),
  );
}

function ensureRoute(
  state: GuardSimulationState,
  desired: GridPoint,
  input: GuardFrameInput,
  force: boolean,
): GuardSimulationState {
  const sameDestination = sameCell(desired, state.destination);
  const hasActiveRoute = state.waypoints.length > 0 && state.nextWaypoint < state.waypoints.length;

  if (sameDestination && !force && (hasActiveRoute || state.routeStatus === "success")) {
    return state;
  }
  if (sameDestination && state.routeStatus === "unreachable" && !force) {
    return state;
  }
  if (state.unreachableTries >= PATROL_POINTS.length) {
    return clearRoute(state);
  }

  const result = findPathAStar(input.map, worldToCell(state.position, input.tileSize), desired);
  const waypoints = result.status === "success"
    ? result.path.map((point) => cellCenter(point, input.tileSize))
    : [];

  return {
    ...state,
    destination: desired,
    waypoints,
    nextWaypoint: 0,
    routeStatus: result.status,
    lastReplanMs: input.timeMs,
    unreachableTries: result.status === "unreachable" ? state.unreachableTries + 1 : 0,
  };
}

function clearRoute(state: GuardSimulationState): GuardSimulationState {
  return {
    ...state,
    waypoints: [],
    nextWaypoint: 0,
    destination: null,
    routeStatus: null,
    sweepGoals: [],
    sweepIndex: 0,
  };
}

function computeSweepCells(
  map: GridMap,
  center: GridPoint,
  radius: number,
): GridPoint[] {
  const cells: GridPoint[] = [];
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const candidate = { x: center.x + dx, y: center.y + dy };
      if (manhattanDistance(center, candidate) <= radius && isWalkable(map, candidate)) {
        cells.push(candidate);
      }
    }
  }
  cells.sort((left, right) => (
    manhattanDistance(center, left) - manhattanDistance(center, right)
    || left.x - right.x
    || left.y - right.y
  ));
  return cells;
}

function sameCell(left: GridPoint, right: GridPoint | null): boolean {
  return right !== null && left.x === right.x && left.y === right.y;
}

function patrolPoint(index: number): GridPoint {
  const point = PATROL_POINTS[((index % PATROL_POINTS.length) + PATROL_POINTS.length) % PATROL_POINTS.length];
  if (!point) {
    throw new Error("Patrol point invariant failed.");
  }
  return point;
}