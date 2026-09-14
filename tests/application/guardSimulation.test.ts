import { describe, expect, it } from "vitest";
import { createGridMap, cellCenter, worldToCell, type GridPoint } from "../../src/domain/model/grid";
import { LAB_MAP, TILE_SIZE } from "../../src/application/simulation/labLevel";
import {
  CAPTURE_DISTANCE_PX,
  PATROL_POINTS,
  SEARCH_DURATION_MS,
  initialGuardState,
  updateGuardSimulation,
  type GuardFrameInput,
  type GuardSimulationState,
} from "../../src/application/simulation/guardSimulation";

const TILE = 10;
const FAR = { x: -1000, y: -1000 };

function patrolAt(index: number): GridPoint {
  const point = PATROL_POINTS[((index % PATROL_POINTS.length) + PATROL_POINTS.length) % PATROL_POINTS.length];
  if (!point) {
    throw new Error("patrol point invariant failed");
  }
  return point;
}

function input(
  map: GuardFrameInput["map"],
  tileSize: number,
  timeMs: number,
  overrides: Partial<GuardFrameInput> = {},
): GuardFrameInput {
  return {
    map,
    tileSize,
    target: FAR,
    visionRange: 120,
    fieldOfViewRadians: Math.PI / 2,
    timeMs,
    stepMs: 16,
    moveSpeed: 115,
    ...overrides,
  };
}

function arrivedAt(state: GuardSimulationState, position: { x: number; y: number }, tile: number): GuardSimulationState {
  return {
    ...state,
    position: { ...position },
    waypoints: [{ ...position }],
    nextWaypoint: 1,
    routeStatus: "success",
    destination: worldToCell(position, tile),
  };
}

const transitionsOf = (state: GuardSimulationState) => state.telemetry.transitions;

describe("guard simulation", () => {
  describe("patrol cycle", () => {
    it("advances through the patrol cycle with valid routes and no transition", () => {
      const map = LAB_MAP;
      const start = initialGuardState(cellCenter(patrolAt(0), TILE_SIZE), { x: 1, y: 0 });
      let frame = updateGuardSimulation(start, input(map, TILE_SIZE, 0));

      expect(frame.state.destination).toEqual(patrolAt(1));
      expect(frame.state.routeStatus).toBe("success");

      let state = frame.state;
      const journey = [patrolAt(1), patrolAt(2), patrolAt(3), patrolAt(0), patrolAt(1)];
      for (const point of journey) {
        state = arrivedAt(state, cellCenter(point, TILE_SIZE), TILE_SIZE);
        frame = updateGuardSimulation(state, input(map, TILE_SIZE, 100));
        const index = PATROL_POINTS.indexOf(point);
        expect(frame.state.fsmState).toBe("PATROL");
        expect(frame.state.destination).toEqual(patrolAt(index + 1));
        expect(frame.state.telemetry.transitions).toHaveLength(0);
        state = frame.state;
      }
      expect(state.telemetry.transitions).toHaveLength(0);
    });
  });

  describe("investigate", () => {
    it("moves to the last known position after hearing a sound", () => {
      const map = createGridMap(20, 20, []);
      const state: GuardSimulationState = {
        ...initialGuardState({ x: 95, y: 55 }, { x: 0, y: 1 }),
        soundEvent: {
          position: { x: 155, y: 55 },
          radius: 100,
          emittedAtMs: 100,
          durationMs: 100,
        },
      };

      const frame = updateGuardSimulation(state, input(map, TILE, 150, { target: FAR }));
      const history = transitionsOf(frame.state);

      expect(frame.state.fsmState).toBe("INVESTIGATE");
      expect(history).toEqual([
        expect.objectContaining({ event: "sound", previousState: "PATROL", newState: "INVESTIGATE" }),
      ]);
      expect(history[0]?.cause.length).toBeGreaterThan(0);
      expect(frame.state.destination).toEqual(worldToCell({ x: 155, y: 55 }, TILE));
    });

    it("returns to patrol path when the last known position became unreachable", () => {
      const map = createGridMap(3, 3, [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }]);
      const state: GuardSimulationState = {
        ...initialGuardState({ x: 5, y: 15 }, { x: 1, y: 0 }),
        soundEvent: {
          position: { x: 25, y: 15 },
          radius: 20,
          emittedAtMs: 0,
          durationMs: 200,
        },
      };

      const first = updateGuardSimulation(state, input(map, TILE, 100));
      expect(first.state).toMatchObject({ fsmState: "INVESTIGATE", routeStatus: "unreachable" });

      const second = updateGuardSimulation(first.state, input(map, TILE, 116));
      const history = transitionsOf(second.state);

      expect(second.state.fsmState).toBe("RETURN");
      expect(history.at(-1)).toEqual(expect.objectContaining({
        event: "unreachable",
        previousState: "INVESTIGATE",
        newState: "RETURN",
      }));
    });
  });

  describe("chase and capture", () => {
    it("captures the player at capture distance and becomes terminal", () => {
      const map = createGridMap(20, 20, []);
      const guard = initialGuardState({ x: 15, y: 15 }, { x: 1, y: 0 });
      const target = { x: 15 + CAPTURE_DISTANCE_PX, y: 15 };

      const entering = updateGuardSimulation(guard, input(map, TILE, 0, { target }));
      expect(entering.state.fsmState).toBe("CHASE");
      expect(transitionsOf(entering.state).at(-1)).toEqual(expect.objectContaining({
        event: "vision",
        newState: "CHASE",
      }));

      const captured = updateGuardSimulation(entering.state, input(map, TILE, 16, { target }));
      expect(captured.state).toMatchObject({ fsmState: "CAPTURED", captured: true });
      expect(transitionsOf(captured.state).at(-1)).toEqual(expect.objectContaining({
        event: "capture",
        previousState: "CHASE",
        newState: "CAPTURED",
      }));

      const later = updateGuardSimulation(captured.state, input(map, TILE, 1000, { target }));
      expect(later.state.position).toEqual(captured.state.position);
      expect(later.state).toEqual(captured.state);
    });

    it("replans only when the goal changes or the interval elapses", () => {
      const map = createGridMap(20, 20, []);
      const guard = initialGuardState({ x: 15, y: 15 }, { x: 1, y: 0 });
      const target = { x: 75, y: 15 };

      const frame1 = updateGuardSimulation(guard, input(map, TILE, 100, { target }));
      expect(frame1.state.fsmState).toBe("CHASE");
      expect(frame1.state.lastReplanMs).toBe(100);

      const sameCell = updateGuardSimulation(
        frame1.state,
        input(map, TILE, 400, { target: { x: 79, y: 18 } }),
      );
      expect(sameCell.state.destination).toEqual({ x: 7, y: 1 });
      expect(sameCell.state.lastReplanMs).toBe(100);

      const intervalPassed = updateGuardSimulation(
        sameCell.state,
        input(map, TILE, 600, { target: { x: 79, y: 18 } }),
      );
      expect(intervalPassed.state.lastReplanMs).toBeGreaterThanOrEqual(600);

      const movedGoal = updateGuardSimulation(
        frame1.state,
        input(map, TILE, 200, { target: { x: 95, y: 15 } }),
      );
      expect(movedGoal.state.destination).toEqual({ x: 9, y: 1 });
      expect(movedGoal.state.lastReplanMs).toBe(200);
    });
  });

  describe("search", () => {
    it("drops the route to the live player and targets the last seen position", () => {
      const map = createGridMap(20, 20, []);
      const seen = { x: 75, y: 15 };
      const guard = initialGuardState({ x: 15, y: 15 }, { x: 1, y: 0 });

      const chasing = updateGuardSimulation(guard, input(map, TILE, 100, { target: seen }));
      expect(chasing.state.fsmState).toBe("CHASE");

      const lost = updateGuardSimulation(
        chasing.state,
        input(map, TILE, 200, { target: { x: 195, y: 15 } }),
      );
      expect(lost.state.fsmState).toBe("SEARCH");
      expect(transitionsOf(lost.state).at(-1)).toEqual(expect.objectContaining({
        event: "lost-sight",
        previousState: "CHASE",
        newState: "SEARCH",
      }));
      expect(lost.state.destination).toEqual(worldToCell(seen, TILE));
      expect(lost.state.destination).not.toEqual({ x: 19, y: 1 });
    });

    it("replans from the current position when the stored destination differs from the last known position", () => {
      const map = createGridMap(20, 20, []);
      const seen = { x: 75, y: 15 };
      const state: GuardSimulationState = {
        ...initialGuardState({ x: 25, y: 15 }, { x: 1, y: 0 }),
        fsmState: "CHASE",
        memory: {
          lastKnownPosition: { ...seen },
          lastPerceivedAtMs: 100,
          source: "vision",
        },
        destination: { x: 4, y: 2 },
        waypoints: [{ x: 45, y: 15 }],
        nextWaypoint: 0,
        routeStatus: "success",
        lastReplanMs: 100,
      };

      const lost = updateGuardSimulation(state, input(map, TILE, 200, { target: { x: 195, y: 15 } }));

      expect(lost.state.fsmState).toBe("SEARCH");
      expect(lost.state.destination).toEqual(worldToCell(seen, TILE));
      expect(lost.state.nextWaypoint).toBe(0);
      expect(lost.state.waypoints[0]).toEqual({ x: 25, y: 15 });
    });

    it("sweeps cells near the last known position once reached", () => {
      const map = LAB_MAP;
      const lkp = cellCenter({ x: 10, y: 12 }, TILE_SIZE);
      const state: GuardSimulationState = {
        ...initialGuardState(lkp, { x: 1, y: 0 }),
        fsmState: "SEARCH",
        memory: { lastKnownPosition: { ...lkp }, lastPerceivedAtMs: 100, source: "vision" },
        searchStartMs: 0,
      };

      const frame = updateGuardSimulation(state, input(map, TILE_SIZE, 100));
      expect(frame.state.sweepGoals.length).toBeGreaterThan(0);
      expect(frame.state.destination).toEqual(frame.state.sweepGoals[0]);
      expect(frame.state.fsmState).toBe("SEARCH");
    });

    it("returns to patrol after the search time expires", () => {
      const map = LAB_MAP;
      const lkp = cellCenter({ x: 10, y: 12 }, TILE_SIZE);
      const expired: GuardSimulationState = {
        ...initialGuardState(lkp, { x: 1, y: 0 }),
        fsmState: "SEARCH",
        memory: { lastKnownPosition: { ...lkp }, lastPerceivedAtMs: 0, source: "vision" },
        searchStartMs: 0,
        sweepGoals: [],
        sweepIndex: 0,
      };

      const returning = updateGuardSimulation(
        expired,
        input(map, TILE_SIZE, SEARCH_DURATION_MS),
      );
      expect(returning.state.fsmState).toBe("RETURN");
      expect(transitionsOf(returning.state).at(-1)).toEqual(expect.objectContaining({
        event: "search-expired",
        previousState: "SEARCH",
        newState: "RETURN",
      }));
      expect(returning.state.destination).toBeTruthy();
    });
  });

  describe("full journey (CR-08)", () => {
    it("walks PATROL → CHASE → SEARCH → RETURN → PATROL with telemetry", () => {
      const map = LAB_MAP;
      const targetingVisible = () => ({ x: 700, y: 560 });
      const guard = initialGuardState(cellCenter(patrolAt(0), TILE_SIZE), { x: -1, y: 0 });

      const chase = updateGuardSimulation(guard, input(map, TILE_SIZE, 100, { target: targetingVisible(), visionRange: 220 }));
      expect(chase.state.fsmState).toBe("CHASE");

      const search = updateGuardSimulation(
        chase.state,
        input(map, TILE_SIZE, 200, { target: { x: 5000, y: 5000 } }),
      );
      expect(search.state.fsmState).toBe("SEARCH");

      const searchReturn: GuardSimulationState = {
        ...search.state,
        searchStartMs: 200,
        sweepGoals: [],
        sweepIndex: 0,
        waypoints: [],
        nextWaypoint: 0,
        destination: null,
        routeStatus: null,
      };
      const returning = updateGuardSimulation(
        searchReturn,
        input(map, TILE_SIZE, 200 + SEARCH_DURATION_MS),
      );
      expect(returning.state.fsmState).toBe("RETURN");
      expect(returning.state.destination).toEqual(
        patrolAt(returning.state.patrolIndex),
      );

      const arriving = arrivedAt(
        returning.state,
        cellCenter(patrolAt(returning.state.patrolIndex), TILE_SIZE),
        TILE_SIZE,
      );
      const patrolAgain = updateGuardSimulation(arriving, input(map, TILE_SIZE, 2500 + SEARCH_DURATION_MS));
      expect(patrolAgain.state.fsmState).toBe("PATROL");

      const events = transitionsOf(patrolAgain.state).map((transition) => transition.event);
      expect(events).toEqual(["vision", "lost-sight", "search-expired", "arrival"]);
    });
  });
});