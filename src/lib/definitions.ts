import { CANVAS_COLUMNS, CANVAS_ROWS } from "../Definitions/Maps";
import { BasicEnemy } from "../GameObjects/Enemies/BasicEnemy";
import { NormalProjectile } from "../GameObjects/Projectiles/NormalProjectile";

export const DOMAIN = "ckal.dk";
export const BACKEND_URL = `https://api.${DOMAIN}/tower-defense/`;

export const LF_CREDENTIALS = "tower-defense_creds";
export const AWS_CLIENT_ID = "6nki0f24aj9hrvluekbmkea631";

export const TILE_SIZE = 40;
export const CANVAS_WIDTH = CANVAS_COLUMNS * TILE_SIZE;
export const CANVAS_HEIGHT = CANVAS_ROWS * TILE_SIZE;
export const SELL_PERCENTAGE = 0.5;
export const TICK_DURATION = 20;
export const TICK_DURATION_S = TICK_DURATION / 1000;

export interface Point {
  x: number;
  y: number;
}

export enum APIResources {
  Leaderboard = "leaderboard",
  Score = "score",
}

export type EnemyConstructor = typeof BasicEnemy;

export type ActualProjectile = NormalProjectile;

export type TargetingMode = "First" | "Last" | "Closest" | "Random" | "Farthest" | "Weakest" | "Toughest";
export const TargetingModes: TargetingMode[] = [
  "First",
  "Last",
  "Closest",
  "Farthest",
  "Weakest",
  "Toughest",
  "Random",
];

export const experienceThresholdsNormal = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
