import { describe, expect, it } from "vitest";
import {
  stepGuardState,
  type GuardSituation,
  type GuardState,
} from "../../src/domain/behavior/fsm";

function situation(overrides: Partial<GuardSituation>): GuardSituation {
  return {
    vision: false,
    soundHeard: false,
    captureReached: false,
    destinationReached: false,
    destinationUnreachable: false,
    searchExpired: false,
    hasMemory: false,
    ...overrides,
  };
}

const terminalCases: GuardState[] = ["PATROL", "INVESTIGATE", "CHASE", "SEARCH", "RETURN"];

describe("guard FSM", () => {
  describe("PATROL", () => {
    it("stays in PATROL without perception and reports no transition", () => {
      expect(stepGuardState("PATROL", situation({}))).toEqual({
        state: "PATROL",
        event: null,
        cause: "",
      });
    });

    it("transitions to CHASE when the guard sees the player", () => {
      expect(stepGuardState("PATROL", situation({ vision: true }))).toMatchObject({
        state: "CHASE",
        event: "vision",
      });
    });

    it("prioritizes vision over sound when both occur", () => {
      expect(stepGuardState("PATROL", situation({ vision: true, soundHeard: true }))).toMatchObject({
        state: "CHASE",
        event: "vision",
      });
    });

    it("transitions to INVESTIGATE on sound without vision", () => {
      expect(stepGuardState("PATROL", situation({ soundHeard: true }))).toMatchObject({
        state: "INVESTIGATE",
        event: "sound",
      });
    });
  });

  describe("INVESTIGATE", () => {
    it("transitions to CHASE when the player is seen", () => {
      expect(stepGuardState("INVESTIGATE", situation({ vision: true }))).toMatchObject({
        state: "CHASE",
        event: "vision",
      });
    });

    it("transitions to SEARCH upon reaching the last known position", () => {
      expect(stepGuardState(
        "INVESTIGATE",
        situation({ destinationReached: true, hasMemory: true }),
      )).toMatchObject({
        state: "SEARCH",
        event: "arrival",
      });
    });

    it("transitions to RETURN when the last known position is unreachable", () => {
      expect(stepGuardState(
        "INVESTIGATE",
        situation({ destinationUnreachable: true }),
      )).toMatchObject({
        state: "RETURN",
        event: "unreachable",
      });
    });

    it("returns to RETURN when arriving without memory", () => {
      expect(stepGuardState(
        "INVESTIGATE",
        situation({ destinationReached: true, hasMemory: false }),
      )).toMatchObject({
        state: "RETURN",
        event: "unreachable",
      });
    });
  });

  describe("CHASE", () => {
    it("transitions to CAPTURED within capture distance", () => {
      expect(stepGuardState("CHASE", situation({ captureReached: true }))).toMatchObject({
        state: "CAPTURED",
        event: "capture",
      });
    });

    it("transitions to SEARCH when sight is lost with a remembered position", () => {
      expect(stepGuardState("CHASE", situation({ hasMemory: true }))).toMatchObject({
        state: "SEARCH",
        event: "lost-sight",
      });
    });

    it("prioritizes capture over losing sight", () => {
      expect(stepGuardState(
        "CHASE",
        situation({ captureReached: true, vision: false }),
      )).toMatchObject({
        state: "CAPTURED",
        event: "capture",
      });
    });

    it("keeps chasing while the player is visible", () => {
      expect(stepGuardState("CHASE", situation({ vision: true }))).toMatchObject({
        state: "CHASE",
        event: null,
      });
    });
  });

  describe("SEARCH", () => {
    it("transitions to CHASE when vision is recovered", () => {
      expect(stepGuardState("SEARCH", situation({ vision: true }))).toMatchObject({
        state: "CHASE",
        event: "vision",
      });
    });

    it("transitions to RETURN when the search time expires", () => {
      expect(stepGuardState("SEARCH", situation({ searchExpired: true }))).toMatchObject({
        state: "RETURN",
        event: "search-expired",
      });
    });

    it("prioritizes recovered vision over expiry", () => {
      expect(stepGuardState(
        "SEARCH",
        situation({ vision: true, searchExpired: true }),
      )).toMatchObject({
        state: "CHASE",
        event: "vision",
      });
    });

    it("keeps searching otherwise", () => {
      expect(stepGuardState("SEARCH", situation({ hasMemory: true }))).toMatchObject({
        state: "SEARCH",
        event: null,
      });
    });
  });

  describe("RETURN", () => {
    it("transitions to CHASE when the player is seen", () => {
      expect(stepGuardState("RETURN", situation({ vision: true }))).toMatchObject({
        state: "CHASE",
        event: "vision",
      });
    });

    it("transitions to PATROL upon reaching a valid patrol point", () => {
      expect(stepGuardState("RETURN", situation({ destinationReached: true }))).toMatchObject({
        state: "PATROL",
        event: "arrival",
      });
    });
  });

  describe("CAPTURED", () => {
    it("is terminal for every situation", () => {
      for (const situationConfig of [
        situation({ vision: true }),
        situation({ soundHeard: true }),
        situation({ captureReached: true }),
        situation({ destinationReached: true }),
        situation({ searchExpired: true }),
        situation({}),
      ]) {
        expect(stepGuardState("CAPTURED", situationConfig)).toEqual({
          state: "CAPTURED",
          event: null,
          cause: "",
        });
      }
    });
  });

  describe("invariants", () => {
    const allStates: GuardState[] = [...terminalCases, "CAPTURED"];

    it("reproduces the same decision for the same situation", () => {
      const sample = situation({ vision: true, soundHeard: true });
      for (const state of allStates) {
        expect(stepGuardState(state, sample)).toEqual(stepGuardState(state, sample));
      }
    });

    it("reports an event exactly when the state changes", () => {
      for (const state of allStates) {
        const step = stepGuardState(state, situation({}));
        expect(step.event !== null).toBe(step.state !== state);
      }
    });
  });
});