import type { GuardState, GuardTransitionEvent } from "../behavior/fsm";

export interface GuardTransition {
  readonly timeMs: number;
  readonly previousState: GuardState;
  readonly event: GuardTransitionEvent;
  readonly newState: GuardState;
  readonly cause: string;
}

export interface TelemetryLog {
  readonly transitions: readonly GuardTransition[];
}

export function emptyTelemetryLog(): TelemetryLog {
  return { transitions: [] };
}

export function recordTransition(
  log: TelemetryLog,
  transition: GuardTransition,
): TelemetryLog {
  return { transitions: [...log.transitions, transition] };
}