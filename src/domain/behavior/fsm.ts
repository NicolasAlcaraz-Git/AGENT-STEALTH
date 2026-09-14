export const GUARD_STATES = [
  "PATROL",
  "INVESTIGATE",
  "CHASE",
  "SEARCH",
  "RETURN",
  "CAPTURED",
] as const;

export type GuardState = (typeof GUARD_STATES)[number];

export type GuardTransitionEvent =
  | "vision"
  | "sound"
  | "lost-sight"
  | "arrival"
  | "unreachable"
  | "capture"
  | "search-expired";

export interface GuardSituation {
  readonly vision: boolean;
  readonly soundHeard: boolean;
  readonly captureReached: boolean;
  readonly destinationReached: boolean;
  readonly destinationUnreachable: boolean;
  readonly searchExpired: boolean;
  readonly hasMemory: boolean;
}

export interface GuardStep {
  readonly state: GuardState;
  readonly event: GuardTransitionEvent | null;
  readonly cause: string;
}

export function stepGuardState(
  current: GuardState,
  situation: GuardSituation,
): GuardStep {
  switch (current) {
    case "PATROL":
      if (situation.vision) {
        return {
          state: "CHASE",
          event: "vision",
          cause: "El guardia ve al jugador durante la patrulla.",
        };
      }
      if (situation.soundHeard) {
        return {
          state: "INVESTIGATE",
          event: "sound",
          cause: "El guardia oye un sonido sin ver al jugador.",
        };
      }
      return { state: "PATROL", event: null, cause: "" };

    case "INVESTIGATE":
      if (situation.vision) {
        return {
          state: "CHASE",
          event: "vision",
          cause: "El guardia ve al jugador durante la investigación.",
        };
      }
      if (situation.destinationUnreachable || (situation.destinationReached && !situation.hasMemory)) {
        return {
          state: "RETURN",
          event: "unreachable",
          cause: "La última posición conocida es inaccesible o no existe.",
        };
      }
      if (situation.destinationReached && situation.hasMemory) {
        return {
          state: "SEARCH",
          event: "arrival",
          cause: "El guardia llegó a la última posición conocida.",
        };
      }
      return { state: "INVESTIGATE", event: null, cause: "" };

    case "CHASE":
      if (situation.captureReached) {
        return {
          state: "CAPTURED",
          event: "capture",
          cause: "El guardia alcanzó al jugador.",
        };
      }
      if (!situation.vision) {
        return {
          state: "SEARCH",
          event: "lost-sight",
          cause: "El guardia perdió de vista al jugador.",
        };
      }
      return { state: "CHASE", event: null, cause: "" };

    case "SEARCH":
      if (situation.vision) {
        return {
          state: "CHASE",
          event: "vision",
          cause: "El guardia recupera la visión durante la búsqueda.",
        };
      }
      if (situation.searchExpired) {
        return {
          state: "RETURN",
          event: "search-expired",
          cause: "Se agotó el tiempo de búsqueda.",
        };
      }
      return { state: "SEARCH", event: null, cause: "" };

    case "RETURN":
      if (situation.vision) {
        return {
          state: "CHASE",
          event: "vision",
          cause: "El guardia ve al jugador al regresar.",
        };
      }
      if (situation.destinationReached) {
        return {
          state: "PATROL",
          event: "arrival",
          cause: "El guardia llegó a un punto de patrulla válido.",
        };
      }
      return { state: "RETURN", event: null, cause: "" };

    case "CAPTURED":
      return { state: "CAPTURED", event: null, cause: "" };
  }
}