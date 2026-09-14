import Phaser from "phaser";
import {
  GUARD_START,
  GRID_HEIGHT,
  GRID_WIDTH,
  LAB_MAP,
  PLAYER_START,
  TILE_SIZE,
} from "../../application/simulation/labLevel";
import {
  initialGuardState,
  updateGuardSimulation,
  type GuardFrame,
  type GuardSimulationState,
} from "../../application/simulation/guardSimulation";
import { cellCenter, isWalkable } from "../../domain/model/grid";
import type { Vector2 } from "../../domain/model/vector";
import { timeSinceLastPerception } from "../../domain/perception/memory";
import type { VisionReason, VisionResult } from "../../domain/perception/perception";

const PLAYER_SPEED = 190;
const GUARD_SPEED = 115;
const VISION_RANGE = 220;
const FIELD_OF_VIEW = Math.PI / 2;
const SOUND_RADIUS = 190;
const SOUND_DURATION_MS = 800;
const VISION_LABELS: Readonly<Record<VisionReason, string>> = {
  visible: "VISIBLE",
  "out-of-range": "FUERA DE RANGO",
  "outside-cone": "FUERA DEL CONO",
  occluded: "OCLUIDO",
  "invalid-facing": "DIRECCION INVALIDA",
};

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private guard!: Phaser.GameObjects.Arc;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveUp!: Phaser.Input.Keyboard.Key;
  private moveDown!: Phaser.Input.Keyboard.Key;
  private moveLeft!: Phaser.Input.Keyboard.Key;
  private moveRight!: Phaser.Input.Keyboard.Key;
  private reset!: Phaser.Input.Keyboard.Key;
  private emitSound!: Phaser.Input.Keyboard.Key;
  private perceptionGraphics!: Phaser.GameObjects.Graphics;
  private routeGraphics!: Phaser.GameObjects.Graphics;
  private lastKnownMarker!: Phaser.GameObjects.Arc;
  private guardHud!: Phaser.GameObjects.Text;
  private guardFacing: Vector2 = { x: -1, y: 0 };
  private guardSim!: GuardSimulationState;

  public constructor() {
    super("GameScene");
  }

  public create(): void {
    this.guardFacing = { x: -1, y: 0 };
    const guardPosition = cellCenter(GUARD_START, TILE_SIZE);
    this.guardSim = initialGuardState(guardPosition, this.guardFacing);
    this.cameras.main.setBackgroundColor("#10161c");
    this.drawGrid();

    const walls = this.physics.add.staticGroup();
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        if (!isWalkable(LAB_MAP, { x, y })) {
          const center = cellCenter({ x, y }, TILE_SIZE);
          const wall = this.add.rectangle(center.x, center.y, TILE_SIZE, TILE_SIZE, 0x27333d);
          wall.setStrokeStyle(1, 0x3a4c58);
          walls.add(wall);
        }
      }
    }

    const spawn = cellCenter(PLAYER_START, TILE_SIZE);
    this.player = this.add.rectangle(spawn.x, spawn.y, 20, 20, 0xe5b454);
    this.player.setStrokeStyle(2, 0xffd98a);
    this.player.setDepth(4);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, walls);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }

    this.cursors = keyboard.createCursorKeys();
    this.moveUp = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.moveDown = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.moveLeft = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.moveRight = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.reset = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.emitSound = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    this.perceptionGraphics = this.add.graphics().setDepth(1);
    this.routeGraphics = this.add.graphics().setDepth(2);
    this.guard = this.add
      .circle(guardPosition.x, guardPosition.y, 11, 0x6b8afd)
      .setStrokeStyle(2, 0xb9c5ff)
      .setDepth(4);
    this.lastKnownMarker = this.add
      .circle(0, 0, 7, 0x000000, 0)
      .setStrokeStyle(2, 0xe16969)
      .setDepth(5)
      .setVisible(false);

    this.add
      .text(16, 14, "H4 / MAQUINA DE ESTADOS", {
        color: "#9eb4c2",
        fontFamily: "monospace",
        fontSize: "14px",
      })
      .setDepth(10);

    this.guardHud = this.add
      .text(GRID_WIDTH * TILE_SIZE - 16, 14, "", {
        align: "right",
        backgroundColor: "#10161ccc",
        color: "#d9e4ea",
        fontFamily: "monospace",
        fontSize: "13px",
        padding: { x: 8, y: 6 },
      })
      .setOrigin(1, 0)
      .setDepth(10);

    this.renderTelemetry();
  }

  public update(time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.reset)) {
      this.scene.restart();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.emitSound)) {
      this.guardSim = {
        ...this.guardSim,
        soundEvent: {
          position: { x: this.player.x, y: this.player.y },
          radius: SOUND_RADIUS,
          emittedAtMs: time,
          durationMs: SOUND_DURATION_MS,
        },
      };
    }

    const horizontal = Number(this.cursors.right.isDown || this.moveRight.isDown)
      - Number(this.cursors.left.isDown || this.moveLeft.isDown);
    const vertical = Number(this.cursors.down.isDown || this.moveDown.isDown)
      - Number(this.cursors.up.isDown || this.moveUp.isDown);
    const velocity = new Phaser.Math.Vector2(horizontal, vertical);

    if (velocity.lengthSq() > 0) {
      velocity.normalize().scale(PLAYER_SPEED);
    }

    this.playerBody.setVelocity(velocity.x, velocity.y);

    const frame = updateGuardSimulation(this.guardSim, {
      map: LAB_MAP,
      tileSize: TILE_SIZE,
      target: { x: this.player.x, y: this.player.y },
      visionRange: VISION_RANGE,
      fieldOfViewRadians: FIELD_OF_VIEW,
      timeMs: time,
      stepMs: delta,
      moveSpeed: GUARD_SPEED,
    });
    this.guardSim = frame.state;
    this.guard.setPosition(frame.state.position.x, frame.state.position.y);
    this.guardFacing = frame.state.facing;

    this.drawRoute(frame.state);
    this.drawPerception(frame.vision);
    this.renderTelemetry(frame);
  }

  private drawGrid(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1b252d, 1);

    for (let x = 0; x <= GRID_WIDTH; x += 1) {
      graphics.lineBetween(x * TILE_SIZE, 0, x * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
    }
    for (let y = 0; y <= GRID_HEIGHT; y += 1) {
      graphics.lineBetween(0, y * TILE_SIZE, GRID_WIDTH * TILE_SIZE, y * TILE_SIZE);
    }
  }

  private drawRoute(state: GuardSimulationState): void {
    this.routeGraphics.clear();
    if (state.waypoints.length < 2) {
      return;
    }

    this.routeGraphics.lineStyle(3, 0x62d0e8, 0.9);
    this.routeGraphics.beginPath();
    const first = state.waypoints[0];
    if (!first) {
      return;
    }
    this.routeGraphics.moveTo(first.x, first.y);
    for (const point of state.waypoints.slice(1)) {
      this.routeGraphics.lineTo(point.x, point.y);
    }
    this.routeGraphics.strokePath();
  }

  private drawPerception(vision: VisionResult): void {
    this.perceptionGraphics.clear();
    const facingAngle = Math.atan2(this.guardFacing.y, this.guardFacing.x);
    const halfFieldOfView = FIELD_OF_VIEW / 2;
    this.perceptionGraphics.fillStyle(vision.visible ? 0x73c991 : 0x6b8afd, 0.16);
    this.perceptionGraphics.beginPath();
    this.perceptionGraphics.moveTo(this.guard.x, this.guard.y);
    this.perceptionGraphics.arc(
      this.guard.x,
      this.guard.y,
      VISION_RANGE,
      facingAngle - halfFieldOfView,
      facingAngle + halfFieldOfView,
    );
    this.perceptionGraphics.closePath();
    this.perceptionGraphics.fillPath();

    if (this.guardSim.soundEvent) {
      this.perceptionGraphics.lineStyle(2, 0xe5b454, 0.8);
      this.perceptionGraphics.strokeCircle(
        this.guardSim.soundEvent.position.x,
        this.guardSim.soundEvent.position.y,
        this.guardSim.soundEvent.radius,
      );
    }

    const lastKnown = this.guardSim.memory.lastKnownPosition;
    this.lastKnownMarker.setVisible(!this.guardSim.captured && lastKnown !== null);
    if (lastKnown) {
      this.lastKnownMarker.setPosition(lastKnown.x, lastKnown.y);
    }
  }

  private renderTelemetry(frame?: GuardFrame): void {
    const state = frame?.state ?? this.guardSim;
    const vision = frame?.vision;
    const transitions = state.telemetry.transitions;
    const last = transitions.length > 0 ? transitions[transitions.length - 1] : undefined;

    const lines: string[] = [
      `estado ${state.fsmState}${state.captured ? " / CAPTURADO" : ""}`,
    ];
    lines.push(last
      ? `${last.previousState} → ${last.newState} (${last.event})`
      : "sin transiciones");
    if (last) {
      lines.push(last.cause);
    }

    if (vision) {
      const age = timeSinceLastPerception(state.memory, this.time.now);
      const memory = age === null
        ? "memoria -"
        : `memoria ${state.memory.source} ${(age / 1000).toFixed(1)}s`;
      const sound = state.soundEvent ? "sonido activo" : "sonido -";
      lines.push(`vision ${VISION_LABELS[vision.reason]}`);
      lines.push(sound);
      lines.push(memory);
    }

    this.guardHud.setText(lines);
  }
}